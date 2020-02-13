'use strict';

var reproj = require('../'),
  expect = require('expect.js'),
  proj4 = require('proj4');

var sweref99tmWkt = '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
    rt90Wkt = '+lon_0=15.808277777799999 +lat_0=0.0 +k=1.0 +x_0=1500000.0 +y_0=0.0 +proj=tmerc +ellps=bessel +units=m +towgs84=414.1,41.3,603.1,-0.855,2.141,-7.023,0 +no_defs',
    sweref99tm = proj4.Proj(sweref99tmWkt),
    rt90 = proj4.Proj(rt90Wkt),
    crss = {
      'EPSG:3006': sweref99tm,
      'EPSG:2400': rt90
    };

// Simplistic shallow clone that will work for a normal GeoJSON object.
function clone(obj) {
  if (null === obj || 'object' !== typeof obj) return obj;
  var copy = obj.constructor();
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
  }
  return copy;
}

// Checks if `list` looks like a `[x, y]` or `[x, y, z]`.
function isCoordinate(list) {
  return (list.length === 2 || list.length === 3) &&
    typeof list[0] === 'number' &&
    typeof list[1] === 'number' && 
    (list.length === 3 ? typeof list[2] === 'number' : true);
}

// Move recursively through nested lists and call `callback` for each `[x,y]`.
// `callback` should return `[x,y]` which will be added to the final result.
// This is slower and more memory consuming then `transformInplace` but returns
// a new `Array`.
function assertCoords(actual, expected, precision) {
  if (isCoordinate(expected)) {
    expect(actual).to.be.coordinate(expected, precision);
  } else {
    expect(actual.length).to.be(expected.length);
    for (var i = 0; i < expected.length; i++) {
      assertCoords(actual[i], expected[i], precision);
    }
  }
}

expect.Assertion.prototype.coordinate = function(obj, precision) {
  this.assert(this.obj.length === 2 || this.obj.length === 3);
  this.assert(
    Math.abs(this.obj[0] - obj[0]) < precision &&
    Math.abs(this.obj[1] - obj[1]) < precision,
    function() { return 'expected ' + this.obj + ' to be a coordinate close to ' + obj + ' within +/-' + precision; },
    function() { return 'expected ' + this.obj + ' to not be a coordinate close to ' + obj + ' within +/-' + precision; });
  if (this.obj.length === 3) {
    this.assert(
      Math.abs(this.obj[2] - obj[2]) < precision,
      function() { return 'expected ' + this.obj[2] + ' to be an elevation close to ' + obj[2] + ' within +/-' + precision; },
      function() { return 'expected ' + this.obj[2] + ' to not be an elevation close to ' + obj[2] + ' within +/-' + precision; });
  }
};

expect.Assertion.prototype.geojson = function(obj, coordPrecision) {
  var copyThis = clone(this.obj),
    copyObj = clone(obj),
    i;

  coordPrecision = coordPrecision || 1e-5;

  delete copyThis.coordinates;
  delete copyObj.coordinates;
  delete copyThis.geometry;
  delete copyObj.geometry;
  delete copyThis.geometries;
  delete copyObj.geometries;
  delete copyThis.features;
  delete copyObj.features;
  delete copyThis.bbox;
  delete copyObj.bbox;

  expect(copyThis).to.eql(copyObj);
  if (obj.coordinates) {
    assertCoords(this.obj.coordinates, obj.coordinates, coordPrecision);
  }
  if (obj.geometry) {
    expect(this.obj.geometry).to.be.geojson(obj.geometry, coordPrecision);
  }
  if (obj.geometries) {
    for (i = 0; i < obj.geometries.length; i++) {
      expect(this.obj.geometries[i]).to.be.geojson(obj.geometries[i], coordPrecision);
    }
  }
  if (obj.features) {
    for (i = 0; i < obj.features.length; i++) {
      expect(this.obj.features[i]).to.be.geojson(obj.features[i], coordPrecision);
    }
  }
  if (obj.bbox) {
    for (i = 0; i < obj.bbox.length; i++) {
      this.assert(Math.abs(this.obj.bbox[i] - obj.bbox[i]) < coordPrecision,
        function() { return 'expected ' + this.obj.bbox + ' to be a bbox close to ' + obj.bbox + ' within +/-' + coordPrecision; },
        function() { return 'expected ' + this.obj.bbox + ' to not be a bbox close to ' + obj.bbox + ' within +/-' + coordPrecision; });
    }
  }
};

