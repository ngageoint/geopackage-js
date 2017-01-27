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
      async.forEachOf(tile.layers, function(layer, layerName, layerDone){
        console.log('layerName', layerName);
        var geojson = {
          "type": "FeatureCollection",
          "features": []
        };

        // calculate the center of the tile in lat lon
        var latlng = options.tileCenter;
        var viewport = ViewportMercator({
          longitude: latlng[1],
          latitude: latlng[0],
          tileSize: layer.extent,
          zoom: options.zoom,
          width: layer.extent,
          height: layer.extent
        });

        for (var i = 0; i < layer.length; i++) {
          var feature = layer.feature(i);
          var featureJson = feature.toGeoJSON();
          var geom = feature.loadGeometry();
          var coords = [];
          if (featureJson.geometry.type === 'Polygon') {
            coords.push(translateCoordinateArray(geom[0], viewport));
          } else if (featureJson.geometry.type === 'LineString') {
            coords = translateCoordinateArray(geom[0], viewport);
          } else if (featureJson.geometry.type === 'MultiLineString') {
            coords.push(translateCoordinateArray(geom[0], viewport));
          } else {
            console.log('type: ' + featureJson.geometry.type);
            console.log('geom', geom);
            console.log('coords', coords);
            console.log('feature', JSON.stringify(featureJson, null, 2));
          }
          featureJson.geometry.coordinates = coords;
          geojson.features.push(featureJson);
        }
        convertGeoJSONToGeoPackage(geojson, geopackage, layerName, progressCallback, function(err, geopackage){
          layerDone();
        });
      }, function() {
        callback(null, geopackage);
      });
    }
  ], doneCallback);
};

function translateCoordinateArray(array, viewport) {
  var coords = [];
  for (var i = 0; i < array.length; i++) {
    if (array[i].length) {
      coords.push(translateCoordinateArray(array[i], viewport));
    } else {
      coords.push(translateCoordinate(array[i], viewport));
    }
  }
  return coords;
}

function translateCoordinate(coordinate, viewport) {
  return viewport.unproject([coordinate.x, coordinate.y]);
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
