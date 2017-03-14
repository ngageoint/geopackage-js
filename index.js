/**
 * GeoPackage module.
 * @module GeoPackage
 */

var wkx = require('wkx')
  , reproject = require('reproject')
  , path = require('path')
  , SQL = require('sql.js')
  , async = require('async')
  , fs = require('fs');

var GeoPackageManager = require('./lib/geoPackageManager')
  , GeoPackage = require('./lib/geoPackage')
  , GeoPackageTileRetriever = require('./lib/tiles/retriever')
  , GeoPackageConnection = require('./lib/db/geoPackageConnection')
  , BoundingBox = require('./lib/boundingBox')
  , GeometryData = require('./lib/geom/geometryData')
  , TableCreator = require('./lib/db/tableCreator')
  , TileBoundingBoxUtils = require('./lib/tiles/tileBoundingBoxUtils');

// module.exports.GeoJSONToGeoPackage = require('geojson-to-geopackage');
// module.exports.ShapefileToGeoPackage = require('shapefile-to-geopackage');
// module.exports.MBTilesToGeoPackage = require('mbtiles-to-geopackage');
// module.exports.PBFToGeoPackage = require('pbf-to-geopackage');

var proj4Defs = require('./lib/proj4Defs');
module.exports.proj4Defs = proj4Defs;
module.exports.GeoPackageTileRetriever = GeoPackageTileRetriever;
module.exports.GeoPackageConnection = GeoPackageConnection;

/**
 * Open a GeoPackage at the path specified
 * @param  {String}   gppath   path where the GeoPackage exists
 * @param  {Function} callback called with an error and the GeoPackage object if opened
 */
module.exports.openGeoPackage = function(gppath, callback) {
  GeoPackageManager.open(gppath, callback);
};

/**
 * Open a GeoPackage from the byte array
 * @param  {Uint8Array}   array    Array of GeoPackage bytes
 * @param  {Function} callback called with an error if it occurred and the open GeoPackage object
 */
module.exports.openGeoPackageByteArray = function(array, callback) {
  var db = new SQL.Database(array);
  GeoPackageConnection.connectWithDatabase(db, function(err, connection) {
    var geoPackage = new GeoPackage('', '', connection);
    callback(null, geoPackage);
  });
};

/**
 * Creates a GeoPackage file at the path specified in node or opens an in memory GeoPackage on the browser
 * @param  {String}   gppath   path to GeoPackage fileType
 * @param  {Function} callback called with an error if one occurred and the open GeoPackage object
 */
module.exports.createGeoPackage = function(gppath, callback) {
  if (!callback) {
    callback = gppath;
    gppath = undefined;
  }
  async.series([
    function(callback) {
      if (typeof(process) !== 'undefined' && process.version && gppath) {
        fs.mkdir(path.dirname(gppath), function() {
          fs.open(gppath, 'w', callback);
        });
      } else {
        callback();
      }
    }
  ], function() {
    GeoPackageConnection.connect(gppath, function(err, connection) {
      var name = gppath ? path.basename(gppath) : 'geopackage';
      var geopackage = new GeoPackage(name, gppath, connection);
      var tc = new TableCreator(geopackage);
      tc.createRequired(function() {
        callback(null, geopackage);
      });
    });
  });
};

module.exports.TileColumn = require('./lib/tiles/user/tileColumn');
module.exports.BoundingBox = require('./lib/boundingBox');
module.exports.TileUtilities = require('./lib/tiles/creator/tileUtilities');

module.exports.createTileTable = function(geopackage, tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId, callback) {
  geopackage.createTileTableWithTableName(tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId, callback);
};

module.exports.createStandardWebMercatorTileTable = function(geopackage, tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId, minZoom, maxZoom, callback) {
  module.exports.createTileTable(geopackage, tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId, function(err, tileMatrixSet) {
    geopackage.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, minZoom, maxZoom, function(err, result) {
      callback(err, tileMatrixSet);
    });
  });
}

