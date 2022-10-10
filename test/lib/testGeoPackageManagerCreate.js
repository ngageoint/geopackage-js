import { default as testSetup } from '../testSetup'

var { GeoPackageManager } = require('../../')
  , should = require('chai').should();

describe('GeoPackageManager Create tests', function() {

  var testGeoPackage;
  var geoPackage;

  beforeEach(async function() {
    let created = await testSetup.createTmpGeoPackage();
    testGeoPackage = created.path;
    geoPackage = created.geoPackage;
  });

  afterEach(async function() {
    geoPackage.close();
    await testSetup.deleteGeoPackage(testGeoPackage);
  });

  it('should not allow a file without a gpkg extension', async function() {
    try {
      let gp = await GeoPackageManager.create('/tmp/test.g');
      should.fail(gp, null, 'Error should have been thrown')
    } catch (e) {
      should.exist(e);
      return;
    }
    should.fail(false, true, 'Error should have been thrown');
  });

  it('should create the geoPackage file', async function() {
    should.exist(geoPackage);
    var applicationId = geoPackage.getApplicationId();
    var buff = Buffer.alloc(4);
    // @ts-ignore
    buff.writeUInt32BE(applicationId);
    var idString = buff.toString('ascii', 0, 4);
    idString.should.be.equal('GPKG');
  });

});
