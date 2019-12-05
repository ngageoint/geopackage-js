/**
 * featureTable module.
 * @module features/user/featureTable
 */
import UserTable from '../../user/userTable';
import FeatureColumn from './featureColumn';

/**
 * Represents a user feature table
 * @param  {string} tableName table name
 * @param  {array} columns   feature columns
 */
export default class FeatureTable extends UserTable {
  geometryIndex: number;
  constructor(tableName, columns) {
    super(tableName, columns);
    var geometry = undefined;
    for (var i = 0; i < columns.length; i++) {
      var column = columns[i];
      if (column.isGeometry()) {
        this.duplicateCheck(column.index, geometry, /* WKB_GEOMETRY_NAME */ 'GEOMETRY');
        geometry = column.index;
      }
    }
    this.missingCheck(geometry, /* WKB_GEOMETRY_NAME */ 'GEOMETRY');
    this.geometryIndex = geometry;
  }
  /**
   * Get the geometry feature column
   * @return {FeatureColumn} geometry feature column
   */
  getGeometryColumn() {
    return this.getColumnWithIndex(this.geometryIndex);
  }
  getTableType() {
    return UserTable.FEATURE_TABLE;
  }
}
