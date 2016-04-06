/**
 * featureTable module.
 * @module features/user/featureTable
 */

var UserTable = require('../../user/userTable');

var util = require('util');

/**
 * Represents a user feature table
 * @param  {string} tableName table name
 * @param  {array} columns   feature columns
 */
var FeatureTable = function(tableName, columns) {
  UserTable.call(this, tableName, columns);
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

util.inherits(FeatureTable, UserTable);

/**
 * Get the geometry feature column
 * @return {FeatureColumn} geometry feature column
 */
FeatureTable.prototype.getGeometryColumn = function () {
  return this.getColumnWithIndex(this.geometryIndex);
};

/**
 * The FeatureTable
 * @type {FeatureTable}
 */
module.exports = FeatureTable;
