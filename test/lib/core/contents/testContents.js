var GeoPackageManager = require('../../../../lib/geoPackageManager')
  , ContentsDao = require('../../../../lib/core/contents').ContentsDao
  , Contents = require('../../../../lib/core/contents').Contents
  , should = require('chai').should()
  , path = require('path');

describe('Contents tests', function() {

  var geoPackage;
  var contentsDao;

  beforeEach('should open the geopackage', function(done) {
    var filename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers.gpkg');
    GeoPackageManager.open(filename, function(err, gp) {
      geoPackage = gp;
      should.not.exist(err);
      should.exist(gp);
      should.exist(gp.getDatabase().getDBConnection());
      gp.getPath().should.be.equal(filename);
      contentsDao = new ContentsDao(gp.getDatabase());
      done();
    });
  });

  it('should get the contents', function(done) {
    contentsDao.queryForAll(function(err, contents) {
      console.log('contents', contents);
      // tileMatrices.should.have.property('length', 4);
      done();
    })
  });

  // it('should transform the tile matrix result to a TileMatrix', function(done) {
  //   tileMatrixDao.queryForAll(function(err, tileMatrices) {
  //     tileMatrices[0].should.have.property('table_name', 'TILESosmds');
  //     tileMatrices[0].should.have.property('zoom_level', 0);
  //     tileMatrices[0].should.have.property('matrix_width', 1);
  //     tileMatrices[0].should.have.property('matrix_width', 1);
  //     tileMatrices[0].should.have.property('tile_height', 256);
  //     tileMatrices[0].should.have.property('tile_width', 256);
  //     tileMatrices[0].should.have.property('pixel_x_size', 156543.03392804097);
  //     tileMatrices[0].should.have.property('pixel_y_size', 156543.033928041);
  //
  //     var tileMatrix = tileMatrixDao.createObject();
  //     tileMatrixDao.populateObjectFromResult(tileMatrix, tileMatrices[0]);
  //     tileMatrix.should.have.property('matrixWidth', 1);
  //     tileMatrix.should.have.property('matrixHeight', 1);
  //     tileMatrix.should.have.property('zoomLevel', 0);
  //     tileMatrix.should.have.property('tableName', 'TILESosmds');
  //     tileMatrix.should.have.property('tileWidth', 256);
  //     tileMatrix.should.have.property('tileHeight', 256);
  //     tileMatrix.should.have.property('pixelXSize', 156543.03392804097);
  //     tileMatrix.should.have.property('pixelYSize', 156543.033928041);
  //
  //     done();
  //   });
  // });
  //
  // // TODO find a geopackage that has Contents
  // it('should get the Contents from a TileMatrix', function(done) {
  //   tileMatrixDao.queryForAll(function(err, tileMatrices) {
  //     tileMatrixDao.getContents(tileMatrices[0], function(err, contents) {
  //       console.log('err', err);
  //       console.log('contents', contents);
  //       done();
  //     });
  //   });
  // });
  //
  // // TODO find a geopackage that has TileMatrixSet
  // it('should get the TileMatrixSet from a TileMatrix', function(done) {
  //   tileMatrixDao.queryForAll(function(err, tileMatrices) {
  //     tileMatrixDao.getTileMatrixSet(tileMatrices[0], function(err, tileMatrixSet) {
  //       console.log('err', err);
  //       console.log('tileMatrixSet', tileMatrixSet);
  //       done();
  //     });
  //   });
  // });

});
