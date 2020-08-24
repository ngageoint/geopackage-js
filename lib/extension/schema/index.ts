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
  public static readonly EXTENSION_SCHEMA_AUTHOR: string = 'gpkg';
  public static readonly EXTENSION_SCHEMA_NAME_NO_AUTHOR: string = 'schema';
  public static readonly EXTENSION_NAME: string = SchemaExtension.EXTENSION_SCHEMA_AUTHOR + '_' + SchemaExtension.EXTENSION_SCHEMA_NAME_NO_AUTHOR;
  public static readonly EXTENSION_SCHEMA_DEFINITION: string = 'http://www.geopackage.org/spec/#extension_schema';

  constructor(geoPackage: GeoPackage) {
    super(geoPackage);
  }
  getOrCreateExtension(): Extension[] {
    let extensions = [];
    extensions.push(this.getOrCreate(SchemaExtension.EXTENSION_NAME, DataColumnsDao.TABLE_NAME, null, SchemaExtension.EXTENSION_SCHEMA_DEFINITION, Extension.READ_WRITE));
    extensions.push(this.getOrCreate(SchemaExtension.EXTENSION_NAME, DataColumnConstraintsDao.TABLE_NAME, null, SchemaExtension.EXTENSION_SCHEMA_DEFINITION, Extension.READ_WRITE));
    return extensions;
  }

  has() {
    return this.hasExtensions(SchemaExtension.EXTENSION_NAME);
  }

  removeExtension() {
    if (this.geoPackage.isTable(DataColumnsDao.TABLE_NAME)) {
      this.geoPackage.dropTable(DataColumnsDao.TABLE_NAME);
    }
    if (this.geoPackage.isTable(DataColumnConstraintsDao.TABLE_NAME)) {
      this.geoPackage.dropTable(DataColumnConstraintsDao.TABLE_NAME);
    }
    if (this.extensionsDao.isTableExists()) {
      this.extensionsDao.deleteByExtension(SchemaExtension.EXTENSION_NAME);
    }
  }
}
