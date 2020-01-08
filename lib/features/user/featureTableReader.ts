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
import GeometryColumns from '../columns/geometryColumns';
import GeoPackage from '../../geoPackage';
import UserColumn from '../../user/userColumn';

/**
* Reads the metadata from an existing feature table
* @class FeatureTableReader
*/
export default class FeatureTableReader extends UserTableReader {
  geometryColumns: any;
  constructor(tableNameOrGeometryColumns: string | GeometryColumns) {
    super(tableNameOrGeometryColumns instanceof GeometryColumns ? tableNameOrGeometryColumns.table_name : tableNameOrGeometryColumns);
    tableNameOrGeometryColumns instanceof GeometryColumns ? this.geometryColumns = tableNameOrGeometryColumns : undefined;
  }
  readFeatureTable(geoPackage: GeoPackage): FeatureTable {
    if (!this.geometryColumns) {
      var gcd = new GeometryColumnsDao(geoPackage);
      this.geometryColumns = gcd.queryForTableName(this.table_name);
      return this.readTable(geoPackage.getDatabase());
    }
    else {
      return this.readTable(geoPackage.getDatabase());
    }
  }
  createTable(tableName: string, columns: UserColumn[]) {
    return new FeatureTable(tableName, columns);
  }
  createColumnWithResults(results: any, index: number, name: string, type: string, max?: number, notNull?: boolean, defaultValue?: any, primaryKey?: boolean) {
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
