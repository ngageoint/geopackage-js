import { FeatureColumn } from './featureColumn';
import { UserColumns } from '../../user/userColumns';
import { GeoPackageDataType } from '../../db/geoPackageDataType';

/**
 * UserCustomColumns
 */
export class FeatureColumns extends UserColumns<FeatureColumn> {
  /**
   * Geometry column
   */
  geometryColumn: string;

  /**
   * Geometry column index
   */
  geometryIndex = -1;

  constructor(tableName: string, geometryColumn: string, columns: FeatureColumn[], custom: boolean) {
    super(tableName, columns, custom);
    this.geometryColumn = geometryColumn;
    this.updateColumns();
  }

  copy(): FeatureColumns {
    return new FeatureColumns(this.getTableName(), this.getGeometryColumnName(), this.getColumns(), this.isCustom());
  }

  /**
   * {@inheritDoc}
   */
  updateColumns(): void {
    super.updateColumns();
    let index = null;
    if (this.geometryColumn !== null && this.geometryColumn !== undefined) {
      index = this.getColumnIndex(this.geometryColumn, false);
    } else {
      for (let i = 0; i < this.getColumns().length; i++) {
        const column = this.getColumns()[i];
        if (column.isGeometry()) {
          index = column.getIndex();
          this.geometryColumn = column.getName();
          break;
        }
      }
    }
    if (!this.isCustom()) {
      this.missingCheck(index, GeoPackageDataType.nameFromType(GeoPackageDataType.BLOB));
    }
    if (index !== null && index !== undefined) {
      this.geometryIndex = index;
    }
  }

  /**
   * Get the geometry column name
   * @return geometry column name
   */
  getGeometryColumnName(): string {
    return this.geometryColumn;
  }

  /**
   * Set the geometry column name
   * @param geometryColumn geometry column name
   */
  setGeometryColumnName(geometryColumn: string): void {
    this.geometryColumn = geometryColumn;
  }

  /**
   * Get the geometry index
   * @return geometry index
   */
  getGeometryIndex(): number {
    return this.geometryIndex;
  }

  /**
   * Set the geometry index
   * @param geometryIndex  geometry index
   */
  setGeometryIndex(geometryIndex: number): void {
    this.geometryIndex = geometryIndex;
  }

  /**
   * Check if the table has a geometry column
   * @return true if has a geometry column
   */
  hasGeometryColumn(): boolean {
    return this.geometryIndex >= 0;
  }

  /**
   * Get the geometry column
   * @return geometry column
   */
  getGeometryColumn(): FeatureColumn {
    let column = null;
    if (this.hasGeometryColumn()) {
      column = this.getColumnForIndex(this.geometryIndex);
    }
    return column;
  }
}
