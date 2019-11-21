/**
 * featureRow module.
 * @module features/user/featureRow
 */

var UserRow = require('../../user/userRow')
  // eslint-disable-next-line no-unused-vars
  , FeatureColumn = require('./featureColumn')
  // eslint-disable-next-line no-unused-vars
  , FeatureTable = require('./featureTable')
  , GeometryData = require('../../geom/geometryData')
  , DataTypes = require('../../db/dataTypes');

/**
 * Feature Row containing the values from a single result set row
 * @param  {FeatureTable} featureTable feature table
 * @param  {Array} columnTypes  column types
 * @param  {Array} values       values
 */
class FeatureRow extends UserRow {
  constructor(featureTable, columnTypes, values) {
    super(featureTable, columnTypes, values);
    this.featureTable = featureTable;
  }
  /**
   * Get the geometry column index
   * @return {Number} geometry column index
   */
  getGeometryColumnIndex() {
    return this.featureTable.geometryIndex;
  }
  /**
   * Get the geometry column
   * @return {FeatureColumn} geometry column
   */
  getGeometryColumn() {
    return this.featureTable.getGeometryColumn();
  }
  /**
   * Get the geometry
   * @return {Buffer} geometry data
   */
  getGeometry() {
    return this.getValueWithIndex(this.featureTable.geometryIndex);
  }
  /**
   * Get the geometry's type
   * @return {String} geometry data
   */
  getGeometryType() {
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
  setGeometry(geometryData) {
    this.setValueWithIndex(this.featureTable.geometryIndex, geometryData);
  }
  toObjectValue(index, value) {
    var objectValue = value;
    var column = this.getColumnWithIndex(index);
    if (column instanceof FeatureColumn && column.isGeometry() && value) {
      objectValue = new GeometryData(value);
    }
    return objectValue;
  }
  toDatabaseValue(columnName) {
    var column = this.getColumnWithColumnName(columnName);
    var value = this.getValueWithColumnName(columnName);
    if (column instanceof FeatureColumn && column.isGeometry() && value.toData) {
      return value.toData();
    }
    else if (column.dataType === DataTypes.GPKGDataType.BOOLEAN) {
      return value === true ? 1 : 0;
    }
    return value;
  }
}

module.exports = FeatureRow;
