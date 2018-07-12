var GeoPackageConnection = require('../../lib/db/geoPackageConnection')
  , GeoPackage = require('../../lib/geoPackage')
  , FeatureColumn = require('../../lib/features/user/featureColumn')
  , Verification = require('../fixtures/verification')
  , TileTable = require('../../lib/tiles/user/tileTable')
  , TileBoundingBoxUtils = require('../../lib/tiles/tileBoundingBoxUtils')
  , SetupFeatureTable = require('../fixtures/setupFeatureTable')
  , TableCreator = require('../../lib/db/tableCreator')
  , BoundingBox = require('../../lib/boundingBox')
  , DataTypes = require('../../lib/db/dataTypes')
  , GeometryData = require('../../lib/geom/geometryData')
  , should = require('chai').should()
  , wkx = require('wkx')
  , path = require('path')
  , async = require('async')
  , testSetup = require('../fixtures/testSetup');

describe('GeoPackage Tile table create tests', function() {

  var testGeoPackage = path.join(__dirname, '..', 'tmp', 'test.gpkg');
  var tableName = 'test_tiles.test';
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

  it('should create a tile table', function(done) {

    var requiredColumns = TileTable.createRequiredColumns();
    var tileTable = new TileTable(tableName, requiredColumns);

    var result = geopackage.createTileTable(tileTable);
    Verification.verifyTableExists(geopackage, tableName).should.be.equal(true);
    done();
  });

  it('should create a tile table with parameters', function(done) {
    var contentsBoundingBox = new BoundingBox(-180, 180, -80, 80);
    var contentsSrsId = 4326;
    var tileMatrixSetBoundingBox = new BoundingBox(-180, 180, -80, 80);
    var tileMatrixSetSrsId = 4326;
    geopackage.createTileTableWithTableName(tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId, function(err, result) {
      Verification.verifyTileMatrixSet(geopackage).should.be.equal(true);
      Verification.verifyContentsForTable(geopackage, tableName).should.be.equal(true);
      Verification.verifyTableExists(geopackage, tableName).should.be.equal(true);
      done();
    });
  });

  describe('GeoPackage tile create tile matrix tests', function(done) {

    var tileMatrixSet;
    var tileMatrixSetBoundingBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);

    beforeEach(function(done) {
      var contentsBoundingBox = new BoundingBox(-180, 180, -85.0511287798066, 85.0511287798066);
      var contentsSrsId = 4326;
      var tileMatrixSetSrsId = 3857;
      geopackage.getSpatialReferenceSystemDao().createWebMercator(function(err, result) {
        should.not.exist(err);
        geopackage.createTileTableWithTableName(tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId, function(err, result) {
          should.not.exist(err);
          tileMatrixSet = result;
          Verification.verifyTileMatrixSet(geopackage).should.be.equal(true);
          Verification.verifyContentsForTable(geopackage, tableName).should.be.equal(true);
          Verification.verifyTableExists(geopackage, tableName).should.be.equal(true);
          done();
        });
      });
    });

    it('should create the tile matrix for the zoom levels', function(done){

      geopackage.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, 0, 3, function(err, result) {
        done();
      });
    });

    it('should add all of the tiles to the tile matrix', function(done){

      geopackage.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, 0, 3, function(err, result) {

        async.eachSeries([0, 1, 2, 3], function(zoom, zoomDone) {
          var tiles = [];
          var tileCount = Math.pow(2,zoom);
          for (var i = 0; i < tileCount; i++) {
            tiles.push(i);
          }
          async.eachSeries(tiles, function(xTile, xDone) {
            async.eachSeries(tiles, function(yTile, yDone) {
              testSetup.loadTile(path.join(__dirname, '..', 'fixtures', 'tiles', zoom.toString(), xTile.toString(), yTile.toString()+'.png'), function(err, image) {
                geopackage.addTile(image, tableName, zoom, yTile, xTile, function(err, result) {
                  yDone();
                });
              });
            }, xDone);
          }, zoomDone);
        }, function(err) {
          geopackage.getTileDaoWithTableName(tableName, function(err, tileDao) {
            tileDao.getCount(function(err, result) {
              result.should.be.equal(85);
              done(err);
            });
          });
        });
      });
    });
  });

  describe('delete tile tests', function(done) {

    var tileMatrixSet;
    var tileMatrixSetBoundingBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);

    beforeEach(function(done) {
      this.timeout(5000);
      var contentsBoundingBox = new BoundingBox(-180, 180, -85.0511287798066, 85.0511287798066);
      var contentsSrsId = 4326;
      var tileMatrixSetSrsId = 3857;
      geopackage.getSpatialReferenceSystemDao().createWebMercator(function(err, result) {
        geopackage.createTileTableWithTableName(tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId, function(err, result) {
          tileMatrixSet = result;
          Verification.verifyTileMatrixSet(geopackage).should.be.equal(true);
          Verification.verifyContentsForTable(geopackage, tableName).should.be.equal(true);
          Verification.verifyTableExists(geopackage, tableName).should.be.equal(true);
          geopackage.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, 0, 3, function(err, result) {

            async.eachSeries([0, 1, 2, 3], function(zoom, zoomDone) {
              var tiles = [];
              var tileCount = Math.pow(2,zoom);
              for (var i = 0; i < tileCount; i++) {
                tiles.push(i);
              }
              async.eachSeries(tiles, function(xTile, xDone) {
                async.eachSeries(tiles, function(yTile, yDone) {
                  testSetup.loadTile(path.join(__dirname, '..', 'fixtures', 'tiles', zoom.toString(), xTile.toString(), yTile.toString()+'.png'), function(err, image) {
                    console.log('Adding tile %d, %d, %d', zoom, xTile, yTile);
                    geopackage.addTile(image, tableName, zoom, yTile, xTile, function(err, result) {
                      yDone();
                    });
                  });
                }, xDone);
              }, zoomDone);
            }, function(err) {
              geopackage.getTileDaoWithTableName(tableName, function(err, tileDao) {
                tileDao.getCount(function(err, result) {
                  result.should.be.equal(85);
                  done(err);
                });
              });
            });
          });
        });
      });
    });

    it('should delete the tiles', function(done) {
      geopackage.getTileDaoWithTableName(tableName, function(err, tileDao) {
        tileDao.getCount(function(err, result) {
          result.should.be.equal(85);
          tileDao.deleteTile(0, 0, 0, function(err, result) {
            result.should.be.equal(1);
            tileDao.getCount(function(err, result) {
              result.should.be.equal(84);
              tileDao.dropTable(function(err, result) {
                result.should.be.equal(true);
                var tileMatrixSetDao = geopackage.getTileMatrixSetDao();
                tileMatrixSetDao.delete(tileMatrixSet, function(err, results) {
                  results.should.be.equal(1);
                  done(err);
                });
              });
            });
          });
        });
      });
    });
  });
});
