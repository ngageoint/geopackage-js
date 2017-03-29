var path = require('path')
  , fs = require('fs')
  , config = require('./config')
  , GeoPackage = require('geopackage');

function cors(req, res, next) {
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Origin', '*');
    next();
}

module.exports = function(app) {

  app.get('/:geoPackage/:table/:z/:x/:y.:format', cors, function(req, res, next) {
    var geoPackageName = req.params.geoPackage;
    var table = req.params.table;
    var x = Number(req.params.x);
    var y = Number(req.params.y);
    var z = Number(req.params.z);
    var format = req.params.format;
    var geoPackagePath = path.join(config.geoPackageDir, geoPackageName + '.gpkg');
    console.log('Load GeoPackage at path %s and get table:%s x:%d y:%d z:%d', geoPackagePath, table, x, y, z);

    fs.stat(geoPackagePath, function(err, stats) {
      if (err || !stats) {
        return res.status(404);
      }
      GeoPackage.openGeoPackage(geoPackagePath, function(err, geoPackage) {
        if (!geoPackage) return res.status(404);
        GeoPackage.hasTileTable(geoPackage, table, function(err, exists) {
          if (exists) {
            GeoPackage.getTileFromXYZ(geoPackage, table, x, y, z, 256, 256, function(err, data) {
              if (!data) return res.status(404);
              res.end(data, 'binary');
            });
          } else {
            GeoPackage.hasFeatureTable(geoPackage, table, function(err, exists) {
              if (exists) {
                GeoPackage.getFeatureTileFromXYZ(geoPackage, table, x, y, z, 256, 256, function(err, data) {
                  if (!data) return res.status(404);
                  res.end(data, 'binary');
                });
              } else {
                res.status(404);
              }
            });
          }
        });
      });
    });
  });

}
