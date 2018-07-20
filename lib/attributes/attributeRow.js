/**
 * AttributeRow module.
 * @module attributes/attributeRow
 */

var UserRow = require('../user/userRow')
  , DataTypes = require('../db/dataTypes');

var util = require('util');

/**
 * Attribute Row containing the values from a single result set row
 * @param  {AttributeTable} attributeTable attribute table
 * @param  {Array} columnTypes  column types
 * @param  {Array} values       values
 */
var AttributeRow = function(attributeTable, columnTypes, values) {
  UserRow.call(this, attributeTable, columnTypes, values);
  this.attributeTable = attributeTable;
}

util.inherits(AttributeRow, UserRow);

AttributeRow.prototype.toObjectValue = function (index, value) {
  var objectValue = value;
  var column = this.getColumnWithIndex(index);
  if (column.dataType === DataTypes.GPKGDataType.BOOLEAN && value) {
    return value === 1 ? true : false;
  }
  return objectValue;
};

AttributeRow.prototype.toDatabaseValue = function(columnName) {
  var column = this.getColumnWithColumnName(columnName);
  var value = this.getValueWithColumnName(columnName);
  if (column.dataType === DataTypes.GPKGDataType.BOOLEAN) {
    return value === true ? 1 : 0;
  }

  return value;
}

module.exports = AttributeRow;
