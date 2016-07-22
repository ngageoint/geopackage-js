
var Extension = require('../index').Extension;
/**
 * Feature Table Index NGA Extension implementation. This extension is used to
 * index Geometries within a feature table by their minimum bounding box for
 * bounding box queries. This extension is required to provide an index
 * implementation when a SQLite version is used before SpatialLite support
 * (iOS).
 */
var FeatureTableIndex = function(geoPackage, featureDao) {

  /**
   * Progress
   */
  this.progress;

  this.geoPackage = geoPackage;

  this.featureDao = featureDao;

  this.extensionName = Extension.buildExtensionName(FeatureTableIndex.EXTENSION_GEOMETRY_INDEX_AUTHOR, FeatureTableIndex.EXTENSION_GEOMETRY_INDEX_NAME_NO_AUTHOR);

  this.extensionDefinition = FeatureTableIndex.EXTENSION_GEOMETRY_INDEX_DEFINITION;

  this.tableName = featureDao.table_name;

  this.columnName = featureDao.getGeometryColumnName();

  this.extensionsDao = geoPackage.getExtensionDao();

  this.tableIndexDao = geoPackage.getTableIndexDao();

  this.geometryIndexDao = geoPackage.getGeometryIndexDao();

}

FeatureTableIndex.prototype.index = function(callback) {
  this.indexWithForce(false, callback);
};

FeatureTableIndex.prototype.indexWithForce = function(force, callback) {
  var count = 0;
  this.isIndexed(function(err, result) {

  });
}

FeatureTableIndex.prototype.isIndexed = function (callback) {
  var indexed = false;
  getExtension(function(err, result) {
    console.log('extension result', result);
  }.bind(this));
};

FeatureTableIndex.prototype.getExtension = function (callback) {
  this.extensionsDao.isTableExists(function(err, result) {
    if (err || !results) {
      this.extensionsDao.queryByExtensionAndTableNameAndColumnName(this.extensionName, this.tableName, this.columnName, callback);
    }
  }.bind(this));
};

FeatureTableIndex.EXTENSION_GEOMETRY_INDEX_AUTHOR = 'nga';
FeatureTableIndex.EXTENSION_GEOMETRY_INDEX_NAME_NO_AUTHOR = 'geometry_index';
FeatureTableIndex.EXTENSION_GEOMETRY_INDEX_DEFINITION = 'http://ngageoint.github.io/GeoPackage/docs/extensions/geometry-index.html';

module.exports = FeatureTableIndex;
