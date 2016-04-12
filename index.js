var GeoPackage = require('./lib/geopackage')
  , GeoPackageManager = require('./lib/geoPackageManager')
  , GeoPackageConnection = require('./lib/db/GeoPackageConnection')
  , async = require('async')
  , SQL = require('sql.js')
  , jquery = require('jquery')
  , proj4 = require('proj4')
  , reproject = require('reproject')
  , L = require('leaflet');

  L.Icon.Default.imagePath = 'node_modules/leaflet/dist/images/';
  var map = L.map('map', {
    center: [45,0],
    zoom: 3,
    worldCopyJump: true
  });

  var baseLayer = L.tileLayer('http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png');
  baseLayer.addTo(map);

  var geojsonLayer = L.geoJson();
  geojsonLayer.addTo(map);


  module.exports.loadGeoPackage = function(files) {
    console.log('files', files);
    var f = files[0];
    var r = new FileReader();
    r.onload = function() {
      var Uints = new Uint8Array(r.result);
      db = new SQL.Database(Uints);
      GeoPackageConnection.connectWithDatabase(db, function(err, connection) {
        var geoPackage = new GeoPackage('', '', connection);
        geoPackage.getFeatureTables(function(err, tables) {
          async.eachSeries(tables, function(table, callback) {
            console.log('table', table);
            geoPackage.getFeatureDaoWithTableName(table, function(err, featureDao) {
              if (err) {
                return callback();
              }
              var features = 0;
              featureDao.getSrs(function(err, srs) {
                featureDao.queryForEach(function(err, row) {
                  features++;
                  var currentRow = featureDao.getFeatureRow(row);
                  var geometry = currentRow.getGeometry();
                  var geom = geometry.geometry;
                  var geoJson = geometry.geometry.toGeoJSON();
                  if (srs.definition && srs.definition !== 'undefined') {
                    geoJson = reproject.reproject(geoJson, srs.definition, 'EPSG:4326');
                  }
                  // console.log('geoJson', geoJson);
                  geojsonLayer.addData(geoJson);
                }, function(err) {
                  console.log('added ' + features + ' features');
                  callback();
                });
              });
            });
          });
        });
      });
    }
    r.readAsArrayBuffer(f);
  }
