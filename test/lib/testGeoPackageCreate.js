import { default as testSetup } from '../testSetup'

var Verification = require('../verification')
  , TileTable = require('../../lib/tiles/user/tileTable').TileTable
  , GeometryType = require('@ngageoint/simple-features-js').GeometryType
  , SetupFeatureTable = require('../setupFeatureTable')
  , should = require('chai').should();

describe('GeoPackage create tests', function() {

  var testGeoPackage;
  var geoPackage;

  beforeEach(async function() {
    let created = await testSetup.createTmpGeoPackage();
    testGeoPackage = created.path;
    geoPackage = created.geoPackage;
  });

  afterEach(async function() {
    geoPackage.close();
    await testSetup.deleteGeoPackage(testGeoPackage);
  });

  it('should get return an empty array if asking for tile tables when they do not exist', function() {
    var tables = geoPackage.getTileTables();
    should.exist(tables);
    tables.length.should.be.equal(0);
  });

  it('should create the geometry columns table', function() {
    let created = geoPackage.createGeometryColumnsTable();
    created.should.be.equal(true);
    Verification.verifyGeometryColumns(geoPackage).should.be.equal(true);
  });

  it('should not fail if the geometry columns table already exists', function() {
    let created =  geoPackage.createGeometryColumnsTable();
    created.should.be.equal(true);
    Verification.verifyGeometryColumns(geoPackage).should.be.equal(true);
    created.should.be.equal(true);
    Verification.verifyGeometryColumns(geoPackage).should.be.equal(true);
    created = geoPackage.createGeometryColumnsTable();
    created.should.be.equal(false);
    Verification.verifyGeometryColumns(geoPackage).should.be.equal(true);
  });

  it('should create a user feature table', function(done) {
    var featureTable = SetupFeatureTable.buildFeatureTable('test_features', 'geom',  GeometryType.POINT);
    var result = geoPackage.createFeatureTable(featureTable);
    Verification.verifyTableExists(geoPackage, 'test_features').should.be.equal(true);
    done();
  });

  it('should create the tile matrix set table', function() {
    let created =  geoPackage.createTileMatrixSetTable();
    created.should.be.equal(true);
    Verification.verifyTileMatrixSet(geoPackage).should.be.equal(true);
  });

  it('should not fail if the tile matrix set table already exists', function() {
    let created = geoPackage.createTileMatrixSetTable();
    created.should.be.equal(true);
    Verification.verifyTileMatrixSet(geoPackage).should.be.equal(true);
    created = geoPackage.createTileMatrixSetTable();
    created.should.be.equal(false);
  });

  it('should create the tile matrix table', function() {
    let created = geoPackage.createTileMatrixTable();
    created.should.be.equal(true);
    Verification.verifyTileMatrix(geoPackage).should.be.equal(true);
  });

  it('should not fail if the tile matrix table already exists', function() {
    let created = geoPackage.createTileMatrixTable();
    created.should.be.equal(true);
    Verification.verifyTileMatrix(geoPackage).should.be.equal(true);
    created = geoPackage.createTileMatrixTable();
    created.should.be.equal(false);
  });

  it('should create a user tile table', function(done) {
    var columns = TileTable.createRequiredColumns();
    var tileTable = new TileTable('test_tiles', columns);
    geoPackage.createTileTable(tileTable);
    Verification.verifyTableExists(geoPackage, 'test_tiles').should.be.equal(true);
    done();
  });

  it('should create the data columns table', function() {
    let created = geoPackage.createDataColumns();
    created.should.be.equal(true);
    Verification.verifyDataColumns(geoPackage).should.be.equal(true);
  });

  it('should not fail if the data columns table already exists', function() {
    let created = geoPackage.createDataColumns();
    created.should.be.equal(true);
    Verification.verifyDataColumns(geoPackage).should.be.equal(true);
    created = geoPackage.createDataColumns();
    created.should.be.equal(false);
    Verification.verifyDataColumns(geoPackage).should.be.equal(true);
  });

  it('should create the data column constraints table', function() {
    let created = geoPackage.createDataColumnConstraintsTable();
    created.should.be.equal(true);
    Verification.verifyDataColumnConstraints(geoPackage).should.be.equal(true);
  });

  it('should not fail if the data column constraints table already exists', function() {
    let created = geoPackage.createDataColumnConstraintsTable();
    created.should.be.equal(true);
    Verification.verifyDataColumnConstraints(geoPackage).should.be.equal(true);
    created = geoPackage.createDataColumnConstraintsTable();
    created.should.be.equal(true);
    Verification.verifyDataColumnConstraints(geoPackage).should.be.equal(true);
  });

  it('should create the metadata reference table', function() {
    let created = geoPackage.createMetadataReferenceTable();
    created.should.be.equal(true);
    Verification.verifyMetadataReference(geoPackage).should.be.equal(true);
  });

  it('should not fail if the metadata reference table already exists', function() {
    let created = geoPackage.createMetadataReferenceTable();
    created.should.be.equal(true);
    Verification.verifyMetadataReference(geoPackage).should.be.equal(true);
    created = geoPackage.createMetadataReferenceTable();
    created.should.be.equal(true);
    Verification.verifyMetadataReference(geoPackage).should.be.equal(true);
  });

  it('should create the metadata table', function() {
    let created = geoPackage.createMetadataTable();
    created.should.be.equal(true);
    Verification.verifyMetadata(geoPackage).should.be.equal(true);
  });

  it('should not fail if the metadata table already exists', function() {
    let created = geoPackage.createMetadataTable();
    created.should.be.equal(true);
    Verification.verifyMetadata(geoPackage).should.be.equal(true);
    created = geoPackage.createMetadataTable();
    created.should.be.equal(true);
    Verification.verifyMetadata(geoPackage).should.be.equal(true);
  });

  it('should create the extensions table', function() {
    let created = geoPackage.createExtensionsTable();
    created.should.be.equal(true);
    Verification.verifyExtensions(geoPackage).should.be.equal(true);
  });

  it('should not fail if the extensions table already exists', function() {
    let created = geoPackage.createExtensionsTable();
    created.should.be.equal(true);
    Verification.verifyExtensions(geoPackage).should.be.equal(true);
    created = geoPackage.createExtensionsTable();
    created.should.be.equal(false);
    Verification.verifyExtensions(geoPackage).should.be.equal(true);
  });

  it('should create the table index table', function() {
    let created = geoPackage.createTableIndexTable();
    created.should.be.equal(true);
    Verification.verifyTableIndex(geoPackage).should.be.equal(true);
  });

  it('should not fail if the table index table already exists', function() {
    let created = geoPackage.createTableIndexTable();
    created.should.be.equal(true);
    Verification.verifyTableIndex(geoPackage).should.be.equal(true);
    created = geoPackage.createTableIndexTable();
    created.should.be.equal(true);
    Verification.verifyTableIndex(geoPackage).should.be.equal(true);
  });

  it('should create the geometry index table', function() {
    let created = geoPackage.createGeometryIndexTable();
    created.should.be.equal(true);
    Verification.verifyGeometryIndex(geoPackage).should.be.equal(true);
  });

  it('should not fail if the geometry index table already exists', function() {
    let created = geoPackage.createGeometryIndexTable();
    created.should.be.equal(true);
    Verification.verifyGeometryIndex(geoPackage).should.be.equal(true);
    created = geoPackage.createGeometryIndexTable();
    created.should.be.equal(true);
    Verification.verifyGeometryIndex(geoPackage).should.be.equal(true);
  });

  it('should create the feature tile link table', function() {
    let created = geoPackage.createFeatureTileLinkTable();
    created.should.be.equal(true);
    Verification.verifyFeatureTileLink(geoPackage).should.be.equal(true);
  });
});
