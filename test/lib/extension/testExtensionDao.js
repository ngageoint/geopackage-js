import { default as testSetup } from '../../testSetup';

var Verification = require('../../verification');
describe('GeoPackage Extension Dao tests', function () {
  var testGeoPackage;
  var geoPackage;

  beforeEach(async function () {
    let created = await testSetup.createTmpGeoPackage();
    testGeoPackage = created.path;
    geoPackage = created.geoPackage;
  });

  afterEach(async function () {
    geoPackage.close();
    await testSetup.deleteGeoPackage(testGeoPackage);
  });

  it('should create an extensions table', function () {
    geoPackage.createExtensionsTable();
    var verified = Verification.verifyExtensions(geoPackage);
    verified.should.be.equal(true);
  });
});
