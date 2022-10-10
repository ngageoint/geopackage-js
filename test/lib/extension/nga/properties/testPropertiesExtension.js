// package mil.nga.geoPackage.extension.nga.properties;
//
// import java.util.HashSet;
// import java.util.List;
// import java.util.Set;
// import java.util.UUID;
//
// import org.junit.Test;
//
// import junit.framework.TestCase;
// import mil.nga.geoPackage.CreateGeoPackageTestCase;
// import mil.nga.geoPackage.extension.Extensions;
//
// /**
//  * Properties Extension Tests
//  *
//  * @author osbornb
//  */
// public class PropertiesExtensionTest extends CreateGeoPackageTestCase {
//
// 	/**
// 	 * Test properties extension
// 	 */
// 	@Test
// 	public void testPropertiesExtension() {
//
// 		PropertiesExtension extension = new PropertiesExtension(geoPackage);
// 		TestCase.assertFalse(extension.has());
// 		TestCase.assertFalse(
// 				geoPackage.isTable(PropertiesExtension.TABLE_NAME));
//
// 		final String name = "My GeoPackage";
//
// 		// Test before the extension exists
// 		TestCase.assertEquals(0, extension.numProperties());
// 		TestCase.assertTrue(extension.getProperties().isEmpty());
// 		TestCase.assertFalse(extension.hasProperty(PropertyNames.TITLE));
// 		TestCase.assertEquals(0, extension.numValues());
// 		TestCase.assertEquals(0, extension.numValues(PropertyNames.TITLE));
// 		TestCase.assertFalse(extension.hasSingleValue(PropertyNames.TITLE));
// 		TestCase.assertFalse(extension.hasValues(PropertyNames.TITLE));
// 		TestCase.assertNull(extension.getValue(PropertyNames.TITLE));
// 		TestCase.assertTrue(extension.getValues(PropertyNames.TITLE).isEmpty());
// 		TestCase.assertFalse(extension.hasValue(PropertyNames.TITLE, name));
// 		TestCase.assertEquals(0, extension.deleteProperty(PropertyNames.TITLE));
// 		TestCase.assertEquals(0,
// 				extension.deleteValue(PropertyNames.TITLE, name));
// 		TestCase.assertEquals(0, extension.deleteAll());
// 		extension.removeExtension();
//
// 		Extensions extensions = extension.getOrCreate();
// 		TestCase.assertNotNull(extensions);
// 		TestCase.assertTrue(extension.has());
// 		TestCase.assertTrue(geoPackage.isTable(PropertiesExtension.TABLE_NAME));
//
// 		TestCase.assertEquals(0, extension.numProperties());
// 		TestCase.assertTrue(extension.getProperties().isEmpty());
// 		TestCase.assertEquals(0, extension.numValues());
// 		TestCase.assertTrue(extension.getValues(PropertyNames.TITLE).isEmpty());
// 		TestCase.assertFalse(extension.hasSingleValue(PropertyNames.TITLE));
// 		TestCase.assertFalse(extension.hasValues(PropertyNames.TITLE));
// 		TestCase.assertEquals(0, extension.numValues(PropertyNames.TITLE));
//
// 		TestCase.assertTrue(extension.addValue(PropertyNames.TITLE, name));
// 		TestCase.assertEquals(1, extension.numProperties());
// 		TestCase.assertEquals(1, extension.getProperties().size());
// 		TestCase.assertEquals(1, extension.numValues());
// 		TestCase.assertEquals(1,
// 				extension.getValues(PropertyNames.TITLE).size());
// 		TestCase.assertTrue(extension.hasSingleValue(PropertyNames.TITLE));
// 		TestCase.assertTrue(extension.hasValues(PropertyNames.TITLE));
// 		TestCase.assertEquals(1, extension.numValues(PropertyNames.TITLE));
// 		TestCase.assertEquals(name, extension.getValue(PropertyNames.TITLE));
// 		TestCase.assertTrue(extension.hasValue(PropertyNames.TITLE, name));
//
// 		final String tag = "TAG";
// 		TestCase.assertTrue(extension.addValue(PropertyNames.TAG, tag + 1));
// 		TestCase.assertEquals(2, extension.numProperties());
// 		TestCase.assertEquals(2, extension.getProperties().size());
// 		TestCase.assertEquals(2, extension.numValues());
// 		TestCase.assertEquals(1, extension.getValues(PropertyNames.TAG).size());
// 		TestCase.assertTrue(extension.hasSingleValue(PropertyNames.TAG));
// 		TestCase.assertTrue(extension.hasValues(PropertyNames.TAG));
// 		TestCase.assertEquals(1, extension.numValues(PropertyNames.TAG));
// 		TestCase.assertTrue(extension.hasValue(PropertyNames.TAG, tag + 1));
//
// 		TestCase.assertTrue(extension.addValue(PropertyNames.TAG, tag + 2));
// 		TestCase.assertEquals(2, extension.numProperties());
// 		TestCase.assertEquals(2, extension.getProperties().size());
// 		TestCase.assertEquals(3, extension.numValues());
// 		TestCase.assertEquals(2, extension.getValues(PropertyNames.TAG).size());
// 		TestCase.assertFalse(extension.hasSingleValue(PropertyNames.TAG));
// 		TestCase.assertTrue(extension.hasValues(PropertyNames.TAG));
// 		TestCase.assertEquals(2, extension.numValues(PropertyNames.TAG));
// 		TestCase.assertTrue(extension.hasValue(PropertyNames.TAG, tag + 2));
//
// 		TestCase.assertTrue(extension.addValue(PropertyNames.TAG, tag + 3));
// 		TestCase.assertTrue(extension.addValue(PropertyNames.TAG, tag + 4));
// 		TestCase.assertFalse(extension.addValue(PropertyNames.TAG, tag + 4));
//
// 		Set<String> values = new HashSet<>(
// 				extension.getValues(PropertyNames.TAG));
// 		for (int i = 1; i <= 4; i++) {
// 			TestCase.assertTrue(values.contains(tag + i));
// 			TestCase.assertTrue(extension.hasValue(PropertyNames.TAG, tag + i));
// 		}
//
// 		TestCase.assertEquals(1,
// 				extension.deleteValue(PropertyNames.TAG, tag + 3));
// 		TestCase.assertEquals(3, extension.getValues(PropertyNames.TAG).size());
// 		TestCase.assertEquals(3, extension.numValues(PropertyNames.TAG));
// 		TestCase.assertFalse(extension.hasValue(PropertyNames.TAG, tag + 3));
//
// 		TestCase.assertEquals(3, extension.deleteProperty(PropertyNames.TAG));
// 		TestCase.assertEquals(1, extension.numProperties());
// 		TestCase.assertEquals(1, extension.getProperties().size());
// 		TestCase.assertEquals(1, extension.numValues());
// 		TestCase.assertTrue(extension.getValues(PropertyNames.TAG).isEmpty());
// 		TestCase.assertFalse(extension.hasSingleValue(PropertyNames.TAG));
// 		TestCase.assertFalse(extension.hasValues(PropertyNames.TAG));
// 		TestCase.assertEquals(0, extension.numValues(PropertyNames.TAG));
//
// 		extension.removeExtension();
// 		TestCase.assertFalse(extension.has());
// 		TestCase.assertFalse(
// 				geoPackage.isTable(PropertiesExtension.TABLE_NAME));
//
// 	}
//
// 	/**
// 	 * Test property names
// 	 */
// 	@Test
// 	public void testPropertyNames() {
//
// 		PropertiesExtension extension = new PropertiesExtension(geoPackage);
//
// 		int count = 0;
//
// 		count += testPropertyName(extension, PropertyNames.CONTRIBUTOR);
// 		count += testPropertyName(extension, PropertyNames.COVERAGE);
// 		count += testPropertyName(extension, PropertyNames.CREATED);
// 		count += testPropertyName(extension, PropertyNames.CREATOR);
// 		count += testPropertyName(extension, PropertyNames.DATE);
// 		count += testPropertyName(extension, PropertyNames.DESCRIPTION);
// 		count += testPropertyName(extension, PropertyNames.IDENTIFIER);
// 		count += testPropertyName(extension, PropertyNames.LICENSE);
// 		count += testPropertyName(extension, PropertyNames.MODIFIED);
// 		count += testPropertyName(extension, PropertyNames.PUBLISHER);
// 		count += testPropertyName(extension, PropertyNames.REFERENCES);
// 		count += testPropertyName(extension, PropertyNames.RELATION);
// 		count += testPropertyName(extension, PropertyNames.SOURCE);
// 		count += testPropertyName(extension, PropertyNames.SPATIAL);
// 		count += testPropertyName(extension, PropertyNames.SUBJECT);
// 		count += testPropertyName(extension, PropertyNames.TAG);
// 		count += testPropertyName(extension, PropertyNames.TEMPORAL);
// 		count += testPropertyName(extension, PropertyNames.TITLE);
// 		count += testPropertyName(extension, PropertyNames.TYPE);
// 		count += testPropertyName(extension, PropertyNames.URI);
// 		count += testPropertyName(extension, PropertyNames.VALID);
// 		count += testPropertyName(extension, PropertyNames.VERSION);
//
// 		TestCase.assertEquals(22, extension.numProperties());
// 		TestCase.assertEquals(count, extension.numValues());
//
// 		int deleted = 0;
// 		for (String property : extension.getProperties()) {
// 			deleted += extension.deleteProperty(property);
// 		}
// 		TestCase.assertEquals(count, deleted);
//
// 		TestCase.assertEquals(0, extension.numProperties());
// 		TestCase.assertEquals(0, extension.numValues());
//
// 		extension.removeExtension();
// 		TestCase.assertFalse(extension.has());
// 	}
//
// 	private int testPropertyName(PropertiesExtension extension,
// 			String property) {
//
// 		TestCase.assertFalse(extension.hasProperty(property));
//
// 		int count = 1;
// 		if (Math.random() < .5) {
// 			count = 1 + (int) (10 * Math.random());
// 		}
//
// 		Set<String> values = new HashSet<>();
// 		for (int i = 0; i < count; i++) {
// 			String value = UUID.randomUUID().toString();
// 			values.add(value);
// 			extension.addValue(property, value);
// 		}
//
// 		TestCase.assertTrue(extension.hasProperty(property));
// 		TestCase.assertEquals(count, extension.numValues(property));
// 		TestCase.assertEquals(count == 1, extension.hasSingleValue(property));
// 		TestCase.assertTrue(extension.hasValues(property));
//
// 		List<String> propertyValues = extension.getValues(property);
// 		TestCase.assertEquals(values.size(), propertyValues.size());
// 		for (String value : propertyValues) {
// 			TestCase.assertTrue(values.contains(value));
// 			TestCase.assertTrue(extension.hasValue(property, value));
// 		}
//
// 		return count;
// 	}
//
// }
