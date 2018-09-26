/**
 * @module user/custom
 */
var util = require('util');

var UserTableReader = require('../userTableReader')
  , DataTypes = require('../../db/dataTypes')
  , UserCustomColumn = require('./userCustomColumn')
  , UserCustomTable = require('./userCustomTable');

/**
 * User custom table reader
 * @class
 * @extends module:user/userTableReader~UserTableReader
 * @param  {string} tableName       table name
 * @param  {string[]} requiredColumns required columns
 */
var UserCustomTableReader = function(tableName, requiredColumns) {
  UserTableReader.call(this, tableName, requiredColumns);
}

util.inherits(UserCustomTableReader, UserTableReader);

/**
 * Creates user custom column
 * @param  {string} tableName       table name
 * @param  {module:user/userCustom~UserCustomColumn[]} columnList      columns
 * @param  {string[]} requiredColumns required columns
 * @return {module:user/userCustom~UserCustomTable}
 */
UserCustomTableReader.prototype.createTable = function(tableName, columnList, requiredColumns) {
  return new UserCustomTable(tableName, columnList, requiredColumns);
}

/**
 * Creates a user custom column
 * @param {Object} result
 * @param {Number} index        column index
 * @param {string} name         column name
 * @param {module:db/dataTypes~GPKGDataType} type         data type
 * @param {Number} max max value
 * @param {Boolean} notNull      not null
 * @param {Object} defaultValue default value or nil
 * @param {Boolean} primaryKey primary key
 * @return {module:user/custom~UserCustomColumn}
 */
UserCustomTableReader.prototype.createColumnWithResults = function(result, index, name, type, max, notNull, defaultValue, primaryKey) {

  var dataType = DataTypes.fromName(type);
  return new UserCustomColumn(index, name, dataType, max, notNull, defaultValue, primaryKey);
}


module.exports = UserCustomTableReader;
