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
  UserRelatedTable.call(this, tableName, SimpleAttributesTable.RELATION_TYPE.name, SimpleAttributesTable.RELATION_TYPE.dataType, columns, requiredColumns);
  this.validateColumns();
}

util.inherits(SimpleAttributesTable, UserRelatedTable);

SimpleAttributesTable.create = function(tableName, columns) {
  var tableColumns = SimpleAttributesTable.createRequiredColumns(0);

  if (columns) {
    tableColumns = tableColumns.concat(columns);
  }

  return new SimpleAttributesTable(tableName, tableColumns, SimpleAttributesTable.requiredColumns());
}

SimpleAttributesTable.requiredColumns = function(idColumnName) {
  var requiredColumns = [];
  requiredColumns.push(idColumnName || SimpleAttributesTable.COLUMN_ID);
  return requiredColumns;
}

SimpleAttributesTable.numRequiredColumns = function(){
  return SimpleAttributesTable.requiredColumns().length;
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
    var column = columns[i];
    if (!SimpleAttributesTable.isSimple(column)) {
      throw new Error('Simple Attributes Tables only support simple data types. Column: ' + column.name + ', Non Simple Data Type: ' + column.dataType);
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
  return column.notNull && SimpleAttributesTable.isSimpleDataType(column.dataType);
}

SimpleAttributesTable.isSimpleDataType = function(dataType) {
  return dataType === DataTypes.GPKGDataType.GPKG_DT_TEXT || dataType === DataTypes.GPKGDataType.GPKG_DT_INTEGER || dataType === DataTypes.GPKGDataType.GPKG_DT_REAL;
}

SimpleAttributesTable.RELATION_TYPE = RelationType.SIMPLE_ATTRIBUTES;
SimpleAttributesTable.COLUMN_ID = 'id';

SimpleAttributesTable.prototype.TABLE_TYPE = 'simple_attributes';

/**
 * The SimpleAttributesTable
 * @type {SimpleAttributesTable}
 */
module.exports = SimpleAttributesTable;
