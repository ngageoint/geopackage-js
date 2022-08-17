import { UserConnection } from '../../user/userConnection';
import { TileColumn } from './tileColumn';
import { TileTable } from './tileTable';
import { TileRow } from './tileRow';
import { TileResultSet } from './tileResultSet';
import { GeoPackageConnection } from '../../db/geoPackageConnection';
import { ResultSet } from '../../db/resultSet';

/**
 * GeoPackage Tile Connection
 */
export class TileConnection extends UserConnection<TileColumn, TileTable, TileRow, TileResultSet> {
  /**
   * Constructor
   * @param database GeoPackage connection
   */
  public constructor(database: GeoPackageConnection) {
    super(database);
  }

  /**
   * {@inheritDoc}
   */
  public createResult(
    columns: string[],
    resultSet: ResultSet,
    sql: string,
    selectionArgs: string[],
  ): TileResultSet {
    return new TileResultSet(this.getTable(), columns, resultSet, sql, selectionArgs);
  }
}
