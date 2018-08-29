var util = require('util');

var UserDao = require('../userDao')
  , UserRow = require('../userRow')
  , UserCustomTableReader = require('./userCustomTableReader');

var UserCustomDao = function(geoPackage, userCustomTable) {
  UserDao.call(this, geoPackage, userCustomTable);
}

util.inherits(UserCustomDao, UserDao);

UserCustomDao.prototype.newRow = function() {
  return new UserRow(this.table);
}

UserCustomDao.readTable = function(geoPackage, tableName, requiredColumns) {
  var reader = new UserCustomTableReader(tableName, requiredColumns);
  var userCustomTable = reader.readTable(geoPackage.getDatabase());
  return new UserCustomDao(geoPackage, userCustomTable);
}

module.exports = UserCustomDao;
