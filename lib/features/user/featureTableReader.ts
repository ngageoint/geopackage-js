/**
 * featureTableReader module.
 * @module features/user/featureTableReader
 */
import { GeometryColumnsDao } from '../columns/geometryColumnsDao';
import { FeatureTable } from './featureTable';
import { UserTableReader } from '../../user/userTableReader';
import { FeatureColumn } from './featureColumn';
import { GeometryColumns } from '../columns/geometryColumns';
import { GeoPackage } from '../../geoPackage';
import { TableColumn } from '../../db/table/tableColumn';

/**
 * Reads the metadata from an existing feature table
 * @class FeatureTableReader
 */
export class FeatureTableReader extends UserTableReader<FeatureColumn, FeatureTable> {
  /*
   * GeometryColumn name
   */
  columnName: string

  constructor(tableNameOrGeometryColumns: string | GeometryColumns) {
    super(
      tableNameOrGeometryColumns instanceof GeometryColumns
        ? tableNameOrGeometryColumns.table_name
        : tableNameOrGeometryColumns,
    );
    tableNameOrGeometryColumns instanceof GeometryColumns
      ? (this.columnName = tableNameOrGeometryColumns.column_name)
      : undefined;
  }
  readFeatureTable(geoPackage: GeoPackage): FeatureTable {
    if (this.columnName === null || this.columnName === undefined) {
      const gcd = new GeometryColumnsDao(geoPackage);
      this.columnName = gcd.queryForTableName(this.table_name).column_name;
    }
    return this.readTable(geoPackage.database) as FeatureTable;
  }

  /**
   * @inheritDoc
   */
  createTable(tableName: string, columns: FeatureColumn[]): FeatureTable {
    return new FeatureTable(tableName, this.columnName, columns);
  }

  /**
   * @inheritDoc
   */
  createColumn(tableColumn: TableColumn): FeatureColumn {
    return new FeatureColumn(tableColumn.index, tableColumn.name, tableColumn.dataType, tableColumn.max, tableColumn.notNull, tableColumn.defaultValue, tableColumn.primaryKey, FeatureColumn.getGeometryTypeFromTableColumn(tableColumn));
  }
}
