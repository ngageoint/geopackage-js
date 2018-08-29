/**
 * UserDao module.
 * @module user/userDao
 * @see module:dao/dao
 */

var UserMappingRow = require('./userMappingRow')
  , UserMappingTable = require('./userMappingTable')
  , UserCustomDao = require('../../user/custom/userCustomDao')
  , ColumnValues = require('../../dao/columnValues')
  , Dao = require('../../dao/dao');

var util = require('util');

/**
 * Abstract User DAO for reading user tables
 * @class UserDao
 * @extends {module:dao/dao~Dao}
 * @param  {GeoPackageConnection} connection        connection
 * @param  {string} table table name
 */
var UserMappingDao = function(userCustomDao, geoPackage) {
  UserCustomDao.call(this, geoPackage, new UserMappingTable(userCustomDao.table.table_name, userCustomDao.table.columns));
}

util.inherits(UserMappingDao, UserCustomDao);

UserMappingDao.prototype.newRow = function(results) {
  return new UserMappingRow(this.table);
}

UserMappingDao.prototype.getTable = function() {
  return this.table;
}

/**
 * Create a user row
 * @param  {Array} columnTypes column Types
 * @param  {Array} values      values
 * @return {UserRow}             user row
 */
UserMappingDao.prototype.newRowWithColumnTypes = function (columnTypes, values) {
  return new UserMappingRow(this.table, columnTypes, values);
};

UserMappingDao.prototype.getUserMappingRow = function(result) {
  return this.getRow(result);
}

UserMappingDao.prototype.queryByBaseId = function(baseId) {
  if (baseId.getBaseId) {
    baseId = baseId.getBaseId();
  }
  return this.queryForAllEqWithFieldAndValue(UserMappingTable.COLUMN_BASE_ID, baseId);
}

UserMappingDao.prototype.queryByRelatedId = function(relatedId) {
  if (relatedId.getRelatedId) {
    relatedId = relatedId.getRelatedId();
  }
  return this.queryForAllEqWithFieldAndValue(UserMappingTable.COLUMN_RELATED_ID, relatedId);
}

UserMappingDao.prototype.queryByIds = function(baseId, relatedId) {
  if (baseId.getBaseId) {
    relatedId = baseId.getRelatedId();
    baseId = baseId.getBaseId();
  }

  var values = new ColumnValues();
  values.addColumn(UserMappingTable.COLUMN_BASE_ID, baseId);
  values.addColumn(UserMappingTable.COLUMN_RELATED_ID, relatedId);

  return this.queryForFieldValues(values);
}

UserMappingDao.prototype.countByIds = function(baseId, relatedId) {
  if (baseId.getBaseId) {
    relatedId = baseId.getRelatedId();
    baseId = baseId.getBaseId();
  }

  var values = new ColumnValues();
  values.addColumn(UserMappingTable.COLUMN_BASE_ID, baseId);
  values.addColumn(UserMappingTable.COLUMN_RELATED_ID, relatedId);

  return this.countWhere(values);
}

UserMappingDao.prototype.deleteByBaseId = function(baseId) {
  if (baseId.getBaseId) {
    baseId = baseId.getBaseId();
  }

  var where = '';
  where += this.buildWhereWithFieldAndValue(UserMappingTable.COLUMN_BASE_ID, baseId);
  var whereArgs = this.buildWhereArgsWithValueArray([baseId]);

  return this.deleteWhere(where, whereArgs);
};

UserMappingDao.prototype.deleteByRelatedId = function(relatedId) {
  if (relatedId.getRelatedId) {
    relatedId = relatedId.getRelatedId();
  }

  var where = '';
  where += this.buildWhereWithFieldAndValue(UserMappingTable.COLUMN_RELATED_ID, relatedId);
  var whereArgs = this.buildWhereArgsWithValueArray([relatedId]);

  return this.deleteWhere(where, whereArgs);
};

UserMappingDao.prototype.deleteByIds = function(baseId, relatedId) {
  if (baseId.getBaseId) {
    relatedId = baseId.getRelatedId();
    baseId = baseId.getBaseId();
  }

  var where = '';
  where += this.buildWhereWithFieldAndValue(UserMappingTable.COLUMN_BASE_ID, baseId);
  where += ' and ';
  where += this.buildWhereWithFieldAndValue(UserMappingTable.COLUMN_RELATED_ID, relatedId);
  var whereArgs = this.buildWhereArgsWithValueArray([baseId, relatedId]);

  return this.deleteWhere(where, whereArgs);
}

module.exports = UserMappingDao;
