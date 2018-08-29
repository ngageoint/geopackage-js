/**
 * Dao module.
 * @module dao/dao
 */

var sqliteQueryBuilder = require('../db/sqliteQueryBuilder')
  , ColumnValues = require('./columnValues');

/** @class Dao */
var Dao = function(geoPackage) {
  this.geoPackage = geoPackage;
  this.connection = geoPackage.getDatabase();
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
Dao.prototype.isTableExists = function () {
  var results = this.connection.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [this.gpkgTableName]);
  return !!results;
};

Dao.prototype.refresh = function(object) {
  return this.queryForSameId(object);
}

Dao.prototype.queryForIdObject = function(id) {
  var whereString = this.buildPkWhereWithValue(id);
  var whereArgs = this.buildPkWhereArgsWithValue(id);
  var query = sqliteQueryBuilder.buildQuery(false, "'"+this.gpkgTableName+"'", undefined, whereString);
  var result = this.connection.get(query, whereArgs);
  if (!result) return;
  var object = this.createObject(result);
  // TOOD something is wrong here
  this.populateObjectFromResult(object, result);
  return object;
};

Dao.prototype.queryForSameId = function (object) {
  var idArray = this.getMultiId(object);
  return this.queryForMultiIdObject(idArray);
};

Dao.prototype.getMultiId = function (object) {
  var idValues = [];
  for (var i = 0; i < this.idColumns.length; i++) {
    idValues.push(object.values ? object.values[this.idColumns[i]] : object[this.idColumns[i]]);
  }
  return idValues;
};

Dao.prototype.queryForMultiIdObject = function (idValues) {
  var whereString = this.buildPkWhereWithValues(idValues);
  var whereArgs = this.buildPkWhereArgsWithValues(idValues);

  var query = sqliteQueryBuilder.buildQuery(false, "'"+this.gpkgTableName+"'", undefined, whereString);

  var result = this.connection.get(query, whereArgs);
  if (!result) return;
  var object = this.createObject(result);
  this.populateObjectFromResult(object, result);
  return object;
};

/**
 * Queries for all matches and returns them in the callback.  Be aware this pulls all results into memory
 * @param  {Function} callback called with an error if one occurred and the array of results
 */
Dao.prototype.queryForAll = function () {
  var query = sqliteQueryBuilder.buildQuery(false, "'"+this.gpkgTableName+"'");
  return this.connection.all(query);
};

Dao.prototype.queryForAllWhere = function(where, whereArgs) {
  var query = sqliteQueryBuilder.buildQuery(false, "'"+this.gpkgTableName+"'", undefined, where);
  return this.connection.all(query, whereArgs);
}

/**
 * Queries for all matches and returns them in the callback.  Be aware this pulls all results into memory
 */
Dao.prototype.queryForColumnsInAll = function (columnName) {
  var query = sqliteQueryBuilder.buildQuery(false, "'"+this.gpkgTableName+"'", [columnName]);
  return this.connection.all(query);
};

Dao.prototype.queryForColumnsWhere = function (columnName, fieldValues) {
  var where = this.buildWhereWithFields(fieldValues);
  var whereArgs = this.buildWhereArgsWithValues(fieldValues);
  var query = sqliteQueryBuilder.buildQuery(false, "'"+this.gpkgTableName+"'", [columnName], where);
  return this.connection.all(query, whereArgs);
};

Dao.prototype.queryForChunk = function(pageSize, page) {
  var query = sqliteQueryBuilder.buildQuery(false, "'"+this.gpkgTableName+"'", undefined, undefined, undefined, undefined, undefined, this.idColumns[0], pageSize, page * pageSize);
  return this.connection.all(query);
};

Dao.prototype.queryForEach = function () {
  var query = sqliteQueryBuilder.buildQuery(false, "'"+this.gpkgTableName+"'");
  var count = 0;
  return this.connection.each(query);
};

