import { FieldValues } from './fieldValues';
import { SqliteQueryBuilder } from '../db/sqliteQueryBuilder';
import { DBValue } from '../db/dbValue';
import { SQLUtils } from '../db/sqlUtils';
import type { GeoPackage } from '../geoPackage';
import type { GeoPackageConnection } from '../db/geoPackageConnection';

/**
 * Return class for the {@link Dao#createOrUpdate(Object)} method.
 */
export class CreateOrUpdateStatus {
  private created: boolean;
  private updated: boolean;
  private numLinesChanged: number;

  public constructor(created: boolean, updated: boolean, numberLinesChanged: number) {
    this.created = created;
    this.updated = updated;
    this.numLinesChanged = numberLinesChanged;
  }

  public isCreated(): boolean {
    return this.created;
  }

  public isUpdated(): boolean {
    return this.updated;
  }

  public getNumLinesChanged(): number {
    return this.numLinesChanged;
  }
}

/**
 * Base DAO
 */
export abstract class Dao<T, ID> {
  /**
   * GeoPackage
   */
  readonly geoPackage: GeoPackage;
  /**
   * Database connection to the sqlite file
   */
  readonly db: GeoPackageConnection;

  /**
   * ID Columns for this DAO
   */
  idColumns: string[];

  /**
   * Name of the table within the GeoPackage
   */
  gpkgTableName: string;

  /**
   * Constructor
   * @param geoPackage GeoPackageConnection object
   * @param tableName tableName
   */
  constructor(geoPackage: GeoPackage, tableName?: string) {
    this.geoPackage = geoPackage;
    this.db = geoPackage.getConnection();
    this.gpkgTableName = tableName;
  }

  /**
   * Creates a object from the result
   */
  abstract createObject(result: Record<string, DBValue>): T;

  getTableName(): string {
    return this.gpkgTableName;
  }

  /**
   * Checks if the table exists
   */
  isTableExists(): boolean {
    return this.db.isTableExists(this.gpkgTableName);
  }

  /**
   * Checks if the ID exists
   * @param id
   */
  idExists(id: ID): boolean {
    return this.queryForIdWithKey(id) != null;
  }

  /**
   * Refreshes the object by id
   * @param object object to refresh
   */
  refresh(object: T): T | undefined {
    return this.queryForSameId(object);
  }

  /**
   * Query for object by id
   * @param  id ID of the object to query for
   * @return object created from the raw database object
   */
  queryForId(id: DBValue): T | undefined {
    const whereString = this.buildPkWhere(id);
    const whereArgs = this.buildPkWhereArgs(id);
    const query = SqliteQueryBuilder.buildQuery(false, SQLUtils.quoteWrap(this.gpkgTableName), undefined, whereString);
    const result = this.db.get(query, whereArgs);
    if (!result) return;
    return this.createObject(result);
  }

  /**
   * Query for equal
   * @param field
   * @param value
   */
  queryForEq(field: string, value: any): T[] {
    return this.queryForAllEq(field, value).map((result) => this.createObject(result));
  }

  queryForSameId(object: T): T {
    const idArray = this.getMultiId(object);
    return this.queryForMultiId(idArray);
  }

  getMultiId(object: T | any): any[] {
    const idValues: any[] = [];
    for (let i = 0; i < this.idColumns.length; i++) {
      const idValue = object.values ? object.values[this.idColumns[i]] : object[this.idColumns[i]];
      if (idValue !== undefined) {
        idValues.push(idValue);
      }
    }
    return idValues;
  }

  /**
   * Query for object by multi id
   * @param  idValues ColumnValues with the multi id
   * @return object created from the raw database object
   */
  queryForMultiId(idValues: DBValue[]): T {
    const whereString = this.buildPkWhere(idValues);
    const whereArgs = this.buildPkWhereArgs(idValues);
    const query = SqliteQueryBuilder.buildQuery(false, SQLUtils.quoteWrap(this.gpkgTableName), undefined, whereString);
    const result = this.db.get(query, whereArgs);
    if (!result) return;
    return this.createObject(result);
  }

  /**
   * Performs a raw query
   * @param sql
   * @param params
   */
  queryRaw(sql: string, params?: [] | Record<string, any>): Record<string, DBValue> {
    return this.db.get(sql, params);
  }

