/**
 * Table Info queries (table_info)
 */
import { TableColumn } from './tableColumn';
import { GeoPackageConnection } from '../geoPackageConnection';
import { GeoPackageDataType } from '../geoPackageDataType';
import { GeometryType } from '@ngageoint/simple-features-js';
import { SQLiteMaster } from '../master/sqliteMaster';
import { SQLiteMasterColumn } from '../master/sqliteMasterColumn';
import { StringUtils } from '../stringUtils';

export class TableInfo {
  /**
   * Index column
   */
  static CID = 'cid';

  /**
   * Name column
   */
  static NAME = 'name';

  /**
   * Type column
   */
  static TYPE = 'type';

  /**
   * Not null column
   */
  static NOT_NULL = 'notnull';

  /**
   * Default value column
   */
  static DFLT_VALUE = 'dflt_value';

  /**
   * Primary key column
   */
  static PK = 'pk';

  /**
   * Default of NULL value
   */
  static DEFAULT_NULL = 'NULL';

  /**
   * Table name
   */
  tableName: string;

  /**
   * Table columns
   */
  columns: TableColumn[];

  /**
   * Column name to column mapping
   */
  namesToColumns = new Map<string, TableColumn>();

  /**
   * Primary key column names
   */
  primaryKeys: TableColumn[] = [];

  /**
   * Constructor
   * @param tableName table name
   * @param columns table columns
   */
  constructor(tableName: string, columns: TableColumn[]) {
    this.tableName = tableName;
    this.columns = columns;
    columns.forEach(column => {
      this.namesToColumns.set(column.getName(), column);
      if (column.isPrimaryKey()) {
        this.primaryKeys.push(column);
      }
    });
  }

  /**
   * Get the table name
   * @return table name
   */
  getTableName(): string {
    return this.tableName;
  }

  /**
   * Number of columns
   *
   * @return column count
   */
  numColumns(): number {
    return this.columns.length;
  }

  /**
   * Get the columns
   * @return columns
   */
  getColumns(): TableColumn[] {
    return this.columns.slice();
  }

  /**
   * Get the column at the index
   * @param index column index
   * @return column
   */
  getColumnAtIndex(index: number): TableColumn {
    if (index < 0 || index >= this.columns.length) {
      throw new Error('Column index: ' + index + ', not within range 0 to ' + (this.columns.length - 1));
    }
    return this.columns[index];
  }

  /**
   * Check if the table has the column
   * @param name column name
   * @return true if has column
   */
  hasColumn(name: string): boolean {
    return this.getColumn(name) !== null && this.getColumn(name) !== undefined;
  }

  /**
   * Get the column with the name
   * @param name column name
   * @return column or null if does not exist
   */
  getColumn(name: string): TableColumn {
    return this.namesToColumns.get(name);
  }

  /**
   * Check if the table has one or more primary keys
   * @return true if has at least one primary key
   */
  hasPrimaryKey(): boolean {
    return this.primaryKeys.length !== 0;
  }

  /**
   * Get the primary key columns
   * @return primary key columns
   */
  public getPrimaryKeys(): TableColumn[] {
    return this.primaryKeys.slice();
  }

  /**
   * Get the single or first primary key if one exists
   * @return single or first primary key, null if no primary key
   */
  getPrimaryKey(): TableColumn {
    let pk = null;
    if (this.hasPrimaryKey()) {
      pk = this.primaryKeys[0];
    }
    return pk;
  }

  /**
   * Query for the table_info of the table name
   * @param db connection
   * @param tableName table name
   * @return table info or null if no table
   */
  static info(db: GeoPackageConnection, tableName: string): TableInfo {
    const sql = 'PRAGMA table_info(' + StringUtils.quoteWrap(tableName) + ')';
    const results = db.all(sql, null);
    const tableColumns: TableColumn[] = [];

    results.forEach(result => {
      const index = result.cid;
      const name = result.name;
      let type = result.type;
      const notNull = result.notnull === 1;
      const defaultValueString = result.dflt_value;
      const primaryKey = result.pk === 1;
      let autoincrement = false;
      if (primaryKey) {
        const autoincrementResult = db.all(
          'SELECT tbl_name FROM ' +
            SQLiteMaster.TABLE_NAME +
            ' WHERE ' +
            SQLiteMasterColumn.nameFromType(SQLiteMasterColumn.TBL_NAME) +
            '=? AND ' +
            SQLiteMasterColumn.nameFromType(SQLiteMasterColumn.SQL) +
            ' LIKE ?',
          [tableName, '%AUTOINCREMENT%'],
        );
        autoincrement = autoincrementResult.length === 1;
      }

      // If the type has a max limit on it, pull it off
      let max = null;
      if (type != null && type.endsWith(')')) {
        const maxStart = type.indexOf('(');
        if (maxStart > -1) {
          const maxString = type.substring(maxStart + 1, type.length - 1);
          if (maxString.length !== 0) {
            try {
              max = parseInt(maxString);
              type = type.substring(0, maxStart);
            } catch (e) {
              console.error(e);
            }
          }
        }
      }

      const dataType = TableInfo.getDataType(type);
      let defaultValue = undefined;
      if (result.dflt_value) {
        defaultValue = result.dflt_value.replace(/\\'/g, '');
      }
      const tableColumn = new TableColumn(
        index,
        name,
        type,
        dataType,
        max,
        notNull,
        defaultValueString,
        defaultValue,
        primaryKey,
        autoincrement,
      );
      tableColumns.push(tableColumn);
    });

    let tableInfo: TableInfo = null;
    if (tableColumns.length !== 0) {
      tableInfo = new TableInfo(tableName, tableColumns);
    }

    return tableInfo;
  }

  /**
   * Get the data type from the type value
   * @param type type value
   * @return data type or null
   */
  static getDataType(type: string): GeoPackageDataType {
    let dataType = GeoPackageDataType.fromName(type);

    if (dataType === null || dataType === undefined) {
      // Check if a geometry and set as a blob
      const geomType = GeometryType.fromName(type);
      if (geomType !== null && geomType !== undefined) {
        dataType = GeoPackageDataType.BLOB;
      }
    }
    return dataType;
  }
}
