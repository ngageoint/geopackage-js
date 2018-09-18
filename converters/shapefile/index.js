var GeoPackage = require('@ngageoint/geopackage');

var fs = require('fs')
  , async = require('async')
  , path = require('path')
  , stream = require('stream')
  , shp = require('shp-stream')
  , shpwrite = require('shp-write')
  , proj4 = require('proj4')
  , reproject = require('reproject')
  , jszip = require('jszip');

proj4 = 'default' in proj4 ? proj4['default'] : proj4;

/**
 * Add a Shapefile to the GeoPackage
 * | option       | type    |  |
 * | ------------ | ------- | -------------- |
 * | `geopackage`     | varies  | This option can either be a string or a GeoPackage object.  If the option is a string it is interpreted as a path to a GeoPackage file.  If that file exists, it is opened.  If it does not exist, a new file is created and opened. |
 * | `shapezipData`   | Buffer  | Buffer with the data for a zip file containing a shapefile and it's associated files |
 * | `shapeData` | Buffer | Buffer with the data for a shapefile (.shp) |
 * | `shapefile` | String | Interpreted as a path to a .shp or .zip file |
 * | `dbfData` | String | Only used if the 'shapeData' parameter was provided.  Buffer with the data for a dbf file (.dbf) |
 * @param  {object} options          object describing the operation, see function description
 * @param  {Function} progressCallback called with an object describing the progress and a done function to be called when the handling of progress is completed
 * @param  {function} doneCallback     called with an error if one occurred and the geopackage object
 */
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
  if (!tableName) {
    geopackage.getFeatureTables(function(err, tables) {
      createShapefile(geopackage, tables, callback);
    });
  } else {
    createShapefile(geopackage, tableName, callback);
  }
};

function createShapefile(geopackage, tableName, callback) {
  var geoJson = {
    type: 'FeatureCollection',
    features: []
  };
  if (!(tableName instanceof Array)) {
    tableName = [tableName];
  }
  async.eachSeries(tableName, function(name, callback) {
    GeoPackage.iterateGeoJSONFeaturesFromTable(geopackage, name, function(err, feature, done) {
      geoJson.features.push(feature);
      done();
    }, callback);
  }, function(err) {
    var zip = shpwrite.zip(geoJson);
    callback(err, zip);
  });
}

function determineTableName(preferredTableName, geopackage, callback) {
  var name = preferredTableName;
  geopackage.getFeatureTables(function(err, tables) {
    var count = 1;
    while(tables.indexOf(name) !== -1) {
      name = name + '_' + count;
      count++;
    }
    callback(null, geopackage, name);
  });
}