/**
 * Adds a tile to the GeoPackage
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {object}   tile       Byte array or Buffer containing the tile bytes
 * @param  {String}   tableName  Table name to add the tile to
 * @param  {Number}   zoom       zoom level of this tile
 * @param  {Number}   tileRow    row of this tile
 * @param  {Number}   tileColumn column of this tile
 * @param  {Function} callback   called with an eror if one occurred and the inserted row
 */
module.exports.addTileToGeoPackage = function(geopackage, tile, tableName, zoom, tileRow, tileColumn, callback) {
  geopackage.addTile(tile, tableName, zoom, tileRow, tileColumn, callback);
};

module.exports.FeatureColumn = require('./lib/features/user/featureColumn');
module.exports.GeometryColumns = require('./lib/features/columns').GeometryColumns;
module.exports.DataColumns = require('./lib/dataColumns').DataColumns;
module.exports.DataTypes = require('./lib/db/dataTypes');

module.exports.createFeatureTable = function(geopackage, tableName, geometryColumn, featureColumns, callback) {
  module.exports.createFeatureTableWithDataColumns(geopackage, tableName, geometryColumn, featureColumns, null, callback);
};

module.exports.createFeatureTableWithDataColumns = function(geopackage, tableName, geometryColumn, featureColumns, dataColumns, callback) {
  var boundingBox = new BoundingBox(-180, 180, -90, 90);
  module.exports.createFeatureTableWithDataColumnsAndBoundingBox(geopackage, tableName, geometryColumn, featureColumns, dataColumns, boundingBox, 4326, callback);
};

module.exports.createFeatureTableWithDataColumnsAndBoundingBox = function(geopackage, tableName, geometryColumn, featureColumns, dataColumns, boundingBox, boundingBoxSrsId, callback) {
  geopackage.createFeatureTableWithGeometryColumnsAndDataColumns(geometryColumn, boundingBox, boundingBoxSrsId, featureColumns, dataColumns, function(err, result) {
    geopackage.getFeatureDaoWithTableName(tableName, callback);
  });
};

/**
 * Adds a GeoJSON feature to the GeoPackage
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {object}   feature    GeoJSON feature to add
 * @param  {String}   tableName  Table name to add the tile to
 * @param  {Function} callback   called with an error if one occurred and the inserted row
 */
module.exports.addGeoJSONFeatureToGeoPackage = function(geopackage, feature, tableName, callback) {
  geopackage.getFeatureDaoWithTableName(tableName, function(err, featureDao) {
    var featureRow = featureDao.newRow();
    var geometryData = new GeometryData();
    geometryData.setSrsId(4326);
    var featureGeometry = typeof feature.geometry === 'string' ? JSON.parse(feature.geometry) : feature.geometry;
    var geometry = wkx.Geometry.parseGeoJSON(featureGeometry);
    geometryData.setGeometry(geometry);
    featureRow.setGeometry(geometryData);
    for (var propertyKey in feature.properties) {
      if (feature.properties.hasOwnProperty(propertyKey)) {
        featureRow.setValueWithColumnName(propertyKey, feature.properties[propertyKey]);
      }
    }

    featureDao.create(featureRow, callback);
  });
};

/**
 * Gets the feature tables from the GeoPackage
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {Function} callback   called with an error if one occurred and the array of feature table names
 */
module.exports.getFeatureTables = function(geopackage, callback) {
  geopackage.getFeatureTables(callback);
};

/**
 * Iterate GeoJSON features from table
 * @param  {GeoPackage} geopackage      open GeoPackage object
 * @param  {String} table           Table name to Iterate
 * @param  {Function} featureCallback called with an error if one occurred and the next GeoJSON feature in the table
 * @param  {Function} doneCallback    called when all rows are complete
 */
