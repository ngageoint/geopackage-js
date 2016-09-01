var GeoPackage = require('geopackage');

var fs = require('fs')
  , async = require('async')
  , path = require('path');

module.exports.addLayer = function(geoJson, geopackage, progressCallback, doneCallback) {
  setupConversion(geoJson, geopackage, progressCallback, doneCallback, true);
}

module.exports.convert = function(geoJson, geopackage, progressCallback, doneCallback) {
  setupConversion(geoJson, geopackage, progressCallback, doneCallback, false);
}

function setupConversion(geoJson, geopackage, progressCallback, doneCallback, append) {
  if (typeof geopackage === 'function') {
    doneCallback = progressCallback;
    progressCallback = geopackage;
    geopackage = undefined;
  }
  if (!doneCallback) {
    doneCallback = progressCallback;
    progressCallback = function(status, cb) {
      cb();
    }
  }
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
      if (typeof geoJson === 'string') {
        name = path.basename(geoJson, path.extname(geoJson));
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
    // get the GeoJSON data
    function(geopackage, tableName, callback) {
      if (typeof geoJson === 'string') {
        progressCallback({status: 'Reading GeoJSON file'}, function() {
          fs.readFile(geoJson, 'utf8', function(err, data) {
            geoJson = JSON.parse(data);
            callback(null, geopackage, tableName, geoJson);
          });
        });
      } else {
        callback(null, geopackage, tableName, geoJson);
      }
    },
    function(geopackage, tableName, geoJson, callback) {
      var correctedGeoJson = {
        type: 'FeatureCollection',
        features: []
      };
      async.eachSeries(geoJson.features, function featureIterator(feature, featureCallback) {
        async.setImmediate(function() {
          var splitType = '';
          if (feature.geometry.type === 'MultiPolygon') {
            splitType = 'Polygon';
          } else if (feature.geometry.type === 'MultiLineString') {
            splitType = 'LineString';
          } else {
            correctedGeoJson.features.push(feature);
            return featureCallback();
          }

          // split if necessary
          async.eachSeries(feature.geometry.coordinates, function splitIterator(coords, splitCallback) {
            async.setImmediate(function() {
              correctedGeoJson.features.push({
                type: 'Feature',
                properties: feature.properties,
                geometry: {
                  type: splitType,
                  coordinates: coords
                }
              });
              splitCallback();
            });
          }, featureCallback);

        });
      }, function done() {
        callback(null, geopackage, tableName, correctedGeoJson);
      });
    },
    // Go
    function(geopackage, tableName, geoJson, callback) {
      convertGeoJSONToGeoPackage(geoJson, geopackage, tableName, progressCallback, doneCallback);
    }
  ], function done(err) {
    doneCallback(err, geopackage);
  });
};

function convertGeoJSONToGeoPackage(geoJson, geopackage, tableName, progressCallback, callback) {
  async.waterfall([function(callback) {
    var properties = {};
    var count = 0;
    var featureCount = geoJson.features.length;
    var fivePercent = Math.floor(featureCount/20);
    progressCallback({status: 'Reading GeoJSON feature properties'}, function() {
      // first loop to find all properties of all features.  Has to be a better way...
      async.eachSeries(geoJson.features, function featureIterator(feature, callback) {
        async.setImmediate(function() {
          for (var key in feature.properties) {
            if (!properties[key]) {
              var type = typeof feature.properties[key];
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
          if (count++ % fivePercent === 0) {
            progressCallback({
              status: 'Reading GeoJSON feature properties',
              completed: count,
              total: featureCount
            }, callback);
          } else {
            callback();
          }
        });
      }, function done(err) {
        progressCallback({
          status: 'Done reading GeoJSON properties'
        }, function() {
          callback(err, properties);
        });
      });
    });
  }, function(properties, callback) {
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
      GeoPackage.createFeatureTable(geopackage, tableName, geometryColumns, columns, callback);
    });
  }, function(featureDao, callback) {
    var count = 0;
    var featureCount = geoJson.features.length;
    var fivePercent = Math.floor(featureCount / 20);
    async.eachSeries(geoJson.features, function featureIterator(feature, callback) {
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
    }, function done() {
      progressCallback({
        status: 'Done inserted features into table "' + tableName + '"'
      }, callback);
    });
  }

], function done(err) {
  callback(err, geopackage);
  });
}
