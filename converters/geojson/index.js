var GeoPackage = require('geopackage');

var fs = require('fs')
  , async = require('async')
  , path = require('path');

module.exports.convert = function(geoJson, callback) {

};

module.exports.convertFile = function(geoJsonFilePath, geopackageFilePath, progressCallback, callback) {
  if (!callback) {
    callback = progressCallback;
    progressCallback = function(status, cb) {
      cb();
    }
  }

  try {
    var stats = fs.statSync(geopackageFilePath);
    console.log('GeoPackage file already exists, refusing to overwrite ' + geopackageFilePath);
    return callback(new Error('GeoPackage file already exists, refusing to overwrite ' + geopackageFilePath));
  } catch (e) {}

  var geopackage;
  var tableName = path.basename(geopackageFilePath, path.extname(geopackageFilePath));
  var geoJson;

  async.waterfall([
    function(callback) {
      GeoPackage.createGeoPackage(geopackageFilePath, function(err, gp) {
        geopackage = gp;
        callback(err, gp);
      });
    }, function(geopackage, callback) {
      fs.readFile(geoJsonFilePath, 'utf8', callback);
    }, function(fileData, callback) {
      geoJson = JSON.parse(fileData);
      var properties = {};
      var count = 0;
      var featureCount = geoJson.features.length;
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
          progressCallback({
            status: 'Parsing properties',
            completed: count++,
            total: featureCount
          }, callback);
        });
      }, function done(err) {
        callback(err, properties);
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

      GeoPackage.createFeatureTable(geopackage, tableName, geometryColumns, columns, callback);
    }, function(featureDao, callback) {
      var count = 0;
      var featureCount = geoJson.features.length;
      async.eachSeries(geoJson.features, function featureIterator(feature, callback) {
        async.setImmediate(function() {
          GeoPackage.addGeoJSONFeatureToGeoPackage(geopackage, feature, tableName, function() {
            progressCallback({
              status: 'Parsing properties',
              completed: count++,
              total: featureCount
            }, callback);
          });
        });
      }, function done() {
        callback();
      });
    }

  ], function done() {
    callback();
  });
};