module.exports.iterateGeoJSONFeaturesFromTable = function(geopackage, table, featureCallback, doneCallback) {
  geopackage.getFeatureDaoWithTableName(table, function(err, featureDao) {
    if (err) {
      return doneCallback(err);
    }
    featureDao.getSrs(function(err, srs) {
      featureDao.queryForEach(function(err, row, rowDone) {
        var currentRow = featureDao.getFeatureRow(row);
        var geometry = currentRow.getGeometry();
        if (geometry) {
          var geom = geometry.geometry;
          var geoJsonGeom = geometry.geometry.toGeoJSON();
          if (srs.definition && srs.definition !== 'undefined') {
            geoJsonGeom = reproject.reproject(geoJsonGeom, srs.organization + ':' + srs.organization_coordsys_id, 'EPSG:4326');
          }
        }
        var geoJson = {
          geometry: geoJsonGeom,
          type: 'Feature',
          properties: {}
        };
        for (var key in currentRow.values) {
          if(currentRow.values.hasOwnProperty(key) && key != currentRow.getGeometryColumn().name) {
            geoJson.properties[key] = currentRow.values[key];
          } else if (currentRow.getGeometryColumn().name === key) {
            geoJson.properties[key] = geometry ? 'Valid' : 'No Geometry';
          }
        }
        geoJson.id = currentRow.getId();
        featureCallback(err, geoJson, rowDone);
      }, doneCallback);
    });
  });
};

/**
 * Gets a GeoJSON feature from the table by id
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {String}   table      name of the table to get the feature from
 * @param  {Number}   featureId  ID of the feature
 * @param  {Function} callback   called with an error if one occurred and the GeoJSON feature
 */
module.exports.getFeature = function(geopackage, table, featureId, callback) {
  geopackage.getFeatureDaoWithTableName(table, function(err, featureDao) {
    featureDao.getSrs(function(err, srs) {
      featureDao.queryForIdObject(featureId, function(err, object, feature) {
        var currentRow = featureDao.getFeatureRow(feature);
        var geometry = currentRow.getGeometry();
        var geoJson = {};
        if (geometry) {
          var geom = geometry.geometry.toGeoJSON();
          if (srs.definition && srs.definition !== 'undefined') {
            geom = reproject.reproject(geom, srs.organization + ':' + srs.organization_coordsys_id, 'EPSG:4326');
          }
          geoJson.geometry = geom;
        }
        geoJson.type = 'Feature';
        geoJson.properties = {};
        for (var key in currentRow.values) {
          if(currentRow.values.hasOwnProperty(key) && key != currentRow.getGeometryColumn().name) {
            geoJson.properties[key] = currentRow.values[key];
          } else if (currentRow.getGeometryColumn().name === key) {
            geoJson.properties[key] = geometry ? 'Valid' : 'No Geometry';
          }
        }
        geoJson.id = currentRow.getId();
        callback(null, geoJson);
      });
    });
  });
};

/**
 * Gets the tile table names from the GeoPackage
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {Function} callback   called with an error if one occurred and the array of tile table names
 */
module.exports.getTileTables = function(geopackage, callback) {
  geopackage.getTileTables(callback);
};

/**
 * Gets a tile from the specified table
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {String}   table      name of the table to get the tile from
 * @param  {Number}   zoom       zoom level of the tile
 * @param  {Number}   tileRow    row of the tile
 * @param  {Number}   tileColumn column of the tile
 * @param  {Function} callback   called with an error if one occurred and the TileRow object
 */
module.exports.getTileFromTable = function(geopackage, table, zoom, tileRow, tileColumn, callback) {
  geopackage.getTileDaoWithTableName(table, function(err, tileDao) {
    if (err) return callback();
    tileDao.queryForTile(tileColumn, tileRow, zoom, callback);
  });
};

/**
 * Gets the tiles in the EPSG:4326 bounding box
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {String}   table      name of the tile table
 * @param  {Number}   zoom       Zoom of the tiles to query for
 * @param  {Number}   west       EPSG:4326 western boundary
 * @param  {Number}   east       EPSG:4326 eastern boundary
 * @param  {Number}   south      EPSG:4326 southern boundary
 * @param  {Number}   north      EPSG:4326 northern boundary
 * @param  {Function} callback   called with an error if one occurred and a tiles object describing the tiles
 */
