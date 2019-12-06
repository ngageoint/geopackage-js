/**
 * SchemaExtension module.
 * @module SchemaExtension
 * @see module:extension/BaseExtension
 */

import BaseExtension from '../baseExtension';
import Extension from '../extension';

export default class SchemaExtension extends BaseExtension {
  public static readonly EXTENSION_NAME = 'gpkg_schema';
  public static readonly EXTENSION_SCHEMA_AUTHOR = 'gpkg';
  public static readonly EXTENSION_SCHEMA_NAME_NO_AUTHOR = 'schema';
  public static readonly EXTENSION_SCHEMA_DEFINITION = 'http://www.geopackage.org/spec/#extension_schema';

  constructor(geoPackage) {
    super(geoPackage);
    this.extensionName = SchemaExtension.EXTENSION_NAME;
    this.extensionDefinition = SchemaExtension.EXTENSION_SCHEMA_DEFINITION;
  }
  getOrCreateExtension() {
    return this.getOrCreate(this.extensionName, null, null, this.extensionDefinition, Extension.READ_WRITE);
  }
}