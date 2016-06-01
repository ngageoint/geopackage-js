/**
 * userColumn module.
 * @module user/userColumn
 */

var DataTypes = require('../db/dataTypes');

/**
 * UserColumn
 * @class UserColumn
 */
function UserColumn(index, name, dataType, max, notNull, defaultValue, primaryKey) {
  this.index = index;
  this.name = name;
  this.dataType = dataType;
  this.max = max;
  this.notNull = notNull,
  this.defaultValue = defaultValue;
  this.primaryKey = primaryKey;
  this.validateMax();
}

UserColumn.prototype.getTypeName = function () {
  var type = undefined;
  if (this.dataType !== DataTypes.GPKGDataType.GPKG_DT_GEOMETRY) {
    type = DataTypes.name(this.dataType);
  }
  return type;
};

UserColumn.prototype.validateMax = function () {
  if(this.max && this.dataType !== DataTypes.GPKGDataType.GPKG_DT_TEXT && this.dataType !== DataTypes.GPKGDataType.GPKG_DT_BLOB) {
    throw new Error('Column max is only supported for TEXT and BLOB columns. column: ' + this.name + ', max: ' + this.max + ', type: ' + this.dataType)
  }
};

module.exports = UserColumn;
