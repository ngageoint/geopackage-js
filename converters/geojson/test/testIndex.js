var GeoJSONToGeoPackage = require('../index.js');

var path = require('path')
  , fs = require('fs')
  , should = require('chai').should();

describe('GeoJSON to GeoPackage tests', function() {

  it('should convert the natural earth 110m file', function() {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    } catch (e) {}

    return GeoJSONToGeoPackage.convert({
      geojson:path.join(__dirname, 'fixtures', 'ne_110m_land.geojson'), geopackage:path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')
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

    return GeoJSONToGeoPackage.convert({geojson: path.join(__dirname, 'fixtures', 'id.geojson'), geopackage: path.join(__dirname, 'fixtures', 'tmp', 'id.gpkg')}, function(status) {
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

    return GeoJSONToGeoPackage.convert({geojson: path.join(__dirname, 'fixtures', 'ne_10m_land.geojson'), geopackage:path.join(__dirname, 'fixtures', 'tmp', 'ne_10m_land.gpkg')}, function(status) {
      return Promise.resolve();
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('ne_10m_land');
      var featureDao = geopackage.getFeatureDao('ne_10m_land');
      var count = featureDao.getCount();
      count.should.be.equal(4063);
    });
  });

  it('should convert the geojson', function(done) {
    fs.readFile(path.join(__dirname, 'fixtures', 'ne_110m_land.geojson'), 'utf8', function(err, data) {
      var geoJson = JSON.parse(data);
      GeoJSONToGeoPackage.convert({geojson:geoJson})
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

  it('should convert the natural earth 110m file and add the layer twice', function() {
    try {
    fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    } catch (e){}
    return GeoJSONToGeoPackage.convert({geojson:path.join(__dirname, 'fixtures', 'ne_110m_land.geojson'), geopackage:path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')}, function(status) {
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
      return GeoJSONToGeoPackage.addLayer({geojson:path.join(__dirname, 'fixtures', 'ne_110m_land.geojson'), geopackage:path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')}, function(status) {
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

  it('should convert the natural earth 110m file and add the layer twice using the geopackage object the second time', function() {
    try {
    fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    } catch (e) {}
    return GeoJSONToGeoPackage.convert({geojson:path.join(__dirname, 'fixtures', 'ne_110m_land.geojson'), geopackage:path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')}, function(status) {
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
      return GeoJSONToGeoPackage.addLayer({geojson:path.join(__dirname, 'fixtures', 'ne_110m_land.geojson'), geopackage:geopackage}, function(status) {
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

  it('should convert the natural earth 110m file and add read it out as geojson', function() {
    try {
    fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    } catch (e) {}
    return GeoJSONToGeoPackage.convert({geojson:path.join(__dirname, 'fixtures', 'ne_110m_land.geojson'), geopackage:path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')}, function(status) {
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

      return GeoJSONToGeoPackage.extract(geopackage, 'ne_110m_land')
      .then(function(geoJson) {
        geoJson.features.length.should.be.equal(127);
      });
    });
  });

  it('should convert the geojson file with z and m values', function() {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'zandm.gpkg'));
    } catch (e) {}
    return GeoJSONToGeoPackage.convert({geojson:path.join(__dirname, 'fixtures', 'zandm.json'), geopackage:path.join(__dirname, 'fixtures', 'tmp', 'zandm.gpkg')}, function(status) {
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
        var geom = row.getGeometry();
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
        var geom = row.getGeometry();
        geom.geometry.points[0].z.should.be.equal(7.7);
        geom.geometry.points[0].x.should.be.equal(-8.6);
        geom.geometry.points[0].y.should.be.equal(2.86);
        // https://tools.ietf.org/html/rfc7946 m values should not be used
        // geom.geometry.points[0].m.should.be.equal(131);
        row.getValueWithColumnName('_properties_ID').should.be.equal(897);
        row.getValueWithColumnName('_feature_id').should.be.equal('gserg#897');
      }

      return GeoJSONToGeoPackage.extract(geopackage, 'zandm')
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
});