describe('toWgs84', function() {
  describe('primitives', function() {
    it('point', function() {
      expect(reproj.toWgs84({
        'type': 'Point',
        'coordinates': [319180, 6399862]
      }, sweref99tm)).to.be.geojson({
        'type': 'Point',
        'coordinates': [11.96526, 57.70451]
      });
    });
    it('linestring', function() {
      expect(reproj.toWgs84({
        'type': 'LineString',
        'coordinates': [[319180, 6399862], [319637, 6400617]]
      }, sweref99tm)).to.be.geojson({
        'type': 'LineString',
        'coordinates': [[11.96526, 57.70451], [11.97235, 57.71146]]
      });
    });
    it('polygon', function() {
      expect(reproj.toWgs84({
        'type': 'Polygon',
        'coordinates': [[[319180, 6399862], [319637, 6400617], [319675, 6400239]]]
      }, sweref99tm)).to.be.geojson({
        'type': 'Polygon',
        'coordinates': [[[11.96526, 57.70451], [11.97235, 57.71146], [11.97327, 57.70808]]]
      });
    });
  });
  describe('collections', function() {
    it('geometrycollection', function() {
      expect(reproj.toWgs84({
        'type': 'GeometryCollection',
        'geometries': [
          {
            'type': 'Point',
            'coordinates': [319180, 6399862]
          },
          {
            'type': 'LineString',
            'coordinates': [[319180, 6399862], [319637, 6400617]]
          },
          {
            'type': 'Polygon',
            'coordinates': [[[319180, 6399862], [319637, 6400617], [319675, 6400239]]]
          }
        ]
      }, sweref99tm)).to.be.geojson({
        'type': 'GeometryCollection',
        'geometries': [
          {
            'type': 'Point',
            'coordinates': [11.96526, 57.70451]
          },
          {
            'type': 'LineString',
            'coordinates': [[11.96526, 57.70451], [11.97235, 57.71146]]
          },
          {
            'type': 'Polygon',
            'coordinates': [[[11.96526, 57.70451], [11.97235, 57.71146], [11.97327, 57.70808]]]
          }
        ]
      });
    });
    it('featurecollection', function() {
      expect(reproj.toWgs84({
        'type': 'FeatureCollection',
        'features': [
          {
            type: 'Feature',
            attributes: {
              'name': 'Domkyrkan'
            },
            geometry: {
              'type': 'Point',
              'coordinates': [319180, 6399862]
            },
          },
          {
            type: 'Feature',
            attributes: {
              'name': 'en linje'
            },
            geometry: {
              'type': 'LineString',
              'coordinates': [[319180, 6399862], [319637, 6400617]]
            },
          }
        ]
      }, sweref99tm)).to.be.geojson({
        'type': 'FeatureCollection',
        'features': [
          {
            type: 'Feature',
            attributes: {
              'name': 'Domkyrkan'
            },
            geometry: {
              'type': 'Point',
              'coordinates': [11.96526, 57.70451]
            },
          },
          {
            type: 'Feature',
            attributes: {
              'name': 'en linje'
            },
            geometry: {
              'type': 'LineString',
              'coordinates': [[11.96526, 57.70451], [11.97235, 57.71146]]
            },
          }
        ]
      });
    });
  });
  describe('named projection', function() {
    it('primitives', function() {
      var projs = {
          "EPSG:28992": proj4.Proj("+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.237,50.0087,465.658,-0.406857,0.350733,-1.87035,4.0812 +units=m +no_defs")
      };
      expect(reproj.toWgs84({
        type: 'Point',
        coordinates: [520000, 1230000]
      }, "EPSG:28992", projs)).to.be.geojson({
        "type":"Point",
        "coordinates":[11.70272,58.88793]
      });
    });
  })
});

