import { UserResultSet } from '../../user/userResultSet';
import { TileColumn } from './tileColumn';
import { TileTable } from './tileTable';
import { TileRow } from './tileRow';
import { TileColumns } from './tileColumns';
import { UserColumns } from '../../user/userColumns';
import { ResultSet } from '../../db/resultSet';
import { DBValue } from '../../db/dbAdapter';

/**
 * Tile Result Set to wrap a database ResultSet for tile queries
 */
export class TileResultSet extends UserResultSet<TileColumn, TileTable, TileRow> {
  /**
   * Constructor
   * @param table tile table
   * @param columns columns
   * @param resultSet result set
   * @param sql SQL statement
   * @param selectionArgs selection arguments
   */
  public constructor(
    table: TileTable,
    columns: string[] | UserColumns<TileColumn>,
    resultSet: ResultSet,
    sql: string,
    selectionArgs: any[],
  ) {
    super(table, columns, resultSet, sql, selectionArgs);
  }

  /**
   * Get row with column types and values
   * @param columnTypes
   * @param values
   */
  public getRowWithColumnTypesAndValues(columnTypes: number[], values: DBValue[]): TileRow {
    return new TileRow(this.getTable(), this.getColumns(), columnTypes, values);
  }

  /**
   * {@inheritDoc}
   */
  public getColumns(): TileColumns {
    return super.getColumns() as TileColumns;
  }
}
