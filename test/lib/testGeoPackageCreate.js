var GeoPackageConnection = require('../../lib/db/geoPackageConnection')
  , GeoPackage = require('../../lib/geoPackage')
  , Verification = require('../fixtures/verification')
  , TileTable = require('../../lib/tiles/user/tileTable')
  , SetupFeatureTable = require('../fixtures/setupFeatureTable')
  , testSetup = require('../fixtures/testSetup')
  , should = require('chai').should()
  , wkx = require('wkx')
  , path = require('path')
  , async = require('async');

describe('GeoPackage create tests', function() {

  var testGeoPackage = path.join(__dirname, '..', 'tmp', 'test.gpkg');
  var geopackage;

  beforeEach(function(done) {
    testSetup.deleteGeoPackage(testGeoPackage, function() {
      testSetup.createGeoPackage(testGeoPackage, function(err, gp) {
        geopackage = gp;
        done();
      });
    });
  });

  afterEach(function(done) {
    geopackage.close();
    testSetup.deleteGeoPackage(testGeoPackage, done);
  });

  it('should get return an empty array if asking for tile tables when they do not exist', function(done) {
    geopackage.getTileTables(function(err, tables) {
      should.not.exist(err);
      should.exist(tables);
      tables.length.should.be.equal(0);
      done();
    });
  });

  it('should create the geometry columns table', function(done) {
    geopackage.createGeometryColumnsTable(function(err, result) {
      should.not.exist(err);
      Verification.verifyGeometryColumns(geopackage, done);
    });
  });

  it('should not fail if the geometry columns table already exists', function(done) {
    geopackage.createGeometryColumnsTable(function(err, result) {
      should.not.exist(err);
      should.exist(result);
      Verification.verifyGeometryColumns(geopackage, function (err) {
        if (err) return done(err);
        geopackage.createGeometryColumnsTable(function(err, result) {
          should.not.exist(err);
          should.exist(result);
          Verification.verifyGeometryColumns(geopackage, done);
        });
      });
    });
  });

  it('should create a user feature table', function(done) {
    var featureTable = SetupFeatureTable.buildFeatureTable('test_features', 'geom', wkx.Types.wkt.Point);
    geopackage.createFeatureTable(featureTable, function(err, result) {
      Verification.verifyTableExists(geopackage, 'test_features', done);
    });
  });

  it('should create the tile matrix set table', function(done) {
    geopackage.createTileMatrixSetTable(function(err, result) {
      should.not.exist(err);
      should.exist(result);
      Verification.verifyTileMatrixSet(geopackage, done);
    });
  });

  it('should not fail if the tile matrix set table already exists', function(done) {
    geopackage.createTileMatrixSetTable(function(err, result) {
      should.not.exist(err);
      should.exist(result);
      Verification.verifyTileMatrixSet(geopackage, function(err) {
        if (err) return done(err);
        geopackage.createTileMatrixSetTable(function(err, result) {
          should.not.exist(err);
          should.exist(result);
          done();
        });
      });
    });
  });

  it('should create the tile matrix table', function(done) {
    geopackage.createTileMatrixTable(function(err, result) {
      should.not.exist(err);
      Verification.verifyTileMatrix(geopackage, done);
    });
  });

  it('should not fail if the tile matrix table already exists', function(done) {
    geopackage.createTileMatrixTable(function(err, result) {
      should.not.exist(err);
      should.exist(result);
      Verification.verifyTileMatrix(geopackage, function(err) {
        if (err) return done(err);
        geopackage.createTileMatrixTable(function(err, result) {
          should.not.exist(err);
          should.exist(result);
          done();
        });
      });
    });
  });

  it('should create a user tile table', function(done) {
    var columns = TileTable.createRequiredColumns();
    var tileTable = new TileTable('test_tiles', columns);
    geopackage.createTileTable(tileTable, function(err, result) {
      Verification.verifyTableExists(geopackage, 'test_tiles', done);
    });
  });

  it('should create the data columns table', function(done) {
    geopackage.createDataColumns(function(err, result) {
      should.not.exist(err);
      Verification.verifyDataColumns(geopackage, done);
    });
  });

  it('should not fail if the data columns table already exists', function(done) {
    geopackage.createDataColumns(function(err, result) {
      should.not.exist(err);
      should.exist(result);
      Verification.verifyDataColumns(geopackage, function(err) {
        if (err) return done(err);
        geopackage.createDataColumns(function(err, result) {
          should.not.exist(err);
          should.exist(result);
          Verification.verifyDataColumns(geopackage, done);
        });
      });
    });
  });

  it('should create the data column constraints table', function(done) {
    geopackage.createDataColumnConstraintsTable(function(err, result) {
      should.not.exist(err);
      should.exist(result);
      Verification.verifyDataColumnConstraints(geopackage, done);
    });
  });

  it('should not fail if the data column constraints table already exists', function(done) {
    geopackage.createDataColumnConstraintsTable(function(err, result) {
      should.not.exist(err);
      should.exist(result);
      Verification.verifyDataColumnConstraints(geopackage, function(err) {
        if (err) return done(err);
        geopackage.createDataColumnConstraintsTable(function(err, result) {
          should.not.exist(err);
          should.exist(result);
          Verification.verifyDataColumnConstraints(geopackage, done);
        });
      });
    });
  });

  it('should create the metadata reference table', function(done) {
    geopackage.createMetadataReferenceTable(function(err, result) {
      should.not.exist(err);
      Verification.verifyMetadataReference(geopackage, done);
    });
  });

  it('should not fail if the metadata reference table already exists', function(done) {
    geopackage.createMetadataReferenceTable(function(err, result) {
      should.not.exist(err);
      should.exist(result);
      Verification.verifyMetadataReference(geopackage, function(err) {
        if (err) return done(err);
        geopackage.createMetadataReferenceTable(function(err, result) {
          should.not.exist(err);
          should.exist(result);
          Verification.verifyMetadataReference(geopackage, done);
        });
      });
    });
  });

  it('should create the metadata table', function(done) {
    geopackage.createMetadataTable(function(err, result) {
      should.not.exist(err);
      Verification.verifyMetadata(geopackage, done);
    });
  });

  it('should not fail if the metadata table already exists', function(done) {
    geopackage.createMetadataTable(function(err, result) {
      should.not.exist(err);
      should.exist(result);
      Verification.verifyMetadata(geopackage, function(err) {
        if (err) return done(err);
        geopackage.createMetadataTable(function(err, result) {
          should.not.exist(err);
          should.exist(result);
          Verification.verifyMetadata(geopackage, done);
        });
      });
    });
  });

  it('should create the extensions table', function(done) {
    geopackage.createExtensionTable(function(err, result) {
      should.not.exist(err);
      Verification.verifyExtensions(geopackage, done);
    });
  });

  it('should not fail if the extensions table already exists', function(done) {
    geopackage.createExtensionTable(function(err, result) {
      should.not.exist(err);
      should.exist(result);
      Verification.verifyExtensions(geopackage, function(err) {
        if (err) return done(err);
        geopackage.createExtensionTable(function(err, result) {
          should.not.exist(err);
          should.exist(result);
          Verification.verifyExtensions(geopackage, done);
        });
      });
    });
  });

  it('should create the table index table', function(done) {
    geopackage.createTableIndexTable(function(err, result) {
      should.not.exist(err);
      Verification.verifyTableIndex(geopackage, done);
    });
  });

  it('should not fail if the table index table already exists', function(done) {
    geopackage.createTableIndexTable(function(err, result) {
      should.not.exist(err);
      should.exist(result);
      Verification.verifyTableIndex(geopackage, function(err) {
        if (err) return done(err);
        geopackage.createTableIndexTable(function(err, result) {
          should.not.exist(err);
          should.exist(result);
          Verification.verifyTableIndex(geopackage, done);
        });
      });
    });
  });

  it('should create the geometry index table', function(done) {
    geopackage.createGeometryIndexTable(function(err, result) {
      should.not.exist(err);
      Verification.verifyGeometryIndex(geopackage, done);
    });
  });

  it('should not fail if the geometry index table already exists', function(done) {
    geopackage.createGeometryIndexTable(function(err, result) {
      should.not.exist(err);
      should.exist(result);
      Verification.verifyGeometryIndex(geopackage, function(err) {
        if (err) return done(err);
        geopackage.createGeometryIndexTable(function(err, result) {
          should.not.exist(err);
          should.exist(result);
          Verification.verifyGeometryIndex(geopackage, done);
        });
      });
    });
  });

  it.skip('should create the feature tile link table', function(done) {
    geopackage.createFeatureTileLinkTable(function(err, result) {
      should.not.exist(err);
      Verification.verifyFeatureTileLink(geopackage, done);
    });
  });
});
