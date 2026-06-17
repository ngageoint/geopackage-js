import { BaseExtension } from '../baseExtension';
import { Extensions } from '../extensions';
import { ExtensionScopeType } from '../extensionScopeType';
import { DataColumns } from './columns/dataColumns';
import { DataColumnConstraints } from './constraints/dataColumnConstraints';
import type { GeoPackage } from '../../geoPackage';
import { DataColumnsDao } from './columns/dataColumnsDao';
import { GeoPackageException } from '../../geoPackageException';
import { DataColumnConstraintsDao } from './constraints/dataColumnConstraintsDao';

/**
 * SchemaExtension
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

  /**
   * Get a Data Columns DAO
   * @return Data Columns DAO
   */
  public getDataColumnsDao(): DataColumnsDao {
    return SchemaExtension.getDataColumnsDao(this.geoPackage);
  }

  /**
   * Get a Data Columns DAO
   * @param geoPackage GeoPackage
   * @return Data Columns DAO
   */
  public static getDataColumnsDao(geoPackage: GeoPackage): DataColumnsDao {
    return DataColumnsDao.createDao(geoPackage);
  }

  /**
   * Create the Data Columns table if it does not already exist
   * @return true if created
   */
  public createDataColumnsTable(): boolean {
    this.verifyWritable();

    let created = false;
    const dao = this.getDataColumnsDao();
    try {
      if (!dao.isTableExists()) {
        created = this.geoPackage.getTableCreator().createDataColumns();
      }
    } catch (e) {
      throw new GeoPackageException('Failed to check if DataColumns table exists and create it');
    }
    return created;
  }

  /**
   * Get a Data Column Constraints DAO
   * @return Data Column Constraints DAO
   */
  public getDataColumnConstraintsDao(): DataColumnConstraintsDao {
    return SchemaExtension.getDataColumnConstraintsDao(this.geoPackage);
  }

  /**
   * Get a Data Column Constraints DAO
   * @param geoPackage GeoPackage
   * @return Data Column Constraints DAO
   */
  public static getDataColumnConstraintsDao(geoPackage: GeoPackage): DataColumnConstraintsDao {
    return DataColumnConstraintsDao.createDao(geoPackage);
  }

  /**
   * Create the Data Column Constraints table if it does not already exist
   * @return true if created
   */
  public createDataColumnConstraintsTable(): boolean {
    this.verifyWritable();

    let created = false;
    const dao = this.getDataColumnConstraintsDao();
    try {
      if (!dao.isTableExists()) {
        created = this.geoPackage.getTableCreator().createDataColumnConstraints();
        if (created) {
          // Create the schema extension record
          this.getOrCreateExtension();
        }
      }
    } catch (e) {
      throw new GeoPackageException('Failed to check if DataColumnConstraints table exists and create it');
    }
    return created;
  }
}
