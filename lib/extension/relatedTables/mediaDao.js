/**
 * MediaDao module.
 * @module extensions/relatedTables/MediaDao
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
var MediaDao = function(geoPackage, table) {
  UserDao.call(this, geoPackage, table);
  this.mediaTable = table;
}

util.inherits(MediaDao, UserDao);

MediagDao.prototype.newRow = function(results) {
  return new MediaRow(this.mediaTable);
}

MediaDao.prototype.getTable = function() {
  return this.mediaTable;
}

MediaDao.prototype.getMediaRow = function(result) {
  return this.getRow(result);
}

MediaDao.prototype.getRows = function(ids) {
  var mediaRows = [];
  for (var i = 0; i < ids.length; i++) {
    var row = this.queryForIdObject(ids[i]);
    if (row) {
      mediaRows.push(row);
    }
  }
  return mediaRows;
}

module.exports = MediaDao;
