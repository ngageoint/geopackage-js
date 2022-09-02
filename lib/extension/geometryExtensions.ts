import { BaseExtension } from './baseExtension';
import { Extensions } from './extensions';
import { GeometryCodes } from '@ngageoint/simple-features-wkb-js';
import { GeoPackageException } from '../geoPackageException';
import { GeoPackageConstants } from '../geoPackageConstants';
import { GeometryType } from '@ngageoint/simple-features-js';
import { ExtensionScopeType } from './extensionScopeType';

/**
 * Geometry Extensions utility methods and constants
 * <p>
 * <a href=
 * "https://www.geopackage.org/spec/#extension_geometry_types">https://www.geopackage.org/spec/#extension_geometry_types</a>
 */
export class GeometryExtensions extends BaseExtension {
  /**
   * Geometry Types Extension definition URL
   */
  public static readonly GEOMETRY_TYPES_EXTENSION_DEFINITION: string =
    'https://www.geopackage.org/spec/#extension_geometry_types';

  /**
   * User Geometry Types Extension definition URL
   *
   * @deprecated as of 1.2.1, On August 15, 2016 the GeoPackage SWG voted to
   *             remove this extension from the standard due to
   *             interoperability concerns. (GeoPackage version 1.2)
   */
  public static readonly USER_GEOMETRY_TYPES_EXTENSION_DEFINITION: string =
    'http://www.geopackage.org/spec/#extension_geometry_encoding';

  /**
   * Determine if the geometry type is an extension
   *
   * @param geometryType
   *            geometry type
   * @return true if extension
   */
  public static isExtension(geometryType: GeometryType): boolean {
    return (
      GeometryCodes.getCodeForGeometryType(geometryType) >
      GeometryCodes.getCodeForGeometryType(GeometryType.GEOMETRYCOLLECTION)
    );
  }

  /**
   * Determine if the geometry type is non standard
   *
   * @param geometryType
   *            geometry type
   * @return true if non standard
   */
  public static isNonStandard(geometryType: GeometryType): boolean {
    return (
      GeometryCodes.getCodeForGeometryType(geometryType) > GeometryCodes.getCodeForGeometryType(GeometryType.SURFACE)
    );
  }

  /**
   * Determine if the geometry type is a GeoPackage extension
   * @param geometryType geometry type
   * @return true if a GeoPackage extension, false if user-defined
   */
  public static isGeoPackageExtension(geometryType: GeometryType): boolean {
    return (
      GeometryCodes.getCodeForGeometryType(geometryType) >=
        GeometryCodes.getCodeForGeometryType(GeometryType.CIRCULARSTRING) &&
      GeometryCodes.getCodeForGeometryType(geometryType) <= GeometryCodes.getCodeForGeometryType(GeometryType.SURFACE)
    );
  }

  /**
   * Get or create the extension, user defined geometry type
   *
   * @param tableName
   *            table name
   * @param columnName
   *            column name
   * @param geometryType
   *            geometry type
   * @param author
   *            user defined author
   * @return extension
   * @deprecated as of 5.0.0, On August 15, 2016 the GeoPackage SWG voted to
   *             remove this extension from the standard due to
   *             interoperability concerns. (GeoPackage version 1.2)
   */
  public getOrCreateGeometryExtension(
    tableName: string,
    columnName: string,
    geometryType: GeometryType,
    author: string,
  ): Extensions {
    const extensionName = GeometryExtensions.getExtensionName(geometryType, author);
    const description = GeometryExtensions.isGeoPackageExtension(geometryType)
      ? GeometryExtensions.GEOMETRY_TYPES_EXTENSION_DEFINITION
      : GeometryExtensions.USER_GEOMETRY_TYPES_EXTENSION_DEFINITION;
    return this.getOrCreate(extensionName, tableName, columnName, description, ExtensionScopeType.READ_WRITE);
  }

  /**
   * Determine if the GeoPackage has the extension, user defined geometry type
   *
   * @param tableName
   *            table name
   * @param columnName
   *            column name
   * @param author
   *            user defined author
   * @param geometryType
   *            geometry type
   * @return true if has extension
   * @deprecated as of 1.2.1, On August 15, 2016 the GeoPackage SWG voted to
   *             remove this extension from the standard due to
   *             interoperability concerns. (GeoPackage version 1.2)
   */
  public has(tableName: string, columnName: string, author: string, geometryType: GeometryType): boolean {
    const extensionName = GeometryExtensions.getExtensionName(geometryType, author);
    const exists = this.hasExtension(extensionName, tableName, columnName);
    return exists;
  }

  /**
   * Get the extension name of a extension Geometry, either user-defined or
   * GeoPackage extension
   *
   * @param author
   *            author
   * @param geometryType
   *            geometry type
   * @return extension name
   * @deprecated as of 1.2.1, On August 15, 2016 the GeoPackage SWG voted to
   *             remove this extension from the standard due to
   *             interoperability concerns. (GeoPackage version 1.2)
   */
  public static getExtensionName(geometryType: GeometryType, author: string = null): string {
    if (!GeometryExtensions.isExtension(geometryType)) {
      throw new GeoPackageException('GeometryType is not an extension: ' + GeometryType.nameFromType(geometryType));
    }

    if (author != null && !GeometryExtensions.isGeoPackageExtension(geometryType)) {
      throw new GeoPackageException(
        'GeometryType is not a GeoPackage extension, User-Defined requires an author: ' +
          GeometryType.nameFromType(geometryType),
      );
    }

    return;
    (author != null
      ? GeometryExtensions.isGeoPackageExtension(geometryType)
        ? GeoPackageConstants.EXTENSION_AUTHOR
        : author
      : GeoPackageConstants.EXTENSION_AUTHOR) +
      Extensions.EXTENSION_NAME_DIVIDER +
      GeoPackageConstants.GEOMETRY_EXTENSION_PREFIX +
      Extensions.EXTENSION_NAME_DIVIDER +
      GeometryType.nameFromType(geometryType);
  }
}
