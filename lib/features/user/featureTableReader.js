/**
 * featureTableReader module.
 * @module features/user/featureTableReader
 */

var UserTableReader = require('../../user/userTableReader')
  , FeatureTable = require('./featureTable')
  , FeatureColumn = require('./featureColumn')
  , GeometryColumnsDao = require('../columns').GeometryColumnsDao
  , DataTypes = require('../../db/dataTypes')
  , wkb = require('../../wkb');

var util = require('util');

/**
* Reads the metadata from an existing feature table
* @class FeatureTableReader
* @extends {module:user~UserTableReader}
*/
var FeatureTableReader = function(tableNameOrGeometryColumns) {
  if (util.isString(tableNameOrGeometryColumns)) {
    UserTableReader.call(this, tableNameOrGeometryColumns);
  } else {
    UserTableReader.call(this, tableNameOrGeometryColumns.table_name);
    this.geometryColumns = tableNameOrGeometryColumns;
  }
}

util.inherits(FeatureTableReader, UserTableReader);

FeatureTableReader.prototype.readFeatureTable = function (db) {
  if (!this.geometryColumns) {
    var gcd = new GeometryColumnsDao(db);
    return gcd.queryForTableName(this.table_name)
    .then(function(geometryColumns) {
      this.geometryColumns = geometryColumns;
      var table = this.readTable(db);
      return table;
    }.bind(this));
  } else {
    return Promise.resolve(this.readTable(db));
  }
};

FeatureTableReader.prototype.createTableWithNameAndColumns = function (tableName, columns) {
  return new FeatureTable(tableName, columns);
};

FeatureTableReader.prototype.createColumnWithResults = function (results, index, name, type, max, notNull, defaultValueIndex, primaryKey) {
  var geometry = name === this.geometryColumns.column_name;
  var geometryType = undefined;
  var dataType = undefined;
  if (geometry) {
    geometryType = wkb.fromName(type);
  } else {
    dataType = DataTypes.fromName(type);
  }
  var defaultValue = undefined;
  if (defaultValueIndex) {
  }
  var column = new FeatureColumn(index, name, dataType, max, notNull, defaultValue, primaryKey, geometryType);

  return column;
};

/**
 * The FeatureTableReader
 * @type {FeatureTableReader}
 */
module.exports = FeatureTableReader;
