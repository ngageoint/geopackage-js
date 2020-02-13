var GeoPackage = require('@ngageoint/geopackage');

var fs = require('fs')
  , async = require('async')
  , path = require('path')
  , stream = require('stream')
  , bbox = require('@turf/bbox')
  , wkx = require('wkx')
  , CSVStream = require('csv-streamify');

module.exports.addLayer = function(options, progressCallback) {
  progressCallback = progressCallback || function() { return Promise.resolve(); };

  options.append = true;

  return setupConversion(options, progressCallback);
};

module.exports.convert = function(options, progressCallback) {
  progressCallback = progressCallback || function() { return Promise.resolve(); };

  options.append = false;

  return setupConversion(options, progressCallback);
};

module.exports.extract = function(geopackage, tableName) {
  var geoJson = {
    type: 'FeatureCollection',
    features: []
  };
  var properties = {};
  var iterator = GeoPackage.iterateGeoJSONFeaturesFromTable(geopackage, tableName);
  for (var feature of iterator.results) {
    for (var prop in feature.properties) {
      properties[prop] = true;
    }
    geoJson.features.push(feature);
  }

  var csvString = '';

  var fields = ['geometry'];
  for (var prop in properties) {
    fields.push(prop);
  }

  csvString += fields.join(',');
  csvString += '\n';

  for (var i = 0; i < geoJson.features.length; i++) {
    var feature = geoJson.features[i];
    var row = [];
    for (var f = 0; f < fields.length; f++) {
      var field = fields[f];
      if (field === 'geometry') {
        row.push('"'+wkx.Geometry.parseGeoJSON(feature.geometry).toWkt()+'"');
      }
      if (feature.properties[field]) {
        row.push(feature.properties[field]);
      } else {
        row.push(undefined);
      }
    }
    csvString += row.join(',');
    csvString += '\n';
  }
  return Promise.resolve(csvString);
};

function createOrOpenGeoPackage(geopackage, options, progressCallback) {
  return Promise.resolve()
  .then(function() {
    if (typeof geopackage === 'object') {
      return progressCallback({status: 'Opening GeoPackage'})
      .then(function() {
        return geopackage;
      });
    } else {
      try {
        var stats = fs.statSync(geopackage);
        if (!options.append) {
          console.log('GeoPackage file already exists, refusing to overwrite ' + geopackage);
          throw new Error('GeoPackage file already exists, refusing to overwrite ' + geopackage);
        } else {
          console.log('Open the GeoPackage');
          return GeoPackage.open(geopackage);
        }
      } catch (e) {}
      return progressCallback({status: 'Creating GeoPackage'})
      .then(function() {
        console.log('Create new geopackage', geopackage);
        return GeoPackage.create(geopackage);
      });
    }
  });
}

function setupConversion(options, progressCallback) {
  var geopackage = options.geopackage;
  var srsNumber = options.srsNumber || 4326;
  var append = options.append;
  var csv = options.csv;

  return createOrOpenGeoPackage(geopackage, options, progressCallback)
  .then(function(geopackage) {
    // figure out the table name to put the data into
    var name = 'features';
    if (options.csv && typeof options.csv === 'string') {
      name = path.basename(csv, path.extname(csv));
    }
    var tables = geopackage.getFeatureTables();
    var count = 1;
    while(tables.indexOf(name) !== -1) {
      name = name + '_' + count;
      count++;
    }
    return {
      geopackage: geopackage,
      options: options,
      tableName: name
    };
  })
  .then(function(results) {
    return progressCallback({status: 'Reading CSV file'})
    .then(function() {
      return new Promise(function(resolve, reject) {
        var parser = CSVStream({
          delimiter: options.delimiter || ',',
          newline: options.newline || '\r\n',
          objectMode: true,
          columns: true
        });

        var geoJson = {
          type: 'FeatureCollection',
          features: []
        };

        parser.on('data', function(line) {
          var gj = {
            type: 'Feature',
            properties: line
          };
          if (line.WKT || line.wkt) {
            var geom = wkx.Geometry.parse(line.WKT || line.wkt).toGeoJSON();
            gj.geometry = geom;
          } else if (line.latitude && line.longitude) {
            gj.geometry = {
              type: 'Point',
              coordinates: [
                line.longitude,
                line.latitude
              ]
            }
          } else if (line.lat && line.lng) {
            gj.geometry = {
              type: 'Point',
              coordinates: [
                line.lng,
                line.lat
              ]
            }
          } else if (line.lat && line.lon) {
           gj.geometry = {
             type: 'Point',
             coordinates: [
               line.lon,
               line.lat
             ]
           }
          } else if (line.CoordY && line.CoordX) {
            gj.geometry = {
              type: 'Point',
              coordinates: [
                line.CoordX,
                line.CoordY
              ]
            }
          } else if (line.y && line.x) {
            gj.geometry = {
              type: 'Point',
              coordinates: [
                line.x,
                line.y
              ]
            }
          }
          geoJson.features.push(gj);
        });


        if (options.csv && typeof options.csv === 'string') {
          fs.createReadStream(csv).pipe(parser).on('end', function() {
            resolve({
              geopackage: results.geopackage,
              tableName: results.tableName,
              geoJson: geoJson
            })
          });
        } else if (options.csvData) {
          var bufferStream = new stream.PassThrough();
          bufferStream.end(options.csvData);
          bufferStream.pipe(parser).on('end', function() {
            resolve({
              geopackage: results.geopackage,
              tableName: results.tableName,
              geoJson: geoJson
            });
          });
        }
      });
    });
  })
  .then(function(results) {
    var geoJson = results.geoJson;
    var geopackage = results.geopackage;
    var tableName = results.tableName;

    var correctedGeoJson = {
      type: 'FeatureCollection',
      features: []
    };

    var properties = {};

    return geoJson.features.reduce(function(sequence, feature) {
      return sequence.then(function() {
        addFeatureProperties(feature, properties);
        var splitType = '';
        if (feature.geometry.type === 'MultiPolygon') {
          splitType = 'Polygon';
        } else if (feature.geometry.type === 'MultiLineString') {
          splitType = 'LineString';
        } else {
          correctedGeoJson.features.push(feature);
          return;
        }

        // split if necessary
        return feature.geometry.coordinates.reduce(function(splitSequence, coords) {
          return splitSequence.then(function() {
            correctedGeoJson.features.push({
              type: 'Feature',
              properties: feature.properties,
              geometry: {
                type: splitType,
                coordinates: coords
              }
            });
          });
        }, Promise.resolve());
      });
    }, Promise.resolve())
    .then(function() {
      return {
        geopackage: results.geopackage,
        tableName: results.tableName,
        geoJson: correctedGeoJson,
        properties: properties
      }
    });
  })
  .then(function(results) {
    return convertGeoJSONToGeoPackage(results.geoJson, results.geopackage, results.tableName, results.properties, progressCallback);
  });
};

