/**
 * GeoPackage Constants module.
 * @module dao/geoPackageConstants
 */

export class GeoPackageConstants {
  /**
   * Extension to GeoPackage files
   */
  public static readonly EXTENSION = 'gpkg';

  /**
   * Extension to GeoPackage extension files
   *
   * @deprecated in GeoPackage version 1.2
   */
  public static readonly EXTENDED_EXTENSION = 'gpkx';

  /**
   * GeoPackage Media Type (MIME type)
   *
   */
  public static readonly MEDIA_TYPE = 'application/geopackage+sqlite3';

  /**
   * GeoPackage application id
   */
  public static readonly APPLICATION_ID = 'GPKG';

  /**
   * GeoPackage user version
   *
   */
  public static readonly USER_VERSION = 10200;

  /**
   * Expected magic number
   */
  public static readonly GEOMETRY_MAGIC_NUMBER = 'GP';

  /**
   * Expected version 1 value
   */
  public static readonly GEOMETRY_VERSION_1 = 0;

  /**
   * SQLite header string prefix
   */
  public static readonly SQLITE_HEADER_PREFIX = 'SQLite format 3';

  /**
   * SQLite default application id
   *
   */
  public static readonly SQLITE_APPLICATION_ID = 'SQLite';

  /**
   * GeoPackage author
   */
  public static readonly EXTENSION_AUTHOR = GeoPackageConstants.EXTENSION;

  /**
   * Geometry extension prefix
   */
  public static readonly GEOMETRY_EXTENSION_PREFIX = 'geom';

  /**
   * Optional undefined Spatial Reference System definition value
   */
  public static readonly UNDEFINED_DEFINITION = 'undefined';
}
