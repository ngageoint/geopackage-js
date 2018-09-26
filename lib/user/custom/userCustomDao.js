/**
 * @module user/custom
 */
var util = require('util');

var UserDao = require('../userDao')
  , UserRow = require('../userRow')
  , UserCustomTableReader = require('./userCustomTableReader');

/**
 * User Custom Dao
 * @class
 * @extends module:user/userDao~UserDao
 * @param  {module:geoPackage~GeoPackage} geoPackage      geopackage object
 * @param  {module:user/custom~UserCustomTable} userCustomTable user custom table
 */
var UserCustomDao = function(geoPackage, userCustomTable) {
  UserDao.call(this, geoPackage, userCustomTable);
}

util.inherits(UserCustomDao, UserDao);

/**
 * Create a new UserRow
 * @return {module:user/userRow~UserRow}
 */
UserCustomDao.prototype.newRow = function() {
  return new UserRow(this.table);
}

/**
 * Reads the table specified from the geopackage
 * @param  {module:geoPackage~GeoPackage} geoPackage      geopackage object
 * @param  {string} tableName       table name
 * @param  {string[]} requiredColumns required columns
 * @return {module:user/custom~UserCustomDao}
 */
UserCustomDao.readTable = function(geoPackage, tableName, requiredColumns) {
  var reader = new UserCustomTableReader(tableName, requiredColumns);
  var userCustomTable = reader.readTable(geoPackage.getDatabase());
  return new UserCustomDao(geoPackage, userCustomTable);
}

module.exports = UserCustomDao;
