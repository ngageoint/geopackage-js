var fs = require('fs')
  , async = require('async')
  , path = require('path')
  , TableCreator = require('../../lib/db/tableCreator')
  , GeoPackage = require('../../lib/geoPackage')
  , GeoPackageConnection = require('../../lib/db/geoPackageConnection');

module.exports.createGeoPackage = function(gppath, callback) {
  async.series([
    function(callback) {
      if (typeof(process) !== 'undefined' && process.version) {
        fs.mkdir(path.dirname(gppath), function() {
          fs.open(gppath, 'w', callback);
        });
      } else {
        callback();
      }
    }
  ], function() {
    GeoPackageConnection.connect(gppath, function(err, connection) {
      var geopackage = new GeoPackage(path.basename(gppath), gppath, connection);
      var tc = new TableCreator(geopackage);
      tc.createRequired(function() {
        callback(null, geopackage);
      });
    });
  });

}

module.exports.deleteGeoPackage = function(gppath, callback) {
  if (typeof(process) !== 'undefined' && process.version) {
    fs.unlink(gppath, callback);
  } else {
    callback();
  }
}
