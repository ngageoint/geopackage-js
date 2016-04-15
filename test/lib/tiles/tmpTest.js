var GeoPackageManager = require('../../../lib/geoPackageManager')
  , GeoPackageTileRetriever = require('../../../lib/tiles/retriever')
  , fs = require('fs')
  , should = require('chai').should()
  , path = require('path');

describe.skip('Whitehorse Tile Retriever tests', function() {

  var geoPackage;
  var tileDao;

  beforeEach('should open the geopackage', function(done) {
    var filename = path.join('/Users','barela','Desktop','maps','geopackage', 'ERDC_Whitehorse_GeoPackage.gpkg');
    GeoPackageManager.open(filename, function(err, gp) {
      geoPackage = gp;
      should.not.exist(err);
      should.exist(gp);
      should.exist(gp.getDatabase().getDBConnection());
      gp.getPath().should.be.equal(filename);
      geoPackage.getTileDaoWithTableName('Whitehorse', function(err, osmTileDao) {
        tileDao = osmTileDao;
        done();
      });
    });
  });

  it('should get the tile table names', function(done) {
    geoPackage.getTileTables(function(err, tables) {
      console.log('tables', tables);
      should.not.exist(err);
      should.exist(tables);
      tables.length.should.be.equal(1);
      tables.should.have.members([
         'Whitehorse'
      ]);
      done();
    });
  });

  it('should get the x: 1019, y: 2339, z: 13 tile', function(done) {
    var maxZoom = tileDao.maxZoom;
    var minZoom = tileDao.minZoom;

    var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
    gpr.getTile(1019,2339,13, function(err, tile) {
      console.log('err', err);
      console.log('tile', tile);
      fs.writeFileSync('/tmp/whitehorsetile.png', tile.tile_data);
      done();
      // var imageDiff = require('image-diff');
      // imageDiff({
      //   actualImage: '/tmp/whitehorsetile.png',
      //   expectedImage: '/tmp/javatile.png',
      //   diffImage: '/tmp/diff.png',
      // }, function (err, imagesAreSame) {
      //   imagesAreSame.should.be.equal(true);
      //   done();
      //   // error will be any errors that occurred
      //   // imagesAreSame is a boolean whether the images were the same or not
      //   // diffImage will have an image which highlights differences
      //   //
      // });
    });
  });

  it('should have a tile at XYZ 1022, 2346, 13', function(done) {
    var maxZoom = tileDao.maxZoom;
    var minZoom = tileDao.minZoom;
    console.log('maxZoom', maxZoom);
    console.log('minZoom', minZoom);

    var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
    gpr.hasTile(1022, 2346, 13, function(err, hasTile) {
      console.log('err', err);
      console.log('hasTile', hasTile);
      hasTile.should.be.equal(true);
      should.not.exist(err);
      done();
    });
  });

  it('should not have a tile at 0, 0, 0', function(done) {
    var maxZoom = tileDao.maxZoom;
    var minZoom = tileDao.minZoom;

    var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
    gpr.hasTile(0, 0, 0, function(err, hasTile) {
      hasTile.should.be.equal(false);
      should.not.exist(err);
      done();
    });
  });

});
