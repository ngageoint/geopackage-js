import { default as testSetup } from '../../fixtures/testSetup'
import { TableCreator } from '../../../lib/db/tableCreator'

var TileTable = require('../../../lib/tiles/user/tileTable').TileTable
  , SetupFeatureTable = require('../../fixtures/setupFeatureTable.js')
  , Verification = require('../../fixtures/verification')
  , wkb = require('../../../lib/wkb/index').WKB
  , should = require('chai').should()
  , GeometryType = require('../../../lib/features/user/geometryType').GeometryType
  , path = require('path');

describe('TableCreator tests', function() {

  var testGeoPackage = path.join(__dirname, '..', '..', 'fixtures', 'tmp', testSetup.createTempName());
  var geopackage;

  beforeEach(async function() {
    geopackage = await testSetup.createBareGeoPackage(testGeoPackage);
  });

  afterEach(async function() {
    geopackage.close();
    await testSetup.deleteGeoPackage(testGeoPackage);
  });

  it('should create the spatial reference system table', function() {
    var tc = new TableCreator(geopackage);
    const result =  tc.createSpatialReferenceSystem()
    result.should.be.equal(true);
    var verified = Verification.verifySRS(geopackage);
    verified.should.be.equal(true);
  });

  it('should create the contents table', function() {
    var tc = new TableCreator(geopackage);
    const result = tc.createContents();
    result.should.be.equal(true);
    var verified = Verification.verifyContents(geopackage);
    verified.should.be.equal(true);
  });

  it('should create the geometry columns table', function() {
    var tc = new TableCreator(geopackage);
    const result = tc.createGeometryColumns();
    result.should.be.equal(true);
    var verified = Verification.verifyGeometryColumns(geopackage);
    verified.should.be.equal(true);
  });

  it('should create the tile matrix set table', function() {
    var tc = new TableCreator(geopackage);
    const result = tc.createTileMatrixSet();
    result.should.be.equal(true);
    Verification.verifyTileMatrixSet(geopackage).should.be.equal(true);
  });

  it('should create the tile matrix table', function() {
    var tc = new TableCreator(geopackage);
    const result = tc.createTileMatrix();
    result.should.be.equal(true);
    Verification.verifyTileMatrix(geopackage).should.be.equal(true);
  });

  it('should create the data columns table', function() {
    var tc = new TableCreator(geopackage);
    const result = tc.createDataColumns();
    result.should.be.equal(true);
    Verification.verifyDataColumns(geopackage).should.be.equal(true);
  });

  it('should create the data column constraints table', function() {
    var tc = new TableCreator(geopackage);
    const result = tc.createDataColumnConstraints();
    result.should.be.equal(true);
    Verification.verifyDataColumnConstraints(geopackage).should.be.equal(true);
  });

  it('should create the metadata table', function() {
    var tc = new TableCreator(geopackage);
    const result = tc.createMetadata();
    result.should.be.equal(true);
    Verification.verifyMetadata(geopackage).should.be.equal(true);
  });

  it('should create the metadata reference', function() {
    var tc = new TableCreator(geopackage);
    const result = tc.createMetadataReference();
    result.should.be.equal(true);
    Verification.verifyMetadataReference(geopackage).should.be.equal(true);
  });

  it('should create the extensions table', function() {
    var tc = new TableCreator(geopackage);
    const result = tc.createExtensions();
    result.should.be.equal(true);
    Verification.verifyExtensions(geopackage).should.be.equal(true);
  });

  it('should create the table index table', function() {
    var tc = new TableCreator(geopackage);
    const result = tc.createTableIndex();
    result.should.be.equal(true);
    Verification.verifyTableIndex(geopackage).should.be.equal(true);
  });

  it('should create the geometry index table', function() {
    var tc = new TableCreator(geopackage);
    const result = tc.createGeometryIndex();
    result.should.be.equal(true);
    Verification.verifyGeometryIndex(geopackage).should.be.equal(true);
  });

  it('should create the feature tile link table', function() {
    var tc = new TableCreator(geopackage);
    const result = tc.createFeatureTileLink();
    result.should.be.equal(true);
    Verification.verifyFeatureTileLink(geopackage).should.be.equal(true);
  });

  it('should create the required tables', function() {
    var tc = new TableCreator(geopackage);
    tc.createRequired();
    Verification.verifyContents(geopackage).should.be.equal(true);
    Verification.verifySRS(geopackage).should.be.equal(true);
    var count = geopackage.database.count('gpkg_spatial_ref_sys');
    count.should.be.equal(4);
  });

  it('should create a user tile table', function(done) {
    var columns = TileTable.createRequiredColumns();
    var tileTable = new TileTable('test_tiles', columns);
    var tc = new TableCreator(geopackage);
    var result = tc.createUserTable(tileTable);
    should.exist(result);
    Verification.verifyTableExists(geopackage, 'test_tiles').should.be.equal(true);
    done();
  });

  it('should create a user feature table', function(done) {
    var featureTable = SetupFeatureTable.buildFeatureTable('test_features', 'geom', GeometryType.POINT);
    var tc = new TableCreator(geopackage);
    var result = tc.createUserTable(featureTable);
    Verification.verifyTableExists(geopackage, 'test_features').should.be.equal(true);
    done();
  });

});
