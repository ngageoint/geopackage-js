/**
 * UserMappingRow module.
 * @module tiles/user/userMappingRow
 */

var UserRow = require('../../user/userRow');

var util = require('util');

var UserMappingRow = function(userMappingTable, columnTypes, values) {
  UserRow.call(this, userMappingTable, columnTypes, values);
}

util.inherits(UserMappingRow, UserRow);

UserMappingRow.prototype.getBaseIdColumn = function() {
  return this.table.getBaseIdColumn();
}

UserMappingRow.prototype.getBaseId = function() {
  return this.getValueWithColumnName(this.getBaseIdColumn().name);
}

UserMappingRow.prototype.setBaseId = function(baseId) {
  this.setValueWithColumnName(this.getBaseIdColumn().name, baseId);
}

UserMappingRow.prototype.getRelatedIdColumn = function() {
  return this.table.getRelatedIdColumn();
}

UserMappingRow.prototype.getRelatedId = function() {
  return this.getValueWithColumnName(this.getRelatedIdColumn().name);
}

UserMappingRow.prototype.setRelatedId = function(relatedId) {
  this.setValueWithColumnName(this.getRelatedIdColumn().name, relatedId);
}

module.exports = UserMappingRow;
