var GeoPackageManager = require('../../../lib/geoPackageManager')
  , SpatialReferenceSystemDao = require('../../../lib/dao/spatialReferenceSystem').SpatialReferenceSystemDao
  , should = require('chai').should()
  , path = require('path');

describe('SpatialReferenceSystem tests', function() {

  var geoPackage;

  beforeEach('should open the geopackage', function(done) {
    var filename = path.join(__dirname, '..', '..', 'fixtures', 'gdal_sample.gpkg');
    GeoPackageManager.open(filename, function(err, gp) {
      geoPackage = gp;
      should.not.exist(err);
      should.exist(gp);
      gp.getDatabase().open.should.be.equal(true);
      gp.getPath().should.be.equal(filename);
      done();
    });
  });

  it('should get the 4326 SRS', function(done) {
    geoPackage.getSpatialReferenceSystemDao().getBySrsId(4326, function(err, srs) {
      should.not.exist(err);
      should.exist(srs);
      done();
    });
  });

});
