var GeoPackage = require('./lib/geopackage')
  , GeoPackageManager = require('./lib/geoPackageManager')
  , GeoPackageConnection = require('./lib/db/GeoPackageConnection')
  , GeoPackageTileRetriever = require('./lib/tiles/retriever')
  , async = require('async')
  , SQL = require('sql.js')
  , jquery = require('jquery')
  , proj4 = require('proj4')
  , reproject = require('reproject')
  , L = require('leaflet')
  , fileType = require('file-type');

  L.Icon.Default.imagePath = 'node_modules/leaflet/dist/images/';
  var map = L.map('map', {
    center: [45,0],
    zoom: 0,
    worldCopyJump: true
  });

  var baseLayer = L.tileLayer('http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png');
  baseLayer.addTo(map);

  var geojsonLayer = L.geoJson();



  module.exports.loadGeoPackage = function(files) {
    console.log('files', files);
    var f = files[0];
    var r = new FileReader();
    r.onload = function() {
      var Uints = new Uint8Array(r.result);
      db = new SQL.Database(Uints);
      GeoPackageConnection.connectWithDatabase(db, function(err, connection) {
        var geoPackage = new GeoPackage('', '', connection);

        geoPackage.getTileTables(function(err, tables) {
          async.eachSeries(tables, function(table, callback) {

            geoPackage.getTileDaoWithTableName(table, function(err, tileDao) {

              var maxZoom = tileDao.maxZoom;
              var minZoom = tileDao.minZoom;

              var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
              var tableLayer = L.tileLayer.canvas({noWrap: true, minZoom: minZoom, maxZoom: maxZoom});
              tableLayer.drawTile = function(canvas, tilePoint, zoom) {
                gpr.getTile(tilePoint.x, tilePoint.y, zoom, function(err, tile) {
                  if (tile) {
                    var ctx = canvas.getContext('2d');
                    var type = fileType(tile.tile_data);

                    var base64Data = btoa(String.fromCharCode.apply(null, tile.tile_data));
                    var image = document.createElement('img');
                    image.onload = function() {
                      ctx.drawImage(image, 0, 0, 256, 256);
                    };
                    image.src = 'data:'+type.mime+';base64,' + base64Data;
                  }

                });
              };
              tableLayer.addTo(map);
              callback();
            });
          }, function() {
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
              }, function() {
                geojsonLayer.addTo(map);
                geojsonLayer.bringToFront();
              });
            });
          });
        });
      });
    }
    r.readAsArrayBuffer(f);
  }
