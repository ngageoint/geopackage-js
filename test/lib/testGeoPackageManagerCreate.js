var GeoPackageAPI = require('../..')
  , testSetup = require('../fixtures/testSetup')
  , should = require('chai').should()
  , path = require('path');

describe('GeoPackageAPI Create tests', function() {

  var testGeoPackage;
  var testPath = path.join(__dirname, '..', 'tmp');
  var geopackage;

  beforeEach(function(done) {
    testGeoPackage = path.join(testPath, testSetup.createTempName());
    testSetup.createGeoPackage(testGeoPackage, function(err, gp) {
      geopackage = gp;
      done();
    });
  });

  afterEach(function(done) {
    geopackage.close();
    testSetup.deleteGeoPackage(testGeoPackage, done);
  });

  it('should not allow a file without a gpkg extension', function(done) {
    GeoPackageAPI.create('/tmp/test.g', function(err, geopackage) {
      should.exist(err);
      should.not.exist(geopackage);
      done();
    });
  });

  it('should create the geopackage file', function(done) {
    GeoPackageAPI.create(testGeoPackage, function(err, geopackage) {
      should.not.exist(err);
      should.exist(geopackage);
      var applicationId = geopackage.getApplicationId();
      var buff = new Buffer(4);
      buff.writeUInt32BE(applicationId);
      var idString = buff.toString('ascii', 0, 4);
      idString.should.be.equal('GPKG');
      done();
    });
  });

});
