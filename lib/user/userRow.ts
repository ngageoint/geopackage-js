import { UserTable } from './userTable';
import { GeoPackageDataType } from '../db/geoPackageDataType';
import { DBValue } from '../db/dbValue';
import { UserColumn } from './userColumn';
import { UserColumns } from './userColumns';
import { GeoPackageException } from '../geoPackageException';
import { ContentValues } from './contentValues';
import { DateConverter } from '../db/dateConverter';

export class UserRow<TColumn extends UserColumn, TTable extends UserTable<TColumn>> {
  /**
   * User table
   */
  protected readonly table: TTable;

  /**
   * User columns
   */
  protected readonly columns: UserColumns<TColumn>;

  /**
   * Column types of this row, based upon the data values
   */
  protected readonly columnTypes: GeoPackageDataType[];

  /**
   * Array of row values
   */
  protected readonly values: DBValue[];

  /**
   * Constructor
   * @param table
   */
  constructor(table: TTable);

  /**
   * Constructor
   * @param userRow
   */
  constructor(userRow: UserRow<TColumn, TTable>);

  /**
   * Cosnstructor
   * @param table
   * @param columns
   * @param columnTypes
   * @param values
   */
  constructor(table: TTable, columns: UserColumns<TColumn>, columnTypes: number[], values: DBValue[]);

  /**
   * User Row containing the values from a single result row
   * @param args
   */
  constructor(...args) {
    if (args.length === 1) {
      if (args[0] instanceof UserTable) {
        const table: TTable = args[0] as TTable;
        this.table = table;
        this.columns = table.getUserColumns();
        this.columnTypes = Array(this.columns.getColumns().length)
          .fill(0)
          .map((_, i) => i);
        this.values = Array(this.columns.getColumns().length)
          .fill(null)
          .map((_, i) => i);
        const columns = table.getColumns();
        for (let i = 0; i < columns.length; i++) {
          const column = columns[i];
          this.columnTypes[column.getIndex()] = column.getDataType();
          this.values[column.getIndex()] = column.getDefaultValue();
        }
      } else if (args[0] instanceof UserRow) {
        const userRow: UserRow<TColumn, TTable> = args[0];
        this.table = userRow.table;
        this.columns = userRow.columns;
        this.columnTypes = userRow.columnTypes;
        this.values = Array(this.columns.getColumns().length)
          .fill(null)
          .map((_, i) => i);
        for (let i = 0; i < userRow.values.length; i++) {
          const value = userRow.values[i];
          if (value != null) {
            const column = userRow.columns.getColumnForIndex(i);
            this.values[i] = this.copyValue(column, value);
          }
        }
      }
    } else if (args.length === 4) {
      this.table = args[0];
      this.columns = args[1];
      this.columnTypes = args[2];
      this.values = args[3];
    }
  }

  /**
   * Get the row values
   *
   * @return values
   */
  public getValues(): DBValue[] {
    return this.values;
  }

  /**
   * Get the row column data types
   *
   * @return row column types
   */
  public getRowColumnTypes(): number[] {
    return this.columnTypes;
  }

  /**
   * Gets the columns
   */
  public getColumns(): UserColumns<TColumn> {
    return this.columns;
  }

  /**
   * Copy the value of the data type
   *
   * @param column
   *            table column
   * @param value
   *            value
   * @return copy value
   */
  protected copyValue(column: TColumn, value: any): any {
    let copyValue = value;

    switch (column.getDataType()) {
      case GeoPackageDataType.BLOB:
        if (value instanceof Buffer) {
          copyValue = Buffer.from(value);
        } else if (value instanceof Uint8Array) {
          copyValue = Buffer.from(value);
        } else {
          throw new GeoPackageException(
            'Unsupported copy value type. column: ' + column.getName() + ', data type: ' + column.getDataType(),
          );
        }
        break;
      case GeoPackageDataType.DATE:
      case GeoPackageDataType.DATETIME:
        if (value instanceof Date) {
          copyValue = new Date(value);
        } else if (!(value instanceof String)) {
          throw new GeoPackageException(
            'Unsupported copy value type. column: ' + column.getName() + ', data type: ' + column.getDataType(),
          );
        }
        break;
      default:
    }

    return copyValue;
  }