function convertShapefileReaders(readers, geopackage, progressCallback, callback) {
  async.eachSeries(readers, function(shapefile, shapefileFinished) {
    var tableName = shapefile.tableName;
    var reader = shapefile.reader;
    var projection = shapefile.projection;
    var features = [];

    async.waterfall([
      // figure out the table name to put the data into
      function(callback) {
        determineTableName(tableName, geopackage, callback);
      },
      function(geopackage, tableName, callback) {
        reader.readHeader(function(err, header) {
          callback(null, geopackage, tableName, header ? header.bbox : undefined);
        });
      },
      // get the feature properties
      function(geopackage, tableName, bbox, callback) {

        progressCallback({status: 'Reading Shapefile properties'}, function() {

          var properties = {};
          var feature;

          async.during(
            function(cb) {
              reader.readRecord(function(err, r) {
                feature = r;
                cb(null, feature !== shp.end);
              });
            }, function(cb) {
              async.setImmediate(function() {
                if (!feature) return cb();
                features.push(feature);
                for (var key in feature.properties) {
                  if (!properties[key]) {
                    properties[key] = properties[key] || {
                      name: key
                    };

                    var type = typeof feature.properties[key];
                    if (feature.properties[key] !== undefined && feature.properties[key] !== null && type !== 'undefined') {
                      if (type === 'object') {
                        if (feature.properties[key] instanceof Date) {
                          type = 'Date';
                        }
                      }
                      switch(type) {
                        case 'Date':
                          type = 'DATETIME';
                          break;
                        case 'number':
                          type = 'DOUBLE';
                          break;
                        case 'string':
                          type = 'TEXT';
                          break;
                        case 'boolean':
                          type = 'BOOLEAN';
                          break;
                      }
                      properties[key] = {
                        name: key,
                        type: type
                      };
                    }
                  }
                }
                cb();
              });
            }, function done(err) {
              callback(err, geopackage, tableName, bbox, properties);
            }
          );
        });
      },
      function(geopackage, tableName, bbox, properties, callback) {
        var FeatureColumn = GeoPackage.FeatureColumn;
        var GeometryColumns = GeoPackage.GeometryColumns;
        var DataTypes = GeoPackage.DataTypes;
        var BoundingBox = GeoPackage.BoundingBox;

        var geometryColumns = new GeometryColumns();
        geometryColumns.table_name = tableName;
        geometryColumns.column_name = 'geometry';
        geometryColumns.geometry_type_name = 'GEOMETRY';
        geometryColumns.z = 0;
        geometryColumns.m = 0;

        var columns = [];
        columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
        columns.push(FeatureColumn.createGeometryColumn(1, 'geometry', 'GEOMETRY', false, null));
        var index = 2;
        for (var key in properties) {
          var prop = properties[key];
          if (prop.name.toLowerCase() !== 'id') {
            columns.push(FeatureColumn.createColumnWithIndex(index, prop.name, DataTypes.fromName(prop.type), false, null));
            index++;
          }
        }
        progressCallback({status: 'Creating table "' + tableName + '"'}, function() {
          var boundingBox = new BoundingBox(-180, 180, -90, 90);
          if (projection && bbox) {
            // bbox is xmin, ymin, xmax, ymax
            var ll = proj4(projection).inverse([bbox[0], bbox[1]]);
            var ur = proj4(projection).inverse([bbox[2], bbox[3]]);
            boundingBox = new BoundingBox(ll[0], ur[0], ll[1], ur[1]);
          }
          GeoPackage.createFeatureTableWithDataColumnsAndBoundingBox(geopackage, tableName, geometryColumns, columns, null, boundingBox, 4326, function(err, featureDao) {
            callback(err, geopackage, tableName, featureDao);
          });
        });
      },
      function(geopackage, tableName, featureDao, callback) {
        var count = 0;
        var featureCount = features.length;
        var fivePercent = Math.floor(featureCount / 20);
        async.eachSeries(features, function featureIterator(feature, callback) {
          async.setImmediate(function() {
            if (projection) {
              feature = reproject.reproject(feature, projection, 'EPSG:4326');
            }
            GeoPackage.addGeoJSONFeatureToGeoPackage(geopackage, feature, tableName, function() {
              if (count++ % fivePercent === 0) {
                progressCallback({
                  status: 'Inserting features into table "' + tableName + '"',
                  completed: count,
                  total: featureCount
                }, callback);
              } else {
                callback();
              }
            });
          });
        }, function done(err) {
          progressCallback({
            status: 'Done inserted features into table "' + tableName + '"'
          }, function() {
            callback(err, geopackage);
          });
        });
      }
    ], function(err) {
      console.log('Completed ' + tableName);
      if (reader) {
        reader.close(function() {
          shapefileFinished(err);
        });
      } else {
        shapefileFinished(err);
      }
    });
  }, function done(err) {
    callback(err, geopackage);
  });
}

