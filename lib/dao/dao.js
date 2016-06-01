/**
 * Dao module.
 * @module dao/dao
 */

var sqliteQueryBuilder = require('../db/sqliteQueryBuilder');

/** @class Dao */
var Dao = function(connection) {
  this.connection = connection;
}

Dao.prototype.populateObjectFromResult = function (object, result) {
  if (!result) return;
  for (var key in result) {
    object[key] = result[key];
  }
};

/**
 * Checks if the table exists
 * @param  {validationCallback} callback - Callback to call with the results of if the table exists or not
 */
Dao.prototype.isTableExists = function (callback) {
  this.connection.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [this.gpkgTableName], function(err, results) {
    if(!results) {
      return callback(new Error('Table ' + this.gpkgTableName + ' does not exist'), false);
    }
    return callback(err, results);
  });
};

Dao.prototype.queryForIdObject = function(id, callback) {
  var whereString = this.buildPkWhereWithValue(id);
  var whereArgs = this.buildPkWhereArgsWithValue(id);
  var query = sqliteQueryBuilder.buildQuery(false, this.gpkgTableName, undefined, whereString);

  this.connection.get(query, whereArgs, function(err, result) {
    if (err) return callback(err);
    if (!result) return callback();
    var object = this.createObject(result);
    // TOOD something is wrong here
    this.populateObjectFromResult(object, result);
    callback(err, object, result);
  }.bind(this));
};

/**
 * Queries for all matches and returns them in the callback.  Be aware this pulls all results into memory
 * @param  {Function} callback called with an error if one occurred and the array of results
 */
Dao.prototype.queryForAll = function (callback) {
  var query = sqliteQueryBuilder.buildQuery(false, this.gpkgTableName);
  this.connection.all(query, callback);
};

Dao.prototype.queryForEach = function (rowCallback, callback) {
  var query = sqliteQueryBuilder.buildQuery(false, this.gpkgTableName);
  this.connection.each(query, rowCallback, callback);
};

Dao.prototype.queryForFieldValues = function (fieldValues, rowCallback, callback) {
  var whereString = this.buildWhereWithFields(fieldValues);
  var whereArgs = this.buildWhereArgsWithValues(fieldValues);
  var query = sqliteQueryBuilder.buildQuery(false, this.gpkgTableName, undefined, whereString);
  this.connection.each(query, whereArgs, rowCallback, callback);
};

Dao.prototype.queryWhereWithArgsDistinct = function(where, whereArgs, rowCallback, doneCallback) {
  var query = sqliteQueryBuilder.buildQuery(true, this.gpkgTableName, undefined, where, undefined, undefined, undefined, undefined);
  this.connection.each(query, whereArgs, rowCallback, doneCallback);
}

Dao.prototype.queryWhereWithArgs = function(where, whereArgs, rowCallback, doneCallback) {
  this.queryWhere(where, whereArgs, undefined, undefined, undefined, undefined, rowCallback, doneCallback);
}

Dao.prototype.queryWhere = function (where, whereArgs, groupBy, having, orderBy, limit, rowCallback, doneCallback) {
  var query = sqliteQueryBuilder.buildQuery(false, this.gpkgTableName, undefined, where, groupBy, having, orderBy, limit);
  this.connection.each(query, whereArgs, rowCallback, doneCallback);
};

Dao.prototype.buildPkWhereWithValue = function(idValue) {
  return this.buildWhereWithFieldAndValue(this.idColumns, idValue);
};

Dao.prototype.buildPkWhereArgsWithValue = function (idValue) {
  return this.buildWhereArgsWithValue(idValue);
};

Dao.prototype.buildPkWhereWithValues = function (idValuesArray) {

};

Dao.prototype.buildPkWhereArgsWithValues = function (idValuesArray) {

};

Dao.prototype.buildWhereWithFields = function (fields) {
  return this.buildWhereWithFieldsAndOperation(fields, 'and');
};

Dao.prototype.buildWhereWithFieldsAndOperation = function (fields, operation) {
  var whereString = '';

  for (var i = 0; i < fields.columns.length; i++) {
    var column = fields.columns[i];
    if (i) {
      whereString += ' ' + operation + ' ';
    }
    whereString += this.buildWhereWithFieldAndValue(column, fields.getValue(column));
  }
  return whereString;
};

Dao.prototype.buildWhereArgsWithValue = function (value) {
  var args = [];
  if(value !== undefined || value !== null) {
    args.push(value);
  }
  return args;
};

Dao.prototype.buildWhereArgsWithValueArray = function (values) {
  var args = [];
  for (var i = 0; i < values.length; i++) {
    var value = values[i];
    if (value !== undefined && value !== null) {
      args.push(value);
    }
  }
  return args.count ? null : args;
};

Dao.prototype.buildWhereArgsWithValues = function (values) {
  var args = [];
  for (var i = 0; i < values.columns.length; i++) {
    var column = values.columns[i];
    var value = values.getValue(column);
    if (value !== undefined && value !== null) {
      args.push(value);
    }
  }
  return args.count ? null : args;
};

Dao.prototype.buildWhereWithFieldAndValue = function (field, value) {
  return this.buildWhereWithFieldAndValueAndOperation(field, value, '=');
};

Dao.prototype.buildWhereWithFieldAndValueAndOperation = function (field, value, operation) {
  var whereString = '' + field + ' ';
  if(value === undefined || value === null){
    whereString += "is null";
  } else {
    whereString += operation + ' ?';
  }
  return whereString;
};

Dao.prototype.queryForEqWithFieldAndValue = function (field, value, callback1, callback2) {
  this.queryForEqWithField(field, value, undefined, undefined, undefined, callback1, callback2);
};

Dao.prototype.queryForEqWithField = function(field, value, groupBy, having, orderBy, callback1, callback2) {
  var whereString = this.buildWhereWithFieldAndValue(field, value);
  var whereArgs = this.buildWhereArgsWithValue(value);
  var query = sqliteQueryBuilder.buildQuery(false, this.gpkgTableName, undefined, whereString);
  if (callback2) {
    this.connection.each(query, whereArgs, callback1, callback2);
  } else {
    this.connection.all(query, whereArgs, callback1);
  }
};

Dao.prototype.getId = function (object) {
  return this.getValueFromObjectWithColumnName(object, this.idColumns[0]);
};

Dao.prototype.getValueFromObjectWithColumnName = function (object, column) {
  return object[column];
};

Dao.prototype.getValue = function(column) {
  return this[column];
}

Dao.prototype.minOfColumn = function (column, where, whereArgs, callback) {
  this.connection.minOfColumn(this.gpkgTableName, column, where, whereArgs, callback);
};

Dao.prototype.maxOfColumn = function (column, where, whereArgs, callback) {
  this.connection.maxOfColumn(this.gpkgTableName, column, where, whereArgs, callback);
};

Dao.prototype.create = function(object, callback) {
  var sql = sqliteQueryBuilder.buildInsert(this.gpkgTableName, object);
  var insertObject = {};
  for (var key in object) {
    insertObject['$' + key] = object[key];
  }
  this.connection.insert(sql, insertObject, callback);
}

/**
 * The Dao
 * @type {Dao}
 */
module.exports = Dao;

/**
 * Validation callback is passed an error if the validation failed.
 * @callback validationCallback
 * @param {Error} null if no error, otherwise describes the error
 */
