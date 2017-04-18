var GeoPackage = require('@ngageoint/geopackage');

var fs = require('fs')
  , async = require('async')
  , path = require('path')
  , PBF = require('pbf')
  , clip = require('geojson-clip-polygon')
  //, intersect = require('@turf/intersect')
  , GlobalMercator = require('global-mercator')
  , VectorTile = require('vector-tile').VectorTile;

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
      async.forEachOf(tile.layers, function(layer, layerName, layerDone){
        console.log('layerName', layerName);
        var geojson = {
          "type": "FeatureCollection",
          "features": []
        };

        for (var i = 0; i < layer.length; i++) {
          var feature = layer.feature(i);
          var featureJson = feature.toGeoJSON(options.x, options.y, options.zoom);
          geojson.features.push(featureJson);
        }
        correctGeoJson(geojson, options.x, options.y, options.zoom, function(err, correctedGeoJson) {
          convertGeoJSONToGeoPackage(correctedGeoJson, geopackage, layerName, progressCallback, function(err, geopackage){
            layerDone();
          });
        });
      }, function() {
        callback(null, geopackage);
      });
    }
  ], doneCallback);
};

function correctGeoJson(geoJson, x, y, z, callback) {
  var tileBounds = GlobalMercator.googleToBBox([x, y, z]);

  var correctedGeoJson = {
    type: 'FeatureCollection',
    features: []
  };
  async.eachSeries(geoJson.features, function featureIterator(feature, featureCallback) {
    var props = feature.properties;
    var ogfeature = feature;
    async.setImmediate(function() {
      var splitType = '';
      if (feature.geometry.type === 'MultiPolygon') {
        splitType = 'Polygon';
      } else if (feature.geometry.type === 'MultiLineString') {
        splitType = 'LineString';
      } else {
        if (feature.geometry.type === 'Polygon') {
          var geometry = clip({
            "type": "Feature",
            "properties": {},
            "geometry": {
              "type": "Polygon",
              "coordinates": [
                [
                  [
                    tileBounds[0],
                    tileBounds[1]
                  ],
                  [
                    tileBounds[0],
                    tileBounds[3]
                  ],
                  [
                    tileBounds[2],
                    tileBounds[3]
                  ],
                  [
                    tileBounds[2],
                    tileBounds[1]
                  ],
                  [
                    tileBounds[0],
                    tileBounds[1]
                  ]
                ]
              ]
            }
          }, feature);
          feature = geometry;
        }
        if (feature && feature.geometry) {
          feature.properties = props;
          correctedGeoJson.features.push(feature);
        } else {
          correctedGeoJson.features.push(ogfeature);
        }
        return featureCallback();
      }

      // split if necessary
      async.eachSeries(feature.geometry.coordinates, function splitIterator(coords, splitCallback) {
        async.setImmediate(function() {
          var f = {
            "type": "Feature",
            "properties": {},
            "geometry": {
              type: splitType,
              coordinates: coords
            }
          };
          if (splitType === 'Polygon') {
            f = clip({
              "type": "Feature",
              "properties": {},
              "geometry": {
                "type": "Polygon",
                "coordinates": [
                  [
                    [
                      tileBounds[0],
                      tileBounds[1]
                    ],
                    [
                      tileBounds[0],
                      tileBounds[3]
                    ],
                    [
                      tileBounds[2],
                      tileBounds[3]
                    ],
                    [
                      tileBounds[2],
                      tileBounds[1]
                    ],
                    [
                      tileBounds[0],
                      tileBounds[1]
                    ]
                  ]
                ]
              }
            }, f);
          }
          if (f && f.geometry) {
            f.properties = props;
            correctedGeoJson.features.push(f);
          } else {
            correctedGeoJson.features.push({
              "type": "Feature",
              "properties": props,
              "geometry": {
                type: splitType,
                coordinates: coords
              }
            });
          }
          splitCallback();
        });
      }, featureCallback);

    });
  }, function done() {
    callback(null, correctedGeoJson);
  });
}


function convertGeoJSONToGeoPackage(geoJson, geopackage, tableName, progressCallback, callback) {
  async.waterfall([function(callback) {
    var properties = {};
    var count = 0;
    var featureCount = geoJson.features.length;
    var fivePercent = Math.floor(featureCount/20);
    progressCallback({status: 'Reading GeoJSON feature properties'}, function() {
      // first loop to find all properties of all features.  Has to be a better way...
      async.eachSeries(geoJson.features, function featureIterator(feature, callback) {
        if (!feature.geometry) {
          console.log('feature with no geometry', feature);
        }
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
      GeoPackage.createFeatureTable(geopackage, tableName, geometryColumns, columns, function(err, featureDao) {
        callback(err, featureDao);
      });
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
      }, function() {
        callback(null, geopackage);
      });
    });
  }

], callback);
}
