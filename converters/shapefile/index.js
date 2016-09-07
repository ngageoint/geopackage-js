var GeoPackage = require('geopackage');

var fs = require('fs')
  , async = require('async')
  , path = require('path')
  , stream = require('stream')
  , shp = require('shp-stream')
  , shpwrite = require('shp-write')
  , jszip = require('jszip');

module.exports.addLayer = function(shapefile, dbfStream, eopackage, progressCallback, doneCallback) {
  doneCallback = arguments[arguments.length - 1];
  progressCallback = typeof arguments[arguments.length - 2] === 'function' ? arguments[arguments.length - 2] : undefined;
  geopackage = progressCallback ? arguments[arguments.length - 3] : arguments[arguments.length - 2];
  if (dbfStream === geopackage) {
    dbfStream = undefined;
  }
  setupConversion(shapefile, dbfStream, geopackage, progressCallback, doneCallback, true);
};

module.exports.convert = function(shapefile, dbfStream, geopackage, progressCallback, doneCallback) {
  doneCallback = arguments[arguments.length - 1];
  progressCallback = typeof arguments[arguments.length - 2] === 'function' ? arguments[arguments.length - 2] : undefined;
  geopackage = progressCallback ? arguments[arguments.length - 3] : arguments[arguments.length - 2];
  if (dbfStream === geopackage) {
    dbfStream = undefined;
  }
  setupConversion(shapefile, dbfStream, geopackage, progressCallback, doneCallback, false);
};

module.exports.extract = function(geopackage, tableName, callback) {
  var geoJson = {
    type: 'FeatureCollection',
    features: []
  };
  GeoPackage.iterateGeoJSONFeaturesFromTable(geopackage, tableName, function(err, feature, done) {
    geoJson.features.push(feature);
    done();
  }, function(err) {
    var zip = shpwrite.zip(geoJson);
    callback(err, zip);
  });
};

function setupConversion(shapefile, dbfStream, geopackage, progressCallback, doneCallback, append) {
  if (!progressCallback) {
    progressCallback = function(status, cb) {
      cb();
    }
  }

  var reader;
  var features = [];

  async.waterfall([
    function(callback) {
      if (typeof shapefile !== 'string') {
        reader = shp.reader({
          dbf: dbfStream,
          "ignore-properties": !!dbfStream,
          shp: shapefile
        });
        callback();
      } else {
        var extension = path.extname(shapefile);

        if (extension.toLowerCase() === '.zip') {
          fs.readFile(shapefile, function(err, data) {
            var zip = new jszip();
            zip.load(data);
            var shpfile = zip.filter(function (relativePath, file){
              return path.extname(relativePath) === '.shp';
            });
            var dbffile = zip.filter(function (relativePath, file){
              return path.extname(relativePath) === '.dbf';
            });
            var shpBuffer = shpfile[0].asNodeBuffer();
            var shpStream = new stream.PassThrough();
            shpStream.end(shpBuffer);

            var dbfBuffer = dbffile[0].asNodeBuffer();
            var dbfStream = new stream.PassThrough();
            dbfStream.end(dbfBuffer);
            reader = shp.reader({
              shp: shpStream,
              dbf: dbfStream
            });
            callback();
          });
        } else {
          var dbf = path.basename(shapefile, path.extname(shapefile)) + '.dbf';
          try {
            var stats = fs.statSync(dbf);
            reader = shp.reader(shapefile);
          } catch (e) {
            reader = shp.reader(shapefile, {
              "ignore-properties": true
            });
          }
          callback();
        }
      }
    },
    // create or open the geopackage
    function(callback) {
      if (typeof geopackage === 'object') {
        return progressCallback({status: 'Opening GeoPackage'}, function() {
          callback(null, geopackage);
        });
      }

      try {
        var stats = fs.statSync(geopackage);
        if (!append) {
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
      var name = 'features';
      if (typeof shapefile === 'string') {
        name = path.basename(shapefile, path.extname(shapefile));
      }
      geopackage.getFeatureTables(function(err, tables) {
        var count = 1;
        while(tables.indexOf(name) !== -1) {
          name = name + '_' + count;
          count++;
        }
        callback(null, geopackage, name);
      });
    },
    function(geopackage, tableName, callback) {
      reader.readHeader(function(err, header) {
        callback(null, geopackage, tableName);
      });
    },
    // get the feature properties
    function(geopackage, tableName, callback) {

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
            features.push(feature);
            async.setImmediate(function() {
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
            callback(err, geopackage, tableName, properties);
          }
        );
      });
    }, function(geopackage, tableName, properties, callback) {
      var FeatureColumn = GeoPackage.FeatureColumn;
      var GeometryColumns = GeoPackage.GeometryColumns;
      var DataTypes = GeoPackage.DataTypes;

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
        columns.push(FeatureColumn.createColumnWithIndex(index, prop.name, DataTypes.fromName(prop.type), false, null));
        index++;
      }
      progressCallback({status: 'Creating table "' + tableName + '"'}, function() {
        GeoPackage.createFeatureTable(geopackage, tableName, geometryColumns, columns, function(err, featureDao) {
          callback(err, geopackage, tableName, featureDao);
        });
      });
    }, function(geopackage, tableName, featureDao, callback) {

      var count = 0;
      var featureCount = features.length;
      var fivePercent = Math.floor(featureCount / 20);
      async.eachSeries(features, function featureIterator(feature, callback) {
        async.setImmediate(function() {
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
  ], function done(err, geopackage) {
    reader.close(function() {
      doneCallback(err, geopackage);
    });
  });
};
