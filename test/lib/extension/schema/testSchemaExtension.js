import { default as testSetup } from '../../../testSetup';

var SchemaExtension = require('../../../../lib/extension/schema/schemaExtension').SchemaExtension;

describe('GeoPackage Schema Extension tests', function () {
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

  it('should have the extension', function () {
    geoPackage.create;
    var schemaExtension = new SchemaExtension(geoPackage);
    schemaExtension.has().should.be.equal(false);
    schemaExtension.getOrCreateExtension();
    schemaExtension.has().should.be.equal(true);
  });

  it('should remove the extension', function () {
    var schemaExtension = new SchemaExtension(geoPackage);
    schemaExtension.getOrCreateExtension();
    geoPackage.createDataColumns();
    geoPackage.createDataColumnConstraintsTable();
    schemaExtension.has().should.be.equal(true);
    schemaExtension.removeExtension();
    schemaExtension.has().should.be.equal(false);
    schemaExtension.removeExtension();
    schemaExtension.has().should.be.equal(false);
  });
});
