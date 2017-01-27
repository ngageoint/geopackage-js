var GeoPackage = require('geopackage')
  , TileBoundingBoxUtils = require('geopackage/lib/tiles/tileBoundingBoxUtils')
  , BoundingBox = require('geopackage/lib/boundingBox')
  , PBFToGeoPackage = require('pbf-to-geopackage');

var fs = require('fs')
  , async = require('async')
  , path = require('path')
  , MBTiles = require('mbtiles')
  , JSZip = require('jszip')
  , GlobalMercator = require('global-mercator')
  , Buffer = require('buffer').Buffer
  , pako = require('pako');

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
        console.log('opening ' + geopackage);
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
      createResult(geopackage, tables, callback);
    }
  ], callback);
};

function createResult(geopackage, tables, resultCreated) {
  var mbtilesArray = [];
  async.eachSeries(tables, function(name, tableDone) {
    console.log('creating mbtiles for ' + name);
    createMBTiles(geopackage, name, function(err, mbtiles) {
      console.log('created mbtiles for ' + name);
      mbtilesArray.push(mbtiles);
      tableDone();
    });
  }, function(err) {
    // add all the files in the array here, or just return the mbtiles file if there was only one
    if (mbtilesArray.length === 1) {
      mbtilesArray[0]._db.export(resultCreated);
    } else {
      var zip = new JSZip();
      async.eachSeries(mbtilesArray, function(mbtiles, done) {
        mbtiles._db.export(function(err, file) {
          console.log('zipping');
          zip.file(path.basename(mbtiles.filename), file);
          console.log('zipped');
          try {
            if (typeof(process) !== 'undefined' && process.version) {
              fs.unlinkSync(mbtiles.filename);
            }
          } catch (e) {}
          done();
        });
      }, function() {
        console.log('all files zipped');
        zip.generateAsync({type: 'nodebuffer', compression: 'DEFLATE'}).then(function(content) {
          console.log('content generated');
          resultCreated(null, content, {extension: 'zip'});
        });
      });
    }
  });
}

