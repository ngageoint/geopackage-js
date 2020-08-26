import { Dao } from '../dao/dao';
import { ContentsDao } from '../core/contents/contentsDao';
import { DataColumns } from './dataColumns';
import { Contents } from '../core/contents/contents';
import { DBValue } from '../db/dbAdapter';
/**
 * DataColumns module.
 * @module dataColumns
 */

/**
 * Contents object. Provides identifying and descriptive information that an
 * application can display to a user in a menu of geospatial data that is
 * available for access and/or update.
 * @class
 * @extends Dao
 * @param  {module:geoPackage~GeoPackage} geoPackage GeoPackage object
 */
export class DataColumnsDao extends Dao<DataColumns> {
  public static readonly TABLE_NAME: string = 'gpkg_data_columns';
  public static readonly COLUMN_PK1: string = 'table_name';
  public static readonly COLUMN_PK2: string = 'column_name';
  public static readonly COLUMN_TABLE_NAME: string = 'table_name';
  public static readonly COLUMN_COLUMN_NAME: string = 'column_name';
  public static readonly COLUMN_NAME: string = 'name';
  public static readonly COLUMN_TITLE: string = 'title';
  public static readonly COLUMN_DESCRIPTION: string = 'description';
  public static readonly COLUMN_MIME_TYPE: string = 'mime_type';
  public static readonly COLUMN_CONSTRAINT_NAME: string = 'constraint_name';

  readonly gpkgTableName: string = DataColumnsDao.TABLE_NAME;
  readonly idColumns: string[] = [DataColumnsDao.COLUMN_PK1, DataColumnsDao.COLUMN_PK2];

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
    const cd = new ContentsDao(this.geoPackage);
    return cd.queryForId(dataColumns.table_name);
  }
  /**
   * Query by constraint name
   * @param  {String} constraintName     constraint name
   * @return {Iterable.<Object>} iterator of database objects
   */
  queryByConstraintName(constraintName: string): IterableIterator<DataColumns> {
    return (this.queryForEach(DataColumnsDao.COLUMN_CONSTRAINT_NAME, constraintName) as unknown) as IterableIterator<
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
      this.buildWhereWithFieldAndValue(DataColumnsDao.COLUMN_TABLE_NAME, tableName) +
      ' and ' +
      this.buildWhereWithFieldAndValue(DataColumnsDao.COLUMN_COLUMN_NAME, columnName);
    const values = [tableName, columnName];
    let dataColumn: DataColumns;
    for (const row of this.queryWhere(where, values)) {
      dataColumn = this.createObject(row);
    }
    return dataColumn;
  }

  deleteByTableName(table: string): number {
    let where = '';
    where += this.buildWhereWithFieldAndValue(DataColumnsDao.COLUMN_TABLE_NAME, table);
    const whereArgs = this.buildWhereArgs(table);
    return this.deleteWhere(where, whereArgs);
  }
}
