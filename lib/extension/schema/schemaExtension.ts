import { BaseExtension } from '../baseExtension';
import { Extensions } from '../extensions';
import { ExtensionScopeType } from '../extensionScopeType';
import { DataColumns } from './columns/dataColumns';
import { DataColumnConstraints } from './constraints/dataColumnConstraints';
import type { GeoPackage } from '../../geoPackage';

/**
 * SchemaExtension module.
 * @module SchemaExtension
 * @see module:extension/BaseExtension
 */
export class SchemaExtension extends BaseExtension {
  public static readonly EXTENSION_SCHEMA_AUTHOR: string = 'gpkg';
  public static readonly EXTENSION_SCHEMA_NAME_NO_AUTHOR: string = 'schema';
  public static readonly EXTENSION_NAME: string =
    SchemaExtension.EXTENSION_SCHEMA_AUTHOR + '_' + SchemaExtension.EXTENSION_SCHEMA_NAME_NO_AUTHOR;
  public static readonly EXTENSION_SCHEMA_DEFINITION: string = 'http://www.geopackage.org/spec/#extension_schema';

  constructor(geoPackage: GeoPackage) {
    super(geoPackage);
  }
  getOrCreateExtension(): Extensions[] {
    const extensions = [];
    extensions.push(
      this.getOrCreate(
        SchemaExtension.EXTENSION_NAME,
        DataColumns.TABLE_NAME,
        null,
        SchemaExtension.EXTENSION_SCHEMA_DEFINITION,
        ExtensionScopeType.READ_WRITE,
      ),
    );
    extensions.push(
      this.getOrCreate(
        SchemaExtension.EXTENSION_NAME,
        DataColumnConstraints.TABLE_NAME,
        null,
        SchemaExtension.EXTENSION_SCHEMA_DEFINITION,
        ExtensionScopeType.READ_WRITE,
      ),
    );
    return extensions;
  }

  has(): boolean {
    return this.hasExtensions(SchemaExtension.EXTENSION_NAME);
  }

  removeExtension(): void {
    if (this.geoPackage.isTable(DataColumns.TABLE_NAME)) {
      this.geoPackage.dropTable(DataColumns.TABLE_NAME);
    }
    if (this.geoPackage.isTable(DataColumns.TABLE_NAME)) {
      this.geoPackage.dropTable(DataColumns.TABLE_NAME);
    }
    if (this.extensionsDao.isTableExists()) {
      this.extensionsDao.deleteByExtension(SchemaExtension.EXTENSION_NAME);
    }
  }
}
