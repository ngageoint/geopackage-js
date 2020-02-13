/**
 * SchemaExtension module.
 * @module SchemaExtension
 * @see module:extension/BaseExtension
 */

import { BaseExtension } from '../baseExtension';
import { Extension } from '../extension';
import { GeoPackage } from '../../geoPackage';

export class SchemaExtension extends BaseExtension {
  public static readonly EXTENSION_NAME: string = 'gpkg_schema';
  public static readonly EXTENSION_SCHEMA_AUTHOR: string = 'gpkg';
  public static readonly EXTENSION_SCHEMA_NAME_NO_AUTHOR: string = 'schema';
  public static readonly EXTENSION_SCHEMA_DEFINITION: string = 'http://www.geopackage.org/spec/#extension_schema';

  constructor(geoPackage: GeoPackage) {
    super(geoPackage);
    this.extensionName = SchemaExtension.EXTENSION_NAME;
    this.extensionDefinition = SchemaExtension.EXTENSION_SCHEMA_DEFINITION;
  }
  getOrCreateExtension(): Promise<Extension> {
    return this.getOrCreate(this.extensionName, null, null, this.extensionDefinition, Extension.READ_WRITE);
  }
}