function addFeatureProperties(feature, currentProperties) {
  if (feature.properties.geometry) {
    feature.properties.geometry_property = feature.properties.geometry;
    delete feature.properties.geometry;
  }

  if (feature.id) {
    if (!currentProperties['_feature_id']) {
      currentProperties['_feature_id'] = currentProperties['_feature_id'] || {
        name: '_feature_id'
      };
    }
  }

  for (var key in feature.properties) {
    if (!currentProperties[key]) {
      currentProperties[key] = currentProperties[key] || {
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
        currentProperties[key] = {
          name: key,
          type: type
        };
      }
    }
  }
}

function convertGeoJSONToGeoPackage(geoJson, geopackage, tableName, properties, progressCallback) {
  return convertGeoJSONToGeoPackageWithSrs(geoJson, geopackage, tableName, properties, 4326, progressCallback);
}

function convertGeoJSONToGeoPackageWithSrs(geoJson, geopackage, tableName, properties, srsNumber, progressCallback) {

  var FeatureColumn = GeoPackage.FeatureColumn;
  var GeometryColumns = GeoPackage.GeometryColumns;
  var DataTypes = GeoPackage.DataTypes;

  var geometryColumns = new GeometryColumns();
  geometryColumns.table_name = tableName;
  geometryColumns.column_name = 'geometry';
  geometryColumns.geometry_type_name = 'GEOMETRY';
  geometryColumns.z = 2;
  geometryColumns.m = 2;

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
  return progressCallback({status: 'Creating table "' + tableName + '"'})
  .then(function() {
    var tmp = bbox(geoJson);
    var boundingBox = new GeoPackage.BoundingBox(Math.max(-180, tmp[0]), Math.min(180, tmp[2]), Math.max(-90, tmp[1]), Math.min(90, tmp[3]));
    return GeoPackage.createFeatureTableWithDataColumnsAndBoundingBox(geopackage, tableName, geometryColumns, columns, null, boundingBox, srsNumber);
  })
  .then(function(featureDao) {
    var count = 0;
    var featureCount = geoJson.features.length;
    var fivePercent = Math.floor(featureCount / 20);

    return geoJson.features.reduce(function(sequence, feature) {
      return sequence.then(function() {
        if (feature.id) {
          feature.properties._feature_id = feature.id;
        }

        if (feature.properties.id) {
          feature.properties._properties_id = feature.properties.id;
          delete feature.properties.id;
        }
        if (feature.properties.ID) {
          feature.properties._properties_ID = feature.properties.ID;
          delete feature.properties.ID;
        }
        var featureId = GeoPackage.addGeoJSONFeatureToGeoPackage(geopackage, feature, tableName);
        if (count++ % fivePercent === 0) {
          return progressCallback({
            status: 'Inserting features into table "' + tableName + '"',
            completed: count,
            total: featureCount
          });
        }
      });
    }, Promise.resolve())
    .then(function() {
      return progressCallback({
        status: 'Done inserted features into table "' + tableName + '"'
      });
    });
  }).then(function() {
    return geopackage;
  });
}
