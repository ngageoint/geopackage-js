/**
 * SQLite query builder module.
 * @module db/sqliteQueryBuilder
 */

/**
 * Utility class to build sql queries
 * @class
 */
export class SqliteQueryBuilder {
  /**
   * Replaces all whitespace in a column name with underscores
   * @param  {string} columnName column name to fix
   * @return {string}
   */
  static fixColumnName(columnName: string): string {
    return columnName.replace(/\W+/g, '_');
  }

  /**
   * Builds a query
   * @param  {Boolean} distinct whether query should be distinct or not
   * @param  {string} tables   table names to query, added to the query from clause
   * @param  {string[]} [columns]  columns to query for
   * @param  {string} [where]    where clause
   * @param  {string} [join]     join clause
   * @param  {string} [groupBy]  group by clause
   * @param  {string} [having]   having clause
   * @param  {string} [orderBy]  order by clause
   * @param  {Number} [limit]    limit
   * @param  {Number} [offset]   offset
   * @return {string}
   */
  static buildQuery(
    distinct: boolean,
    tables: string,
    columns?: string[],
    where?: string,
    join?: string,
    groupBy?: string,
    having?: string,
    orderBy?: string,
    limit?: number,
    offset?: number,
  ): string {
    let query = '';
    if (SqliteQueryBuilder.isEmpty(groupBy) && !SqliteQueryBuilder.isEmpty(having)) {
      throw new Error('Illegal Arguments: having clauses require a groupBy clause');
    }

    query += 'select ';
    if (distinct) {
      query += 'distinct ';
    }
    if (columns && columns.length) {
      query = SqliteQueryBuilder.appendColumnsToString(columns, query);
    } else {
      query += '* ';
    }

    query += 'from ' + tables;
    if (join) {
      query += ' ' + join;
    }
    query = SqliteQueryBuilder.appendClauseToString(query, ' where ', where);
    query = SqliteQueryBuilder.appendClauseToString(query, ' group by ', groupBy);
    query = SqliteQueryBuilder.appendClauseToString(query, ' having ', having);
    query = SqliteQueryBuilder.appendClauseToString(query, ' order by ', orderBy);
    query = SqliteQueryBuilder.appendClauseToString(query, ' limit ', limit);
    query = SqliteQueryBuilder.appendClauseToString(query, ' offset ', offset);

    return query;
  }

  /**
   * Builds a count statement
   * @param  {string} tables table names to query for
   * @param  {string} [where]  where clause
   * @return {string} count statement
   */
  static buildCount(tables: string, where?: string): string {
    let query = 'select count(*) as count from ' + tables;
    query = SqliteQueryBuilder.appendClauseToString(query, ' where ', where);
    return query;
  }

