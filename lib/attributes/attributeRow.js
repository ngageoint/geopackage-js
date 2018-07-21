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
}

util.inherits(AttributeRow, UserRow);

module.exports = AttributeRow;