Dao.prototype.queryForFieldValues = function (fieldValues) {
  var whereString = this.buildWhereWithFields(fieldValues);
  var whereArgs = this.buildWhereArgsWithValues(fieldValues);
  var query = sqliteQueryBuilder.buildQuery(false, "'"+this.gpkgTableName+"'", undefined, whereString);
  var count = 0;
  return this.connection.each(query, whereArgs);
};

Dao.prototype.queryJoinWhereWithArgs = function(join, where, whereArgs, columns) {
  var query = sqliteQueryBuilder.buildQuery(false, "'"+this.gpkgTableName+"'", columns, where, join);
  var count = 0;
  return this.connection.each(query, whereArgs);
}

Dao.prototype.queryWhereWithArgsDistinct = function(where, whereArgs) {
  var query = sqliteQueryBuilder.buildQuery(true, "'"+this.gpkgTableName+"'", undefined, where);
  var count = 0;
  return this.connection.each(query, whereArgs);
}

Dao.prototype.queryWhereWithArgs = function(where, whereArgs) {
  return this.queryWhere(where, whereArgs, undefined, undefined, undefined, undefined);
}

Dao.prototype.queryWhere = function (where, whereArgs, groupBy, having, orderBy, limit) {
  var query = sqliteQueryBuilder.buildQuery(false, "'"+this.gpkgTableName+"'", undefined, where, undefined, groupBy, having, orderBy, limit);
  return this.connection.each(query, whereArgs);
};

Dao.prototype.buildPkWhereWithValue = function(idValue) {
  return this.buildWhereWithFieldAndValue(this.idColumns, idValue);
};

Dao.prototype.buildPkWhereArgsWithValue = function (idValue) {
  return this.buildWhereArgsWithValue(idValue);
};

Dao.prototype.buildPkWhereWithValues = function (idValuesArray) {
  var idColumnValues = new ColumnValues();
  for (var i = 0; i < idValuesArray.length; i++) {
    idColumnValues.addColumn(this.idColumns[i], idValuesArray[i]);
  }
  return this.buildWhereWithFields(idColumnValues);
};