  /**
   * Performs a raw query
   * @param sql
   * @param params
   */
  queryAllRaw(sql: string, params?: [] | Record<string, any>): Record<string, DBValue>[] {
    return this.db.all(sql, params);
  }

  /**
   * Performs a raw query
   * @param sql
   * @param params
   */
  queryEachRaw(sql: string, params?: [] | Record<string, any>): IterableIterator<any> {
    return this.db.each(sql, params);
  }

  /**
   * Queries for all matches and returns them in the callback.  Be aware this pulls all results into memory
   * @param  {string} [where]     Optional where clause
   * @param  {object[]} [whereArgs] Optional where args array
   * @return {Object[]} raw object array from the database
   */
  queryForAll(where?: string, whereArgs?: DBValue[]): Record<string, DBValue>[] {
    const query = SqliteQueryBuilder.buildQuery(false, SQLUtils.quoteWrap(this.gpkgTableName), undefined, where);
    return this.db.all(query, whereArgs);
  }

  /**
   * Queries for all matches and returns them in the callback.  Be aware this pulls all results into memory
   * @param  {string} [where]     Optional where clause
   * @param  {object[]} [whereArgs] Optional where args array
   * @return {Object[]} raw object array from the database
   */
  queryForAllAndCreateObjects(where?: string, whereArgs?: DBValue[]): T[] {
    const query = SqliteQueryBuilder.buildQuery(false, SQLUtils.quoteWrap(this.gpkgTableName), undefined, where);
    return this.db.all(query, whereArgs).map((result) => this.createObject(result));
  }

  /**
   * Queries for all matches and returns them in the callback.  Be aware this pulls all results into memory
   * @param  {string} fieldName name of the field to query for
   * @param  {string} value     value of the like clause
   * @return {Object[]} raw object array from the database
   */
  queryForLike(fieldName: string, value: string): Record<string, DBValue>[] {
    const values = new FieldValues();
    values.addFieldValue(fieldName, value);
    const where = this.buildWhereLike(values);
    const whereArgs = this.buildWhereArgs(value);
    const query = SqliteQueryBuilder.buildQuery(false, SQLUtils.quoteWrap(this.gpkgTableName), undefined, where);
    return this.db.all(query, whereArgs);
  }

  /**
   * Queries for all matches and returns them.  Only queries for the specified column name  Be aware this pulls all results into memory
   * @param {string}  columnName  name of the column to query for
   * @param {FieldValues} [fieldValues] optional values to filter on
   * @return {Object[]} raw object array from the database
   */
  queryForColumns(columnName: string, fieldValues?: FieldValues): Record<string, DBValue>[] {
    let where: string | undefined = undefined;
    let whereArgs: DBValue[] | null = null;
    if (fieldValues) {
      where = this.buildWhere(fieldValues);
      whereArgs = this.buildWhereArgs(fieldValues);
    }
    const query = SqliteQueryBuilder.buildQuery(false, SQLUtils.quoteWrap(this.gpkgTableName), [columnName], where);
    return this.db.all(query, whereArgs);
  }

  /**
   * Query for column of rows matching the where clause
   * @param columnName
   * @param where
   * @param whereArgs
   */
  queryForColumnWhere(columnName: string, where?: string, whereArgs?: DBValue[]): Record<string, DBValue>[] {
    const query = SqliteQueryBuilder.buildQuery(false, SQLUtils.quoteWrap(this.gpkgTableName), [columnName], where);
    return this.db.all(query, whereArgs);
  }

  /**
   * Queries for all items in the table with a page size and page number
   * @param  {number} pageSize size of the chunk to query for
   * @param  {number} page     chunk number to query for
   * @return {Object[]} raw object array from the database
   */
  queryForChunk(pageSize: number, page: number): Record<string, DBValue>[] {
    const query = SqliteQueryBuilder.buildQuery(
      false,
      SQLUtils.quoteWrap(this.gpkgTableName),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      this.idColumns[0],
      pageSize,
      page * pageSize,
    );
    return this.db.all(query);
  }

