var GeoPackageConnection = require('../../../lib/db/geoPackageConnection')
  , GeoPackage = require('../../../lib/geoPackage')
  , TableCreator = require('../../../lib/db/tableCreator')
  , TileTable = require('../../../lib/tiles/user/tileTable')
  , TileDao = require('../../../lib/tiles/user/tileDao')
  , SetupFeatureTable = require('../../fixtures/setupFeatureTable.js')
  , Verification = require('../../fixtures/verification')
  , testSetup = require('../../fixtures/testSetup')
  , wkx = require('wkx')
  , should = require('chai').should()
  , path = require('path')
  , async = require('async');

describe('TableCreator tests', function() {

  var testGeoPackage = path.join(__dirname, '..', 'tmp', 'test.gpkg');
  var geopackage;

  beforeEach(function(done) {
    testSetup.deleteGeoPackage(testGeoPackage, function() {
      testSetup.createBareGeoPackage(testGeoPackage, function(err, gp) {
        geopackage = gp;
        done();
      });
    });
  });

  afterEach(function(done) {
    geopackage.close();
    testSetup.deleteGeoPackage(testGeoPackage, done);
  });

  it('should create the spatial reference system table', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createSpatialReferenceSystem(function(err, result) {
      should.not.exist(err);
      var verified = Verification.verifySRS(geopackage);
      verified.should.be.equal(true);
      done();
    });
  });

  it('should create the contents table', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createContents(function(err, result) {
      should.not.exist(err);
      var verified = Verification.verifyContents(geopackage);
      verified.should.be.equal(true);
      done();
    });
  });

  it('should create the geometry columns table', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createGeometryColumns(function(err, result) {
      should.not.exist(err);
      var verified = Verification.verifyGeometryColumns(geopackage);
      verified.should.be.equal(true);
      done();
    });
  });

  it('should create the tile matrix set table', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createTileMatrixSet(function(err, result) {
      should.not.exist(err);
      Verification.verifyTileMatrixSet(geopackage).should.be.equal(true);
      done();
    });
  });

  it('should create the tile matrix table', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createTileMatrix(function(err, result) {
      should.not.exist(err);
      Verification.verifyTileMatrix(geopackage).should.be.equal(true);
      done();
    });
  });

  it('should create the data columns table', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createDataColumns(function(err, result) {
      should.not.exist(err);
      Verification.verifyDataColumns(geopackage).should.be.equal(true);
      done();
    });
  });

  it('should create the data column constraints table', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createDataColumnConstraints(function(err, result) {
      should.not.exist(err);
      Verification.verifyDataColumnConstraints(geopackage).should.be.equal(true);
      done();
    });
  });

  it('should create the metadata table', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createMetadata(function(err, result) {
      should.not.exist(err);
      Verification.verifyMetadata(geopackage).should.be.equal(true);
      done();
    });
  });

  it('should create the metadata reference', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createMetadataReference(function(err, result) {
      should.not.exist(err);
      Verification.verifyMetadataReference(geopackage).should.be.equal(true);
      done();
    });
  });

  it('should create the extensions table', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createExtensions(function(err, result) {
      should.not.exist(err);
      Verification.verifyExtensions(geopackage).should.be.equal(true);
      done();
    });
  });

  it('should create the table index table', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createTableIndex(function(err, result) {
      should.not.exist(err);
      Verification.verifyTableIndex(geopackage).should.be.equal(true);
      done();
    });
  });

  it('should create the geometry index table', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createGeometryIndex(function(err, result) {
      should.not.exist(err);
      Verification.verifyGeometryIndex(geopackage).should.be.equal(true);
      done();
    });
  });

  it('should create the feature tile link table', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createFeatureTileLink(function(err, result) {
      should.not.exist(err);
      Verification.verifyFeatureTileLink(geopackage).should.be.equal(true);
      done();
    });
  });

  it('should create the required tables', function(done) {
    var tc = new TableCreator(geopackage);
    tc.createRequired()
    .then(function(result) {
      Verification.verifyContents(geopackage).should.be.equal(true);
      Verification.verifySRS(geopackage).should.be.equal(true);
      var count = geopackage.getDatabase().count('gpkg_spatial_ref_sys');
      count.should.be.equal(4);
      done();
    });
  });

  it('should create a user tile table', function(done) {
    var columns = TileTable.createRequiredColumns();
    var tileTable = new TileTable('test_tiles', columns);
    var tc = new TableCreator(geopackage);
    var result = tc.createUserTable(tileTable);
    Verification.verifyTableExists(geopackage, 'test_tiles').should.be.equal(true);
    done();
  });

  it('should create a user feature table', function(done) {
    var featureTable = SetupFeatureTable.buildFeatureTable('test_features', 'geom', wkx.Types.wkt.Point);
    var tc = new TableCreator(geopackage);
    var result = tc.createUserTable(featureTable);
    Verification.verifyTableExists(geopackage, 'test_features').should.be.equal(true);
    done();
  });

});