describe('detectCrs', function() {
  it('fails on missing crs property', function() {
    expect(function() {
      reproj.detectCrs({
        'type': 'Point',
        'coordinates': [319180, 6399862]
      });
    }).to.throwError();
  });

  it('detects named CRS', function() {
    expect(reproj.detectCrs({
      'type': 'Point',
      'coordinates': [319180, 6399862],
      'crs': {
        'type': 'name',
        'properties': {
          'name': 'EPSG:3006'
        }
      }
    }, crss)).to.be(sweref99tm);
  });
});

describe('reproject', function() {
  it('handles WKT projection strings', function () {
    expect(reproj.reproject({
      'type': 'Point',
      'coordinates': [319180, 6399862]
    }, sweref99tmWkt, rt90Wkt)).to.be.geojson({
      'type': 'Point',
      'coordinates': [1271138, 6404230]
    }, 0.5);
  });

  it('epsg:3006->epsg:2400', function() {
    expect(reproj.reproject({
      'type': 'Point',
      'coordinates': [319180, 6399862]
    }, sweref99tm, rt90)).to.be.geojson({
      'type': 'Point',
      'coordinates': [1271138, 6404230]
    }, 0.5);
  });

  it('look up source crs by name', function() {
    expect(reproj.reproject({
      'type': 'Point',
      'coordinates': [319180, 6399862]
    }, 'EPSG:3006', rt90, crss)).to.be.geojson({
      'type': 'Point',
      'coordinates': [1271138, 6404230]
    }, 0.5);
  });

  it('look up destination crs by name', function() {
    expect(reproj.reproject({
      'type': 'Point',
      'coordinates': [319180, 6399862]
    }, sweref99tm, 'EPSG:2400', crss)).to.be.geojson({
      'type': 'Point',
      'coordinates': [1271138, 6404230]
    }, 0.5);
  });

  it('detect source crs from GeoJSON', function() {
    expect(reproj.reproject({
      'type': 'Point',
      'coordinates': [319180, 6399862],
      'crs': {
        'type': 'name',
        'properties': {
          'name': 'EPSG:3006'
        }
      }
    }, null, 'EPSG:2400', crss)).to.be.geojson({
      'type': 'Point',
      'coordinates': [1271138, 6404230]
    }, 0.5);
  });

  it('transforms altitude', function() {
    expect(reproj.reproject({
      'type': 'Point',
      'coordinates': [319180, 6399862, 10]
    }, sweref99tm, rt90)).to.be.geojson({
      'type': 'Point',
      'coordinates': [1271138, 6404230, -38.2270]
    }, 0.5);
  });

  it('preserves altitude in WGS84', function() { 
    expect(reproj.reproject({
      'type': 'Point',
      'coordinates': [319180, 6399862, 10]
    }, sweref99tm, proj4.WGS84)).to.be.geojson({
      'type': 'Point',
      'coordinates': [11.965, 57.704, 10]
    }, 0.5);
  });

  it('handles null geometry', function() {
    var gj = {
      'type': 'Feature',
      'geometry': null
    };
    expect(reproj.reproject(gj, sweref99tm, rt90)).to.be.geojson(gj, 0);
  })
});

