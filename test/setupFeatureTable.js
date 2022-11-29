var FeatureColumn = require('../lib/features/user/featureColumn').FeatureColumn
  , GeometryColumns = require('../lib/features/columns/geometryColumns').GeometryColumns
  , FeatureTable = require('../lib/features/user/featureTable').FeatureTable
  , GeometryType = require('@ngageoint/simple-features-js').GeometryType
  , GeoPackageDataType = require('../lib/db/geoPackageDataType').GeoPackageDataType;

module.exports.buildFeatureTable = function(tableName, geometryColumn, geometryType) {
  const columns = [];
  columns.push(FeatureColumn.createPrimaryKeyColumn('id'));
  columns.push(FeatureColumn.createGeometryColumn(geometryColumn, geometryType, false, null));
  columns.push(FeatureColumn.createColumn('test_text_limited', GeoPackageDataType.TEXT, false, null, 5));
  columns.push(FeatureColumn.createColumn('test_blob_limited', GeoPackageDataType.BLOB, false, null, 7));
  columns.push(FeatureColumn.createColumn('test_text', GeoPackageDataType.TEXT, false, ""));
  columns.push(FeatureColumn.createColumn('test_real', GeoPackageDataType.REAL, false, null));
  columns.push(FeatureColumn.createColumn('test_boolean', GeoPackageDataType.BOOLEAN, false, null));
  columns.push(FeatureColumn.createColumn('test_blob', GeoPackageDataType.BLOB, false, null));
  columns.push(FeatureColumn.createColumn('test_integer', GeoPackageDataType.INTEGER, false, null));
  return new FeatureTable(tableName, geometryColumn, columns);
};

module.exports.buildGeometryColumns = function(tableName, geometryColumn, geometryType) {
  const geometryColumns = new GeometryColumns();
  geometryColumns.table_name = tableName;
  geometryColumns.column_name = geometryColumn;
  geometryColumns.geometry_type_name = GeometryType.nameFromType(geometryType);
  geometryColumns.z = 0;
  geometryColumns.m = 0;
  return geometryColumns;
};
