/**
 * mediaTable module.
 * @module extension/relatedTables/mediaTable
 */

var UserTable = require('../../user/userTable')
  , UserColumn = require('../../user/userColumn')
  , DataTypes = require('../../db/dataTypes')
  , RelationType = require('./relationType');

var util = require('util');

/**
 * Represents a user attribute table
 * @param  {string} tableName table name
 * @param  {array} columns   attribute columns
 */
var MediaTable = function(tableName, columns, requiredColumns) {
  UserTable.call(this, tableName, MediaTable.RELATION_TYPE.name, MediaTable.RELATION_TYPE.dataType, columns, requiredColumns);
}

util.inherits(MediaTable, UserRelatedTable);

SimpleAttributesTable.requiredColumns = function(idColumnName) {
  var requiredColumns = [];
  requiredColumns.push(idColumnName || MediaTable.COLUMN_ID);
  requiredColumns.push(MediaTable.COLUMN_DATA);
  requiredColumns.push(MediaTable.COLUMN_CONTENT_TYPE);
  return requiredColumns;
}

MediaTable.numRequiredColumns = function(){
  return requiredColumns().length;
}

MediaTable.createRequiredColumns = function(startingIndex, idColumnName) {
  startingIndex = startingIndex || 0;
  return [
    MediaTable.createIdColumn(startingIndex++, idColumnName || MediaTable.COLUMN_ID),
    MediaTable.createDataColumn(startingIndex++),
    MediaTable.createContentTypeColumn(startingIndex++)
  ];
}

MediaTable.createIdColumn = function(index, idColumnName) {
  return UserColumn.createPrimaryKeyColumnWithIndexAndName(index, idColumnName);
}

MediaTable.createDataColumn = function(index) {
  return UserColumn.createColumnWithIndex(index, MediaTable.COLUMN_DATA, DataType.GPKGDataType.GPKG_DT_BLOB, true);
}

MediaTable.createContentTypeColumn = function(index) {
  return UserColumn.createColumnWithIndex(index, MediaTable.COLUMN_CONTENT_TYPE, DataType.GPKGDataType.GPKG_DT_TEXT, true);
}

MediaTable.prototype.getIdColumnIndex = function() {
  return this.pkIndex;
}

MediaTable.prototype.getIdColumn = function() {
  return this.getPkColumn();
}

MediaTable.prototype.getDataColumnIndex = function() {
  return this.getColumnIndex(MediaTable.COLUMN_DATA);
}

MediaTable.prototype.getDataColumn = function() {
  return this.getColumnWithColumnName(MediaTable.COLUMN_DATA);
}

MediaTable.prototype.getContentTypeColumnIndex = function() {
  return this.getColumnIndex(MediaTable.COLUMN_CONTENT_TYPE);
}

MediaTable.prototype.getContentTypeColumn = function() {
  return this.getColumnWithColumnName(MediaTable.COLUMN_CONTENT_TYPE);
}

MediaTable.RELATION_TYPE = RelationType.MEDIA;
MediaTable.COLUMN_ID = 'id';
MediaTable.COLUMN_DATA = 'data';
MediaTable.COLUMN_CONTENT_TYPE = 'content_type';

/**
 * The MediaTable
 * @type {MediaTable}
 */
module.exports = MediaTable;
