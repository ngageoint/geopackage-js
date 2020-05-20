import {
  GeoPackage,
  GeoPackageAPI,
  ContentsDao,
  TileMatrixSet,
  TileMatrix,
  BoundingBox,
  TileBoundingBoxUtils,
} from '@ngageoint/geopackage';
import fs from 'fs';
import path from 'path';
import bbox from '@turf/bbox';

export interface MBTilesConverterOptions {
  append?: boolean;
  geoPackage?: string;
  mbtiles?: string;
  readonly?: boolean;
  keepOriginalTables?: boolean;
}

export class MBTilesToGeoPackage {
  constructor(private options?: MBTilesConverterOptions) {}

  async addLayer(options?: MBTilesConverterOptions, progressCallback?: Function): Promise<any> {
    const clonedOptions = { ...this.options, ...options };
    clonedOptions.append = true;

    return this.setupConversion(clonedOptions, progressCallback);
  }

  async convert(options?: MBTilesConverterOptions, progressCallback?: Function): Promise<GeoPackage> {
    const clonedOptions = { ...this.options, ...options };
    clonedOptions.append = false;
    return this.setupConversion(clonedOptions, progressCallback);
  }

  async extract(geopackage: GeoPackage, tableName: string): Promise<any> {
    const geoJson = {
      type: 'FeatureCollection',
      features: [],
    };
    const iterator = geopackage.iterateGeoJSONFeatures(tableName);
    for (const feature of iterator) {
      geoJson.features.push(feature);
    }
    return Promise.resolve(geoJson);
  }

  async setupConversion(options: MBTilesConverterOptions, progressCallback?: Function): Promise<GeoPackage> {
    const geoPackage = await this.openMBTilesAsGeoPackage(options.mbtiles, options.geoPackage);
    console.log('geoPackage', geoPackage);

    let minZoom = 0;
    let maxZoom = 0;
    const name = 'tiles_gpkg';
    const bb = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
    const mbtilesMetadata = geoPackage.database.adapter.all('SELECT * FROM metadata');
    mbtilesMetadata.forEach(metadata => {
      switch (metadata.name) {
        case 'minzoom':
          minZoom = metadata.value;
          break;
        case 'maxzoom':
          maxZoom = metadata.value;
          break;
        case 'bounds':
          break;
      }
    });
    console.log('mbtilesMetadata', mbtilesMetadata);

    geoPackage.createRequiredTables();

    const contents = geoPackage.contentsDao.createObject();
    contents.table_name = name;
    contents.data_type = ContentsDao.GPKG_CDT_TILES_NAME;
    contents.identifier = name;
    contents.last_change = new Date().toISOString();
    contents.min_x = bb.minLongitude;
    contents.min_y = bb.minLatitude;
    contents.max_x = bb.maxLongitude;
    contents.max_y = bb.maxLatitude;
    contents.srs_id = 3857;
    const tileMatrixSet = new TileMatrixSet();
    tileMatrixSet.contents = contents;
    tileMatrixSet.srs_id = 3857;
    tileMatrixSet.min_x = bb.minLongitude;
    tileMatrixSet.min_y = bb.minLatitude;
    tileMatrixSet.max_x = bb.maxLongitude;
    tileMatrixSet.max_y = bb.maxLatitude;
    await geoPackage.createTileMatrixSetTable();
    await geoPackage.createTileMatrixTable();
    // this.createTileTable(tileTable);
    geoPackage.contentsDao.create(contents);
    geoPackage.tileMatrixSetDao.create(tileMatrixSet);

    const tileSize = 256;
    const tileMatrixDao = geoPackage.tileMatrixDao;
    for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
      const box = TileBoundingBoxUtils.webMercatorTileBox(bb, zoom);
      const matrixWidth = box.maxLongitude - box.minLongitude + 1;
      const matrixHeight = box.maxLatitude - box.minLatitude + 1;
      const pixelXSize = (bb.maxLongitude - bb.minLongitude) / matrixWidth / tileSize;
      const pixelYSize = (bb.maxLatitude - bb.minLatitude) / matrixHeight / tileSize;
      const tileMatrix = new TileMatrix();
      tileMatrix.table_name = tileMatrixSet.table_name;
      tileMatrix.zoom_level = zoom;
      tileMatrix.matrix_width = matrixWidth;
      tileMatrix.matrix_height = matrixHeight;
      tileMatrix.tile_width = tileSize;
      tileMatrix.tile_height = tileSize;
      tileMatrix.pixel_x_size = pixelXSize;
      tileMatrix.pixel_y_size = pixelYSize;
      tileMatrixDao.create(tileMatrix);
    }

