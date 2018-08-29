/**
 * SimpleAttributesRow module.
 * @module extension/relatedTables/simpleAttributesRow
 */

var UserRow = require('../../user/userRow');

var util = require('util');

var SimpleAttributesRow = function(simpleAttributesTable, columnTypes, values) {
  UserRow.call(this, simpleAttributesTable, columnTypes, values);
  this.simpleAttributesTable = simpleAttributesTable;
}

util.inherits(SimpleAttributesRow, UserRow);

SimpleAttributesRow.prototype.getIdColumn = function() {
  return this.simpleAttributesTable.getIdColumn();
}

SimpleAttributesRow.prototype.getId = function() {
  return this.getValueWithColumnName(this.getIdColumn().name);
}

module.exports = SimpleAttributesRow;
