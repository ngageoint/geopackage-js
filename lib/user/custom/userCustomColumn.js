var util = require('util');

var UserColumn = require('../userColumn')
  , DataTypes = require('../../db/dataTypes')

var UserCustomColumn = function(index, name, dataType, max, notNull, defaultValue, primaryKey) {
  UserColumn.call(this, index, name, dataType, max, notNull, defaultValue, primaryKey);
  if (dataType == null) {
    throw new Error('Data type is required to create column: ' + name);
  }
}

util.inherits(UserCustomColumn, UserColumn);

UserCustomColumn.createColumn = function(index, name, dataType, max, notNull, defaultValue) {
  return new UserCustomColumn(index, name, dataType, max, notNull, defaultValue, false);
}

module.exports = UserCustomColumn;