function getReadersFromZip(zip) {
  console.log('get readers from zip');
  var readers = [];
  var shpfileArray = zip.filter(function (relativePath, file){
    console.log('relativePath', relativePath);
    return path.extname(relativePath) === '.shp';
  });
  var dbffileArray = zip.filter(function (relativePath, file){
    return path.extname(relativePath) === '.dbf';
  });
  var prjfileArray = zip.filter(function (relativePath, file){
    return path.extname(relativePath) === '.prj';
  });

  for (var i = 0; i < shpfileArray.length; i++) {
    var shapeZipObject = shpfileArray[i];
    console.log('shapeZipObject', shapeZipObject);
    var shpBuffer = shapeZipObject.asNodeBuffer();
    var shpStream = new stream.PassThrough();
    shpStream.end(shpBuffer);

    var basename = shapeZipObject.name.substring(0,shapeZipObject.name.length-4);

    var dbfStream;

    for (var d = 0; d < dbffileArray.length; d++) {
      var dbfZipObject = dbffileArray[d];
      if (dbfZipObject.name == basename + '.dbf') {
        var dbfBuffer = dbfZipObject.asNodeBuffer();
        dbfStream = new stream.PassThrough();
        dbfStream.end(dbfBuffer);
        break;
      }
    }

    var projection;

    for (var p = 0; p < prjfileArray.length; p++) {
      var prjZipObject = prjfileArray[p];
      if (prjZipObject.name == basename + '.prj') {
        var prjBuffer = prjZipObject.asNodeBuffer();
        projection = proj4.Proj(prjBuffer.toString());
        break;
      }
    }
    readers.push({
      tableName: basename,
      projection: projection,
      reader: shp.reader({
        shp: shpStream,
        dbf: dbfStream,
        'ignore-properties': !!dbfStream
      })
    });
  }
  return readers;
}

function setupConversion(options, progressCallback, doneCallback) {
  if (!progressCallback) {
    progressCallback = function(status, cb) {
      cb();
    }
  }

  var geopackage = options.geopackage;

  var readers = [];

  async.waterfall([
    function(callback) {
      if (options.shapezipData) {
        try {
          var zip = new jszip();
          zip.load(options.shapezipData);
          readers = getReadersFromZip(zip);
        } catch (e) {
          return callback(e);
        }
        callback();
      } else if (options.shapeData) {
        var shpStream = new stream.PassThrough();
        var shpBuffer = new Buffer(options.shapeData);
        shpStream.end(shpBuffer);

        var dbfStream;
        if (options.dbfData) {
          dbfStream = new stream.PassThrough();
          var dbfBuffer = new Buffer(options.dbfData);
          dbfStream.end(dbfBuffer);
        }

        readers.push({
          tableName: 'features',
          reader: shp.reader({
            dbf: dbfStream,
            "ignore-properties": !!options.dbfData,
            shp: shpStream
          })
        });
        callback();
      } else {
        var extension = path.extname(options.shapefile);
        if (extension.toLowerCase() === '.zip') {
          fs.readFile(options.shapefile, function(err, data) {
            var zip = new jszip();
            zip.load(data);
            readers = getReadersFromZip(zip);
            callback();
          });
        } else {
          dbf = path.basename(options.shapefile, path.extname(options.shapefile)) + '.dbf';
          try {
            var stats = fs.statSync(dbf);
            readers.push({
              tableName: path.basename(options.shapefile, path.extname(options.shapefile)),
              reader: shp.reader(options.shapefile)
            });
          } catch (e) {
            readers.push({
              tableName: path.basename(options.shapefile, path.extname(options.shapefile)),
              reader: shp.reader(options.shapefile, {
                "ignore-properties": true
              })
            });
          }
          callback();
        }
      }
    },
    // create or open the geopackage
    function(callback) {
      console.log('create or open geopackage');
      if (typeof geopackage === 'object') {
        return progressCallback({status: 'Opening GeoPackage'}, function() {
          callback(null, geopackage);
        });
      }

      try {
        var stats = fs.statSync(geopackage);
        console.log('stats', stats);
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
      convertShapefileReaders(readers, geopackage, progressCallback, callback);
    }
  ], function done(err, geopackage) {
    doneCallback(err, geopackage);
  });
};
