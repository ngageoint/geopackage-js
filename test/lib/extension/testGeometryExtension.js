import { GeometryType } from '@ngageoint/simple-features-js';
import { GeometryExtensions } from '../../../lib/extension/geometryExtensions';
import path from 'path';
import { GeometryCodes } from '@ngageoint/simple-features-wkb-js';
import { ExtensionScopeType } from '../../../lib/extension/extensionScopeType';
const assert = require('chai').assert;
const testSetup = require('../../testSetup').default;

describe('GeoPackage Extension tests', function () {
  var filename = path.join(__dirname, '..', '..', 'fixtures', 'import_db.gpkg');
  var testGeoPackage;
  var geoPackage;

  beforeEach(async function () {
    const result = await copyAndOpenGeopackage(filename);
    testGeoPackage = result.path;
    geoPackage = result.geoPackage;
  });

  afterEach(async function () {
    geoPackage.close();
    await testSetup.deleteGeoPackage(testGeoPackage);
  });

  /**
   * Test the is extension check
   */
  it('test isExtension', function () {
    assert.isFalse(GeometryExtensions.isExtension(GeometryType.GEOMETRY));
    assert.isFalse(GeometryExtensions.isExtension(GeometryType.POINT));
    assert.isFalse(GeometryExtensions.isExtension(GeometryType.LINESTRING));
    assert.isFalse(GeometryExtensions.isExtension(GeometryType.POLYGON));
    assert.isFalse(GeometryExtensions.isExtension(GeometryType.MULTIPOINT));
    assert.isFalse(GeometryExtensions.isExtension(GeometryType.MULTILINESTRING));
    assert.isFalse(GeometryExtensions.isExtension(GeometryType.MULTIPOLYGON));
    assert.isFalse(GeometryExtensions.isExtension(GeometryType.GEOMETRYCOLLECTION));

    assert.isTrue(GeometryExtensions.isExtension(GeometryType.CIRCULARSTRING));
    assert.isTrue(GeometryExtensions.isExtension(GeometryType.COMPOUNDCURVE));
    assert.isTrue(GeometryExtensions.isExtension(GeometryType.CURVEPOLYGON));
    assert.isTrue(GeometryExtensions.isExtension(GeometryType.MULTICURVE));
    assert.isTrue(GeometryExtensions.isExtension(GeometryType.MULTISURFACE));
    assert.isTrue(GeometryExtensions.isExtension(GeometryType.CURVE));
    assert.isTrue(GeometryExtensions.isExtension(GeometryType.SURFACE));
    assert.isTrue(GeometryExtensions.isExtension(GeometryType.POLYHEDRALSURFACE));
    assert.isTrue(GeometryExtensions.isExtension(GeometryType.TIN));
    assert.isTrue(GeometryExtensions.isExtension(GeometryType.TRIANGLE));
  });

  /**
   * Test the is GeoPackage extension check
   */
  it('test isGeoPackageExtension', function () {
    assert.isFalse(GeometryExtensions.isGeoPackageExtension(GeometryType.GEOMETRY));
    assert.isFalse(GeometryExtensions.isGeoPackageExtension(GeometryType.POINT));
    assert.isFalse(GeometryExtensions.isGeoPackageExtension(GeometryType.LINESTRING));
    assert.isFalse(GeometryExtensions.isGeoPackageExtension(GeometryType.POLYGON));
    assert.isFalse(GeometryExtensions.isGeoPackageExtension(GeometryType.MULTIPOINT));
    assert.isFalse(GeometryExtensions.isGeoPackageExtension(GeometryType.MULTILINESTRING));
    assert.isFalse(GeometryExtensions.isGeoPackageExtension(GeometryType.MULTIPOLYGON));
    assert.isFalse(GeometryExtensions.isGeoPackageExtension(GeometryType.GEOMETRYCOLLECTION));
    assert.isTrue(GeometryExtensions.isGeoPackageExtension(GeometryType.CIRCULARSTRING));
    assert.isTrue(GeometryExtensions.isGeoPackageExtension(GeometryType.COMPOUNDCURVE));
    assert.isTrue(GeometryExtensions.isGeoPackageExtension(GeometryType.CURVEPOLYGON));
    assert.isTrue(GeometryExtensions.isGeoPackageExtension(GeometryType.MULTICURVE));
    assert.isTrue(GeometryExtensions.isGeoPackageExtension(GeometryType.MULTISURFACE));
    assert.isTrue(GeometryExtensions.isGeoPackageExtension(GeometryType.CURVE));
    assert.isTrue(GeometryExtensions.isGeoPackageExtension(GeometryType.SURFACE));
    assert.isFalse(GeometryExtensions.isGeoPackageExtension(GeometryType.POLYHEDRALSURFACE));
    assert.isFalse(GeometryExtensions.isGeoPackageExtension(GeometryType.TIN));
    assert.isFalse(GeometryExtensions.isGeoPackageExtension(GeometryType.TRIANGLE));
  });

  /**
   * Test the GeoPackage get extension name
   */
  it('test geometry extension name', function () {
    try {
      assert.fail(GeometryExtensions.getExtensionName(GeometryType.GEOMETRY));
    } catch (e) {
      // expected
    }
    try {
      assert.fail(GeometryExtensions.getExtensionName(GeometryType.POINT));
    } catch (e) {
      // expected
    }
    try {
      assert.fail(GeometryExtensions.getExtensionName(GeometryType.LINESTRING));
    } catch (e) {
      // expected
    }
    try {
      assert.fail(GeometryExtensions.getExtensionName(GeometryType.POLYGON));
    } catch (e) {
      // expected
    }
    try {
      assert.fail(GeometryExtensions.getExtensionName(GeometryType.MULTIPOINT));
    } catch (e) {
      // expected
    }
    try {
      assert.fail(GeometryExtensions.getExtensionName(GeometryType.MULTILINESTRING));
    } catch (e) {
      // expected
    }
    try {
      assert.fail(GeometryExtensions.getExtensionName(GeometryType.MULTIPOLYGON));
    } catch (e) {
      // expected
    }
    try {
      assert.fail(GeometryExtensions.getExtensionName(GeometryType.GEOMETRYCOLLECTION));
    } catch (e) {
      // expected
    }

    assert.equal(
      expectedGeoPackageExtensionName(GeometryType.CIRCULARSTRING),
      GeometryExtensions.getExtensionName(GeometryType.CIRCULARSTRING),
    );
    assert.equal(
      expectedGeoPackageExtensionName(GeometryType.COMPOUNDCURVE),
      GeometryExtensions.getExtensionName(GeometryType.COMPOUNDCURVE),
    );
    assert.equal(
      expectedGeoPackageExtensionName(GeometryType.CURVEPOLYGON),
      GeometryExtensions.getExtensionName(GeometryType.CURVEPOLYGON),
    );
    assert.equal(
      expectedGeoPackageExtensionName(GeometryType.MULTICURVE),
      GeometryExtensions.getExtensionName(GeometryType.MULTICURVE),
    );
    assert.equal(
      expectedGeoPackageExtensionName(GeometryType.MULTISURFACE),
      GeometryExtensions.getExtensionName(GeometryType.MULTISURFACE),
    );
    assert.equal(
      expectedGeoPackageExtensionName(GeometryType.CURVE),
      GeometryExtensions.getExtensionName(GeometryType.CURVE),
    );
    assert.equal(
      expectedGeoPackageExtensionName(GeometryType.SURFACE),
      GeometryExtensions.getExtensionName(GeometryType.SURFACE),
    );

    try {
      assert.fail(GeometryExtensions.getExtensionName(GeometryType.POLYHEDRALSURFACE));
    } catch (e) {
      // expected
    }
    try {
      assert.fail(GeometryExtensions.getExtensionName(GeometryType.TIN));
    } catch (e) {
      // expected
    }
    try {
      assert.fail(GeometryExtensions.getExtensionName(GeometryType.TRIANGLE));
    } catch (e) {
      // expected
    }
  });

  /**
   * Test the get extension name
   */

  it('test extension name', function () {
    let author = 'nga';

    try {
      assert.fail(GeometryExtensions.getExtensionNameWithAuthor(GeometryType.GEOMETRY, author));
    } catch (e) {
      // expected
    }
    try {
      assert.fail(GeometryExtensions.getExtensionNameWithAuthor(GeometryType.POINT, author));
    } catch (e) {
      // expected
    }
    try {
      assert.fail(GeometryExtensions.getExtensionNameWithAuthor(GeometryType.LINESTRING, author));
    } catch (e) {
      // expected
    }
    try {
      assert.fail(GeometryExtensions.getExtensionNameWithAuthor(GeometryType.POLYGON, author));
    } catch (e) {
      // expected
    }
    try {
      assert.fail(GeometryExtensions.getExtensionNameWithAuthor(GeometryType.MULTIPOINT, author));
    } catch (e) {
      // expected
    }
    try {
      assert.fail(GeometryExtensions.getExtensionNameWithAuthor(GeometryType.MULTILINESTRING, author));
    } catch (e) {
      // expected
    }
    try {
      assert.fail(GeometryExtensions.getExtensionNameWithAuthor(GeometryType.MULTIPOLYGON, author));
    } catch (e) {
      // expected
    }
    try {
      assert.fail(GeometryExtensions.getExtensionNameWithAuthor(GeometryType.GEOMETRYCOLLECTION, author));
    } catch (e) {
      // expected
    }

    assert.equal(
      expectedGeoPackageExtensionName(GeometryType.CIRCULARSTRING),
      GeometryExtensions.getExtensionNameWithAuthor(GeometryType.CIRCULARSTRING, author),
    );
    assert.equal(
      expectedGeoPackageExtensionName(GeometryType.COMPOUNDCURVE),
      GeometryExtensions.getExtensionNameWithAuthor(GeometryType.COMPOUNDCURVE, author),
    );
    assert.equal(
      expectedGeoPackageExtensionName(GeometryType.CURVEPOLYGON),
      GeometryExtensions.getExtensionNameWithAuthor(GeometryType.CURVEPOLYGON, author),
    );
    assert.equal(
      expectedGeoPackageExtensionName(GeometryType.MULTICURVE),
      GeometryExtensions.getExtensionNameWithAuthor(GeometryType.MULTICURVE, author),
    );
    assert.equal(
      expectedGeoPackageExtensionName(GeometryType.MULTISURFACE),
      GeometryExtensions.getExtensionNameWithAuthor(GeometryType.MULTISURFACE, author),
    );
    assert.equal(
      expectedGeoPackageExtensionName(GeometryType.CURVE),
      GeometryExtensions.getExtensionNameWithAuthor(GeometryType.CURVE, author),
    );
    assert.equal(
      expectedGeoPackageExtensionName(GeometryType.SURFACE),
      GeometryExtensions.getExtensionNameWithAuthor(GeometryType.SURFACE, author),
    );

    assert.equal(
      expectedUserDefinedExtensionName(author, GeometryType.POLYHEDRALSURFACE),
      GeometryExtensions.getExtensionNameWithAuthor(GeometryType.POLYHEDRALSURFACE, author),
    );
    assert.equal(
      expectedUserDefinedExtensionName(author, GeometryType.TIN),
      GeometryExtensions.getExtensionNameWithAuthor(GeometryType.TIN, author),
    );
    assert.equal(
      expectedUserDefinedExtensionName(author, GeometryType.TRIANGLE),
      GeometryExtensions.getExtensionNameWithAuthor(GeometryType.TRIANGLE, author),
    );
  });

  /**
   * Test the Geometry Extension creation
   */
  it('test geometry extension', function () {
    const extensions = new GeometryExtensions(geoPackage);
    const extensionsDao = geoPackage.getExtensionsDao();
    if (!extensionsDao.isTableExists()) {
      geoPackage.createExtensionsTable();
    }
    // Test non extension geometries
    for (
      let i = GeometryCodes.getCodeForGeometryType(GeometryType.GEOMETRY);
      i <= GeometryCodes.getCodeForGeometryType(GeometryType.GEOMETRYCOLLECTION);
      i++
    ) {
      const geometryType = GeometryCodes.getGeometryType(i);
      try {
        extensions.getOrCreateGeometryExtension('table_name', 'column_name', geometryType);
        assert.fail('Geometry Extension was created for ' + geometryType);
      } catch (e) {
        // Expected
      }
    }

    // Test user created extension geometries
    for (
      let i = GeometryCodes.getCodeForGeometryType(GeometryType.POLYHEDRALSURFACE);
      i <= GeometryCodes.getCodeForGeometryType(GeometryType.TRIANGLE);
      i++
    ) {
      const geometryType = GeometryCodes.getGeometryType(i);
      try {
        extensions.getOrCreateGeometryExtension('table_name', 'column_name', geometryType);
        assert.fail('Geometry Extension was created for ' + geometryType);
      } catch (e) {
        // Expected
      }
    }

    // Test geometry extensions
    let count = extensionsDao.count();
    for (
      let i = GeometryCodes.getCodeForGeometryType(GeometryType.CIRCULARSTRING);
      i <= GeometryCodes.getCodeForGeometryType(GeometryType.SURFACE);
      i++
    ) {
      const geometryType = GeometryCodes.getGeometryType(i);
      const tableName = 'table_' + GeometryType.nameFromType(geometryType);
      const columnName = 'geom';
      const extension = extensions.getOrCreateGeometryExtension(tableName, columnName, geometryType);
      assert.isNotNull(extension);
      assert.isTrue(extensions.has(tableName, columnName, undefined, geometryType));
      assert.equal(++count, extensionsDao.count());
      assert.equal(extension.getExtensionName(), expectedGeoPackageExtensionName(geometryType));
      assert.equal(extension.getAuthor(), expectedGeoPackageExtensionAuthor());
      assert.equal(extension.getExtensionNameNoAuthor(), expectedGeoPackageExtensionNameNoAuthor(geometryType));
      assert.equal(extension.getTableName(), tableName);
      assert.equal(extension.getColumnName(), columnName);
      assert.equal(extension.getScope(), ExtensionScopeType.READ_WRITE);
      assert.equal(extension.getDefinition(), GeometryExtensions.GEOMETRY_TYPES_EXTENSION_DEFINITION);
    }
  });

  /**
   * Test the User Geometry Extension creation
   */
  it('should create geometry extension', function () {
    const extensions = new GeometryExtensions(geoPackage);
    const extensionsDao = geoPackage.getExtensionsDao();
    if (!extensionsDao.isTableExists()) {
      geoPackage.createExtensionsTable();
    }
    const author = 'nga';

    // Test non extension geometries
    for (
      let i = GeometryCodes.getCodeForGeometryType(GeometryType.GEOMETRY);
      i <= GeometryCodes.getCodeForGeometryType(GeometryType.GEOMETRYCOLLECTION);
      i++
    ) {
      const geometryType = GeometryCodes.getGeometryType(i);
      try {
        extensions.getOrCreateGeometryExtension('table_name', 'column_name', geometryType, author);
        assert.fail('Geometry Extension was created for ' + geometryType);
      } catch (e) {
        // Expected
      }
    }

    // Test geometry extensions and user created extensions with author
    let count = extensionsDao.count();
    for (
      let i = GeometryCodes.getCodeForGeometryType(GeometryType.CIRCULARSTRING);
      i <= GeometryCodes.getCodeForGeometryType(GeometryType.TRIANGLE);
      i++
    ) {
      const geometryType = GeometryCodes.getGeometryType(i);
      const tableName = 'table_' + GeometryType.nameFromType(geometryType);
      const columnName = 'geom';
      const extension = extensions.getOrCreateGeometryExtension(tableName, columnName, geometryType, author);
      assert.isNotNull(extension);
      assert.isTrue(extensions.has(tableName, columnName, author, geometryType));
      assert.equal(++count, extensionsDao.count());

      assert.equal(extension.getExtensionNameNoAuthor(), expectedGeoPackageExtensionNameNoAuthor(geometryType));
      assert.equal(extension.getTableName(), tableName);
      assert.equal(extension.getColumnName(), columnName);
      assert.equal(extension.getScope(), ExtensionScopeType.READ_WRITE);

      if (i <= GeometryCodes.getCodeForGeometryType(GeometryType.SURFACE)) {
        assert.equal(extension.getExtensionName(), expectedGeoPackageExtensionName(geometryType));
        assert.equal(extension.getAuthor(), expectedGeoPackageExtensionAuthor());
        assert.equal(extension.getDefinition(), GeometryExtensions.GEOMETRY_TYPES_EXTENSION_DEFINITION);
      } else {
        assert.equal(extension.getExtensionName(), expectedUserDefinedExtensionName(author, geometryType));
        assert.equal(extension.getAuthor(), author);
        assert.equal(extension.getDefinition(), GeometryExtensions.USER_GEOMETRY_TYPES_EXTENSION_DEFINITION);
      }
    }
  });

  /**
   * Get the expected GeoPackage extension name
   *
   * @param type
   * @return
   */
  function expectedGeoPackageExtensionName(type) {
    return expectedGeoPackageExtensionAuthor() + '_' + expectedGeoPackageExtensionNameNoAuthor(type);
  }

  /**
   * Get the expected GeoPackage extension author
   *
   * @return
   */
  function expectedGeoPackageExtensionAuthor() {
    return 'gpkg';
  }

  /**
   * Get the expected GeoPackage extension name with no author
   *
   * @param type
   * @return
   */
  function expectedGeoPackageExtensionNameNoAuthor(type) {
    return 'geom_' + GeometryType.nameFromType(type);
  }

  /**
   * Get the expected User-Defined extension name
   *
   * @param author
   * @param type
   * @return
   */
  function expectedUserDefinedExtensionName(author, type) {
    return author + '_geom_' + GeometryType.nameFromType(type);
  }
});
