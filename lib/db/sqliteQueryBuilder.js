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

module.exports.buildInsert = function(table, object) {
  var insert = 'insert into ' + table + '(';
  var keys = '';
  var values = '';
  var first = true;
  for (var key in object) {
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
