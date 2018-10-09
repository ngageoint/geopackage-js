var GeoPackage = require('@ngageoint/geopackage')
  , GeoJSONToGeoPackage = require('@ngageoint/geojson-to-geopackage');

var fs = require('fs')
  , path = require('path')
  , PBF = require('pbf')
  , clip = require('geojson-clip-polygon')
  , GlobalMercator = require('global-mercator')
  , VectorTile = require('@mapbox/vector-tile').VectorTile;

module.exports.addLayer = function(options, progressCallback) {
  progressCallback = progressCallback || function() { return Promise.resolve(); };

  options.append = true;

  return setupConversion(options, progressCallback);
};

module.exports.convert = function(options, progressCallback, doneCallback) {
  progressCallback = progressCallback || function() { return Promise.resolve(); };

  options.append = options.append || false;

  return setupConversion(options, progressCallback);
};

module.exports.extract = function(geopackage, tableName) {
  var geoJson = {
    type: 'FeatureCollection',
    features: []
  };
  var iterator = GeoPackage.iterateGeoJSONFeaturesFromTable(geopackage, tableName);
  for (var feature of iterator.results) {
    geoJson.features.push(feature);
  }
  return Promise.resolve(geoJson);
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
          console.log('open geopackage');
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
  var pbf = options.pbf;
  var append = options.append;

  return createOrOpenGeoPackage(geopackage, options, progressCallback)
  .then(function(results) {
    if (typeof pbf === 'string') {
      return progressCallback({status: 'Reading PBF file'})
      .then(function() {
        return new Promise(function(resolve, reject) {
          fs.readFile(pbf, function(err, buffer) {
            resolve({
              geopackage: results.geopackage,
              buffer: buffer
            });
          });
        });
      });
    } else {
      return {
        geopackage: results.geopackage,
        buffer: pbf
      };
    }
  })
  .then(function(results) {
    var pbf = new PBF(results.buffer);
    var tile = new VectorTile(pbf);
    return Object.keys(tile.layers).reduce(function(sequence, layerName) {
      return sequence.then(function() {
        var layer = tile.layers[layerName];
        var geojson = {
          "type": "FeatureCollection",
          "features": []
        };

        for (var i = 0; i < layer.length; i++) {
          var feature = layer.feature(i);
          var featureJson = feature.toGeoJSON(options.x, options.y, options.zoom);
          geojson.features.push(featureJson);
        }
        return correctGeoJson(geojson, options.x, options.y, options.zoom);
      })
      .then(function(correctedGeoJson) {
        return convertGeoJSONToGeoPackage(correctedGeoJson, geopackage, layerName, progressCallback);
      });
    }, Promise.resolve());
  });
};

function correctGeoJson(geoJson, x, y, z) {
  var tileBounds = GlobalMercator.googleToBBox([x, y, z]);

  var correctedGeoJson = {
    type: 'FeatureCollection',
    features: []
  };
  return geoJson.features.reduce(function(sequence, feature) {
    return sequence.then(function() {
      var props = feature.properties;
      var ogfeature = feature;
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
        return;
      }

      // split if necessary
      return feature.geometry.coordinates.reduce(function(sequence, coords) {
        return sequence.then(function(){
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
        });
      }, Promise.resolve());
    });
  }, Promise.resolve())
  .then(function() {
    return correctedGeoJson;
  });
}

function convertGeoJSONToGeoPackage(geojson, geopackage, tableName, progressCallback) {
  return GeoJSONToGeoPackage.convert({
    geojson: geojson,
    geopackage: geopackage,
    tableName: tableName,
    append: true
  }, progressCallback);
}
