import { GeoPackageDao } from '../../../db/geoPackageDao';
import { GeoPackage } from '../../../geoPackage';
import { TableIndex } from './tableIndex';
import { GeoPackageConnection } from '../../../db/geoPackageConnection';
import { GeometryIndexDao } from './geometryIndexDao';
import { DBValue } from '../../../db/dbValue';
import { GeoPackageException } from '../../../geoPackageException';
import { ColumnValues } from '../../../dao/columnValues';
import { GeometryIndex } from './geometryIndex';
import { DateConverter } from '../../../db/dateConverter';

/**
 * Table Index Data Access Object
 */
export class TableIndexDao extends GeoPackageDao<TableIndex, string> {
  /**
   * Create the DAO
   *
   * @param geoPackageOrConnection GeoPackage | GeoPackageConnection
   * @return dao
   */
  public static createDao(geoPackageOrConnection: GeoPackage | GeoPackageConnection): TableIndexDao {
    return new TableIndexDao(
      geoPackageOrConnection instanceof GeoPackage ? geoPackageOrConnection.getDatabase() : geoPackageOrConnection,
    );
  }

  /**
   * Geometry Index DAO
   */
  private geometryIndexDao: GeometryIndexDao;

  /**
   * Constructor
   * @param db connection source
   */
  public constructor(db: GeoPackageConnection) {
    super(db, TableIndex.TABLE_NAME);
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
        const columnValues = new ColumnValues();
        columnValues.addColumn(GeometryIndex.COLUMN_TABLE_NAME, this.getTableName());
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
   * Get or create a Geometry Index DAO
   *
   * @return geometry index dao
   */
  private getGeometryIndexDao(): GeometryIndexDao {
    if (this.geometryIndexDao == null) {
      this.geometryIndexDao = GeometryIndexDao.create(this.db);
    }
    return this.geometryIndexDao;
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
