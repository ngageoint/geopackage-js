import { UserColumn } from '../../user/userColumn';
import { GeoPackageDataType } from '../../db/geoPackageDataType';
import { DBValue } from '../../db/dbValue';
import { GeometryType } from '@ngageoint/simple-features-js';
import { TableColumn } from '../../db/table/tableColumn';
import { UserTableDefaults } from '../../user/userTableDefaults';
import { GeoPackageException } from '../../geoPackageException';

/**
 * Represents a user feature column
 */
export class FeatureColumn extends UserColumn {
  geometryType: GeometryType;

  constructor(
    index: number = UserColumn.NO_INDEX,
    name: string,
    dataType: GeoPackageDataType,
    max?: number,
    notNull?: boolean,
    defaultValue?: any,
    primaryKey?: boolean,
    geometryType?: GeometryType,
    autoincrement?: boolean,
  ) {
    super(index, name, dataType, max, notNull, defaultValue, primaryKey, autoincrement);
    this.geometryType = geometryType;
    this.setType(this.getTypeName(name, dataType, geometryType));
  }

  /**
   * Create a new column
   *
   * @param tableColumn table column
   * @return feature column
   */
  public static createColumnWithTableColumn(tableColumn: TableColumn): FeatureColumn {
    return new FeatureColumn(
      tableColumn.getIndex(),
      tableColumn.getName(),
      tableColumn.getDataType(),
      tableColumn.getMax(),
      tableColumn.isNotNull(),
      tableColumn.getDefaultValue(),
      tableColumn.isPrimaryKey(),
      FeatureColumn.getGeometryTypeFromTableColumn(tableColumn),
      tableColumn.isAutoIncrement(),
    );
  }

  /**
   *  Create a new primary key column
   *  @param {string} name  column name
   *  @param {boolean} autoincrement  column name
   *
   *  @return feature column
   */
  static createPrimaryKeyColumn(
    name: string,
    autoincrement: boolean = UserTableDefaults.DEFAULT_AUTOINCREMENT,
  ): FeatureColumn {
    return FeatureColumn.createPrimaryKeyColumnWithIndex(FeatureColumn.NO_INDEX, name, autoincrement);
  }

  /**
   *  Create a new primary key column with a specified column index
   *  @param {Number} index column index
   *  @param {string} name  column name
   *  @param {boolean} autoincrement  column name
   *
   *  @return feature column
   */
  static createPrimaryKeyColumnWithIndex(
    index: number = FeatureColumn.NO_INDEX,
    name: string,
    autoincrement: boolean = UserTableDefaults.DEFAULT_AUTOINCREMENT,
  ): FeatureColumn {
    return new FeatureColumn(
      index,
      name,
      GeoPackageDataType.INTEGER,
      undefined,
      true,
      undefined,
      true,
      undefined,
      autoincrement,
    );
  }

  /**
   *  Create a new geometry column
   *
   *  @param {Number} index        column index
   *  @param {string} name         column name
   *  @param {GeometryType} type
   *  @param {Boolean} notNull      not null
   *  @param {Object} defaultValue default value or nil
   *
   *  @return feature column
   */
  static createGeometryColumn(
    name: string,
    type: GeometryType,
    notNull?: boolean,
    defaultValue?: DBValue,
  ): FeatureColumn {
    return FeatureColumn.createGeometryColumnWithIndex(FeatureColumn.NO_INDEX, name, type, notNull, defaultValue);
  }
  /**
   *  Create a new geometry column with a specified column index
   *
   *  @param {Number} index        column index
   *  @param {string} name         column name
   *  @param {GeometryType} type
   *  @param {Boolean} notNull      not null
   *  @param {Object} defaultValue default value or nil
   *
   *  @return feature column
   */
  static createGeometryColumnWithIndex(
    index: number = FeatureColumn.NO_INDEX,
    name: string,
    type: GeometryType,
    notNull?: boolean,
    defaultValue?: DBValue,
  ): FeatureColumn {
    if (type === null || type === undefined) {
      throw new GeoPackageException('Geometry Type is required to create column: ' + name);
    }
    return new FeatureColumn(
      index,
      name,
      GeoPackageDataType.BLOB,
      undefined,
      notNull,
      defaultValue,
      false,
      type,
      false,
    );
  }

  /**
   * Create a new column
   * @param name
   * @param type
   * @param notNull
   * @param defaultValue
   * @param max
   * @param autoincrement
   */
  static createColumn(
    name: string,
    type: GeoPackageDataType,
    notNull = false,
    defaultValue?: DBValue,
    max?: number,
    autoincrement?: boolean,
  ): FeatureColumn {
    return FeatureColumn.createColumnWithIndex(FeatureColumn.NO_INDEX, name, type, notNull, defaultValue, max, autoincrement);
  }

  /**
   * Create a new column with a specified column index
   * @param index
   * @param name
   * @param type
   * @param notNull
   * @param defaultValue
   * @param max
   * @param autoincrement
   */
  static createColumnWithIndex(
    index: number = FeatureColumn.NO_INDEX,
    name: string,
    type: GeoPackageDataType,
    notNull = false,
    defaultValue?: DBValue,
    max?: number,
    autoincrement?: boolean,
  ): FeatureColumn {
    return new FeatureColumn(index, name, type, max, notNull, defaultValue, false, undefined, autoincrement);
  }

  /**
   * Get the type name from the data and geometry type
   * @param name column name
   * @param dataType data type
   * @param geometryType  geometry type
   * @return type name
   */
  getTypeName(name: string, dataType: GeoPackageDataType, geometryType?: GeometryType): string {
    let type;
    if (geometryType !== null && geometryType !== undefined) {
      type = GeometryType.nameFromType(geometryType);
    } else {
      type = UserColumn.getTypeName(name, dataType);
    }
    return type;
  }

  /**
   * Attempt to get the geometry type of the table column
   * @param tableColumn table column
   * @return geometry type
   */
  static getGeometryTypeFromTableColumn(tableColumn: TableColumn): GeometryType {
    let geometryType = null;
    if (tableColumn.isDataType(GeoPackageDataType.BLOB)) {
      geometryType = GeometryType.fromName(tableColumn.type);
    }
    return geometryType;
  }

  /**
   * Copy the column
   * @return copied column
   */
  copy(): FeatureColumn {
    return new FeatureColumn(
      this.getIndex(),
      this.getName(),
      this.getDataType(),
      this.getMax(),
      this.isNotNull(),
      this.getDefaultValue(),
      this.isPrimaryKey(),
      this.getGeometryType(),
      this.isAutoincrement(),
    );
  }

  /**
   * Determine if this column is a geometry
   *
   * @return true if a geometry column
   */
  isGeometry(): boolean {
    return this.geometryType !== null;
  }

  /**
   * When a geometry column, gets the geometry type
   * @return geometry type
   */
  getGeometryType(): GeometryType {
    return this.geometryType;
  }
}
