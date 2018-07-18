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

  it('should create the spatial reference system table', function() {
    var tc = new TableCreator(geopackage);
    return tc.createSpatialReferenceSystem()
    .then(function(result) {
      result.should.be.equal(true);
      var verified = Verification.verifySRS(geopackage);
      verified.should.be.equal(true);
    });
  });

  it('should create the contents table', function() {
    var tc = new TableCreator(geopackage);
    return tc.createContents()
    .then(function(result) {
      result.should.be.equal(true);
      var verified = Verification.verifyContents(geopackage);
      verified.should.be.equal(true);
    });
  });

  it('should create the geometry columns table', function() {
    var tc = new TableCreator(geopackage);
    return tc.createGeometryColumns()
    .then(function(result) {
      result.should.be.equal(true);
      var verified = Verification.verifyGeometryColumns(geopackage);
      verified.should.be.equal(true);
    });
  });

  it('should create the tile matrix set table', function() {
    var tc = new TableCreator(geopackage);
    return tc.createTileMatrixSet()
    .then(function(result) {
      result.should.be.equal(true);
      Verification.verifyTileMatrixSet(geopackage).should.be.equal(true);
    });
  });

  it('should create the tile matrix table', function() {
    var tc = new TableCreator(geopackage);
    return tc.createTileMatrix()
    .then(function(result) {
      result.should.be.equal(true);
      Verification.verifyTileMatrix(geopackage).should.be.equal(true);
    });
  });

  it('should create the data columns table', function() {
    var tc = new TableCreator(geopackage);
    return tc.createDataColumns()
    .then(function(result) {
      result.should.be.equal(true);
      Verification.verifyDataColumns(geopackage).should.be.equal(true);
    });
  });

  it('should create the data column constraints table', function() {
    var tc = new TableCreator(geopackage);
    return tc.createDataColumnConstraints()
    .then(function(result) {
      result.should.be.equal(true);
      Verification.verifyDataColumnConstraints(geopackage).should.be.equal(true);
    });
  });

  it('should create the metadata table', function() {
    var tc = new TableCreator(geopackage);
    return tc.createMetadata()
    .then(function(result) {
      result.should.be.equal(true);
      Verification.verifyMetadata(geopackage).should.be.equal(true);
    });
  });

  it('should create the metadata reference', function() {
    var tc = new TableCreator(geopackage);
    return tc.createMetadataReference()
    .then(function(result) {
      result.should.be.equal(true);
      Verification.verifyMetadataReference(geopackage).should.be.equal(true);
    });
  });

  it('should create the extensions table', function() {
    var tc = new TableCreator(geopackage);
    return tc.createExtensions()
    .then(function(result) {
      result.should.be.equal(true);
      Verification.verifyExtensions(geopackage).should.be.equal(true);
    });
  });

  it('should create the table index table', function() {
    var tc = new TableCreator(geopackage);
    return tc.createTableIndex()
    .then(function(result) {
      result.should.be.equal(true);
      Verification.verifyTableIndex(geopackage).should.be.equal(true);
    });
  });

  it('should create the geometry index table', function() {
    var tc = new TableCreator(geopackage);
    return tc.createGeometryIndex()
    .then(function(result) {
      result.should.be.equal(true);
      Verification.verifyGeometryIndex(geopackage).should.be.equal(true);
    });
  });

  it('should create the feature tile link table', function() {
    var tc = new TableCreator(geopackage);
    return tc.createFeatureTileLink()
    .then(function(result) {
      result.should.be.equal(true);
      Verification.verifyFeatureTileLink(geopackage).should.be.equal(true);
    });
  });

  it('should create the required tables', function() {
    var tc = new TableCreator(geopackage);
    tc.createRequired()
    .then(function(result) {
      Verification.verifyContents(geopackage).should.be.equal(true);
      Verification.verifySRS(geopackage).should.be.equal(true);
      var count = geopackage.getDatabase().count('gpkg_spatial_ref_sys');
      count.should.be.equal(4);
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
