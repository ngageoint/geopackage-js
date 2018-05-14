/**
 * SQLite query builder module.
 * @module db/sqliteQueryBuilder
 */

module.exports.fixColumnName = function(columnName) {
  return columnName.replace(/\W+/g, '_');
}

module.exports.buildQuery = function(distinct, tables, columns, where, join, groupBy, having, orderBy, limit) {

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
  var insert = 'insert into ' + table + ' (';
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
      values += '$' + module.exports.fixColumnName(key);
    }
  }

  insert += keys + ') values (' + values + ')';
  return insert;
}

module.exports.buildInsertFromColumnNames = function(table, object) {
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
    values += '$' + module.exports.fixColumnName(key);
  }

  insert += keys + ') values (' + values + ')';
  return insert;
}

module.exports.buildUpdateOrInsertObject = function(object) {
  var insertOrUpdate = {};
  if (object.getColumnNames) {
    var columnNames = object.getColumnNames();
    for (var i = 0; i < columnNames.length; i++) {
      insertOrUpdate['$'+module.exports.fixColumnName(columnNames[i])] = object.toDatabaseValue(columnNames[i]);
    }
  } else {
    for (var key in object) {
      if (object.hasOwnProperty(key)) {
        if (object.toDatabaseValue) {
          insertOrUpdate['$' + module.exports.fixColumnName(key)] = object.toDatabaseValue(key);
        } else {
          insertOrUpdate['$' + module.exports.fixColumnName(key)] = object[key];
        }
      }
    }
  }
  return insertOrUpdate;
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
}

module.exports.buildObjectUpdate = function(table, object) {
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
      update += '$' + module.exports.fixColumnName(key);
    }
  } else {
    for (var key in object) {
      if (!first) {
        update += ', ';
      }
      first = false;

      if (object.hasOwnProperty(key)) {
        update += '"' + key + '"=';
        update += '$' + module.exports.fixColumnName(key);
      }
    }
  }

  return update;
}

function appendClauseToString(string, name, clause) {
  if (clause) {
    string += name + clause;
  }
  return string;
}

function appendColumnsToString(columns, string) {
  if (!columns || columns.length == 0) return string;
  string += columnToAppend(columns[0]);
  for (var i = 1; i < columns.length; i++) {
    string += ', ' + columnToAppend(columns[i]);
  }
  string += ' ';
  return string;
}

function columnToAppend(column) {
  return column.indexOf('*') != -1 ? column : '"' + column + '"';
}

function isEmpty(string) {
  return !string || string.length === 0;
}