  /**
   * Gets the id column
   * @return {UserColumn}
   */
  get idColumn(): UserColumn {
    return this.table.getPkColumn();
  }
  /**
   * Get the column count
   * @return {number} column count
   */
  get columnCount(): number {
    return this.table.getColumns().length;
  }
  /**
   * Get the column names
   * @return {Array} column names
   */
  get columnNames(): string[] {
    return this.table.getColumnNames();
  }
  /**
   * Get the column name at the index
   * @param  {Number} index index
   * @return {string}       column name
   */
  getColumnNameWithIndex(index: number): string {
    return this.table.getColumnName(index);
  }
  /**
   * Get the column index of the column name
   * @param  {string} columnName column name
   * @return {Number}            column index
   */
  getColumnIndexWithColumnName(columnName: string): number {
    return this.table.getColumnIndex(columnName);
  }
  /**
   * Get the value at the index
   * @param  {Number} index index
   * @return {object}       value
   */
  getValueWithIndex(index: number): any {
    let value = this.values[index];
    if (value !== undefined) {
      value = this.toObjectValue(index, value);
    }
    return value;
  }
  /**
   * Get the value of the column name
   * @param  {string} columnName column name
   * @return {Object}            value
   */
  getValue(columnName: string): any {
    const index = this.getColumnIndexWithColumnName(columnName);
    const value = this.values[index];
    if (value != null) {
      const dataType = this.getRowColumnTypeWithColumnName(columnName);
      if (dataType === GeoPackageDataType.BOOLEAN) {
        return value === 1;
      }
    }
    return value;
  }
  /**
   * Get the value from the database as an object based on the column
   * @param index column index
   * @param value value from the database
   */
  toObjectValue(index: number, value: DBValue): any {
    const objectValue = value;
    const column = this.getColumnWithIndex(index);
    if (column.getDataType() === GeoPackageDataType.BOOLEAN && value) {
      return value === 1;
    }
    return objectValue;
  }
  /**
   * Get the value which will be persisted to the database based on the column
   * @param columnName name of the column
   */
  toDatabaseValue(columnName: string): DBValue {
    const column = this.getColumn(columnName);
    const value = this.getValue(columnName);
    if (column.getDataType() === GeoPackageDataType.BOOLEAN) {
      return value === true ? 1 : 0;
    }
    return value;
  }
  /**
   * Get the row column type at the index
   * @param  {Number} index index
   * @return {Number}       row column type
   */
  getRowColumnTypeWithIndex(index: number): GeoPackageDataType {
    return this.columnTypes[index];
  }
  /**
   * Get the row column type of the column name
   * @param  {string} columnName column name
   * @return {Number}            row column type
   */
  getRowColumnTypeWithColumnName(columnName: string): number {
    return this.columnTypes[this.getColumnIndexWithColumnName(columnName)];
  }
  /**
   * Get the column at the index
   * @param  {Number} index index
   * @return {UserColumn}       column
   */
  getColumnWithIndex(index: number): UserColumn {
    return this.table.getColumnForIndex(index);
  }
  /**
   * Get the column of the column name
   * @param  {string} columnName column name
   * @return {UserColumn}            column
   */
  getColumn(columnName: string): UserColumn {
    return this.table.getColumn(columnName);
  }

  /**
   * Get the primary key column Index
   * @return {Number} pk index
   */
  get pkColumnIndex(): number {
    return this.table.getUserColumns().getPkColumnIndex();
  }
  /**
   * Get the primary key column
   * @return {UserColumn} pk column
   */
  get pkColumn(): UserColumn {
    return this.table.getPkColumn();
  }
  /**
   * Set the value at the index
   * @param {Number} index index
   * @param {object} value value
   */
  setValueWithIndex(index: number, value: any): void {
    if (index === this.table.getUserColumns().getPkColumnIndex()) {
      throw new GeoPackageException(
        'Cannot update the primary key of the row.  Table Name: ' +
          this.table.getTableName() +
          ', Index: ' +
          index +
          ', Name: ' +
          this.table.getPkColumnName(),
      );
    }
    const dataType = this.getRowColumnTypeWithIndex(index);
    if (dataType === GeoPackageDataType.BOOLEAN) {
      value === true ? (this.values[index] = 1) : (this.values[index] = 0);
    } else if (dataType === GeoPackageDataType.DATE) {
      this.values[index] = value.toISOString().slice(0, 10);
    } else if (dataType === GeoPackageDataType.DATETIME) {
      this.values[index] = value.toISOString();
    } else {
      this.values[index] = value;
    }
  }
  /**
   * Set the value at the index without validation
   * @param {Number} index index
   * @param {Object} value value
   */
  setValueNoValidationWithIndex(index: number, value: any): void {
    this.values[index] = value;
  }
  /**
   * Set the value of the column name
   * @param {string} columnName column name
   * @param {Object} value      value
   */
  setValue(columnName: string, value: any): void {
    const columnIndex = this.getColumnIndexWithColumnName(columnName);
    this.setValueWithIndex(columnIndex, value);
  }

  /**
   * Get the id value, which is the value of the primary key
   *
   * @return id
   */
  public getId(): number {
    let id;
    const index = this.columns.getPkColumnIndex();
    if (index < 0) {
      const error = ['Id column does not exist in '];
      if (this.columns.isCustom()) {
        error.push('custom specified table columns. ');
      }
      error.push('table: ' + this.columns.getTableName());
      if (this.columns.isCustom()) {
        error.push(', columns: ' + this.columns.getColumnNames());
      }
      throw new GeoPackageException(error.join(''));
    }
    const objectValue = this.getValueWithIndex(index);
    if (objectValue == null) {
      throw new GeoPackageException(
        'Row Id was null. table: ' +
          this.columns.getTableName() +
          ', index: ' +
          index +
          ', name: ' +
          this.columns.getPkColumn().getName(),
      );
    }
    if (typeof objectValue === 'number') {
      id = objectValue;
    } else {
      throw new GeoPackageException(
        'Row Id was not a number. table: ' +
          this.columns.getTableName() +
          ', index: ' +
          index +
          ', name: ' +
          this.columns.getPkColumn().getName() +
          ', value: ' +
          objectValue,
      );
    }
    return id;
  }
  hasIdColumn(): boolean {
    return this.table.getUserColumns().getPkColumnIndex() !== undefined;
  }
  hasId(): boolean {
    let hasId = false;
    if (this.hasIdColumn()) {
      const objectValue = this.getValueWithIndex(this.table.getUserColumns().getPkColumnIndex());
      hasId = objectValue !== null && objectValue !== undefined && typeof objectValue === 'number';
    }
    return hasId;
  }
  /**
   * Clears the id so the row can be used as part of an insert or create
   */
  resetId(): void {
    this.values[this.table.getPkColumnName()] = undefined;
  }

