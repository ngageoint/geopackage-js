
import { default as testSetup } from '../fixtures/testSetup'

const
  Verification = require('../fixtures/verification')
  , TileTable = require('../../lib/tiles/user/tileTable').TileTable
  , BoundingBox = require('../../lib/boundingBox').BoundingBox
  , path = require('path')
  , should = require('chai').should();

describe('GeoPackage Tile table create tests', function() {

  var testGeoPackage;
  var tableName = 'test_tiles.test';
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
    geopackage.createTileTableWithTableName(tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId);
    Verification.verifyTileMatrixSet(geopackage).should.be.equal(true);
    Verification.verifyContentsForTable(geopackage, tableName).should.be.equal(true);
    Verification.verifyTableExists(geopackage, tableName).should.be.equal(true);
  });

  it('should create a tile table, then delete it, then create it again', function() {
    var contentsBoundingBox = new BoundingBox(-180, 180, -80, 80);
    var contentsSrsId = 4326;
    var tileMatrixSetBoundingBox = new BoundingBox(-180, 180, -80, 80);
    var tileMatrixSetSrsId = 4326;
    geopackage.createTileTableWithTableName(tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId);
    Verification.verifyTileMatrixSet(geopackage).should.be.equal(true);
    Verification.verifyContentsForTable(geopackage, tableName).should.be.equal(true);
    Verification.verifyTableExists(geopackage, tableName).should.be.equal(true);
    geopackage.deleteTable(tableName)
    Verification.verifyTableExists(geopackage, tableName).should.be.equal(false);
    geopackage.createTileTableWithTableName(tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId);
    Verification.verifyTileMatrixSet(geopackage).should.be.equal(true);
    Verification.verifyContentsForTable(geopackage, tableName).should.be.equal(true);
    Verification.verifyTableExists(geopackage, tableName).should.be.equal(true);
  });

  describe('GeoPackage tile create tile matrix tests', function(done) {

    var tileMatrixSet;
    var tileMatrixSetBoundingBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);

    beforeEach(function() {
      var contentsBoundingBox = new BoundingBox(-180, 180, -85.0511287798066, 85.0511287798066);
      var contentsSrsId = 4326;
      var tileMatrixSetSrsId = 3857;
      geopackage.spatialReferenceSystemDao.createWebMercator();
      tileMatrixSet = geopackage.createTileTableWithTableName(tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId);
      Verification.verifyTileMatrixSet(geopackage).should.be.equal(true);
      Verification.verifyContentsForTable(geopackage, tableName).should.be.equal(true);
      Verification.verifyTableExists(geopackage, tableName).should.be.equal(true);
    });

    it('should create the standard xyz tile matrix for the zoom levels with default tile size of 256', function(){
      geopackage.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, 0, 3);
      let zoom = 4;
      while (zoom-- > 0) {
        const matrix = geopackage.tileMatrixDao.queryForId([tableName, zoom]);
        const numTiles = Math.pow(2, zoom);
        matrix.table_name.should.equal(tableName);
        matrix.zoom_level.should.equal(zoom);
        matrix.matrix_width.should.equal(Math.pow(2, zoom));
        matrix.matrix_height.should.equal(Math.pow(2, zoom));
        matrix.tile_width.should.equal(256);
        matrix.tile_height.should.equal(256);
        const metersPerTile = (tileMatrixSetBoundingBox.maxLongitude - tileMatrixSetBoundingBox.minLongitude) / numTiles;
        matrix.pixel_x_size.should.equal(metersPerTile / 256);
        matrix.pixel_y_size.should.equal(metersPerTile / 256);
      }
    });

    it('should create the standard xyz tile matrix for the zoom levels with a custom tile size', function(){
      geopackage.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, 0, 3, 100);
      let zoom = 4;
      while (zoom-- > 0) {
        const matrix = geopackage.tileMatrixDao.queryForId([tableName, zoom]);
        const numTiles = Math.pow(2, zoom);
        matrix.table_name.should.equal(tableName);
        matrix.zoom_level.should.equal(zoom);
        matrix.matrix_width.should.equal(Math.pow(2, zoom));
        matrix.matrix_height.should.equal(Math.pow(2, zoom));
        matrix.tile_width.should.equal(100);
        matrix.tile_height.should.equal(100);
        const metersPerTile = (tileMatrixSetBoundingBox.maxLongitude - tileMatrixSetBoundingBox.minLongitude) / numTiles;
        matrix.pixel_x_size.should.equal(metersPerTile / 100);
        matrix.pixel_y_size.should.equal(metersPerTile / 100);
      }
    });

    it('should add all of the tiles to the tile matrix', function() {

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
                  return new Promise(async function(resolve, reject) {
                    // @ts-ignore
                    let image = await loadTile(path.join(__dirname, '..', 'fixtures', 'tiles', zoom.toString(), x.toString(), y.toString()+'.png'));
                    console.log('Adding tile z: %s x: %s y: %s to %s', zoom, x, y, tableName);
                    resolve(geopackage.addTile(image, tableName, zoom, y, x));
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
      geopackage.spatialReferenceSystemDao.createWebMercator();
      tileMatrixSet = geopackage.createTileTableWithTableName(tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId);
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
                  return new Promise(async function(resolve, reject) {
                    // @ts-ignore
                    let image = await loadTile(path.join(__dirname, '..', 'fixtures', 'tiles', zoom.toString(), x.toString(), y.toString()+'.png'));
                    console.log('Adding tile z: %s x: %s y: %s to %s', zoom, x, y, tableName);
                    resolve(geopackage.addTile(image, tableName, zoom, y, x));
                  });
                });
              }, Promise.resolve());
            });
          }, Promise.resolve());
        });
      }, Promise.resolve());
    });

    it('should delete the tiles', function() {
      var tileDao = geopackage.getTileDao(tableName);
      var count = tileDao.getCount();
      count.should.be.equal(85);
      var result = tileDao.deleteTile(0, 0, 0);
      result.should.be.equal(1);
      count = tileDao.getCount();
      count.should.be.equal(84);
      var result = tileDao.dropTable();
      result.should.be.equal(true);
    });
  });
});
