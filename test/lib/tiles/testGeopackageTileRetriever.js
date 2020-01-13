import { GeoPackage as GeoPackageAPI } from '../../..'
import { default as testSetup } from '../../fixtures/testSetup'

var GeoPackageTileRetriever = require('../../../lib/tiles/retriever').GeoPackageTileRetriever
  // , GeoPackageAPI = require('../../..')
  , BoundingBox = require('../../../lib/boundingBox').BoundingBox
  // , testSetup = require('../../fixtures/testSetup')
  , proj4 = require('proj4')
  , fs = require('fs-extra')
  , should = require('chai').should()
  , path = require('path');

var isLinux = process.platform === 'linux';

describe('GeoPackage Tile Retriever tests', function() {

  describe('Rivers GeoPackage tests', function() {

    var geoPackage;
    var tileDao;
    var filename;

    beforeEach('should open the geopackage', async function() {
      var riversfilename = path.join(__dirname, '..', '..', 'fixtures', 'rivers.gpkg');
      // @ts-ignore
      let result = await copyAndOpenGeopackage(riversfilename);
      filename = result.path;
      geoPackage = result.geopackage;
      tileDao = geoPackage.getTileDao('TILESosmds');
    });

    afterEach('should close the geopackage', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should get the web mercator bounding box', function() {
      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      var result = gpr.getWebMercatorBoundingBox();
      result.minLongitude.should.be.equal(-20037508.342789244);
      result.maxLongitude.should.be.equal(20037508.342789244);
      result.minLatitude.should.be.equal(-20037508.342789255);
      result.maxLatitude.should.be.equal(20037508.342789244);
    });

    it('should get all the tiles in the bounding box', function() {
      var tiles = GeoPackageAPI.getTilesInBoundingBox(geoPackage, 'TILESosmds', 1, -180, 180, -85, 85);
      tiles.tiles.length.should.be.equal(4);
    });

    it('should get the x: 2, y: 1, z: 2 tile', function(done) {
      this.timeout(30000);
      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      gpr.getTile(2,1,2)
      .then(function(tile) {
        testSetup.diffImages(tile, path.join(__dirname, '..','..','fixtures','tiles','2','2','1.png'), function(err, equal) {
          equal.should.be.equal(true);
          done();
        });
      });
    });

    it('should get the web mercator x: 2, y: 1, z: 2 tile', function(done) {
      this.timeout(30000);
      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      gpr.getWebMercatorTile(2,1,2)
      .then(function(tile) {
        testSetup.diffImages(tile, path.join(__dirname, '..','..','fixtures','tiles','2','2','1.png'), function(err, equal) {
          equal.should.be.equal(true);
          done();
        });
      });
    });

    it('should get the tile with wgs84 bounds', function(done) {
      this.timeout(30000);
      var wgs84BoundingBox = new BoundingBox(0, 90, 0, 66.51326044311185);

      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      gpr.getTileWithWgs84BoundsInProjection(wgs84BoundingBox, 2, 'EPSG:3857')
      .then(function(tile) {
        testSetup.diffImages(tile, path.join(__dirname, '..','..','fixtures','reprojTile.png'), function(err, equal) {
          equal.should.be.equal(true);
          done();
        });
      });
    });

    it('should pull all of the tiles and compare them', function() {
      this.timeout(0);
      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
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
                    gpr.getTile(x,y,zoom)
                    .then(function(tile) {
                      testSetup.diffImages(tile, path.join(__dirname, '..', '..', 'fixtures', 'tiles', zoom.toString(), x.toString(), y.toString()+'.png'), function(err, equal) {
                        console.log(path.join(__dirname, '..', '..', 'fixtures', 'tiles', zoom.toString(), x.toString(), y.toString()+'.png') + ' passes?', equal);
                        equal.should.be.equal(true);
                        resolve();
                      });
                    });
                  });
                });
              }, Promise.resolve());
            });
          }, Promise.resolve());
        });
      }, Promise.resolve());
    });

    it('should get the x: 0, y: 0, z: 3 tile', function() {
      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      return gpr.getTile(0,0,3)
      .then(function(tile) {
        should.exist(tile);
      });
    });

    it('should get the x: 2, y: 1, z: 3 tile', function() {
      var maxZoom = tileDao.maxZoom;
      var minZoom = tileDao.minZoom;

      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      return gpr.getTile(2,1,3)
      .then(function(tile) {
        should.exist(tile);
      });
    });

    it('should have a tile at XYZ 0, 0, 1', function() {
      var maxZoom = tileDao.maxZoom;
      var minZoom = tileDao.minZoom;

      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      var hasTile = gpr.hasTile(0, 0, 1);
      hasTile.should.be.equal(true);
    });

    it('should not have a tile at -1, 0, 0', function() {
      var maxZoom = tileDao.maxZoom;
      var minZoom = tileDao.minZoom;

      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      var hasTile = gpr.hasTile(-1, 0, 0);
      hasTile.should.be.equal(false);
    });

    it('should get a tile specified with wgs84 coordinates', function() {
      var wgs84BoundingBox = new BoundingBox(0, 180, 0, 85.05112877980659);

      var gpr = new GeoPackageTileRetriever(tileDao, 512, 512);
      return gpr.getTileWithWgs84Bounds(wgs84BoundingBox)
      .then(function(tile) {
        should.exist(tile);
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
    var filename;
    beforeEach('should open the geopackage', async function() {
      var filename3857 = path.join(__dirname, '..', '..', 'fixtures', '3857.gpkg');
      // @ts-ignore
      let result = await copyAndOpenGeopackage(filename3857);
      filename = result.path;
      geoPackage = result.geopackage;
      tileDao = geoPackage.getTileDao('imagery');
    });

    afterEach('delete the geopackage', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    })

    it('should get the x: 0, y: 4, z: 4 tile', function(done) {
      this.timeout(0);
      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      gpr.getTile(0, 4, 4)
      .then(function(tile) {
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
      gpr.getTile(0, 4, 4)
      .then(function(tile) {
        var expectedPath;
        if (typeof(process) !== 'undefined' && process.version) {
          expectedPath = path.join(__dirname, '..','..','fixtures','tiles','450tile.png');
        } else {
          expectedPath = path.join(__dirname, '..','..','fixtures','tiles','450tileWeb.png');
        }
        testSetup.diffImagesWithDimensions(tile, expectedPath, 450, 450, function (err, imagesAreSame) {
          imagesAreSame.should.be.equal(true);
          done(err);
        });
      });
    });
  });

  describe('4326 tile tests', function() {
    var tileDao;
    var geoPackage;
    var filename;
    var defs = require('../../../lib/proj4Defs');
    for (var name in defs) {
      if (defs[name]) {
        proj4.defs(name, defs[name]);
      }
    }

    beforeEach('should open the geopackage', async function() {
      var wgs84filename = path.join(__dirname, '..', '..', 'fixtures', 'wgs84.gpkg');
      // @ts-ignore
      let result = await copyAndOpenGeopackage(wgs84filename);
      filename = result.path;
      geoPackage = result.geopackage;
      tileDao = geoPackage.getTileDao('imagery');
    });

    afterEach('should delete the geopackage', async function() {
      await testSetup.deleteGeoPackage(filename);
    })

    it('should get the web mercator bounding box', function() {
      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      var result = gpr.getWebMercatorBoundingBox();
      result.minLongitude.should.be.equal(-20037508.342789244);
      result.maxLongitude.should.be.equal(-15028131.257091932);
      result.minLatitude.should.be.equal(5621521.486192066);
      result.maxLatitude.should.be.equal(20036051.91933679);
    });

    it('should get the web mercator bounding box twice', function() {
      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      var result = gpr.getWebMercatorBoundingBox();
      result.minLongitude.should.be.equal(-20037508.342789244);
      result.maxLongitude.should.be.equal(-15028131.257091932);
      result.minLatitude.should.be.equal(5621521.486192066);
      result.maxLatitude.should.be.equal(20036051.91933679);

      var result2 = gpr.getWebMercatorBoundingBox();
      result2.minLongitude.should.be.equal(-20037508.342789244);
      result2.maxLongitude.should.be.equal(-15028131.257091932);
      result2.minLatitude.should.be.equal(5621521.486192066);
      result2.maxLatitude.should.be.equal(20036051.91933679);
    });

    it('should get the x: 0, y: 4, z: 4 tile', function(done) {
      this.timeout(0);
      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      gpr.getTile(0, 4, 4)
      .then(function(tile) {
        var expectedPath;
        if (typeof(process) !== 'undefined' && process.version) {
          expectedPath = path.join(__dirname, '..','..','fixtures','tiles', isLinux ? 'reprojectTileLinux.png' : 'reprojectTile.png');
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
