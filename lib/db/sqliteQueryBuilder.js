/**
 * SQLite query builder module.
 * @module db/sqliteQueryBuilder
 */

module.exports.buildQuery = function(distinct, tables, columns, where, groupBy, having, orderBy, limit) {

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
  query = appendClauseToString(query, ' where ', where);
  query = appendClauseToString(query, ' group by ', groupBy);
  query = appendClauseToString(query, ' having ', having);
  query = appendClauseToString(query, ' order by ', orderBy);
  query = appendClauseToString(query, ' limit ', limit);

  return query;
}

module.exports.buildCount = function(tables, where) {
  var query = 'select count(*) as count from ' + tables;
  query = appendClauseToString(query, ' where ', where);
  return query;
}

module.exports.buildInsert = function(table, object) {
  if (object.getColumnNames) {
    return module.exports.buildInsertFromColumnNames(table, object);
  }
  var insert = 'insert into ' + table + '(';
  var keys = '';
  var values = '';
  var first = true;
  for (var key in object) {
    if (object.hasOwnProperty(key)) {
      if (!first) {
        keys += ',';
        values += ',';
      }
      first = false;
      keys += key;
      values += '$' + key;
    }
  }

  insert += keys + ') values (' + values + ')';
  return insert;
}

module.exports.buildInsertFromColumnNames = function(table, object) {
  var insert = 'insert into ' + table + '(';
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
    keys += key;
    values += '$' + key;
  }

  insert += keys + ') values (' + values + ')';
  return insert;
}

module.exports.buildUpdate = function(table, values, where, whereArgs) {
  var args = [];
  var update = 'update ' + table + ' set ';
  var first = true;
  for (var columnName in values) {
    if (!first) {
      update += ', ';
    }
    first = false;
    update += columnName;
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
}

function appendClauseToString(string, name, clause) {
  if (clause) {
    string += name + clause;
  }
  return string;
}

function appendColumnsToString(columns, string) {
  string += columns[0];
  for (var i = 1; i < columns.length; i++) {
    string += ', ' + column;
  }
  string += ' ';
  return string;
}

function isEmpty(string) {
  return !string || string.length === 0;
}
