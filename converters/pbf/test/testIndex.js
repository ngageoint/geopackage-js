var PBFToGeoPackage = require('../index.js');

var path = require('path')
  , fs = require('fs')
  , should = require('chai').should();

describe('PBF to GeoPackage tests', function() {

  it('should convert the countries_0 pbf tile', function() {
    this.timeout(0);
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'countries_0.gpkg'));
    } catch (e) {}

    return PBFToGeoPackage.convert({
      pbf: path.join(__dirname, 'fixtures', 'countries_0.pbf'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'countries_0.gpkg'),
      tileCenter: [0,0],
      x: 0,
      y: 0,
      zoom: 0
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(5);
      tables[0].should.be.equal('country');
      tables[1].should.be.equal('country-name');
      tables[2].should.be.equal('geo-lines');
      tables[3].should.be.equal('land-border-country');
      tables[4].should.be.equal('state');
      return tables.reduce(function(sequence, table) {
        return sequence.then(function() {
          return geopackage.indexFeatureTable(table);
        });
      }, Promise.resolve())
      .then(function() {
        geopackage.getFeatureDao('country').getCount().should.be.equal(506);
        geopackage.getFeatureDao('country-name').getCount().should.be.equal(250);
        geopackage.getFeatureDao('geo-lines').getCount().should.be.equal(11);
        geopackage.getFeatureDao('land-border-country').getCount().should.be.equal(356);
        geopackage.getFeatureDao('state').getCount().should.be.equal(7528);
      });
    });
  });

  it('should convert the countries_1_0_1 pbf tile', function() {
    this.timeout(0);
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'countries_1_0_1.gpkg'));
    } catch (e) {}

    return PBFToGeoPackage.convert({
      pbf: path.join(__dirname, 'fixtures', 'countries_1_0_1.pbf'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'countries_1_0_1.gpkg'),
      x: 0,
      y: 1,
      tileCenter: [-66.6,-90],
      zoom: 1
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(5);
      tables[0].should.be.equal('country');
      tables[1].should.be.equal('country-name');
      tables[2].should.be.equal('geo-lines');
      tables[3].should.be.equal('land-border-country');
      tables[4].should.be.equal('state');
      geopackage.getFeatureDao('country').getCount().should.be.equal(74);
      geopackage.getFeatureDao('country-name').getCount().should.be.equal(133);
      geopackage.getFeatureDao('geo-lines').getCount().should.be.equal(7);
      geopackage.getFeatureDao('land-border-country').getCount().should.be.equal(30);
      geopackage.getFeatureDao('state').getCount().should.be.equal(394);
    });
  });

  it('should convert the countries_6_10_38 pbf tile', function() {
    this.timeout(0);
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'countries_6_10_38.gpkg'));
    } catch (e) {}

    return PBFToGeoPackage.convert({
      pbf: path.join(__dirname, 'fixtures', 'countries_6_10_38.pbf'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'countries_6_10_38.gpkg'),
      x: 10,
      y: 25,
      zoom: 6
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('country');
      geopackage.getFeatureDao('country').getCount().should.be.equal(7);
    });
  });

  it('should convert the countries_6_20_7 pbf tile', function() {
    this.timeout(0);
    try {
      fs.unlinkSync(path.join(__dirname, 'fixtures', 'tmp', 'countries_6_20_7.gpkg'));
    } catch (e) {}

    return PBFToGeoPackage.convert({
      pbf: path.join(__dirname, 'fixtures', 'countries_6_20_7.pbf'),
      geopackage: path.join(__dirname, 'fixtures', 'tmp', 'countries_6_20_7.gpkg'),
      x: 20,
      y: 7,
      zoom: 6
    })
    .then(function(geopackage) {
      should.exist(geopackage);
      var tables = geopackage.getFeatureTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('country');
      geopackage.getFeatureDao('country').getCount().should.be.equal(2);
    });
  });
});
