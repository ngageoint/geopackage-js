var GeoPackageAPI = require('../../../..')
  , ContentsDao = require('../../../../lib/core/contents/contentsDao')
  , Contents = require('../../../../lib/core/contents/contents')
  , TileMatrix = require('../../../../lib/tiles/matrix/tileMatrix')
  , testSetup = require('../../../fixtures/testSetup')
  , should = require('chai').should()
  , path = require('path');

describe('Contents tests', function() {

  var geoPackage;
  var contentsDao;
  var filename;

  function copyGeopackage(orignal, copy, callback) {
    if (typeof(process) !== 'undefined' && process.version) {
      var fsExtra = require('fs-extra');
      fsExtra.copy(orignal, copy, callback);
    } else {
      filename = orignal;
      callback();
    }
  }

  beforeEach('should open the geopackage', function(done) {
    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers.gpkg');
    filename = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp', testSetup.createTempName());
    copyGeopackage(originalFilename, filename, function() {
      GeoPackageAPI.open(filename, function(err, gp) {
        geoPackage = gp;
        should.not.exist(err);
        should.exist(gp);
        should.exist(gp.getDatabase().getDBConnection());
        gp.getPath().should.be.equal(filename);
        contentsDao = new ContentsDao(gp);
        done();
      });
    });
  });

  afterEach('should close the geopackage', function(done) {
    geoPackage.close();
    testSetup.deleteGeoPackage(filename, done);
  });

  it('should create a new contents entry', function() {
    var contentsDao = geoPackage.getContentsDao();
    var contents = contentsDao.createObject();
    contents.table_name = 'testit';
    contents.data_type = ContentsDao.GPKG_CDT_FEATURES_NAME;
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
