/**
 * featureRow module.
 * @module features/user/featureRow
 */

var UserRow = require('../../user/UserRow')
  , FeatureColumn = require('./featureColumn')
  , GeometryData = require('../../geom/geometryData');

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
 * set the geometry
 * @param {Buffer} geometryData geometry data
 */
FeatureRow.prototype.setGeometry = function (geometryData) {

};

FeatureRow.prototype.toObjectValue = function (index, value) {
  var objectValue = value;
  var column = this.getColumnWithIndex(index);
  console.log('column', column.isGeometry());
  if (column.isGeometry() && value) {
    objectValue = new GeometryData(value);
  }
  return objectValue;
};

module.exports = FeatureRow;
