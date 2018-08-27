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
  , testSetup = require('../fixtures/testSetup');

describe('GeoPackage Tile table create tests', function() {

  var testGeoPackage;
  var testPath = path.join(__dirname, '..', 'tmp');
  var tableName = 'test_tiles.test';
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

  it('should create a tile table', function() {

    var requiredColumns = TileTable.createRequiredColumns();
    var tileTable = new TileTable(tableName, requiredColumns);

    var result = geopackage.createTileTable(tileTable);
    Verification.verifyTableExists(geopackage, tableName).should.be.equal(true);
  });

  it('should create a tile table with parameters', function() {
    var contentsBoundingBox = new BoundingBox(-180, 180, -80, 80);
    var contentsSrsId = 4326;
    var tileMatrixSetBoundingBox = new BoundingBox(-180, 180, -80, 80);
    var tileMatrixSetSrsId = 4326;
    return geopackage.createTileTableWithTableName(tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId)
    .then(function(result) {
      Verification.verifyTileMatrixSet(geopackage).should.be.equal(true);
      Verification.verifyContentsForTable(geopackage, tableName).should.be.equal(true);
      Verification.verifyTableExists(geopackage, tableName).should.be.equal(true);
    });
  });

  describe('GeoPackage tile create tile matrix tests', function(done) {

    var tileMatrixSet;
    var tileMatrixSetBoundingBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);

    beforeEach(function() {
      var contentsBoundingBox = new BoundingBox(-180, 180, -85.0511287798066, 85.0511287798066);
      var contentsSrsId = 4326;
      var tileMatrixSetSrsId = 3857;
      geopackage.getSpatialReferenceSystemDao().createWebMercator();
      return geopackage.createTileTableWithTableName(tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId)
      .then(function(result) {
        tileMatrixSet = result;
        Verification.verifyTileMatrixSet(geopackage).should.be.equal(true);
        Verification.verifyContentsForTable(geopackage, tableName).should.be.equal(true);
        Verification.verifyTableExists(geopackage, tableName).should.be.equal(true);
      });
    });

    it('should create the tile matrix for the zoom levels', function(){
      geopackage.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, 0, 3);
    });

    it('should add all of the tiles to the tile matrix', function(){

      geopackage.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, 0, 3);

      var zooms = [0, 1, 2, 3];

      return zooms.reduce(function(zoomSequence, zoom) {
        return zoomSequence.then(function() {
          var xtiles = [];
          var tileCount = Math.pow(2,zoom);
          for (var i = 0; i < tileCount; i++) {
            xtiles.push(i);
          }
          return xtiles.reduce(function(xSequence, x) {
            return xSequence.then(function() {
              var ytiles = [];
              var tileCount = Math.pow(2,zoom);
              for (var i = 0; i < tileCount; i++) {
                ytiles.push(i);
              }
              return ytiles.reduce(function(ySequence, y) {
                return ySequence.then(function() {
                  return new Promise(function(resolve, reject) {
                    testSetup.loadTile(path.join(__dirname, '..', 'fixtures', 'tiles', zoom.toString(), x.toString(), y.toString()+'.png'), function(err, image) {
                      console.log('Adding tile z: %s x: %s y: %s to %s', zoom, x, y, tableName);
                      resolve(geopackage.addTile(image, tableName, zoom, y, x));
                    });
                  });
                });
              }, Promise.resolve());
            });
          }, Promise.resolve());
        });
      }, Promise.resolve());
    });
  });

  describe('delete tile tests', function(done) {

    var tileMatrixSet;
    var tileMatrixSetBoundingBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);

    beforeEach(function() {
      this.timeout(5000);
      var contentsBoundingBox = new BoundingBox(-180, 180, -85.0511287798066, 85.0511287798066);
      var contentsSrsId = 4326;
      var tileMatrixSetSrsId = 3857;
      geopackage.getSpatialReferenceSystemDao().createWebMercator();
      return geopackage.createTileTableWithTableName(tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId)
      .then(function(result) {
        tileMatrixSet = result;
        Verification.verifyTileMatrixSet(geopackage).should.be.equal(true);
        Verification.verifyContentsForTable(geopackage, tableName).should.be.equal(true);
        Verification.verifyTableExists(geopackage, tableName).should.be.equal(true);
        geopackage.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, 0, 3);

        var zooms = [0, 1, 2, 3];

        return zooms.reduce(function(zoomSequence, zoom) {
          return zoomSequence.then(function() {
            var xtiles = [];
            var tileCount = Math.pow(2,zoom);
            for (var i = 0; i < tileCount; i++) {
              xtiles.push(i);
            }
            return xtiles.reduce(function(xSequence, x) {
              return xSequence.then(function() {
                var ytiles = [];
                var tileCount = Math.pow(2,zoom);
                for (var i = 0; i < tileCount; i++) {
                  ytiles.push(i);
                }
                return ytiles.reduce(function(ySequence, y) {
                  return ySequence.then(function() {
                    return new Promise(function(resolve, reject) {
                      testSetup.loadTile(path.join(__dirname, '..', 'fixtures', 'tiles', zoom.toString(), x.toString(), y.toString()+'.png'), function(err, image) {
                        console.log('Adding tile z: %s x: %s y: %s to %s', zoom, x, y, tableName);
                        resolve(geopackage.addTile(image, tableName, zoom, y, x));
                      });
                    });
                  });
                }, Promise.resolve());
              });
            }, Promise.resolve());
          });
        }, Promise.resolve());
      });
    });

    it('should delete the tiles', function() {
      var tileDao = geopackage.getTileDaoWithTableName(tableName);
      var count = tileDao.getCount();
      count.should.be.equal(85);
      var result = tileDao.deleteTile(0, 0, 0);
      result.should.be.equal(1);
      count = tileDao.getCount();
      count.should.be.equal(84);
      var result = tileDao.dropTable();
      result.should.be.equal(true);
      var tileMatrixSetDao = geopackage.getTileMatrixSetDao();
      var results = tileMatrixSetDao.delete(tileMatrixSet);
      results.should.be.equal(1);
    });
  });
});
