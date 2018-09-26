/**
 * CrsWktExtension module.
 * @module extension/crsWkt
 */

var BaseExtension = require('../baseExtension')
  , Extension = require('../.').Extension;

var util = require('util');

/**
 * OGC Well known text representation of Coordinate Reference Systems extensionName
 * @param  {module:geoPackage~GeoPackage} geoPackage GeoPackage object
 * @class
 * @extends {module:extension/baseExtension~BaseExtension}
 */
var CrsWktExtension = function(geoPackage) {
  BaseExtension.call(this, geoPackage);

  this.extensionName = CrsWktExtension.EXTENSION_NAME;

  this.extensionDefinition = CrsWktExtension.EXTENSION_CRS_WKT_DEFINITION;
}

util.inherits(CrsWktExtension, BaseExtension);

/**
 * Get or create the extension
 * @return {Promise<module:extension/crsWkt~CrsWktExtension>}
 */
CrsWktExtension.prototype.getOrCreateExtension = function() {
  return this.getOrCreate(this.extensionName, null, null, this.extensionDefinition, Extension.READ_WRITE);
};

CrsWktExtension.EXTENSION_NAME = 'gpkg_crs_wkt';
CrsWktExtension.EXTENSION_CRS_WKT_AUTHOR = 'gpkg';
CrsWktExtension.EXTENSION_CRS_WKT_NAME_NO_AUTHOR = 'crs_wkt';
CrsWktExtension.EXTENSION_CRS_WKT_DEFINITION = 'http://www.geopackage.org/spec/#extension_crs_wkt';

module.exports.CrsWktExtension = CrsWktExtension;
