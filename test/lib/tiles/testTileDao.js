import { default as testSetup } from '../../testSetup'
import { TileGrid } from "../../../lib/tiles/tileGrid";
import { AlterTable } from "../../../lib/db/alterTable";

var should = require('chai').should()
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
      geoPackage = result.geoPackage;
      tileDao = geoPackage.getTileDao('TILESosmds');
    });

    afterEach('close the geoPackage connection', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should get the zoom levels', function(done) {
      tileDao.getMinZoom().should.be.equal(0);
      tileDao.getMaxZoom().should.be.equal(3);
      done();
    });

    it('should get the bounding box for each zoom level', function() {
      [0, 1, 2, 3, 4].forEach(function(zoom) {
        var bb = tileDao.getBoundingBoxAtZoomLevel(zoom);
        if (zoom === 4) {
          should.not.exist(bb);
        } else {
          bb.getMinLongitude().should.be.equal(-20037508.342789244);
          bb.getMaxLongitude().should.be.equal(20037508.342789244);
          bb.getMinLatitude().should.be.equal(-20037508.342789244);
          bb.getMaxLatitude().should.be.equal(20037508.342789244);
        }
      })
    });

    it('should get the tile grid for each zoom level', function() {
      [0, 1, 2, 3, 4].forEach(function(zoom) {
        var grid = tileDao.getTileGridWithZoomLevel(zoom);
        if (zoom === 4) {
          should.not.exist(grid);
        } else {
          grid.getMinX().should.be.equal(0);
          grid.getMinY().should.be.equal(0);
          grid.getMaxX().should.be.equal(Math.pow(2, zoom) - 1);
          grid.getMaxY().should.be.equal(Math.pow(2, zoom) - 1);
        }
      });
    });

    it('should get the table', function() {
      var tileTable = tileDao.table;
      tileTable.getTableName().should.be.equal('TILESosmds');
      should.exist(tileTable.getUserColumns().getTileDataColumn());
    });

    it('should query for a tile', function() {
      var tileRow = tileDao.queryForTile(0, 0, 0);
      tileRow.getZoomLevel().should.be.equal(0);
      tileRow.getTileColumn().should.be.equal(0);
      tileRow.getTileRow().should.be.equal(0);
      var data = tileRow.getTileData();
      should.exist(data);
    });

    it('should query for tiles in the zoom level', function() {
      var count = 0;
      const tileResultSet = tileDao.queryForTiles(1);
      try {
        for (const tileRow of tileResultSet) {
          tileRow.getZoomLevel().should.be.equal(1);
          var data = tileRow.getTileData();
          should.exist(data);
          count++;
        }
      } catch (e) {
        console.error(e);
      } finally {
        tileResultSet.close();
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
        tileRow.getTileRow().should.be.equal(1);
        var data = tileRow.getTileData();
        should.exist(data);
        count++;
      }
      count.should.be.equal(2);
    });

    it('should query for tiles in the tile grid', function() {
      var tileGrid = new TileGrid(0, 0, 1, 0);
      var iterator = tileDao.queryByTileGrid(tileGrid, 1);
      var count = 0;
      for (const tileRow of iterator) {
        tileRow.getZoomLevel().should.be.equal(1);
        tileRow.getTileRow().should.be.equal(0);
        should.exist(tileRow.getTileData());
        count++;
      }
      count.should.be.equal(2);
    });

    it('Rename tile table', function() {
      geoPackage.renameTable('TILESosmds', 'Tiles');
      var tileTables = geoPackage.getTileTables();
      tileTables[0].should.be.equal('Tiles');
    })
  });
});
