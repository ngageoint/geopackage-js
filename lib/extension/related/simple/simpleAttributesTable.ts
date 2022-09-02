/**
 * simpleAttributesTable module.
 * @module extension/relatedTables
 */
import { UserRelatedTable } from '../userRelatedTable';
import { RelationType } from '../relationType';
import { UserColumn } from '../../../user/userColumn';
import { GeoPackageDataType } from '../../../db/geoPackageDataType';
import { SimpleAttributesTableMetadata } from './simpleAttributesTableMetadata';
import { UserCustomColumn } from '../../../user/custom/userCustomColumn';
import { UserCustomTable } from '../../../user/custom/userCustomTable';

/**
 * Simple Attributes Requirements Class User-Defined Related Data Table
 */
export class SimpleAttributesTable extends UserRelatedTable {
  public static readonly RELATION_TYPE: RelationType = RelationType.SIMPLE_ATTRIBUTES;
  public static readonly COLUMN_ID: string = 'id';

  /**
   * Constructor
   * @param tableName table name
   * @param columns list of columns
   * @param idColumnName id column name
   */
  constructor(tableName: string, columns: UserCustomColumn[], idColumnName: string);

  /**
   * Constructor
   * @param table user custom table
   */
  constructor(table: UserCustomTable);

  /**
   * Constructor
   * @param args
   */
  constructor(...args) {
    if (args.length === 1 && args[0] instanceof UserCustomTable) {
      const table = args[0];
      super(SimpleAttributesTable.RELATION_TYPE.getName(), SimpleAttributesTable.RELATION_TYPE.getDataType(), table);
      this.validateColumns();
    } else if (args.length >= 2) {
      const tableName = args[0];
      const columns = args[1];
      const idColumnName = (args.length === 3 ? args[2] : null) || SimpleAttributesTable.COLUMN_ID;
      super(
        tableName,
        SimpleAttributesTable.RELATION_TYPE.getName(),
        SimpleAttributesTable.RELATION_TYPE.getDataType(),
        columns,
        SimpleAttributesTable.requiredColumns(idColumnName),
      );
      this.validateColumns();
    }
  }

  /**
   * Validate that Simple Attributes columns to verify at least one non id
   * column exists and that all columns are simple data types
   */
  validateColumns(): boolean {
    const columns = this.columns;
    if (columns.getColumns().length < 2) {
      throw new Error('Simple Attributes Tables require at least one non id column');
    }
    for (let i = 0; i < columns.getColumns().length; i++) {
      const column = columns.getColumns()[i];
      if (!SimpleAttributesTable.isSimple(column)) {
        throw new Error(
          'Simple Attributes Tables only support simple data types. Column: ' +
            column.getName() +
            ', Non Simple Data Type: ' +
            GeoPackageDataType.nameFromType(column.getDataType()),
        );
      }
    }
    return true;
  }
  /**
   * Create a simple attributes table with the columns
   * @param  {string} tableName name of the table
   * @param  {module:user/userColumn~UserColumn[]} additionalColumns additional columns
   * @return {module:extension/relatedTables~SimpleAttributesTable}
   */
  static create(tableName: string, additionalColumns?: UserColumn[]): SimpleAttributesTable {
    let tableColumns = SimpleAttributesTable.createRequiredColumns(0);
    if (additionalColumns) {
      tableColumns = tableColumns.concat(additionalColumns);
    }
    return new SimpleAttributesTable(tableName, tableColumns, null);
  }

  /**
   * Create a simple attributes table with the metadata
   * @param metadata simple attributes table metadata
   * @return simple attributes table
   */
  public static createFromMetadata(metadata: SimpleAttributesTableMetadata): SimpleAttributesTable {
    const columns = metadata.buildColumns();
    return new SimpleAttributesTable(metadata.getTableName(), columns, metadata.getIdColumnName());
  }
  /**
   * Get the required columns
   * @param  {string} [idColumnName=id] id column name
   * @return {string[]}
   */
  static requiredColumns(idColumnName = SimpleAttributesTable.COLUMN_ID): string[] {
    const requiredColumns = [];
    requiredColumns.push(idColumnName);
    return requiredColumns;
  }
  /**
   * Get the number of required columns
   * @return {Number}
   */
  static numRequiredColumns(): number {
    return SimpleAttributesTable.requiredColumns().length;
  }
  /**
   * Create the required columns
   * @param  {Number} [startingIndex=0] starting index of the required columns
   * @param  {string} [idColumnName=id]  id column name
   * @param  {boolean} autoincrement
   * @return {module:user/userColumn~UserColumn[]}
   */
  static createRequiredColumns(
    startingIndex = 0,
    idColumnName = SimpleAttributesTable.COLUMN_ID,
    autoincrement?: boolean,
  ): UserColumn[] {
    return [SimpleAttributesTable.createIdColumn(startingIndex++, idColumnName, autoincrement)];
  }
  /**
   * Create the primary key id column
   * @param  {Number} index        index of the column
   * @param  {string} idColumnName name of the id column
   * @param  {boolean} autoincrement
   * @return {module:user/userColumn~UserColumn}
   */
  static createIdColumn(index: number, idColumnName: string, autoincrement?: boolean): UserColumn {
    return UserCustomColumn.createPrimaryKeyColumn(index, idColumnName, autoincrement);
  }
  /**
   * Determine if the column is a simple column
   * @param  {module:user/userColumn~UserColumn} column column to check
   * @return {Boolean}
   */
  static isSimple(column: UserColumn): boolean {
    return column.isNotNull() && SimpleAttributesTable.isSimpleDataType(column.getDataType());
  }
  /**
   * Determine if the data type is a simple type: TEXT, INTEGER, or REAL
   * @param {module:db/geoPackageDataType~GPKGDataType} dataType
   * @return {Boolean}
   */
  static isSimpleDataType(dataType: GeoPackageDataType): boolean {
    return dataType !== GeoPackageDataType.BLOB;
  }
}
