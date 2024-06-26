import { default as testSetup } from '../testSetup';
import { TileMatrixKey } from '../../lib/tiles/matrix/tileMatrixKey';

const Verification = require('../verification'),
  TileTable = require('../../lib/tiles/user/tileTable').TileTable,
  BoundingBox = require('../../lib/boundingBox').BoundingBox,
  path = require('path');

describe('GeoPackage Tile table create tests', function () {
  var testGeoPackage;
  var tableName = 'test_tiles.test';
  var geoPackage;

  beforeEach(async function () {
    let created = await testSetup.createTmpGeoPackage();
    testGeoPackage = created.path;
    geoPackage = created.geoPackage;
  });

  afterEach(async function () {
    geoPackage.close();
    await testSetup.deleteGeoPackage(testGeoPackage);
  });

  it('should create a tile table', function () {
    var requiredColumns = TileTable.createRequiredColumns();
    var tileTable = new TileTable(tableName, requiredColumns);
    geoPackage.createTileTable(tileTable);
    Verification.verifyTableExists(geoPackage, tableName).should.be.equal(true);
  });

  it('should create a tile table with parameters', function () {
    var contentsBoundingBox = new BoundingBox(-180, -80, 180, 80);
    var contentsSrsId = 4326;
    var tileMatrixSetBoundingBox = new BoundingBox(-180, -80, 180, 80);
    var tileMatrixSetSrsId = 4326;
    geoPackage.createTileTableWithTableName(
      tableName,
      contentsBoundingBox,
      contentsSrsId,
      tileMatrixSetBoundingBox,
      tileMatrixSetSrsId,
    );
    Verification.verifyTileMatrixSet(geoPackage).should.be.equal(true);
    Verification.verifyContentsForTable(geoPackage, tableName).should.be.equal(true);
    Verification.verifyTableExists(geoPackage, tableName).should.be.equal(true);
  });

  it('should create a tile table, then delete it, then create it again', function () {
    var contentsBoundingBox = new BoundingBox(-180, -80, 180, 80);
    var contentsSrsId = 4326;
    var tileMatrixSetBoundingBox = new BoundingBox(-180, -80, 180, 80);
    var tileMatrixSetSrsId = 4326;
    geoPackage.createTileTableWithTableName(
      tableName,
      contentsBoundingBox,
      contentsSrsId,
      tileMatrixSetBoundingBox,
      tileMatrixSetSrsId,
    );
    Verification.verifyTileMatrixSet(geoPackage).should.be.equal(true);
    Verification.verifyContentsForTable(geoPackage, tableName).should.be.equal(true);
    Verification.verifyTableExists(geoPackage, tableName).should.be.equal(true);
    geoPackage.deleteTable(tableName);
    Verification.verifyTableExists(geoPackage, tableName).should.be.equal(false);
    geoPackage.createTileTableWithTableName(
      tableName,
      contentsBoundingBox,
      contentsSrsId,
      tileMatrixSetBoundingBox,
      tileMatrixSetSrsId,
    );
    Verification.verifyTileMatrixSet(geoPackage).should.be.equal(true);
    Verification.verifyContentsForTable(geoPackage, tableName).should.be.equal(true);
    Verification.verifyTableExists(geoPackage, tableName).should.be.equal(true);
  });

  describe('GeoPackage tile create tile matrix tests', function () {
    var tileMatrixSet;
    var tileMatrixSetBoundingBox = new BoundingBox(
      -20037508.342789244,
      -20037508.342789244,
      20037508.342789244,
      20037508.342789244,
    );

    beforeEach(function () {
      var contentsBoundingBox = new BoundingBox(-180, -85.0511287798066, 180, 85.0511287798066);
      var contentsSrsId = 4326;
      var tileMatrixSetSrsId = 3857;
      geoPackage.getSpatialReferenceSystemDao().createWebMercator();
      tileMatrixSet = geoPackage.createTileTableWithTableName(
        tableName,
        contentsBoundingBox,
        contentsSrsId,
        tileMatrixSetBoundingBox,
        tileMatrixSetSrsId,
      );
      Verification.verifyTileMatrixSet(geoPackage).should.be.equal(true);
      Verification.verifyContentsForTable(geoPackage, tableName).should.be.equal(true);
      Verification.verifyTableExists(geoPackage, tableName).should.be.equal(true);
    });

    it('should create the standard xyz tile matrix for the zoom levels with default tile size of 256', function () {
      geoPackage.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, 0, 3);
      let zoom = 4;
      while (zoom-- > 0) {
        const matrix = geoPackage.getTileMatrixDao().queryForIdWithKey(new TileMatrixKey(tableName, zoom));
        const numTiles = Math.pow(2, zoom);
        matrix.getTableName().should.equal(tableName);
        matrix.getZoomLevel().should.equal(zoom);
        matrix.getMatrixWidth().should.equal(Math.pow(2, zoom));
        matrix.getMatrixHeight().should.equal(Math.pow(2, zoom));
        matrix.getTileWidth().should.equal(256);
        matrix.getTileHeight().should.equal(256);
        const metersPerTile = tileMatrixSetBoundingBox.getLongitudeRange() / numTiles;
        matrix.getPixelXSize().should.equal(metersPerTile / 256);
        matrix.getPixelYSize().should.equal(metersPerTile / 256);
      }
    });

    it('should create the standard xyz tile matrix for the zoom levels with a custom tile size', function () {
      geoPackage.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, 0, 3, 100);
      let zoom = 4;
      while (zoom-- > 0) {
        const matrix = geoPackage.getTileMatrixDao().queryForId([tableName, zoom]);
        const numTiles = Math.pow(2, zoom);
        matrix.getTableName().should.equal(tableName);
        matrix.getZoomLevel().should.equal(zoom);
        matrix.getMatrixWidth().should.equal(Math.pow(2, zoom));
        matrix.getMatrixHeight().should.equal(Math.pow(2, zoom));
        matrix.getTileWidth().should.equal(100);
        matrix.getTileHeight().should.equal(100);
        const metersPerTile = tileMatrixSetBoundingBox.getLongitudeRange() / numTiles;
        matrix.getPixelXSize().should.equal(metersPerTile / 100);
        matrix.getPixelYSize().should.equal(metersPerTile / 100);
      }
    });

    it('should add all of the tiles to the tile matrix', function () {
      geoPackage.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, 0, 3);

      var zooms = [0, 1, 2, 3];

      return zooms.reduce(function (zoomSequence, zoom) {
        return zoomSequence.then(function () {
          var xtiles = [];
          var tileCount = Math.pow(2, zoom);
          for (var i = 0; i < tileCount; i++) {
            xtiles.push(i);
          }
          return xtiles.reduce(function (xSequence, x) {
            return xSequence.then(function () {
              var ytiles = [];
              var tileCount = Math.pow(2, zoom);
              for (var i = 0; i < tileCount; i++) {
                ytiles.push(i);
              }
              return ytiles.reduce(function (ySequence, y) {
                return ySequence.then(function () {
                  return new Promise(async function (resolve) {
                    let image = await loadTile(
                      path.join(
                        __dirname,
                        '..',
                        'fixtures',
                        'tiles',
                        zoom.toString(),
                        x.toString(),
                        y.toString() + '.png',
                      ),
                    );
                    resolve(geoPackage.addTile(image, tableName, zoom, y, x));
                  });
                });
              }, Promise.resolve());
            });
          }, Promise.resolve());
        });
      }, Promise.resolve());
    });
  });

  describe('GeoPackage WGS84 tile create tile matrix tests', function () {
    var tileMatrixSet;
    var tileMatrixSetBoundingBox = new BoundingBox(-180, -90, 180, 90);

    beforeEach(function () {
      var contentsBoundingBox = new BoundingBox(-180, -90, 180, 90);
      var contentsSrsId = 4326;
      var tileMatrixSetSrsId = 4326;
      geoPackage.getSpatialReferenceSystemDao().createWebMercator();
      tileMatrixSet = geoPackage.createTileTableWithTableName(
        tableName,
        contentsBoundingBox,
        contentsSrsId,
        tileMatrixSetBoundingBox,
        tileMatrixSetSrsId,
      );
      Verification.verifyTileMatrixSet(geoPackage).should.be.equal(true);
      Verification.verifyContentsForTable(geoPackage, tableName).should.be.equal(true);
      Verification.verifyTableExists(geoPackage, tableName).should.be.equal(true);
    });

    it('should create the standard WGS84 xyz tile matrix for the zoom levels with default tile size of 256', function () {
      geoPackage.createStandardWGS84TileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, 0, 2);
      let zoom = 3;
      while (zoom-- > 0) {
        const matrix = geoPackage.getTileMatrixDao().queryForIdWithKey(new TileMatrixKey(tableName, zoom));
        matrix.getTableName().should.equal(tableName);
        matrix.getZoomLevel().should.equal(zoom);
        matrix.getMatrixWidth().should.equal(Math.pow(2, zoom + 1));
        matrix.getMatrixHeight().should.equal(Math.pow(2, zoom));
        matrix.getTileWidth().should.equal(256);
        matrix.getTileHeight().should.equal(256);
        const degreesPerTileWidth = tileMatrixSetBoundingBox.getLongitudeRange() / matrix.getMatrixWidth();
        const degreesPerTileHeight = tileMatrixSetBoundingBox.getLatitudeRange() / matrix.getMatrixHeight();
        matrix.getPixelXSize().should.equal(degreesPerTileWidth / 256);
        matrix.getPixelYSize().should.equal(degreesPerTileHeight / 256);
      }
    });

    it('should create the standard WGS84 xyz tile matrix for the zoom levels with a custom tile size', function () {
      geoPackage.createStandardWGS84TileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, 0, 2, 100);
      let zoom = 3;
      while (zoom-- > 0) {
        const matrix = geoPackage.tileMatrixDao.queryForIdWithKey(new TileMatrixKey(tableName, zoom));
        matrix.getTableName().should.equal(tableName);
        matrix.getZoomLevel().should.equal(zoom);
        matrix.getMatrixWidth().should.equal(Math.pow(2, zoom + 1));
        matrix.getMatrixHeight().should.equal(Math.pow(2, zoom));
        matrix.getTileWidth().should.equal(100);
        matrix.getTileHeight().should.equal(100);
        const degreesPerTileWidth = tileMatrixSetBoundingBox.getLongitudeRange() / matrix.getMatrixWidth();
        const degreesPerTileHeight = tileMatrixSetBoundingBox.getLatitudeRange() / matrix.getMatrixHeight();
        matrix.getPixelXSize().should.equal(degreesPerTileWidth / 100);
        matrix.getPixelYSize().should.equal(degreesPerTileHeight / 100);
      }
    });

    it('should add all of the tiles to the WGS84 tile matrix', function () {
      geoPackage.createStandardWGS84TileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, 0, 2);

      var zooms = [0, 1, 2];

      return zooms.reduce(function (zoomSequence, zoom) {
        return zoomSequence.then(function () {
          var xtiles = [];
          var tileCount = Math.pow(2, zoom) * 2;
          for (var i = 0; i < tileCount; i++) {
            xtiles.push(i);
          }
          return xtiles.reduce(function (xSequence, x) {
            return xSequence.then(function () {
              var ytiles = [];
              var tileCount = Math.pow(2, zoom);
              for (var i = 0; i < tileCount; i++) {
                ytiles.push(i);
              }
              return ytiles.reduce(function (ySequence, y) {
                return ySequence.then(function () {
                  return new Promise(async function (resolve) {
                    let image = await loadTile(
                      path.join(
                        __dirname,
                        '..',
                        'fixtures',
                        'wgs84Tiles',
                        zoom.toString(),
                        x.toString(),
                        y.toString() + '.png',
                      ),
                    );
                    resolve(geoPackage.addTile(image, tableName, zoom, y, x));
                  });
                });
              }, Promise.resolve());
            });
          }, Promise.resolve());
        });
      }, Promise.resolve());
    });
  });

  describe('delete tile tests', function () {
    var tileMatrixSet;
    var tileMatrixSetBoundingBox = new BoundingBox(
      -20037508.342789244,
      -20037508.342789244,
      20037508.342789244,
      20037508.342789244,
    );

    beforeEach(function () {
      this.timeout(5000);
      var contentsBoundingBox = new BoundingBox(-180, -85.0511287798066, 180, 85.0511287798066);
      var contentsSrsId = 4326;
      var tileMatrixSetSrsId = 3857;
      geoPackage.getSpatialReferenceSystemDao().createWebMercator();
      tileMatrixSet = geoPackage.createTileTableWithTableName(
        tableName,
        contentsBoundingBox,
        contentsSrsId,
        tileMatrixSetBoundingBox,
        tileMatrixSetSrsId,
      );
      Verification.verifyTileMatrixSet(geoPackage).should.be.equal(true);
      Verification.verifyContentsForTable(geoPackage, tableName).should.be.equal(true);
      Verification.verifyTableExists(geoPackage, tableName).should.be.equal(true);
      geoPackage.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, 0, 3);

      var zooms = [0, 1, 2, 3];

      return zooms.reduce(function (zoomSequence, zoom) {
        return zoomSequence.then(function () {
          var xtiles = [];
          var tileCount = Math.pow(2, zoom);
          for (var i = 0; i < tileCount; i++) {
            xtiles.push(i);
          }
          return xtiles.reduce(function (xSequence, x) {
            return xSequence.then(function () {
              var ytiles = [];
              var tileCount = Math.pow(2, zoom);
              for (var i = 0; i < tileCount; i++) {
                ytiles.push(i);
              }
              return ytiles.reduce(function (ySequence, y) {
                return ySequence.then(function () {
                  return new Promise(async function (resolve) {
                    let image = await loadTile(
                      path.join(
                        __dirname,
                        '..',
                        'fixtures',
                        'tiles',
                        zoom.toString(),
                        x.toString(),
                        y.toString() + '.png',
                      ),
                    );
                    resolve(geoPackage.addTile(image, tableName, zoom, y, x));
                  });
                });
              }, Promise.resolve());
            });
          }, Promise.resolve());
        });
      }, Promise.resolve());
    });

    it('should delete the tiles', function () {
      var tileDao = geoPackage.getTileDao(tableName);
      var count = tileDao.getCount();
      count.should.be.equal(85);
      var result = tileDao.deleteTile(0, 0, 0);
      result.should.be.equal(1);
      count = tileDao.getCount();
      count.should.be.equal(84);
      tileDao.dropTable();
      tileDao.isTableExists().should.be.equal(false);
    });
  });
});
