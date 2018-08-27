/**
 * CrsWktExtension module.
 * @module CrsWktExtension
 * @see module:extension/BaseExtension
 */

var BaseExtension = require('../baseExtension')
  , Extension = require('../.').Extension;

var util = require('util');

var CrsWktExtension = function(geoPackage) {
  BaseExtension.call(this, geoPackage);

  this.extensionName = CrsWktExtension.EXTENSION_NAME;

  this.extensionDefinition = CrsWktExtension.EXTENSION_CRS_WKT_DEFINITION;
}

util.inherits(CrsWktExtension, BaseExtension);

CrsWktExtension.prototype.getOrCreateExtension = function() {
  return this.getOrCreate(this.extensionName, null, null, this.extensionDefinition, Extension.READ_WRITE);
};

CrsWktExtension.EXTENSION_NAME = 'gpkg_crs_wkt';
CrsWktExtension.EXTENSION_CRS_WKT_AUTHOR = 'gpkg';
CrsWktExtension.EXTENSION_CRS_WKT_NAME_NO_AUTHOR = 'crs_wkt';
CrsWktExtension.EXTENSION_CRS_WKT_DEFINITION = 'http://www.geopackage.org/spec/#extension_crs_wkt';

module.exports.CrsWktExtension = CrsWktExtension;
