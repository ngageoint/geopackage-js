/**
 * GeoPackage Manager used to create and open GeoPackages
 * @module geoPackageManager
 */

var async = require('async')
  , path = require('path')
  , fs = require('fs');

var GeoPackage = require('./geoPackage')
  , GeoPackageValidate = require('./validate/geoPackageValidate')
  , GeoPackageConnection = require('./db/geoPackageConnection');

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
    GeoPackageConnection.connect(filePath, function(err, connection) {
      if (err) {
        console.log('cannot open ' + filePath);
        return callback(err);
      }
      results.connection = connection;
      callback(err, results);
    });
  }, function(results, callback) {
    results.geoPackage = new GeoPackage(path.basename(filePath), filePath, results.connection);
    callback(null, results);
  }, function(results, callback) {
    GeoPackageValidate.hasMinimumTables(results.geoPackage, function(err) {
      callback(err, results);
    });
  }], function(err, results) {
    if (err) {
      return callback(err);
    }
    callback(err, results.geoPackage);
  });
}

module.exports.create = function(filePath, callback) {
  if (!callback) {
    callback = filePath;
    filePath = undefined;
  }
  async.waterfall([
    function(callback) {
      if (filePath) {
        var error = GeoPackageValidate.validateGeoPackageExtension(filePath);
        if (error) return callback(error);
        if (typeof(process) !== 'undefined' && process.version) {
          fs.stat(filePath, function(err, stats) {
            if (err || !stats) {
              callback(err);
            }
            callback(null, filePath);
          });
        } else {
          callback(null, filePath);
        }
      } else {
        callback(null, filePath);
      }
    }, function(filePath, callback) {
      GeoPackageConnection.connect(filePath, function(err, connection) {
        callback(err, connection);
      });
    }, function(connection, callback) {
      connection.setApplicationId(function(err) {
        callback(err, connection);
      });
    }, function(connection, callback) {
      callback(null, new GeoPackage(path.basename(filePath), filePath, connection));
    }
  ], function(err, geopackage) {
    if (err || !geopackage) {
      return callback(err);
    }
    callback(err, geopackage);
  });
}