    // if readonly, we can simply create views that map mbtiles rows to geopackage rows
    // This could be enhanced in the future to use view triggers, however if the mbtiles file already used a view for the tiles table
    // we would need to be cognizant of where the real data came from
    console.log('options.readonly?', options.readonly);
    if (options.readonly) {
      const rowMapCreateTable = `CREATE TABLE gpkg_tms_row_map (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        zoom_level INTEGER,
        tile_column INTEGER,
        tile_row INTEGER,
        tms_tile_row INTEGER
      )`;

      const insertRowMapRows = `INSERT INTO gpkg_tms_row_map(zoom_level, tile_column, tile_row, tms_tile_row)
        SELECT
        tiles.zoom_level AS zoom_level,
        tiles.tile_column AS tile_column,
        tm.matrix_height - 1 - tiles.tile_row as tile_row,
        tiles.tile_row AS tms_tile_row
        FROM tiles JOIN
        gpkg_tile_matrix tm ON tiles.zoom_level = tm.zoom_level AND tm.table_name = '${name}'`;

      const tileGpkgView = `CREATE VIEW ${name} AS
      SELECT
      gpkg_tms_row_map.id AS id,
      gpkg_tms_row_map.zoom_level AS zoom_level,
      gpkg_tms_row_map.tile_column AS tile_column,
      gpkg_tms_row_map.tile_row as tile_row,
      t.tile_data AS tile_data
      FROM gpkg_tms_row_map JOIN
      tiles t ON gpkg_tms_row_map.zoom_level = t.zoom_level 
      AND gpkg_tms_row_map.tms_tile_row = t.tile_row 
      AND gpkg_tms_row_map.tile_column = t.tile_column `;

      const db = geoPackage.database.adapter;
      const rowCreateResult = db.run(rowMapCreateTable);
      const insertRowMapResult = db.run(insertRowMapRows);
      const tileGpkgViewResult = db.run(tileGpkgView);
      console.log('row create result', rowCreateResult);
      console.log('insert row map result', insertRowMapResult);
      console.log('tilegpkgviewresult', tileGpkgViewResult);
    } else {
      // if we want to create a non-readonly geopackage, the safest thing to do is to rewrite the data into geopackage tables

      // If we do not want to keep the original tables, in order to not duplicate data they can be deleted here
      if (options.keepOriginalTables) {
      }
    }

    return geoPackage;
  }

  async openMBTilesAsGeoPackage(mbtiles: string, geoPackage: string): Promise<GeoPackage> {
    fs.copyFileSync(mbtiles, geoPackage);
    return GeoPackageAPI.open(geoPackage);
  }

  async createOrOpenGeoPackage(
    geopackage: GeoPackage | string,
    options: MBTilesConverterOptions,
    progressCallback?: Function,
  ): Promise<GeoPackage> {
    if (typeof geopackage === 'object') {
      if (progressCallback) await progressCallback({ status: 'Opening GeoPackage' });
      return geopackage;
    } else {
      let stats;
      try {
        stats = fs.statSync(geopackage);
      } catch (e) {}
      if (stats && !options.append) {
        console.log('GeoPackage file already exists, refusing to overwrite ' + geopackage);
        throw new Error('GeoPackage file already exists, refusing to overwrite ' + geopackage);
      } else if (stats) {
        console.log('open geopackage');
        return GeoPackageAPI.open(geopackage);
      }
      if (progressCallback) await progressCallback({ status: 'Creating GeoPackage' });
      console.log('Create new geopackage', geopackage);
      return GeoPackageAPI.create(geopackage);
    }
  }
}

// var GeoPackage = require('@ngageoint/geopackage')
//   , TileBoundingBoxUtils = require('@ngageoint/geopackage/lib/tiles/tileBoundingBoxUtils')
//   , BoundingBox = require('@ngageoint/geopackage/lib/boundingBox')
//   , PBFToGeoPackage = require('@ngageoint/pbf-to-geopackage');

// var fs = require('fs')
//   , async = require('async')
//   , path = require('path')
//   , MBTiles = require('mbtiles')
//   , JSZip = require('jszip')
//   , Buffer = require('buffer').Buffer
//   , pako = require('pako');

