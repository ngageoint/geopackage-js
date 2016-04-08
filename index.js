var GeoPackage = require('./lib/geopackage')
  , GeoPackageManager = require('./lib/geoPackageManager')
  , GeoPackageConnection = require('./lib/db/GeoPackageConnection')
  , async = require('async')
  , SQL = require('sql.js')
  , jquery = require('jquery')
  , proj4 = require('proj4')
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
      console.log('db', db);
      GeoPackageConnection.connectWithDatabase(db, function(err, connection) {
        var geoPackage = new GeoPackage('', '', connection);
        geoPackage.getFeatureTables(function(err, tables) {
          async.eachSeries(tables, function(table, callback) {
            console.log('table', table);
            geoPackage.getFeatureDaoWithTableName(table, function(err, featureDao) {
              console.log('featureDao', featureDao);
              if (err) {
                return callback();
              }
              featureDao.queryForEach(function(err, row) {
                var currentRow = featureDao.getFeatureRow(row);
                var geometry = currentRow.getGeometry();
                var geom = geometry.geometry;
                for (var i = 0; i < geom.points.length; i++) {
                  // TODO translate the projection properly here
                  geom.points[i] = proj4('EPSG:3857', 'EPSG:4326', geom.points[i]);
                }
                var geoJson = geometry.geometry.toGeoJSON();
                // console.log('geoJson', geoJson);
                geojsonLayer.addData(geoJson);
              }, function(err) {
                callback();
              });
            });
          });
        });
      });
    }
    r.readAsArrayBuffer(f);
  }
