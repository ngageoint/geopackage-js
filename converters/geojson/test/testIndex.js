var GeoJSONToGeoPackage = require('../index').GeoJSONToGeoPackage;

var path = require('path')
  , fs = require('fs')
  , should = require('chai').should();

describe('GeoJSON to GeoPackage tests', function() {

  it('should convert the natural earth 110m file', function() {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    } catch (e) {}
    const converter = new GeoJSONToGeoPackage();
    return converter.convert({
      geoJson:path.join(__dirname, 'fixtures', 'ne_110m_land.geojson'), geoPackage:path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('ne_110m_land');
      var featureDao = geopackage.getFeatureDao('ne_110m_land');
      var count = featureDao.getCount();
      count.should.be.equal(127);
    });
  });

  it('should convert the a geojson object with an id property', function() {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'id.gpkg'));
    } catch (e) {}
    const converter = new GeoJSONToGeoPackage();
    return converter.convert({geoJson: path.join(__dirname, 'fixtures', 'id.geojson'), geoPackage: path.join(__dirname, 'fixtures', 'tmp', 'id.gpkg')}, function(status) {
      return Promise.resolve();
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('id');
      var featureDao = geopackage.getFeatureDao('id');
      var count = featureDao.getCount();
      count.should.be.equal(1);
    });
  });

  it('should convert the natural earth 10m file', function() {
    this.timeout(10000);
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_10m_land.gpkg'));
    } catch (e) {}
    const converter = new GeoJSONToGeoPackage();

    return converter.convert({geoJson: path.join(__dirname, 'fixtures', 'ne_10m_land.geojson'), geoPackage:path.join(__dirname, 'fixtures', 'tmp', 'ne_10m_land.gpkg')}, function(status) {
      return Promise.resolve();
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('ne_10m_land');
      var featureDao = geopackage.getFeatureDao('ne_10m_land');
      var count = featureDao.getCount();
      count.should.be.equal(1);
    });
  });

  it('should convert the geojson', function(done) {
    fs.readFile(path.join(__dirname, 'fixtures', 'ne_110m_land.geojson'), 'utf8', function(err, data) {
      var geoJson = JSON.parse(data);
      const converter = new GeoJSONToGeoPackage({geoJson});

      converter.convert()
      .then(function(geopackage) {
        var tables = geopackage.getFeatureTables();
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('features');
        var featureDao = geopackage.getFeatureDao('features');
        var count = featureDao.getCount();
        count.should.be.equal(127);
      })
      .then(function() {
        done();
      });
    });
  });

  it('should convert a multilinestring', function(done) {
    var geoJson = {"type":"FeatureCollection","features":[{"type":"Feature","properties":{"scalerank":1,"featureclass":"Country"},"geometry": { type: 'MultiLineString',
      coordinates: [
          [ [100.0, 0.0], [101.0, 1.0] ],
          [ [102.0, 2.0], [103.0, 3.0] ]
    ] }}]};
    const converter = new GeoJSONToGeoPackage({geoJson});

      converter.convert()
      .then(function(geopackage) {
        var tables = geopackage.getFeatureTables();
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('features');
        var featureDao = geopackage.getFeatureDao('features');
        var count = featureDao.getCount();
        count.should.be.equal(1);
      })
      .then(function() {
        done();
      });
  })

  it('should convert a feature with properties', function(done) {
    let date = new Date();
    var geoJson = {"type":"FeatureCollection",
      "features":[{
        "type":"Feature",
        "id": 2,
        "properties":{
          "geometry":101,
          "date": date,
          "bool": true,
          "undefined": undefined,
          "object": { a: 1}
        },
        "geometry": {
          type: 'Point',
          coordinates: [100.0, 0.0]
        }
      }
    ]};
    const converter = new GeoJSONToGeoPackage({geoJson});

      converter.convert()
      .then(function(geopackage) {
        var tables = geopackage.getFeatureTables();
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('features');
        var featureDao = geopackage.getFeatureDao('features');
        var count = featureDao.getCount();
        count.should.be.equal(1);
        const features = featureDao.queryForAll();
        features[0]._feature_id.should.be.equal(2);
        features[0].geometry_property.should.be.equal(101);
        features[0].bool.should.be.equal(1);
        features[0].date.should.be.equal(date.toISOString())
        should.not.exist(features[0].object);
      })
      .then(function() {
        done();
      });
  })

  it('should convert the natural earth 110m file and add the layer twice', function() {
    try {
    fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    } catch (e){}
    const converter = new GeoJSONToGeoPackage();

    return converter.convert({geoJson:path.join(__dirname, 'fixtures', 'ne_110m_land.geojson'), geoPackage:path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')}, function(status) {
      return Promise.resolve();
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('ne_110m_land');
      var featureDao = geopackage.getFeatureDao('ne_110m_land');
      var count = featureDao.getCount();
      count.should.be.equal(127);
      return geopackage;
    })
    .then(function(geopackage) {
      return converter.addLayer({geoJson:path.join(__dirname, 'fixtures', 'ne_110m_land.geojson'), geoPackage:path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')}, function(status) {
        return Promise.resolve();
      })
      .then(function() {
        return geopackage;
      });
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(2);
      tables[0].should.be.equal('ne_110m_land');
      tables[1].should.be.equal('ne_110m_land_1');
      var featureDao = geopackage.getFeatureDao('ne_110m_land_1');
      var count = featureDao.getCount();
      count.should.be.equal(127);
    });
  });

  it('should convert the natural earth 110m file and refuse to create it again without the append flag', function() {
    try {
    fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    } catch (e){}
    const converter = new GeoJSONToGeoPackage();

    return converter.convert({geoJson:path.join(__dirname, 'fixtures', 'ne_110m_land.geojson'), geoPackage:path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')}, function(status) {
      return Promise.resolve();
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('ne_110m_land');
      var featureDao = geopackage.getFeatureDao('ne_110m_land');
      var count = featureDao.getCount();
      count.should.be.equal(127);
      return geopackage;
    })
    .then(function(geopackage) {
      converter.convert({geoJson:path.join(__dirname, 'fixtures', 'ne_110m_land.geojson'), geoPackage:path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')}, function(status) {
        return Promise.resolve();
      })
      .then(function() {
        should.fail('Should have thrown an error');
      })
      .catch(function(error) {
        should.exist(error);
      })
    });
  });

  it('should convert the natural earth 110m file and add the layer twice using the geopackage object the second time', function() {
    try {
    fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    } catch (e) {}
    const converter = new GeoJSONToGeoPackage();

    return converter.convert({geoJson:path.join(__dirname, 'fixtures', 'ne_110m_land.geojson'), geoPackage:path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')}, function(status) {
      return Promise.resolve();
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('ne_110m_land');
      var featureDao = geopackage.getFeatureDao('ne_110m_land');
      var count = featureDao.getCount();
      count.should.be.equal(127);
      return geopackage;
    })
    .then(function(geopackage) {
      return converter.addLayer({geoJson:path.join(__dirname, 'fixtures', 'ne_110m_land.geojson'), geoPackage:geopackage}, function(status) {
        return Promise.resolve();
      });
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(2);
      tables[0].should.be.equal('ne_110m_land');
      tables[1].should.be.equal('ne_110m_land_1');
      var featureDao = geopackage.getFeatureDao('ne_110m_land_1');
      var count = featureDao.getCount();
      count.should.be.equal(127);
    });
  });

  it('should convert the natural earth 110m file and add the layer twice using the geopackage object the second time without progress function', function() {
    try {
    fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    } catch (e) {}
    const converter = new GeoJSONToGeoPackage();

    return converter.convert({geoJson:path.join(__dirname, 'fixtures', 'ne_110m_land.geojson'), geoPackage:path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')}, function(status) {
      return Promise.resolve();
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('ne_110m_land');
      var featureDao = geopackage.getFeatureDao('ne_110m_land');
      var count = featureDao.getCount();
      count.should.be.equal(127);
      return geopackage;
    })
    .then(function(geopackage) {
      return converter.addLayer({geoJson:path.join(__dirname, 'fixtures', 'ne_110m_land.geojson'), geoPackage:geopackage})
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(2);
      tables[0].should.be.equal('ne_110m_land');
      tables[1].should.be.equal('ne_110m_land_1');
      var featureDao = geopackage.getFeatureDao('ne_110m_land_1');
      var count = featureDao.getCount();
      count.should.be.equal(127);
    })
  });

  it('should convert the natural earth 110m file and add read it out as geojson', function() {
    try {
    fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    } catch (e) {}
    const converter = new GeoJSONToGeoPackage();

    return converter.convert({geoJson:path.join(__dirname, 'fixtures', 'ne_110m_land.geojson'), geoPackage:path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')}, function(status) {
      return Promise.resolve();
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('ne_110m_land');
      var featureDao = geopackage.getFeatureDao('ne_110m_land');
      var count = featureDao.getCount();
      count.should.be.equal(127);

      return converter.extract(geopackage, 'ne_110m_land')
      .then(function(geoJson) {
        geoJson.features.length.should.be.equal(127);
      });
    });
  });

  it('should convert the geojson file with z and m values', function() {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'zandm.gpkg'));
    } catch (e) {}
    const converter = new GeoJSONToGeoPackage();

    return converter.convert({geoJson:path.join(__dirname, 'fixtures', 'zandm.json'), geoPackage:path.join(__dirname, 'fixtures', 'tmp', 'zandm.gpkg')}, function(status) {
      return Promise.resolve();
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('zandm');
      var featureDao = geopackage.getFeatureDao('zandm');
      var count = featureDao.getCount();
      count.should.be.equal(2);
      var iterable = featureDao.queryForEach('_feature_id', 'asdf#456');
      for (var row of iterable) {
        row = featureDao.getRow(row);
        var geom = row.geometry;
        geom.geometry.z.should.be.equal(121.0);
        geom.geometry.x.should.be.equal(-5.78);
        geom.geometry.y.should.be.equal(4.3);
        should.not.exist(geom.geometry.m);
        row.getValueWithColumnName('_properties_ID').should.be.equal(456);
        row.getValueWithColumnName('_feature_id').should.be.equal('asdf#456');
      }

      iterable = featureDao.queryForEach('_feature_id', 'gserg#897');
      for (var row of iterable) {
        row = featureDao.getRow(row);
        var geom = row.geometry;
        geom.geometry.points[0].z.should.be.equal(7.7);
        geom.geometry.points[0].x.should.be.equal(-8.6);
        geom.geometry.points[0].y.should.be.equal(2.86);
        // https://tools.ietf.org/html/rfc7946 m values should not be used
        // geom.geometry.points[0].m.should.be.equal(131);
        row.getValueWithColumnName('_properties_ID').should.be.equal(897);
        row.getValueWithColumnName('_feature_id').should.be.equal('gserg#897');
      }

      return converter.extract(geopackage, 'zandm')
      .then(function(geoJson) {
        geoJson.features.length.should.be.equal(2);
        var feature = geoJson.features[0];
        feature.id.should.be.equal('asdf#456');
        feature.properties.ID.should.be.equal(456);
        feature.geometry.coordinates[0].should.be.equal(-5.78);
        feature.geometry.coordinates[1].should.be.equal(4.3);
        // https://tools.ietf.org/html/rfc7946 m values should not be used
        // feature.geometry.coordinates[2].should.be.equal(121.0);

        var feature = geoJson.features[1];
        feature.id.should.be.equal('gserg#897');
        feature.properties.ID.should.be.equal(897);
        feature.geometry.coordinates[0][0].should.be.equal(-8.6);
        feature.geometry.coordinates[0][1].should.be.equal(2.86);
        feature.geometry.coordinates[0][2].should.be.equal(7.7);
        // https://tools.ietf.org/html/rfc7946 m values should not be used
        // feature.geometry.coordinates[0][3].should.be.equal(131);
      });
    });
  });

  it('should convert geoJSON with null geometries', function (){
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'nullGeometry.gpkg'));
    } catch (e) {}
    const converter = new GeoJSONToGeoPackage();
    // console.log(path.join(__dirname, 'fixtures', 'nullGeometry.json'));
    return converter.convert({geoJson: path.join(__dirname, 'fixtures', 'nullGeometry.geojson'), geoPackage: path.join(__dirname, 'fixtures', 'tmp', 'nullGeometry.gpkg')},(t) => console.log(t))
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('nullGeometry');
    });
  });
});
