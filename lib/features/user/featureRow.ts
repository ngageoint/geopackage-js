import { FeatureTable } from './featureTable';
import { UserRow } from '../../user/userRow';
import { FeatureColumn } from './featureColumn';
import { DataTypes } from '../../db/dataTypes';
import { GeometryData } from '../../geom/geometryData';
import { DBValue } from '../../db/dbAdapter';

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
  constructor(
    public featureTable: FeatureTable,
    columnTypes?: { [key: string]: DataTypes },
    values?: Record<string, DBValue>,
  ) {
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
  getGeometry(): GeometryData {
    return this.getValueWithIndex(this.featureTable.geometryIndex);
  }
  /**
   * Get the geometry's type
   * @return {String} geometry data
   */
  getGeometryType(): string {
    let geometryType = null;
    const geometry = this.getValueWithIndex(this.featureTable.geometryIndex);
    if (geometry !== null) {
      geometryType = geometry.toGeoJSON().type;
    }
    return geometryType;
  }
  /**
   * set the geometry
   * @param {Buffer} geometryData geometry data
   */
  setGeometry(geometryData: GeometryData): void {
    this.setValueWithIndex(this.featureTable.geometryIndex, geometryData);
  }
  toObjectValue(index: number, value: DBValue): object | GeometryData {
    let objectValue = value as object;
    const column = this.getColumnWithIndex(index);
    if (
      (column instanceof FeatureColumn && column.isGeometry() && value && value instanceof Buffer) ||
      value instanceof Uint8Array
    ) {
      objectValue = new GeometryData(value);
    }
    return objectValue;
  }
  toDatabaseValue(columnName: string): DBValue {
    const column = this.getColumnWithColumnName(columnName);
    const value = this.getValueWithColumnName(columnName);
    if (column instanceof FeatureColumn && column.isGeometry() && value.toData) {
      return value.toData();
    } else if (column.dataType === DataTypes.BOOLEAN) {
      return value === true ? 1 : 0;
    }
    return value;
  }
}
