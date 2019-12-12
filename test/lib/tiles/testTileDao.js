import { default as GeoPackageAPI } from '../../..'
import { default as testSetup } from '../../fixtures/testSetup'

var TileDao = require('../../../lib/tiles/user/tileDao')
  // , testSetup = require('../../fixtures/testSetup')
  , should = require('chai').should()
  , path = require('path');

describe('TileDao tests', function() {

  describe('Rivers GeoPackage tests', function() {

    var geoPackage;
    var tileDao;

    var filename;
    beforeEach('create the GeoPackage connection', async function() {
      var originalFilename = path.join(__dirname, '..', '..', 'fixtures', 'rivers.gpkg');
      // @ts-ignore
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geopackage;
      tileDao = geoPackage.getTileDao('TILESosmds');
    });

    afterEach('close the geopackage connection', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should get the zoom levels', function(done) {
      tileDao.minZoom.should.be.equal(0);
      tileDao.maxZoom.should.be.equal(3);
      done();
    });

    it('should get the bounding box for each zoom level', function() {
      [0, 1, 2, 3, 4].forEach(function(zoom) {
        var bb = tileDao.getBoundingBoxWithZoomLevel(zoom);
        if (zoom === 4) {
          should.not.exist(bb);
        } else {
          bb.minLongitude.should.be.equal(-20037508.342789244);
          bb.maxLongitude.should.be.equal(20037508.342789244);
          bb.minLatitude.should.be.equal(-20037508.342789244);
          bb.maxLatitude.should.be.equal(20037508.342789244);
        }
      })
    });

    it('should get the tile grid for each zoom level', function() {
      [0, 1, 2, 3, 4].forEach(function(zoom) {
        var grid = tileDao.getTileGridWithZoomLevel(zoom);
        if (zoom === 4) {
          should.not.exist(grid);
        } else {
          grid.min_x.should.be.equal(0);
          grid.min_y.should.be.equal(0);
          grid.max_x.should.be.equal(Math.pow(2, zoom)-1);
          grid.max_x.should.be.equal(Math.pow(2, zoom)-1);
        }
      });
    });

    it('should get the table', function() {
      var tileTable = tileDao.getTileTable();
      tileTable.table_name.should.be.equal('TILESosmds');
      should.exist(tileTable.getTileDataColumn);
    });

    it('should query for a tile', function() {
      var tileRow = tileDao.queryForTile(0, 0, 0);
      tileRow.getZoomLevel().should.be.equal(0);
      tileRow.getTileColumn().should.be.equal(0);
      tileRow.getRow().should.be.equal(0);
      var data = tileRow.getTileData();
      should.exist(data);
    });

    it('should query for tiles in the zoom level', function() {
      var count = 0;
      for (var tileRow of tileDao.queryForTilesWithZoomLevel(1)) {
        tileRow.getZoomLevel().should.be.equal(1);
        var data = tileRow.getTileData();
        should.exist(data);
        count++;
      }
      count.should.be.equal(4);
    });

    it('should query for tiles in the zoom level descending order', function() {
      var count = 0;
      for (var tileRow of tileDao.queryForTilesDescending(1)) {
        tileRow.getZoomLevel().should.be.equal(1);
        var data = tileRow.getTileData();
        should.exist(data);
        count++;
      }
      count.should.be.equal(4);
    });

    it('should query for tiles in the zoom level and column', function() {
      var count = 0;
      for (var tileRow of tileDao.queryForTilesInColumn(1, 1)) {
        tileRow.getZoomLevel().should.be.equal(1);
        tileRow.getTileColumn().should.be.equal(1);
        var data = tileRow.getTileData();
        should.exist(data);
        count++;
      }
      count.should.be.equal(2);
    });

    it('should query for tiles in the zoom level and row', function() {
      var count = 0;
      for (var tileRow of tileDao.queryForTilesInRow(1, 1)) {
        tileRow.getZoomLevel().should.be.equal(1);
        tileRow.getRow().should.be.equal(1);
        var data = tileRow.getTileData();
        should.exist(data);
        count++;
      }
      count.should.be.equal(2);
    });

    it('should query for tiles in the tile grid', function() {
      var tileGrid = {
        min_x: 0,
        max_x: 1,
        min_y: 0,
        max_y: 0
      };
      var iterator = tileDao.queryByTileGrid(tileGrid, 1);
      var count = 0;
      for (var tileRow of iterator) {
        tileRow.getZoomLevel().should.be.equal(1);
        tileRow.getRow().should.be.equal(0);
        var data = tileRow.getTileData();
        should.exist(data);
        count++;
      }
      count.should.be.equal(2);
    });

    it('should rename the tile table', function() {
      tileDao.rename('Tiles');
      tileDao.gpkgTableName.should.be.equal('Tiles');
      var tileTables = geoPackage.getTileTables();
      tileTables[0].should.be.equal('Tiles');
    })
  });

  describe.skip('Alaska GeoPackage tests', function() {

    var geoPackage;
    var tileDao;

    beforeEach('should open the geopackage', async function() {
      var filename = path.join(__dirname, '..', '..', 'fixtures', 'private', 'alaska.gpkg');
      // @ts-ignore
      let result = await copyAndOpenGeopackage(filename);
      filename = result.path;
      geoPackage = result.geopackage;
      tileDao = geoPackage.getTileDao('alaska');
    });

    it('should get the zoom levels', function() {
      tileDao.minZoom.should.be.equal(4);
      tileDao.maxZoom.should.be.equal(4);
    });

    it('should get the bounding box for each zoom level', function() {
      [4, 5].forEach(function(zoom) {
        var bb = tileDao.getBoundingBoxWithZoomLevel(zoom);
        if (zoom === 5) {
          should.not.exist(bb);
        } else {
          bb.minLongitude.should.be.equal(-180);
          bb.maxLongitude.should.be.equal(-157.5);
          bb.minLatitude.should.be.equal(45);
          bb.maxLatitude.should.be.equal(67.5);
        }
      });
    });

    it('should get the tile grid for each zoom level', function() {
      [4, 5].forEach(function(zoom) {
        var grid = tileDao.getTileGridWithZoomLevel(zoom);
        if (zoom === 5) {
          should.not.exist(grid);
        } else {
          grid.minX.should.be.equal(0);
          grid.minY.should.be.equal(0);
          grid.maxX.should.be.equal(3);
          grid.maxX.should.be.equal(3);
        }
      });
    });

    it('should get the table', function() {
      var tileTable = tileDao.getTileTable();
      tileTable.tableName.should.be.equal('alaska');
      should.exist(tileTable.getTileDataColumn);
    });

    it('should query for a tile', function() {
      return tileDao.queryForTile(1, 1, 4)
      .then(function(tileRow) {
        tileRow.getZoomLevel().should.be.equal(4);
        tileRow.getTileColumn().should.be.equal(1);
        tileRow.getRow().should.be.equal(1);
        var data = tileRow.getTileData();
        should.exist(data);
      });
    });

    it('should query for tiles in the zoom level', function() {
      return tileDao.queryForTilesWithZoomLevel(4, function(err, tileRow) {
        tileRow.getZoomLevel().should.be.equal(4);
        var data = tileRow.getTileData();
        should.exist(data);
      }).then(function(count) {
        count.should.be.equal(16);
      });
    });

    it('should query for tiles in the zoom level descending order', function() {
      tileDao.queryForTilesDescending(4, function(err, tileRow) {
        tileRow.getZoomLevel().should.be.equal(4);
        var data = tileRow.getTileData();
        should.exist(data);
      }).then(function(count) {
        count.should.be.equal(16);
      });
    });

    it('should query for tiles in the zoom level and column', function() {
      return tileDao.queryForTilesInColumn(1, 4, function(err, tileRow) {
        tileRow.getZoomLevel().should.be.equal(4);
        tileRow.getTileColumn().should.be.equal(1);
        var data = tileRow.getTileData();
        should.exist(data);
      }).then(function(count) {
        count.should.be.equal(4);
      });
    });

    it('should query for tiles in the zoom level and row', function() {
      return tileDao.queryForTilesInRow(1, 4, function(err, tileRow) {
        tileRow.getZoomLevel().should.be.equal(4);
        tileRow.getRow().should.be.equal(1);
        var data = tileRow.getTileData();
        should.exist(data);
      }).then(function(count) {
        count.should.be.equal(4);
      });
    });

    it('should query for tiles in the tile grid', function(done) {
      var tileGrid = {
        minX: 0,
        maxX: 1,
        minY: 0,
        maxY: 0
      };
      tileDao.queryByTileGrid(tileGrid, 4, function(err, tileRow) {
        tileRow.getZoomLevel().should.be.equal(4);
        tileRow.getRow().should.be.equal(0);
        var data = tileRow.getTileData();
        should.exist(data);
      })
      .then(function(count) {
        count.should.be.equal(2);
        done();
      });
    });
  });
});
