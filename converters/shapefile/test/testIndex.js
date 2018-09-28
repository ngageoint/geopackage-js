var ShapefileToGeoPackage = require('../index.js');

var path = require('path')
  , fs = require('fs')
  , should = require('chai').should();

describe('Shapefile to GeoPackage tests', function() {

  it('should convert the natural earth 110m file and add read it out as geojson', function() {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    } catch (e) {}
    return ShapefileToGeoPackage.convert({
      shapefile: path.join(__dirname, 'fixtures', 'ne_110m_land', 'ne_110m_land.shp'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('ne_110m_land');
      var featureDao = geopackage.getFeatureDao('ne_110m_land');
      var count = featureDao.getCount();
      count.should.be.equal(127);

      return ShapefileToGeoPackage.extract(geopackage, 'ne_110m_land')
      .then(function(result) {
        should.exist(result);

      });
      // geoJson.features.length.should.be.equal(127);
    });
  });

  it('should convert the natural earth 110m file', function() {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    } catch (e) {}

    return ShapefileToGeoPackage.convert({
      shapefile: path.join(__dirname, 'fixtures', 'ne_110m_land', 'ne_110m_land.shp'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')
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

  it('should convert the natural earth 110m file no progress callback', function() {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    } catch (e) {}

    return ShapefileToGeoPackage.convert({
      shapefile: path.join(__dirname, 'fixtures', 'ne_110m_land', 'ne_110m_land.shp'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')
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

  it('should convert the natural earth 110m zip', function() {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    } catch (e) {}

    return ShapefileToGeoPackage.convert({
      shapefile: path.join(__dirname, 'fixtures', 'ne_110m_land.zip'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')
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

  it('should convert the natural earth 110m zip buffer with no geopackage argument', function() {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    } catch (e) {}

    var zipData = fs.readFileSync(path.join(__dirname, 'fixtures', 'ne_110m_land.zip'));

    return ShapefileToGeoPackage.convert({
      shapezipData: zipData
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

  it('should convert the shapefile buffer', function() {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    } catch (e) {}

    var shpData = fs.readFileSync(path.join(__dirname, 'fixtures', 'ne_110m_land', 'ne_110m_land.shp'));
    var dbfData = fs.readFileSync(path.join(__dirname, 'fixtures', 'ne_110m_land', 'ne_110m_land.dbf'));
    return ShapefileToGeoPackage.convert({
      shapeData: shpData,
      dbfData: dbfData,
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('features');
      var featureDao = geopackage.getFeatureDao('features');
      var count = featureDao.getCount();
      count.should.be.equal(127);
    });
  });

  it('should convert the natural earth 110m file and add the layer twice', function() {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    } catch (e) {}

    return ShapefileToGeoPackage.convert({
      shapefile: path.join(__dirname, 'fixtures', 'ne_110m_land', 'ne_110m_land.shp'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('ne_110m_land');
      var featureDao = geopackage.getFeatureDao('ne_110m_land');
      var count = featureDao.getCount();
      count.should.be.equal(127);
      return ShapefileToGeoPackage.addLayer({
        shapefile: path.join(__dirname, 'fixtures', 'ne_110m_land', 'ne_110m_land.shp'),
        geopackage: path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')
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
  });

  it('should convert the natural earth 110m file and add the layer twice using the geopackage object the second time', function() {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    } catch (e) {}
    return ShapefileToGeoPackage.convert({
      shapefile: path.join(__dirname, 'fixtures', 'ne_110m_land', 'ne_110m_land.shp'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('ne_110m_land');
      var featureDao = geopackage.getFeatureDao('ne_110m_land');
      var count = featureDao.getCount();
      count.should.be.equal(127);
      return ShapefileToGeoPackage.addLayer({
        shapefile: path.join(__dirname, 'fixtures', 'ne_110m_land', 'ne_110m_land.shp'),
        geopackage: geopackage
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
  });

  it('should convert the natural earth 110m file and add read it out as geojson', function() {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg'));
    } catch (e) {}

    return ShapefileToGeoPackage.convert({
      shapefile: path.join(__dirname, 'fixtures', 'ne_110m_land', 'ne_110m_land.shp'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'ne_110m_land.gpkg')
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('ne_110m_land');
      var featureDao = geopackage.getFeatureDao('ne_110m_land');
      var count = featureDao.getCount();
      count.should.be.equal(127);

      return ShapefileToGeoPackage.extract(geopackage, 'ne_110m_land')
      .then(function(result) {
        should.exist(result);
      });
    });
  });

  it('should convert the MGRS_100kmSQ_ID file with features defined as 3857', function() {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'MGRS_100kmSQ_ID.gpkg'));
    } catch (e) {}

    var zipData = fs.readFileSync(path.join(__dirname, 'fixtures', 'MGRS_100kmSQ_ID_60K.zip'));

    return ShapefileToGeoPackage.convert({
      shapezipData: zipData,
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'MGRS_100kmSQ_ID.gpkg')
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('MGRS_100kmSQ_ID_60K');
      var featureDao = geopackage.getFeatureDao('MGRS_100kmSQ_ID_60K');
      var srs = featureDao.getSrs();
      srs.srs_id.should.be.equal(4326);
      var count = featureDao.getCount();
      count.should.be.equal(80);
    });
  });

  it('should convert the MGRS_worldwide file with features defined as 3857', function() {
    this.timeout(0);
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'MGRS_GZD_WorldWide.gpkg'));
    } catch (e) {}

    var zipData = fs.readFileSync(path.join(__dirname, 'fixtures', 'MGRS_GZD_WorldWide.zip'));
    return ShapefileToGeoPackage.convert({
      shapezipData: zipData,
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'MGRS_GZD_WorldWide.gpkg')
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('MGRS_GZD_WorldWide');
      var featureDao = geopackage.getFeatureDao('MGRS_GZD_WorldWide');
      var srs = featureDao.getSrs();
      srs.srs_id.should.be.equal(4326);
      var count = featureDao.getCount();
      count.should.be.equal(1197);
    });
  });
});
