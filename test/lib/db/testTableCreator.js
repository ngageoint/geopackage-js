import { default as testSetup } from '../../testSetup'

var TileTable = require('../../../lib/tiles/user/tileTable').TileTable
  , GeoPackageTableCreator = require('../../../lib/db/geoPackageTableCreator').GeoPackageTableCreator
  , SetupFeatureTable = require('../../setupFeatureTable.js')
  , Verification = require('../../verification')
  , should = require('chai').should()
  , GeometryType = require('@ngageoint/simple-features-js').GeometryType
  , path = require('path');

describe('GeoPackageTableCreator tests', function() {

  var testGeoPackage = path.join(__dirname, '..', '..', 'fixtures', 'tmp', testSetup.createTempName());
  var geoPackage;

  beforeEach(async function() {
    geoPackage = await testSetup.createBareGeoPackage(testGeoPackage);
  });

  afterEach(async function() {
    geoPackage.close();
    await testSetup.deleteGeoPackage(testGeoPackage);
  });

  it('should create the spatial reference system table', function() {
    var tc = new GeoPackageTableCreator(geoPackage);
    const result =  tc.createSpatialReferenceSystem()
    result.should.be.equal(true);
    var verified = Verification.verifySRS(geoPackage);
    verified.should.be.equal(true);
  });

  it('should create the contents table', function() {
    var tc = new GeoPackageTableCreator(geoPackage);
    const result = tc.createContents();
    result.should.be.equal(true);
    var verified = Verification.verifyContents(geoPackage);
    verified.should.be.equal(true);
  });

  it('should create the geometry columns table', function() {
    var tc = new GeoPackageTableCreator(geoPackage);
    const result = tc.createGeometryColumns();
    result.should.be.equal(true);
    var verified = Verification.verifyGeometryColumns(geoPackage);
    verified.should.be.equal(true);
  });

  it('should create the tile matrix set table', function() {
    var tc = new GeoPackageTableCreator(geoPackage);
    const result = tc.createTileMatrixSet();
    result.should.be.equal(true);
    Verification.verifyTileMatrixSet(geoPackage).should.be.equal(true);
  });

  it('should create the tile matrix table', function() {
    var tc = new GeoPackageTableCreator(geoPackage);
    const result = tc.createTileMatrix();
    result.should.be.equal(true);
    Verification.verifyTileMatrix(geoPackage).should.be.equal(true);
  });

  it('should create the data columns table', function() {
    var tc = new GeoPackageTableCreator(geoPackage);
    const result = tc.createDataColumns();
    result.should.be.equal(true);
    Verification.verifyDataColumns(geoPackage).should.be.equal(true);
  });

  it('should create the data column constraints table', function() {
    var tc = new GeoPackageTableCreator(geoPackage);
    const result = tc.createDataColumnConstraints();
    result.should.be.equal(true);
    Verification.verifyDataColumnConstraints(geoPackage).should.be.equal(true);
  });

  it('should create the metadata table', function() {
    var tc = new GeoPackageTableCreator(geoPackage);
    const result = tc.createMetadata();
    result.should.be.equal(true);
    Verification.verifyMetadata(geoPackage).should.be.equal(true);
  });

  it('should create the metadata reference', function() {
    var tc = new GeoPackageTableCreator(geoPackage);
    const result = tc.createMetadataReference();
    result.should.be.equal(true);
    Verification.verifyMetadataReference(geoPackage).should.be.equal(true);
  });

  it('should create the extensions table', function() {
    var tc = new GeoPackageTableCreator(geoPackage);
    const result = tc.createExtensions();
    result.should.be.equal(true);
    Verification.verifyExtensions(geoPackage).should.be.equal(true);
  });

  it('should create the table index table', function() {
    var tc = new GeoPackageTableCreator(geoPackage);
    const result = tc.createTableIndex();
    result.should.be.equal(true);
    Verification.verifyTableIndex(geoPackage).should.be.equal(true);
  });

  it('should create the geometry index table', function() {
    var tc = new GeoPackageTableCreator(geoPackage);
    const result = tc.createGeometryIndex();
    result.should.be.equal(true);
    Verification.verifyGeometryIndex(geoPackage).should.be.equal(true);
  });

  it('should create the feature tile link table', function() {
    var tc = new GeoPackageTableCreator(geoPackage);
    const result = tc.createFeatureTileLink();
    result.should.be.equal(true);
    Verification.verifyFeatureTileLink(geoPackage).should.be.equal(true);
  });

  it('should create the required tables', function() {
    var tc = new GeoPackageTableCreator(geoPackage);
    tc.createRequired();
    Verification.verifyContents(geoPackage).should.be.equal(true);
    Verification.verifySRS(geoPackage).should.be.equal(true);
    var count = geoPackage.getDatabase().count('gpkg_spatial_ref_sys');
    count.should.be.equal(4);
  });

  it('should create a user tile table', function(done) {
    var columns = TileTable.createRequiredColumns();
    var tileTable = new TileTable('test_tiles', columns);
    var tc = new GeoPackageTableCreator(geoPackage);
    var result = tc.createUserTable(tileTable);
    should.exist(result);
    Verification.verifyTableExists(geoPackage, 'test_tiles').should.be.equal(true);
    done();
  });

  it('should create a user feature table', function(done) {
    var featureTable = SetupFeatureTable.buildFeatureTable('test_features', 'geom', GeometryType.POINT);
    var tc = new GeoPackageTableCreator(geoPackage);
    var result = tc.createUserTable(featureTable);
    Verification.verifyTableExists(geoPackage, 'test_features').should.be.equal(true);
    done();
  });

});
