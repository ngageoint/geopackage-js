var GeoPackage = require('geopackage');

var fs = require('fs')
  , async = require('async')
  , path = require('path')
  , stream = require('stream')
  , shp = require('shp-stream')
  , shpwrite = require('shp-write')
  , jszip = require('jszip');

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
  var geoJson = {
    type: 'FeatureCollection',
    features: []
  };
  if (!tableName) {
    geopackage.getFeatureTables(function(err, tables) {
      createShapefile(geopackage, tables, callback);
    });
  } else {
    createShapefile(geopackage, tableName, callback);
  }
};

function createShapefile(geopackage, tableName, callback) {
  if (!(tableName instanceof Array)) {
    tableName = [tableName];
  }
  async.eachSeries(tableName, function(name, callback) {
    GeoPackage.iterateGeoJSONFeaturesFromTable(geopackage, tableName, function(err, feature, done) {
      geoJson.features.push(feature);
      done();
    }, callback);
  }, function(err) {
    var zip = shpwrite.zip(geoJson);
    callback(err, zip);
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
    function(callback) {
      if (options.shapezipData) {
        var zip = new jszip();
        zip.load(options.shapezipData);
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
      } else if (options.shapeData) {
        reader = shp.reader({
          dbf: options.dbfData,
          "ignore-properties": !!options.dbfData,
          shp: options.shapeData
        });
      } else {
        var extension = path.extname(options.shapefile);

        if (extension.toLowerCase() === '.zip') {
          fs.readFile(options.shapefile, function(err, data) {
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
          });
        } else {
          dbf = path.basename(options.shapefile, path.extname(options.shapefile)) + '.dbf';
          try {
            var stats = fs.statSync(dbf);
            reader = shp.reader(options.shapefile);
          } catch (e) {
            reader = shp.reader(options.shapefile, {
              "ignore-properties": true
            });
          }
        }
      }
      callback();
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
      var name = 'features';
      if (typeof options.shapefile === 'string') {
        name = path.basename(options.shapefile, path.extname(options.shapefile));
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
        if (prop.name.toLowerCase() !== 'id') {
          columns.push(FeatureColumn.createColumnWithIndex(index, prop.name, DataTypes.fromName(prop.type), false, null));
          index++;
        }
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
