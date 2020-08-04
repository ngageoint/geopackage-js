import { default as testSetup } from '../../../fixtures/testSetup'
import { GeoPackageTileRetriever, TileScaling, TileScalingType } from '@ngageoint/geopackage';

var should = require('chai').should();

var path = require('path');

var isLinux = process.platform === 'linux';

describe('GeoPackage Tile Scaling Extension Tests', function() {

  describe('Test Add Scaling Extension', function() {
    var geoPackage;
    var tileDao;
    var filename;
    var tileScalingExtension;
    var tileScalingDao;

    beforeEach('should open the copied geopackage and setup the tile scaling extension', async function() {
      var denverfilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'denver_tile.gpkg');
      // @ts-ignore
      let result = await copyAndOpenGeopackage(denverfilename);
      filename = result.path;
      geoPackage = result.geopackage;
      tileDao = geoPackage.getTileDao('denver');
      tileScalingExtension = geoPackage.getTileScalingExtension('denver');
      await tileScalingExtension.getOrCreateExtension();
      tileScalingDao = tileScalingExtension.dao;
    });

    afterEach('should close the geopackage', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should get the x:13683, y: 24889, z: 16 tile', function(done) {
      this.timeout(30000);
      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      gpr.getTile(13683,24889,16)
        .then(function(tile) {
          testSetup.diffImages(tile, path.join(__dirname, '..','..','..','fixtures','tiles','16','13683', isLinux ? '24889_linux.png' : '24889.png'), function(err, equal) {
            equal.should.be.equal(true);
            done();
          });
        });
    });

    it('should have tile scaling extension for denver table', function() {
      this.timeout(30000);
      tileScalingExtension.has().should.be.equal(true);
    });

    it('should be able to remove tile scaling extension', function() {
      this.timeout(30000);
      tileScalingExtension.has().should.be.equal(true);
      tileScalingExtension.removeExtension();
      tileScalingExtension.has().should.be.equal(false);
      tileScalingExtension = geoPackage.getTileScalingExtension('denver');
      tileScalingExtension.removeExtension();
      tileScalingExtension.has().should.be.equal(false);

    });

    it('should create tile scaling row', function() {
      this.timeout(30000);
      should.not.exist(tileScalingDao.queryForTableName('denver'));
      const tileScaling = new TileScaling();
      tileScaling.scaling_type = TileScalingType.IN;
      tileScaling.zoom_in = 2;
      tileScaling.zoom_out = 1;
      tileScalingExtension.createOrUpdate(tileScaling);
      should.exist(tileScalingDao.queryForTableName('denver'));
    });

    it('should delete tile scaling row', function() {
      this.timeout(30000);
      const tileScaling = new TileScaling();
      tileScaling.scaling_type = TileScalingType.IN;
      tileScaling.zoom_in = 2;
      tileScaling.zoom_out = 1;
      tileScalingExtension.createOrUpdate(tileScaling);
      should.exist(tileScalingDao.queryForTableName('denver'));
      tileScalingDao.deleteByTableName('denver');
      should.not.exist(tileScalingDao.queryForTableName('denver'));
    });

    it('tile scaling dao should handle null create object requests', function() {
      this.timeout(30000);
      JSON.stringify(tileScalingDao.createObject(null)).should.equal(JSON.stringify(new TileScaling()));
    });

    it('zoom type in', function() {
      this.timeout(30000);
      const tileScaling = new TileScaling();
      tileScaling.scaling_type = TileScalingType.IN;
      tileScaling.zoom_in = 2;
      tileScaling.zoom_out = 1;
      tileScalingExtension.createOrUpdate(tileScaling);
      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      gpr.setScaling(tileScalingDao.queryForTableName('denver'));
      // should scale for zoom level 17, 1 in from 16
      gpr.hasTile((13683 * 2),(24889 * 2),17).should.be.equal(false);
      // should not scale for zoom level 18, 2 in from 16
      gpr.hasTile((13683 * 4),(24889 * 4),18).should.be.equal(false);
      // should scale for zoom level 15, 1 out from 16
      gpr.hasTile((13682 / 2),(24888 / 2),15).should.be.equal(true);
      // should scale for zoom level 14, 2 out from 16
      gpr.hasTile((13682 / 4),(24888 / 4),14).should.be.equal(true);
      // should not scale for zoom level 13, 3 out from 16
      gpr.hasTile((13682 / 8),(24888 / 8),13).should.be.equal(false);
    });

    it('zoom type out', function() {
      this.timeout(30000);
      const tileScaling = new TileScaling();
      tileScaling.scaling_type = TileScalingType.OUT;
      tileScaling.zoom_in = 2;
      tileScaling.zoom_out = 1;
      tileScalingExtension.createOrUpdate(tileScaling);
      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      gpr.setScaling(tileScalingDao.queryForTableName('denver'));
      // should scale for zoom level 17, 1 in from 16
      gpr.hasTile((13683 * 2),(24889 * 2),17).should.be.equal(true);
      // should not scale for zoom level 18, 2 in from 16
      gpr.hasTile((13683 * 4),(24889 * 4),18).should.be.equal(false);
      // should scale for zoom level 15, 1 out from 16
      gpr.hasTile((13682 / 2),(24888 / 2),15).should.be.equal(false);
      // should scale for zoom level 14, 2 out from 16
      gpr.hasTile((13682 / 4),(24888 / 4),14).should.be.equal(false);
      // should not scale for zoom level 13, 3 out from 16
      gpr.hasTile((13682 / 8),(24888 / 8),13).should.be.equal(false);
    });

    it('zoom type in-out', function() {
      this.timeout(30000);
      const tileScaling = new TileScaling();
      tileScaling.scaling_type = TileScalingType.IN_OUT;
      tileScaling.zoom_in = 2;
      tileScaling.zoom_out = 1;
      tileScalingExtension.createOrUpdate(tileScaling);
      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      gpr.setScaling(tileScalingDao.queryForTableName('denver'));
      // should scale for zoom level 17, 1 in from 16
      gpr.hasTile((13683 * 2),(24889 * 2),17).should.be.equal(true);
      // should not scale for zoom level 18, 2 in from 16
      gpr.hasTile((13683 * 4),(24889 * 4),18).should.be.equal(false);
      // should scale for zoom level 15, 1 out from 16
      gpr.hasTile((13682 / 2),(24888 / 2),15).should.be.equal(true);
      // should scale for zoom level 14, 2 out from 16
      gpr.hasTile((13682 / 4),(24888 / 4),14).should.be.equal(true);
      // should not scale for zoom level 13, 3 out from 16
      gpr.hasTile((13682 / 8),(24888 / 8),13).should.be.equal(false);
    });

    it('should get a scaled tile for x: 27366, y: 49778, z: 17 tile', function(done) {
      this.timeout(30000);
      const tileScaling = new TileScaling();
      tileScaling.scaling_type = TileScalingType.OUT;
      tileScalingExtension.createOrUpdate(tileScaling);
      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      gpr.setScaling(tileScalingDao.queryForTableName('denver'));
      gpr.getTile(27366, 49778,17)
        .then(function(tile) {
          testSetup.diffImages(tile, path.join(__dirname, '..','..','..','fixtures','tiles','17','27366', isLinux ? '49778_linux.png' : '49778.png'), function(err, equal) {
            equal.should.be.equal(true);
            done();
          });
        });
    });

    it('should get a scaled tile for x: 6841, y: 12444, z: 15 tile', function(done) {
      this.timeout(30000);
      const tileScaling = new TileScaling();
      tileScaling.scaling_type = TileScalingType.IN;
      tileScalingExtension.createOrUpdate(tileScaling);
      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      gpr.setScaling(tileScalingDao.queryForTableName('denver'));
      gpr.getTile(6841, 12444,15)
        .then(function(tile) {
          testSetup.diffImages(tile, path.join(__dirname, '..','..','..','fixtures','tiles','15','6841', isLinux ? '12444_linux.png' : '12444.png'), function(err, equal) {
            equal.should.be.equal(true);
            done();
          });
        });
    });
  });
});
