/**
 * GeoPackage module.
 * @module geoPackage
 */

var SpatialReferenceSystemDao = require('./dao/spatialReferenceSystem').SpatialReferenceSystemDao
  , GeometryColumnsDao = require('./dao/geometryColumns').GeometryColumnsDao
  , Contents = require('./dao/contents');

/**
 * GeoPackage database
 * @class GeoPackage
 */
var GeoPackage = function(name, path, db) {
  this.name = name;
  this.path = path;
  this.db = db;
}

GeoPackage.prototype.getDatabase = function() {
  return this.db;
}

GeoPackage.prototype.getPath = function() {
  return this.path;
}

/**
 * Get the GeoPackage name
 * @return {String} the GeoPackage name
 */
GeoPackage.prototype.getName = function() {
  return this.name;
}

GeoPackage.prototype.getSpatialReferenceSystemDao = function() {
  return new SpatialReferenceSystemDao(this.db);
}

GeoPackage.prototype.getContentsDao = function() {
  return new Contents(this.db);
}

GeoPackage.prototype.createDao = function () {

};

GeoPackage.prototype.getSrs = function(srsId) {

}

/**
 *  Get the feature tables
 *  @param {callback} callback called with an error if one occurred and the array of {FeatureTable} names
 */
GeoPackage.prototype.getFeatureTables = function (callback) {
  var gcd = this.getGeometryColumnsDao();
  gcd.isTableExists(function(err, exists) {
    if (!exists) {
      return callback(null, []);
    }
    gcd.getFeatureTables(callback);
  });
};

GeoPackage.prototype.getGeometryColumnsDao = function () {
  return new GeometryColumnsDao(this.db);
};

module.exports = GeoPackage;
