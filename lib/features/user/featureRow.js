/**
 * featureRow module.
 * @module features/user/featureRow
 */

var UserRow = require('../../user/userRow')
  , FeatureColumn = require('./featureColumn')
  , GeometryData = require('../../geom/geometryData')
  , DataTypes = require('../../db/dataTypes');

var util = require('util');

/**
 * Feature Row containing the values from a single result set row
 * @param  {FeatureTable} featureTable feature table
 * @param  {Array} columnTypes  column types
 * @param  {Array} values       values
 */
var FeatureRow = function(featureTable, columnTypes, values) {
  UserRow.call(this, featureTable, columnTypes, values);
  this.featureTable = featureTable;
}

util.inherits(FeatureRow, UserRow);

/**
 * Get the geometry column index
 * @return {Number} geometry column index
 */
FeatureRow.prototype.getGeometryColumnIndex = function () {
  return this.featureTable.geometryIndex;
};

/**
 * Get the geometry column
 * @return {FeatureColumn} geometry column
 */
FeatureRow.prototype.getGeometryColumn = function () {
  return this.featureTable.getGeometryColumn();
};

/**
 * Get the geometry
 * @return {Buffer} geometry data
 */
FeatureRow.prototype.getGeometry = function () {
  return this.getValueWithIndex(this.featureTable.geometryIndex);
};

/**
 * Get the geometry's type
 * @return {String} geometry data
 */
FeatureRow.prototype.getGeometryType = function () {
  var geometryType = null;
  var geometry = this.getValueWithIndex(this.featureTable.geometryIndex);
  if (geometry !== null) {
    geometryType = geometry.toGeoJSON().type;
  }
  return geometryType;
};

/**
 * set the geometry
 * @param {Buffer} geometryData geometry data
 */
FeatureRow.prototype.setGeometry = function (geometryData) {
  this.setValueWithIndex(this.featureTable.geometryIndex, geometryData);
};

FeatureRow.prototype.toObjectValue = function (index, value) {
  var objectValue = value;
  var column = this.getColumnWithIndex(index);
  if (column.isGeometry() && value) {
    objectValue = new GeometryData(value);
  }
  return objectValue;
};

FeatureRow.prototype.toDatabaseValue = function(columnName) {
  var column = this.getColumnWithColumnName(columnName);
  var value = this.getValueWithColumnName(columnName);
  if (column.isGeometry() && value.toData) {
    return value.toData();
  } else if (column.dataType === DataTypes.GPKGDataType.BOOLEAN) {
    return value === true ? 1 : 0;
  }

  return value;
}

module.exports = FeatureRow;
