var FeatureColumn = require('../lib/features/user/featureColumn').FeatureColumn,
  GeometryColumns = require('../lib/features/columns/geometryColumns').GeometryColumns,
  FeatureTable = require('../lib/features/user/featureTable').FeatureTable,
  GeoPackageDataType = require('../lib/db/geoPackageDataType').GeoPackageDataType;

module.exports.buildFeatureTable = function (tableName, geometryColumn, geometryType) {
  const columns = [];
  columns.push(FeatureColumn.createPrimaryKeyColumn('id'));
  columns.push(FeatureColumn.createGeometryColumn(geometryColumn, geometryType, false, null));
  columns.push(FeatureColumn.createColumn('test_text_limited', GeoPackageDataType.TEXT, false, null, 5));
  columns.push(FeatureColumn.createColumn('test_blob_limited', GeoPackageDataType.BLOB, false, null, 7));
  columns.push(FeatureColumn.createColumn('test_text', GeoPackageDataType.TEXT, false, ''));
  columns.push(FeatureColumn.createColumn('test_real', GeoPackageDataType.REAL, false, null));
  columns.push(FeatureColumn.createColumn('test_boolean', GeoPackageDataType.BOOLEAN, false, null));
  columns.push(FeatureColumn.createColumn('test_blob', GeoPackageDataType.BLOB, false, null));
  columns.push(FeatureColumn.createColumn('test_integer', GeoPackageDataType.INTEGER, false, null));
  return new FeatureTable(tableName, geometryColumn, columns);
};

module.exports.buildGeometryColumns = function (tableName, geometryColumn, geometryType) {
  const geometryColumns = new GeometryColumns();
  geometryColumns.setTableName(tableName);
  geometryColumns.setColumnName(geometryColumn);
  geometryColumns.setGeometryType(geometryType);
  geometryColumns.setZ(0);
  geometryColumns.setM(0);
  geometryColumns.setSrsId(4326);
  return geometryColumns;
};
