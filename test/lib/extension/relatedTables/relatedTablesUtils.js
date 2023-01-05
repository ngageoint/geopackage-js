const { UserCustomColumn } = require("../../../../lib/user/custom/userCustomColumn");
var GeoPackageDataType = require('../../../../lib/db/geoPackageDataType').GeoPackageDataType
  , DublinCoreType = require('../../../../lib/extension/related/dublin/dublinCoreType').DublinCoreType
  , DublinCoreMetadata = require('../../../../lib/extension/related/dublin/dublinCoreMetadata').DublinCoreMetadata
  , SimpleAttributesTable = require('../../../../lib/extension/related/simple/simpleAttributesTable').SimpleAttributesTable
  , should = require('chai').should();

module.exports.createAdditionalUserColumns = function(notNull = false) {
  const columns = [];

  // Add Dublin Core Metadata term columns
  columns.push(UserCustomColumn.createColumn(DublinCoreType.DATE.name, GeoPackageDataType.DATETIME, notNull));
  columns.push(UserCustomColumn.createColumn(DublinCoreType.DESCRIPTION.name, GeoPackageDataType.TEXT, notNull));
  columns.push(UserCustomColumn.createColumn(DublinCoreType.SOURCE.name, GeoPackageDataType.TEXT, notNull));
  columns.push(UserCustomColumn.createColumn(DublinCoreType.TITLE.name, GeoPackageDataType.TEXT, notNull));

  // Add test columns for common data types, some with limits
  columns.push(UserCustomColumn.createColumn("test_text", GeoPackageDataType.TEXT, notNull, ''));
  columns.push(UserCustomColumn.createColumn("test_real", GeoPackageDataType.REAL, notNull));
  columns.push(UserCustomColumn.createColumn("test_boolean", GeoPackageDataType.BOOLEAN, notNull));
  columns.push(UserCustomColumn.createColumn("test_blob", GeoPackageDataType.BLOB, notNull));
  columns.push(UserCustomColumn.createColumn("test_integer", GeoPackageDataType.INTEGER, notNull));
  columns.push(UserCustomColumn.createColumn("test_text_limited", GeoPackageDataType.TEXT, notNull));
  columns.push(UserCustomColumn.createColumn("test_blob_limited", GeoPackageDataType.BLOB, notNull));
  columns.push(UserCustomColumn.createColumn("test_date", GeoPackageDataType.DATE, notNull));
  columns.push(UserCustomColumn.createColumn("test_datetime", GeoPackageDataType.DATETIME, notNull));

  return columns;
}

module.exports.createSimpleUserColumns = function(notNull) {
  var columns = [];

  var allAdditionalColumns = module.exports.createAdditionalUserColumns(notNull);

  for (var i = 0; i < allAdditionalColumns.length; i++) {
    var column = allAdditionalColumns[i];
    if (SimpleAttributesTable.isSimple(column)) {
      columns.push(UserCustomColumn.createColumn(column.getName(), column.getDataType(), column.isNotNull(), column.getDefaultValue()));
    }
  }

  return columns;
}

module.exports.populateUserRow = function(table, row, skipColumns) {
  for (var i = 0; i < table.getUserColumns().getColumns().length; i++) {
    var column = table.getUserColumns().getColumns()[i];
    if (skipColumns.indexOf(column.getName()) === -1) {
      // leave nullable columns null 20% of the time
      if (!column.isNotNull() && DublinCoreType.fromName(column.getName()) == null) {
        if (Math.random() < 0.2) {
          continue;
        }
      }

      var value;
      switch (column.getDataType()) {
        case GeoPackageDataType.TEXT:
          var text = Math.random().toString(36).replace(/[^a-z]+/g, '');
          if (column.getMax() != null) {
            text = text.substr(0, column.getMax());
          }
          value = text;
          break;
        case GeoPackageDataType.REAL:
        case GeoPackageDataType.DOUBLE:
          value = Math.random() * 5000.0;
          break;
        case GeoPackageDataType.BOOLEAN:
          value = Math.random() < .5;
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

      row.setValue(column.getName(), value);
    }
  }
}

module.exports.validateUserRow = function(columns, userRow) {
  columns.length.should.be.equal(userRow.getTable().getUserColumns().getColumns().length);
  for (var i = 0; i < userRow.getTable().getUserColumns().getColumns().length; i++) {
    var column = userRow.getTable().getUserColumns().getColumns()[i];
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
  var customTable = userRow.getTable();
  DublinCoreMetadata.hasColumn(customTable, type);
  DublinCoreMetadata.hasColumn(userRow, type);
  var column1 = DublinCoreMetadata.getColumn(customTable, type);
  var column2 = DublinCoreMetadata.getColumn(userRow, type);
  should.exist(column1);
  should.exist(column2);
  if (column1.isNotNull()) {
    var value = DublinCoreMetadata.getValue(userRow, type);
    should.exist(value);
  }
}
