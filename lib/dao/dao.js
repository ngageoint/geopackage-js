/**
 * Dao module.
 * @module dao/dao
 */

var sqlite3 = require('sqlite3').verbose();
var sqliteQueryBuilder = require('../db/sqliteQueryBuilder');

/** @class Dao */
var Dao = function(db) {
  this.db = db;
}

/**
 * Checks if the table exists
 * @param  {validationCallback} callback - Callback to call with the results of if the table exists or not
 */
Dao.prototype.isTableExists = function (callback) {
  this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [this.tableName], function(err, results) {
    if(!results) {
      return callback(new Error('Table ' + this.tableName + ' does not exist'), false);
    }
    return callback(err, results);
  });
};

Dao.prototype.queryForIdObject = function(id, callback) {
  var whereString = this.buildPkWhereWithValue(id);
  var whereArgs = this.buildPkWhereArgsWithValue(id);
  var query = sqliteQueryBuilder.buildQuery(false, this.tableName, undefined, whereString);

  this.db.get(query, whereArgs, callback);
};

Dao.prototype.buildPkWhereWithValue = function(idValue) {
  return this.buildWhereWithFieldAndValue(this.idColumns[0], idValue);
};

Dao.prototype.buildPkWhereArgsWithValue = function (idValue) {
  return this.buildWhereArgsWithValue(idValue);
};

Dao.prototype.buildPkWhereWithValues = function (idValuesArray) {

};

Dao.prototype.buildPkWhereArgsWithValues = function (idValuesArray) {

};

Dao.prototype.buildWhereWithFields = function (fields) {

};

Dao.prototype.buildWhereWithFieldsAndOperation = function (fields, operation) {

};

Dao.prototype.buildWhereArgsWithValue = function (value) {
  var args = [];
  if(value) {
    args.push(value);
  }
  return args;
};

Dao.prototype.buildWhereWithFieldAndValue = function (field, value) {
  return this.buildWhereWithFieldAndValueAndOperation(field, value, '=');
};

Dao.prototype.buildWhereWithFieldAndValueAndOperation = function (field, value, operation) {
  var whereString = '' + field + ' ';
  if(!value){
    whereString += "is null";
  } else {
    whereString += operation + ' ?';
  }
  return whereString;
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
