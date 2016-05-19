var css = require('./includes.css');

var async = require('async')
  , SQL = require('sql.js')
  , reproject = require('reproject')
  , L = require('leaflet')
  , $ = require('jquery')
  , proj4 = require('proj4')
  , async = require('async')
  , Mustache = require('mustache')
  , fileType = require('file-type');

var GeoPackageAPI = require('geopackage')
  , GeoPackage = GeoPackageAPI.GeoPackage
  , GeoPackageManager = GeoPackageAPI.GeoPackageManager
  , GeoPackageConnection = GeoPackageAPI.GeoPackageConnection
  , GeoPackageTileRetriever = GeoPackageAPI.GeoPackageTileRetriever
  , TileBoundingBoxUtils = GeoPackageAPI.TileBoundingBoxUtils
  , BoundingBox = GeoPackageAPI.BoundingBox;

  window.proj4 = proj4;
  window.async = async;

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

  var tableInfos;

  function loadByteArray(array, callback) {
    tableInfos = {};
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
                  tableInfos[table] = info;
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
                  tableInfos[table] = info;
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
          console.time('Draw tile ' + tilePoint.x + ', ' + tilePoint.y + ' zoom: ' + zoom);
          gpr.drawTileIn(tilePoint.x, tilePoint.y, zoom, canvas, function(err, tile) {
            console.timeEnd('Draw tile ' + tilePoint.x + ', ' + tilePoint.y + ' zoom: ' + zoom);
            tableLayer.tileDrawn(canvas);
          });
        };
        tableLayer.addTo(map);
        tableLayer.bringToFront();
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
      var tableInfo = tableInfos[table];
      geoPackage.getFeatureDaoWithTableName(table, function(err, featureDao) {
        if (err) {
          return;
        }
        var features = 0;
        var srs = tableInfo.srs;
        featureDao.queryForEach(function(err, row, rowDone) {
          features++;
          var currentRow = featureDao.getFeatureRow(row);
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
                var column = tableInfo.columnMap[key];
                geoJson.properties[column.displayName] = currentRow.values[key];
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

  window.loadZooms = function(tableName, tilesElement) {
    var zoomsTemplate = $('#tile-zoom-levels-template').html();
    Mustache.parse(zoomsTemplate);

    geoPackage.getTileDaoWithTableName(tableName, function(err, tileDao) {
      var zooms = [];
      for (var i = tileDao.minZoom; i <= tileDao.maxZoom; i++) {
        zooms.push({zoom: i, tableName: tableName});
      }
      var zoomLevels = {
        zooms: zooms
      };
      var rendered = Mustache.render(zoomsTemplate, zoomLevels);
      tilesElement.empty();
      tilesElement.append(rendered);
    });
  }

  var visibleTileTables = {};

  window.zoomMap = function(zoom) {
    map.setZoom(zoom);
  }

  window.registerTileTable = function(tableName, tilesElement) {
    visibleTileTables[tableName] = tilesElement;
    loadTiles(tableName, map.getZoom(), tilesElement);
  }

  window.unregisterTileTable = function(tableName) {
    delete visibleTileTables[tableName];
  }

  map.on('moveend', function() {
    for (var table in visibleTileTables) {
      window.loadTiles(table, map.getZoom(), visibleTileTables[table]);
    }
  });

  window.loadTiles = function(tableName, zoom, tilesElement) {
    map.setZoom(zoom);
    if (imageOverlay) map.removeLayer(imageOverlay);
    currentTile = {};

    var tilesTableTemplate = $('#all-tiles-template').html();
    Mustache.parse(tilesTableTemplate);

    var tiles = {};

    geoPackage.getTileDaoWithTableName(tableName, function(err, tileDao) {
      if (err) {
        return callback();
      }
      if (zoom < tileDao.minZoom || zoom > tileDao.maxZoom) {
        tilesElement.empty();
        tilesElement.html('<div class="section-title">No tiles exist in the GeoPackage for the current bounds and zoom level. Min zoom: ' + tileDao.minZoom + ' Max Zoom: ' + tileDao.maxZoom + '</div>')
        return;
      }

      tiles.columns = [];
      for (var i = 0; i < tileDao.table.columns.length; i++) {
        var column = tileDao.table.columns[i];
        tiles.columns.push({
          index: column.index,
          name: column.name,
          max: column.max,
          min: column.min,
          notNull: column.notNull,
          primaryKey: column.primaryKey
        });
      }
      tileDao.getSrs(function(err, srs) {
        tiles.srs = srs;
        tiles.tiles = [];

        var tms = tileDao.tileMatrixSet;
        var tm = tileDao.getTileMatrixWithZoomLevel(zoom);
        var mapBounds = map.getBounds();
        var mapBoundingBox = new BoundingBox(Math.max(-180, mapBounds.getWest()), Math.min(mapBounds.getEast(), 180), mapBounds.getSouth(), mapBounds.getNorth());
        tiles.west = Math.max(-180, mapBounds.getWest()).toFixed(2);
        tiles.east = Math.min(mapBounds.getEast(), 180).toFixed(2);
        tiles.south = mapBounds.getSouth().toFixed(2);
        tiles.north = mapBounds.getNorth().toFixed(2);
        tiles.zoom = zoom;
        mapBoundingBox = mapBoundingBox.projectBoundingBox('EPSG:4326', tileDao.srs.organization.toUpperCase() + ':' + tileDao.srs.organizationCoordsysId);

        var grid = TileBoundingBoxUtils.getTileGridWithTotalBoundingBox(tms.getBoundingBox(), tm.matrixWidth, tm.matrixHeight, mapBoundingBox);

        tileDao.queryByTileGrid(grid, zoom, function(err, row, rowDone) {
          var tile = {};
          tile.tableName = tableName;
          tile.id = row.getId();

          var tileBB = TileBoundingBoxUtils.getTileBoundingBox(tms.getBoundingBox(), tm, row.getTileColumn(), row.getTileRow());
          tile.minLongitude = tileBB.minLongitude;
          tile.maxLongitude = tileBB.maxLongitude;
          tile.minLatitude = tileBB.minLatitude;
          tile.maxLatitude = tileBB.maxLatitude;
          tile.projection = tileDao.srs.organization.toUpperCase() + ':' + tileDao.srs.organizationCoordsysId;
          tile.values = [];
          for (var i = 0; i < tiles.columns.length; i++) {
            var value = row.values[tiles.columns[i].name];
            if (tiles.columns[i].name === 'tile_data') {
              tile.values.push('data');
            } else
            if (value === null || value === 'null') {
              tile.values.push('');
            } else {
              tile.values.push(value.toString());
              tile[tiles.columns[i].name] = value;
            }
          }
          tiles.tiles.push(tile);
          rowDone();
        }, function(err) {
          var rendered = Mustache.render(tilesTableTemplate, tiles);
          tilesElement.empty();
          tilesElement.append(rendered);
        });
      });
    });
  }

  var imageOverlay;
  var currentTile = {};

  window.zoomToTile = function(tileColumn, tileRow, zoom, minLongitude, minLatitude, maxLongitude, maxLatitude, projection, tableName) {
    if (imageOverlay) map.removeLayer(imageOverlay);
    if (tileColumn === currentTile.tileColumn
    && tileRow === currentTile.tileRow
    && zoom === currentTile.zoom
    && tableName === currentTile.tableName) {
      currentTile = {};
      return;
    }
    var sw = proj4(projection, 'EPSG:4326', [minLongitude, minLatitude]);
    var ne = proj4(projection, 'EPSG:4326', [maxLongitude, maxLatitude]);
    // map.setView([((ne[1] - sw[1])/2) + sw[1], ((ne[0] - sw[0])/2) + sw[0]], zoom);

    geoPackage.getTileDaoWithTableName(tableName, function(err, tileDao) {
      tileDao.queryForTile(tileColumn, tileRow, zoom, function(err, tile) {
        var tileData = tile.getTileData();
        var type = fileType(tileData);
        var binary = '';
        var bytes = tileData;
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
          binary += String.fromCharCode( bytes[ i ] );
        }
        var base64Data = btoa( binary );
        var url = 'data:'+type.mime+';base64,' + base64Data;
        imageOverlay = L.imageOverlay(url, [[sw[1], sw[0]], [ne[1], ne[0]]]);
        currentTile.tileColumn = tileColumn;
        currentTile.tileRow = tileRow;
        currentTile.zoom = zoom;
        currentTile.tableName = tableName;
        imageOverlay.addTo(map);
      });
    });
  }

  window.highlightTile = function(minLongitude, minLatitude, maxLongitude, maxLatitude, projection) {

    var sw = proj4(projection, 'EPSG:4326', [minLongitude, minLatitude]);
    var ne = proj4(projection, 'EPSG:4326', [maxLongitude, maxLatitude]);
    var poly =  {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [[sw[0], sw[1]],
          [sw[0], ne[1]],
          [ne[0], ne[1]],
          [ne[0], sw[1]],
          [sw[0], sw[1]]]
        ]
      }
    };

    highlightLayer.clearLayers();
    highlightLayer.addData(poly);
    highlightLayer.bringToFront();
  }

  window.loadFeatures = function(tableName, featuresElement) {
    var featuresTableTemplate = $('#all-features-template').html();
    Mustache.parse(featuresTableTemplate);

    var features = {
      columns: [],
      features: []
    };

    async.waterfall([function(callback) {
      geoPackage.getFeatureDaoWithTableName(tableName, callback);
    }, function(featureDao, callback) {
      features.columns = tableInfos[tableName].columns;
      features.srs = tableInfos[tableName].srs;
      callback(null, featureDao);
    }, function(featureDao, callback) {
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
            if (geometry) {
              feature.values.push('Valid');
            } else {
              feature.values.push('No Geometry');
            }
          } else if (value === null || value === 'null') {
            feature.values.push('');
          } else {
            feature.values.push(value.toString());
          }
        }
        features.features.push(feature);
        rowDone();
      }, callback);
    }], function() {
      var rendered = Mustache.render(featuresTableTemplate, features);
      featuresElement.empty();
      featuresElement.append(rendered);
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
    var tableInfo = tableInfos[tableName];
    geoPackage.getFeatureDaoWithTableName(tableName, function(err, featureDao) {
      var srs = tableInfo.srs;
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
              var column = tableInfo.columnMap[key];
              geoJson.properties[column.displayName] = feature.values[key];
            }
          }
          highlightLayer.clearLayers();
          highlightLayer.addData(geoJson);
          highlightLayer.bringToFront();
        }
      });
    });
  }

  window.zoomToFeature = function(featureId, tableName) {
    window.toggleFeature(featureId, tableName, true, true);
  }

  var currentFeature;
  var featureLayer = L.geoJson([], {
      style: function (feature) {
          return {
            color: "#8000FF",
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
  map.addLayer(featureLayer);

  window.toggleFeature = function(featureId, tableName, zoom, force) {
    featureLayer.clearLayers();

    if (currentFeature === featureId && !force) {
      currentFeature = undefined;
      return;
    }

    currentFeature = featureId;
    var tableInfo = tableInfos[tableName];

    geoPackage.getFeatureDaoWithTableName(tableName, function(err, featureDao) {
      var srs = tableInfo.srs;
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
              var column = tableInfo.columnMap[key];
              geoJson.properties[column.displayName] = feature.values[key];
            }
          }
          featureLayer.addData(geoJson);
          featureLayer.bringToFront();
          if (zoom) {
            map.fitBounds(featureLayer.getBounds());
          }
        }
      });
    });
  }

  window.clearHighlights = function() {
    highlightLayer.clearLayers();
  }
