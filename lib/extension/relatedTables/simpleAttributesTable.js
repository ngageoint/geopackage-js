/**
 * simpleAttributesTable module.
 * @module extension/relatedTables/simpleAttributesTable
 */

var UserTable = require('../../user/userTable')
  , UserRelatedTable = require('./userRelatedTable')
  , UserColumn = require('../../user/userColumn')
  , DataTypes = require('../../db/dataTypes')
  , RelationType = require('./relationType');

var util = require('util');

/**
 * Represents a user attribute table
 * @param  {string} tableName table name
 * @param  {array} columns   attribute columns
 */
var SimpleAttributesTable = function(tableName, columns, requiredColumns) {
  UserTable.call(this, tableName, SimpleAttributesTable.RELATION_TYPE.name, SimpleAttributesTable.RELATION_TYPE.dataType, columns, requiredColumns);
  this.validateColumns();
}

util.inherits(SimpleAttributesTable, UserRelatedTable);

SimpleAttributesTable.create = function(tableName, idColumnName, columns) {
  var tableColumns = SimpleAttributesTable.createRequiredColumns(0, idColumnName);

  if (columns) {
    tableColumns = tableColumns.concat(columns);
  }

  return new SimpleAttributesTable(tableName, tableColumns, SimpleAttributesTable.requiredColumns(idColumnName));
}

SimpleAttributesTable.requiredColumns = function(idColumnName) {
  var requiredColumns = [];
  requiredColumns.push(idColumnName || SimpleAttributesTable.COLUMN_ID);
  return requiredColumns;
}

SimpleAttributesTable.numRequiredColumns = function(){
  return requiredColumns().length;
}

SimpleAttributesTable.createRequiredColumns = function(startingIndex, idColumnName) {
  startingIndex = startingIndex || 0;
  return [SimpleAttributesTable.createIdColumn(startingIndex++, idColumnName || SimpleAttributesTable.COLUMN_ID)];
}

SimpleAttributesTable.createIdColumn = function(index, idColumnName) {
  return UserColumn.createPrimaryKeyColumnWithIndexAndName(index, idColumnName);
}

SimpleAttributesTable.prototype.validateColumns = function() {
  var columns = this.columns;
  if (columns.length < 2) {
    throw new Error('Simple Attributes Tables require at least one non id column');
  }

  for (var i = 0; i < columns.length; i++) {
    if (!SimpleAttributesTable.isSimple(columns[i])) {
      throw new Error('Simple Attributes Tables only support simple data types. Column: ' + column.getName() + ', Non Simple Data Type: ' + column.getDataType());
    }
  }
}

SimpleAttributesTable.prototype.getIdColumnIndex = function() {
  return this.pkIndex;
}

SimpleAttributesTable.prototype.getIdColumn = function() {
  return this.getPkColumn();
}

SimpleAttributesTable.isSimple = function(column) {
  return column.notNull && SimpleAttributesTable.isSimpleDataType(column.getTypeName());
}

SimpleAttributesTable.isSimpleDataType = function(dataType) {
  return dataType === 'TEXT' || dataType === 'INTEGER' || dataType === 'REAL';
}

SimpleAttributesTable.RELATION_TYPE = RelationType.SIMPLE_ATTRIBUTES;
SimpleAttributesTable.COLUMN_ID = 'id';

/**
 * The SimpleAttributesTable
 * @type {SimpleAttributesTable}
 */
module.exports = SimpleAttributesTable;
