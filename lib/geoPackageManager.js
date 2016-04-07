/**
 * GeoPackage Manager used to create and open GeoPackages
 * @module geoPackageManager
 */

var sqlite3 = require('sqlite3').verbose()
  , async = require('async')
  , path = require('path')
  , GeoPackage = require('./geoPackage')
  , GeoPackageValidate = require('./validate/geoPackageValidate');

/**
 * Open a GeoPackage
 * @param  {string}   filePath Absolute path to the GeoPackage to open
 * @param {callback} callback which gets passed an error and the GeoPackage
 */
module.exports.open = function(filePath, callback) {
  var error = GeoPackageValidate.validateGeoPackageExtension(filePath);
  if (error) return callback(error);

  var results = {};
  async.waterfall([function(callback) {
    results.db = new sqlite3.Database(filePath, function(err) {
      console.log('err', err);
      if (err) {
        console.log('cannot open ' + filePath);
        return callback(err);
      }
      callback(err, results);
    });
  }, function(results, callback) {
    results.geoPackage = new GeoPackage(path.basename(filePath), filePath, results.db);
    callback(null, results);
  }, function(results, callback) {
    GeoPackageValidate.hasMinimumTables(results.geoPackage, function(err) {
      callback(err, results);
    });
  }], function(err, results) {
    console.log('err', err);
    if (err) {
      if (results.db) {
        results.db.close();
      }
      return callback(err);
    }
    callback(err, results.geoPackage);
  });
}
