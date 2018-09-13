/**
 * MetadataExtension module.
 * @module extension/metadata
 */

var BaseExtension = require('../baseExtension')
  , Extension = require('../.').Extension;

var util = require('util');

/**
 * Metadata extension
 * @param  {module:geoPackage~GeoPackage} geoPackage GeoPackage object
 * @class
 * @extends {module:extension/baseExtension~BaseExtension}
 */
var MetadataExtension = function(geoPackage) {
  BaseExtension.call(this, geoPackage);

  this.extensionName = MetadataExtension.EXTENSION_NAME;

  this.extensionDefinition = MetadataExtension.EXTENSION_Metadata_DEFINITION;
}

util.inherits(MetadataExtension, BaseExtension);

/**
 * Get or create the metadata extension
 * @return {Promise}
 */
MetadataExtension.prototype.getOrCreateExtension = function() {
  return this.getOrCreate(this.extensionName, null, null, this.extensionDefinition, Extension.READ_WRITE);
};

MetadataExtension.EXTENSION_NAME = 'gpkg_metadata';
MetadataExtension.EXTENSION_Metadata_AUTHOR = 'gpkg';
MetadataExtension.EXTENSION_Metadata_NAME_NO_AUTHOR = 'metadata';
MetadataExtension.EXTENSION_Metadata_DEFINITION = 'http://www.geopackage.org/spec/#extension_metadata';

module.exports.MetadataExtension = MetadataExtension;
