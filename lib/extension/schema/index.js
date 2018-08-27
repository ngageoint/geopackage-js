/**
 * SchemaExtension module.
 * @module SchemaExtension
 * @see module:extension/BaseExtension
 */

var BaseExtension = require('../baseExtension')
  , Extension = require('../.').Extension;

var util = require('util');

var SchemaExtension = function(geoPackage) {
  BaseExtension.call(this, geoPackage);

  this.extensionName = SchemaExtension.EXTENSION_NAME;

  this.extensionDefinition = SchemaExtension.EXTENSION_SCHEMA_DEFINITION;
}

util.inherits(SchemaExtension, BaseExtension);

SchemaExtension.prototype.getOrCreateExtension = function() {
  return this.getOrCreate(this.extensionName, null, null, this.extensionDefinition, Extension.READ_WRITE);
};

SchemaExtension.EXTENSION_NAME = 'gpkg_schema';
SchemaExtension.EXTENSION_SCHEMA_AUTHOR = 'gpkg';
SchemaExtension.EXTENSION_SCHEMA_NAME_NO_AUTHOR = 'schema';
SchemaExtension.EXTENSION_SCHEMA_DEFINITION = 'http://www.geopackage.org/spec/#extension_schema';

module.exports.SchemaExtension = SchemaExtension;
