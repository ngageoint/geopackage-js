var GeoPackageDataType = require('../../../../lib/db/geoPackageDataType').GeoPackageDataType
  , UserColumn = require('../../../../lib/user/userColumn').UserColumn
  , DublinCoreType = require('../../../../lib/extension/related/dublin/dublinCoreType').DublinCoreType
  , DublinCoreMetadata = require('../../../../lib/extension/related/dublin/dublinCoreMetadata').DublinCoreMetadata
  , SimpleAttributesTable = require('../../../../lib/extension/related/simple/simpleAttributesTable').SimpleAttributesTable
  , should = require('chai').should();

module.exports.createAdditionalUserColumns = function(startingIndex, notNull) {
  var columns = [];
  var columnIndex = startingIndex;

  // Add Dublin Core Metadata term columns
  columns.push(UserColumn.createColumn(columnIndex++, DublinCoreType.DATE.name, GeoPackageDataType.DATETIME, notNull));
  columns.push(UserColumn.createColumn(columnIndex++, DublinCoreType.DESCRIPTION.name, GeoPackageDataType.TEXT, notNull));
  columns.push(UserColumn.createColumn(columnIndex++, DublinCoreType.SOURCE.name, GeoPackageDataType.TEXT, notNull));
  columns.push(UserColumn.createColumn(columnIndex++, DublinCoreType.TITLE.name, GeoPackageDataType.TEXT, notNull));

  // Add test columns for common data types, some with limits
  columns.push(UserColumn.createColumn(columnIndex++, "test_text", GeoPackageDataType.TEXT, notNull, ''));
  columns.push(UserColumn.createColumn(columnIndex++, "test_real", GeoPackageDataType.REAL, notNull));
  columns.push(UserColumn.createColumn(columnIndex++, "test_boolean", GeoPackageDataType.BOOLEAN, notNull));
  columns.push(UserColumn.createColumn(columnIndex++, "test_blob", GeoPackageDataType.BLOB, notNull));
  columns.push(UserColumn.createColumn(columnIndex++, "test_integer", GeoPackageDataType.INTEGER, notNull));
  columns.push(UserColumn.createColumn(columnIndex++, "test_text_limited", GeoPackageDataType.TEXT, notNull));
  columns.push(UserColumn.createColumn(columnIndex++, "test_blob_limited", GeoPackageDataType.BLOB, notNull));
  columns.push(UserColumn.createColumn(columnIndex++, "test_date", GeoPackageDataType.DATE, notNull));
  columns.push(UserColumn.createColumn(columnIndex++, "test_datetime", GeoPackageDataType.DATETIME, notNull));

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
  for (var i = 0; i < table.getUserColumns().getColumns().length; i++) {
    var column = table.getUserColumns().getColumns()[i];
    if (skipColumns.indexOf(column.name) === -1) {
      // leave nullable columns null 20% of the time
      if (!column.notNull && DublinCoreType.fromName(column.name) == null) {
        if (Math.random() < 0.2) {
          continue;
        }
      }

      var value;
      switch (column.dataType) {
        case GeoPackageDataType.TEXT:
          var text = Math.random().toString(36).replace(/[^a-z]+/g, '');
          if (column.max != null) {
            text = text.substr(0, column.max);
          }
          value = text;
          break;
        case GeoPackageDataType.REAL:
        case GeoPackageDataType.DOUBLE:
          value = Math.random() * 5000.0;
          break;
        case GeoPackageDataType.BOOLEAN:
          value = Math.random() < .5 ? false : true;
          break;
        case GeoPackageDataType.INTEGER:
        case GeoPackageDataType.INT:
          value = Math.floor(Math.random() * 500);
          break;
        case GeoPackageDataType.BLOB:
          value = Buffer.from(Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5));
          break;
        case GeoPackageDataType.DATE:
        case GeoPackageDataType.DATETIME:
          value = new Date();
          break;
      }

      row.setValueWithColumnName(column.name, value);
    }
  }
}

module.exports.validateUserRow = function(columns, userRow) {
  columns.length.should.be.equal(userRow.table.getUserColumns().getColumns().length);
  for (var i = 0; i < userRow.table.getUserColumns().getColumns().length; i++) {
    var column = userRow.table.getUserColumns().getColumns()[i];
    column.getIndex().should.be.equal(i);
    columns[i].should.be.equal(column.getName());
    userRow.getColumnNameWithIndex(i).should.be.equal(columns[i]);
    userRow.getColumnIndexWithColumnName(columns[i]).should.be.equal(i);
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
