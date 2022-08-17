import { UserResultSet } from '../user/userResultSet';
import { AttributesColumn } from './attributesColumn';
import { AttributesTable } from './attributesTable';
import { AttributesRow } from './attributesRow';
import { AttributesColumns } from './attributesColumns';
import { DBValue } from '../db/dbAdapter';
import { UserColumns } from '../user/userColumns';
import { ResultSet } from '../db/resultSet';

/**
 * Attributes Result Set to wrap a database ResultSet for attributes queries
 */
export class AttributesResultSet extends UserResultSet<AttributesColumn, AttributesTable, AttributesRow> {
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
    table: AttributesTable,
    columns: string[] | UserColumns<AttributesColumn>,
    resultSet: ResultSet,
    sql: string,
    selectionArgs: [],
  ) {
    super(table, columns, resultSet, sql, selectionArgs);
  }

  /**
   * {@inheritDoc}
   */
  public getRowWithColumnTypesAndValues(columnTypes: number[], values: DBValue[]): AttributesRow {
    return new AttributesRow(this.getTable(), this.getColumns(), columnTypes, values);
  }

  /**
   * {@inheritDoc}
   */
  public getColumns(): AttributesColumns {
    return super.getColumns() as AttributesColumns;
  }
}
