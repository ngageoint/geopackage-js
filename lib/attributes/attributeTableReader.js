/**
 * attributeTableReader module.
 * @module attributes/attributeTableReader
 */

var UserTableReader = require('../user/userTableReader')
  , AttributeTable = require('./attributeTable')
  , AttributeColumn = require('./attributeColumn')
  , DataTypes = require('../db/dataTypes');

var util = require('util');

/**
* Reads the metadata from an existing attribute table
* @class AttributeTableReader
* @extends {module:user~UserTableReader}
*/
var AttributeTableReader = function(tableName) {
  UserTableReader.call(this, tableName);
}

util.inherits(AttributeTableReader, UserTableReader);

AttributeTableReader.prototype.readAttributeTable = function (db) {
  return Promise.resolve(this.readTable(db));
};

AttributeTableReader.prototype.createTableWithNameAndColumns = function (tableName, columns) {
  return new AttributeTable(tableName, columns);
};

AttributeTableReader.prototype.createColumnWithResults = function (results, index, name, type, max, notNull, defaultValue, primaryKey) {
  var dataType = DataTypes.fromName(type);
  var column = new AttributeColumn(index, name, dataType, max, notNull, defaultValue, primaryKey);

  return column;
};

/**
 * The AttributeTableReader
 * @type {AttributeTableReader}
 */
module.exports = AttributeTableReader;