  /**
   * Iterate all items in the table one at a time.  If no parameters are passed, iterates the entire table.  Returns an Iterable object
   * @param  {string} [field]   field to filter on
   * @param  {Object} [value]   value to filter on
   * @param  {string} [groupBy] group by clause
   * @param  {string} [having]  having clause
   * @param  {string} [orderBy] order by clause
   * @param  {string[]} [columns] columns to retrieve
   * @return {IterableIterator<any>} iterable of database objects
   */
  queryForEach(
    field?: string,
    value?: DBValue,
    groupBy?: string,
    having?: string,
    orderBy?: string,
    columns?: string[],
  ): IterableIterator<Record<string, DBValue>> {
    if (!field) {
      const query: string = SqliteQueryBuilder.buildQuery(
        false,
        SQLUtils.quoteWrap(this.gpkgTableName),
        columns,
        undefined,
        undefined,
        groupBy,
        having,
        orderBy,
      );
      return this.db.each(query);
    } else {
      const whereString: string = this.buildWhereWithFieldAndValue(field, value);
      const whereArgs: DBValue[] | null = this.buildWhereArgs(value);
      const query = SqliteQueryBuilder.buildQuery(
        false,
        SQLUtils.quoteWrap(this.gpkgTableName),
        undefined,
        whereString,
        undefined,
        groupBy,
        having,
        orderBy,
      );
      return this.db.each(query, whereArgs);
    }
  }

  abstract queryForIdWithKey(key: ID): T;

  /**
   * Iterate all objects in thet able that match the ColumnValues passed in
   * @param  {FieldValues} fieldValues ColumnValues to query for
   * @return {IterableIterator<any>}
   */
  queryForFieldValues(fieldValues: FieldValues): IterableIterator<Record<string, DBValue>> {
    const whereString: string = this.buildWhere(fieldValues);
    const whereArgs: DBValue[] = this.buildWhereArgs(fieldValues);
    const query = SqliteQueryBuilder.buildQuery(false, SQLUtils.quoteWrap(this.gpkgTableName), undefined, whereString);
    return this.db.each(query, whereArgs);
  }

  /**
   * Iterate all matching objects
   * @param  {string} join      join clause
   * @param  {string} where     where clause
   * @param  {Object[]} whereArgs array of where query values
   * @param  {string[]} columns   columns to query for
   * @return {IterableIterator<any>}
   */
  queryJoinWhereWithArgs(
    join: string,
    where?: string,
    whereArgs?: DBValue[],
    columns?: string[],
  ): IterableIterator<Record<string, DBValue>> {
    const query = SqliteQueryBuilder.buildQuery(false, SQLUtils.quoteWrap(this.gpkgTableName), columns, where, join);
    return this.db.each(query, whereArgs);
  }

  /**
   * Count all matching objects
   * @param  {string} join      join clause
   * @param  {string} where     where clause
   * @param  {Object[]} whereArgs array of where query values
   * @return {number}
   */
  countJoinWhereWithArgs(join: string, where?: string, whereArgs?: DBValue[]): number {
    const query = "select COUNT(*) as count from '" + this.gpkgTableName + "' " + join + ' where ' + where;
    const result = this.db.get(query, whereArgs);
    return result?.count;
  }

  /**
   * Iterate all distinct matching rows in the table
   * @param  {string} where     where clause
   * @param  {Object[]} whereArgs array of where query values
   * @return {IterableIterator<any>}
   */
  queryWhereWithArgsDistinct(where: string, whereArgs?: DBValue[]): IterableIterator<Record<string, DBValue>> {
    const query = SqliteQueryBuilder.buildQuery(true, SQLUtils.quoteWrap(this.gpkgTableName), undefined, where);
    return this.db.each(query, whereArgs);
  }

  /**
   * Creates a geometry index iterator from the iterator returned from a query
   * @param iterator
   * @private
   */
  public createTypedIterator(iterator: IterableIterator<Record<string, DBValue>>): IterableIterator<T> {
    const createObject = this.createObject;
    return {
      [Symbol.iterator](): IterableIterator<T> {
        return this;
      },
      next(): { value: T; done: boolean } {
        let tObj = null;
        const result = iterator.next();
        if (result.value != null) {
          tObj = createObject(result.value);
        }
        return {
          value: tObj,
          done: result.done,
        };
      },
    };
  }

