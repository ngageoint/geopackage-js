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
  , Mustache = require('mustache')
  , fileType = require('file-type');

  window.$ = $;
  L.Icon.Default.imagePath = 'node_modules/leaflet/dist/images/';
  var map = L.map('map', {
    center: [45,0],
    zoom: 3,
    worldCopyJump: false,
    maxBounds: [
      [-85, -180],
      [85, 180]
    ],
    attributionControl: false
  });

  var credits = L.control.attribution().addTo(map);
  credits.addAttribution("&copy; <a href='https://www.mapbox.com/map-feedback/'>Mapbox</a> &copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>");

  var baseLayer = L.tileLayer('http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png');
  baseLayer.addTo(map);

  var geoPackage;
  var tableLayers = {};

  module.exports.loadGeoPackage = function(files) {
    var f = files[0];
    $('#choose-label').text(f.name);

    var tileTableNode = $('#tile-tables');
    var featureTableNode = $('#feature-tables');
    $('#information').removeClass('hidden').addClass('visible');

    var featureTableTemplate = $('#feature-table-template').html();
    Mustache.parse(featureTableTemplate);

    var tileTableTemplate = $('#tile-table-template').html();
    Mustache.parse(tileTableTemplate);


    var r = new FileReader();
    r.onload = function() {
      var Uints = new Uint8Array(r.result);
      db = new SQL.Database(Uints);
      GeoPackageConnection.connectWithDatabase(db, function(err, connection) {
        geoPackage = new GeoPackage('', '', connection);

        async.parallel([
          function(callback) {
            geoPackage.getTileTables(function(err, tables) {
              async.eachSeries(tables, function(table, callback) {
                geoPackage.getTileDaoWithTableName(table, function(err, tileDao) {
                  geoPackage.getInfoForTable(tileDao, function(err, info) {
                    var rendered = Mustache.render(tileTableTemplate, info);
                    tileTableNode.append(rendered);
                    callback();
                  });
                });
              }, callback);
            });
          }, function(callback) {
            geoPackage.getFeatureTables(function(err, tables) {
              async.eachSeries(tables, function(table, callback) {
                geoPackage.getFeatureDaoWithTableName(table, function(err, featureDao) {
                  if (err) {
                    return callback();
                  }
                  geoPackage.getInfoForTable(featureDao, function(err, info) {
                    var rendered = Mustache.render(featureTableTemplate, info);
                    featureTableNode.append(rendered);
                    callback();
                  });
                });
              }, callback);
            });
          }
        ]);
      });
    }
    r.readAsArrayBuffer(f);
  }

  window.toggleLayer = function(layerType, table) {
    if (tableLayers[table]) {
      map.removeLayer(tableLayers[table]);
      delete tableLayers[table];
      return;
    }

    if (layerType === 'tile') {
      geoPackage.getTileDaoWithTableName(table, function(err, tileDao) {

        var maxZoom = tileDao.maxZoom;
        var minZoom = tileDao.minZoom;

        var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
        var tableLayer = L.tileLayer.canvas({noWrap: true, minZoom: minZoom, maxZoom: maxZoom});
        tableLayer.drawTile = function(canvas, tilePoint, zoom) {
          gpr.drawTileIn(tilePoint.x, tilePoint.y, zoom, canvas, function(err, tile) {
          });
        };
        tableLayer.addTo(map);
        tableLayers[table] = tableLayer;
      });
    } else if (layerType === 'feature') {
      var geojsonLayer = L.geoJson();
      geoPackage.getFeatureDaoWithTableName(table, function(err, featureDao) {
        if (err) {
          return;
        }
        var features = 0;
        featureDao.getSrs(function(err, srs) {
          featureDao.queryForEach(function(err, row, rowDone) {
            features++;
            var currentRow = featureDao.getFeatureRow(row);
            var geometry = currentRow.getGeometry();
            if (geometry ) {
              var geom = geometry.geometry;
              var geoJson = geometry.geometry.toGeoJSON();
              if (srs.definition && srs.definition !== 'undefined') {
                geoJson = reproject.reproject(geoJson, srs.organization + ':' + srs.organizationCoordsysId, 'EPSG:4326');
              }
              geojsonLayer.addData(geoJson);
            }
            rowDone();
          }, function(err) {
            geojsonLayer.addTo(map);
            geojsonLayer.bringToFront();
            tableLayers[table] = geojsonLayer;
          });
        });
      });
    }
  }
