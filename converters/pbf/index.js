var GeoPackage = require('geopackage');

var fs = require('fs')
  , async = require('async')
  , path = require('path')
  , PBF = require('pbf')
  , VectorTile = require('vector-tile').VectorTile
  , ViewportMercator = require('viewport-mercator-project');

module.exports.addLayer = function(options, progressCallback, doneCallback) {
  doneCallback = arguments[arguments.length - 1];
  progressCallback = typeof arguments[arguments.length - 2] === 'function' ? arguments[arguments.length - 2] : undefined;

  options.append = true;

  setupConversion(options, progressCallback, doneCallback);
};

module.exports.convert = function(options, progressCallback, doneCallback) {
  doneCallback = arguments[arguments.length - 1];
  progressCallback = typeof arguments[arguments.length - 2] === 'function' ? arguments[arguments.length - 2] : undefined;

  options.append = options.append || false;

  setupConversion(options, progressCallback, doneCallback);
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
    callback(err, geoJson);
  });
};

function setupConversion(options, progressCallback, doneCallback) {
  if (!progressCallback) {
    progressCallback = function(status, cb) {
      cb();
    }
  }

  var geopackage = options.geopackage;
  var pbf = options.pbf;
  var append = options.append;

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
      if (options.tableName) {
        return callback(null, geopackage, options.tableName);
      }
      var name = 'features';
      if (typeof pbf === 'string') {
        name = path.basename(pbf, path.extname(pbf));
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
    // get the PBF data
    function(geopackage, tableName, callback) {

      if (typeof pbf === 'string') {
        progressCallback({status: 'Reading PBF file'}, function() {
          fs.readFile(pbf, function(err, data) {
            callback(null, geopackage, tableName, data);
          });
        });
      } else {
        callback(null, geopackage, tableName, pbf);
      }
    },
    function(geopackage, tableName, buffer, callback) {
      var pbf = new PBF(buffer);
      var tile = new VectorTile(pbf);
      var densitymap = tile.layers.traffic;
      // console.log('tile.layers.densitymap.length', densitymap.length);

      var geojson = {
        "type": "FeatureCollection",
        "features": []
      };

      // calculate the center of the tile in lat lon
      var latlng = [0,0];
      var viewport = ViewportMercator({
        longitude: latlng[1],
        latitude: latlng[0],
        tileSize: densitymap.extent,
        zoom: 0,
        width: densitymap.extent,
        height: densitymap.extent
      });

      for (var i = 0; i < densitymap.length; i++) {
        var feature = densitymap.feature(i);
        var bbox = feature.bbox();
        var ur = viewport.unproject([bbox[0], bbox[1]]);
        var ll = viewport.unproject([bbox[2], bbox[3]]);

        var feature = {
          "type": "Feature",
          "properties": feature.properties,
          "geometry": {
            "type": "Polygon",
            "coordinates": [
              [ur, [ur[0],ll[1]], ll, [ll[0], ur[1]], ur]
            ]
          }
        };
        geojson.features.push(feature);
      }
      callback(null, geopackage, tableName, geojson);
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
          if (feature.properties.geometry) {
            feature.properties.geometry_property = feature.properties.geometry;
            delete feature.properties.geometry;
          }
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
      if (prop.name.toLowerCase() !== 'id') {
        columns.push(FeatureColumn.createColumnWithIndex(index, prop.name, DataTypes.fromName(prop.type), false, null));
        index++;
      }
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
