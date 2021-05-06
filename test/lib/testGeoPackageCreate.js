import { default as testSetup } from '../fixtures/testSetup'

var Verification = require('../fixtures/verification')
  , TileTable = require('../../lib/tiles/user/tileTable').TileTable
  , GeometryType = require('../../lib/features/user/geometryType').GeometryType
  , SetupFeatureTable = require('../fixtures/setupFeatureTable')
  , should = require('chai').should();

describe('GeoPackage create tests', function() {

  var testGeoPackage;
  var geopackage;

  beforeEach(async function() {
    let created = await testSetup.createTmpGeoPackage();
    testGeoPackage = created.path;
    geopackage = created.geopackage;
  });

  afterEach(async function() {
    geopackage.close();
    await testSetup.deleteGeoPackage(testGeoPackage);
  });

  it('should get return an empty array if asking for tile tables when they do not exist', function() {
    var tables = geopackage.getTileTables();
    should.exist(tables);
    tables.length.should.be.equal(0);
  });

  it('should create the geometry columns table', function() {
    let created = geopackage.createGeometryColumnsTable();
    created.should.be.equal(true);
    Verification.verifyGeometryColumns(geopackage).should.be.equal(true);
  });

  it('should not fail if the geometry columns table already exists', function() {
    let created =  geopackage.createGeometryColumnsTable();
    created.should.be.equal(true);
    Verification.verifyGeometryColumns(geopackage).should.be.equal(true);
    created.should.be.equal(true);
    Verification.verifyGeometryColumns(geopackage).should.be.equal(true);
    created = geopackage.createGeometryColumnsTable();
    created.should.be.equal(true);
    Verification.verifyGeometryColumns(geopackage).should.be.equal(true);
  });

  it('should create a user feature table', function(done) {
    var featureTable = SetupFeatureTable.buildFeatureTable('test_features', 'geom',  GeometryType.POINT);
    var result = geopackage.createUserFeatureTable(featureTable);
    Verification.verifyTableExists(geopackage, 'test_features').should.be.equal(true);
    done();
  });

  it('should create the tile matrix set table', function() {
    let created =  geopackage.createTileMatrixSetTable();
    created.should.be.equal(true);
    Verification.verifyTileMatrixSet(geopackage).should.be.equal(true);
  });

  it('should not fail if the tile matrix set table already exists', function() {
    let created = geopackage.createTileMatrixSetTable();
    created.should.be.equal(true);
    Verification.verifyTileMatrixSet(geopackage).should.be.equal(true);
    created = geopackage.createTileMatrixSetTable();
    created.should.be.equal(true);
  });

  it('should create the tile matrix table', function() {
    let created = geopackage.createTileMatrixTable();
    created.should.be.equal(true);
    Verification.verifyTileMatrix(geopackage).should.be.equal(true);
  });

  it('should not fail if the tile matrix table already exists', function() {
    let created = geopackage.createTileMatrixTable();
    created.should.be.equal(true);
    Verification.verifyTileMatrix(geopackage).should.be.equal(true);
    created = geopackage.createTileMatrixTable();
    created.should.be.equal(true);
  });

  it('should create a user tile table', function(done) {
    var columns = TileTable.createRequiredColumns();
    var tileTable = new TileTable('test_tiles', columns);
    var result = geopackage.createTileTable(tileTable);
    Verification.verifyTableExists(geopackage, 'test_tiles').should.be.equal(true);
    done();
  });

  it('should create the data columns table', function() {
    let created = geopackage.createDataColumns();
    created.should.be.equal(true);
    Verification.verifyDataColumns(geopackage).should.be.equal(true);
  });

  it('should not fail if the data columns table already exists', function() {
    let created = geopackage.createDataColumns();
    created.should.be.equal(true);
    Verification.verifyDataColumns(geopackage).should.be.equal(true);
    created = geopackage.createDataColumns();
    created.should.be.equal(true);
    Verification.verifyDataColumns(geopackage).should.be.equal(true);
  });

  it('should create the data column constraints table', function() {
    let created = geopackage.createDataColumnConstraintsTable();
    created.should.be.equal(true);
    Verification.verifyDataColumnConstraints(geopackage).should.be.equal(true);
  });

  it('should not fail if the data column constraints table already exists', function() {
    let created = geopackage.createDataColumnConstraintsTable();
    created.should.be.equal(true);
    Verification.verifyDataColumnConstraints(geopackage).should.be.equal(true);
    created = geopackage.createDataColumnConstraintsTable();
    created.should.be.equal(true);
    Verification.verifyDataColumnConstraints(geopackage).should.be.equal(true);
  });

  it('should create the metadata reference table', function() {
    let created = geopackage.createMetadataReferenceTable();
    created.should.be.equal(true);
    Verification.verifyMetadataReference(geopackage).should.be.equal(true);
  });

  it('should not fail if the metadata reference table already exists', function() {
    let created = geopackage.createMetadataReferenceTable();
    created.should.be.equal(true);
    Verification.verifyMetadataReference(geopackage).should.be.equal(true);
    created = geopackage.createMetadataReferenceTable();
    created.should.be.equal(true);
    Verification.verifyMetadataReference(geopackage).should.be.equal(true);
  });

  it('should create the metadata table', function() {
    let created = geopackage.createMetadataTable();
    created.should.be.equal(true);
    Verification.verifyMetadata(geopackage).should.be.equal(true);
  });

  it('should not fail if the metadata table already exists', function() {
    let created = geopackage.createMetadataTable();
    created.should.be.equal(true);
    Verification.verifyMetadata(geopackage).should.be.equal(true);
    created = geopackage.createMetadataTable();
    created.should.be.equal(true);
    Verification.verifyMetadata(geopackage).should.be.equal(true);
  });

  it('should create the extensions table', function() {
    let created = geopackage.createExtensionTable();
    created.should.be.equal(true);
    Verification.verifyExtensions(geopackage).should.be.equal(true);
  });

  it('should not fail if the extensions table already exists', function() {
    let created = geopackage.createExtensionTable();
    created.should.be.equal(true);
    Verification.verifyExtensions(geopackage).should.be.equal(true);
    created = geopackage.createExtensionTable();
    created.should.be.equal(true);
    Verification.verifyExtensions(geopackage).should.be.equal(true);
  });

  it('should create the table index table', function() {
    let created = geopackage.createTableIndexTable();
    created.should.be.equal(true);
    Verification.verifyTableIndex(geopackage).should.be.equal(true);
  });

  it('should not fail if the table index table already exists', function() {
    let created = geopackage.createTableIndexTable();
    created.should.be.equal(true);
    Verification.verifyTableIndex(geopackage).should.be.equal(true);
    created = geopackage.createTableIndexTable();
    created.should.be.equal(true);
    Verification.verifyTableIndex(geopackage).should.be.equal(true);
  });

  it('should create the geometry index table', function() {
    let created = geopackage.createGeometryIndexTable();
    created.should.be.equal(true);
    Verification.verifyGeometryIndex(geopackage).should.be.equal(true);
  });

  it('should not fail if the geometry index table already exists', function() {
    let created = geopackage.createGeometryIndexTable();
    created.should.be.equal(true);
    Verification.verifyGeometryIndex(geopackage).should.be.equal(true);
    created = geopackage.createGeometryIndexTable();
    created.should.be.equal(true);
    Verification.verifyGeometryIndex(geopackage).should.be.equal(true);
  });

  it.skip('should create the feature tile link table', function(done) {
    let created = geopackage.createFeatureTileLink();
    created.should.be.equal(true);
    Verification.verifyFeatureTileLink(geopackage).should.be.equal(true);
  });
});