// module.exports.addLayer = function(options, progressCallback, doneCallback) {
//   doneCallback = arguments[arguments.length - 1];
//   progressCallback = typeof arguments[arguments.length - 2] === 'function' ? arguments[arguments.length - 2] : undefined;

//   options.append = true;

//   setupConversion(options, progressCallback, doneCallback);
// };

// module.exports.convert = function(options, progressCallback, doneCallback) {
//   doneCallback = arguments[arguments.length - 1];
//   progressCallback = typeof arguments[arguments.length - 2] === 'function' ? arguments[arguments.length - 2] : undefined;

//   options.append = false;

//   setupConversion(options, progressCallback, doneCallback);
// };

// module.exports.extract = function(geopackage, tableName, callback) {
//   async.waterfall([
//     function(callback) {
//       if (typeof geopackage === 'object') {
//         callback(null, geopackage);
//       } else {
//         console.log('opening ' + geopackage);
//         GeoPackage.openGeoPackage(geopackage, callback);
//       }
//     }, function(geopackage, callback) {
//       if (!tableName) {
//         geopackage.getTileTables(function(err, tables) {
//           callback(null, geopackage, tables);
//         });
//       } else if (!(tableName instanceof Array)) {
//         callback(null, geopackage, [tableName]);
//       } else {
//         callback(null, geopackage, tableName);
//       }
//     }, function(geopackage, tables, callback) {
//       createResult(geopackage, tables, callback);
//     }
//   ], callback);
// };

// function createResult(geopackage, tables, resultCreated) {
//   var mbtilesArray = [];
//   async.eachSeries(tables, function(name, tableDone) {
//     console.log('creating mbtiles for ' + name);
//     createMBTiles(geopackage, name, function(err, mbtiles) {
//       console.log('created mbtiles for ' + name);
//       mbtilesArray.push(mbtiles);
//       tableDone();
//     });
//   }, function(err) {
//     // add all the files in the array here, or just return the mbtiles file if there was only one
//     if (mbtilesArray.length === 1) {
//       mbtilesArray[0]._db.export(resultCreated);
//     } else {
//       var zip = new JSZip();
//       async.eachSeries(mbtilesArray, function(mbtiles, done) {
//         mbtiles._db.export(function(err, file) {
//           console.log('zipping');
//           zip.file(path.basename(mbtiles.filename), file);
//           console.log('zipped');
//           try {
//             if (typeof(process) !== 'undefined' && process.version) {
//               fs.unlinkSync(mbtiles.filename);
//             }
//           } catch (e) {}
//           done();
//         });
//       }, function() {
//         console.log('all files zipped');
//         zip.generateAsync({type: 'nodebuffer', compression: 'DEFLATE'}).then(function(content) {
//           console.log('content generated');
//           resultCreated(null, content, {extension: 'zip'});
//         });
//       });
//     }
//   });
// }

// function createMBTiles(geopackage, table, done) {
//   console.log('filename ' + __dirname + '/'+table+'.mbtiles');
//   new MBTiles(__dirname + '/'+table+'.mbtiles', function(err, mbtiles) {
//     if (err) throw err;

//     mbtiles.startWriting(function(err) {
//         if (err) throw err;
//         async.waterfall([
//           function(callback) {
//             geopackage.getTileDaoWithTableName(table, callback);
//           }, function(tileDao, callback) {
//             var boundingBox = tileDao.getBoundingBox();
//             boundingBox = boundingBox.projectBoundingBox(tileDao.projection, 'EPSG:3857');
//             callback(null, tileDao, boundingBox);
//           }, function(tileDao, boundingBox, tilesComplete) {
//             var zoom = tileDao.minZoom;

//             async.whilst(function() {
//               return zoom <= tileDao.maxZoom;
//             },
//             function(zoomDone) {

//               var tileBox = TileBoundingBoxUtils.webMercatorTileBox(boundingBox, zoom);
//               var xTile = tileBox.minX;
//               var yTile = tileBox.minY;