  /**
   * Set the id and optionally validate
   * @param id id value
   * @param pkModifiable primary key modifiable
   */
  public setId(id: number, pkModifiable = this.columns.isPkModifiable()): void {
    const index = this.columns.getPkColumnIndex();
    if (index >= 0) {
      if (!pkModifiable) {
        throw new GeoPackageException(
          'Can not update the primary key of the row. Table Name: ' +
            this.table.getTableName() +
            ', Index: ' +
            index +
            ', Name: ' +
            this.table.getPkColumnName(),
        );
      }
      this.values[index] = id;
    }
  }

  /**
   * Return the table
   */
  public getTable(): TTable {
    return this.table;
  }

  /**
   * Convert the row to content values
   * @param includeNulls include null values (default is true)
   * @return content values
   */
  public toContentValues(includeNulls = true): ContentValues {
    const contentValues = new ContentValues();
    for (const column of this.columns.getColumns()) {
      const value = this.values[column.getIndex()];
      if (!column.isPrimaryKey() || (value != null && this.columns.isPkModifiable())) {
        const columnName = column.getName();
        if (value != null) {
          this.columnToContentValue(contentValues, column, value);
        } else if (includeNulls) {
          contentValues.putNull(columnName);
        }
      }
    }
    if (contentValues.size() == 0) {
      for (const column of this.columns.getColumns()) {
        if (!column.isPrimaryKey()) {
          contentValues.putNull(column.getName());
        }
      }
    }
    return contentValues;
  }

  /**
   * Map the column to the content values
   * @param contentValues content values
   * @param column column
   * @param value value
   */
  protected columnToContentValue(contentValues: ContentValues, column: TColumn, value: any): void {
    const columnName = column.getName();
    if (typeof value === 'number') {
      this.validateValue(column, value, ['number']);
      contentValues.put(columnName, value);
    } else if (typeof value === 'string') {
      this.validateValue(column, value, ['Date', 'string']);
      const stringValue = value as string;
      if (column.getMax() != null && stringValue.length > column.getMax()) {
        throw new GeoPackageException(
          'String is larger than the column max. Size: ' +
            stringValue.length +
            ', Max: ' +
            column.getMax() +
            ', Column: ' +
            columnName,
        );
      }
      contentValues.put(columnName, stringValue);
    } else if (value instanceof Buffer || value instanceof Uint8Array) {
      this.validateValue(column, value, ['Buffer']);
      if (column.getMax() != null && value.length > column.getMax()) {
        throw new GeoPackageException(
          'Byte array is larger than the column max. Size: ' +
            value.length +
            ', Max: ' +
            column.getMax() +
            ', Column: ' +
            columnName,
        );
      }
      contentValues.put(columnName, value);
    } else if (typeof value === 'boolean') {
      this.validateValue(column, value, ['boolean']);
      contentValues.put(columnName, value ? 1 : 0);
    } else if (value instanceof Date) {
      this.validateValue(column, value, ['Date', 'string']);
      const dateString = DateConverter.stringValue(value, column.getDataType());
      contentValues.put(columnName, dateString);
    } else {
      throw new GeoPackageException('Unsupported update column value. column: ' + columnName + ', value: ' + value);
    }
  }

  /**
   * Validate the value and its actual value types against the column data type class
   * @param column column
   * @param value value
   * @param valueTypes value type
   */
  protected validateValue(column: TColumn, value: any, valueTypes: string[]): void {
    if (this.columns.isValueValidation()) {
      const dataType = column.getDataType();
      if (dataType == null) {
        throw new GeoPackageException(
          'Column is missing a data type. Column: ' +
            column.getName() +
            ', Value: ' +
            value +
            ", Type: '" +
            column.getType() +
            "', Actual Type: " +
            valueTypes[0],
        );
      }
      const dataTypeClass = GeoPackageDataType.getClass(dataType);
      let valid = false;
      for (const valueType of valueTypes) {
        if (valueType === dataTypeClass) {
          valid = true;
          break;
        }
      }
      if (!valid) {
        throw new GeoPackageException(
          'Illegal value. Column: ' +
            column.getName() +
            ', Value: ' +
            value +
            ', Expected Type: ' +
            dataTypeClass +
            ', Actual Type: ' +
            valueTypes[0],
        );
      }
    }
  }
}
