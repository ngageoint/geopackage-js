import {FeatureTable} from "./featureTable";
import {UserRow} from '../../user/userRow';
import {FeatureColumn} from './featureColumn';
import {DataTypes} from '../../db/dataTypes';
import { GeometryData } from '../../geom/geometryData'

/**
 * featureRow module.
 * @module features/user/featureRow
 */


/**
 * Feature Row containing the values from a single result set row
 * @param  {FeatureTable} featureTable feature table
 * @param  {Array} columnTypes  column types
 * @param  {Array} values       values
 */
export class FeatureRow extends UserRow {
  constructor(public featureTable: FeatureTable, columnTypes?: any[], values?: any[]) {
    super(featureTable, columnTypes, values);
  }
  /**
   * Get the geometry column index
   * @return {Number} geometry column index
   */
  getGeometryColumnIndex(): number {
    return this.featureTable.geometryIndex;
  }
  /**
   * Get the geometry column
   * @return {FeatureColumn} geometry column
   */
  getGeometryColumn(): FeatureColumn {
    return this.featureTable.getGeometryColumn();
  }
  /**
   * Get the geometry
   * @return {Buffer} geometry data
   */
  getGeometry(): any {
    return this.getValueWithIndex(this.featureTable.geometryIndex);
  }
  /**
   * Get the geometry's type
   * @return {String} geometry data
   */
  getGeometryType(): string {
    var geometryType = null;
    var geometry = this.getValueWithIndex(this.featureTable.geometryIndex);
    if (geometry !== null) {
      geometryType = geometry.toGeoJSON().type;
    }
    return geometryType;
  }
  /**
   * set the geometry
   * @param {Buffer} geometryData geometry data
   */
  setGeometry(geometryData: GeometryData) {
    this.setValueWithIndex(this.featureTable.geometryIndex, geometryData);
  }
  toObjectValue(index: number, value: any): any {
    var objectValue = value;
    var column = this.getColumnWithIndex(index);
    if (column instanceof FeatureColumn && column.isGeometry() && value) {
      objectValue = new GeometryData(value);
    }
    return objectValue;
  }
  toDatabaseValue(columnName: string): any {
    var column = this.getColumnWithColumnName(columnName);
    var value = this.getValueWithColumnName(columnName);
    if (column instanceof FeatureColumn && column.isGeometry() && value.toData) {
      return value.toData();
    }
    else if (column.dataType === DataTypes.GPKGDataType.GPKG_DT_BOOLEAN) {
      return value === true ? 1 : 0;
    }
    return value;
  }
}