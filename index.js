var css = require('./includes.css');

var GeoPackage = require('./lib/geopackage')
  , GeoPackageManager = require('./lib/geoPackageManager')
  , GeoPackageConnection = require('./lib/db/GeoPackageConnection')
  , GeoPackageTileRetriever = require('./lib/tiles/retriever')
  , async = require('async')
  , SQL = require('sql.js')
  , reproject = require('reproject')
  , L = require('leaflet')
  , $ = require('jquery')
  , fileType = require('file-type');

  L.Icon.Default.imagePath = 'node_modules/leaflet/dist/images/';
  var map = L.map('map', {
    center: [45,0],
    zoom: 3,
    worldCopyJump: false,
    maxBounds: [
      [-85, -180],
      [85, 180]
    ]
  });

  var baseLayer = L.tileLayer('http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png');
  baseLayer.addTo(map);

  var geojsonLayer = L.geoJson();

  module.exports.loadGeoPackage = function(files) {
    var f = files[0];
    $('#choose-label').text(f.name);
    $('#title').text(f.name);

    var tileTableNode = $('#tile-tables');
    var featureTableNode = $('#feature-tables');
    $('#information').removeClass('hidden').addClass('visible');


    var r = new FileReader();
    r.onload = function() {
      var Uints = new Uint8Array(r.result);
      db = new SQL.Database(Uints);
      GeoPackageConnection.connectWithDatabase(db, function(err, connection) {
        var geoPackage = new GeoPackage('', '', connection);

        async.parallel([
          function(callback) {
            geoPackage.getTileTables(function(err, tables) {
              async.eachSeries(tables, function(table, callback) {
                tileTableNode.append('<div id="tile-'+table+'">' + table + ' zoom: (<span class="zoom"></span>)</div>');
                var zoomNode = $('#tile-' + table + ' .zoom');
                geoPackage.getTileDaoWithTableName(table, function(err, tileDao) {

                  var maxZoom = tileDao.maxZoom;
                  var minZoom = tileDao.minZoom;
                  zoomNode.text(minZoom + ' - ' + maxZoom);

                  var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
                  var tableLayer = L.tileLayer.canvas({noWrap: true, minZoom: minZoom, maxZoom: maxZoom});
                  tableLayer.drawTile = function(canvas, tilePoint, zoom) {
                    gpr.drawTileIn(tilePoint.x, tilePoint.y, zoom, canvas, function(err, tile) {
                    });
                  };
                  tableLayer.addTo(map);
                  callback();
                });
              }, callback);
            });
          }, function(callback) {
            geoPackage.getFeatureTables(function(err, tables) {
              async.eachSeries(tables, function(table, callback) {
                featureTableNode.append('<div id="tile-'+table+'">' + table + ' (<span class="count"></span>)</div>');
                var countNode = $('#tile-' + table + ' .count');
                geoPackage.getFeatureDaoWithTableName(table, function(err, featureDao) {
                  if (err) {
                    return callback();
                  }
                  var features = 0;
                  featureDao.getSrs(function(err, srs) {
                    featureDao.queryForEach(function(err, row, rowDone) {
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
                      countNode.text(features);
                      rowDone();
                    }, function(err) {
                      console.log('added ' + features + ' features');
                      callback();
                    });
                  });
                });
              }, function() {
                geojsonLayer.addTo(map);
                geojsonLayer.bringToFront();
                callback();
              });
            });
          }
        ]);
      });
    }
    r.readAsArrayBuffer(f);
  }
