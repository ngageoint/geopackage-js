import { GeoPackageAPI } from '../../../..'
import { default as testSetup } from '../../../fixtures/testSetup'
import {ContentsDao} from '../../../../lib/core/contents/contentsDao';

// var GeoPackageAPI = require('../../../..')
var Contents = require('../../../../lib/core/contents/contents').Contents
  , ContentsDataType = require('../../../../lib/core/contents/contentsDataType').ContentsDataType
  , TileMatrix = require('../../../../lib/tiles/matrix/tileMatrix').TileMatrix
  , TestUtils = require('../../../fixtures/testUtils')
  , should = require('chai').should()
  , path = require('path');

describe('Contents tests', function() {

  var geoPackage;
  var contentsDao;
  var filename;

  beforeEach('should open the geopackage', async function() {
    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers.gpkg');
    // @ts-ignore
    let result = await copyAndOpenGeopackage(originalFilename);
    filename = result.path;
    geoPackage = result.geopackage;
    contentsDao = new ContentsDao(geoPackage);
  });

  afterEach('should close the geopackage', async function() {
    geoPackage.close();
    await testSetup.deleteGeoPackage(filename);
  });

  it('should create a new contents entry', function() {
    var contentsDao = geoPackage.contentsDao;
    var contents = contentsDao.createObject();
    contents.table_name = 'testit';
    contents.data_type = ContentsDataType.FEATURES;
    // contents.last_change = new Date().toISOString();
    contentsDao.create(contents);
  });

  it('should get the contents', function() {
    var contents = contentsDao.queryForAll();
    should.exist(contents);
    contents.should.have.property('length', 2);
    contents[0].should.have.property('table_name', 'TILESosmds');
    contents[0].should.have.property('data_type', 'tiles');
    contents[0].should.have.property('identifier', 'TILESosmds');
    contents[0].should.have.property('description', null);
    contents[0].should.have.property('last_change', '2015-12-04T15:28:53.871Z');
    contents[0].should.have.property('min_x', -180);
    contents[0].should.have.property('min_y', -85.0511287798066);
    contents[0].should.have.property('max_x', 180);
    contents[0].should.have.property('max_y', 85.0511287798066);
    contents[0].should.have.property('srs_id', 4326);

    contents[1].should.have.property('table_name', 'FEATURESriversds');
    contents[1].should.have.property('data_type', 'features');
    contents[1].should.have.property('identifier', 'FEATURESriversds');
    contents[1].should.have.property('description', null);
    contents[1].should.have.property('last_change', '2015-12-04T15:28:59.122Z');
    contents[1].should.have.property('min_x', -20037508.342789244);
    contents[1].should.have.property('min_y', -19971868.88040857);
    contents[1].should.have.property('max_x', 20037508.342789244);
    contents[1].should.have.property('max_y', 19971868.880408563);
    contents[1].should.have.property('srs_id', 3857);
  });

  it('should get the contents from the ID TILESosmds', function(done) {
    var contents = contentsDao.queryForId('TILESosmds');
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

  it('should get the contents from the ID FEATURESriversds', function(done) {
    var contents = contentsDao.queryForId('FEATURESriversds');
    should.exist(contents);
    contents.should.have.property('table_name', 'FEATURESriversds');
    contents.should.have.property('data_type', 'features');
    contents.should.have.property('identifier', 'FEATURESriversds');
    contents.should.have.property('description', null);
    contents.should.have.property('last_change', '2015-12-04T15:28:59.122Z');
    contents.should.have.property('min_x', -20037508.342789244);
    contents.should.have.property('min_y', -19971868.88040857);
    contents.should.have.property('max_x', 20037508.342789244);
    contents.should.have.property('max_y', 19971868.880408563);
    contents.should.have.property('srs_id', 3857);
    done();
  });

  it('should get the projection from the ID TILESosmds', function() {
    var contents = contentsDao.queryForId('TILESosmds');
    should.exist(contents);
    var projection = contentsDao.getProjection(contents);
    should.exist(projection);
  });

  it('should get the projection from the ID FEATURESriversds', function() {
    var contents = contentsDao.queryForId('FEATURESriversds');
    should.exist(contents);
    var projection = contentsDao.getProjection(contents);
    should.exist(projection);
  });

  it('should get the GeometryColumns from the ID TILESosmds', function() {
    var contents = contentsDao.queryForId('TILESosmds');
    should.exist(contents);
    var columns = contentsDao.getGeometryColumns(contents);
    should.not.exist(columns);
  });

  it('should get the GeometryColumns from the ID FEATURESriversds', function() {
    var contents = contentsDao.queryForId('FEATURESriversds');
    should.exist(contents);
    var columns = contentsDao.getGeometryColumns(contents);
    should.exist(columns);
    columns.should.have.property('table_name', 'FEATURESriversds');
    columns.should.have.property('column_name', 'geom');
    columns.should.have.property('geometry_type_name', 'GEOMETRY');
    columns.should.have.property('srs_id', 3857);
    columns.should.have.property('z', 0);
    columns.should.have.property('m', 0);
  });

  it('should get the TileMatrixSet from the ID TILESosmds', function() {
    var contents = contentsDao.queryForId('TILESosmds');
    should.exist(contents);
    var matrixSet = contentsDao.getTileMatrixSet(contents);
    should.exist(matrixSet);
    matrixSet.should.have.property('table_name', 'TILESosmds');
    matrixSet.should.have.property('srs_id', 3857);
    matrixSet.should.have.property('min_x', -20037508.342789244);
    matrixSet.should.have.property('min_y', -20037508.342789244);
    matrixSet.should.have.property('max_x', 20037508.342789244);
    matrixSet.should.have.property('max_y', 20037508.342789244);
  });

  it('should get the TileMatrixSet from the ID FEATURESriversds', function() {
    var contents = contentsDao.queryForId('FEATURESriversds');
    should.exist(contents);
    var matrixSet = contentsDao.getTileMatrixSet(contents);
    should.not.exist(matrixSet);
  });

  it('should get the TileMatrix from the ID TILESosmds', function() {
    var contents = contentsDao.queryForId('TILESosmds');
    should.exist(contents);
    var matrix = contentsDao.getTileMatrix(contents);
    should.exist(matrix);
    matrix.should.have.property('length', 4);

    var tm = new TileMatrix();
    tm.table_name ='TILESosmds';
    tm.zoom_level = 0;
    tm.matrix_width = 1;
    tm.matrix_height = 1;
    tm.tile_width = 256;
    tm.tile_height = 256;
    tm.pixel_x_size = 156543.03392804097;
    tm.pixel_y_size = 156543.033928041;

    matrix[0].should.be.deep.equal(tm);
  });

  it('should get the TileMatrix from the ID FEATURESriversds', function() {
    var contents = contentsDao.queryForId('FEATURESriversds');
    should.exist(contents);
    var matrix = contentsDao.getTileMatrix(contents);
    should.not.exist(matrix);
  });

});
