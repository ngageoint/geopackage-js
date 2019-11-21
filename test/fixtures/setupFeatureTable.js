var FeatureColumn = require('../../lib/features/user/featureColumn')
  , FeatureTable = require('../../lib/features/user/featureTable')
  , GeometryColumns = require('../../lib/features/columns/geometryColumns')
  , DataTypes = require('../../lib/db/dataTypes');

module.exports.buildFeatureTable = function(tableName, geometryColumn, geometryType) {
  var columns = [];

  columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
  columns.push(FeatureColumn.createColumnWithIndexAndMax(7, 'test_text_limited', DataTypes.GPKGDataType.GPKG_DT_TEXT, 5, false, null));
  columns.push(FeatureColumn.createColumnWithIndexAndMax(8, 'test_blob_limited', DataTypes.GPKGDataType.GPKG_DT_BLOB, 7, false, null));
  columns.push(FeatureColumn.createGeometryColumn(1, geometryColumn, geometryType, false, null));
  columns.push(FeatureColumn.createColumnWithIndex(2, 'test_text', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));
  columns.push(FeatureColumn.createColumnWithIndex(3, 'test_real', DataTypes.GPKGDataType.GPKG_DT_REAL, false, null));
  columns.push(FeatureColumn.createColumnWithIndex(4, 'test_boolean', DataTypes.GPKGDataType.GPKG_DT_BOOLEAN, false, null));
  columns.push(FeatureColumn.createColumnWithIndex(5, 'test_blob', DataTypes.GPKGDataType.GPKG_DT_BLOB, false, null));
  columns.push(FeatureColumn.createColumnWithIndex(6, 'test_integer', DataTypes.GPKGDataType.GPKG_DT_INTEGER, false, ""));

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
