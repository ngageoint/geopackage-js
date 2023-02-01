const should = require('chai').should();
const assert = require('chai').assert;
const path = require('path');
const testSetup = require('../../../../testSetup').default;
const PropertiesExtension =
  require('../../../../../lib/extension/nga/properties/propertiesExtension').PropertiesExtension;
const GeoPackageManager = require('../../../../../lib/geoPackageManager').GeoPackageManager;
const PropertiesManager = require('../../../../../lib/extension/nga/properties/propertiesManager').PropertiesManager;
const PropertyNames = require('../../../../../lib/extension/nga/properties/propertyNames').PropertyNames;

describe('GeoPackage Properties Manager tests', function () {
  const GEOPACKAGE_COUNT = 12;
  const GEOPACKAGE_WITH_PROPERTIES_COUNT = 10;
  const GEOPACKAGE_WITHOUT_PROPERTIES_COUNT = GEOPACKAGE_COUNT - GEOPACKAGE_WITH_PROPERTIES_COUNT;
  const GEOPACKAGE_FILE_NAME = 'GeoPackage';
  const GEOPACKAGE_NAME = 'Name';
  const CREATOR = 'NGA';
  const EVEN_PROPERTY = 'even';
  const ODD_PROPERTY = 'odd';
  const COLOR_RED = 'Red';
  const COLOR_RED_FREQUENCY = 2;
  const COLOR_RED_COUNT = getCount(COLOR_RED_FREQUENCY);
  const COLOR_GREEN = 'Green';
  const COLOR_GREEN_FREQUENCY = 3;
  const COLOR_GREEN_COUNT = getCount(COLOR_GREEN_FREQUENCY);
  const COLOR_BLUE = 'Blue';
  const COLOR_BLUE_FREQUENCY = 4;
  const COLOR_BLUE_COUNT = getCount(COLOR_BLUE_FREQUENCY);

  function getCount(frequency) {
    return Math.ceil(GEOPACKAGE_WITH_PROPERTIES_COUNT / frequency);
  }

  async function createGeoPackages() {
    const geoPackages = [];

    for (let i = 0; i < GEOPACKAGE_COUNT; i++) {
      var tmpGpPath = path.join(__dirname, 'tmp', GEOPACKAGE_FILE_NAME + i + '.gpkg');
      const name = GEOPACKAGE_NAME + (i + 1);

      var geoPackage = await testSetup.createGeoPackage(tmpGpPath, name).catch(() => {
        should.fail('Failed to create GeoPackage');
      });
      if (i < GEOPACKAGE_WITH_PROPERTIES_COUNT) {
        addProperties(geoPackage, i);
      }
      geoPackages.push(geoPackage);
    }

    return geoPackages;
  }

  function addProperties(geoPackage, i) {
    const properties = new PropertiesExtension(geoPackage);
    properties.addValue(PropertyNames.TITLE, GEOPACKAGE_NAME + (i + 1));
    properties.addValue(PropertyNames.IDENTIFIER, i.toString());
    properties.addValue(EVEN_PROPERTY, i % 2 === 0 ? 'true' : 'false');
    if (i % 2 === 1) {
      properties.addValue(ODD_PROPERTY, 'true');
    }
    if (i % COLOR_RED_FREQUENCY === 0) {
      properties.addValue(PropertyNames.TAG, COLOR_RED);
    }
    if (i % COLOR_GREEN_FREQUENCY === 0) {
      properties.addValue(PropertyNames.TAG, COLOR_GREEN);
    }
    if (i % COLOR_BLUE_FREQUENCY === 0) {
      properties.addValue(PropertyNames.TAG, COLOR_BLUE);
    }
  }

  function assertEquals(a, b) {
    a.should.be.equal(b);
  }

  function testPropertiesManager(manager) {
    let numProperties = 5;
    let numTagged = 7;

    // getNames
    const names = manager.getGeoPackageNames();
    names.length.should.be.equal(GEOPACKAGE_COUNT);
    for (let i = 1; i <= names.length; i++) {
      const name = GEOPACKAGE_NAME + i;
      (names.indexOf(name) > -1).should.be.true;
      should.exist(manager.getGeoPackage(name));
    }
    manager.numGeoPackages().should.be.equal(GEOPACKAGE_COUNT);

    // numProperties
    numProperties.should.be.equal(manager.numProperties());

    // getProperties
    let properties = manager.getProperties();
    assertEquals(numProperties, properties.length);
    (properties.indexOf(PropertyNames.TITLE) > -1).should.be.true;
    (properties.indexOf(PropertyNames.IDENTIFIER) > -1).should.be.true;
    (properties.indexOf(EVEN_PROPERTY) > -1).should.be.true;
    (properties.indexOf(ODD_PROPERTY) > -1).should.be.true;
    (properties.indexOf(PropertyNames.TAG) > -1).should.be.true;

    // hasProperty
    assertEquals(GEOPACKAGE_WITH_PROPERTIES_COUNT, manager.hasProperty(PropertyNames.TITLE).length);
    assertEquals(GEOPACKAGE_WITH_PROPERTIES_COUNT, manager.hasProperty(PropertyNames.IDENTIFIER).length);
    assertEquals(GEOPACKAGE_WITH_PROPERTIES_COUNT, manager.hasProperty(EVEN_PROPERTY).length);
    assertEquals(GEOPACKAGE_WITH_PROPERTIES_COUNT / 2, manager.hasProperty(ODD_PROPERTY).length);
    assertEquals(numTagged, manager.hasProperty(PropertyNames.TAG).length);

    // missingProperty
    assertEquals(GEOPACKAGE_WITHOUT_PROPERTIES_COUNT, manager.missingProperty(PropertyNames.TITLE).length);
    assertEquals(GEOPACKAGE_WITHOUT_PROPERTIES_COUNT, manager.missingProperty(PropertyNames.IDENTIFIER).length);
    assertEquals(GEOPACKAGE_WITHOUT_PROPERTIES_COUNT, manager.missingProperty(EVEN_PROPERTY).length);
    assertEquals(
      GEOPACKAGE_WITHOUT_PROPERTIES_COUNT + GEOPACKAGE_WITH_PROPERTIES_COUNT / 2,
      manager.missingProperty(ODD_PROPERTY).length,
    );
    assertEquals(
      GEOPACKAGE_WITHOUT_PROPERTIES_COUNT + (GEOPACKAGE_WITH_PROPERTIES_COUNT - numTagged),
      manager.missingProperty(PropertyNames.TAG).length,
    );

    // numValues
    assertEquals(GEOPACKAGE_WITH_PROPERTIES_COUNT, manager.numValues(PropertyNames.TITLE));
    assertEquals(GEOPACKAGE_WITH_PROPERTIES_COUNT, manager.numValues(PropertyNames.IDENTIFIER));
    assertEquals(2, manager.numValues(EVEN_PROPERTY));
    assertEquals(1, manager.numValues(ODD_PROPERTY));
    assertEquals(3, manager.numValues(PropertyNames.TAG));
    assertEquals(0, manager.numValues(PropertyNames.CREATOR));

    // hasValues
    manager.hasValues(PropertyNames.TITLE).should.be.true;
    manager.hasValues(PropertyNames.IDENTIFIER).should.be.true;
    manager.hasValues(EVEN_PROPERTY).should.be.true;
    manager.hasValues(ODD_PROPERTY).should.be.true;
    manager.hasValues(PropertyNames.TAG).should.be.true;
    assert.isFalse(manager.hasValues(PropertyNames.CREATOR));

    // getValues
    let titles = manager.getValues(PropertyNames.TITLE);
    let identifiers = manager.getValues(PropertyNames.IDENTIFIER);
    for (let i = 0; i < GEOPACKAGE_WITH_PROPERTIES_COUNT; i++) {
      (titles.indexOf(GEOPACKAGE_NAME + (i + 1)) > -1).should.be.true;
      (identifiers.indexOf(i.toString()) > -1).should.be.true;
    }
    let evenValues = manager.getValues(EVEN_PROPERTY);
    (evenValues.indexOf('true') > -1).should.be.true;
    (evenValues.indexOf('false') > -1).should.be.true;
    let oddValues = manager.getValues(ODD_PROPERTY);
    (oddValues.indexOf('true') > -1).should.be.true;
    let tags = manager.getValues(PropertyNames.TAG);
    (tags.indexOf(COLOR_RED) > -1).should.be.true;
    (tags.indexOf(COLOR_GREEN) > -1).should.be.true;
    (tags.indexOf(COLOR_BLUE) > -1).should.be.true;
    (manager.getValues(PropertyNames.CREATOR).length === 0).should.be.true;

    // hasValue
    for (let i = 0; i < GEOPACKAGE_WITH_PROPERTIES_COUNT; i++) {
      assertEquals(1, manager.hasValue(PropertyNames.TITLE, GEOPACKAGE_NAME + (i + 1)).length);
      assertEquals(1, manager.hasValue(PropertyNames.IDENTIFIER, i.toString()).length);
    }
    assertEquals(
      0,
      manager.hasValue(PropertyNames.TITLE, GEOPACKAGE_NAME + (GEOPACKAGE_WITH_PROPERTIES_COUNT + 1)).length,
    );
    assertEquals(0, manager.hasValue(PropertyNames.IDENTIFIER, GEOPACKAGE_WITH_PROPERTIES_COUNT.toString()).length);
    assertEquals(GEOPACKAGE_WITH_PROPERTIES_COUNT / 2, manager.hasValue(EVEN_PROPERTY, 'true').length);
    assertEquals(GEOPACKAGE_WITH_PROPERTIES_COUNT / 2, manager.hasValue(EVEN_PROPERTY, 'false').length);
    assertEquals(GEOPACKAGE_WITH_PROPERTIES_COUNT / 2, manager.hasValue(ODD_PROPERTY, 'true').length);
    assertEquals(0, manager.hasValue(ODD_PROPERTY, 'false').length);
    assertEquals(COLOR_RED_COUNT, manager.hasValue(PropertyNames.TAG, COLOR_RED).length);
    assertEquals(COLOR_GREEN_COUNT, manager.hasValue(PropertyNames.TAG, COLOR_GREEN).length);
    assertEquals(COLOR_BLUE_COUNT, manager.hasValue(PropertyNames.TAG, COLOR_BLUE).length);
    assertEquals(0, manager.hasValue(PropertyNames.TAG, 'Yellow').length);
    assertEquals(0, manager.hasValue(PropertyNames.CREATOR, CREATOR).length);

    // missingValue
    assertEquals(
      GEOPACKAGE_WITHOUT_PROPERTIES_COUNT + GEOPACKAGE_WITH_PROPERTIES_COUNT / 2,
      manager.missingValue(EVEN_PROPERTY, 'true').length,
    );
    assertEquals(
      GEOPACKAGE_WITHOUT_PROPERTIES_COUNT + GEOPACKAGE_WITH_PROPERTIES_COUNT / 2,
      manager.missingValue(EVEN_PROPERTY, 'false').length,
    );
    assertEquals(
      GEOPACKAGE_WITHOUT_PROPERTIES_COUNT + GEOPACKAGE_WITH_PROPERTIES_COUNT / 2,
      manager.missingValue(ODD_PROPERTY, 'true').length,
    );
    assertEquals(GEOPACKAGE_COUNT, manager.missingValue(ODD_PROPERTY, 'false').length);
    assertEquals(GEOPACKAGE_COUNT - COLOR_RED_COUNT, manager.missingValue(PropertyNames.TAG, COLOR_RED).length);
    assertEquals(GEOPACKAGE_COUNT - COLOR_GREEN_COUNT, manager.missingValue(PropertyNames.TAG, COLOR_GREEN).length);
    assertEquals(GEOPACKAGE_COUNT - COLOR_BLUE_COUNT, manager.missingValue(PropertyNames.TAG, COLOR_BLUE).length);
    assertEquals(GEOPACKAGE_COUNT, manager.missingValue(PropertyNames.TAG, 'Yellow').length);
    assertEquals(GEOPACKAGE_COUNT, manager.missingValue(PropertyNames.CREATOR, CREATOR).length);

    // Add a property value to all GeoPackages
    assertEquals(GEOPACKAGE_COUNT, manager.addValue(PropertyNames.CREATOR, CREATOR));
    assertEquals(++numProperties, manager.numProperties());
    properties = manager.getProperties();
    assertEquals(numProperties, properties.length);
    (properties.indexOf(PropertyNames.CREATOR) > -1).should.be.true;
    assertEquals(GEOPACKAGE_COUNT, manager.hasProperty(PropertyNames.CREATOR).length);
    assertEquals(0, manager.missingProperty(PropertyNames.CREATOR).length);
    assertEquals(1, manager.numValues(PropertyNames.CREATOR));
    manager.hasValues(PropertyNames.CREATOR).should.be.true;
    (manager.getValues(PropertyNames.CREATOR).indexOf(CREATOR) > -1).should.be.true;
    assertEquals(GEOPACKAGE_COUNT, manager.hasValue(PropertyNames.CREATOR, CREATOR).length);
    assertEquals(0, manager.missingValue(PropertyNames.CREATOR, CREATOR).length);

    // Add a property value to a single GeoPackage
    assert.isFalse(manager.addValueToGeoPackage(GEOPACKAGE_NAME + GEOPACKAGE_COUNT, PropertyNames.CREATOR, CREATOR));
    manager.addValueToGeoPackage(GEOPACKAGE_NAME + GEOPACKAGE_COUNT, PropertyNames.CONTRIBUTOR, CREATOR).should.be.true;
    assertEquals(++numProperties, manager.numProperties());
    properties = manager.getProperties();
    assertEquals(numProperties, properties.length);
    (properties.indexOf(PropertyNames.CONTRIBUTOR) > -1).should.be.true;
    assertEquals(1, manager.hasProperty(PropertyNames.CONTRIBUTOR).length);
    assertEquals(GEOPACKAGE_COUNT - 1, manager.missingProperty(PropertyNames.CONTRIBUTOR).length);
    assertEquals(1, manager.numValues(PropertyNames.CONTRIBUTOR));
    manager.hasValues(PropertyNames.CONTRIBUTOR).should.be.true;
    (manager.getValues(PropertyNames.CONTRIBUTOR).indexOf(CREATOR) > -1).should.be.true;
    assertEquals(1, manager.hasValue(PropertyNames.CONTRIBUTOR, CREATOR).length);
    assertEquals(GEOPACKAGE_COUNT - 1, manager.missingValue(PropertyNames.CONTRIBUTOR, CREATOR).length);

    // Add an identifier to GeoPackages without one, one at a time
    let missingIdentifiers = manager.missingProperty(PropertyNames.IDENTIFIER);
    assertEquals(GEOPACKAGE_WITHOUT_PROPERTIES_COUNT, missingIdentifiers.length);
    let indentifierIndex = 100;
    for (const missingIdentifierGeoPackage of missingIdentifiers) {
      manager.addValueToGeoPackage(
        missingIdentifierGeoPackage.getName(),
        PropertyNames.IDENTIFIER,
        (indentifierIndex++).toString(),
      ).should.be.true;
    }
    assertEquals(GEOPACKAGE_COUNT, manager.hasProperty(PropertyNames.IDENTIFIER).length);
    assertEquals(0, manager.missingProperty(PropertyNames.IDENTIFIER).length);

    // Add an identifier to GeoPackages without one, all at once
    assertEquals(GEOPACKAGE_COUNT - 1, manager.addValue(PropertyNames.CONTRIBUTOR, CREATOR));
    assertEquals(GEOPACKAGE_COUNT, manager.hasProperty(PropertyNames.CONTRIBUTOR).length);
    assertEquals(0, manager.missingProperty(PropertyNames.CONTRIBUTOR).length);

    // Delete a property from all GeoPackages
    assertEquals(GEOPACKAGE_COUNT, manager.deleteProperty(PropertyNames.IDENTIFIER));
    assertEquals(--numProperties, manager.numProperties());
    properties = manager.getProperties();
    assertEquals(numProperties, properties.length);
    assert.isFalse(properties.indexOf(PropertyNames.IDENTIFIER) > -1);
    assertEquals(0, manager.hasProperty(PropertyNames.IDENTIFIER).length);
    assertEquals(GEOPACKAGE_COUNT, manager.missingProperty(PropertyNames.IDENTIFIER).length);
    assertEquals(0, manager.numValues(PropertyNames.IDENTIFIER));
    assert.isFalse(manager.hasValues(PropertyNames.IDENTIFIER));
    assertEquals(0, manager.getValues(PropertyNames.IDENTIFIER).length);
    assertEquals(0, manager.hasValue(PropertyNames.IDENTIFIER, '1').length);
    assertEquals(GEOPACKAGE_COUNT, manager.missingValue(PropertyNames.IDENTIFIER, '1').length);

    // Delete a property from a single GeoPackage
    manager.deletePropertyWithGeoPackage(GEOPACKAGE_NAME + '1', PropertyNames.TAG).should.be.true;
    assertEquals(numProperties, manager.numProperties());
    properties = manager.getProperties();
    assertEquals(numProperties, properties.length);
    (properties.indexOf(PropertyNames.TAG) > -1).should.be.true;
    assertEquals(--numTagged, manager.hasProperty(PropertyNames.TAG).length);
    assertEquals(GEOPACKAGE_COUNT - numTagged, manager.missingProperty(PropertyNames.TAG).length);
    assertEquals(3, manager.numValues(PropertyNames.TAG));
    manager.hasValues(PropertyNames.TAG).should.be.true;
    (manager.getValues(PropertyNames.TAG).indexOf(COLOR_RED) > -1).should.be.true;
    assertEquals(COLOR_RED_COUNT - 1, manager.hasValue(PropertyNames.TAG, COLOR_RED).length);
    assertEquals(GEOPACKAGE_COUNT - (COLOR_RED_COUNT - 1), manager.missingValue(PropertyNames.TAG, COLOR_RED).length);

    // Delete a property value from all GeoPackages
    assertEquals(COLOR_RED_COUNT - 1, manager.deleteValue(PropertyNames.TAG, COLOR_RED));
    assertEquals(numProperties, manager.numProperties());
    properties = manager.getProperties();
    assertEquals(numProperties, properties.length);
    (properties.indexOf(PropertyNames.TAG) > -1).should.be.true;
    assertEquals(--numTagged, manager.hasProperty(PropertyNames.TAG).length);
    assertEquals(GEOPACKAGE_COUNT - numTagged, manager.missingProperty(PropertyNames.TAG).length);
    assertEquals(2, manager.numValues(PropertyNames.TAG));
    manager.hasValues(PropertyNames.TAG).should.be.true;
    assert.isFalse(manager.getValues(PropertyNames.TAG).indexOf(COLOR_RED) > -1);
    (manager.getValues(PropertyNames.TAG).indexOf(COLOR_GREEN) > -1).should.be.true;
    assertEquals(0, manager.hasValue(PropertyNames.TAG, COLOR_RED).length);
    assertEquals(COLOR_GREEN_COUNT - 1, manager.hasValue(PropertyNames.TAG, COLOR_GREEN).length);
    assertEquals(GEOPACKAGE_COUNT, manager.missingValue(PropertyNames.TAG, COLOR_RED).length);

    // Delete a property value from a single GeoPackage
    manager.deleteValueWithGeoPackage(GEOPACKAGE_NAME + (COLOR_GREEN_FREQUENCY + 1), PropertyNames.TAG, COLOR_GREEN)
      .should.be.true;
    assertEquals(numProperties, manager.numProperties());
    properties = manager.getProperties();
    assertEquals(numProperties, properties.length);
    (properties.indexOf(PropertyNames.TAG) > -1).should.be.true;
    assertEquals(--numTagged, manager.hasProperty(PropertyNames.TAG).length);
    assertEquals(GEOPACKAGE_COUNT - numTagged, manager.missingProperty(PropertyNames.TAG).length);
    assertEquals(2, manager.numValues(PropertyNames.TAG));
    manager.hasValues(PropertyNames.TAG).should.be.true;
    (manager.getValues(PropertyNames.TAG).indexOf(COLOR_GREEN) > -1).should.be.true;
    assertEquals(COLOR_GREEN_COUNT - 2, manager.hasValue(PropertyNames.TAG, COLOR_GREEN).length);
    assertEquals(
      GEOPACKAGE_COUNT - (COLOR_GREEN_COUNT - 2),
      manager.missingValue(PropertyNames.TAG, COLOR_GREEN).length,
    );

    // Delete all properties from a single GeoPackage
    manager.deleteAllWithGeoPackage(GEOPACKAGE_NAME + 2).should.be.true;
    assertEquals(numProperties, manager.numProperties());
    properties = manager.getProperties();
    assertEquals(numProperties, properties.length);
    (properties.indexOf(PropertyNames.TITLE) > -1).should.be.true;
    assertEquals(GEOPACKAGE_WITH_PROPERTIES_COUNT - 1, manager.hasProperty(PropertyNames.TITLE).length);
    assertEquals(
      GEOPACKAGE_COUNT - (GEOPACKAGE_WITH_PROPERTIES_COUNT - 1),
      manager.missingProperty(PropertyNames.TITLE).length,
    );
    assertEquals(GEOPACKAGE_WITH_PROPERTIES_COUNT - 1, manager.numValues(PropertyNames.TITLE));
    manager.hasValues(PropertyNames.TITLE).should.be.true;
    assert.isFalse(manager.getValues(PropertyNames.TITLE).indexOf(GEOPACKAGE_NAME + 2) > -1);
    (manager.getValues(PropertyNames.TITLE).indexOf(GEOPACKAGE_NAME + 3) > -1).should.be.true;
    assertEquals(0, manager.hasValue(PropertyNames.TITLE, GEOPACKAGE_NAME + 2).length);
    assertEquals(1, manager.hasValue(PropertyNames.TITLE, GEOPACKAGE_NAME + 3).length);
    assertEquals(GEOPACKAGE_COUNT, manager.missingValue(PropertyNames.TITLE, GEOPACKAGE_NAME + 2).length);

    // Remove the extension from a single GeoPackage
    manager.removeExtensionWithGeoPackage(GEOPACKAGE_NAME + 4);
    assertEquals(numProperties, manager.numProperties());
    properties = manager.getProperties();
    assertEquals(numProperties, properties.length);
    (properties.indexOf(PropertyNames.TITLE) > -1).should.be.true;
    assertEquals(GEOPACKAGE_WITH_PROPERTIES_COUNT - 2, manager.hasProperty(PropertyNames.TITLE).length);
    assertEquals(
      GEOPACKAGE_COUNT - (GEOPACKAGE_WITH_PROPERTIES_COUNT - 2),
      manager.missingProperty(PropertyNames.TITLE).length,
    );
    assertEquals(GEOPACKAGE_WITH_PROPERTIES_COUNT - 2, manager.numValues(PropertyNames.TITLE));
    manager.hasValues(PropertyNames.TITLE).should.be.true;
    assert.isFalse(manager.getValues(PropertyNames.TITLE).indexOf(GEOPACKAGE_NAME + 4) > -1);
    (manager.getValues(PropertyNames.TITLE).indexOf(GEOPACKAGE_NAME + 3) > -1).should.be.true;
    assertEquals(0, manager.hasValue(PropertyNames.TITLE, GEOPACKAGE_NAME + 4).length);
    assertEquals(1, manager.hasValue(PropertyNames.TITLE, GEOPACKAGE_NAME + 3).length);
    assertEquals(GEOPACKAGE_COUNT, manager.missingValue(PropertyNames.TITLE, GEOPACKAGE_NAME + 4).length);

    // Delete all properties from all GeoPackages
    assertEquals(GEOPACKAGE_COUNT - 2, manager.deleteAll());
    assertEquals(0, manager.numProperties());
    (manager.getProperties().length === 0).should.be.true;
    (manager.hasProperty(PropertyNames.TITLE).length === 0).should.be.true;
    assertEquals(GEOPACKAGE_COUNT, manager.missingProperty(PropertyNames.TITLE).length);
    assertEquals(0, manager.numValues(PropertyNames.TITLE));
    assert.isFalse(manager.hasValues(PropertyNames.TITLE));
    (manager.getValues(PropertyNames.TITLE).length === 0).should.be.true;
    (manager.hasValue(PropertyNames.TITLE, GEOPACKAGE_NAME + 3).length === 0).should.be.true;
    assertEquals(GEOPACKAGE_COUNT, manager.missingValue(PropertyNames.TITLE, GEOPACKAGE_NAME + 3).length);

    // Remove the extension from all GeoPackages
    manager.removeExtension();
    assertEquals(0, manager.numProperties());
    (manager.getProperties().length === 0).should.be.true;
    (manager.hasProperty(PropertyNames.TITLE).length === 0).should.be.true;
    assertEquals(GEOPACKAGE_COUNT, manager.missingProperty(PropertyNames.TITLE).length);
    assertEquals(0, manager.numValues(PropertyNames.TITLE));
    assert.isFalse(manager.hasValues(PropertyNames.TITLE));
    (manager.getValues(PropertyNames.TITLE).length === 0).should.be.true;
    (manager.hasValue(PropertyNames.TITLE, GEOPACKAGE_NAME + 3).length === 0).should.be.true;
    assertEquals(GEOPACKAGE_COUNT, manager.missingValue(PropertyNames.TITLE, GEOPACKAGE_NAME + 3).length);
  }

  let manager;

  beforeEach('create properties manager', async function () {
    manager = new PropertiesManager(await createGeoPackages());
  });

  afterEach('close the geopackages', async function () {
    // Close the GeoPackages
    manager.closeGeoPackages();
    assertEquals(0, manager.numGeoPackages());
  });

  it('should test properties manager with GeoPackages', function () {
    testPropertiesManager(manager);
  });
});
