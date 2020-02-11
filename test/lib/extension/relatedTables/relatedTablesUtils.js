var DataTypes = require('../../../../lib/db/dataTypes').DataTypes
  , UserColumn = require('../../../../lib/user/userColumn').UserColumn
  , DublinCoreType = require('../../../../lib/extension/relatedTables/dublinCoreType').DublinCoreType
  , DublinCoreMetadata = require('../../../../lib/extension/relatedTables/dublinCoreMetadata').DublinCoreMetadata
  , SimpleAttributesTable = require('../../../../lib/extension/relatedTables/simpleAttributesTable').SimpleAttributesTable
  , should = require('chai').should();


module.exports.createAdditionalUserColumns = function(startingIndex, notNull) {
  var columns = [];
  var columnIndex = startingIndex;

  // Add Dublin Core Metadata term columns
  columns.push(UserColumn.createColumn(columnIndex++, DublinCoreType.DATE.name, DataTypes.DATETIME, notNull));
  columns.push(UserColumn.createColumn(columnIndex++, DublinCoreType.DESCRIPTION.name, DataTypes.TEXT, notNull));
  columns.push(UserColumn.createColumn(columnIndex++, DublinCoreType.SOURCE.name, DataTypes.TEXT, notNull));
  columns.push(UserColumn.createColumn(columnIndex++, DublinCoreType.TITLE.name, DataTypes.TEXT, notNull));

  // Add test columns for common data types, some with limits
  columns.push(UserColumn.createColumn(columnIndex++, "test_text", DataTypes.TEXT, notNull, ''));
  columns.push(UserColumn.createColumn(columnIndex++, "test_real", DataTypes.REAL, notNull));
  columns.push(UserColumn.createColumn(columnIndex++, "test_boolean", DataTypes.BOOLEAN, notNull));
  columns.push(UserColumn.createColumn(columnIndex++, "test_blob", DataTypes.BLOB, notNull));
  columns.push(UserColumn.createColumn(columnIndex++, "test_integer", DataTypes.INTEGER, notNull));
  columns.push(UserColumn.createColumn(columnIndex++, "test_text_limited", DataTypes.TEXT, notNull));
  columns.push(UserColumn.createColumn(columnIndex++, "test_blob_limited", DataTypes.BLOB, notNull));
  columns.push(UserColumn.createColumn(columnIndex++, "test_date", DataTypes.DATE, notNull));
  columns.push(UserColumn.createColumn(columnIndex++, "test_datetime", DataTypes.DATETIME, notNull));

  return columns;
}

module.exports.createSimpleUserColumns = function(startingIndex, notNull) {
  var columns = [];
  var columnIndex = startingIndex;

  var allAdditionalColumns = module.exports.createAdditionalUserColumns(startingIndex, notNull);

  for (var i = 0; i < allAdditionalColumns.length; i++) {
    var column = allAdditionalColumns[i];
    if (SimpleAttributesTable.isSimple(column)) {
      columns.push(UserColumn.createColumn(columnIndex++, column.name, column.dataType, column.notNull, column.defaultValue));
    }
  }

  return columns;
}

module.exports.populateRow = function(table, row, skipColumns) {
  for (var i = 0; i < table.columns.length; i++) {
    var column = table.columns[i];
    if (skipColumns.indexOf(column.name) === -1) {
      // leave nullable columns null 20% of the time
      if (!column.notNull && DublinCoreType.fromName(column.name) == null) {
        if (Math.random() < 0.2) {
          continue;
        }
      }

      var value;
      switch (column.dataType) {
        case DataTypes.TEXT:
          var text = Math.random().toString(36).replace(/[^a-z]+/g, '');
          if (column.max != null) {
            text = text.substr(0, column.max);
          }
          value = text;
          break;
        case DataTypes.REAL:
        case DataTypes.DOUBLE:
          value = Math.random() * 5000.0;
          break;
        case DataTypes.BOOLEAN:
          value = Math.random() < .5 ? false : true;
          break;
        case DataTypes.INTEGER:
        case DataTypes.INT:
          value = Math.floor(Math.random() * 500);
          break;
        case DataTypes.BLOB:
          value = Buffer.from(Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5));
          break;
        case DataTypes.DATE:
        case DataTypes.DATETIME:
          value = new Date();
          break;
      }

      row.setValueWithColumnName(column.name, value);
    }
  }
}

module.exports.validateUserRow = function(columns, userRow) {
  columns.length.should.be.equal(userRow.columnCount());
  for (var i = 0; i < userRow.columnCount(); i++) {
    var column = userRow.table.columns[i];
    var dataType = column.dataType;
    column.index.should.be.equal(i);
    columns[i].should.be.equal(column.name);
    userRow.getColumnNameWithIndex(i).should.be.equal(columns[i]);
    userRow.getColumnIndexWithColumnName(columns[i]).should.be.equal(i);
    var rowType = userRow.getRowColumnTypeWithIndex(i);
    var value = userRow.getValueWithIndex(i);
    switch(rowType) {
      case DataTypes.INTEGER:


    }
  }
}

module.exports.validateDublinCoreColumns = function(userRow) {
  module.exports.validateDublinCoreColumn(userRow, DublinCoreType.DATE);
  module.exports.validateSimpleDublinCoreColumns(userRow);
}

module.exports.validateSimpleDublinCoreColumns = function(userRow) {
  module.exports.validateDublinCoreColumn(userRow, DublinCoreType.DESCRIPTION);
  module.exports.validateDublinCoreColumn(userRow, DublinCoreType.SOURCE);
  module.exports.validateDublinCoreColumn(userRow, DublinCoreType.TITLE);
}

module.exports.validateDublinCoreColumn = function(userRow, type) {
  var customTable = userRow.table;
  DublinCoreMetadata.hasColumn(customTable, type);
  DublinCoreMetadata.hasColumn(userRow, type);
  var column1 = DublinCoreMetadata.getColumn(customTable, type);
  var column2 = DublinCoreMetadata.getColumn(userRow, type);
  should.exist(column1);
  should.exist(column2);
  if (column1.notNull) {
    var value = DublinCoreMetadata.getValue(userRow, type);
    should.exist(value);
  }
}
