import Dao from '../dao/dao'
import ContentsDao from '../core/contents/contentsDao'
import DataColumns from './dataColumns'
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
export default class DataColumnsDao extends Dao<DataColumns> {
  public static readonly TABLE_NAME = "gpkg_data_columns";
  public static readonly COLUMN_PK1 = "table_name";
  public static readonly COLUMN_PK2 = "column_name";
  public static readonly COLUMN_TABLE_NAME = "table_name";
  public static readonly COLUMN_COLUMN_NAME = "column_name";
  public static readonly COLUMN_NAME = "name";
  public static readonly COLUMN_TITLE = "title";
  public static readonly COLUMN_DESCRIPTION = "description";
  public static readonly COLUMN_MIME_TYPE = "mime_type";
  public static readonly COLUMN_CONSTRAINT_NAME = "constraint_name";

  readonly gpkgTableName = DataColumnsDao.TABLE_NAME;
  readonly idColumns = [DataColumnsDao.COLUMN_PK1, DataColumnsDao.COLUMN_PK2];

  /**
   * Creates a new {module:dataColumns~DataColumns} object
   * @return {module:dataColumns~DataColumns}
   */
  createObject() {
    return new DataColumns();
  }
  /**
   * Get the Contents from the Data Columns
   * @param  {module:dataColumns~DataColumns} dataColumns data columns
   * @return {module:core/contents~Contents}             contents
   */
  getContents(dataColumns) {
    var cd = new ContentsDao(this.geoPackage);
    return cd.queryForId(dataColumns.table_name);
  }
  /**
   * Query by constraint name
   * @param  {String} constraintName     constraint name
   * @return {Iterable.<Object>} iterator of database objects
   */
  queryByConstraintName(constraintName) {
    return this.queryForEach(DataColumnsDao.COLUMN_CONSTRAINT_NAME, constraintName);
  }
  /**
   * Get DataColumn by column name and table name
   * @param  {String} tableName  table name
   * @param  {String} columnName column name
   * @return {module:dataColumns~DataColumns} 
   */
  getDataColumns(tableName, columnName) {
    var exists = this.isTableExists();
    if (!exists) {
      return;
    }
    var where = this.buildWhereWithFieldAndValue(DataColumnsDao.COLUMN_TABLE_NAME, tableName) +
      ' and ' +
      this.buildWhereWithFieldAndValue(DataColumnsDao.COLUMN_COLUMN_NAME, columnName);
    var values = [tableName, columnName];
    var dataColumn;
    for (var row of this.queryWhere(where, values)) {
      dataColumn = row;
    }
    return dataColumn;
  }
}
