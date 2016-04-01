var SpatialReferenceSystem = require('./dao/spatialReferenceSystem')
  , Contents = require('./dao/contents');

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

GeoPackage.prototype.getName = function() {
  return this.name;
}

GeoPackage.prototype.getSpatialReferenceSystemDao = function() {
  return new SpatialReferenceSystem(this.db);
}

GeoPackage.prototype.getContentsDao = function() {
  return new Contents(this.db);
}

GeoPackage.prototype.createDao = function () {

};

module.exports = GeoPackage;
