/**
 * GeoPackage Constants module.
 * @module dao/geoPackageConstants
 */

export class GeoPackageConstants {
/** @constant {string} GEOPACKAGE_EXTENSION Extension to GeoPackage files */
public static readonly GEOPACKAGE_EXTENSION = 'gpkg';
/** @constant {string} GEOPACKAGE_EXTENDED_EXTENSION Extension to GeoPackage extension files */
public static readonly GEOPACKAGE_EXTENDED_EXTENSION = 'gpkx';
/** @constant {string} APPLICATION_ID GeoPackage application id */
public static readonly APPLICATION_ID = 'GPKG';
/** @constant {string} USER_VERSION GeoPackage user version */
public static readonly USER_VERSION = '10200';
/** @constant {string} GEOPACKAGE_EXTENSION_AUTHOR GeoPackage author */
public static readonly GEOPACKAGE_EXTENSION_AUTHOR = exports.GEOPACKAGE_EXTENSION;
/** @constant {string} GEOMETRY_EXTENSION_PREFIX Geometry extension prefix */
public static readonly GEOMETRY_EXTENSION_PREFIX = 'geom';
/** @constant {string} GEOPACKAGE_GEOMETRY_MAGIX_NUMBER Expected magic number */
public static readonly GEOPACKAGE_GEOMETRY_MAGIC_NUMBER = 'GP';
/** @constant {string} GEOPACKAGE_GEOMETRY_VERSION_1 Expected version 1 value */
public static readonly GEOPACKAGE_GEOMETRY_VERSION_1 = 0;
/** @constant {string} SQLITE_HEADER_PREFIX SQLite header string prefix */
public static readonly SQLITE_HEADER_PREFIX = 'SQLite format 3';
}
