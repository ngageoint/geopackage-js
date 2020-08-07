import { default as testSetup } from '../../fixtures/testSetup'

var GeoPackageConnection = require('../../../lib/db/geoPackageConnection')
  , GeoPackage = require('../../../lib/geoPackage')
  , Verification = require('../../fixtures/verification')
  , should = require('chai').should()
  , path = require('path');

describe('GeoPackage Extension Dao tests', function() {
  var testGeoPackage;
  var tableName = 'test_features.test';
  var geopackage;

  beforeEach(async function() {
    let created = await testSetup.createTmpGeoPackage();
    testGeoPackage = created.path;
    geopackage = created.geopackage;
  });

  afterEach(async function() {
    geopackage.close();
    await testSetup.deleteGeoPackage(testGeoPackage);
  });

  it('should create an extensions table', function() {
    var extensionDao = geopackage.extensionDao;
    return extensionDao.createTable()
    .then(function(result) {
      var verified = Verification.verifyExtensions(geopackage);
      verified.should.be.equal(true);
    });
  });

});
