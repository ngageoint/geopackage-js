import { GeoPackageDao } from '../../../db/geoPackageDao';
import { TableIndex } from './tableIndex';
import { GeometryIndexDao } from './geometryIndexDao';
import { DBValue } from '../../../db/dbValue';
import { GeoPackageException } from '../../../geoPackageException';
import { FieldValues } from '../../../dao/fieldValues';
import { GeometryIndex } from './geometryIndex';
import { DateConverter } from '../../../db/dateConverter';
import type { GeoPackage } from '../../../geoPackage';

/**
 * Table Index Data Access Object
 */
export class TableIndexDao extends GeoPackageDao<TableIndex, string> {
  readonly gpkgTableName: string = TableIndex.TABLE_NAME;
  readonly idColumns: string[] = [TableIndex.COLUMN_TABLE_NAME];

  /**
   * Create the DAO
   *
   * @param geoPackage GeoPackage
   * @return dao
   */
  public static createDao(geoPackage: GeoPackage): TableIndexDao {
    return new TableIndexDao(geoPackage);
  }

  /**
   * Constructor
   * @param geoPackage GeoPackage
   */
  public constructor(geoPackage: GeoPackage) {
    super(geoPackage, TableIndex.TABLE_NAME);
  }

  /**
   *
   * @param result
   */
  createObject(result: Record<string, DBValue>): TableIndex {
    const tableIndex = new TableIndex();
    if (result) {
      tableIndex.setTableName(result.table_name as string);
      tableIndex.setLastIndexed(DateConverter.convert(result.last_indexed as string));
    }
    return tableIndex;
  }

  queryForIdWithKey(key: string): TableIndex {
    return this.queryForId(key);
  }

  /**
   * Delete the TableIndex, cascading
   *
   * @param tableIndex table index
   * @return rows deleted
   */
  public deleteCascade(tableIndex: TableIndex): number {
    let count = 0;
    if (tableIndex != null) {
      // Delete Geometry Indices
      const geometryIndexDao = this.getGeometryIndexDao();
      if (geometryIndexDao.isTableExists()) {
        const columnValues = new FieldValues();
        columnValues.addFieldValue(GeometryIndex.COLUMN_TABLE_NAME, this.getTableName());
        geometryIndexDao.deleteWhere(this.buildWhere(columnValues), this.buildWhereArgs([tableIndex.getTableName()]));
      }
      count = this.delete(tableIndex);
    }
    return count;
  }

  /**
   * Delete a TableIndex by id, cascading
   *
   * @param id
   *            id
   * @return rows deleted
   * @throws SQLException
   *             upon deletion failure
   */
  public deleteByIdCascade(id: string): number {
    let count = 0;
    if (id != null) {
      const tableIndex = this.queryForId(id);
      if (tableIndex != null) {
        count = this.deleteCascade(tableIndex);
      }
    }
    return count;
  }

  /**
   * Delete the table
   * @param table table name
   */
  public deleteTable(table: string): void {
    try {
      this.deleteByIdCascade(table);
    } catch (e) {
      throw new GeoPackageException('Failed to delete table: ' + table);
    }
  }

  /**
   * Gets the table index for a given geometry index
   * @param geometryIndex
   */
  getTableIndexForGeometryIndex(geometryIndex: GeometryIndex): TableIndex {
    return this.queryForId(geometryIndex.getTableName());
  }

  /**
   * Get or create a Geometry Index DAO
   *
   * @return geometry index dao
   */
  private getGeometryIndexDao(): GeometryIndexDao {
    return this.geoPackage.getGeometryIndexDao();
  }

  /**
   * Delete all table indices, cascading to geometry indices
   *
   * @return rows deleted
   */
  public deleteAllCascade(): number {
    // Delete Geometry Indices
    this.getGeometryIndexDao().deleteAll();
    return this.deleteAll();
  }

  /**
   * Delete all table indices
   *
   * @return rows deleted
   */
  public deleteAll(): number {
    let count = 0;
    if (this.isTableExists()) {
      count = super.deleteAll();
    }
    return count;
  }
}
