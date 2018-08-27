/**
 * SimpleAttributesDao module.
 * @module extensions/relatedTables/SimpleAttributesDao
 * @see module:dao/dao
 */

var MediaRow = require('./mediaRow')
  , MediaTable = require('./mediaTable')
  , Dao = require('../dao/dao');

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

SimpleAttributesDao.prototype.getTable = function() {
  return this.simpleAttributesTable;
}

SimpleAttributesDao.prototype.getSimpleAttributesRow = function(result) {
  return this.getRow(result);
}

SimpleAttributesDao.prototype.getRows = function(ids) {
  var simpleAttributesRows = [];
  for (var i = 0; i < ids.length; i++) {
    var row = this.queryForIdObject(ids[i]);
    if (row) {
      simpleAttributesRows.push(row);
    }
  }
  return simpleAttributesRows;
}

module.exports = SimpleAttributesDao;
