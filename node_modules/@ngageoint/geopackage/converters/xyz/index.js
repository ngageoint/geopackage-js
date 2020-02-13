var GeoPackage = require('@ngageoint/geopackage')
  , TileBoundingBoxUtils = require('geopackage/lib/tiles/tileBoundingBoxUtils')
  , BoundingBox = require('geopackage/lib/boundingBox');

var fs = require('fs')
  , async = require('async')
  , path = require('path')
  , JSZip = require('jszip');

module.exports.addLayer = function(options, progressCallback, doneCallback) {
  doneCallback = arguments[arguments.length - 1];
  progressCallback = typeof arguments[arguments.length - 2] === 'function' ? arguments[arguments.length - 2] : undefined;

  options.append = true;

  setupConversion(options, progressCallback, doneCallback);
};

module.exports.convert = function(options, progressCallback, doneCallback) {
  doneCallback = arguments[arguments.length - 1];
  progressCallback = typeof arguments[arguments.length - 2] === 'function' ? arguments[arguments.length - 2] : undefined;

  options.append = false;

  setupConversion(options, progressCallback, doneCallback);
};

module.exports.extract = function(geopackage, tableName, callback) {
  async.waterfall([
    function(callback) {
      if (typeof geopackage === 'object') {
        callback(null, geopackage);
      } else {
        GeoPackage.openGeoPackage(geopackage, callback);
      }
    }, function(geopackage, callback) {
      if (!tableName) {
        geopackage.getTileTables(function(err, tables) {
          callback(null, geopackage, tables);
        });
      } else if (!(tableName instanceof Array)) {
        callback(null, geopackage, [tableName]);
      } else {
        callback(null, geopackage, tableName);
      }
    }, function(geopackage, tables, callback) {
      createXYZZip(geopackage, tables, callback);
    }
  ], callback);
};

function createXYZZip(geopackage, tables, zipCreated) {
  var zip = new JSZip();
  async.eachSeries(tables, function(name, tableDone) {
    async.waterfall([
      function(callback) {
        geopackage.getTileDaoWithTableName(name, callback);
      }, function(tileDao, callback) {
        var boundingBox = tileDao.getBoundingBox();
        boundingBox = boundingBox.projectBoundingBox(tileDao.projection, 'EPSG:3857');
        callback(null, tileDao, boundingBox);
      }, function(tileDao, boundingBox, tilesComplete) {
        var zoom = tileDao.minZoom;

        async.whilst(function() {
          return zoom <= tileDao.maxZoom;
        },
        function(zoomDone) {

          var tileBox = TileBoundingBoxUtils.webMercatorTileBox(boundingBox, zoom);
          var xTile = tileBox.minX;
          var yTile = tileBox.minY;

          async.whilst(function() {
            return xTile <= tileBox.maxX;
          },
          function(yDone) {
            async.whilst(function() {
              return yTile <= tileBox.maxY;
            }, function(tileDone) {
              GeoPackage.getTileFromXYZ(geopackage, name, xTile, yTile, zoom, 256, 256, function(err, tile) {
                zip.file(zoom+'/'+xTile+'/'+yTile+'.png', tile);
                yTile++;
                tileDone();
              });
            }, function() {
              xTile++;
              yTile = tileBox.minY;
              yDone();
            });
          },
          function() {
            zoom++;
            zoomDone();
          });
        }, function() {
          tilesComplete();
        });
      }
    ], tableDone);
  }, function(err) {
    zip.generateAsync({type: 'nodebuffer', compression: 'DEFLATE'}).then(function(content) {
      zipCreated(null, content);
    });
  });
}

function setupConversion(options, progressCallback, doneCallback) {
  if (!progressCallback) {
    progressCallback = function(status, cb) {
      cb();
    }
  }

  var geopackage = options.geopackage;

  var reader;
  var features = [];

  async.waterfall([
    // create or open the geopackage
    function(callback) {
      if (typeof geopackage === 'object') {
        return progressCallback({status: 'Opening GeoPackage'}, function() {
          callback(null, geopackage);
        });
      }

      try {
        var stats = fs.statSync(geopackage);
        if (!options.append) {
          console.log('GeoPackage file already exists, refusing to overwrite ' + geopackage);
          return callback(new Error('GeoPackage file already exists, refusing to overwrite ' + geopackage));
        } else {
          return GeoPackage.openGeoPackage(geopackage, callback);
        }
      } catch (e) {}
      return progressCallback({status: 'Creating GeoPackage'}, function() {
        GeoPackage.createGeoPackage(geopackage, callback);
      });
    },
    // figure out the table name to put the data into
    function(geopackage, callback) {
      var name = 'tiles';
      if (typeof options.xyzZip === 'string') {
        name = path.basename(options.xyzZip, path.extname(options.xyzZip));
      }
      geopackage.getTileTables(function(err, tables) {
        var count = 1;
        while(tables.indexOf(name) !== -1) {
          name = name + '_' + count;
          count++;
        }
        callback(null, geopackage, name);
      });
    },
    function(geopackage, tableName, callback) {


      // Determine min zoom and the bounding box of tiles from that
      //
      var boundingBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
      boundingBoxSrsId = 3857;
      minZoom = 0;
      maxZoom = 18;
      progressCallback({status: 'Creating table "' + tableName + '"'}, function() {
        GeoPackage.createStandardWebMercatorTileTable(geopackage, tableName, boundingBox, boundingBoxSrsId, boundingBox, boundingBoxSrsId, minZoom, maxZoom, function(err, tileMatrixSet) {
          callback(err, geopackage, tableName, tileMatrixSet);
        });
      });
    },
    function(geopackage, tableName, tileMatrixSet, callback) {
      geopackage.getTileDaoWithTileMatrixSet(tileMatrixSet, function(err, tileDao) {
        callback(err, geopackage, tileDao);
      });
    },
    function(geopackage, tileDao, callback) {
      var zip = new JSZip();
      if (options.xyzZipData) {
        zip.loadAsync(options.xyzZipData).then(function() {
          callback(null, geopackage, tileDao, zip);
        });
      } else {
        fs.readFile(options.xyzZip, function(err, data) {
          zip.loadAsync(data).then(function() {
            callback(null, geopackage, tileDao, zip);
          });
        });
      }
    },
    function(geopackage, tileDao, xyzZip, callback) {

      var tiles = xyzZip.file(/png$/);

      async.eachSeries(tiles, function(zipTile, tileDone) {
        var split = zipTile.name.split('/');

        zipTile.async('nodebuffer').then(function(content) {
          var tile = tileDao.newRow();
          tile.setZoomLevel(parseInt(split[0]));
          tile.setTileColumn(parseInt(split[1]));
          tile.setTileRow(parseInt(split[2].split('.')[0]));
          tile.setTileData(content);
          tileDao.create(tile, tileDone);
        });

      }, function(err, results) {
        callback(null, geopackage);
      });
    }
  ], function done(err, geopackage) {
    doneCallback(err, geopackage);
  });
};
