import { default as testSetup } from '../../../../testSetup'
import { PropertiesExtension } from "../../../../../lib/extension/nga/properties/propertiesExtension";
import { PropertyNames } from "../../../../../lib/extension/nga/properties/propertyNames";

var should = require('chai').should()
  , assert = require('chai').assert
  , path = require('path');

function generateUUID() { // Public Domain/MIT
  var d = new Date().getTime();//Timestamp
  var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16;//random number between 0 and 16
    if(d > 0){//Use timestamp until depleted
      r = (d + r)%16 | 0;
      d = Math.floor(d/16);
    } else {//Use microseconds since page-load if supported
      r = (d2 + r)%16 | 0;
      d2 = Math.floor(d2/16);
    }
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function testPropertyName(extension, property) {
  assert.isFalse(extension.hasProperty(property));
  let count = 1;
  if (Math.random() < .5) {
    count = 1 + Math.round(10 * Math.random());
  }
  const values = [];
  for (let i = 0; i < count; i++) {
    const value = generateUUID().toString();
    values.push(value);
    extension.addValue(property, value);
  }
  assert.isTrue(extension.hasProperty(property));
  extension.numValuesForProperty(property).should.be.equal(count);
  assert.isTrue(count !== 1 || extension.hasSingleValue(property));
  assert.isTrue(extension.hasValues(property));

  const propertyValues = extension.getValues(property);
  values.length.should.be.equal(propertyValues.length);
  for (const value of propertyValues) {
    assert.isTrue(values.indexOf(value) > -1);
    assert.isTrue(extension.hasValue(property, value));
  }
  return count;
}

describe('Properties Extension Tests', function() {

  describe('Test Properties Extension Import', function() {
    var geoPackage;

    var originalFilename = path.join(__dirname, '..', '..', '..', '..', 'fixtures', 'import_db.gpkg');
    var filename;

    beforeEach('should open the geoPackage', async function() {
      // @ts-ignore
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geoPackage;
    });

    afterEach('should close the geoPackage', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should test properties extension', function() {
      const extension = new PropertiesExtension(geoPackage);
      geoPackage.getExtensionManager().deleteExtensions();
      assert.isFalse(extension.has());
      assert.isFalse(geoPackage.isTable(PropertiesExtension.TABLE_NAME));

      const name = "My GeoPackage";

      // Test before the extension exists
      assert.isTrue(0 === extension.numProperties());
      assert.isTrue(extension.getProperties().length === 0);
      assert.isFalse(extension.hasProperty(PropertyNames.TITLE));
      assert.isTrue(0 === extension.numValues());
      assert.isTrue(0 === extension.numValuesForProperty(PropertyNames.TITLE));
      assert.isFalse(extension.hasSingleValue(PropertyNames.TITLE));
      assert.isFalse(extension.hasValues(PropertyNames.TITLE));
      assert.isNull(extension.getValue(PropertyNames.TITLE));
      assert.isTrue(extension.getValues(PropertyNames.TITLE).length === 0);
      assert.isFalse(extension.hasValue(PropertyNames.TITLE, name));
      assert.isTrue(0 === extension.deleteProperty(PropertyNames.TITLE));
      assert.isTrue(0 === extension.deleteValue(PropertyNames.TITLE, name));
      assert.isTrue(0 === extension.deleteAll());

      extension.removeExtension();

      const extensions = extension.getOrCreate();
      assert.isNotNull(extensions);
      assert.isTrue(extension.has());
      assert.isTrue(geoPackage.isTable(PropertiesExtension.TABLE_NAME));

      assert.isTrue(0 === extension.numProperties());
      assert.isTrue(extension.getProperties().length === 0);
      assert.isTrue(0 === extension.numValues());
      assert.isTrue(extension.getValues(PropertyNames.TITLE).length === 0);
      assert.isFalse(extension.hasSingleValue(PropertyNames.TITLE));
      assert.isFalse(extension.hasValues(PropertyNames.TITLE));
      assert.isTrue(0 === extension.numValuesForProperty(PropertyNames.TITLE));

      assert.isTrue(extension.addValue(PropertyNames.TITLE, name));
      assert.isTrue(1 === extension.numProperties());
      assert.isTrue(1 === extension.getProperties().length);
      assert.isTrue(1 === extension.numValues());
      assert.isTrue(1 === extension.getValues(PropertyNames.TITLE).length);
      assert.isTrue(extension.hasSingleValue(PropertyNames.TITLE));
      assert.isTrue(extension.hasValues(PropertyNames.TITLE));
      assert.isTrue(1 === extension.numValuesForProperty(PropertyNames.TITLE));
      assert.isTrue(name === extension.getValue(PropertyNames.TITLE));
      assert.isTrue(extension.hasValue(PropertyNames.TITLE, name));

      const tag = "TAG";
      assert.isTrue(extension.addValue(PropertyNames.TAG, tag + 1));
      assert.isTrue(2 === extension.numProperties());
      assert.isTrue(2 === extension.getProperties().length);
      assert.isTrue(2 === extension.numValues());
      assert.isTrue(1 === extension.getValues(PropertyNames.TAG).length);
      assert.isTrue(extension.hasSingleValue(PropertyNames.TAG));
      assert.isTrue(extension.hasValues(PropertyNames.TAG));
      assert.isTrue(1 === extension.numValuesForProperty(PropertyNames.TAG));
      assert.isTrue(extension.hasValue(PropertyNames.TAG, tag + 1));

      assert.isTrue(extension.addValue(PropertyNames.TAG, tag + 2));
      assert.isTrue(2 === extension.numProperties());
      assert.isTrue(2 === extension.getProperties().length);
      assert.isTrue(3 === extension.numValues());
      assert.isTrue(2 === extension.getValues(PropertyNames.TAG).length);
      assert.isFalse(extension.hasSingleValue(PropertyNames.TAG));
      assert.isTrue(extension.hasValues(PropertyNames.TAG));
      assert.isTrue(2 === extension.numValuesForProperty(PropertyNames.TAG));
      assert.isTrue(extension.hasValue(PropertyNames.TAG, tag + 2));

      assert.isTrue(extension.addValue(PropertyNames.TAG, tag + 3));
      assert.isTrue(extension.addValue(PropertyNames.TAG, tag + 4));
      assert.isFalse(extension.addValue(PropertyNames.TAG, tag + 4));

      const values = extension.getValues(PropertyNames.TAG);
      for (let i = 1; i <= 4; i++) {
        assert.isTrue(values.indexOf(tag + i) > -1);
        assert.isTrue(extension.hasValue(PropertyNames.TAG, tag + i));
      }

      assert.isTrue(1 === extension.deleteValue(PropertyNames.TAG, tag + 3));
      assert.isTrue(3 === extension.getValues(PropertyNames.TAG).length);
      assert.isTrue(3 === extension.numValuesForProperty(PropertyNames.TAG));
      assert.isFalse(extension.hasValue(PropertyNames.TAG, tag + 3));

      assert.isTrue(3 === extension.deleteProperty(PropertyNames.TAG));
      assert.isTrue(1 === extension.numProperties());
      assert.isTrue(1 === extension.getProperties().length);
      assert.isTrue(1 === extension.numValues());
      assert.isTrue(extension.getValues(PropertyNames.TAG).length === 0);
      assert.isFalse(extension.hasSingleValue(PropertyNames.TAG));
      assert.isFalse(extension.hasValues(PropertyNames.TAG));
      assert.isTrue(0 === extension.numValuesForProperty(PropertyNames.TAG));

      extension.removeExtension();
      assert.isFalse(extension.has());
      assert.isFalse(geoPackage.isTable(PropertiesExtension.TABLE_NAME));

    });

    it('test property names', function() {
     try {
       geoPackage.getExtensionManager().deleteExtensions();

       const extension = new PropertiesExtension(geoPackage);

       let count = 0;

       count += testPropertyName(extension, PropertyNames.CONTRIBUTOR);
       count += testPropertyName(extension, PropertyNames.COVERAGE);
       count += testPropertyName(extension, PropertyNames.CREATED);
       count += testPropertyName(extension, PropertyNames.CREATOR);
       count += testPropertyName(extension, PropertyNames.DATE);
       count += testPropertyName(extension, PropertyNames.DESCRIPTION);
       count += testPropertyName(extension, PropertyNames.IDENTIFIER);
       count += testPropertyName(extension, PropertyNames.LICENSE);
       count += testPropertyName(extension, PropertyNames.MODIFIED);
       count += testPropertyName(extension, PropertyNames.PUBLISHER);
       count += testPropertyName(extension, PropertyNames.REFERENCES);
       count += testPropertyName(extension, PropertyNames.RELATION);
       count += testPropertyName(extension, PropertyNames.SOURCE);
       count += testPropertyName(extension, PropertyNames.SPATIAL);
       count += testPropertyName(extension, PropertyNames.SUBJECT);
       count += testPropertyName(extension, PropertyNames.TAG);
       count += testPropertyName(extension, PropertyNames.TEMPORAL);
       count += testPropertyName(extension, PropertyNames.TITLE);
       count += testPropertyName(extension, PropertyNames.TYPE);
       count += testPropertyName(extension, PropertyNames.URI);
       count += testPropertyName(extension, PropertyNames.VALID);
       count += testPropertyName(extension, PropertyNames.VERSION);

       assert.isTrue(22 === extension.numProperties());
       assert.isTrue(count === extension.numValues());

       let deleted = 0;
       for (const property of extension.getProperties()) {
         deleted += extension.deleteProperty(property);
       }
       assert.isTrue(count === deleted);
       assert.isTrue(0 === extension.numProperties());
       assert.isTrue(0 === extension.numValues());

       extension.removeExtension();
       assert.isFalse(extension.has());
     } catch (e) {
       console.error(e);
     }
    });
  });
});
