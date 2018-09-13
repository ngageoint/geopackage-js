/**
 * MediaRow module.
 * @module extension/relatedTables
 */

var UserRow = require('../../user/userRow');

var util = require('util');

/**
 * User Media Row containing the values from a single result set row
 * @class
 * @extends {module:user/userRow~UserRow}
 * @param  {module:extension/relatedTables~MediaTable} mediaTable  media table
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 */
var MediaRow = function(mediaTable, columnTypes, values) {
  UserRow.call(this, mediaTable, columnTypes, values);
  this.mediaTable = mediaTable;
}

util.inherits(MediaRow, UserRow);

/**
 * Gets the id column
 * @return {module:user/userColumn~UserColumn}
 */
MediaRow.prototype.getIdColumn = function() {
  return this.mediaTable.getIdColumn();
}

/**
 * Gets the id
 * @return {Number}
 */
MediaRow.prototype.getId = function() {
  return this.getValueWithColumnName(this.getIdColumn().name);
}

/**
 * Get the data column
 * @return {module:user/userColumn~UserColumn}
 */
MediaRow.prototype.getDataColumn = function() {
  return this.mediaTable.getDataColumn();
}

/**
 * Gets the data
 * @return {Buffer}
 */
MediaRow.prototype.getData = function() {
  return this.getValueWithColumnName(this.getDataColumn().name);
}

/**
 * Sets the data for the row
 * @param  {Buffer} data data
 */
MediaRow.prototype.setData = function(data) {
  this.setValueWithColumnName(this.getDataColumn().name, data);
}

/**
 * Get the content type column
 * @return {module:user/userColumn~UserColumn}
 */
MediaRow.prototype.getContentTypeColumn = function() {
  return this.mediaTable.getContentTypeColumn();
}

/**
 * Gets the content type
 * @return {string}
 */
MediaRow.prototype.getContentType = function() {
  return this.getValueWithColumnName(this.getContentTypeColumn().name);
}

/**
 * Sets the content type for the row
 * @param  {string} contentType contentType
 */
MediaRow.prototype.setContentType = function(contentType) {
  this.setValueWithColumnName(this.getContentTypeColumn().name, contentType);
}

module.exports = MediaRow;
