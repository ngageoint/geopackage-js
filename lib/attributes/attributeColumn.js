/**
 * attributeColumn module.
 * @module attributes/attributeColumn
 */

var UserColumn = require('../user/userColumn')
  , DataTypes = require('../db/dataTypes');

var util = require('util');

/**
 * Represents a user feature column
 */
var AttributeColumn = function(index, name, dataType, max, notNull, defaultValue, primaryKey) {
  UserColumn.call(this, index, name, dataType, max, notNull, defaultValue, primaryKey);
}

util.inherits(AttributeColumn, UserColumn);

/**
 *  Create a new primary key column
 *
 *  @param {Number} index column index
 *  @param {string} name  column name
 *
 *  @return {AttributeColumn} created column
 */
AttributeColumn.createPrimaryKeyColumnWithIndexAndName = function(index, name) {
  return new AttributeColumn(index, name, DataTypes.GPKGDataType.GPKG_DT_INTEGER, undefined, true, undefined, true);
}

/**
 *  Create a new column
 *
 *  @param {Number} index        column index
 *  @param {string} name         column name
 *  @param {module:db/dataTypes~GPKGDataType} type         data type
 *  @param {Boolean} notNull      not null
 *  @param {Object} defaultValue default value or nil
 *
 *  @return {AttributeColumn} created column
 */
AttributeColumn.createColumnWithIndex = function(index, name, type, notNull, defaultValue) {
  return AttributeColumn.createColumnWithIndexAndMax(index, name, type, undefined, notNull, defaultValue);
}

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
 *  @return {AttributeColumn} created column
 */
AttributeColumn.createColumnWithIndexAndMax = function(index, name, type, max, notNull, defaultValue) {
  return new AttributeColumn(index, name, type, max, notNull, defaultValue, false);
}

module.exports = AttributeColumn;
