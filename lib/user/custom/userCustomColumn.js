/**
 * @module user/custom
 */

var util = require('util');

var UserColumn = require('../userColumn')
  , DataTypes = require('../../db/dataTypes')

/**
 * Create a new user custom columnd
 *  @param {Number} index        column index
 *  @param {string} name         column name
 *  @param {module:db/dataTypes~GPKGDataType} dataType  data type
 *  @param {Number} max max value
 *  @param {Boolean} notNull      not null
 *  @param {Object} defaultValue default value or nil
 *  @param {Boolean} primaryKey primary key
 */
var UserCustomColumn = function(index, name, dataType, max, notNull, defaultValue, primaryKey) {
  UserColumn.call(this, index, name, dataType, max, notNull, defaultValue, primaryKey);
  if (dataType == null) {
    throw new Error('Data type is required to create column: ' + name);
  }
}

util.inherits(UserCustomColumn, UserColumn);

/**
 *  Create a new column
 *
 *  @param {Number} index        column index
 *  @param {string} name         column name
 *  @param {module:db/dataTypes~GPKGDataType} type         data type
 *  @param {Number} max max value
 *  @param {Boolean} notNull      not null
 *  @param {Object} defaultValue default value or nil
 *
 *  @return {module:user/custom~UserCustomColumn} created column
 */
UserCustomColumn.createColumn = function(index, name, dataType, max, notNull, defaultValue) {
  return new UserCustomColumn(index, name, dataType, max, notNull, defaultValue, false);
}

module.exports = UserCustomColumn;
