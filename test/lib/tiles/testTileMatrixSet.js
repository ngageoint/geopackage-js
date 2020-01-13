import { GeoPackage as GeoPackageAPI } from '../../..'

var TileMatrixSetDao = require('../../../lib/tiles/matrixset/tileMatrixSetDao').TileMatrixSetDao
  , TileMatrixSet = require('../../../lib/tiles/matrixset/tileMatrixSet').TileMatrixSet
  , BoundingBox = require('../../../lib/boundingBox').BoundingBox
  , testSetup = require('../../fixtures/testSetup').default
  , should = require('chai').should()
  , path = require('path');

describe('Tile Matrix Set tests', function() {

  var geoPackage;
  var tileMatrixSetDao;
  var filename;

  beforeEach('should open the geopackage', async function() {
    var riversfilename = path.join(__dirname, '..', '..', 'fixtures', 'rivers.gpkg');
    // @ts-ignore
    let result = await copyAndOpenGeopackage(riversfilename);
    filename = result.path;
    geoPackage = result.geopackage;
    tileMatrixSetDao = new TileMatrixSetDao(geoPackage);
  });

  afterEach('should close the geopackage', async function() {
    geoPackage.close();
    await testSetup.deleteGeoPackage(filename);
  });

  it('should get the tile matrixes', function() {
    var tileMatrixSets = tileMatrixSetDao.queryForAll();
    tileMatrixSets.should.have.property('length', 1);
  });

  it('should get the TileMatrixSet from the ID', function() {
    var tileMatrixSet = tileMatrixSetDao.queryForId('TILESosmds');
    should.exist(tileMatrixSet);
    tileMatrixSet.should.have.property('table_name', 'TILESosmds');
    tileMatrixSet.should.have.property('srs_id', 3857);
    tileMatrixSet.should.have.property('min_x', -20037508.342789244);
    tileMatrixSet.should.have.property('min_y', -20037508.342789244);
    tileMatrixSet.should.have.property('max_x', 20037508.342789244);
    tileMatrixSet.should.have.property('max_y', 20037508.342789244);
  });

  it('should get the tile table names from the TileMatrixSet', function() {
    var tableNames = tileMatrixSetDao.getTileTables();
    should.exist(tableNames);
    tableNames.should.have.property('length', 1);
    tableNames[0].should.be.equal('TILESosmds');
  });

  it('should get the projection from the TileMatrixSet', function() {
    var tileMatrixSet = tileMatrixSetDao.queryForId('TILESosmds');
    should.exist(tileMatrixSet);
    var projection = tileMatrixSetDao.getProjection(tileMatrixSet);
    should.exist(projection);
  });

  it('should get the Contents from the TileMatrixSet', function(done) {
    var tileMatrixSet = tileMatrixSetDao.queryForId('TILESosmds');
    should.exist(tileMatrixSet);
    var contents = tileMatrixSetDao.getContents(tileMatrixSet);
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

  it('should get the BoundingBox from the TileMatrixSet', function(done) {
    var tileMatrixSet = tileMatrixSetDao.queryForId('TILESosmds');
    should.exist(tileMatrixSet);
    var bb = tileMatrixSet.getBoundingBox();
    bb.minLongitude.should.be.equal(-20037508.342789244);
    bb.maxLongitude.should.be.equal(20037508.342789244);
    bb.minLatitude.should.be.equal(-20037508.342789244);
    bb.maxLatitude.should.be.equal(20037508.342789244);
    done();
  });

  it('should set the BoundingBox from the TileMatrixSet', function(done) {
    var tileMatrixSet = tileMatrixSetDao.queryForId('TILESosmds');
    should.exist(tileMatrixSet);
    var bb = new BoundingBox(-1, 1, -1, 1);
    tileMatrixSet.setBoundingBox(bb);
    tileMatrixSet.should.have.property('min_x', -1);
    tileMatrixSet.should.have.property('min_y', -1);
    tileMatrixSet.should.have.property('max_x', 1);
    tileMatrixSet.should.have.property('max_y', 1);
    done();
  });

});
