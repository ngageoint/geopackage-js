import { default as testSetup } from '../../../../testSetup';
import { TileScaling } from '../../../../../lib/extension/nga/scale/tileScaling';
import { TileScalingType } from '../../../../../lib/extension/nga/scale/tileScalingType';
import { TileTableScaling } from '../../../../../lib/extension/nga/scale/tileTableScaling';
var assert = require('chai').assert;
var GeoPackageTileRetriever = require('../../../../../lib/tiles/geoPackageTileRetriever').GeoPackageTileRetriever,
  path = require('path');
var isLinux = process.platform === 'linux';
var isWeb = !(typeof process !== 'undefined' && process.version);

describe('GeoPackage Tile Scaling Extension Tests', function () {
  describe('Test Add Scaling Extension', function () {
    var geoPackage;
    var tileDao;
    var filename;
    var tableName = 'denver';
    var defaultTileScaling;

    beforeEach('should open the copied geoPackage and setup the tile scaling extension', async function () {
      try {
        var denverfilename = path.join(__dirname, '..', '..', '..', '..', 'fixtures', 'denver_tile.gpkg');

        let result = await copyAndOpenGeopackage(denverfilename);
        filename = result.path;
        geoPackage = result.geoPackage;
        tileDao = geoPackage.getTileDao(tableName);
        defaultTileScaling = new TileScaling();
        defaultTileScaling.setScalingType(TileScalingType.IN_OUT);
        defaultTileScaling.setZoomIn(1);
        defaultTileScaling.setZoomOut(1);
      } catch (e) {
        console.error(e);
      }
    });

    afterEach('should close the geoPackage', async function () {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should get the x:13683, y: 24889, z: 16 tile', function (done) {
      this.timeout(30000);
      try {
        var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
        gpr.getTile(13683, 24889, 16).then(function (tile) {
          testSetup.diffImages(
            tile.getData(),
            path.join(
              __dirname,
              '..',
              '..',
              '..',
              '..',
              'fixtures',
              'tiles',
              '16',
              '13683',
              isWeb ? 'web' : '',
              isLinux ? '24889_linux.png' : '24889.png',
            ),
            function (err, equal) {
              try {
                equal.should.be.equal(true);
                done();
              } catch (e) {
                console.error(e);
                done(e);
              }
            },
          );
        });
      } catch (e) {
        console.error(e);
      }
    });

    it('should be able to add and remove tile scaling extension', function () {
      const tableScaling = new TileTableScaling(geoPackage, tableName);
      // test adding the extension
      tableScaling.getOrCreateExtension();
      tableScaling.createOrUpdate(defaultTileScaling);
      defaultTileScaling.getTableName().should.be.equal(tableName);
      assert.isTrue(tableScaling.has());
      const tileScaling = tableScaling.getTileScaling();
      assert.isNotNull(tileScaling);
      // test that tile scaling from db matches the object we used to create it
      tileScaling.getTableName().should.be.equal(defaultTileScaling.getTableName());
      tileScaling.getScalingType().should.be.equal(defaultTileScaling.getScalingType());
      tileScaling.getZoomOut().should.be.equal(defaultTileScaling.getZoomOut());
      tileScaling.getZoomIn().should.be.equal(defaultTileScaling.getZoomIn());
      // test removing the extension
      tableScaling.removeExtension();
      assert.isFalse(tableScaling.has());
      assert.isNull(tableScaling.getTileScaling());
    });

    it('should delete tile scaling row', function () {
      const tableScaling = new TileTableScaling(geoPackage, tableName);
      tableScaling.getOrCreateExtension();
      tableScaling.createOrUpdate(defaultTileScaling);
      assert.isNotNull(tableScaling.getTileScaling());
      tableScaling.delete();
      assert.isNull(tableScaling.getTileScaling());
      assert.isFalse(tableScaling.has());
    });

    it('tile scaling dao should handle null create object requests', function () {
      const tableScaling = new TileTableScaling(geoPackage, tableName);
      const tileScalingDao = tableScaling.dao;
      JSON.stringify(tileScalingDao.createObject(null)).should.equal(JSON.stringify(new TileScaling()));
    });

    it('zoom type in', function () {
      const tableScaling = new TileTableScaling(geoPackage, tableName);
      const tileScaling = new TileScaling();
      tileScaling.setScalingType(TileScalingType.IN);
      tileScaling.setZoomIn(2);
      tileScaling.setZoomOut(1);
      tableScaling.createOrUpdate(tileScaling);
      const gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      gpr.setScaling(tableScaling.getTileScaling());
      // should scale for zoom level 17, 1 in from 16
      gpr.hasTile(13683 * 2, 24889 * 2, 17).should.be.equal(false);
      // should not scale for zoom level 18, 2 in from 16
      gpr.hasTile(13683 * 4, 24889 * 4, 18).should.be.equal(false);
      // should scale for zoom level 15, 1 out from 16
      gpr.hasTile(13682 / 2, 24888 / 2, 15).should.be.equal(true);
      // should scale for zoom level 14, 2 out from 16
      gpr.hasTile(13682 / 4, 24888 / 4, 14).should.be.equal(true);
      // should not scale for zoom level 13, 3 out from 16
      gpr.hasTile(13682 / 8, 24888 / 8, 13).should.be.equal(false);
    });

    it('zoom type out', function () {
      const tableScaling = new TileTableScaling(geoPackage, tableName);
      const tileScaling = new TileScaling();
      tileScaling.setScalingType(TileScalingType.OUT);
      tileScaling.setZoomIn(2);
      tileScaling.setZoomOut(1);
      tableScaling.createOrUpdate(tileScaling);
      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      gpr.setScaling(tableScaling.getTileScaling());
      // should scale for zoom level 17, 1 in from 16
      gpr.hasTile(13683 * 2, 24889 * 2, 17).should.be.equal(true);
      // should not scale for zoom level 18, 2 in from 16
      gpr.hasTile(13683 * 4, 24889 * 4, 18).should.be.equal(false);
      // should scale for zoom level 15, 1 out from 16
      gpr.hasTile(13682 / 2, 24888 / 2, 15).should.be.equal(false);
      // should scale for zoom level 14, 2 out from 16
      gpr.hasTile(13682 / 4, 24888 / 4, 14).should.be.equal(false);
      // should not scale for zoom level 13, 3 out from 16
      gpr.hasTile(13682 / 8, 24888 / 8, 13).should.be.equal(false);
    });

    it('zoom type in-out', function () {
      const tableScaling = new TileTableScaling(geoPackage, tableName);
      const tileScaling = new TileScaling();
      tileScaling.setScalingType(TileScalingType.IN_OUT);
      tileScaling.setZoomIn(2);
      tileScaling.setZoomOut(1);
      tableScaling.createOrUpdate(tileScaling);
      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      gpr.setScaling(tableScaling.getTileScaling());
      // should scale for zoom level 17, 1 in from 16
      gpr.hasTile(13683 * 2, 24889 * 2, 17).should.be.equal(true);
      // should not scale for zoom level 18, 2 in from 16
      gpr.hasTile(13683 * 4, 24889 * 4, 18).should.be.equal(false);
      // should scale for zoom level 15, 1 out from 16
      gpr.hasTile(13682 / 2, 24888 / 2, 15).should.be.equal(true);
      // should scale for zoom level 14, 2 out from 16
      gpr.hasTile(13682 / 4, 24888 / 4, 14).should.be.equal(true);
      // should not scale for zoom level 13, 3 out from 16
      gpr.hasTile(13682 / 8, 24888 / 8, 13).should.be.equal(false);
    });

    it('should get a scaled tile for x: 27366, y: 49778, z: 17 tile', function (done) {
      const tableScaling = new TileTableScaling(geoPackage, tableName);
      const tileScaling = new TileScaling();
      tileScaling.setScalingType(TileScalingType.OUT);
      tableScaling.createOrUpdate(tileScaling);
      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      gpr.setScaling(tableScaling.getTileScaling());
      gpr.getTile(27366, 49778, 17).then(function (tile) {
        testSetup.diffImages(
          tile.getData(),
          path.join(
            __dirname,
            '..',
            '..',
            '..',
            '..',
            'fixtures',
            'tiles',
            '17',
            '27366',
            isWeb ? 'web' : '',
            isLinux ? '49778_linux.png' : '49778.png',
          ),
          function (err, equal) {
            try {
              equal.should.be.equal(true);
              done();
            } catch (e) {
              done(e);
            }
          },
        );
      });
    });

    it('should get a scaled tile for x: 6841, y: 12444, z: 15 tile', function (done) {
      const tableScaling = new TileTableScaling(geoPackage, tableName);
      const tileScaling = new TileScaling();
      tileScaling.setScalingType(TileScalingType.IN);
      tableScaling.createOrUpdate(tileScaling);
      const gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      gpr.setScaling(tableScaling.getTileScaling());
      gpr.getTile(6841, 12444, 15).then((tile) => {
        if (tile != null && tile.getData() != null) {
          testSetup.diffImages(
            tile.getData(),
            path.join(
              __dirname,
              '..',
              '..',
              '..',
              '..',
              'fixtures',
              'tiles',
              '15',
              '6841',
              isWeb ? 'web' : '',
              isLinux ? '12444_linux.png' : '12444.png',
            ),
            function (err, equal) {
              try {
                equal.should.be.equal(true);
                done();
              } catch (e) {
                done(e);
              }
            },
          );
        } else {
          done();
        }
      });
    });
  });

  describe('Test Add Scaling Extension for multiple tables', function () {
    var geoPackage;
    var filename;
    beforeEach('should open the copied geoPackage', async function () {
      var fileName = path.join(__dirname, '..', '..', '..', '..', 'fixtures', 'example.gpkg');

      let result = await copyAndOpenGeopackage(fileName);
      filename = result.path;
      geoPackage = result.geoPackage;
    });

    afterEach('should close the geoPackage', async function () {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should create tileScaling for every table', function () {
      this.timeout(30000);
      const tables = geoPackage.getTileTables();
      for (let table of tables) {
        const tableScaling = new TileTableScaling(geoPackage, table);
        tableScaling.getOrCreateExtension();
        const tileScaling = new TileScaling();
        tileScaling.setScalingType(TileScalingType.IN_OUT);
        tileScaling.setZoomIn(25);
        tileScaling.setZoomOut(25);
        tableScaling.create(tileScaling);
        assert.isNotNull(tableScaling.getTileScaling());
        assert.isTrue(tableScaling.has());
      }
    });
  });
});
