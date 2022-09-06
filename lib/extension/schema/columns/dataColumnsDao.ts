import { DataColumns } from './dataColumns';
import { Contents } from '../../../contents/contents';
import { DBValue } from '../../../db/dbValue';
import { TableColumnKey } from '../../../db/tableColumnKey';
import { GeoPackageDao } from '../../../db/geoPackageDao';
import type { GeoPackage } from '../../../geoPackage';

/**
 * Contents object. Provides identifying and descriptive information that an
 * application can display to a user in a menu of geospatial data that is
 * available for access and/or update.
 */
export class DataColumnsDao extends GeoPackageDao<DataColumns, TableColumnKey> {
  readonly gpkgTableName: string = DataColumns.TABLE_NAME;
  readonly idColumns: string[] = [DataColumns.COLUMN_ID_1, DataColumns.COLUMN_ID_2];

  /**
   * Create DataColumns Dao from GeoPackageConnection
   * @param geoPackage
   */
  public static createDao(geoPackage: GeoPackage): DataColumnsDao {
    return new DataColumnsDao(geoPackage, DataColumns.TABLE_NAME);
  }

  queryForIdWithKey(key: TableColumnKey): DataColumns {
    return this.queryForMultiId([key.getTableName(), key.getColumnName()]);
  }

  /**
   * {@inheritDoc}
   */
  public extractId(data: DataColumns): TableColumnKey {
    return data.getId();
  }

  /**
   * Creates a new {module:dataColumns~DataColumns} object
   * @return {module:dataColumns~DataColumns}
   */
  createObject(results?: Record<string, DBValue>): DataColumns {
    const dc = new DataColumns();
    if (results) {
      dc.table_name = results.table_name as string;
      dc.column_name = results.column_name as string;
      dc.name = results.name as string;
      dc.title = results.title as string;
      dc.description = results.description as string;
      dc.mime_type = results.mime_type as string;
      dc.constraint_name = results.constraint_name as string;
    }
    return dc;
  }
  /**
   * Get the Contents from the Data Columns
   * @param  {module:dataColumns~DataColumns} dataColumns data columns
   * @return {module:core/contents~Contents}             contents
   */
  getContents(dataColumns: DataColumns): Contents {
    return this.geoPackage.getContentsDao().queryForId(dataColumns.getTableName());
  }
  /**
   * Query by constraint name
   * @param  {String} constraintName     constraint name
   * @return {Iterable.<Object>} iterator of database objects
   */
  queryByConstraintName(constraintName: string): IterableIterator<DataColumns> {
    return (this.queryForEach(DataColumns.COLUMN_CONSTRAINT_NAME, constraintName) as unknown) as IterableIterator<
      DataColumns
    >;
  }
  /**
   * Get DataColumn by column name and table name
   * @param  {String} tableName  table name
   * @param  {String} columnName column name
   * @return {module:dataColumns~DataColumns}
   */
  getDataColumns(tableName: string, columnName: string): DataColumns {
    const exists = this.isTableExists();
    if (!exists) {
      return;
    }
    const where =
      this.buildWhereWithFieldAndValue(DataColumns.COLUMN_TABLE_NAME, tableName) +
      ' and ' +
      this.buildWhereWithFieldAndValue(DataColumns.COLUMN_COLUMN_NAME, columnName);
    const values = [tableName, columnName];
    let dataColumn: DataColumns;
    for (const row of this.queryWhere(where, values)) {
      dataColumn = this.createObject(row);
    }
    return dataColumn;
  }

  /**
   * Check if the ID exists
   * @param id
   */
  public idExists(id: TableColumnKey): boolean {
    return this.queryForIdWithKey(id) != null;
  }

  /**
   * Queries for the data columns object in the database that matches the key of the data columns passed in.
   * @param data
   */
  public queryForSameId(data: DataColumns): DataColumns {
    return this.queryForIdWithKey(data.getId());
  }

  /**
   * {@inheritDoc}
   */
  public updateId(data: DataColumns, newId: TableColumnKey): number {
    let count = 0;
    const readData = this.queryForIdWithKey(data.getId());
    if (readData != null && newId != null) {
      readData.setId(newId);
      count = this.update(readData).changes;
    }
    return count;
  }

  /**
   * Get DataColumn by column name and table name
   *
   * @param tableName
   *            table name to query for
   * @param columnName
   *            column name to query for
   * @return DataColumns
   */
  public getDataColumn(tableName: string, columnName: string): DataColumns {
    return this.queryForIdWithKey(new TableColumnKey(tableName, columnName));
  }

  /**
   * Query by table name
   *
   * @param tableName
   *            table name
   * @return data columns
   */
  public queryByTable(tableName: string): DataColumns[] {
    return this.queryForAllEq(DataColumns.COLUMN_TABLE_NAME, tableName).map(result => this.createObject(result));
  }

  /**
   * Delete by table name
   *
   * @param tableName
   *            table name
   * @return rows deleted
   */
  public deleteByTableName(tableName: string): number {
    const where = this.buildWhereWithFieldAndValue(DataColumns.COLUMN_TABLE_NAME, tableName);
    const whereArgs = this.buildWhereArgs([tableName]);
    return this.deleteWhere(where, whereArgs);
  }
}
