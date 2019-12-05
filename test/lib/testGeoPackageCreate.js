import { default as testSetup } from '../fixtures/testSetup'

var GeoPackageConnection = require('../../lib/db/geoPackageConnection')
  , GeoPackage = require('../../lib/geoPackage')
  , Verification = require('../fixtures/verification')
  , TileTable = require('../../lib/tiles/user/tileTable').default
  , SetupFeatureTable = require('../fixtures/setupFeatureTable')
  , should = require('chai').should()
  , wkx = require('wkx')
  , wkb = require('../../lib/wkb')
  , path = require('path');

describe('GeoPackage create tests', function() {

  var testGeoPackage;
  var testPath = path.join(__dirname, '..', 'tmp');
  var geopackage;

  beforeEach(function(done) {
    testGeoPackage = path.join(testPath, testSetup.createTempName());
    testSetup.createGeoPackage(testGeoPackage, function(err, gp) {
      geopackage = gp;
      done();
    });
  });

  afterEach(function(done) {
    geopackage.close();
    testSetup.deleteGeoPackage(testGeoPackage, done);
  });

  it('should get return an empty array if asking for tile tables when they do not exist', function() {
    var tables = geopackage.getTileTables();
    should.exist(tables);
    tables.length.should.be.equal(0);
  });

  it('should create the geometry columns table', function() {
    return geopackage.createGeometryColumnsTable()
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyGeometryColumns(geopackage).should.be.equal(true);
    });
  });

  it('should not fail if the geometry columns table already exists', function() {
    return geopackage.createGeometryColumnsTable()
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyGeometryColumns(geopackage).should.be.equal(true);
    })
    .then(function() {
      return geopackage.createGeometryColumnsTable();
    })
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyGeometryColumns(geopackage).should.be.equal(true);
    });
  });

  it('should create a user feature table', function(done) {
    var featureTable = SetupFeatureTable.buildFeatureTable('test_features', 'geom',  wkb.typeMap.wkt.Point);
    var result = geopackage.createFeatureTable(featureTable);
    Verification.verifyTableExists(geopackage, 'test_features').should.be.equal(true);
    done();
  });

  it('should create the tile matrix set table', function() {
    return geopackage.createTileMatrixSetTable()
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyTileMatrixSet(geopackage).should.be.equal(true);
    });
  });

  it('should not fail if the tile matrix set table already exists', function() {
    return geopackage.createTileMatrixSetTable()
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyTileMatrixSet(geopackage).should.be.equal(true);
    })
    .then(function() {
      return geopackage.createTileMatrixSetTable();
    })
    .then(function(created) {
      created.should.be.equal(true);
    });
  });

  it('should create the tile matrix table', function() {
    return geopackage.createTileMatrixTable()
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyTileMatrix(geopackage).should.be.equal(true);
    });
  });

  it('should not fail if the tile matrix table already exists', function() {
    return geopackage.createTileMatrixTable()
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyTileMatrix(geopackage).should.be.equal(true);
    })
    .then(function() {
      return geopackage.createTileMatrixTable();
    })
    .then(function(created) {
      created.should.be.equal(true);
    });
  });

  it('should create a user tile table', function(done) {
    var columns = TileTable.createRequiredColumns();
    var tileTable = new TileTable('test_tiles', columns);
    var result = geopackage.createTileTable(tileTable);
    Verification.verifyTableExists(geopackage, 'test_tiles').should.be.equal(true);
    done();
  });

  it('should create the data columns table', function() {
    return geopackage.createDataColumns()
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyDataColumns(geopackage).should.be.equal(true);
    });
  });

  it('should not fail if the data columns table already exists', function() {
    return geopackage.createDataColumns()
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyDataColumns(geopackage).should.be.equal(true);
    })
    .then(function() {
      return geopackage.createDataColumns()
    })
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyDataColumns(geopackage).should.be.equal(true);
    });
  });

  it('should create the data column constraints table', function() {
    return geopackage.createDataColumnConstraintsTable()
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyDataColumnConstraints(geopackage).should.be.equal(true);
    });
  });

  it('should not fail if the data column constraints table already exists', function() {
    return geopackage.createDataColumnConstraintsTable()
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyDataColumnConstraints(geopackage).should.be.equal(true);
    })
    .then(function() {
      return geopackage.createDataColumnConstraintsTable()
    })
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyDataColumnConstraints(geopackage).should.be.equal(true);
    });
  });

  it('should create the metadata reference table', function() {
    return geopackage.createMetadataReferenceTable()
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyMetadataReference(geopackage).should.be.equal(true);
    });
  });

  it('should not fail if the metadata reference table already exists', function() {
    geopackage.createMetadataReferenceTable()
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyMetadataReference(geopackage).should.be.equal(true);
    })
    .then(function() {
      return geopackage.createMetadataReferenceTable()
    })
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyMetadataReference(geopackage).should.be.equal(true);
    });
  });

  it('should create the metadata table', function() {
    return geopackage.createMetadataTable()
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyMetadata(geopackage).should.be.equal(true);
    });
  });

  it('should not fail if the metadata table already exists', function() {
    geopackage.createMetadataTable()
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyMetadata(geopackage).should.be.equal(true);
    })
    .then(function() {
      return geopackage.createMetadataTable();
    })
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyMetadata(geopackage).should.be.equal(true);
    });
  });

  it('should create the extensions table', function() {
    return geopackage.createExtensionTable()
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyExtensions(geopackage).should.be.equal(true);
    });
  });

  it('should not fail if the extensions table already exists', function() {
    return geopackage.createExtensionTable()
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyExtensions(geopackage).should.be.equal(true);
    })
    .then(function() {
      return geopackage.createExtensionTable();
    })
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyExtensions(geopackage).should.be.equal(true);
    });
  });

  it('should create the table index table', function() {
    return geopackage.createTableIndexTable()
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyTableIndex(geopackage).should.be.equal(true);
    });
  });

  it('should not fail if the table index table already exists', function() {
    return geopackage.createTableIndexTable()
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyTableIndex(geopackage).should.be.equal(true);
    })
    .then(function() {
      return geopackage.createTableIndexTable();
    })
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyTableIndex(geopackage).should.be.equal(true);
    });
  });

  it('should create the geometry index table', function() {
    return geopackage.createGeometryIndexTable()
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyGeometryIndex(geopackage).should.be.equal(true);
    });
  });

  it('should not fail if the geometry index table already exists', function() {
    return geopackage.createGeometryIndexTable()
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyGeometryIndex(geopackage).should.be.equal(true);
    })
    .then(function() {
      return geopackage.createGeometryIndexTable();
    })
    .then(function(created) {
      created.should.be.equal(true);
      Verification.verifyGeometryIndex(geopackage).should.be.equal(true);
    });
  });

  it.skip('should create the feature tile link table', function(done) {
    geopackage.createFeatureTileLinkTable(function(err, result) {
      should.not.exist(err);
      Verification.verifyFeatureTileLink(geopackage).should.be.equal(true);
      done();
    });
  });
});
