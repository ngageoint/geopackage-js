import { FeatureTable } from './featureTable';
import { UserRow } from '../../user/userRow';
import { FeatureColumn } from './featureColumn';
import { GeoPackageDataType } from '../../db/geoPackageDataType';
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
    columnTypes?: { [key: string]: GeoPackageDataType },
    values?: Record<string, DBValue>,
  ) {
    super(featureTable, columnTypes, values);
  }
  /**
   * Get the geometry column index
   * @return {Number} geometry column index
   */
  get geometryColumnIndex(): number {
    return this.featureTable.getGeometryColumnIndex();
  }
  /**
   * Get the geometry column
   * @return {FeatureColumn} geometry column
   */
  get geometryColumn(): FeatureColumn {
    return this.featureTable.getGeometryColumn();
  }
  /**
   * Get the geometry
   * @return {Buffer} geometry data
   */
  get geometry(): GeometryData {
    return this.getValueWithIndex(this.featureTable.getGeometryColumnIndex());
  }
  /**
   * set the geometry
   * @param {Buffer} geometryData geometry data
   */
  set geometry(geometryData: GeometryData) {
    this.setValueWithIndex(this.featureTable.getGeometryColumnIndex(), geometryData);
  }
  /**
   * Get the geometry's type
   * @return {String} geometry data
   */
  get geometryType(): string {
    let geometryType = null;
    const geometry = this.getValueWithIndex(this.featureTable.getGeometryColumnIndex());
    if (geometry !== null) {
      geometryType = geometry.toGeoJSON().type;
    }
    return geometryType;
  }

  toObjectValue(index: number, value: DBValue): object | GeometryData {
    const column = this.getColumnWithIndex(index);
    if (
      (column instanceof FeatureColumn && column.isGeometry() && value && value instanceof Buffer) ||
      value instanceof Uint8Array
    ) {
      return new GeometryData(value);
    }
    return super.toObjectValue(index, value);
  }

  getValueWithColumnName(columnName: string): any {
    const value = this.values[columnName];
    const column = this.getColumnWithColumnName(columnName);
    if (value !== undefined && value !== null && column instanceof FeatureColumn && column.isGeometry() && (value as any).toData) {
      return (value as any).toData();
    }
    return super.getValueWithColumnName(columnName);
  }
}
