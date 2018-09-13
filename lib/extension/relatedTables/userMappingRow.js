/**
 * UserMappingRow module.
 * @module extension/relatedTables
 */

var UserRow = require('../../user/userRow');

var util = require('util');

/**
 * User Mapping Row containing the values from a single result set row
 * @class
 * @extends {module:user/userRow~UserRow}
 * @param  {module:extension/relatedTables~UserMappingTable} userMappingTable user mapping table
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 */
var UserMappingRow = function(userMappingTable, columnTypes, values) {
  UserRow.call(this, userMappingTable, columnTypes, values);
}

util.inherits(UserMappingRow, UserRow);

/**
 * Get the base id column
 * @return {module:user/userColumn~UserColumn}
 */
UserMappingRow.prototype.getBaseIdColumn = function() {
  return this.table.getBaseIdColumn();
}

/**
 * Gets the base id
 * @return {Number}
 */
UserMappingRow.prototype.getBaseId = function() {
  return this.getValueWithColumnName(this.getBaseIdColumn().name);
}

/**
 * Sets the base id
 * @param  {Number} baseId base id
 */
UserMappingRow.prototype.setBaseId = function(baseId) {
  this.setValueWithColumnName(this.getBaseIdColumn().name, baseId);
}

/**
 * Get the related id column
 * @return {module:user/userColumn~UserColumn}
 */
UserMappingRow.prototype.getRelatedIdColumn = function() {
  return this.table.getRelatedIdColumn();
}

/**
 * Gets the related id
 * @return {Number}
 */
UserMappingRow.prototype.getRelatedId = function() {
  return this.getValueWithColumnName(this.getRelatedIdColumn().name);
}

/**
 * Sets the related id
 * @param  {Number} relatedId related id
 */
UserMappingRow.prototype.setRelatedId = function(relatedId) {
  this.setValueWithColumnName(this.getRelatedIdColumn().name, relatedId);
}

module.exports = UserMappingRow;
