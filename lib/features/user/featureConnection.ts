import { UserConnection } from '../../user/userConnection';
import { FeatureColumn } from './featureColumn';
import { FeatureTable } from './featureTable';
import { FeatureRow } from './featureRow';
import { FeatureResultSet } from './featureResultSet';
import { GeoPackageConnection } from '../../db/geoPackageConnection';
import { ResultSet } from '../../db/resultSet';

/**
 * GeoPackage Feature Connection
 */
export class FeatureConnection extends UserConnection<FeatureColumn, FeatureTable, FeatureRow, FeatureResultSet> {
  /**
   * Constructor
   * @param database GeoPackage connection
   */
  public constructor(database: GeoPackageConnection) {
    super(database);
  }

  /**
   * @inheritDoc
   */
  public createResult(columns: string[], resultSet: ResultSet, sql: string, selectionArgs: string[]): FeatureResultSet {
    return new FeatureResultSet(this.getTable(), columns, resultSet, sql, selectionArgs);
  }
}
