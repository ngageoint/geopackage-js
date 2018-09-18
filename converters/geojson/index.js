var GeoPackage = require('@ngageoint/geopackage');

var fs = require('fs')
  , async = require('async')
  , path = require('path')
  , bbox = require('@turf/bbox')
  , JSONStream = require('JSONStream');

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
  GeoPackage.iterateGeoJSONFeaturesFromTable(geopackage, tableName, function(err, feature, done) {
    geoJson.features.push(feature);
    done();
  }, function(err) {
    callback(err, geoJson);
  });
};

function setupConversion(options, progressCallback, doneCallback) {
  var geopackage = options.geopackage;
  var srsNumber = options.srsNumber || 4326;
  var append = options.append;
  var geoJson = options.geoJson;

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
      console.log('geojson file', geoJson);
      // if (typeof geoJson === 'string') {
      //   progressCallback({status: 'Reading GeoJSON file'}, function() {
      //
      //     var readStream = fs.createReadStream(geoJson, {encoding: 'utf8'});
      //     var parser = JSONStream.parse('features.*');
      //
      //     readStream.pipe(parser);
      //     parser.on('data', function(data) {
      //       console.log('received', data);
      //     });
      //
      //     parser.on('end', function() {
      //       callback(null);
      //     });
      //
      //
      //     // fs.readFile(geoJson, 'utf8', function(err, data) {
      //     //   console.log('err', err);
      //     //   console.log('data', data);
      //     //   geoJson = JSON.parse(data);
      //     //   console.log('geoJson.features.length', geoJson.features.length);
      //     //   callback(null, geopackage, tableName, geoJson);
      //     // });
      //   });
      // } else {
        callback(null, geopackage, tableName, geoJson);
      // }
    },
    // function(geopackage, tableName, geoJson, callback) {
    //   var correctedGeoJson = {
    //     type: 'FeatureCollection',
    //     features: []
    //   };
    //   async.eachSeries(geoJson.features, function featureIterator(feature, featureCallback) {
    //     async.setImmediate(function() {
    //       var splitType = '';
    //       if (feature.geometry.type === 'MultiPolygon') {
    //         splitType = 'Polygon';
    //       } else if (feature.geometry.type === 'MultiLineString') {
    //         splitType = 'LineString';
    //       } else {
    //         correctedGeoJson.features.push(feature);
    //         return featureCallback();
    //       }
    //
    //       // split if necessary
    //       async.eachSeries(feature.geometry.coordinates, function splitIterator(coords, splitCallback) {
    //         async.setImmediate(function() {
    //           correctedGeoJson.features.push({
    //             type: 'Feature',
    //             properties: feature.properties,
    //             geometry: {
    //               type: splitType,
    //               coordinates: coords
    //             }
    //           });
    //           splitCallback();
    //         });
    //       }, featureCallback);
    //
    //     });
    //   }, function done() {
    //     callback(null, geopackage, tableName, correctedGeoJson);
    //   });
    // },
    // Go
    function(geopackage, tableName, geoJson, callback) {
      convertGeoJSONToGeoPackage(geoJson, geopackage, tableName, progressCallback, doneCallback);
    }
  ], function done(err) {
    doneCallback(err, geopackage);
  });
};

function convertGeoJSONToGeoPackage(geoJson, geopackage, tableName, progressCallback, callback) {
  convertGeoJSONToGeoPackageWithSrs(geoJson, geopackage, tableName, 4326, progressCallback, callback);
}

