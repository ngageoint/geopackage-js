var GeoPackageManager = require('../../lib/geoPackageManager')
  , testSetup = require('../fixtures/testSetup')
  , should = require('chai').should()
  , path = require('path');

describe('GeoPackageManager Create tests', function() {

  var testGeoPackage = path.join(__dirname, '..', 'tmp', 'test.gpkg');
  var geopackage;

  beforeEach(function(done) {
    testSetup.deleteGeoPackage(testGeoPackage, function() {
      testSetup.createGeoPackage(testGeoPackage, function(err, gp) {
        geopackage = gp;
        done();
      });
    });
  });

  afterEach(function(done) {
    geopackage.close();
    testSetup.deleteGeoPackage(testGeoPackage, done);
  });

  it('should not allow a file without a gpkg extension', function(done) {
    GeoPackageManager.create('/tmp/test.g', function(err, geopackage) {
      should.exist(err);
      should.not.exist(geopackage);
      done();
    });
  });

  it('should create the geopackage file', function(done) {
    GeoPackageManager.create(testGeoPackage, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      geopackage.getApplicationId(function(err, applicationId) {
        var buff = new Buffer(4);
        buff.writeUInt32BE(applicationId);
        var idString = buff.toString('ascii', 0, 4);
        idString.should.be.equal('GPKG');
        done();
      });
    });
  });

});
