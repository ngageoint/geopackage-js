import { default as testSetup } from '../../../fixtures/testSetup'

var SchemaExtension = require('../../../../lib/extension/schema').SchemaExtension;

describe('GeoPackage Schema Extension tests', function() {
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

  it('should have the extension', function() {
    var schemaExtension = new SchemaExtension(geopackage);
    schemaExtension.has().should.be.equal(true);
  });

  it('should remove the extension', function() {
    var schemaExtension = new SchemaExtension(geopackage);
    geopackage.createDataColumns();
    geopackage.createDataColumnConstraintsTable();
    schemaExtension.has().should.be.equal(true);
    schemaExtension.removeExtension();
    schemaExtension.has().should.be.equal(false);
    schemaExtension.removeExtension();
    schemaExtension.has().should.be.equal(false);
  });

});
