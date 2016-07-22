/**
 * featureColumn module.
 * @module features/user/featureColumn
 */

var UserColumn = require('../../user/userColumn')
  , DataTypes = require('../../db/dataTypes');

var util = require('util');

/**
 * Represents a user feature column
 */
var FeatureColumn = function(index, name, dataType, max, notNull, defaultValue, primaryKey, geometryType) {
  UserColumn.call(this, index, name, dataType, max, notNull, defaultValue, primaryKey);
  this.geometryType = geometryType;

  if (!geometryType && dataType === DataTypes.GPKGDataType.GPKG_DT_GEOMETRY) {
    throw new Error('Data or Geometry Type is required to create column: ' + name);
  }
}

util.inherits(FeatureColumn, UserColumn);

/**
 *  Create a new primary key column
 *
 *  @param {Number} index column index
 *  @param {string} name  column name
 *
 *  @return feature column
 */
FeatureColumn.createPrimaryKeyColumnWithIndexAndName = function(index, name) {
  return new FeatureColumn(index, name, DataTypes.GPKGDataType.GPKG_DT_INTEGER, undefined, true, undefined, true);
}

/**
 *  Create a new geometry column
 *
 *  @param {Number} index        column index
 *  @param {string} name         column name
 *  @param {WKBGeometryType} type         geometry type
 *  @param {Boolean} notNull      not null
 *  @param {Object} defaultValue default value or nil
 *
 *  @return feature column
 */
FeatureColumn.createGeometryColumn = function(index, name, type, notNull, defaultValue) {
  return new FeatureColumn(index, name, DataTypes.GPKGDataType.GPKG_DT_GEOMETRY, undefined, notNull, defaultValue, false, type);
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
 *  @return feature column
 */
FeatureColumn.createColumnWithIndex = function(index, name, type, notNull, defaultValue) {
  return FeatureColumn.createColumnWithIndexAndMax(index, name, type, undefined, notNull, defaultValue);
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
 *  @return feature column
 */
FeatureColumn.createColumnWithIndexAndMax = function(index, name, type, max, notNull, defaultValue) {
  return new FeatureColumn(index, name, type, max, notNull, defaultValue, false);
}

/**
 * Determine if this column is a geometry
 * @return {Boolean} true if a geometry column
 */
FeatureColumn.prototype.isGeometry = function () {
  return this.geometryType !== undefined;
};

module.exports = FeatureColumn;
