/**
 * MediaRow module.
 * @module extension/relatedTables/mediaRow
 */

var UserRow = require('../../user/userRow');

var util = require('util');

var MediaRow = function(mediaTable, columnTypes, values) {
  UserRow.call(this, mediaTable, columnTypes, values);
  this.mediaTable = mediaTable;
}

util.inherits(MediaRow, UserRow);

MediaRow.prototype.getIdColumnIndex = function() {
  return this.mediaTable.getIdColumnIndex();
}

MediaRow.prototype.getIdColumn = function() {
  return this.mediaTable.getIdColumn();
}

MediaRow.prototype.getId = function() {
  return this.getValue(this.mediaTable.getIdColumn());
}

MediaRow.prototype.getDataColumnIndex = function() {
  return this.mediaTable.getDataColumnIndex();
}

MediaRow.prototype.getDataColumn = function() {
  return this.mediaTable.getDataColumn();
}

MediaRow.prototype.getData = function() {
  return this.getValue(this.mediaTable.getDataColumn());
}

MediaRow.prototype.setData = function(data) {
  this.setValueWithColumnName(this.getDataColumn().name, data);
}

MediaRow.prototype.getContentTypeColumnIndex = function() {
  return this.mediaTable.getContentTypeColumnIndex();
}

MediaRow.prototype.getContentTypeColumn = function() {
  return this.mediaTable.getContentTypeColumn();
}

MediaRow.prototype.getContentType = function() {
  return this.getValue(this.mediaTable.getContentTypeColumn());
}

MediaRow.prototype.setContentType = function(contentType) {
  this.setValueWithColumnName(this.getContentTypeColumn().name, contentType);
}

module.exports = MediaRow;
