var GeoPackageManager = require('../../../lib/geoPackageManager')
  , TileMatrixDao = require('../../../lib/tiles/matrix').TileMatrixDao
  , TileMatrix = require('../../../lib/tiles/matrix').TileMatrix
  , should = require('chai').should()
  , path = require('path');

describe('Tile Matrix tests', function() {

  var geoPackage;
  var tileMatrixDao;

  beforeEach('should open the geopackage', function(done) {
    var filename = path.join(__dirname, '..', '..', 'fixtures', 'rivers.gpkg');
    GeoPackageManager.open(filename, function(err, gp) {
      geoPackage = gp;
      should.not.exist(err);
      should.exist(gp);
      should.exist(gp.getDatabase().getDBConnection());
      gp.getPath().should.be.equal(filename);
      tileMatrixDao = new TileMatrixDao(gp.getDatabase());
      done();
    });
  });

  it('should get the tile matrixes', function(done) {
    tileMatrixDao.queryForAll(function(err, tileMatrices) {
      tileMatrices.should.have.property('length', 4);
      done();
    })
  });

  it('should transform the tile matrix result to a TileMatrix', function(done) {
    tileMatrixDao.queryForAll(function(err, tileMatrices) {
      tileMatrices[0].should.have.property('table_name', 'TILESosmds');
      tileMatrices[0].should.have.property('zoom_level', 0);
      tileMatrices[0].should.have.property('matrix_width', 1);
      tileMatrices[0].should.have.property('matrix_width', 1);
      tileMatrices[0].should.have.property('tile_height', 256);
      tileMatrices[0].should.have.property('tile_width', 256);
      tileMatrices[0].should.have.property('pixel_x_size', 156543.03392804097);
      tileMatrices[0].should.have.property('pixel_y_size', 156543.033928041);

      var tileMatrix = tileMatrixDao.createObject();
      tileMatrixDao.populateObjectFromResult(tileMatrix, tileMatrices[0]);
      tileMatrix.should.have.property('matrix_width', 1);
      tileMatrix.should.have.property('matrix_height', 1);
      tileMatrix.should.have.property('zoom_level', 0);
      tileMatrix.should.have.property('table_name', 'TILESosmds');
      tileMatrix.should.have.property('tile_width', 256);
      tileMatrix.should.have.property('tile_height', 256);
      tileMatrix.should.have.property('pixel_x_size', 156543.03392804097);
      tileMatrix.should.have.property('pixel_y_size', 156543.033928041);

      done();
    });
  });

  it('should get the Contents from a TileMatrix', function(done) {
    tileMatrixDao.queryForAll(function(err, tileMatrices) {
      var tileMatrix = tileMatrixDao.createObject();
      tileMatrixDao.populateObjectFromResult(tileMatrix, tileMatrices[0]);
      tileMatrixDao.getContents(tileMatrix, function(err, contents) {
        should.not.exist(err);
        should.exist(contents);
        contents.should.have.property('table_name', 'TILESosmds');
        contents.should.have.property('data_type', 'tiles');
        contents.should.have.property('identifier', 'TILESosmds');
        contents.should.have.property('description', null);
        contents.should.have.property('last_change', '2015-12-04T15:28:53.871Z');
        contents.should.have.property('min_x', -180);
        contents.should.have.property('min_y', -85.0511287798066);
        contents.should.have.property('max_x', 180);
        contents.should.have.property('max_y', 85.0511287798066);
        contents.should.have.property('srs_id', 4326);
        done();
      });
    });
  });

  it('should get the TileMatrixSet from a TileMatrix', function(done) {
    tileMatrixDao.queryForAll(function(err, tileMatrices) {
      var tileMatrix = tileMatrixDao.createObject();
      tileMatrixDao.populateObjectFromResult(tileMatrix, tileMatrices[0]);
      tileMatrixDao.getTileMatrixSet(tileMatrix, function(err, tileMatrixSet) {
        should.exist(tileMatrixSet);
        should.not.exist(err);
        tileMatrixSet.should.have.property('srs_id', 3857);
        tileMatrixSet.should.have.property('table_name', 'TILESosmds');
        tileMatrixSet.should.have.property('min_x', -20037508.342789244);
        tileMatrixSet.should.have.property('min_y', -20037508.342789244);
        tileMatrixSet.should.have.property('max_x', 20037508.342789244);
        tileMatrixSet.should.have.property('max_y', 20037508.342789244);
        done();
      });
    });
  });

});