  /**
   * Iterate all matching rows
   * @param  {string} [where]     where clause
   * @param  {Object[]} [whereArgs] array of where query values
   * @param  {string} [groupBy]   group by clause
   * @param  {string} [having]    having clause
   * @param  {string} [orderBy]   order by clause
   * @param  {number} [limit]     limit clause
   * @return {IterableIterator<any>}
   */
  queryWhere(
    where?: string,
    whereArgs?: DBValue[],
    groupBy?: string,
    having?: string,
    orderBy?: string,
    limit?: number,
  ): IterableIterator<Record<string, DBValue>> {
    const query: string = SqliteQueryBuilder.buildQuery(
      false,
      SQLUtils.quoteWrap(this.gpkgTableName),
      undefined,
      where,
      undefined,
      groupBy,
      having,
      orderBy,
      limit,
    );
    return this.db.each(query, whereArgs);
  }

  /**
   * Get the primary key where clause
   * @param  {Object|Object[]} idValue id
   * @return {string} primary key where clause
   */
  buildPkWhere(idValue: any[] | any): string {
    if (Array.isArray(idValue)) {
      const idValuesArray = idValue;
      const idColumnValues = new FieldValues();
      for (let i = 0; i < idValuesArray.length; i++) {
        idColumnValues.addFieldValue(this.idColumns[i], idValuesArray[i]);
      }
      return this.buildWhere(idColumnValues);
    }
    return this.buildWhereWithFieldAndValue(this.idColumns[0], idValue);
  }

  /**
   * Get the primary key where args
   * @param  {Object} idValue id
   * @return {Object[]} where args
   */
  buildPkWhereArgs(idValue: DBValue[] | DBValue): DBValue[] {
    if (Array.isArray(idValue)) {
      const idValuesArray = idValue;
      let values: DBValue[] = [];
      for (let i = 0; i < idValuesArray.length; i++) {
        const value = this.buildWhereArgs(idValuesArray[i]);
        if (value != null) {
          values = values.concat(value);
        }
      }
      return values;
    }
    return this.buildWhereArgs(idValue);
  }

  /**
   * Build where (or selection) LIKE statement for fields
   * @param  {FieldValues} fields    columns and values
   * @param  {string} [operation] AND or OR
   * @return {string} where clause
   */
  buildWhereLike(fields: FieldValues, operation?: string): string {
    let whereString = '';
    for (let i = 0; i < fields.columns.length; i++) {
      const column = fields.columns[i];
      const value = fields.values[i];
      if (i) {
        whereString += ' ' + operation + ' ';
      }
      whereString += this.buildWhereWithFieldAndValue(column, value, 'like');
    }
    return whereString;
  }

  /**
   * Build where or selection statement for fields
   * @param  fields    columns and values
   * @param  [operation=AND] AND or OR
   * @return where clause
   */
  buildWhere(fields: FieldValues, operation = 'and'): string {
    let whereString = '';
    for (let i = 0; i < fields.columns.length; i++) {
      const column = fields.columns[i];
      const value = fields.values[i];
      if (i) {
        whereString += ' ' + operation + ' ';
      }
      whereString += this.buildWhereWithFieldAndValue(column, value);
    }
    return whereString;
  }

  /**
   * Builds a where args array
   * @param {any[]|FieldValues|any} values argument values to push
   * @returns {any[]}
   */
  buildWhereArgs(values: DBValue[] | FieldValues | DBValue): DBValue[] | null {
    let args: DBValue[] = [];
    if (Array.isArray(values)) {
      args = this._buildWhereArgsWithArray(values);
    } else if (values instanceof FieldValues) {
      args = this._buildWhereArgsWithColumnValues(values);
    } else {
      if (values !== undefined && values !== null) {
        args.push(values);
      }
    }
    return args.length ? args : null;
  }

