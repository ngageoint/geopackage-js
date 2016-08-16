var GeoPackageManager = require('../../../lib/geoPackageManager')
  , TileMatrixSetDao = require('../../../lib/tiles/matrixset').TileMatrixSetDao
  , TileMatrixSet = require('../../../lib/tiles/matrixset').TileMatrixSet
  , BoundingBox = require('../../../lib/boundingBox')
  , should = require('chai').should()
  , path = require('path');

describe('Tile Matrix Set tests', function() {

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
      tileMatrixSetDao = new TileMatrixSetDao(gp.getDatabase());
      done();
    });
  });

  afterEach('should close the geopackage', function() {
    geoPackage.close();
  });

  it('should get the tile matrixes', function(done) {
    tileMatrixSetDao.queryForAll(function(err, tileMatrixSets) {
      tileMatrixSets.should.have.property('length', 1);
      done();
    })
  });

  it('should get the TileMatrixSet from the ID', function(done) {
    tileMatrixSetDao.queryForIdObject('TILESosmds', function(err, tileMatrixSet) {
      should.not.exist(err);
      should.exist(tileMatrixSet);
      tileMatrixSet.should.have.property('table_name', 'TILESosmds');
      tileMatrixSet.should.have.property('srs_id', 3857);
      tileMatrixSet.should.have.property('min_x', -20037508.342789244);
      tileMatrixSet.should.have.property('min_y', -20037508.342789244);
      tileMatrixSet.should.have.property('max_x', 20037508.342789244);
      tileMatrixSet.should.have.property('max_y', 20037508.342789244);
      done();
    });
  });

  it('should get the tile table names from the TileMatrixSet', function(done) {
    tileMatrixSetDao.getTileTables(function(err, tableNames) {
      should.not.exist(err);
      should.exist(tableNames);
      tableNames.should.have.property('length', 1);
      tableNames[0].should.be.equal('TILESosmds');
      done();
    });
  });

  it('should get the projection from the TileMatrixSet', function(done) {
    tileMatrixSetDao.queryForIdObject('TILESosmds', function(err, tileMatrixSet) {
      should.not.exist(err);
      should.exist(tileMatrixSet);
      tileMatrixSetDao.getProjection(tileMatrixSet, function(err, projection) {
        should.exist(projection);
        should.not.exist(err);
        done();
      });
    });
  });

  it('should get the Contents from the TileMatrixSet', function(done) {
    tileMatrixSetDao.queryForIdObject('TILESosmds', function(err, tileMatrixSet) {
      should.not.exist(err);
      should.exist(tileMatrixSet);
      tileMatrixSetDao.getContents(tileMatrixSet, function(err, contents) {
        should.exist(contents);
        should.not.exist(err);
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

  it('should get the BoundingBox from the TileMatrixSet', function(done) {
    tileMatrixSetDao.queryForIdObject('TILESosmds', function(err, tileMatrixSet) {
      should.not.exist(err);
      should.exist(tileMatrixSet);
      var bb = tileMatrixSet.getBoundingBox();
      bb.minLongitude.should.be.equal(-20037508.342789244);
      bb.maxLongitude.should.be.equal(20037508.342789244);
      bb.minLatitude.should.be.equal(-20037508.342789244);
      bb.maxLatitude.should.be.equal(20037508.342789244);
      done();
    });
  });

  it('should set the BoundingBox from the TileMatrixSet', function(done) {
    tileMatrixSetDao.queryForIdObject('TILESosmds', function(err, tileMatrixSet) {
      should.not.exist(err);
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

});