//               async.whilst(function() {
//                 return xTile <= tileBox.maxX;
//               },
//               function(yDone) {
//                 async.whilst(function() {
//                   return yTile <= tileBox.maxY;
//                 }, function(tileDone) {
//                   console.log('getting tile zoom: %d, x: %d, y: %d', zoom, xTile, yTile);
//                   GeoPackage.getTileFromXYZ(geopackage, table, xTile, yTile, zoom, 256, 256, function(err, tile) {
//                     // add the tile to the mbtiles file
//                     mbtiles.putTile(zoom, xTile, yTile, tile, function(err) {
//                         if (err) return tileDone(err);
//                         yTile++;
//                         tileDone();
//                     });
//                   });
//                 }, function() {
//                   xTile++;
//                   yTile = tileBox.minY;
//                   yDone();
//                 });
//               },
//               function() {
//                 zoom++;
//                 zoomDone();
//               });
//             }, function() {
//               mbtiles.getInfo(function(err, info) {
//                 mbtiles.putInfo(info, function(err, data) {
//                   mbtiles.stopWriting(function(err) {
//                     tilesComplete();
//                   });
//                 });
//               });
//             });
//           }
//         ], function(err) {
//           done(err, mbtiles);
//         });
//     });
//   });
// }

// function setupConversion(options, progressCallback, doneCallback) {
//   if (!progressCallback) {
//     progressCallback = function(status, cb) {
//       cb();
//     }
//   }

//   var geopackage = options.geopackage;

//   var reader;
//   var features = [];

//   async.waterfall([
//     // create or open the geopackage
//     function(callback) {
//       if (typeof geopackage === 'object') {
//         return progressCallback({status: 'Opening GeoPackage'}, function() {
//           callback(null, geopackage);
//         });
//       }

//       try {
//         var stats = fs.statSync(geopackage);
//         if (!options.append) {
//           console.log('GeoPackage file already exists, refusing to overwrite ' + geopackage);
//           return callback(new Error('GeoPackage file already exists, refusing to overwrite ' + geopackage));
//         } else {
//           return GeoPackage.openGeoPackage(geopackage, callback);
//         }
//       } catch (e) {}
//       return progressCallback({status: 'Creating GeoPackage'}, function() {
//         GeoPackage.createGeoPackage(geopackage, callback);
//       });
//     },
//     function(geopackage, callback) {
//       var filename;
//       if (typeof options.mbtiles === 'string') {
//         filename = path.basename(options.mbtiles, path.extname(options.mbtiles));
//       }

//       new MBTiles(options.mbtiles || new Buffer(options.mbtilesData), function(err, mbtiles) {
//         callback(err, geopackage, mbtiles, filename);
//       });
//     },
//     function(geopackage, mbtiles, filename, callback) {
//       mbtiles.getInfo(function(err, info) {
//         console.log('info', info);
//         info.filename = filename;
//         callback(err, geopackage, mbtiles, info);
//       });
//     },
//     // figure out the table name to put the data into
//     function(geopackage, mbtiles, info, callback) {
//       // is this a mbtiles file with pbf tiles?
//       if (info.format === 'pbf') {
//         handlePbfMBTiles(geopackage, mbtiles, info, progressCallback, callback);
//       } else {
//         handleImageryMBTiles(geopackage, mbtiles, info, progressCallback, callback);
//       }
//     }
//   ], function done(err, geopackage) {
//     doneCallback(err, geopackage);
//   });
// };

// function handlePbfMBTiles(geopackage, mbtiles, info, progressCallback, done) {
//   async.waterfall([
//     // figure out the table name to put the data into
//     function(callback) {
//       var name = info.filename || 'features';

//       var stream = mbtiles.createZXYStream({batch:10});
//       var output = '';
//       var count = 0;

//       stream.on('data', function(lines) {
//           output += lines;
//       });
//       stream.on('end', function() {
//           var queue = output.toString().split('\n');
//           var fivePercent = Math.floor(queue.length / 20);

//           async.eachSeries(queue, function(zxy, tileDone) {
//             async.setImmediate(function() {
//               if (zxy === '') return tileDone();
//               zxy = zxy.split('/');
//               if (count++ % fivePercent === 0) {

//                 progressCallback({
//                   status: 'Inserting tiles into geopackage.',
//                   completed: count,
//                   total: queue.length
//                 }, function() {
//                   if (Number(zxy[0]) === Number(info.maxzoom)) {
//                     getAndSavePbfTile(mbtiles, Number(zxy[0]), Number(zxy[1]), Number(zxy[2]), geopackage, progressCallback, tileDone);
//                   } else {
//                     tileDone();
//                   }
//                 });
//               } else {
//                 if (Number(zxy[0]) === Number(info.maxzoom)) {
//                   getAndSavePbfTile(mbtiles, Number(zxy[0]), Number(zxy[1]), Number(zxy[2]), geopackage, progressCallback, tileDone);
//                 } else {
//                   tileDone();
//                 }
//               }
//             });
//           }, function() {
//             callback(null, geopackage);
//           });
//       });
//     }
//   ], done);
// }

