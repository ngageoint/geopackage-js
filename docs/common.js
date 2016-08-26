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

var baseLayer = L.tileLayer('http://mapbox.geointservices.io:2999/v4/mapbox.light/{z}/{x}/{y}.png');
baseLayer.addTo(map);

var geoPackage;
var tableLayers;
var imageOverlay;
var currentTile = {};
var tableInfos;
var fileName;

var saveByteArray = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (data, name) {
        var blob = new Blob(data, {type: "octet/stream"}),
            url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = name;
        a.click();
        window.URL.revokeObjectURL(url);
    };
}());

window.saveGeoPackage = function() {
  geoPackage.export(function(err, data) {
    fileName = fileName || 'geopackage.gpkg';
    saveByteArray([data.buffer], fileName.substring(0, fileName.lastIndexOf('.')) + '.gpkg');
  });
}

window.loadGeoPackage = function(files) {
  var f = files[0];
  fileName = f.name;
  $('#choose-label').find('i').toggle();
  $('#choose-label').find('span').text(f.name);

  var r = new FileReader();
  r.onload = function() {
    var array = new Uint8Array(r.result);

    // if it is a GeoPackage file
    if (f.name.lastIndexOf('gpkg') === f.name.lastIndexOf('.')+1) {
      loadByteArray(array, function() {
        $('#choose-label').find('i').toggle();
        $('#download').removeClass('gone');
      });
    }
    // if it is a GeoJSON file
    else if (f.name.lastIndexOf('json') > f.name.lastIndexOf('.')) {
      var jsonString = '';
      var len = array.byteLength;
      for (var i = 0; i < len; i++) {
        jsonString += String.fromCharCode( array[ i ] );
      }
      var json = JSON.parse(jsonString);
      GeoJSONToGeoPackage.convert(json, function(err, gp) {
        geoPackage = gp;
        clearInfo();
        readGeoPackage(function() {
          $('#choose-label').find('i').toggle();
          $('#download').removeClass('gone');
        });
      });
    }
  }
  r.readAsArrayBuffer(f);
}

function clearInfo() {
  var tileTableNode = $('#tile-tables');
  tileTableNode.empty();
  var featureTableNode = $('#feature-tables');
  featureTableNode.empty();

  for (layerName in tableLayers) {
    map.removeLayer(tableLayers[layerName]);
  }
  tableLayers = {};
  if (imageOverlay) {
    map.removeLayer(imageOverlay);
  }
  $('#information').removeClass('hidden').addClass('visible');
}

function loadByteArray(array, callback) {
  clearInfo();

  GeoPackageAPI.openGeoPackageByteArray(array, function(err, gp) {
    geoPackage = gp;
    readGeoPackage(callback);
  });
}

function readGeoPackage(callback) {
  tableInfos = {};
  var featureTableTemplate = $('#feature-table-template').html();
  Mustache.parse(featureTableTemplate);

  var tileTableTemplate = $('#tile-table-template').html();
  Mustache.parse(tileTableTemplate);

  var tileTableNode = $('#tile-tables');
  var featureTableNode = $('#feature-tables');

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
      var tableLayer = L.tileLayer.canvas({noWrap: true, minZoom: minZoom, maxZoom: maxZoom});
      tableLayer.drawTile = function(canvas, tilePoint, zoom) {
        console.time('Draw tile ' + tilePoint.x + ', ' + tilePoint.y + ' zoom: ' + zoom);
        GeoPackageAPI.drawXYZTileInCanvas(geoPackage, table, tilePoint.x, tilePoint.y, zoom, 256, 256, canvas, function(err) {
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
        pointToLayer: function(feature, latlng) {
          return L.circleMarker(latlng, {
            radius: 2
          });
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

    GeoPackageAPI.iterateGeoJSONFeaturesFromTable(geoPackage, table, function(err, geoJson, done) {
      geojsonLayer.addData(geoJson);
      done();
    }, function(err) {
      geojsonLayer.addTo(map);
      geojsonLayer.bringToFront();
      tableLayers[table] = geojsonLayer;
    });
  }
}

window.loadUrl = function(url, loadingElement, gpName) {
  loadingElement.toggle();
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'arraybuffer';

  $('#choose-label').find('span').text(gpName);

  xhr.onload = function(e) {
    var uInt8Array = new Uint8Array(this.response);
    loadByteArray(uInt8Array, function() {
      $('#download').removeClass('gone');
      $('#choose-label').find('i').toggle();
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
  var mapBounds = map.getBounds();
  if (imageOverlay) map.removeLayer(imageOverlay);
  currentTile = {};

  var tilesTableTemplate = $('#all-tiles-template').html();
  Mustache.parse(tilesTableTemplate);

  GeoPackageAPI.getTilesInBoundingBox(geoPackage, tableName, zoom, Math.max(-180, mapBounds.getWest()), Math.min(mapBounds.getEast(), 180), mapBounds.getSouth(), mapBounds.getNorth(), function(err, tiles) {
    if (!tiles || !tiles.tiles || !tiles.tiles.length) {
      tilesElement.empty();
      tilesElement.html('<div class="section-title">No tiles exist in the GeoPackage for the current bounds and zoom level. Min zoom: ' + tileDao.minZoom + ' Max Zoom: ' + tileDao.maxZoom + '</div>')
      return;
    }
    var rendered = Mustache.render(tilesTableTemplate, tiles);
    tilesElement.empty();
    tilesElement.append(rendered);
  });
}

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

  GeoPackageAPI.getTileFromTable(geoPackage, tableName, zoom, tileRow, tileColumn, function(err, tile) {
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
    columns: tableInfos[tableName].columns,
    srs: tableInfos[tableName].srs,
    features: []
  };
  console.log('columns', features.columns);
  GeoPackageAPI.iterateGeoJSONFeaturesFromTable(geoPackage, tableName, function(err, feature, featureDone) {
    feature.tableName = tableName;
    feature.values = [];
    console.log('feature.properties', feature.properties);
    for (var i = 0; i < features.columns.length; i++) {
      var value = feature.properties[features.columns[i].name];
      if (value === null || value === 'null') {
        feature.values.push('');
      } else {
        feature.values.push(value.toString());
      }
    }
    features.features.push(feature);
    featureDone();
  }, function() {
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

  GeoPackageAPI.getFeature(geoPackage, tableName, featureId, function(err, geoJson) {
    highlightLayer.clearLayers();
    highlightLayer.addData(geoJson);
    highlightLayer.bringToFront();
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

  GeoPackageAPI.getFeature(geoPackage, tableName, featureId, function(err, geoJson) {
    featureLayer.addData(geoJson);
    featureLayer.bringToFront();
    if (zoom) {
      map.fitBounds(featureLayer.getBounds());
    }
  });
}

window.clearHighlights = function() {
  highlightLayer.clearLayers();
}
