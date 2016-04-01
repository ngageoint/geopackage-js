/**
 * Dao module.
 * @module dao/dao
 */

var sqlite3 = require('sqlite3').verbose();

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
      return callback(new Error('Table ' + this.tableName + ' does not exist'));
    }
    return callback(err, results);
  });
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