module.exports.getTilesInBoundingBox = function(geopackage, table, zoom, west, east, south, north, callback) {
  var tiles = {};

  geopackage.getTileDaoWithTableName(table, function(err, tileDao) {
    if (err) {
      return callback();
    }
    if (zoom < tileDao.minZoom || zoom > tileDao.maxZoom) {
      return callback();
    }
    tiles.columns = [];
    for (var i = 0; i < tileDao.table.columns.length; i++) {
      var column = tileDao.table.columns[i];
      tiles.columns.push({
        index: column.index,
        name: column.name,
        max: column.max,
        min: column.min,
        notNull: column.notNull,
        primaryKey: column.primaryKey
      });
    }
    tileDao.getSrs(function(err, srs) {
      tiles.srs = srs;
      tiles.tiles = [];

      var tms = tileDao.tileMatrixSet;
      var tm = tileDao.getTileMatrixWithZoomLevel(zoom);
      var mapBounds = map.getBounds();
      var mapBoundingBox = new BoundingBox(Math.max(-180, west), Math.min(east, 180), south, north);
      tiles.west = Math.max(-180, west).toFixed(2);
      tiles.east = Math.min(east, 180).toFixed(2);
      tiles.south = south.toFixed(2);
      tiles.north = north.toFixed(2);
      tiles.zoom = zoom;
      mapBoundingBox = mapBoundingBox.projectBoundingBox('EPSG:4326', tileDao.srs.organization.toUpperCase() + ':' + tileDao.srs.organization_coordsys_id);

      var grid = TileBoundingBoxUtils.getTileGridWithTotalBoundingBox(tms.getBoundingBox(), tm.matrix_width, tm.matrix_height, mapBoundingBox);

      tileDao.queryByTileGrid(grid, zoom, function(err, row, rowDone) {
        var tile = {};
        tile.tableName = table;
        tile.id = row.getId();

        var tileBB = TileBoundingBoxUtils.getTileBoundingBox(tms.getBoundingBox(), tm, row.getTileColumn(), row.getTileRow());
        tile.minLongitude = tileBB.minLongitude;
        tile.maxLongitude = tileBB.maxLongitude;
        tile.minLatitude = tileBB.minLatitude;
        tile.maxLatitude = tileBB.maxLatitude;
        tile.projection = tileDao.srs.organization.toUpperCase() + ':' + tileDao.srs.organization_coordsys_id;
        tile.values = [];
        for (var i = 0; i < tiles.columns.length; i++) {
          var value = row.values[tiles.columns[i].name];
          if (tiles.columns[i].name === 'tile_data') {
            tile.values.push('data');
          } else
          if (value === null || value === 'null') {
            tile.values.push('');
          } else {
            tile.values.push(value.toString());
            tile[tiles.columns[i].name] = value;
          }
        }
        tiles.tiles.push(tile);
        rowDone();
      }, function(err) {
        callback(err, tiles);
      });
    });
  });
};

/**
 * Gets a tile image for an XYZ tile pyramid location
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {String}   table      name of the table containing the tiles
 * @param  {Number}   x          x index of the tile
 * @param  {Number}   y          y index of the tile
 * @param  {Number}   z          zoom level of the tile
 * @param  {Number}   width      width of the resulting tile
 * @param  {Number}   height     height of the resulting tile
 * @param  {Function} callback   Called with an error if one occurred and the tile buffer
 */
module.exports.getTileFromXYZ = function(geopackage, table, x, y, z, width, height, callback) {
  geopackage.getTileDaoWithTableName(table, function(err, tileDao) {
    var retriever = new GeoPackageTileRetriever(tileDao, width, height);
    retriever.getTile(x, y, z, callback);
  });
};

/**
 * Draws an XYZ tile pyramid location into the provided canvas
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {String}   table      name of the table containing the tiles
 * @param  {Number}   x          x index of the tile
 * @param  {Number}   y          y index of the tile
 * @param  {Number}   z          zoom level of the tile
 * @param  {Number}   width      width of the resulting tile
 * @param  {Number}   height     height of the resulting tile
 * @param  {Canvas}   canvas     canvas element to draw the tile into
 * @param  {Function} callback   Called with an error if one occurred
 */
module.exports.drawXYZTileInCanvas = function(geopackage, table, x, y, z, width, height, canvas, callback) {
  geopackage.getTileDaoWithTableName(table, function(err, tileDao) {
    var retriever = new GeoPackageTileRetriever(tileDao, width, height);
    retriever.drawTileIn(x, y, z, canvas, callback);
  });
};
