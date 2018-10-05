var CSVToGeoPackage = require('../index.js');

var path = require('path')
  , fs = require('fs')
  , should = require('chai').should();

describe('CSV to GeoPackage tests', function() {

  it('should convert the natural earth 110m file', function() {
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', '110m-admin-0-countries.gpkg'));
    } catch (e) {}

    return CSVToGeoPackage.convert({
      csv:path.join(__dirname, 'fixtures', '110m-admin-0-countries.csv'),
      geopackage:path.join(__dirname, 'fixtures', 'tmp', '110m-admin-0-countries.gpkg'),
      delimiter: ';'
    }, function(status) {
      return Promise.resolve();
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('110m-admin-0-countries');
      var featureDao = geopackage.getFeatureDao('110m-admin-0-countries');
      var count = featureDao.getCount();
      count.should.be.equal(286);
    });
  });

  it('should convert the geojson', function(done) {
    fs.readFile(path.join(__dirname, 'fixtures', '110m-admin-0-countries.csv'), 'utf8', function(err, data) {
      CSVToGeoPackage.convert({
        csvData:data,
        delimiter: ';'
      })
      .then(function(geopackage) {
        var tables = geopackage.getFeatureTables();
        tables.length.should.be.equal(1);
        tables[0].should.be.equal('features');
        var featureDao = geopackage.getFeatureDao('features');
        var count = featureDao.getCount();
        count.should.be.equal(286);
      })
      .then(function() {
        done();
      });
    });
  });

  it('should convert the natural earth 110m file and add the layer twice', function() {
    fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', '110m-admin-0-countries.gpkg'));
    return CSVToGeoPackage.convert({
      csv:path.join(__dirname, 'fixtures', '110m-admin-0-countries.csv'),
      geopackage:path.join(__dirname, 'fixtures', 'tmp', '110m-admin-0-countries.gpkg'),
      delimiter: ';'
    }, function(status) {
      return Promise.resolve();
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('110m-admin-0-countries');
      var featureDao = geopackage.getFeatureDao('110m-admin-0-countries');
      var count = featureDao.getCount();
      count.should.be.equal(286);
      return geopackage;
    })
    .then(function(geopackage) {
      return CSVToGeoPackage.addLayer({
        csv:path.join(__dirname, 'fixtures', '110m-admin-0-countries.csv'),
        geopackage:path.join(__dirname, 'fixtures', 'tmp', '110m-admin-0-countries.gpkg'),
        delimiter: ';'
      }, function(status) {
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
      tables[0].should.be.equal('110m-admin-0-countries');
      tables[1].should.be.equal('110m-admin-0-countries_1');
      var featureDao = geopackage.getFeatureDao('110m-admin-0-countries');
      var count = featureDao.getCount();
      count.should.be.equal(286);
    });
  });

  it('should convert the natural earth 110m file and add the layer twice using the geopackage object the second time', function() {
    fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', '110m-admin-0-countries.gpkg'));
    return CSVToGeoPackage.convert({
      csv:path.join(__dirname, 'fixtures', '110m-admin-0-countries.csv'),
      geopackage:path.join(__dirname, 'fixtures', 'tmp', '110m-admin-0-countries.gpkg'),
      delimiter: ';'
    }, function(status) {
      return Promise.resolve();
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('110m-admin-0-countries');
      var featureDao = geopackage.getFeatureDao('110m-admin-0-countries');
      var count = featureDao.getCount();
      count.should.be.equal(286);
      return geopackage;
    })
    .then(function(geopackage) {
      return CSVToGeoPackage.addLayer({
        csv:path.join(__dirname, 'fixtures', '110m-admin-0-countries.csv'),
        geopackage:geopackage,
        delimiter: ';'
      }, function(status) {
        return Promise.resolve();
      });
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(2);
      tables[0].should.be.equal('110m-admin-0-countries');
      tables[1].should.be.equal('110m-admin-0-countries_1');
      var featureDao = geopackage.getFeatureDao('110m-admin-0-countries_1');
      var count = featureDao.getCount();
      count.should.be.equal(286);
    });
  });

  it('should convert the natural earth 110m file and add read it out as geojson', function() {
    fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', '110m-admin-0-countries.gpkg'));
    return CSVToGeoPackage.convert({
      csv:path.join(__dirname, 'fixtures', '110m-admin-0-countries.csv'),
      geopackage:path.join(__dirname, 'fixtures', 'tmp', '110m-admin-0-countries.gpkg'),
      delimiter: ';'
    }, function(status) {
      return Promise.resolve();
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('110m-admin-0-countries');
      var featureDao = geopackage.getFeatureDao('110m-admin-0-countries');
      var count = featureDao.getCount();
      count.should.be.equal(286);

      CSVToGeoPackage.extract(geopackage, '110m-admin-0-countries')
      .then(function(csv) {
        csv.split(/\r\n|\r|\n/).length.should.be.equal(288);
      })
    });
  });

});
