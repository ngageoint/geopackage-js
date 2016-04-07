/**
 * GeoPackage module.
 * @module geoPackage
 */

var SpatialReferenceSystemDao = require('./core/srs').SpatialReferenceSystemDao
  , GeometryColumnsDao = require('./dao/geometryColumns').GeometryColumnsDao
  , FeatureDao = require('./features/user/featureDao')
  , FeatureTableReader = require('./features/user/featureTableReader')
  , ContentsDao = require('./core/contents').ContentsDao;

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
  return new ContentsDao(this.db);
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

/**
 *  Get a Feature DAO from Geometry Columns
 *
 *  @param {GeometryColumns} geometryColumns Geometry Columns
 *  @param {callback} callback called with an error if one occurred and the {FeatureDao}
 */
GeoPackage.prototype.getFeatureDaoWithGeometryColumns = function (geometryColumns, callback) {
  if (!geometryColumns) {
    return callback(new Error('Non null Geometry Columns is required to create Feature DAO'));
  }

  var tableReader = new FeatureTableReader(geometryColumns);
  var featureTable = tableReader.readFeatureTable(this.db, function(err, featureTable) {
    console.log('error', err);
    console.log('featureTable', featureTable);
    var dao = new FeatureDao(this.db, featureTable, geometryColumns, this.metadataDb);

    // TODO
    // [self dropSQLiteTriggers:geometryColumns]

    callback(null, dao);
  }.bind(this));

  /*
  if(geometryColumns == nil){
      [NSException raise:@"Illegal Argument" format:@"Non null Geometry Columns is required to create Feature DAO"];
  }

  // Read the existing table and create the dao
  GPKGFeatureTableReader * tableReader = [[GPKGFeatureTableReader alloc] initWithGeometryColumns:geometryColumns];
  GPKGFeatureTable * featureTable = [tableReader readFeatureTableWithConnection:self.database];
  GPKGFeatureDao * dao = [[GPKGFeatureDao alloc] initWithDatabase:self.database andTable:featureTable andGeometryColumns:geometryColumns andMetadataDb:self.metadataDb];

  // TODO
  // GeoPackages created with SQLite version 4.2.0+ with GeoPackage
  // support are not fully supported in previous sqlite versions
  [self dropSQLiteTriggers:geometryColumns];

  return dao;
  */
};

/**
 * Get a Feature DAO from Contents
 * @param  {Contents}   contents Contents
 * @param  {Function} callback callback called with an error if one occurred and the {FeatureDao}
 */
GeoPackage.prototype.getFeatureDaoWithContents = function (contents, callback) {

};

/**
 * Get a Feature DAO from Contents
 * @param  {string}   tableName table name
 * @param  {Function} callback callback called with an error if one occurred and the {FeatureDao}
 */
GeoPackage.prototype.getFeatureDaoWithTableName = function (tableName, callback) {
  var self = this;
  var dao = this.getGeometryColumnsDao();
  var geometryColumns = dao.queryForTableName(tableName, function(err, geometryColumns) {
    if (!geometryColumns) {
      return callback(new Error('No Feature Table exists for table name: ' + tableName));
    }
    self.getFeatureDaoWithGeometryColumns(geometryColumns, callback);
  });
/**
 * GPKGGeometryColumnsDao * dao = [self getGeometryColumnsDao];
    GPKGGeometryColumns * geometryColumns = [dao queryForTableName:tableName];
    if(geometryColumns == nil){
        [NSException raise:@"No Feature Table" format:@"No Feature Table exists for table name: %@", tableName];
    }
    return [self getFeatureDaoWithGeometryColumns:geometryColumns];
 */

};

module.exports = GeoPackage;
