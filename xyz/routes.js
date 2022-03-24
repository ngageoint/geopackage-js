const path = require('path'),
  fs = require('fs'),
  config = require('./config'),
  { GeoPackageAPI, setCanvasKitWasmLocateFile } = require('geopackage');

function cors(req, res, next) {
  res.set('Access-Control-Allow-Methods', 'GET');
  res.set('Access-Control-Allow-Origin', '*');
  next();
}

setCanvasKitWasmLocateFile(file => path.join(__dirname, 'node_modules', 'geopackage', 'dist', 'canvaskit', file));

function handleImageResponse(res, data) {
  if (!data) {
    return res.sendStatus(404);
  }
  const contentType = data.substring(data.indexOf('image/'), data.indexOf(';base64,'));
  const bytes = Buffer.from(data.split(',')[1], 'base64').toString('binary');

  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': bytes.length,
  });
  res.end(bytes, 'binary');
}

module.exports = function(app) {
  app.get('/:geoPackage/:table/:z/:x/:y.:format', cors, function(req, res) {
    const geoPackageName = req.params.geoPackage;
    const table = req.params.table;
    const x = Number(req.params.x);
    const y = Number(req.params.y);
    const z = Number(req.params.z);
    const geoPackagePath = path.join(config.geoPackageDir, geoPackageName + '.gpkg');
    console.log('Load GeoPackage at path %s and get table:%s x:%d y:%d z:%d', geoPackagePath, table, x, y, z);

    fs.stat(geoPackagePath, function(err, stats) {
      if (err || !stats) {
        return res.sendStatus(404);
      }
      GeoPackageAPI.open(geoPackagePath).then(geoPackage => {
        if (!geoPackage) {
          console.log('Unkonwn GeoPackage %s', geoPackagePath);
          return res.sendStatus(404);
        }
        if (geoPackage.hasTileTable(table)) {
          geoPackage
            .xyzTile(table, x, y, z, 256, 256)
            .then(data => handleImageResponse(res, data))
            .catch(() => {
              return res.sendStatus(404);
            });
        } else if (geoPackage.hasFeatureTable(table)) {
          geoPackage
            .getFeatureTileFromXYZ(table, x, y, z, 256, 256)
            .then(data => handleImageResponse(res, data))
            .catch(e => {
              console.error(e);
              return res.sendStatus(404);
            });
        } else {
          console.log('Unknown GeoPackage Table %s', table);
          res.sendStatus(404);
        }
      });
    });
  });
};
