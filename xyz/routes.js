var path = require('path')
  , config = require('./config')
  , GeoPackage = require('geopackage');

function cors(req, res, next) {
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Origin', '*');
    next();
}

module.exports = function(app) {

  app.get('/:geoPackage/:table/:z/:x/:y.png', cors, function(req, res, next) {
    var geoPackageName = req.params.geoPackage;
    var table = req.params.table;
    var x = req.params.x;
    var y = req.params.y;
    var z = req.params.z;
    var geoPackagePath = path.join(config.geoPackageDir, geoPackageName + '.gpkg');
    console.log('Load GeoPackage at path %s and get table:%s x:%d y:%d z:%d', geoPackagePath, table, x, y, z);

    GeoPackage.openGeoPackage(geoPackagePath, function(err, geoPackage) {
      if (!geoPackage) return res.status(404).send('Unable to locate ' + geoPackageName);
        GeoPackage.getTileFromXYZ(geoPackage, table, x, y, z, 256, 256, function(err, data) {
          res.end(data, 'binary');
        });
    });
  });

}
