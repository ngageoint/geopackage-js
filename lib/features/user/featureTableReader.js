/**
 * featureTableReader module.
 * @module features/user/featureTableReader
 */

var UserTableReader = require('../../user/userTableReader')
  , FeatureTable = require('./featureTable')
  , FeatureColumn = require('./featureColumn')
  , GeometryColumnsDao = require('../columns/geometryColumnsDao')
  , DataTypes = require('../../db/dataTypes')
  , wkb = require('../../wkb');

/**
* Reads the metadata from an existing feature table
* @class FeatureTableReader
*/
class FeatureTableReader extends UserTableReader {
  constructor(tableNameOrGeometryColumns) {
    super(tableNameOrGeometryColumns.table_name ? tableNameOrGeometryColumns.table_name : tableNameOrGeometryColumns);
    tableNameOrGeometryColumns.table_name ? this.geometryColumns = tableNameOrGeometryColumns : undefined;
  }
  readFeatureTable(geoPackage) {
    if (!this.geometryColumns) {
      var gcd = new GeometryColumnsDao(geoPackage);
      this.geometryColumns = gcd.queryForTableName(this.table_name);
      return this.readTable(geoPackage.getDatabase());
    }
    else {
      return this.readTable(geoPackage.getDatabase());
    }
  }
  createTable(tableName, columns) {
    return new FeatureTable(tableName, columns);
  }
  createColumnWithResults(results, index, name, type, max, notNull, defaultValue, primaryKey) {
    var geometry = name === this.geometryColumns.column_name;
    var geometryType = undefined;
    var dataType = undefined;
    if (geometry) {
      geometryType = wkb.fromName(type);
    }
    else {
      dataType = DataTypes.fromName(type);
    }
    var column = new FeatureColumn(index, name, dataType, max, notNull, defaultValue, primaryKey, geometryType);
    return column;
  }
}

/**
 * The FeatureTableReader
 * @type {FeatureTableReader}
 */
module.exports = FeatureTableReader;