  /**
   * Builds an insert statement using the properties of the object
   * @param  {string} table  table to insert into
   * @param  {Object} object object to insert
   * @return {string} insert statement
   */
  static buildInsert(table: string, object: any): string {
    if (object.getColumnNames) {
      return SqliteQueryBuilder.buildInsertFromColumnNames(table, object);
    }
    let insert = 'insert into ' + table + ' (';
    let keys = '';
    let values = '';
    let first = true;
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key) && object[key] !== undefined) {
        if (!first) {
          keys += ',';
          values += ',';
        }
        first = false;
        keys += key;
        values += '$' + SqliteQueryBuilder.fixColumnName(key);
      }
    }

    insert += keys + ') values (' + values + ')';
    return insert;
  }

  /**
   * Builds an insert statement from the object.getColumnNames method
   * @param  {string} table  table to insert into
   * @param  {Object} object object with a getColumnNames method
   * @return {string} insert statement
   */
  static buildInsertFromColumnNames(table: string, object: any): string {
    let insert = 'insert into ' + table + ' (';
    let keys = '';
    let values = '';
    let first = true;
    const columnNames = object.getColumnNames();
    for (let i = 0; i < columnNames.length; i++) {
      const key = columnNames[i];
      if (!first) {
        keys += ',';
        values += ',';
      }
      first = false;
      keys += '"' + key + '"';
      values += '$' + SqliteQueryBuilder.fixColumnName(key);
    }

    insert += keys + ') values (' + values + ')';
    return insert;
  }

  /**
   * Builds an update or insert object to bind to a statement
   * @param  {Object} object object to create bind parameters from
   * @return {Object} bind parameters
   */
  static buildUpdateOrInsertObject(object: any): any {
    const insertOrUpdate = {};
    if (object.getColumnNames) {
      const columnNames = object.getColumnNames();
      for (let i = 0; i < columnNames.length; i++) {
        insertOrUpdate[SqliteQueryBuilder.fixColumnName(columnNames[i])] = object.toDatabaseValue(columnNames[i]);
      }
    } else {
      for (const key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key) && object[key] !== undefined) {
          if (object.toDatabaseValue) {
            insertOrUpdate[SqliteQueryBuilder.fixColumnName(key)] = object.toDatabaseValue(key);
          } else {
            if (typeof object[key] === 'boolean') {
              insertOrUpdate[SqliteQueryBuilder.fixColumnName(key)] = object[key] ? 1 : 0;
            } else if (object[key] instanceof Date) {
              insertOrUpdate[SqliteQueryBuilder.fixColumnName(key)] = new Date(object[key]).toISOString();
            } else {
              insertOrUpdate[SqliteQueryBuilder.fixColumnName(key)] = object[key];
            }
          }
        }
      }
    }
    return insertOrUpdate;
  }

  /**
   * Builds an update statement
   * @param  {string} table     table to update
   * @param  {Object} values    object with values to update
   * @param  {string} [where]     where clause
   * @param  {Array|Object} [whereArgs] where bind parameters
   * @return {Object} object with a sql property containing the update statement and an args property with bind arguments
   */
  static buildUpdate(table: string, values: any, where: string, whereArgs: any[] | any): { sql: string; args: any[] } {
    const args: any[] = [];
    let update = 'update ' + table + ' set ';
    let first = true;
    for (const columnName in values) {
      if (!first) {
        update += ', ';
      }
      first = false;
      update += '"' + columnName + '"';
      args.push(values[columnName]);
      update += '=?';
    }
    if (whereArgs) {
      for (let i = 0; i < whereArgs.length; i++) {
        args.push(whereArgs[i]);
      }
    }
    if (where) {
      update += ' where ';
      update += where;
    }
    return {
      sql: update,
      args: args,
    };
  }

  /**
   * Builds an update from an object
   * @param  {string} table  table name to update
   * @param  {Object} object object with values to update
   * @return {string} update statement
   */
  static buildObjectUpdate(table: string, object: any): string {
    let update = 'update ' + table + ' set ';
    let first = true;
    if (object.getColumnNames) {
      const columnNames = object.getColumnNames();

      for (let i = 0; i < columnNames.length; i++) {
        const key = columnNames[i];
        if (!first) {
          update += ', ';
        }
        first = false;
        update += '"' + key + '"=';
        update += '$' + SqliteQueryBuilder.fixColumnName(key);
      }
    } else {
      for (const prop in object) {
        if (!first) {
          update += ', ';
        }
        first = false;

        if (Object.prototype.hasOwnProperty.call(object, prop)) {
          update += '"' + prop + '"=';
          update += '$' + SqliteQueryBuilder.fixColumnName(prop);
        }
      }
    }

    return update;
  }

  private static appendClauseToString(string: string, name: string, clause?: any): string {
    if (clause) {
      string += name + clause;
    }
    return string;
  }

  private static appendColumnsToString(columns: string[], string: string): string {
    if (!columns || !columns.length) return string;
    string += SqliteQueryBuilder.columnToAppend(columns[0]);
    for (let i = 1; i < columns.length; i++) {
      string += ', ' + SqliteQueryBuilder.columnToAppend(columns[i]);
    }
    string += ' ';
    return string;
  }

  private static columnToAppend(column: string): string {
    return column.indexOf('*') !== -1 ? column : '"' + column + '"';
  }

  private static isEmpty(string: string | undefined): boolean {
    return !string || string.length === 0;
  }
}