Dao.prototype.buildPkWhereArgsWithValues = function (idValuesArray) {
  var values = [];
  for (var i = 0; i < idValuesArray.length; i++) {
    values = values.concat(this.buildWhereArgsWithValue(idValuesArray[i]));
  }
  return values;
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

Dao.prototype.queryForEachEqWithFieldAndValue = function (field, value, rowCallback) {
  return this.queryForEachEqWithField(field, value, undefined, undefined, undefined);
};

Dao.prototype.queryForAllEqWithFieldAndValue = function (field, value) {
  return this.queryForAllEqWithField(field, value, undefined, undefined, undefined);
};

Dao.prototype.queryForEachEqWithField = function(field, value, groupBy, having, orderBy) {
  var whereString = this.buildWhereWithFieldAndValue(field, value);
  var whereArgs = this.buildWhereArgsWithValue(value);
  var query = sqliteQueryBuilder.buildQuery(false, "'"+this.gpkgTableName+"'", undefined, whereString);
  return this.connection.each(query, whereArgs);
};

Dao.prototype.queryForAllEqWithField = function(field, value, groupBy, having, orderBy) {
  var whereString = this.buildWhereWithFieldAndValue(field, value);
  var whereArgs = this.buildWhereArgsWithValue(value);
  var query = sqliteQueryBuilder.buildQuery(false, "'"+this.gpkgTableName+"'", undefined, whereString);
  return this.connection.all(query, whereArgs);
};

Dao.prototype.countByEqWithFieldAndValue = function(field, value) {
  var whereString = this.buildWhereWithFieldAndValue(field, value);
  var whereArgs = this.buildWhereArgsWithValue(value);
  var query = sqliteQueryBuilder.buildCount("'"+this.gpkgTableName+"'", whereString);

  result = this.connection.get(query, whereArgs);
  if (!result) return 0;
  return result.count;
};

Dao.prototype.countWhere = function(fields) {
  var where = this.buildWhereWithFieldsAndOperation(fields, 'and');
  var whereArgs = this.buildWhereArgsWithValues(fields);
  var query = sqliteQueryBuilder.buildCount("'"+this.gpkgTableName+"'", where);

  result = this.connection.get(query, whereArgs);
  if (!result) return 0;
  return result.count;
}

Dao.prototype.count = function() {
  return this.connection.count(this.gpkgTableName);
}

Dao.prototype.getId = function (object) {
  return this.getValueFromObjectWithColumnName(object, this.idColumns[0]);
};

Dao.prototype.getValueFromObjectWithColumnName = function (object, column) {
  return object[column];
};

Dao.prototype.getValue = function(column) {
  return this[column];
}

Dao.prototype.minOfColumn = function (column, where, whereArgs) {
  return this.connection.minOfColumn("'"+this.gpkgTableName+"'", column, where, whereArgs);
};

Dao.prototype.maxOfColumn = function (column, where, whereArgs) {
  return this.connection.maxOfColumn("'"+this.gpkgTableName+"'", column, where, whereArgs);
};

Dao.prototype.delete = function(object) {
  if (object.getId) {
    return this.deleteById(object.getId());
  }
  return this.deleteByMultiId(this.getMultiId(object));
};

Dao.prototype.deleteById = function(idValue) {
  var where = this.buildPkWhereWithValue(idValue);
  var whereArgs = this.buildPkWhereArgsWithValue(idValue);

  return this.connection.delete("'"+this.gpkgTableName+"'", where, whereArgs);
};

Dao.prototype.deleteByMultiId = function(idValues) {
  var where = this.buildPkWhereWithValues(idValues);
  var whereArgs = this.buildPkWhereArgsWithValues(idValues);

  return this.connection.delete("'"+this.gpkgTableName+"'", where, whereArgs);
};

Dao.prototype.deleteWhere = function(where, whereArgs) {
  return this.connection.delete("'"+this.gpkgTableName+"'", where, whereArgs);
};

Dao.prototype.deleteAll = function() {
  return this.connection.delete("'"+this.gpkgTableName+"'", null, null);
};

Dao.prototype.create = function(object) {
  var sql = sqliteQueryBuilder.buildInsert("'"+this.gpkgTableName+"'", object);
  var insertObject = sqliteQueryBuilder.buildUpdateOrInsertObject(object);
  return this.connection.insert(sql, insertObject);
};

Dao.prototype.updateWithValues = function (values, where, whereArgs) {
  var update = sqliteQueryBuilder.buildUpdate("'"+this.gpkgTableName+"'", values, where, whereArgs);
  return this.connection.run(update.sql, update.args);
};

Dao.prototype.update = function(object) {
  var updateValues = sqliteQueryBuilder.buildUpdateOrInsertObject(object);
  var multiId = this.getMultiId(object);
  var where = ' where ';
  for (var i = 0; i < multiId.length; i++) {
    where += '"' + this.idColumns[i] + '" = $' + sqliteQueryBuilder.fixColumnName(this.idColumns[i]);
    updateValues[sqliteQueryBuilder.fixColumnName(this.idColumns[i])] = multiId[i];
  }
  var whereArgs = this.buildPkWhereArgsWithValues(multiId);
  var update = sqliteQueryBuilder.buildObjectUpdate("'"+this.gpkgTableName+"'", object);
  update += where;
  return this.connection.run(update, updateValues);
};

Dao.prototype.createOrUpdate = function(object) {
  var existing = this.queryForSameId(object);
  if (!existing) {
    return this.create(object);
  } else {
    return this.update(object);
  }
};

Dao.prototype.dropTable = function() {
  return this.connection.dropTable("'"+this.gpkgTableName+"'");
};

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
