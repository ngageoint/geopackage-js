/**
 * attributeTableReader module.
 * @module attributes/attributeTableReader
 */

var UserTableReader = require('../user/userTableReader')
  , AttributeTable = require('./attributeTable');

/**
* Reads the metadata from an existing attribute table
* @class AttributeTableReader
* @extends UserTableReader
* @classdesc Reads the metadata from an existing attributes table
*/
class AttributeTableReader extends UserTableReader {
  /**
   * @inheritdoc
   */
  createTable(tableName, columns) {
    return new AttributeTable(tableName, columns);
  }
}

module.exports = AttributeTableReader;
