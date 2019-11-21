/**
 * SQLite query builder module.
 * @module db/sqliteQueryBuilder
 */

/**
 * Utility class to build sql queries
 * @class
 */
function SqliteQueryBuilder() {}

module.exports = SqliteQueryBuilder;

/**
 * Replaces all whitespace in a column name with underscores
 * @param  {string} columnName column name to fix
 * @return {string}
 */
SqliteQueryBuilder.fixColumnName = function(columnName) {
  return columnName.replace(/\W+/g, '_');
};

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
SqliteQueryBuilder.buildQuery = function(distinct, tables, columns, where, join, groupBy, having, orderBy, limit, offset) {

  var query = '';
  if (isEmpty(groupBy) && !isEmpty(having)) {
    throw new Error('Illegal Arguments: having clauses require a groupBy clause');
  }

  query += 'select ';
  if (distinct) {
    query += 'distinct ';
  }
  if(columns && columns.length) {
    query = appendColumnsToString(columns, query);
  } else {
    query += '* ';
  }

  query += 'from ' + tables;
  if (join) {
    query += ' ' + join;
  }
  query = appendClauseToString(query, ' where ', where);
  query = appendClauseToString(query, ' group by ', groupBy);
  query = appendClauseToString(query, ' having ', having);
  query = appendClauseToString(query, ' order by ', orderBy);
  query = appendClauseToString(query, ' limit ', limit);
  query = appendClauseToString(query, ' offset ', offset);

  return query;
};

/**
 * Builds a count statement
 * @param  {string} tables table names to query for
 * @param  {string} [where]  where clause
 * @return {string} count statement
 */
SqliteQueryBuilder.buildCount = function(tables, where) {
  var query = 'select count(*) as count from ' + tables;
  query = appendClauseToString(query, ' where ', where);
  return query;
};

/**
 * Builds an insert statement using the properties of the object
 * @param  {string} table  table to insert into
 * @param  {Object} object object to insert
 * @return {string} insert statement
 */
SqliteQueryBuilder.buildInsert = function(table, object) {
  if (object.getColumnNames) {
    return SqliteQueryBuilder.buildInsertFromColumnNames(table, object);
  }
  var insert = 'insert into ' + table + ' (';
  var keys = '';
  var values = '';
  var first = true;
  for (var key in object) {
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
};

/**
 * Builds an insert statement from the object.getColumnNames method
 * @param  {string} table  table to insert into
 * @param  {Object} object object with a getColumnNames method
 * @return {string} insert statement
 */
SqliteQueryBuilder.buildInsertFromColumnNames = function(table, object) {
  var insert = 'insert into ' + table + ' (';
  var keys = '';
  var values = '';
  var first = true;
  var columnNames = object.getColumnNames();
  for (var i = 0; i < columnNames.length; i++) {
    var key = columnNames[i];
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
};

/**
 * Builds an update or insert object to bind to a statement
 * @param  {Object} object object to create bind parameters from
 * @return {Object} bind parameters
 */
SqliteQueryBuilder.buildUpdateOrInsertObject = function(object) {
  var insertOrUpdate = {};
  if (object.getColumnNames) {
    var columnNames = object.getColumnNames();
    for (var i = 0; i < columnNames.length; i++) {
      insertOrUpdate[SqliteQueryBuilder.fixColumnName(columnNames[i])] = object.toDatabaseValue(columnNames[i]);
    }
  } else {
    for (var key in object) {
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
};

/**
 * Builds an update statement
 * @param  {string} table     table to update
 * @param  {Object} values    object with values to update
 * @param  {string} [where]     where clause
 * @param  {Array|Object} [whereArgs] where bind parameters
 * @return {Object} object with a sql property containing the update statement and an args property with bind arguments
 */
SqliteQueryBuilder.buildUpdate = function(table, values, where, whereArgs) {
  var args = [];
  var update = 'update ' + table + ' set ';
  var first = true;
  for (var columnName in values) {
    if (!first) {
      update += ', ';
    }
    first = false;
    update += '"'+ columnName + '"';
    args.push(values[columnName]);
    update += '=?';
  }
  if (whereArgs) {
    for (var i = 0; i < whereArgs.length; i++) {
      args.push(whereArgs[i]);
    }
  }
  if (where) {
    update += ' where ';
    update += where;
  }
  return {
    sql: update,
    args: args
  };
};

/**
 * Builds an update from an object
 * @param  {string} table  table name to update
 * @param  {Object} object object with values to update
 * @return {string} update statement
 */
SqliteQueryBuilder.buildObjectUpdate = function(table, object) {
  var update = 'update ' + table + ' set ';
  var first = true;
  if (object.getColumnNames) {
    var columnNames = object.getColumnNames();

    for (var i = 0; i < columnNames.length; i++) {
      var key = columnNames[i];
      if (!first) {
        update += ', ';
      }
      first = false;
      update += '"' + key + '"=';
      update += '$' + SqliteQueryBuilder.fixColumnName(key);
    }
  } else {
    for (var prop in object) {
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
};

function appendClauseToString(string, name, clause) {
  if (clause) {
    string += name + clause;
  }
  return string;
}

function appendColumnsToString(columns, string) {
  if (!columns || !columns.length) return string;
  string += columnToAppend(columns[0]);
  for (var i = 1; i < columns.length; i++) {
    string += ', ' + columnToAppend(columns[i]);
  }
  string += ' ';
  return string;
}

function columnToAppend(column) {
  return column.indexOf('*') !== -1 ? column : '"' + column + '"';
}

function isEmpty(string) {
  return !string || string.length === 0;
}