function createMBTiles(geopackage, table, done) {
  console.log('filename ' + __dirname + '/'+table+'.mbtiles');
  new MBTiles(__dirname + '/'+table+'.mbtiles', function(err, mbtiles) {
    if (err) throw err;

    mbtiles.startWriting(function(err) {
        if (err) throw err;
        async.waterfall([
          function(callback) {
            geopackage.getTileDaoWithTableName(table, callback);
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
                  console.log('getting tile zoom: %d, x: %d, y: %d', zoom, xTile, yTile);
                  GeoPackage.getTileFromXYZ(geopackage, table, xTile, yTile, zoom, 256, 256, function(err, tile) {
                    // add the tile to the mbtiles file
                    mbtiles.putTile(zoom, xTile, yTile, tile, function(err) {
                        if (err) return tileDone(err);
                        yTile++;
                        tileDone();
                    });
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
              mbtiles.getInfo(function(err, info) {
                mbtiles.putInfo(info, function(err, data) {
                  mbtiles.stopWriting(function(err) {
                    tilesComplete();
                  });
                });
              });
            });
          }
        ], function(err) {
          done(err, mbtiles);
        });
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
    function(geopackage, callback) {
      var filename;
      if (typeof options.mbtiles === 'string') {
        filename = path.basename(options.mbtiles, path.extname(options.mbtiles));
      }

      new MBTiles(options.mbtiles || new Buffer(options.mbtilesData), function(err, mbtiles) {
        callback(err, geopackage, mbtiles, filename);
      });
    },
    function(geopackage, mbtiles, filename, callback) {
      mbtiles.getInfo(function(err, info) {
        info.filename = filename;
        callback(err, geopackage, mbtiles, info);
      });
    },
    // figure out the table name to put the data into
    function(geopackage, mbtiles, info, callback) {
      // is this a mbtiles file with pbf tiles?
      if (info.format === 'pbf') {
        handlePbfMBTiles(geopackage, mbtiles, info, callback);
      } else {
        handleImageryMBTiles(geopackage, mbtiles, info, callback);
      }
    }
  ], function done(err, geopackage) {
    doneCallback(err, geopackage);
  });
};

function handlePbfMBTiles(geopackage, mbtiles, info, done) {
  async.waterfall([
    // figure out the table name to put the data into
    function(callback) {
      var name = info.filename || 'features';


      var stream = mbtiles.createZXYStream({batch:10});
      var output = '';
      var count = 0;

      stream.on('data', function(lines) {
          output += lines;
      });
      stream.on('end', function() {
          var queue = output.toString().split('\n');
          var fivePercent = Math.floor(queue.length / 20);

          async.eachSeries(queue, function(zxy, tileDone) {
            async.setImmediate(function() {
              if (zxy === '') return tileDone();
              zxy = zxy.split('/');
              if (count++ % fivePercent === 0) {

                progressCallback({
                  status: 'Inserting tile into table "' + tileDao.table_name + '"',
                  completed: count,
                  total: queue.length
                }, function() {
                  getAndSavePbfTile(mbtiles, zxy[0], zxy[1], zxy[2], geopackage, progressCallback, tileDone);
                });
              } else {
                getAndSavePbfTile(mbtiles, zxy[0], zxy[1], zxy[2], geopackage, progressCallback, tileDone);
              }
            });
          }, function() {
            callback(null, geopackage);
          });
      });


    }
  ], done);
}

function getAndSavePbfTile(mbtiles, zoom, x, y, geopackage, progressCallback, callback) {
  console.log('getting the tile %s, %s, %s', zoom, x, y);
  mbtiles.getTile(zoom, x, y, function(err, buffer, headers) {
    console.log('saving the tile %s, %s, %s', zoom, x, y);
    var bbox = GlobalMercator.tileToBBox([x, y, zoom]);
    var center = GlobalMercator.bboxToCenter(bbox);

    try {
      var unzipped = pako.ungzip(buffer);

      PBFToGeoPackage.convert({
        pbf: unzipped,
        geopackage: geopackage,
        tileCenter: center,
        zoom: zoom
      },
      progressCallback,
      function(err, gp) {
        gp.getFeatureTables(function(err, tables) {
          callback(err, geopackage);
        });
      });
    } catch (err) {
      console.log(err);
    }
  });
}

function handleImageryMBTiles(geopackage, mbtiles, info, done) {
  async.waterfall([
    // figure out the table name to put the data into
    function(geopackage, mbtiles, info, callback) {
      var name = info.filename || 'tiles';
      geopackage.getTileTables(function(err, tables) {
        var count = 1;
        while(tables.indexOf(name) !== -1) {
          name = name + '_' + count;
          count++;
        }
        callback(null, geopackage, name, mbtiles);
      });
    },
    function(geopackage, tableName, mbtiles, info, callback) {
      var boundingBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
      var minZoom = info.minzoom;
      var maxZoom = info.maxzoom;
      var boundingBoxSrsId = 3857;

      progressCallback({status: 'Creating table "' + tableName + '"'}, function() {
        GeoPackage.createStandardWebMercatorTileTable(geopackage, tableName, boundingBox, boundingBoxSrsId, boundingBox, boundingBoxSrsId, minZoom, maxZoom, function(err, tileMatrixSet) {
          callback(err, geopackage, tableName, mbtiles, tileMatrixSet);
        });
      });
    },
    function(geopackage, tableName, mbtiles, tileMatrixSet, callback) {
      geopackage.getTileDaoWithTileMatrixSet(tileMatrixSet, function(err, tileDao) {
        callback(err, geopackage, mbtiles, tileDao);
      });
    },
    function(geopackage, mbtiles, tileDao, callback) {

      var stream = mbtiles.createZXYStream({batch:10});
      var output = '';
      var count = 0;

      stream.on('data', function(lines) {
          output += lines;
      });
      stream.on('end', function() {
          var queue = output.toString().split('\n');
          var fivePercent = Math.floor(queue.length / 20);

          async.eachSeries(queue, function(zxy, tileDone) {
            async.setImmediate(function() {
              zxy = zxy.split('/');
              if (count++ % fivePercent === 0) {

                progressCallback({
                  status: 'Inserting tile into table "' + tileDao.table_name + '"',
                  completed: count,
                  total: queue.length
                }, function() {
                  getAndSaveTile(mbtiles, zxy[0], zxy[1], zxy[2], tileDao, tileDone);
                });
              } else {
                getAndSaveTile(mbtiles, zxy[0], zxy[1], zxy[2], tileDao, tileDone);
              }
            });
          }, function() {
            callback(null, geopackage);
          });
      });
    }
  ], done);
}

function getAndSaveTile(mbtiles, zoom, x, y, tileDao, callback) {
  console.log('getting the tile %s, %s, %s', zoom, x, y);
  mbtiles.getTile(zoom, x, y, function(err, buffer, headers) {
    console.log('saving the tile %s, %s, %s', zoom, x, y);

    var tile = tileDao.newRow();
    tile.setZoomLevel(parseInt(zoom));
    tile.setTileColumn(parseInt(x));
    tile.setTileRow(parseInt(y));
    tile.setTileData(buffer);
    tileDao.create(tile, callback);
  });
}
