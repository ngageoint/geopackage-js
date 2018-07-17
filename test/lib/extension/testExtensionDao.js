var GeoPackageConnection = require('../../../lib/db/geoPackageConnection')
  , GeoPackage = require('../../../lib/geoPackage')
  , Verification = require('../../fixtures/verification')
  , testSetup = require('../../fixtures/testSetup')
  , should = require('chai').should()
  , path = require('path')
  , async = require('async');

describe('GeoPackage Extension Dao tests', function() {
  var testGeoPackage;
  var testPath = path.join(__dirname, '..', 'tmp');
  var tableName = 'test_features.test';
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

  it('should create an extensions table', function() {
    var extensionDao = geopackage.getExtensionDao();
    return extensionDao.createTable()
    .then(function(result) {
      var verified = Verification.verifyExtensions(geopackage);
      verified.should.be.equal(true);
    });
  });

});
