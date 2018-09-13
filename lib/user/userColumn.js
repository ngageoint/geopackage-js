/**
 * userColumn module.
 * @module user/userColumn
 */

var DataTypes = require('../db/dataTypes');

/**
 * Metadata about a single column from a user table
 * @class
 * @param {Number} index        column index
 * @param {string} name         column name
 * @param {module:db/dataTypes~GPKGDataType} type         data type
 * @param {Number} max max value
 * @param {Boolean} notNull      not null
 * @param {Object} defaultValue default value or nil
 * @param {Boolean} primaryKey primary key
 */
function UserColumn(index, name, dataType, max, notNull, defaultValue, primaryKey) {
  this.index = index;
  this.name = name;
  this.dataType = dataType;
  this.max = max;
  this.notNull = notNull;
  this.defaultValue = defaultValue;
  this.primaryKey = primaryKey;
  this.validateMax();
}

/**
 * Gets the type name
 * @return {module:db/dataTypes~GPKGDataType}
 */
UserColumn.prototype.getTypeName = function () {
  var type = undefined;
  if (this.dataType !== DataTypes.GPKGDataType.GPKG_DT_GEOMETRY) {
    type = DataTypes.name(this.dataType);
  }
  return type;
};

/**
 * Validate that if max is set, the data type is text or blob
 */
UserColumn.prototype.validateMax = function () {
  if(this.max && this.dataType !== DataTypes.GPKGDataType.GPKG_DT_TEXT && this.dataType !== DataTypes.GPKGDataType.GPKG_DT_BLOB) {
    throw new Error('Column max is only supported for TEXT and BLOB columns. column: ' + this.name + ', max: ' + this.max + ', type: ' + this.dataType)
  }
};

/**
 *  Create a new primary key column
 *
 *  @param {Number} index column index
 *  @param {string} name  column name
 *
 *  @return {module:user/userColumn~UserColumn} created column
 */
UserColumn.createPrimaryKeyColumnWithIndexAndName = function(index, name) {
  return new UserColumn(index, name, DataTypes.GPKGDataType.GPKG_DT_INTEGER, undefined, true, undefined, true);
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
 *  @return {module:user/userColumn~UserColumn} created column
 */
UserColumn.createColumnWithIndex = function(index, name, type, notNull, defaultValue) {
  return UserColumn.createColumnWithIndexAndMax(index, name, type, undefined, notNull, defaultValue);
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
 *  @return {module:user/userColumn~UserColumn} created column
 */
UserColumn.createColumnWithIndexAndMax = function(index, name, type, max, notNull, defaultValue) {
  return new UserColumn(index, name, type, max, notNull, defaultValue, false);
}

module.exports = UserColumn;
