var GeoPackageManager = require('../../lib/geoPackageManager')
  , should = require('chai').should()
  , path = require('path')
  , fs = require('fs');

describe('GeoPackageManager Create tests', function() {

  var testGeoPackage = path.join('/tmp', 'test.gpkg');

  beforeEach(function(done) {
    fs.unlink(testGeoPackage, function() {
      done();
    });
  });

  it('should not allow a file without a gpkg extension', function(done) {
    GeoPackageManager.create('/tmp/test.g', function(err, geopackage) {
      should.exist(err);
      should.not.exist(geopackage);
      done();
    });
  });

  it('should create the geopackage file', function(done) {
    fs.closeSync(fs.openSync(testGeoPackage, 'w'));
    GeoPackageManager.create(testGeoPackage, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getApplicationId(function(err, applicationId) {
        var buff = new Buffer(4);
        buff.writeUInt32BE(applicationId);
        var idString = buff.toString('ascii', 0, 4);
        idString.should.be.equal('GP10');
        done();
      });
    });
  });

});
