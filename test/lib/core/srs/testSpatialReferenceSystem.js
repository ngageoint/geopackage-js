var GeoPackageManager = require('../../../../lib/geoPackageManager')
  , SpatialReferenceSystemDao = require('../../../../lib/core/srs').SpatialReferenceSystemDao
  , should = require('chai').should()
  , path = require('path');

describe('SpatialReferenceSystem tests', function() {

  var geoPackage;

  beforeEach('should open the geopackage', function(done) {
    var filename = path.join(__dirname, '..', '..', '..', 'fixtures', 'gdal_sample.gpkg');
    GeoPackageManager.open(filename, function(err, gp) {
      geoPackage = gp;
      should.not.exist(err);
      should.exist(gp);
      should.exist(gp.getDatabase().getDBConnection());
      gp.getPath().should.be.equal(filename);
      done();
    });
  });

  it('should get the 4326 SRS', function(done) {
    geoPackage.getSpatialReferenceSystemDao().getBySrsId(4326, function(err, srs) {
      should.exist(srs);
      srs.should.have.property('srsName')
      srs.should.have.property('srsId');
      srs.should.have.property('organization');
      srs.should.have.property('organizationCoordsysId', 4326);
      srs.should.have.property('definition');
      should.not.exist(err);
      done();
    });
  });

  it('should get the 0 SRS', function(done) {
    geoPackage.getSpatialReferenceSystemDao().getBySrsId(0, function(err, srs) {
      should.not.exist(err);
      should.exist(srs);
      srs.should.have.property('srsName')
      srs.should.have.property('srsId');
      srs.should.have.property('organization');
      srs.should.have.property('organizationCoordsysId', 0);
      srs.should.have.property('definition');
      done();
    });
  });

  it('should fail to get an SRS that does not exist', function(done) {
    geoPackage.getSpatialReferenceSystemDao().getBySrsId(-2, function(err, srs) {
      should.not.exist(err);
      should.not.exist(srs);
      done();
    });
  });

  it('should get all defined SRS', function(done) {
    geoPackage.getSpatialReferenceSystemDao().queryForAll(function(err, srs) {
      should.not.exist(err);
      should.exist(srs);
      srs.should.have.property('length', 4);
      done();
    });
  });

  it('should get the 4326 SRS', function(done) {
    geoPackage.getSpatialReferenceSystemDao().getBySrsId(4326, function(err, srs) {
      should.exist(srs);
      var projection = geoPackage.getSpatialReferenceSystemDao().getProjection(srs);
      should.exist(projection);
      done();
    });
  });

});
