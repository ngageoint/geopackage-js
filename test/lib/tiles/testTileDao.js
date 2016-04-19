var GeoPackageManager = require('../../../lib/geoPackageManager')
  , TileDao = require('../../../lib/tiles/user/tileDao')
  , should = require('chai').should()
  , path = require('path')
  , async = require('async');

describe('TileDao tests', function() {

  var geoPackage;
  var tileDao;

  beforeEach('should open the geopackage', function(done) {
    var filename = path.join(__dirname, '..', '..', 'fixtures', 'rivers.gpkg');
    GeoPackageManager.open(filename, function(err, gp) {
      geoPackage = gp;
      should.not.exist(err);
      should.exist(gp);
      should.exist(gp.getDatabase().getDBConnection());
      gp.getPath().should.be.equal(filename);
      geoPackage.getTileDaoWithTableName('TILESosmds', function(err, retrievedTileDao) {
        tileDao = retrievedTileDao;
        done();
      });
    });
  });

  it('should get the zoom levels', function(done) {
    tileDao.minZoom.should.be.equal(0);
    tileDao.maxZoom.should.be.equal(3);
    done();
  });

  it('should get the bounding box for each zoom level', function(done) {
    async.eachSeries([0, 1, 2, 3, 4], function(zoom, callback) {
      tileDao.getBoundingBoxWithZoomLevel(zoom, function(err, bb) {
        if (zoom === 4) {
          should.not.exist(bb);
        } else {
          bb.minLongitude.should.be.equal(-20037508.342789244);
          bb.maxLongitude.should.be.equal(20037508.342789244);
          bb.minLatitude.should.be.equal(-20037508.342789244);
          bb.maxLatitude.should.be.equal(20037508.342789244);
        }
        callback();
      });
    }, function(err) {
      done();
    });
  });

  it('should get the tile grid for each zoom level', function(done) {
    async.eachSeries([0, 1, 2, 3, 4], function(zoom, callback) {
      var grid = tileDao.getTileGridWithZoomLevel(zoom);
      if (zoom === 4) {
        should.not.exist(grid);
      } else {
        grid.minX.should.be.equal(0);
        grid.minY.should.be.equal(0);
        grid.maxX.should.be.equal(Math.pow(2, zoom)-1);
        grid.maxX.should.be.equal(Math.pow(2, zoom)-1);
      }
      callback();
    }, function(err) {
      done();
    });
  });

  it('should get the table', function() {
    var tileTable = tileDao.getTileTable();
    tileTable.tableName.should.be.equal('TILESosmds');
    should.exist(tileTable.getTileDataColumn);
  });

  it('should query for a tile', function(done) {
    tileDao.queryForTile(0, 0, 0, function(err, tileRow) {
      tileRow.getZoomLevel().should.be.equal(0);
      tileRow.getTileColumn().should.be.equal(0);
      tileRow.getTileRow().should.be.equal(0);
      var data = tileRow.getTileData();
      should.exist(data);
      done();
    });
  });

  it('should query for tiles in the zoom level', function(done) {
    tileDao.queryForTilesWithZoomLevel(1, function(err, tileRow) {
      tileRow.getZoomLevel().should.be.equal(1);
      var data = tileRow.getTileData();
      should.exist(data);
    }, function(err, count) {
      count.should.be.equal(4);
      done();
    });
  });

  it('should query for tiles in the zoom level descending order', function(done) {
    tileDao.queryForTilesDescending(1, function(err, tileRow) {
      tileRow.getZoomLevel().should.be.equal(1);
      var data = tileRow.getTileData();
      should.exist(data);
    }, function(err, count) {
      count.should.be.equal(4);
      done();
    });
  });

  it('should query for tiles in the zoom level and column', function(done) {
    tileDao.queryForTilesInColumn(1, 1, function(err, tileRow) {
      tileRow.getZoomLevel().should.be.equal(1);
      tileRow.getTileColumn().should.be.equal(1);
      var data = tileRow.getTileData();
      should.exist(data);
    }, function(err, count) {
      count.should.be.equal(2);
      done();
    });
  });

  it('should query for tiles in the zoom level and row', function(done) {
    tileDao.queryForTilesInRow(1, 1, function(err, tileRow) {
      tileRow.getZoomLevel().should.be.equal(1);
      tileRow.getTileRow().should.be.equal(1);
      var data = tileRow.getTileData();
      should.exist(data);
    }, function(err, count) {
      count.should.be.equal(2);
      done();
    });
  });

  it('should query for tiles in the tile grid', function(done) {
    var tileGrid = {
      minX: 0,
      maxX: 1,
      minY: 0,
      maxY: 0
    };
    tileDao.queryByTileGrid(tileGrid, 1, function(err, tileRow) {
      tileRow.getZoomLevel().should.be.equal(1);
      tileRow.getTileRow().should.be.equal(0);
      var data = tileRow.getTileData();
      should.exist(data);
    }, function(err, count) {
      count.should.be.equal(2);
      done();
    });
  });
});
