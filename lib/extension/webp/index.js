/**
 * WebPExtension module.
 * @module WebPExtension
 * @see module:extension/BaseExtension
 */

var BaseExtension = require('../baseExtension')
  , Extension = require('../.').Extension;

var util = require('util');

var WebPExtension = function(geoPackage, tableName) {
  BaseExtension.call(this, geoPackage);

  this.tableName = tableName;
}

util.inherits(WebPExtension, BaseExtension);

WebPExtension.prototype.getOrCreateExtension = function() {
  return this.getOrCreate(WebPExtension.EXTENSION_NAME, this.tableName, 'tile_data', WebPExtension.EXTENSION_WEBP_DEFINITION, Extension.READ_WRITE);
};

WebPExtension.EXTENSION_NAME = 'gpkg_webp';
WebPExtension.EXTENSION_WEBP_AUTHOR = 'gpkg';
WebPExtension.EXTENSION_WEBP_NAME_NO_AUTHOR = 'webp';
WebPExtension.EXTENSION_WEBP_DEFINITION = 'http://www.geopackage.org/spec/#extension_webp';

module.exports.WebPExtension = WebPExtension;
