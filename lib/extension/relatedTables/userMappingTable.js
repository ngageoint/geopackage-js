/**
 * userMappingTable module.
 * @module extension/relatedTables/userMappingTable
 */

var UserTable = require('../../user/userTable')
  , UserCustomColumn = require('../../user/custom/userCustomColumn')
  , DataTypes = require('../../db/dataTypes');

var util = require('util');

/**
 * Represents a user attribute table
 * @param  {string} tableName table name
 * @param  {array} columns   attribute columns
 */
var UserMappingTable = function(tableName, columns) {
  UserTable.call(this, tableName, columns);
}

util.inherits(UserMappingTable, UserTable);

UserMappingTable.create = function(tableName, columns) {
  var allColumns = UserMappingTable.createRequiredColumns(0);
  if (columns) {
    allColumns = allColumns.concat(columns);
  }
  return new UserMappingTable(tableName, allColumns);
}

UserMappingTable.numRequiredColumns = function() {
  return UserMappingTable.createRequiredColumns(0).length;
}

UserMappingTable.createRequiredColumns = function(startingIndex) {
  startingIndex = startingIndex || 0;
  return [
    UserMappingTable.createBaseIdColumn(startingIndex++),
    UserMappingTable.createRelatedIdColumn(startingIndex)
  ];
}

UserMappingTable.createBaseIdColumn = function(index) {
  var baseIdColumn = UserCustomColumn.createColumn(index, UserMappingTable.COLUMN_BASE_ID, DataTypes.GPKGDataType.GPKG_DT_INTEGER, undefined, true);
  return baseIdColumn;
}

UserMappingTable.createRelatedIdColumn = function(index) {
  return UserCustomColumn.createColumn(index, UserMappingTable.COLUMN_RELATED_ID, DataTypes.GPKGDataType.GPKG_DT_INTEGER, undefined, true);
}

UserMappingTable.prototype.getBaseIdColumn = function() {
  return this.getColumnWithColumnName(UserMappingTable.COLUMN_BASE_ID);
}

UserMappingTable.prototype.getRelatedIdColumn = function() {
  return this.getColumnWithColumnName(UserMappingTable.COLUMN_RELATED_ID);
}

UserMappingTable.requiredColumns = function() {
  return [UserMappingTable.COLUMN_BASE_ID, UserMappingTable.COLUMN_RELATED_ID];
}

UserMappingTable.COLUMN_BASE_ID = 'base_id';
UserMappingTable.COLUMN_RELATED_ID = 'related_id';

/**
 * The UserMappingTable
 * @type {UserMappingTable}
 */
module.exports = UserMappingTable;
