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

MediaRow.prototype.getIdColumn = function() {
  return this.mediaTable.getIdColumn();
}

MediaRow.prototype.getId = function() {
  return this.getValueWithColumnName(this.getIdColumn().name);
}

MediaRow.prototype.getDataColumn = function() {
  return this.mediaTable.getDataColumn();
}

MediaRow.prototype.getData = function() {
  return this.getValueWithColumnName(this.getDataColumn().name);
}

MediaRow.prototype.setData = function(data) {
  this.setValueWithColumnName(this.getDataColumn().name, data);
}

MediaRow.prototype.getContentTypeColumn = function() {
  return this.mediaTable.getContentTypeColumn();
}

MediaRow.prototype.getContentType = function() {
  return this.getValueWithColumnName(this.getContentTypeColumn().name);
}

MediaRow.prototype.setContentType = function(contentType) {
  this.setValueWithColumnName(this.getContentTypeColumn().name, contentType);
}

module.exports = MediaRow;
