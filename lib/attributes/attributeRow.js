/**
 * AttributeRow module.
 * @module attributes/attributeRow
 */

var UserRow = require('../user/userRow');

/**
 * Attribute Row containing the values from a single result set row
 * @class AttributeRow
 * @param  {module:attributes/attributeTable~AttributeTable} attributeTable attribute table
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 */
class AttributeRow extends UserRow {
  constructor(attributeTable, columnTypes, values) {
    super(attributeTable, columnTypes, values);
  }
}

module.exports = AttributeRow;
