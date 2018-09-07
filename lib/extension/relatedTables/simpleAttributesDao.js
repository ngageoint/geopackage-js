/**
 * SimpleAttributesDao module.
 * @module extensions/relatedTables/SimpleAttributesDao
 * @see module:dao/dao
 */

var SimpleAttributesRow = require('./simpleAttributesRow')
  , SimpleAttributesTable = require('./simpleAttributesTable')
  , Dao = require('../../dao/dao')
  , UserDao = require('../../user/userDao');

var util = require('util');

/**
 * Abstract User DAO for reading user tables
 * @class UserDao
 * @extends {module:dao/dao~Dao}
 * @param  {GeoPackageConnection} connection        connection
 * @param  {string} table table name
 */
var SimpleAttributesDao = function(geoPackage, table) {
  UserDao.call(this, geoPackage, table);
  this.simpleAttributesTable = table;
}

util.inherits(SimpleAttributesDao, UserDao);

SimpleAttributesDao.prototype.newRow = function(results) {
  return new SimpleAttributesRow(this.simpleAttributesTable);
}

SimpleAttributesDao.prototype.newRowWithColumnTypes = function (columnTypes, values) {
  return new SimpleAttributesRow(this.simpleAttributesTable, columnTypes, values);
};

SimpleAttributesDao.prototype.getTable = function() {
  return this.simpleAttributesTable;
}

SimpleAttributesDao.prototype.getRows = function(ids) {
  var simpleAttributesRows = [];
  for (var i = 0; i < ids.length; i++) {
    var row = this.queryForId(ids[i]);
    if (row) {
      simpleAttributesRows.push(row);
    }
  }
  return simpleAttributesRows;
}

module.exports = SimpleAttributesDao;
