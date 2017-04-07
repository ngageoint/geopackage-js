var GeoPackageManager = require('../../../../lib/geoPackageManager')
  , FeatureTiles = require('../../../../lib/tiles/features')
  , GeoPackage = require('../../../..')
  , testSetup = require('../../../fixtures/testSetup')
  , fs = require('fs')
  , async = require('async')
  , should = require('chai').should()
  , path = require('path');

describe('GeoPackage FeatureTiles tests', function() {

  describe('Rivers GeoPackage tests', function() {

    var geoPackage;
    var featureDao;

    beforeEach('should open the geopackage', function(done) {
      var filename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers.gpkg');
      GeoPackageManager.open(filename, function(err, gp) {
        geoPackage = gp;
        should.not.exist(err);
        should.exist(gp);
        should.exist(gp.getDatabase().getDBConnection());
        gp.getPath().should.be.equal(filename);
        geoPackage.getFeatureDaoWithTableName('FEATURESriversds', function(err, riverFeatureDao) {
          featureDao = riverFeatureDao;
          done();
        });
      });
    });

    afterEach('should close the geopackage', function() {
      geoPackage.close();
    });

    it('should get the x: 1, y: 0, z: 1 tile', function(done) {
      this.timeout(30000);
      var ft = new FeatureTiles(featureDao);
      ft.drawTile(1, 0, 1, function(err, image) {
        testSetup.diffImages(image, path.join(__dirname, '..','..','..', 'fixtures','featuretiles','1_1_0.png'), function(err, equal) {
          equal.should.be.equal(true);
          done();
        });
      });
    });

    it('should get the x: 1, y: 0, z: 1 tile from the GeoPackage api', function(done) {
      this.timeout(30000);
      console.time('Generating non indexed tiles');
      GeoPackage.getFeatureTileFromXYZ(geoPackage, 'FEATURESriversds', 1, 0, 1, 256, 256, function(err, data) {
        if (!data) return done(err);
        // fs.writeFile('/tmp/1_1_0_unindexed.png', data, function() {
        //   done(err);
        // });
        console.timeEnd('Generating non indexed tiles');
        testSetup.diffImages(data, path.join(__dirname, '..','..','..','fixtures','featuretiles','1_1_0.png'), function(err, equal) {
          equal.should.be.equal(true);
          done();
        });
      });
    });

    it('should get the x: 8, y: 12, z: 5 tile from the GeoPackage api', function(done) {
      this.timeout(30000);
      console.time('Generating non indexed tiles');
      GeoPackage.getFeatureTileFromXYZ(geoPackage, 'FEATURESriversds', 8, 12, 5, 256, 256, function(err, data) {
        console.timeEnd('Generating non indexed tiles');
        if (!data) return done(err);
        testSetup.diffImages(data, path.join(__dirname, '..','..','..','fixtures','featuretiles','5_8_12.png'), function(err, equal) {
          equal.should.be.equal(true);
          delete data;
          done();
        });
      });
    });
  });

  describe('Indexed Rivers GeoPackage tests', function() {

    var geoPackage;
    var featureDao;

    beforeEach('should open the geopackage', function(done) {
      var filename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers_indexed.gpkg');
      GeoPackageManager.open(filename, function(err, gp) {
        geoPackage = gp;
        should.not.exist(err);
        should.exist(gp);
        should.exist(gp.getDatabase().getDBConnection());
        gp.getPath().should.be.equal(filename);
        geoPackage.getFeatureDaoWithTableName('rivers', function(err, riverFeatureDao) {
          featureDao = riverFeatureDao;
          done();
        });
      });
    });

    afterEach('should close the geopackage', function() {
      geoPackage.close();
    });

    it('should get the x: 1, y: 0, z: 1 tile', function(done) {
      this.timeout(30000);
      var ft = new FeatureTiles(featureDao);
      ft.drawTile(1, 0, 1, function(err, image) {
        testSetup.diffImages(image, path.join(__dirname, '..','..','..','fixtures','featuretiles','1_1_0.png'), function(err, equal) {
          equal.should.be.equal(true);
          delete image;
          done();
        });
      });
    });

    it('should get the x: 1, y: 0, z: 1 tile from the GeoPackage api', function(done) {
      this.timeout(30000);
      console.time('generating indexed tile');
      GeoPackage.getFeatureTileFromXYZ(geoPackage, 'rivers', 1, 0, 1, 256, 256, function(err, data) {
        console.timeEnd('generating indexed tile');
        if (!data) return done(err);
        testSetup.diffImages(data, path.join(__dirname, '..','..','..','fixtures','featuretiles','1_1_0.png'), function(err, equal) {
          equal.should.be.equal(true);
          delete data;
          done();
        });
      });
    });

    it('should get the x: 0, y: 0, z: 0 tile from the GeoPackage api', function(done) {
      this.timeout(30000);
      console.time('generating indexed tile');
      GeoPackage.getFeatureTileFromXYZ(geoPackage, 'rivers', 0, 0, 0, 256, 256, function(err, data) {
        console.timeEnd('generating indexed tile');
        if (!data) return done(err);
        // fs.writeFile('/tmp/0_0_0.png', data, function() {
        //   done();
        // });
        testSetup.diffImages(data, path.join(__dirname, '..','..','..','fixtures','featuretiles','0_0_0.png'), function(err, equal) {
          equal.should.be.equal(true);
          delete data;
          done();
        });
      });
    });

    it('should get the x: 8, y: 12, z: 5 tile from the GeoPackage api', function(done) {
      this.timeout(30000);
      console.time('generating indexed tile');
      GeoPackage.getFeatureTileFromXYZ(geoPackage, 'rivers', 8, 12, 5, 256, 256, function(err, data) {
        console.timeEnd('generating indexed tile');
        if (!data) return done(err);
        testSetup.diffImages(data, path.join(__dirname, '..','..','..','fixtures','featuretiles','5_8_12.png'), function(err, equal) {
          equal.should.be.equal(true);
          delete data;
          done();
        });
      });
    });

  });
});