// function getAndSavePbfTile(mbtiles, zoom, x, y, geopackage, progressCallback, callback) {
//   console.log('getting the tile %s, %s, %s', zoom, x, y);
//   mbtiles.getTile(zoom, x, y, function(err, buffer, headers) {
//     console.log('saving the tile %s, %s, %s', zoom, x, y);
//     try {
//       var unzipped = pako.ungzip(buffer);

//       PBFToGeoPackage.convert({
//         pbf: unzipped,
//         geopackage: geopackage,
//         x: x,
//         y: y,
//         zoom: zoom
//       },
//       progressCallback,
//       function(err, gp) {
//         gp.getFeatureTables(function(err, tables) {
//           callback(err, geopackage);
//         });
//       });
//     } catch (err) {
//       console.log(err);
//     }
//   });
// }

// function handleImageryMBTiles(geopackage, mbtiles, info, progressCallback, done) {
//   console.log('info', info);
//   async.waterfall([
//     // figure out the table name to put the data into
//     function(callback) {
//       var name = info.filename || 'tiles';
//       geopackage.getTileTables(function(err, tables) {
//         var count = 1;
//         while(tables.indexOf(name) !== -1) {
//           name = name + '_' + count;
//           count++;
//         }
//         callback(null, geopackage, name, mbtiles, info);
//       });
//     },
//     function(geopackage, tableName, mbtiles, info, callback) {
//       var boundingBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
//       var minZoom = info.minzoom;
//       var maxZoom = info.maxzoom;
//       var boundingBoxSrsId = 3857;

//       progressCallback({status: 'Creating table "' + tableName + '"'}, function() {
//         GeoPackage.createStandardWebMercatorTileTable(geopackage, tableName, boundingBox, boundingBoxSrsId, boundingBox, boundingBoxSrsId, minZoom, maxZoom, function(err, tileMatrixSet) {
//           callback(err, geopackage, tableName, mbtiles, tileMatrixSet);
//         });
//       });
//     },
//     function(geopackage, tableName, mbtiles, tileMatrixSet, callback) {
//       geopackage.getTileDaoWithTileMatrixSet(tileMatrixSet, function(err, tileDao) {
//         callback(err, geopackage, mbtiles, tileDao);
//       });
//     },
//     function(geopackage, mbtiles, tileDao, callback) {

//       var stream = mbtiles.createZXYStream({batch:10});
//       var output = '';
//       var count = 0;

//       stream.on('data', function(lines) {
//           output += lines;
//       });
//       stream.on('end', function() {
//           var queue = output.toString().split('\n');
//           var fivePercent = Math.floor(queue.length / 20);

//           async.eachSeries(queue, function(zxy, tileDone) {
//             async.setImmediate(function() {
//               zxy = zxy.split('/');
//               if (count++ % fivePercent === 0) {

//                 progressCallback({
//                   status: 'Inserting tile into table "' + tileDao.table_name + '"',
//                   completed: count,
//                   total: queue.length
//                 }, function() {
//                   getAndSaveTile(mbtiles, zxy[0], zxy[1], zxy[2], tileDao, tileDone);
//                 });
//               } else {
//                 getAndSaveTile(mbtiles, zxy[0], zxy[1], zxy[2], tileDao, tileDone);
//               }
//             });
//           }, function() {
//             callback(null, geopackage);
//           });
//       });
//     }
//   ], done);
// }

// function getAndSaveTile(mbtiles, zoom, x, y, tileDao, callback) {
//   console.log('getting the tile %s, %s, %s', zoom, x, y);
//   mbtiles.getTile(zoom, x, y, function(err, buffer, headers) {
//     console.log('saving the tile %s, %s, %s', zoom, x, y);

//     var tile = tileDao.newRow();
//     tile.setZoomLevel(parseInt(zoom));
//     tile.setTileColumn(parseInt(x));
//     tile.setTileRow(parseInt(y));
//     tile.setTileData(buffer);
//     tileDao.create(tile, callback);
//   });
// }