describe('reverse', function() {
  describe('primitives', function() {
    it('point', function() {
      expect(reproj.reverse({
        'type': 'Point',
        'coordinates': [319180, 6399862]
      })).to.be.geojson({
        'type': 'Point',
        'coordinates': [6399862, 319180]
      });
    });
    it('linestring', function() {
      expect(reproj.reverse({
        'type': 'LineString',
        'coordinates': [[319180, 6399862], [319637, 6400617]]
      })).to.be.geojson({
        'type': 'LineString',
        'coordinates': [[6399862, 319180], [6400617, 319637]]
      });
    });
    it('polygon', function() {
      expect(reproj.reverse({
        'type': 'Polygon',
        'coordinates': [[[319180, 6399862], [319637, 6400617], [319675, 6400239]]]
      })).to.be.geojson({
        'type': 'Polygon',
        'coordinates': [[[6399862, 319180], [6400617, 319637], [6400239, 319675]]]
      });
    });
  });
  describe('collections', function() {
    it('geometrycollection', function() {
      expect(reproj.reverse({
        'type': 'GeometryCollection',
        'geometries': [
          {
            'type': 'Point',
            'coordinates': [319180, 6399862]
          },
          {
            'type': 'LineString',
            'coordinates': [[319180, 6399862], [319637, 6400617]]
          },
          {
            'type': 'Polygon',
            'coordinates': [[[319180, 6399862], [319637, 6400617], [319675, 6400239]]]
          }
        ]
      })).to.be.geojson({
        'type': 'GeometryCollection',
        'geometries': [
          {
            'type': 'Point',
            'coordinates': [6399862, 319180]
          },
          {
            'type': 'LineString',
            'coordinates': [[6399862, 319180], [6400617, 319637]]
          },
          {
            'type': 'Polygon',
            'coordinates': [[[6399862, 319180], [6400617, 319637], [6400239, 319675]]]
          }
        ]
      });
    });
    it('featurecollection', function() {
      expect(reproj.reverse({
        'type': 'FeatureCollection',
        'features': [
          {
            type: 'Feature',
            attributes: {
              'name': 'Domkyrkan'
            },
            geometry: {
              'type': 'Point',
              'coordinates': [319180, 6399862]
            },
          },
          {
            type: 'Feature',
            attributes: {
              'name': 'en linje'
            },
            geometry: {
              'type': 'LineString',
              'coordinates': [[319180, 6399862], [319637, 6400617]]
            },
          }
        ]
      })).to.be.geojson({
        'type': 'FeatureCollection',
        'features': [
          {
            type: 'Feature',
            attributes: {
              'name': 'Domkyrkan'
            },
            geometry: {
              'type': 'Point',
              'coordinates': [6399862, 319180]
            },
          },
          {
            type: 'Feature',
            attributes: {
              'name': 'en linje'
            },
            geometry: {
              'type': 'LineString',
              'coordinates': [[6399862, 319180], [6400617, 319637]]
            },
          }
        ]
      });
    });
  });
  describe('bbox', function() {
    it('geometrycollection', function() {
      expect(reproj.toWgs84({
        'type': 'GeometryCollection',
        'bbox': [319180, 6399862, 319675, 6400617],
        'geometries': [
          {
            'type': 'Point',
            'coordinates': [319180, 6399862]
          },
          {
            'type': 'LineString',
            'coordinates': [[319180, 6399862], [319637, 6400617]]
          },
          {
            'type': 'Polygon',
            'coordinates': [[[319180, 6399862], [319637, 6400617], [319675, 6400239]]]
          }
        ]
      }, sweref99tm)).to.be.geojson({
        'type': 'GeometryCollection',
        'bbox': [11.96526, 57.70451, 11.97327, 57.71146],
        'geometries': [
          {
            'type': 'Point',
            'coordinates': [11.96526, 57.70451]
          },
          {
            'type': 'LineString',
            'coordinates': [[11.96526, 57.70451], [11.97235, 57.71146]]
          },
          {
            'type': 'Polygon',
            'coordinates': [[[11.96526, 57.70451], [11.97235, 57.71146], [11.97327, 57.70808]]]
          }
        ]
      });
    });
  });
});
