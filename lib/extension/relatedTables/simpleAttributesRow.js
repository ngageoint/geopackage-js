/**
 * SimpleAttributesRow module.
 * @module extension/relatedTables/simpleAttributesRow
 */

var UserRow = require('../../user/userRow');

var util = require('util');

var SimpleAttributesRow = function(simpleAttributesTable, columnTypes, values) {
  UserRow.call(this, mediaTable, columnTypes, values);
  this.simpleAttributesTable = simpleAttributesTable;
}

util.inherits(SimpleAttributesRow, UserRow);

SimpleAttributesRow.prototype.getIdColumnIndex = function() {
  return this.simpleAttributesTable.getIdColumnIndex();
}

SimpleAttributesRow.prototype.getIdColumn = function() {
  return this.simpleAttributesTable.getIdColumn();
}

SimpleAttributesRow.prototype.getId = function() {
  return this.getValue(this.simpleAttributesTable.getIdColumn());
}

module.exports = SimpleAttributesRow;
