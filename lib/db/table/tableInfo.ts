/**
 * Table Info queries (table_info)
 */
import { TableColumn } from './tableColumn';
import { GeoPackageConnection } from '../geoPackageConnection';
import { CoreSQLUtils } from '../coreSQLUtils';
import { GeoPackageDataType } from '../geoPackageDataType';
import { GeometryType } from '../../features/user/geometryType';

export class TableInfo {

  /**
   * Index column
   */
  static CID = 'cid';

  /**
   * Name column
   */
  static NAME = "name";

  /**
   * Type column
   */
  static TYPE = "type";

  /**
   * Not null column
   */
  static NOT_NULL = "notnull";

  /**
   * Default value column
   */
  static DFLT_VALUE = "dflt_value";

  /**
   * Primary key column
   */
  static PK = "pk";

  /**
   * Default of NULL value
   */
  static DEFAULT_NULL = "NULL";

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
  hasPrimaryKey() {
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

  // @ts-ignore
  /**
   * Query for the table_info of the table name
   * @param db connection
   * @param tableName table name
   * @return table info or null if no table
   */
  static info(db: GeoPackageConnection, tableName: string): TableInfo {
    let sql = 'PRAGMA table_info(' + CoreSQLUtils.quoteWrap(tableName) + ')';
    let results = db.all(sql, null);
    let tableColumns: TableColumn[] = [];

    results.forEach((result) => {
      let index = result.cid;
      let name = result.name;
      let type = result.type;
      let notNull = result.notnull === 1;
      let defaultValueString = result.dflt_value;
      let primaryKey = result.pk === 1;

      // If the type has a max limit on it, pull it off
      let max = null;
      if (type != null && type.endsWith(")")) {
        let maxStart = type.indexOf("(");
        if (maxStart > -1) {
          let maxString = type.substring(maxStart + 1, type.length - 1);
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

      let dataType = TableInfo.getDataType(type);
      let defaultValue = undefined;
      if (result.dflt_value) {
        defaultValue = result.dflt_value.replace(/\\'/g, '');
      }
      let tableColumn = new TableColumn(index, name, type, dataType, max, notNull, defaultValueString, defaultValue, primaryKey);
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
  //
  // /**
  //  * Get the default object value for the string default value and type
  //  * @param defaultValue default value
  //  * @param type type
  //  * @return default value
  //  */
  // getDefaultValue(defaultValue: string, type: string): any {
  //   return this.getDefaultValueForType(defaultValue, this.getDataType(type));
  // }
  //
  // /**
  //  * Get the default object value for the string default value with the data type
  //  * @param defaultValue default value
  //  * @param type data type
  //  * @return default value
  //  */
  // getDefaultValueForType(defaultValue: string, type: GeoPackageDataType): any {
  //   let value: any = defaultValue;
  //   if (defaultValue !== null && defaultValue !== undefined && type !== null && type !== undefined && defaultValue.toUpperCase() === TableInfo.DEFAULT_NULL) {
  //     switch (type) {
  //       case GeoPackageDataType.TEXT:
  //         break;
  //       case GeoPackageDataType.DATE:
  //       case GeoPackageDataType.DATETIME:
  //         if (!DateConverter.isFunction(defaultValue)) {
  //           DateConverter converter = DateConverter.converter(type);
  //           try {
  //             value = converter.dateValue(defaultValue);
  //           } catch (e) {
  //             console.warn('Invalid ' + type + ' format: ' + defaultValue + ', String value used', e);
  //           }
  //         }
  //         break;
  //       case GeoPackageDataType.BOOLEAN:
  //         value = parseInt(defaultValue) === 0;
  //         break;
  //       case GeoPackageDataType.TINYINT:
  //         value = Byte.parseByte(defaultValue);
  //         break;
  //       case GeoPackageDataType.SMALLINT:
  //         value = Short.parseShort(defaultValue);
  //         break;
  //       case GeoPackageDataType.MEDIUMINT:
  //         value = Integer.parseInt(defaultValue);
  //         break;
  //       case GeoPackageDataType.INT:
  //       case GeoPackageDataType.INTEGER:
  //         value = Long.parseLong(defaultValue);
  //         break;
  //       case GeoPackageDataType.FLOAT:
  //         value = Float.parseFloat(defaultValue);
  //         break;
  //       case GeoPackageDataType.DOUBLE:
  //       case GeoPackageDataType.REAL:
  //         value = Double.parseDouble(defaultValue);
  //         break;
  //       case GeoPackageDataType.BLOB:
  //         value = defaultValue.getBytes();
  //         break;
  //       default:
  //         throw new Error('Unsupported Data Type ' + type);
  //     }
  //   }
  //   return value;
  // }
}
