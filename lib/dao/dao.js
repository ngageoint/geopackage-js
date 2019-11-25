/**
 * Dao module.
 */

var sqliteQueryBuilder = require('../db/sqliteQueryBuilder')
  , ColumnValues = require('./columnValues');

/**
 * Base DAO
 * @class Dao
 * @param  {module:geoPackage~GeoPackage} geoPackage GeoPackage object
 */
class Dao {
  constructor(geoPackage) {
    /**
     * GeoPackage object this dao belongs to
     * @type {module:geoPackage~GeoPackage}
     */
    this.geoPackage = geoPackage;
    /**
     * Database connection to the sqlite file
     * @type {module:db/geoPackageConnection~GeoPackageConnection}
     */
    this.connection = geoPackage.getDatabase();
    /**
     * ID Columns for this DAO
     * @type {string[]}
     */
    this.idColumns;
  }
  /**
   * Creates a object from the result
   * @abstract
   * @return {*}
   */
  createObject(result) {
    throw new Error('must be implemented by subclass! ' + result);
  }
  /**
   * Copies object properties from result object to the object
   * @param  {Object} object object to copy properties to
   * @param  {Object} result object to copy properties from
   */
  populateObjectFromResult(object, result) {
    if (!result)
      return;
    for (var key in result) {
      object[key] = result[key];
    }
  }
  /**
   * Checks if the table exists
   * @return  {Boolean}
   */
  isTableExists() {
    var results = this.connection.isTableExists(this.gpkgTableName);
    return !!results;
  }
  /**
   * Refreshes the object by id
   * @param  {Object} object object to refresh
   * @return {Object}
   */
  refresh(object) {
    return this.queryForSameId(object);
  }
  /**
   * Query for object by id
   * @param  {object} id ID of the object to query for
   * @return {Object} object created from the raw database object
   */
  queryForId(id) {
    var whereString = this.buildPkWhere(id);
    var whereArgs = this.buildPkWhereArgs(id);
    var query = sqliteQueryBuilder.buildQuery(false, "'" + this.gpkgTableName + "'", undefined, whereString);
    var result = this.connection.get(query, whereArgs);
    if (!result)
      return;
    var object = this.createObject(result);
    // TOOD something is wrong here
    this.populateObjectFromResult(object, result);
    return object;
  }
  queryForSameId(object) {
    var idArray = this.getMultiId(object);
    return this.queryForMultiId(idArray);
  }
  getMultiId(object) {
    var idValues = [];
    for (var i = 0; i < this.idColumns.length; i++) {
      var idValue = object.values ? object.values[this.idColumns[i]] : object[this.idColumns[i]];
      if (idValue !== undefined) {
        idValues.push(idValue);
      }
    }
    return idValues;
  }
  /**
   * Query for object by multi id
   * @param  {module:dao/columnValues~ColumnValues} idValues ColumnValues with the multi id
   * @return {Object} object created from the raw database object
   */
  queryForMultiId(idValues) {
    var whereString = this.buildPkWhere(idValues);
    var whereArgs = this.buildPkWhereArgs(idValues);
    var query = sqliteQueryBuilder.buildQuery(false, "'" + this.gpkgTableName + "'", undefined, whereString);
    var result = this.connection.get(query, whereArgs);
    if (!result)
      return;
    var object = this.createObject(result);
    this.populateObjectFromResult(object, result);
    return object;
  }
  /**
   * Queries for all matches and returns them in the callback.  Be aware this pulls all results into memory
   * @param  {string} [where]     Optional where clause
   * @param  {object[]} [whereArgs] Optional where args array
   * @return {Object[]} raw object array from the database
   */
  queryForAll(where, whereArgs) {
    var query = sqliteQueryBuilder.buildQuery(false, "'" + this.gpkgTableName + "'", undefined, where);
    return this.connection.all(query, whereArgs);
  }
  /**
   * Queries for all matches and returns them in the callback.  Be aware this pulls all results into memory
   * @param  {string} fieldName name of the field to query for
   * @param  {string} value     value of the like clause
   * @return {Object[]} raw object array from the database
   */
  queryForLike(fieldName, value) {
    var values = new ColumnValues();
    values.addColumn(fieldName, value);
    var where = this.buildWhereLike(values);
    var whereArgs = this.buildWhereArgs(value);
    var query = sqliteQueryBuilder.buildQuery(false, "'" + this.gpkgTableName + "'", undefined, where);
    return this.connection.all(query, whereArgs);
  }
  /**
   * Queries for all matches and returns them.  Only queries for the specified column name  Be aware this pulls all results into memory
   * @param {string}  columnName  name of the column to query for
   * @param {module:dao/columnValues~ColumnValues} [fieldValues] optional values to filter on
   * @return {Object[]} raw object array from the database
   */
  queryForColumns(columnName, fieldValues) {
    var where;
    var whereArgs;
    if (fieldValues) {
      where = this.buildWhere(fieldValues);
      whereArgs = this.buildWhereArgs(fieldValues);
    }
    var query = sqliteQueryBuilder.buildQuery(false, "'" + this.gpkgTableName + "'", [columnName], where);
    return this.connection.all(query, whereArgs);
  }
  /**
   * Queries for all items in the table with a page size and page number
   * @param  {Number} pageSize size of the chunk to query for
   * @param  {Number} page     chunk number to query for
   * @return {Object[]} raw object array from the database
   */
  queryForChunk(pageSize, page) {
    var query = sqliteQueryBuilder.buildQuery(false, "'" + this.gpkgTableName + "'", undefined, undefined, undefined, undefined, undefined, this.idColumns[0], pageSize, page * pageSize);
    return this.connection.all(query);
  }
  /**
   * Iterate all items in the table one at a time.  If no parameters are passed, iterates the entire table.  Returns an Iterable object
   * @param  {string} [field]   field to filter on
   * @param  {Object} [value]   value to filter on
   * @param  {string} [groupBy] group by clause
   * @param  {string} [having]  having clause
   * @param  {string} [orderBy] order by clause
   * @return {IterableIterator<any>} iterable of database objects
   */
  queryForEach(field, value, groupBy, having, orderBy) {
    if (!field) {
      var query = sqliteQueryBuilder.buildQuery(false, "'" + this.gpkgTableName + "'", undefined, undefined, undefined, groupBy, having, orderBy);
      return this.connection.each(query);
    }
    else {
      var whereString = this.buildWhereWithFieldAndValue(field, value);
      var whereArgs = this.buildWhereArgs(value);
      query = sqliteQueryBuilder.buildQuery(false, "'" + this.gpkgTableName + "'", undefined, whereString, undefined, groupBy, having, orderBy);
      return this.connection.each(query, whereArgs);
    }
  }
  /**
   * Iterate all objects in thet able that match the ColumnValues passed in
   * @param  {module:dao/columnValues~ColumnValues} fieldValues ColumnValues to query for
   * @return {IterableIterator<any>}
   */
  queryForFieldValues(fieldValues) {
    var whereString = this.buildWhere(fieldValues);
    var whereArgs = this.buildWhereArgs(fieldValues);
    var query = sqliteQueryBuilder.buildQuery(false, "'" + this.gpkgTableName + "'", undefined, whereString);
    return this.connection.each(query, whereArgs);
  }
  /**
   * Iterate all matching objects
   * @param  {string} join      join clause
   * @param  {string} where     where clause
   * @param  {Object[]} whereArgs array of where query values
   * @param  {string[]} columns   columns to query for
   * @return {IterableIterator<any>}
   */
  queryJoinWhereWithArgs(join, where, whereArgs, columns) {
    var query = sqliteQueryBuilder.buildQuery(false, "'" + this.gpkgTableName + "'", columns, where, join);
    return this.connection.each(query, whereArgs);
  }
  /**
   * Count all matching objects
   * @param  {string} join      join clause
   * @param  {string} where     where clause
   * @param  {Object[]} whereArgs array of where query values
   * @return {Number}
   */
  countJoinWhereWithArgs(join, where, whereArgs) {
    var query = "select COUNT(*) as count from '" + this.gpkgTableName + "' " + join + " where " + where;
    var result = this.connection.get(query, whereArgs);
    if (!result)
      return 0;
    return result.count;
  }
  /**
   * Iterate all distinct matching rows in the table
   * @param  {string} where     where clause
   * @param  {Object[]} whereArgs array of where query values
   * @return {IterableIterator<any>}
   */
  queryWhereWithArgsDistinct(where, whereArgs) {
    var query = sqliteQueryBuilder.buildQuery(true, "'" + this.gpkgTableName + "'", undefined, where);
    return this.connection.each(query, whereArgs);
  }
  /**
   * Iterate all matching rows
   * @param  {string} [where]     where clause
   * @param  {Object[]} [whereArgs] array of where query values
   * @param  {string} [groupBy]   group by clause
   * @param  {string} [having]    having clause
   * @param  {string} [orderBy]   order by clause
   * @param  {Number} [limit]     limit clause
   * @return {IterableIterator<any>}
   */
  queryWhere(where, whereArgs, groupBy, having, orderBy, limit) {
    var query = sqliteQueryBuilder.buildQuery(false, "'" + this.gpkgTableName + "'", undefined, where, undefined, groupBy, having, orderBy, limit);
    return this.connection.each(query, whereArgs);
  }
  /**
   * Get the primary key where clause
   * @param  {Object|Object[]} idValue id
   * @return {string} primary key where clause
   */
  buildPkWhere(idValue) {
    if (Array.isArray(idValue)) {
      var idValuesArray = idValue;
      var idColumnValues = new ColumnValues();
      for (var i = 0; i < idValuesArray.length; i++) {
        idColumnValues.addColumn(this.idColumns[i], idValuesArray[i]);
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
  buildPkWhereArgs(idValue) {
    if (Array.isArray(idValue)) {
      var idValuesArray = idValue;
      var values = [];
      for (var i = 0; i < idValuesArray.length; i++) {
        values = values.concat(this.buildWhereArgs(idValuesArray[i]));
      }
      return values;
    }
    return this.buildWhereArgs(idValue);
  }
  /**
   * Build where (or selection) LIKE statement for fields
   * @param  {module:dao/columnValues~ColumnValues} fields    columns and values
   * @param  {string} [operation] AND or OR
   * @return {string} where clause
   */
  buildWhereLike(fields, operation) {
    var whereString = '';
    for (var i = 0; i < fields.columns.length; i++) {
      var column = fields.columns[i];
      if (i) {
        whereString += ' ' + operation + ' ';
      }
      whereString += this.buildWhereWithFieldAndValue(column, fields.getValue(column), 'like');
    }
    return whereString;
  }
  /**
   * Build where or selection statement for fields
   * @param  {module:dao/columnValues~ColumnValues} fields    columns and values
   * @param  {string} [operation=AND] AND or OR
   * @return {string} where clause
   */
  buildWhere(fields, operation) {
    operation = operation || 'and';
    var whereString = '';
    for (var i = 0; i < fields.columns.length; i++) {
      var column = fields.columns[i];
      if (i) {
        whereString += ' ' + operation + ' ';
      }
      whereString += this.buildWhereWithFieldAndValue(column, fields.getValue(column));
    }
    return whereString;
  }
  /**
   * Builds a where args array
   * @param {any[]|ColumnValues|any} values argument values to push
   * @returns {any[]}
   */
  buildWhereArgs(values) {
    var args = [];
    if (Array.isArray(values)) {
      args = this._buildWhereArgsWithArray(values);
    }
    else if (values.columns) {
      args = this._buildWhereArgsWithColumnValues(values);
    }
    else {
      if (values !== undefined || values !== null) {
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
  _buildWhereArgsWithArray(values) {
    var args = [];
    for (var i = 0; i < values.length; i++) {
      var value = values[i];
      if (value !== undefined && value !== null) {
        args.push(value);
      }
    }
    return args;
  }
  /**
   * Builds a where args array
   * @param {ColumnValues} values argument values to push
   * @returns {any[]}
   */
  _buildWhereArgsWithColumnValues(values) {
    var args = [];
    for (var i = 0; i < values.columns.length; i++) {
      var column = values.columns[i];
      var value = values.getValue(column);
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
  buildWhereWithFieldAndValue(field, value, operation) {
    operation = operation || '=';
    var whereString = '' + field + ' ';
    if (value === undefined || value === null) {
      whereString += "is null";
    }
    else {
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
  queryForAllEq(field, value, groupBy, having, orderBy) {
    var whereString = this.buildWhereWithFieldAndValue(field, value);
    var whereArgs = this.buildWhereArgs(value);
    var query = sqliteQueryBuilder.buildQuery(false, "'" + this.gpkgTableName + "'", undefined, whereString, undefined, groupBy, having, orderBy);
    return this.connection.all(query, whereArgs);
  }
  /**
   * Count rows in the table optionally filtered by the parameters specified
   * @param  {module:dao/columnValues~ColumnValues|string} [fields] Either a ColumnValues object or a string specifying a field name
   * @param  {Object} [value]  value to filter on if fields is a string
   * @return {Number} count of objects
   */
  count(fields, value) {
    if (!fields) {
      return this.connection.count(this.gpkgTableName);
    }
    var where;
    var whereArgs;
    var query;
    if (fields.columns) {
      where = this.buildWhere(fields, 'and');
      whereArgs = this.buildWhereArgs(fields);
      query = sqliteQueryBuilder.buildCount("'" + this.gpkgTableName + "'", where);
    }
    else {
      var whereString = this.buildWhereWithFieldAndValue(fields, value);
      whereArgs = this.buildWhereArgs(value);
      query = sqliteQueryBuilder.buildCount("'" + this.gpkgTableName + "'", whereString);
    }
    var result = this.connection.get(query, whereArgs);
    if (!result)
      return 0;
    return result.count;
  }
  /**
   * Count rows in the table optionally filtered by the parameters specified
   * @param  {string} where where string
   * @param  {any[]} whereArgs arguments to filter on
   * @return {Number} count of objects
   */
  countWhere(where, whereArgs) {
    var query = sqliteQueryBuilder.buildCount("'" + this.gpkgTableName + "'", where);
    var result = this.connection.get(query, whereArgs);
    if (!result)
      return 0;
    return result.count;
  }
  /**
   * Get the min of the column
   * @param  {string} column    column name
   * @param  {string} [where]     where clause
   * @param  {Object[]} [whereArgs] where args
   * @return {Number}
   */
  minOfColumn(column, where, whereArgs) {
    return this.connection.minOfColumn("'" + this.gpkgTableName + "'", column, where, whereArgs);
  }
  /**
   * Get the max of the column
   * @param  {string} column    column name
   * @param  {string} [where]     where clause
   * @param  {Object[]} [whereArgs] where args
   * @return {Number}
   */
  maxOfColumn(column, where, whereArgs) {
    return this.connection.maxOfColumn("'" + this.gpkgTableName + "'", column, where, whereArgs);
  }
  /**
   * Delete the object passed in.  Object is deleted by id
   * @param  {Object} object object to delete
   * @return {Number} number of objects deleted
   */
  delete(object) {
    if (object.getId) {
      return this.deleteById(object.getId());
    }
    return this.deleteByMultiId(this.getMultiId(object));
  }
  /**
   * Delete the object specified by the id
   * @param  {Object} idValue id value
   * @return {Number} number of objects deleted
   */
  deleteById(idValue) {
    var where = this.buildPkWhere(idValue);
    var whereArgs = this.buildPkWhereArgs(idValue);
    return this.connection.delete("'" + this.gpkgTableName + "'", where, whereArgs);
  }
  /**
   * Delete the object specified by the ids
   * @param  {module:dao/columnValues~ColumnValues} idValues id values
   * @return {Number} number of objects deleted
   */
  deleteByMultiId(idValues) {
    var where = this.buildPkWhere(idValues);
    var whereArgs = this.buildPkWhereArgs(idValues);
    return this.connection.delete("'" + this.gpkgTableName + "'", where, whereArgs);
  }
  /**
   * Delete objects that match the query
   * @param  {string} where     where clause
   * @param  {Object[]} whereArgs where arguments
   * @return {Number} number of objects deleted
   */
  deleteWhere(where, whereArgs) {
    return this.connection.delete("'" + this.gpkgTableName + "'", where, whereArgs);
  }
  /**
   * Delete all objects in the table
   * @return {Number} number of objects deleted
   */
  deleteAll() {
    return this.connection.delete("'" + this.gpkgTableName + "'", '', []);
  }
  /**
   * Insert the object into the table
   * @param  {Object} object object to be inserted
   * @return {Number} id of the inserted object
   */
  create(object) {
    var sql = sqliteQueryBuilder.buildInsert("'" + this.gpkgTableName + "'", object);
    var insertObject = sqliteQueryBuilder.buildUpdateOrInsertObject(object);
    return this.connection.insert(sql, insertObject);
  }
  /**
   * Update all rows that match the query
   * @param  {module:dao/columnValues~ColumnValues} values    values to insert
   * @param  {string} where     where clause
   * @param  {Object[]} whereArgs where arguments
   * @return {Number} number of objects updated
   */
  updateWithValues(values, where, whereArgs) {
    var update = sqliteQueryBuilder.buildUpdate("'" + this.gpkgTableName + "'", values, where, whereArgs);
    return this.connection.run(update.sql, update.args);
  }
  /**
   * Update the object specified
   * @param  {Object} object object with updated values
   * @return {Number} number of objects updated
   */
  update(object) {
    var updateValues = sqliteQueryBuilder.buildUpdateOrInsertObject(object);
    var update = sqliteQueryBuilder.buildObjectUpdate("'" + this.gpkgTableName + "'", object);
    var multiId = this.getMultiId(object);
    if (multiId.length) {
      var where = ' where ';
      for (var i = 0; i < multiId.length; i++) {
        where += '"' + this.idColumns[i] + '" = $' + sqliteQueryBuilder.fixColumnName(this.idColumns[i]);
        updateValues[sqliteQueryBuilder.fixColumnName(this.idColumns[i])] = multiId[i];
      }
      update += where;
    }
    return this.connection.run(update, updateValues);
  }
  /**
   * Queries for the object by id, and if it exists, updates it, otherwise creates a new object
   * @param  {Object} object object to update or create
   * @return {Number} number of objects modified
   */
  createOrUpdate(object) {
    var existing = this.queryForSameId(object);
    if (!existing) {
      return this.create(object);
    }
    else {
      return this.update(object);
    }
  }
  /**
   * Drops this table
   * @return {Number} results of the drop
   */
  dropTable() {
    return this.connection.dropTable(this.gpkgTableName);
  }
  /**
   * Rename the table
   * @param {string} newName
   */
  rename(newName) {
    this.connection.run('ALTER TABLE ' + '"' + this.gpkgTableName + '" RENAME TO "' + newName + '"');
    this.gpkgTableName = newName;
  }
}

module.exports = Dao;
