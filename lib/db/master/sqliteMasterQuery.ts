/**
 * Query on the SQLiteMaster table
 */
import { SQLiteMasterColumn } from './sqliteMasterColumn';
import { StringUtils } from '../stringUtils';
import { GeoPackageException } from '../../geoPackageException';

export class SQLiteMasterQuery {
  /**
   * Combine operation for multiple queries
   */
  combineOperation: string;

  /**
   * List of queries
   */
  queries: string[] = [];

  /**
   * List of arguments
   */
  arguments: string[] = [];

  /**
   * Create a query with the combine operation
   * @param combineOperation combine operation
   */
  constructor(combineOperation: string) {
    this.combineOperation = combineOperation;
  }

  /**
   * Add a query
   * @param column  column
   * @param operation operation
   * @param value value
   */
  add(column: SQLiteMasterColumn, operation: string, value: string): void {
    this.validateAdd();
    this.queries.push(
      'LOWER(' +
        StringUtils.quoteWrap(SQLiteMasterColumn.nameFromType(column).toLowerCase()) +
        ') ' +
        operation +
        ' LOWER(?)',
    );
    this.arguments.push(value);
  }

  /**
   * Add an is null query
   * @param column column
   */
  addIsNull(column: SQLiteMasterColumn): void {
    this.validateAdd();
    this.queries.push(StringUtils.quoteWrap(SQLiteMasterColumn.nameFromType(column).toLowerCase()) + ' IS NULL');
  }

  /**
   * Add an is not null query
   * @param column column
   */
  addIsNotNull(column: SQLiteMasterColumn): void {
    this.validateAdd();
    this.queries.push(StringUtils.quoteWrap(SQLiteMasterColumn.nameFromType(column).toLowerCase()) + ' IS NOT NULL');
  }

  /**
   * Validate the state of the query when adding to the query
   */
  validateAdd(): void {
    if ((this.combineOperation === null || this.combineOperation === undefined) && this.queries.length !== 0) {
      throw new GeoPackageException('Query without a combination operation supports only a single query');
    }
  }

  /**
   * Determine a query has been set
   * @return true if has a query
   */
  has(): boolean {
    return this.queries.length !== 0;
  }

  /**
   * Build the query SQL
   * @return sql
   */
  buildSQL(): string {
    let sql = '';
    if (this.queries.length > 1) {
      sql = sql.concat('( ');
    }
    for (let i = 0; i < this.queries.length; i++) {
      if (i > 0) {
        sql = sql.concat(' ');
        sql = sql.concat(this.combineOperation);
        sql = sql.concat(' ');
      }
      sql = sql.concat(this.queries[i]);
    }
    if (this.queries.length > 1) {
      sql = sql.concat(' )');
    }
    return sql;
  }

  /**
   * Get the query arguments
   * @return arguments
   */
  getArguments(): string[] {
    return this.arguments;
  }

  /**
   * Create an empty query that supports a single query
   * @return query
   */
  static create(): SQLiteMasterQuery {
    return new SQLiteMasterQuery(null);
  }

  /**
   * Create a query with multiple queries combined by an OR
   * @return query
   */
  static createOr(): SQLiteMasterQuery {
    return new SQLiteMasterQuery('OR');
  }

  /**
   * Create a query with multiple queries combined by an AND
   * @return query
   */
  static createAnd(): SQLiteMasterQuery {
    return new SQLiteMasterQuery('AND');
  }

  /**
   * Create a single equality query
   *
   * @param column column
   * @param value value
   * @return query
   */
  static createForColumnValue(column: SQLiteMasterColumn, value: string): SQLiteMasterQuery {
    const query = this.create();
    query.add(column, '=', value);
    return query;
  }

  /**
   * Create a single query
   * @param column column
   * @param operation operation
   * @param value value
   * @return query
   */
  static createForOperationAndColumnValue(
    column: SQLiteMasterColumn,
    operation: string,
    value: string,
  ): SQLiteMasterQuery {
    const query = this.create();
    query.add(column, operation, value);
    return query;
  }

  /**
   * Create an equality query with multiple values for a single column
   * combined with an OR
   * @param column column
   * @param values value
   * @return query
   */
  static createOrForColumnValue(column: SQLiteMasterColumn, values: string[]): SQLiteMasterQuery {
    const query = this.createOr();
    values.forEach((value) => {
      query.add(column, '=', value);
    });
    return query;
  }

  /**
   * Create a query with multiple values for a single column combined with an
   * OR
   *
   * @param column column
   * @param operation operation
   * @param values value
   * @return query
   */
  static createOrForOperationAndColumnValue(
    column: SQLiteMasterColumn,
    operation: string,
    values: string[],
  ): SQLiteMasterQuery {
    const query = this.createOr();
    values.forEach((value) => {
      query.add(column, operation, value);
    });
    return query;
  }

  /**
   * Create an equality query with multiple values for a single column
   * combined with an AND
   * @param column column
   * @param values value
   * @return query
   */
  static createAndForColumnValue(column: SQLiteMasterColumn, values: string[]): SQLiteMasterQuery {
    const query = this.createAnd();
    values.forEach((value) => {
      query.add(column, '=', value);
    });
    return query;
  }

  /**
   * Create a query with multiple values for a single column combined with an
   * AND
   * @param column column
   * @param operation operation
   * @param values value
   * @return query
   */
  static createAndForOperationAndColumnValue(
    column: SQLiteMasterColumn,
    operation: string,
    values: string[],
  ): SQLiteMasterQuery {
    const query = this.createAnd();
    values.forEach((value) => {
      query.add(column, operation, value);
    });
    return query;
  }

  /**
   * Create a query to find views in the sql column referring to the table
   * @param tableName table name
   * @return query
   */
  static createTableViewQuery(tableName: string): SQLiteMasterQuery {
    const queries = [];
    queries.push('%"' + tableName + '"%');
    queries.push('% ' + tableName + ' %');
    queries.push('%,' + tableName + ' %');
    queries.push('% ' + tableName + ',%');
    queries.push('%,' + tableName + ',%');
    queries.push('% ' + tableName);
    queries.push('%,' + tableName);
    return SQLiteMasterQuery.createOrForOperationAndColumnValue(SQLiteMasterColumn.SQL, 'LIKE', queries);
  }
}
