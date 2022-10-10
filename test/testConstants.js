var module = {
	exports: {},
};

/**
 * GeoPackage file extension
 */
module.exports.GEO_PACKAGE_EXTENSION = "gpkg";

/**
 * Test database name
 */
module.exports.TEST_DB_NAME = "test_db";

/**
 * Test database file name
 */
module.exports.TEST_DB_FILE_NAME = module.exports.TEST_DB_NAME + "." + module.exports.GEO_PACKAGE_EXTENSION;

/**
 * Import database name
 */
module.exports.IMPORT_DB_NAME = "import_db";

/**
 * Tiles database name
 */
module.exports.TILES_DB_NAME = "tiles";

/**
 * Tiles 2 database name
 */
module.exports.TILES2_DB_NAME = "tiles2";

/**
 * Related Tables database name
 */
module.exports.RTE_DB_NAME = "rte";

/**
 * Import database file name, located in the test assets
 */
module.exports.IMPORT_DB_FILE_NAME = module.exports.IMPORT_DB_NAME + "." + module.exports.GEO_PACKAGE_EXTENSION;

/**
 * Tiles database file name, located in the test assets
 */
module.exports.TILES_DB_FILE_NAME = module.exports.TILES_DB_NAME + "." + module.exports.GEO_PACKAGE_EXTENSION;

/**
 * Tiles 2 database file name, located in the test assets
 */
module.exports.TILES2_DB_FILE_NAME = module.exports.TILES2_DB_NAME + "." + module.exports.GEO_PACKAGE_EXTENSION;

/**
 * Related Tables Extension database file name, located in the test assets
 */
module.exports.RTE_DB_FILE_NAME = module.exports.RTE_DB_NAME + "." + module.exports.GEO_PACKAGE_EXTENSION;

/**
 * Import corrupt database name
 */
module.exports.IMPORT_CORRUPT_DB_NAME = "import_db_corrupt";

/**
 * Import corrupt database file name, located in the test assets
 */
module.exports.IMPORT_CORRUPT_DB_FILE_NAME = module.exports.IMPORT_CORRUPT_DB_NAME + "." + module.exports.GEO_PACKAGE_EXTENSION;

/**
 * Create coverage data database name
 */
module.exports.CREATE_COVERAGE_DATA_DB_NAME = "coverage_data";

/**
 * Create coverage data database file name
 */
module.exports.CREATE_COVERAGE_DATA_DB_FILE_NAME = module.exports.CREATE_COVERAGE_DATA_DB_NAME + "." + module.exports.GEO_PACKAGE_EXTENSION;

/**
 * Import coverage data database name
 */
module.exports.IMPORT_COVERAGE_DATA_DB_NAME = "coverage_data";

/**
 * Import coverage data tiff database name
 */
module.exports.IMPORT_COVERAGE_DATA_TIFF_DB_NAME = "coverage_data_tiff";

/**
 * Import coverage data database file name, located in the test assets
 */
module.exports.IMPORT_COVERAGE_DATA_DB_FILE_NAME = module.exports.IMPORT_COVERAGE_DATA_DB_NAME + "." + module.exports.GEO_PACKAGE_EXTENSION;

/**
 * Import coverage data tiff database file name, located in the test assets
 */
module.exports.IMPORT_COVERAGE_DATA_TIFF_DB_FILE_NAME = module.exports.IMPORT_COVERAGE_DATA_TIFF_DB_NAME + "." + module.exports.GEO_PACKAGE_EXTENSION;

/**
 * Tile file name extension
 */
module.exports.TILE_FILE_NAME_EXTENSION = "png";

/**
 * Tile file name
 */
module.exports.TILE_FILE_NAME = "tile." + module.exports.TILE_FILE_NAME_EXTENSION;

/**
 * Tiles database table name
 */
module.exports.TILES_DB_TABLE_NAME = "tiles";

/**
 * Tiles 2 database table name
 */
module.exports.TILES2_DB_TABLE_NAME = "imagery";

/**
 * Coverage Data table name
 */
module.exports.CREATE_COVERAGE_DATA_DB_TABLE_NAME = "coverages";

/**
 * Tiles 2 database Web Mercator test image
 */
module.exports.TILES2_WEB_MERCATOR_TEST_IMAGE = "webMercator.png";

/**
 * Tiles 2 database WGS84 test image
 */
module.exports.TILES2_WGS84_TEST_IMAGE = "wgs84.png";

/**
 * Tiles 2 database WGS84 raw test image
 */
module.exports.TILES2_WGS84_TEST_RAW_IMAGE = "wgs84Raw.png";

/**
 * Point icon image extension
 */
module.exports.ICON_POINT_IMAGE_EXTENSION = "png";

/**
 * Point icon image
 */
module.exports.ICON_POINT_IMAGE = "point." + module.exports.ICON_POINT_IMAGE_EXTENSION;

export default module.exports;

