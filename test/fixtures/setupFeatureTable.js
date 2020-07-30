var FeatureColumn = require('@ngageoint/geopackage/lib/features/user/featureColumn').FeatureColumn
  , GeometryColumns = require('@ngageoint/geopackage/lib/features/columns/geometryColumns').GeometryColumns
  , FeatureTable = require('@ngageoint/geopackage/lib/features/user/featureTable').FeatureTable
  , DataTypes = require('@ngageoint/geopackage/lib/db/dataTypes').DataTypes;

module.exports.buildFeatureTable = function(tableName, geometryColumn, geometryType) {
  var columns = [];

  columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
  columns.push(FeatureColumn.createColumn(7, 'test_text_limited', DataTypes.TEXT, false, null, 5));
  columns.push(FeatureColumn.createColumn(8, 'test_blob_limited', DataTypes.BLOB, false, null, 7));
  columns.push(FeatureColumn.createGeometryColumn(1, geometryColumn, geometryType, false, null));
  columns.push(FeatureColumn.createColumn(2, 'test_text', DataTypes.TEXT, false, ""));
  columns.push(FeatureColumn.createColumn(3, 'test_real', DataTypes.REAL, false, null));
  columns.push(FeatureColumn.createColumn(4, 'test_boolean', DataTypes.BOOLEAN, false, null));
  columns.push(FeatureColumn.createColumn(5, 'test_blob', DataTypes.BLOB, false, null));
  columns.push(FeatureColumn.createColumn(6, 'test_integer', DataTypes.INTEGER, false, ""));

  return new FeatureTable(tableName, columns);
};

module.exports.buildGeometryColumns = function(tableName, geometryColumn, geometryType) {
  var geometryColumns = new GeometryColumns();
  geometryColumns.table_name = tableName;
  geometryColumns.column_name = geometryColumn;
  geometryColumns.geometry_type_name = geometryType;
  geometryColumns.z = 0;
  geometryColumns.m = 0;
  return geometryColumns;
};