  /**
   * Builds a where args array
   * @param {any[]} values argument values to push
   * @returns {any[]}
   */
  _buildWhereArgsWithArray(values: DBValue[]): DBValue[] {
    const args = [];
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      if (value !== undefined && value !== null) {
        args.push(value);
      }
    }
    return args;
  }

  /**
   * Builds a where args array
   * @param {FieldValues} values argument values to push
   * @returns {any[]}
   */
  _buildWhereArgsWithColumnValues(values: FieldValues): DBValue[] {
    const args = [];
    for (let i = 0; i < values.columns.length; i++) {
      const value = values.values[i];
      if (value !== undefined && value !== null) {
        args.push(value);
      }
    }
    return args;
  }

  /**
   * Builds a where clause from the field and value with an optional operation.  If the value is empty, 'is null' is added to the query for the field
   * @param  {string} field     field name
   * @param  {Object} [value]     optional value to filter on
   * @param  {string} [operation='='] optional operation
   * @return {string} where clause
   */
  buildWhereWithFieldAndValue(field: string, value: DBValue, operation = '='): string {
    let whereString = '' + field + ' ';
    if (value === undefined || value === null) {
      whereString += 'is null';
    } else {
      whereString += operation + ' ?';
    }
    return whereString;
  }

  /**
   * Query for all rows in the table that match
   * @param  {string} field   field to match
   * @param  {*} value   value to match
   * @param  {string} [groupBy] group by clause
   * @param  {string} [having]  having clause
   * @param  {string} [orderBy] order by clause
   * @return {Object[]} array of raw database objects
   */
  queryForAllEq(
    field: string,
    value: DBValue,
    groupBy?: string,
    having?: string,
    orderBy?: string,
  ): Record<string, DBValue>[] {
    const whereString = this.buildWhereWithFieldAndValue(field, value);
    const whereArgs = this.buildWhereArgs(value);
    const query = SqliteQueryBuilder.buildQuery(
      false,
      SQLUtils.quoteWrap(this.gpkgTableName),
      undefined,
      whereString,
      undefined,
      groupBy,
      having,
      orderBy,
    );
    return this.db.all(query, whereArgs);
  }

  /**
   * Count rows in the table optionally filtered by the parameters specified
   * @param  {FieldValues|string} [fields] Either a ColumnValues object or a string specifying a field name
   * @param  {Object} [value]  value to filter on if fields is a string
   * @return {number} count of objects
   */
  count(fields?: FieldValues | string, value?: DBValue): number {
    if (!fields) {
      return this.db.count(this.gpkgTableName);
    }
    let where;
    let whereArgs;
    let query;
    if (fields instanceof FieldValues) {
      where = this.buildWhere(fields, 'and');
      whereArgs = this.buildWhereArgs(fields);
      query = SqliteQueryBuilder.buildCount(SQLUtils.quoteWrap(this.gpkgTableName), where);
    } else {
      const whereString = this.buildWhereWithFieldAndValue(fields, value);
      whereArgs = this.buildWhereArgs(value);
      query = SqliteQueryBuilder.buildCount(SQLUtils.quoteWrap(this.gpkgTableName), whereString);
    }
    const result = this.db.get(query, whereArgs);
    return result?.count;
  }

  /**
   * Count rows in the table optionally filtered by the parameters specified
   * @param  {string} where where string
   * @param  {any[]} whereArgs arguments to filter on
   * @return {number} count of objects
   */
  countWhere(where: string, whereArgs: DBValue[]): number {
    const query = SqliteQueryBuilder.buildCount(SQLUtils.quoteWrap(this.gpkgTableName), where);
    const result = this.db.get(query, whereArgs);
    return result?.count;
  }

  /**
   * Get the min of the column
   * @param  {string} column    column name
   * @param  {string} [where]     where clause
   * @param  {Object[]} [whereArgs] where args
   * @return {number}
   */
  minOfColumn(column: string, where?: string, whereArgs?: DBValue[]): number {
    return this.db.minOfColumn(SQLUtils.quoteWrap(this.gpkgTableName), column, where, whereArgs);
  }

  /**
   * Get the max of the column
   * @param  {string} column    column name
   * @param  {string} [where]     where clause
   * @param  {Object[]} [whereArgs] where args
   * @return {number}
   */
  maxOfColumn(column: string, where?: string, whereArgs?: DBValue[]): number {
    return this.db.maxOfColumn(SQLUtils.quoteWrap(this.gpkgTableName), column, where, whereArgs);
  }

  /**
   * Delete the object passed in.  Object is deleted by id
   * @param  {Object} object object to delete
   * @return {number} number of objects deleted
   */
  delete(object: T | Record<string, DBValue>): number {
    if (typeof (object as any).getId === 'function') {
      return this.deleteById((object as any).getId());
    }
    return this.deleteByMultiId(this.getMultiId(object));
  }

  /**
   * Delete the object specified by the id
   * @param  {Object} idValue id value
   * @return {number} number of objects deleted
   */
  deleteById(idValue: DBValue): number {
    const where = this.buildPkWhere(idValue);
    const whereArgs = this.buildPkWhereArgs(idValue);
    return this.db.delete(SQLUtils.quoteWrap(this.gpkgTableName), where, whereArgs);
  }

  /**
   * Delete the object specified by the ids
   * @param  {FieldValues} idValues id values
   * @return {number} number of objects deleted
   */
  deleteByMultiId(idValues: any[]): number {
    const where = this.buildPkWhere(idValues);
    const whereArgs = this.buildPkWhereArgs(idValues);
    return this.db.delete(SQLUtils.quoteWrap(this.gpkgTableName), where, whereArgs);
  }

  deleteByID(id: ID): void {
    if (typeof id === 'object') {
      this.deleteByMultiId(Object.values(id));
    } else if (typeof id === 'number' || typeof id === 'boolean' || typeof id === 'string') {
      this.deleteById(id);
    }
  }

  /**
   * Delete objects that match the query
   * @param  {string} where     where clause
   * @param  {Object[]} whereArgs where arguments
   * @return {number} number of objects deleted
   */
  deleteWhere(where: string, whereArgs: DBValue[]): number {
    return this.db.delete(SQLUtils.quoteWrap(this.gpkgTableName), where, whereArgs);
  }

  /**
   * Delete all objects in the table
   * @return {number} number of objects deleted
   */
  deleteAll(): number {
    return this.db.delete(SQLUtils.quoteWrap(this.gpkgTableName), '', []);
  }

  /**
   * Insert the object into the table
   * @param  {Object} object object to be inserted
   * @return {number} id of the inserted object
   */
  create(object: T): number {
    const sql = SqliteQueryBuilder.buildInsert(SQLUtils.quoteWrap(this.gpkgTableName), object);
    const insertObject = SqliteQueryBuilder.buildUpdateOrInsertObject(object);
    return this.db.insert(sql, insertObject);
  }

  /**
   * Update all rows that match the query
   * @param  {FieldValues} values    values to insert
   * @param  {string} where     where clause
   * @param  {Object[]} whereArgs where arguments
   * @return {number} number of objects updated
   */
  updateWithValues(
    values: Record<string, DBValue>,
    where: string,
    whereArgs: DBValue[],
  ): {
    changes: number;
    lastInsertRowid: number;
  } {
    const update = SqliteQueryBuilder.buildUpdate(SQLUtils.quoteWrap(this.gpkgTableName), values, where, whereArgs);
    return this.db.run(update.sql, update.args);
  }

  /**
   * Update the object specified
   * @param  {Object} object object with updated values
   * @return {number} number of objects updated
   */
  update(object: T): {
    changes: number;
    lastInsertRowid: number;
  } {
    const updateValues = SqliteQueryBuilder.buildUpdateOrInsertObject(object);
    let update = SqliteQueryBuilder.buildObjectUpdate(SQLUtils.quoteWrap(this.gpkgTableName), object);
    const multiId = this.getMultiId(object);
    if (multiId.length > 0) {
      let where = ' where ';
      for (let i = 0; i < multiId.length; i++) {
        if (i > 0) {
          where += ' and ';
        }
        where += '"' + this.idColumns[i] + '" = $' + SqliteQueryBuilder.fixColumnName(this.idColumns[i]);
        updateValues[SqliteQueryBuilder.fixColumnName(this.idColumns[i])] = multiId[i];
      }
      update += where;
    }
    return this.db.run(update, updateValues);
  }

  /**
   * Queries for the object by id, and if it exists, updates it, otherwise creates a new object
   * @param  {Object} object object to update or create
   * @return {number} number of objects modified
   */
  createOrUpdate(object: T): CreateOrUpdateStatus {
    const existing = this.queryForSameId(object);
    if (!existing) {
      const rowsInserted = this.create(object);
      return new CreateOrUpdateStatus(true, false, rowsInserted);
    } else {
      const rowsUpdated = this.update(object).changes;
      return new CreateOrUpdateStatus(false, true, rowsUpdated);
    }
  }

  /**
   * Drop the user table
   */
  public dropTable(): void {
    SQLUtils.dropTable(this.db, this.getTableName());
  }

  /**
   * Drops this table
   */
  dropTableWithTableName(tableName: string): void {
    SQLUtils.dropTable(this.db, tableName);
  }

  /**
   * Rename the table
   * @param {string} newName
   */
  rename(newName: string): void {
    this.db.run('ALTER TABLE ' + SQLUtils.quoteWrap(this.gpkgTableName) + ' RENAME TO ' + SQLUtils.quoteWrap(newName));
    this.gpkgTableName = newName;
  }
}
