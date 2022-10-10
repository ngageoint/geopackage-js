var TileMatrixDao = require('../../../lib/tiles/matrix/tileMatrixDao').TileMatrixDao
, testSetup = require('../../testSetup').default
, should = require('chai').should()
, path = require('path');

describe('Tile Matrix tests', function() {

  var geoPackage;
  var tileMatrixDao;
  var filename;

  beforeEach('should open the geoPackage', async function() {
    var riversfilename = path.join(__dirname, '..', '..', 'fixtures', 'rivers.gpkg');
    // @ts-ignore
    let result = await copyAndOpenGeopackage(riversfilename);
    filename = result.path;
    geoPackage = result.geoPackage;
    tileMatrixDao = new TileMatrixDao(geoPackage);
  });

  afterEach('should close the geoPackage', async function() {
    geoPackage.close();
    await testSetup.deleteGeoPackage(filename);
  });

  it('should get the tile matrixes', function() {
    var tileMatrices = tileMatrixDao.queryForAll();
    tileMatrices.should.have.property('length', 4);
  });

  it('should transform the tile matrix result to a TileMatrix', function() {
    var tileMatrices = tileMatrixDao.queryForAll();
    tileMatrices[0].should.have.property('table_name', 'TILESosmds');
    tileMatrices[0].should.have.property('zoom_level', 0);
    tileMatrices[0].should.have.property('matrix_width', 1);
    tileMatrices[0].should.have.property('matrix_width', 1);
    tileMatrices[0].should.have.property('tile_height', 256);
    tileMatrices[0].should.have.property('tile_width', 256);
    tileMatrices[0].should.have.property('pixel_x_size', 156543.03392804097);
    tileMatrices[0].should.have.property('pixel_y_size', 156543.033928041);

    var tileMatrix = tileMatrixDao.createObject(tileMatrices[0]);
    tileMatrix.should.have.property('matrix_width', 1);
    tileMatrix.should.have.property('matrix_height', 1);
    tileMatrix.should.have.property('zoom_level', 0);
    tileMatrix.should.have.property('table_name', 'TILESosmds');
    tileMatrix.should.have.property('tile_width', 256);
    tileMatrix.should.have.property('tile_height', 256);
    tileMatrix.should.have.property('pixel_x_size', 156543.03392804097);
    tileMatrix.should.have.property('pixel_y_size', 156543.033928041);
  });

  it('should get the Contents from a TileMatrix', function() {
    var tileMatrices = tileMatrixDao.queryForAll();
    var tileMatrix = tileMatrixDao.createObject(tileMatrices[0]);
    var contents = tileMatrixDao.getContents(tileMatrix);
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
  });

  it('should get the TileMatrixSet from a TileMatrix', function() {
    var tileMatrices = tileMatrixDao.queryForAll();
    var tileMatrix = tileMatrixDao.createObject(tileMatrices[0]);
    var tileMatrixSet = tileMatrixDao.getTileMatrixSet(tileMatrix);
    should.exist(tileMatrixSet);
    tileMatrixSet.should.have.property('srs_id', 3857);
    tileMatrixSet.should.have.property('table_name', 'TILESosmds');
    tileMatrixSet.should.have.property('min_x', -20037508.342789244);
    tileMatrixSet.should.have.property('min_y', -20037508.342789244);
    tileMatrixSet.should.have.property('max_x', 20037508.342789244);
    tileMatrixSet.should.have.property('max_y', 20037508.342789244);
  });

});
