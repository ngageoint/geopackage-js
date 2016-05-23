var GeoPackageManager = require('../../../lib/geoPackageManager')
  , GeoPackageTileRetriever = require('../../../lib/tiles/retriever')
  , BoundingBox = require('../../../lib/boundingBox')
  , fs = require('fs')
  , async = require('async')
  , should = require('chai').should()
  , path = require('path');

describe('GeoPackage Tile Retriever tests', function() {

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

  it('should get the x: 2, y: 1, z: 2 tile', function(done) {
    this.timeout(0);
    var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
    gpr.getTile(2,1,2, function(err, tile) {
      fs.writeFileSync('/tmp/gptile.png', tile);
      var imageDiff = require('image-diff');
      imageDiff({
        actualImage: '/tmp/gptile.png',
        expectedImage: path.join(__dirname, '..','..','fixtures','tiles','2','2','1.png'),
        diffImage: '/tmp/diff.png',
      }, function (err, imagesAreSame) {
        imagesAreSame.should.be.equal(true);
        fs.unlinkSync('/tmp/gptile.png');
        done();
        // error will be any errors that occurred
        // imagesAreSame is a boolean whether the images were the same or not
        // diffImage will have an image which highlights differences
        //
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
            fs.writeFileSync('/tmp/gptile.png', tile);
            var imageDiff = require('image-diff');
            imageDiff({
              actualImage: '/tmp/gptile.png',
              expectedImage: path.join(__dirname, '..', '..', 'fixtures', 'tiles', zoom.toString(), xTile.toString(), yTile.toString()+'.png'),
              diffImage: '/tmp/diff.png',
            }, function (err, imagesAreSame) {
              console.log(path.join(__dirname, '..', '..', 'fixtures', 'tiles', zoom.toString(), xTile.toString(), yTile.toString()+'.png') + ' passes?', imagesAreSame);
              imagesAreSame.should.be.equal(true);
              fs.unlinkSync('/tmp/gptile.png');
              yDone();
              // error will be any errors that occurred
              // imagesAreSame is a boolean whether the images were the same or not
              // diffImage will have an image which highlights differences
              //
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
      fs.writeFileSync('/tmp/wgs84tile.png', tile);
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
