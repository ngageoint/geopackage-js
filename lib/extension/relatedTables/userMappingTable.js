/**
 * userMappingTable module.
 * @module extension/relatedTables
 */

var UserTable = require('../../user/userTable')
  , UserCustomColumn = require('../../user/custom/userCustomColumn')
  , DataTypes = require('../../db/dataTypes');

var util = require('util');

/**
 * Contains user mapping table factory and utility methods
 * @class
 * @extends {module:user/userTable~UserTable}
 * @param  {string} tableName table name
 * @param  {module:user/userColumn~UserColumn[]} columns   user mapping columns
 */
var UserMappingTable = function(tableName, columns) {
  UserTable.call(this, tableName, columns);
}

util.inherits(UserMappingTable, UserTable);

/**
 * Creates a user mapping table with the minimum required columns followed by the additional columns
 * @param  {string} tableName name of the table
 * @param  {module:user/userColumn~UserColumn[]} additionalColumns additional columns
 * @return {module:extension/relatedTables~UserMappingTable}
 */
UserMappingTable.create = function(tableName, columns) {
  var allColumns = UserMappingTable.createRequiredColumns(0);
  if (columns) {
    allColumns = allColumns.concat(columns);
  }
  return new UserMappingTable(tableName, allColumns);
}

/**
 * Get the number of required columns
 * @return {Number}
 */
UserMappingTable.numRequiredColumns = function() {
  return UserMappingTable.createRequiredColumns(0).length;
}

/**
 * Create the required columns
 * @param  {Number} [startingIndex=0] starting index of the required columns
 * @return {module:user/userColumn~UserColumn[]}
 */
UserMappingTable.createRequiredColumns = function(startingIndex) {
  startingIndex = startingIndex || 0;
  return [
    UserMappingTable.createBaseIdColumn(startingIndex++),
    UserMappingTable.createRelatedIdColumn(startingIndex)
  ];
}

/**
 * Create the base id column
 * @param  {Number} index        index of the column
 * @return {module:user/userColumn~UserColumn}
 */
UserMappingTable.createBaseIdColumn = function(index) {
  var baseIdColumn = UserCustomColumn.createColumn(index, UserMappingTable.COLUMN_BASE_ID, DataTypes.GPKGDataType.GPKG_DT_INTEGER, undefined, true);
  return baseIdColumn;
}

/**
 * Create the related id column
 * @param  {Number} index        index of the column
 * @return {module:user/userColumn~UserColumn}
 */
UserMappingTable.createRelatedIdColumn = function(index) {
  return UserCustomColumn.createColumn(index, UserMappingTable.COLUMN_RELATED_ID, DataTypes.GPKGDataType.GPKG_DT_INTEGER, undefined, true);
}

/**
 * Get the base id column
 * @return {module:user/userColumn~UserColumn}
 */
UserMappingTable.prototype.getBaseIdColumn = function() {
  return this.getColumnWithColumnName(UserMappingTable.COLUMN_BASE_ID);
}

/**
 * Get the related id column
 * @return {module:user/userColumn~UserColumn}
 */
UserMappingTable.prototype.getRelatedIdColumn = function() {
  return this.getColumnWithColumnName(UserMappingTable.COLUMN_RELATED_ID);
}

/**
 * Get the required columns
 * @return {string[]}
 */
UserMappingTable.requiredColumns = function() {
  return [UserMappingTable.COLUMN_BASE_ID, UserMappingTable.COLUMN_RELATED_ID];
}

UserMappingTable.COLUMN_BASE_ID = 'base_id';
UserMappingTable.COLUMN_RELATED_ID = 'related_id';

module.exports = UserMappingTable;
