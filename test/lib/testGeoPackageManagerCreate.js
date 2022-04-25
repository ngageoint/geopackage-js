import { default as testSetup } from '../fixtures/testSetup'

var { GeoPackageAPI } = require('../../')
  , should = require('chai').should();

describe('GeoPackageAPI Create tests', function() {

  var testGeoPackage;
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

  it('should not allow a file without a gpkg extension', async function() {
    try {
      let gp = await GeoPackageAPI.create('/tmp/test.g');
      should.fail(gp, null, 'Error should have been thrown')
    } catch (e) {
      should.exist(e);
      return;
    }
    should.fail(false, true, 'Error should have been thrown');
  });

  it('should create the geopackage file', async function() {
    should.exist(geopackage);
    var applicationId = geopackage.getApplicationId();
    var buff = Buffer.alloc(4);
    // @ts-ignore
    buff.writeUInt32BE(applicationId);
    var idString = buff.toString('ascii', 0, 4);
    idString.should.be.equal('GPKG');
  });

});
