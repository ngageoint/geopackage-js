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
  , proj4 = require('proj4')
  , Mustache = require('mustache')
  , fileType = require('file-type');

  (function (window, document, undefined) {

    L.Control.ZoomIndicator = L.Control.extend({
    	options: {
    		position: 'topleft',
    		enabled: true
    	},

    	onAdd: function (map) {
    		var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-zoom-indicator');
        this._link = L.DomUtil.create('a', '', container);
        this._link.innerHTML = map.getZoom();
        map.on('zoomend', function() {
          this._link.innerHTML = map.getZoom();
        }, this);

        return container;
      }
    });

  }(this, document));

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

  map.addControl(new L.Control.ZoomIndicator());

  var credits = L.control.attribution().addTo(map);
  credits.addAttribution("&copy; <a href='https://www.mapbox.com/map-feedback/'>Mapbox</a> &copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>");

  var baseLayer = L.tileLayer('http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png');
  baseLayer.addTo(map);

  var geoPackage;
  var tableLayers = {};

  module.exports.loadGeoPackage = function(files) {
    var f = files[0];
    $('#choose-label').text(f.name);
    var r = new FileReader();
    r.onload = function() {
      var array = new Uint8Array(r.result);
      loadByteArray(array);
    }
    r.readAsArrayBuffer(f);
  }

  function loadByteArray(array, callback) {
    var tileTableNode = $('#tile-tables');
    tileTableNode.empty();
    var featureTableNode = $('#feature-tables');
    featureTableNode.empty();

    for (layerName in tableLayers) {
      map.removeLayer(tableLayers[layerName]);
    }

    var featureTableTemplate = $('#feature-table-template').html();
    Mustache.parse(featureTableTemplate);

    var tileTableTemplate = $('#tile-table-template').html();
    Mustache.parse(tileTableTemplate);

    $('#information').removeClass('hidden').addClass('visible');

    var db = new SQL.Database(array);
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
      ], callback);
    });
  }

  window.zoomTo = function(minX, minY, maxX, maxY, projection) {
    try {
      var sw = proj4(projection, 'EPSG:4326', [minX, minY]);
      var ne = proj4(projection, 'EPSG:4326', [maxX, maxY]);
      map.fitBounds([[sw[1], sw[0]], [ne[1], ne[0]]]);
    } catch (e) {
      map.fitBounds([[minY, minX], [maxY, maxX]]);
    }
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
      var geojsonLayer = L.geoJson([], {
          style: function (feature) {
              return {
                color: "#00F",
                weight: 2,
                opacity: 1
              };
          },
          onEachFeature: function (feature, layer) {
            var string = "";
            for (var key in feature.properties) {
              string += '<div class="item"><span class="label">' + key + ': </span><span class="value">' + feature.properties[key] + '</span></div>';
            }
            layer.bindPopup(string);
          }
      });
      geoPackage.getFeatureDaoWithTableName(table, function(err, featureDao) {
        if (err) {
          return;
        }
        var features = 0;
        featureDao.getSrs(function(err, srs) {
          featureDao.queryForEach(function(err, row, rowDone) {
            features++;
            var currentRow = featureDao.getFeatureRow(row);
            console.log('currentRow ID', currentRow.getId());
            var geometry = currentRow.getGeometry();
            if (geometry) {
              var geom = geometry.geometry;
              var geoJson = geometry.geometry.toGeoJSON();
              if (srs.definition && srs.definition !== 'undefined') {
                geoJson = reproject.reproject(geoJson, srs.organization + ':' + srs.organizationCoordsysId, 'EPSG:4326');
              }
              geoJson.properties = {};
              for (var key in currentRow.values) {
                if(currentRow.values.hasOwnProperty(key) && key != currentRow.getGeometryColumn().name) {
                  geoJson.properties[key] = currentRow.values[key];
                }
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

  window.loadUrl = function(url, loadingElement) {
    loadingElement.toggle();
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';

    xhr.onload = function(e) {
      var uInt8Array = new Uint8Array(this.response);
      loadByteArray(uInt8Array, function() {
        loadingElement.toggle();
      });
    };
    xhr.send();
  }

  window.loadFeatures = function(tableName, featuresElement) {
    var featuresTableTemplate = $('#all-features-template').html();
    Mustache.parse(featuresTableTemplate);

    var features = {};

    geoPackage.getFeatureDaoWithTableName(tableName, function(err, featureDao) {
      if (err) {
        return callback();
      }

      features.columns = [];
      for (var i = 0; i < featureDao.table.columns.length; i++) {
        var column = featureDao.table.columns[i];
        features.columns.push({
          index: column.index,
          name: column.name,
          max: column.max,
          min: column.min,
          notNull: column.notNull,
          primaryKey: column.primaryKey
        });
      }

      featureDao.getSrs(function(err, srs) {
        features.srs = srs;
        features.features = [];

        featureDao.queryForEach(function(err, row, rowDone) {
          var feature = {};
          var currentRow = featureDao.getFeatureRow(row);
          feature.tableName = tableName;
          feature.id = currentRow.getId();
          var geometry = currentRow.getGeometry();
          if (geometry) {
            var geom = geometry.geometry;
            var geoJson = geometry.geometry.toGeoJSON();
            feature.geometry = geoJson;
          }
          feature.values = [];
          for (var i = 0; i < features.columns.length; i++) {
            var value = currentRow.values[features.columns[i].name];
            if (features.columns[i].name === currentRow.getGeometryColumn().name) {
              feature.values.push('geom');
            } else if (value === null || value === 'null') {
              feature.values.push('');
            } else {
              feature.values.push(value.toString());
            }
          }
          features.features.push(feature);
          rowDone();
        }, function(err) {
          var rendered = Mustache.render(featuresTableTemplate, features);
          featuresElement.empty();
          featuresElement.append(rendered);
        });
      });
    });
  }

  var highlightLayer = L.geoJson([], {
      style: function (feature) {
          return {
            color: "#F00",
            weight: 3,
            opacity: 1
          };
      },
      onEachFeature: function (feature, layer) {
        var string = "";
        for (var key in feature.properties) {
          string += '<div class="item"><span class="label">' + key + ': </span><span class="value">' + feature.properties[key] + '</span></div>';
        }
        layer.bindPopup(string);
      }
  });
  map.addLayer(highlightLayer);

  window.highlightFeature = function(featureId, tableName) {
    geoPackage.getFeatureDaoWithTableName(tableName, function(err, featureDao) {
      featureDao.getSrs(function(err, srs) {
        featureDao.queryForIdObject(featureId, function(err, thing, feature) {
          feature = featureDao.getFeatureRow(feature);
          var geometry = feature.getGeometry();
          if (geometry) {
            var geom = geometry.geometry;
            var geoJson = geometry.geometry.toGeoJSON();
            if (srs.definition && srs.definition !== 'undefined') {
              geoJson = reproject.reproject(geoJson, srs.organization + ':' + srs.organizationCoordsysId, 'EPSG:4326');
            }
            geoJson.properties = {};
            for (var key in feature.values) {
              if(feature.values.hasOwnProperty(key) && key != feature.getGeometryColumn().name) {
                geoJson.properties[key] = feature.values[key];
              }
            }
            highlightLayer.clearLayers();
            highlightLayer.addData(geoJson);
            highlightLayer.bringToFront();
          }
        });
      });
    });
  }
