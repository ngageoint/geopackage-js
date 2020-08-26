/**
 * simpleAttributesTable module.
 * @module extension/relatedTables
 */

import { UserRelatedTable } from './userRelatedTable';
import { RelationType } from './relationType';
import { UserColumn } from '../../user/userColumn';
import { GeoPackageDataType } from '../../db/geoPackageDataType';
/**
 * Simple Attributes Requirements Class User-Defined Related Data Table
 * @class
 * @extends UserRelatedTable
 * @param  {string} tableName table name
 * @param  {module:user/userColumn~UserColumn[]} columns   attribute columns
 * @param {string[]} requiredColumns required column names
 */
export class SimpleAttributesTable extends UserRelatedTable {
  public static readonly RELATION_TYPE: RelationType = RelationType.SIMPLE_ATTRIBUTES;
  public static readonly COLUMN_ID: string = 'id';

  readonly TABLE_TYPE: string = 'simple_attributes';

  constructor(tableName: string, columns?: UserColumn[], requiredColumns?: string[]) {
    super(
      tableName,
      SimpleAttributesTable.RELATION_TYPE.name,
      SimpleAttributesTable.RELATION_TYPE.dataType,
      columns,
      requiredColumns,
    );
    this.validateColumns();
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
            column.name +
            ', Non Simple Data Type: ' +
            column.dataType,
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
    return new SimpleAttributesTable(tableName, tableColumns, SimpleAttributesTable.requiredColumns());
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
   * @return {module:user/userColumn~UserColumn[]}
   */
  static createRequiredColumns(startingIndex = 0, idColumnName = 'id'): UserColumn[] {
    return [SimpleAttributesTable.createIdColumn(startingIndex++, idColumnName || SimpleAttributesTable.COLUMN_ID)];
  }
  /**
   * Create the primary key id column
   * @param  {Number} index        index of the column
   * @param  {string} idColumnName name of the id column
   * @return {module:user/userColumn~UserColumn}
   */
  static createIdColumn(index: number, idColumnName: string): UserColumn {
    return UserColumn.createPrimaryKeyColumn(index, idColumnName);
  }
  /**
   * Determine if the column is a simple column
   * @param  {module:user/userColumn~UserColumn} column column to check
   * @return {Boolean}
   */
  static isSimple(column: UserColumn): boolean {
    return column.notNull && SimpleAttributesTable.isSimpleDataType(column.dataType);
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
