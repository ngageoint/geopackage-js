/**
 * featureTableReader module.
 * @module features/user/featureTableReader
 */
import { GeometryColumnsDao } from '../columns/geometryColumnsDao';
import { FeatureTable } from './featureTable';
import { UserTableReader } from '../../user/userTableReader';
import { FeatureColumn } from './featureColumn';

import { DataTypes } from '../../db/dataTypes';
import { WKB } from '../../wkb';
import { GeometryColumns } from '../columns/geometryColumns';
import { GeoPackage } from '../../geoPackage';
import { UserColumn } from '../../user/userColumn';
import { DBValue } from '../../db/dbAdapter';

/**
 * Reads the metadata from an existing feature table
 * @class FeatureTableReader
 */
export class FeatureTableReader extends UserTableReader {
  geometryColumns: GeometryColumns;
  constructor(tableNameOrGeometryColumns: string | GeometryColumns) {
    super(
      tableNameOrGeometryColumns instanceof GeometryColumns
        ? tableNameOrGeometryColumns.table_name
        : tableNameOrGeometryColumns,
    );
    tableNameOrGeometryColumns instanceof GeometryColumns
      ? (this.geometryColumns = tableNameOrGeometryColumns)
      : undefined;
  }
  readFeatureTable(geoPackage: GeoPackage): FeatureTable {
    if (!this.geometryColumns) {
      const gcd = new GeometryColumnsDao(geoPackage);
      this.geometryColumns = gcd.queryForTableName(this.table_name);
      return this.readTable(geoPackage.database) as FeatureTable;
    } else {
      return this.readTable(geoPackage.database) as FeatureTable;
    }
  }
  createTable(tableName: string, columns: UserColumn[]): FeatureTable {
    return new FeatureTable(tableName, columns);
  }
  createColumn(
    index: number,
    name: string,
    type: string,
    max?: number,
    notNull?: boolean,
    defaultValue?: DBValue,
    primaryKey?: boolean,
  ): FeatureColumn {
    const geometry = name === this.geometryColumns.column_name;
    let geometryType = undefined;
    let dataType = undefined;
    if (geometry) {
      geometryType = WKB.fromName(type);
    } else {
      dataType = DataTypes.fromName(type);
    }
    const column = new FeatureColumn(index, name, dataType, max, notNull, defaultValue, primaryKey, geometryType);
    return column;
  }
}
