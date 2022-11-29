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
  var tc;

  beforeEach(async function() {
    geoPackage = await testSetup.createBareGeoPackage(testGeoPackage);
    tc = new GeoPackageTableCreator(geoPackage);

  });

  afterEach(async function() {
    geoPackage.close();
    await testSetup.deleteGeoPackage(testGeoPackage);
  });

  it('should create the spatial reference system table', function() {
    const result =  tc.createSpatialReferenceSystem()
    result.should.be.equal(true);
    var verified = Verification.verifySRS(geoPackage);
    verified.should.be.equal(true);
  });

  it('should create the contents table', function() {
    const result = tc.createContents();
    result.should.be.equal(true);
    var verified = Verification.verifyContents(geoPackage);
    verified.should.be.equal(true);
  });

  it('should create the geometry columns table', function() {
    const result = tc.createGeometryColumns();
    result.should.be.equal(true);
    var verified = Verification.verifyGeometryColumns(geoPackage);
    verified.should.be.equal(true);
  });

  it('should create the tile matrix set table', function() {
    const result = tc.createTileMatrixSet();
    result.should.be.equal(true);
    Verification.verifyTileMatrixSet(geoPackage).should.be.equal(true);
  });

  it('should create the tile matrix table', function() {
    const result = tc.createTileMatrix();
    result.should.be.equal(true);
    Verification.verifyTileMatrix(geoPackage).should.be.equal(true);
  });

  it('should create the data columns table', function() {
    const result = tc.createDataColumns();
    result.should.be.equal(true);
    Verification.verifyDataColumns(geoPackage).should.be.equal(true);
  });

  it('should create the data column constraints table', function() {
    const result = tc.createDataColumnConstraints();
    result.should.be.equal(true);
    Verification.verifyDataColumnConstraints(geoPackage).should.be.equal(true);
  });

  it('should create the metadata table', function() {
    const result = tc.createMetadata();
    result.should.be.equal(true);
    Verification.verifyMetadata(geoPackage).should.be.equal(true);
  });

  it('should create the metadata reference', function() {
    const result = tc.createMetadataReference();
    result.should.be.equal(true);
    Verification.verifyMetadataReference(geoPackage).should.be.equal(true);
  });

  it('should create the extensions table', function() {
    const result = tc.createExtensions();
    result.should.be.equal(true);
    Verification.verifyExtensions(geoPackage).should.be.equal(true);
  });

  it('should create the table index table', function() {
    const result = tc.createTableIndex();
    result.should.be.equal(true);
    Verification.verifyTableIndex(geoPackage).should.be.equal(true);
  });

  it('should create the geometry index table', function() {
    const result = tc.createGeometryIndex();
    result.should.be.equal(true);
    Verification.verifyGeometryIndex(geoPackage).should.be.equal(true);
  });

  it('should create the feature tile link table', function() {
    const result = tc.createFeatureTileLink();
    result.should.be.equal(true);
    Verification.verifyFeatureTileLink(geoPackage).should.be.equal(true);
  });

  it('should create the required tables', function() {
    tc.createRequired();
    Verification.verifyContents(geoPackage).should.be.equal(true);
    Verification.verifySRS(geoPackage).should.be.equal(true);
    const count = geoPackage.getDatabase().count('gpkg_spatial_ref_sys');
    count.should.be.equal(4);
  });

  it('should create a user tile table', function(done) {
    const columns = TileTable.createRequiredColumns();
    const tileTable = new TileTable('test_tiles', columns);
    const result = tc.createUserTable(tileTable);
    should.exist(result);
    Verification.verifyTableExists(geoPackage, 'test_tiles').should.be.equal(true);
    done();
  });

  it('should create a user feature table', function(done) {
    const featureTable = SetupFeatureTable.buildFeatureTable('test_features', 'geom', GeometryType.POINT);
    tc.createUserTable(featureTable);
    Verification.verifyTableExists(geoPackage, 'test_features').should.be.equal(true);
    done();
  });

});
