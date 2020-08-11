/**
 * SchemaExtension module.
 * @module SchemaExtension
 * @see module:extension/BaseExtension
 */

import { BaseExtension } from '../baseExtension';
import { Extension } from '../extension';
import { GeoPackage } from '../../geoPackage';
import { DataColumnsDao } from '../../dataColumns/dataColumnsDao';
import { DataColumnConstraintsDao } from '../../dataColumnConstraints/dataColumnConstraintsDao';

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
  getOrCreateExtension(): Extension {
    return this.getOrCreate(this.extensionName, null, null, this.extensionDefinition, Extension.READ_WRITE);
  }

  has() {
    return this.hasExtension(SchemaExtension.EXTENSION_NAME, null, null);
  }

  removeExtension() {
    if (this.geoPackage.isTable(DataColumnsDao.TABLE_NAME)) {
      this.geoPackage.dropTable(DataColumnsDao.TABLE_NAME);
    }
    if (this.geoPackage.isTable(DataColumnConstraintsDao.TABLE_NAME)) {
      this.geoPackage.dropTable(DataColumnConstraintsDao.TABLE_NAME);
    }
    try {
      if (this.extensionsDao.isTableExists()) {
        this.extensionsDao.deleteByExtension(SchemaExtension.EXTENSION_NAME);
      }
    } catch (e) {
      throw new Error('Failed to delete Schema extension. GeoPackage: ' + this.geoPackage.name);
    }
  }
}