function convertGeoJSONToGeoPackageWithSrs(geoJson, geopackage, tableName, srsNumber, progressCallback, callback) {
  async.waterfall([function(callback) {
    var properties = {};
    var count = 0;
    // var featureCount = geoJson.features.length;
    // var fivePercent = Math.floor(featureCount/20);
    progressCallback({status: 'Reading GeoJSON feature properties'}, function() {
      // first loop to find all properties of all features.  Has to be a better way...
      // async.eachSeries(geoJson.features, function featureIterator(feature, callback) {
      //   async.setImmediate(function() {
      //     if (feature.properties.geometry) {
      //       feature.properties.geometry_property = feature.properties.geometry;
      //       delete feature.properties.geometry;
      //     }
      //
      //     if (feature.id) {
      //       if (!properties['_feature_id']) {
      //         properties['_feature_id'] = properties['_feature_id'] || {
      //           name: '_feature_id'
      //         };
      //       }
      //     }
      //
      //     for (var key in feature.properties) {
      //       if (!properties[key]) {
      //         properties[key] = properties[key] || {
      //           name: key
      //         };
      //
      //         var type = typeof feature.properties[key];
      //         if (feature.properties[key] !== undefined && feature.properties[key] !== null && type !== 'undefined') {
      //           if (type === 'object') {
      //             if (feature.properties[key] instanceof Date) {
      //               type = 'Date';
      //             }
      //           }
      //           switch(type) {
      //             case 'Date':
      //               type = 'DATETIME';
      //               break;
      //             case 'number':
      //               type = 'DOUBLE';
      //               break;
      //             case 'string':
      //               type = 'TEXT';
      //               break;
      //             case 'boolean':
      //               type = 'BOOLEAN';
      //               break;
      //           }
      //           properties[key] = {
      //             name: key,
      //             type: type
      //           };
      //         }
      //       }
      //     }
      //     if (count++ % fivePercent === 0) {
      //       progressCallback({
      //         status: 'Reading GeoJSON feature properties',
      //         completed: count,
      //         total: featureCount
      //       }, callback);
      //     } else {
      //       callback();
      //     }
      //   });
      // }, function done(err) {
      //   progressCallback({
      //     status: 'Done reading GeoJSON properties'
      //   }, function() {
          callback(null, properties);
      //   });
      // });
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
      } else if (prop.name.toLowerCase() === 'id') {
        columns.push(FeatureColumn.createColumnWithIndex(index, '_properties_'+prop.name, DataTypes.fromName(prop.type), false, null));
        index++;
      }
    }
    progressCallback({status: 'Creating table "' + tableName + '"'}, function() {
      // var tmp = bbox(geoJson);
      var tmp = [-180, -90, 180, 90];
      var boundingBox = new GeoPackage.BoundingBox(Math.max(-180, tmp[0]), Math.min(180, tmp[2]), Math.max(-90, tmp[1]), Math.min(90, tmp[3]));
      GeoPackage.createFeatureTableWithDataColumnsAndBoundingBox(geopackage, tableName, geometryColumns, columns, null, boundingBox, srsNumber, callback);
    });
  }, function(featureDao, callback) {
    var count = 0;
    if (typeof geoJson === 'string') {
      progressCallback({status: 'Reading GeoJSON file'}, function() {

        var fti = featureDao.featureTableIndex;
        fti.getTableIndex(function(err, tableIndex) {
          if (tableIndex) {
            return callback(null, true);
          }
          fti.index(function() {
            console.log('progress', arguments);
          }, function(err) {
            var readStream = fs.createReadStream(geoJson, {encoding: 'utf8'});
            var parser = JSONStream.parse('features.*');

            readStream.pipe(parser);
            parser.on('data', function(feature) {
              // console.log('received', feature);
              GeoPackage.addGeoJSONFeatureToGeoPackageAndIndex(geopackage, feature, tableName, function() {
                console.log('count', count++);
                // if (count++ % fivePercent === 0) {
                //   progressCallback({
                //     status: 'Inserting features into table "' + tableName + '"',
                //     completed: count,
                //     total: featureCount
                //   }, callback);
                // } else {
                  callback();
                // }
              });
            });

            parser.on('end', function() {
              callback(null);
            });
          });
        });




        // fs.readFile(geoJson, 'utf8', function(err, data) {
        //   console.log('err', err);
        //   console.log('data', data);
        //   geoJson = JSON.parse(data);
        //   console.log('geoJson.features.length', geoJson.features.length);
        //   callback(null, geopackage, tableName, geoJson);
        // });
      });
    } else {
      callback(null, geopackage, tableName, geoJson);
    }



    // var featureCount = geoJson.features.length;
    // var fivePercent = Math.floor(featureCount / 20);
    // async.eachSeries(geoJson.features, function featureIterator(feature, callback) {
    //   async.setImmediate(function() {
    //     if (feature.id) {
    //       feature.properties._feature_id = feature.id;
    //     }
    //
    //     if (feature.properties.id) {
    //       feature.properties._properties_id = feature.properties.id;
    //       delete feature.properties.id;
    //     }
    //     if (feature.properties.ID) {
    //       feature.properties._properties_ID = feature.properties.ID;
    //       delete feature.properties.ID;
    //     }
    //
    //     GeoPackage.addGeoJSONFeatureToGeoPackage(geopackage, feature, tableName, function() {
    //       if (count++ % fivePercent === 0) {
    //         progressCallback({
    //           status: 'Inserting features into table "' + tableName + '"',
    //           completed: count,
    //           total: featureCount
    //         }, callback);
    //       } else {
    //         callback();
    //       }
    //     });
    //   });
    // }, function done() {
    //   progressCallback({
    //     status: 'Done inserted features into table "' + tableName + '"'
    //   }, callback);
    // });
  }

], function done(err) {
  callback(err, geopackage);
  });
}
