import { UserResultSet } from '../../user/userResultSet';
import { FeatureColumn } from './featureColumn';
import { FeatureRow } from './featureRow';
import { FeatureTable } from './featureTable';
import { DBValue } from '../../db/dbValue';
import { FeatureColumns } from './featureColumns';
import { GeoPackageGeometryData } from '../../geom/geoPackageGeometryData';
import { UserColumns } from '../../user/userColumns';
import { ResultSet } from '../../db/resultSet';

/**
 * Feature Result Set to wrap a database ResultSet for feature queries
 */
export class FeatureResultSet extends UserResultSet<FeatureColumn, FeatureTable, FeatureRow> {
  /**
   * Constructor
   * @param table
   * @param columns
   * @param resultSet
   * @param sql
   * @param selectionArgs
   * @protected
   */
  public constructor(
    table: FeatureTable,
    columns: string[] | UserColumns<FeatureColumn>,
    resultSet: ResultSet,
    sql: string,
    selectionArgs: DBValue[],
  ) {
    super(table, columns, resultSet, sql, selectionArgs);
  }

  /**
   * @inheritDoc
   */
  public getRowWithColumnTypesAndValues(columnTypes: number[], values: DBValue[]): FeatureRow {
    return new FeatureRow(this.getTable(), this.getColumns(), columnTypes, values);
  }

  /**
   * Gets the value for a given column
   */
  public getValueForColumn(column: FeatureColumn): DBValue {
    let value;
    if (column.isGeometry()) {
      value = this.getGeometry();
    } else {
      value = super.getValueForColumn(column);
    }
    return value;
  }

  /**
   * @inheritDoc
   */
  public getColumns(): FeatureColumns {
    return super.getColumns() as FeatureColumns;
  }

  /**
   * Get the geometry
   *
   * @return geometry data
   */
  public getGeometry(): GeoPackageGeometryData {
    let geometry = null;

    const geometryBytes = this.getBuffer(this.getTable().getGeometryColumn().getName());
    if (geometryBytes != null) {
      geometry = GeoPackageGeometryData.createWithBuffer(geometryBytes);
    }

    return geometry;
  }
}
