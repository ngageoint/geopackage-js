var GeoPackageManager = require('../../../lib/geoPackageManager')
  , GeoPackageTileRetriever = require('../../../lib/tiles/retriever')
  , BoundingBox = require('../../../lib/boundingBox')
  , testSetup = require('../../fixtures/testSetup')
  , fs = require('fs')
  , async = require('async')
  , should = require('chai').should()
  , path = require('path');

describe('GeoPackage Tile Retriever tests', function() {

  describe('Rivers GeoPackage tests', function() {

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
        geoPackage.getTileDaoWithTableName('TILESosmds', function(err, osmTileDao) {
          tileDao = osmTileDao;
          done();
        });
      });
    });

    afterEach('should close the geopackage', function() {
      geoPackage.close();
    });

    it('should get the web mercator bounding box', function(done) {
      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      gpr.getWebMercatorBoundingBox(function(err, result) {
        result.minLongitude.should.be.equal(-20037508.342789244);
        result.maxLongitude.should.be.equal(20037508.342789244);
        result.minLatitude.should.be.equal(-20037508.342789255);
        result.maxLatitude.should.be.equal(20037508.342789244);
        done();
      });
    });

    it('should get the x: 2, y: 1, z: 2 tile', function(done) {
      this.timeout(30000);
      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      gpr.getTile(2,1,2, function(err, tile) {
        testSetup.diffImages(tile, path.join(__dirname, '..','..','fixtures','tiles','2','2','1.png'), function(err, equal) {
          equal.should.be.equal(true);
          done();
        });
      });
    });

    it('should pull all of the tiles and compare them', function(done) {
      this.timeout(30000);
      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);

      async.eachSeries([0, 1, 2, 3], function(zoom, zoomDone) {
        var tiles = [];
        var tileCount = Math.pow(2,zoom);
        for (var i = 0; i < tileCount; i++) {
          tiles.push(i);
        }
        async.eachSeries(tiles, function(xTile, xDone) {
          async.eachSeries(tiles, function(yTile, yDone) {
            gpr.getTile(xTile,yTile,zoom, function(err, tile) {
              testSetup.diffImages(tile, path.join(__dirname, '..', '..', 'fixtures', 'tiles', zoom.toString(), xTile.toString(), yTile.toString()+'.png'), function(err, equal) {
                console.log(path.join(__dirname, '..', '..', 'fixtures', 'tiles', zoom.toString(), xTile.toString(), yTile.toString()+'.png') + ' passes?', equal);
                equal.should.be.equal(true);
                yDone();
              });
            });
          }, xDone);
        }, zoomDone);
      }, function(err) {
        done(err);
      });
    });

    it('should get the x: 2, y: 1, z: 3 tile', function(done) {
      var maxZoom = tileDao.maxZoom;
      var minZoom = tileDao.minZoom;

      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      gpr.getTile(2,1,3, function(err, tile) {
        should.not.exist(err);
        should.exist(tile);
        done();
      });
    });

    it('should have a tile at XYZ 0, 0, 1', function(done) {
      var maxZoom = tileDao.maxZoom;
      var minZoom = tileDao.minZoom;

      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      gpr.hasTile(0, 0, 1, function(err, hasTile) {
        hasTile.should.be.equal(true);
        should.not.exist(err);
        done();
      });
    });

    it('should not have a tile at -1, 0, 0', function(done) {
      var maxZoom = tileDao.maxZoom;
      var minZoom = tileDao.minZoom;

      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      gpr.hasTile(-1, 0, 0, function(err, hasTile) {
        hasTile.should.be.equal(false);
        should.not.exist(err);
        done();
      });
    });

    it('should get a tile specified with wgs84 coordinates', function(done) {
      var maxZoom = tileDao.maxZoom;
      var minZoom = tileDao.minZoom;

      var wgs84BoundingBox = new BoundingBox(0, 180, 0, 85.05112877980659);

      var gpr = new GeoPackageTileRetriever(tileDao, 512, 512);
      gpr.getTileWithWgs84Bounds(wgs84BoundingBox, 2, function(err, tile) {
        should.not.exist(err);
        should.exist(tile);
        // fs.writeFileSync('/tmp/wgs84tile.png', tile);
        done();
      });
    });

    // it('should get the tile matrix for 1 tile and no zoom specified', function(done) {
    //   var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
    //   var wgs84BoundingBox = new BoundingBox(0, 90, 0, 66.51326044311188);
    //   var webMercatorBoundingBox = wgs84BoundingBox.projectBoundingBox('EPSG:4326', 'EPSG:3857');
    //
    //   gpr.getTileMatrixWithWebMercatorBoundingBox(webMercatorBoundingBox, function(err, tileMatrix) {
    //     should.not.exist(err);
    //     should.exist(tileMatrix);
    //     tileMatrix.zoomLevel.should.be.equal(2);
    //     done();
    //   });
    // });
    //
    // it('should get the tile matrix for 1 tile and zoom specified', function(done) {
    //   var gpr = new GeoPackageTileRetriever(tileDao, 512, 512);
    //   var wgs84BoundingBox = new BoundingBox(0, 90, 0, 66.51326044311188);
    //   var webMercatorBoundingBox = wgs84BoundingBox.projectBoundingBox('EPSG:4326', 'EPSG:3857');
    //
    //   gpr.getTileMatrixWithWebMercatorBoundingBox(webMercatorBoundingBox, 3, function(err, tileMatrix) {
    //     should.not.exist(err);
    //     should.exist(tileMatrix);
    //     tileMatrix.zoomLevel.should.be.equal(3);
    //     done();
    //   });
    // });

  });

  describe('Scaled images GeoPackage tests', function() {

    var geoPackage;
    var tileDao;

    beforeEach('should open the geopackage', function(done) {
      var filename = path.join(__dirname, '..', '..', 'fixtures', '3857.gpkg');
      GeoPackageManager.open(filename, function(err, gp) {
        geoPackage = gp;
        should.not.exist(err);
        should.exist(gp);
        should.exist(gp.getDatabase().getDBConnection());
        gp.getPath().should.be.equal(filename);
        geoPackage.getTileDaoWithTableName('imagery', function(err, imagery) {
          tileDao = imagery;
          done();
        });
      });
    });

    it('should get the x: 0, y: 4, z: 4 tile', function(done) {
      this.timeout(0);
      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      gpr.getTile(0, 4, 4, function(err, tile) {
        var expectedPath;
        if (typeof(process) !== 'undefined' && process.version) {
          expectedPath = path.join(__dirname, '..','..','fixtures','tiles','imageryTile.png');
        } else {
          expectedPath = path.join(__dirname, '..','..','fixtures','tiles','imageryTileWeb.png');
        }
        testSetup.diffImages(tile, expectedPath, function (err, imagesAreSame) {
          imagesAreSame.should.be.equal(true);
          done(err);
        });
      });
    });

    it('should get the x: 0, y: 4, z: 4 tile without scaling', function(done) {
      this.timeout(0);
      var gpr = new GeoPackageTileRetriever(tileDao, 450, 450);
      gpr.getTile(0, 4, 4, function(err, tile) {
        testSetup.diffImagesWithDimensions(tile, path.join(__dirname, '..','..','fixtures','tiles','450tile.png'), 450, 450, function (err, imagesAreSame) {
          imagesAreSame.should.be.equal(true);
          done(err);
        });
      });
    });
  });

  describe('4326 tile tests', function() {
    beforeEach('should open the geopackage', function(done) {
      var filename = path.join(__dirname, '..', '..', 'fixtures', 'wgs84.gpkg');
      GeoPackageManager.open(filename, function(err, gp) {
        geoPackage = gp;
        should.not.exist(err);
        should.exist(gp);
        should.exist(gp.getDatabase().getDBConnection());
        gp.getPath().should.be.equal(filename);
        geoPackage.getTileDaoWithTableName('imagery', function(err, osmTileDao) {
          tileDao = osmTileDao;
          done();
        });
      });
    });

    it('should get the web mercator bounding box', function(done) {
      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      gpr.getWebMercatorBoundingBox(function(err, result) {
        result.minLongitude.should.be.equal(-20037508.342789244);
        result.maxLongitude.should.be.equal(-15028131.257091932);
        result.minLatitude.should.be.equal(5621521.486192066);
        result.maxLatitude.should.be.equal(20036051.91933679);
        done();
      });
    });

    it.skip('should get the x: 0, y: 0, z: 4 tile', function(done) {
      this.timeout(0);
      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      gpr.getTile(0, 0, 4, function(err, tile) {
        var expectedPath;
        if (typeof(process) !== 'undefined' && process.version) {
          expectedPath = path.join(__dirname, '..','..','fixtures','tiles','reprojectTile.png');
        } else {
          expectedPath = path.join(__dirname, '..','..','fixtures','tiles','reprojectTileWeb.png');
        }
        testSetup.diffImages(tile, expectedPath, function (err, imagesAreSame) {
          imagesAreSame.should.be.equal(true);
          done(err);
        });
      });
    });
  });
});
