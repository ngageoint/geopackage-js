/**
 * featureTableReader module.
 * @module features/user/featureTableReader
 */
import {GeometryColumnsDao} from '../columns/geometryColumnsDao';
import FeatureTable from './featureTable';
import UserTableReader from '../../user/userTableReader';
import FeatureColumn from './featureColumn';

import DataTypes from '../../db/dataTypes'
import { WKB } from '../../wkb'

/**
* Reads the metadata from an existing feature table
* @class FeatureTableReader
*/
export default class FeatureTableReader extends UserTableReader {
  geometryColumns: any;
  constructor(tableNameOrGeometryColumns) {
    super(tableNameOrGeometryColumns.table_name ? tableNameOrGeometryColumns.table_name : tableNameOrGeometryColumns);
    tableNameOrGeometryColumns.table_name ? this.geometryColumns = tableNameOrGeometryColumns : undefined;
  }
  readFeatureTable(geoPackage): FeatureTable {
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
      geometryType = WKB.fromName(type);
    }
    else {
      dataType = DataTypes.fromName(type);
    }
    var column = new FeatureColumn(index, name, dataType, max, notNull, defaultValue, primaryKey, geometryType);
    return column;
  }
}
