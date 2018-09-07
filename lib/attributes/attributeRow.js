/**
 * AttributeRow module.
 * @module attributes/attributeRow
 */

var UserRow = require('../user/userRow');
var util = require('util');

/**
 * Attribute Row containing the values from a single result set row
 * @class AttributeRow
 * @extends module:user/userRow~UserRow
 * @param  {module:attributes/attributeTable~AttributeTable} attributeTable attribute table
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 */
var AttributeRow = function(attributeTable, columnTypes, values) {
  UserRow.call(this, attributeTable, columnTypes, values);
}

util.inherits(AttributeRow, UserRow);

module.exports = AttributeRow;
