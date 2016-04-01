/**
 * GeoPackageValidate module.
 * @module validate/geoPackageValidate
 *
 */

var path = require('path')
  , async = require('async')
  , SpatialReferenceSystem = require('../dao/spatialReferenceSystem')
  , Contents = require('../dao/contents')
  , GeoPackageConstants = require('../geoPackageConstants');

/**
 * Check the file extension to see if it is a GeoPackage
 * @param  {string}   filePath Absolute path to the GeoPackage to create
 * @return {boolean} true if GeoPackage extension
 */
exports.hasGeoPackageExtension = function(filePath) {
  var extension = path.extname(filePath);
  return extension && extension !== ''
    && (extension.toLowerCase() === '.'+GeoPackageConstants.GEOPACKAGE_EXTENSION.toLowerCase()
      || extension.toLowerCase() === '.'+GeoPackageConstants.GEOPACKAGE_EXTENDED_EXTENSION.toLowerCase());
}

/**
 * Validate the extension file as a GeoPackage
 * @param  {string}   filePath Absolute path to the GeoPackage to create
 * @return {Error}    error if the extension is not valid
 */
exports.validateGeoPackageExtension = function(filePath) {
  if (!exports.hasGeoPackageExtension(filePath)) {
    return new Error("GeoPackage database file '" + filePath
  					+ "' does not have a valid extension of '"
  					+ GeoPackageConstants.GEOPACKAGE_EXTENSION + "' or '"
  					+ GeoPackageConstants.GEOPACKAGE_EXTENDED_EXTENSION + "'");
  }
}

/**
 * Check the GeoPackage for the minimum required tables
 * @param  {Object}   geoPackage GeoPackage to check
 * @param {module:validate/geoPackageValidate~validationCallback} callback - The validation callback
 */
exports.hasMinimumTables = function(geoPackage, callback) {
  async.series([
    function(callback) {
      geoPackage.getSpatialReferenceSystemDao().isTableExists(callback);
    },
    function(callback) {
      geoPackage.getContentsDao().isTableExists(callback);
    }
  ], callback);
}


/**
 * Validate the GeoPackage has the minimum required tables
 *
 * @param {Object} geoPackage
 * @param {module:validate/geoPackageValidate~validationCallback} callback - The validation callback
 */
exports.validateMinimumTables = function(geoPackage, callback) {
	hasMinimumTables(geoPackage, function(err) {
    if (err) {
      callback(new Error(
      	"Invalid GeoPackage. Does not contain required tables: "
      			+ SpatialReferenceSystem.TABLE_NAME + " & "
      			+ Contents.TABLE_NAME + ", GeoPackage Name: "
      			+ geoPackage.getName()));
    } else {
      callback();
    }
  });
}

/**
 * Validation callback is passed an error if the validation failed.
 * @callback module:validate/geoPackageValidate~validationCallback
 * @param {Error} null if no error, otherwise describes the error
 */
