var util = require('util');

var UserTableReader = require('../userTableReader')
  , DataTypes = require('../../db/dataTypes')
  , UserCustomColumn = require('./userCustomColumn')
  , UserCustomTable = require('./userCustomTable');

var UserCustomTableReader = function(tableName, requiredColumns) {
  UserTableReader.call(this, tableName, requiredColumns);
}

util.inherits(UserCustomTableReader, UserTableReader);


UserCustomTableReader.prototype.createTableWithNameAndColumns = function(tableName, columnList, requiredColumns) {
  return new UserCustomTable(tableName, columnList, requiredColumns);
}

UserCustomTableReader.prototype.createColumnWithResults = function(result, index, name, type, max, notNull, defaultValue, primaryKey) {

  var dataType = DataTypes.fromName(type);
  return new UserCustomColumn(index, name, dataType, max, notNull, defaultValue, primaryKey);
}


module.exports = UserCustomTableReader;
