/**
 * attributeTableReader module.
 * @module attributes/attributeTableReader
 */

var UserTableReader = require('../user/userTableReader')
  , AttributeTable = require('./attributeTable')
  , DataTypes = require('../db/dataTypes');

var util = require('util');

/**
* Reads the metadata from an existing attribute table
* @class AttributeTableReader
* @extends {module:user/userTableReader~UserTableReader}
* @classdesc Reads the metadata from an existing attributes table
*/
var AttributeTableReader = function(tableName) {
  UserTableReader.call(this, tableName);
}

util.inherits(AttributeTableReader, UserTableReader);

/**
 * @inheritdoc
 */
AttributeTableReader.prototype.createTable = function (tableName, columns) {
  return new AttributeTable(tableName, columns);
};

module.exports = AttributeTableReader;
