/**
 * SchemaExtension module.
 * @module SchemaExtension
 * @see module:extension/BaseExtension
 */

import BaseExtension from '../baseExtension';
import Extension from '../extension';

class SchemaExtension extends BaseExtension {
  constructor(geoPackage) {
    super(geoPackage);
    this.extensionName = SchemaExtension.EXTENSION_NAME;
    this.extensionDefinition = SchemaExtension.EXTENSION_SCHEMA_DEFINITION;
  }
  getOrCreateExtension() {
    return this.getOrCreate(this.extensionName, null, null, this.extensionDefinition, Extension.READ_WRITE);
  }
}

SchemaExtension.EXTENSION_NAME = 'gpkg_schema';
SchemaExtension.EXTENSION_SCHEMA_AUTHOR = 'gpkg';
SchemaExtension.EXTENSION_SCHEMA_NAME_NO_AUTHOR = 'schema';
SchemaExtension.EXTENSION_SCHEMA_DEFINITION = 'http://www.geopackage.org/spec/#extension_schema';

module.exports = SchemaExtension;
