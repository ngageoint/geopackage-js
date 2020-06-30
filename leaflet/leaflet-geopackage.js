const GeoPackageAPI = require('@ngageoint/geopackage').GeoPackageAPI;

const geoPackageCache = {};

L.GeoPackageTileLayer = L.GridLayer.extend({
  options: {
    layerName: '',
    geoPackageUrl: '',
    geoPackage: undefined,
    noCache: false,
  },
  initialize: function initialize(options) {
    options = L.setOptions(this, options);
    L.GridLayer.prototype.initialize.call(this, options);
  },
  onAdd: function onAdd(map) {
    L.GridLayer.prototype.onAdd.call(this, map);
    const layer = this;

    if (layer.options.geoPackage) {
      layer.geoPackage = layer.options.geoPackage;
      layer.geoPackageLoaded = true;
      return;
    }

    if (!layer.options.noCache && geoPackageCache[layer.options.geoPackageUrl]) {
      console.log('GeoPackage was %s loaded, pulling from cache', layer.options.geoPackageUrl);
      layer.geoPackageLoaded = true;
      layer.geoPackage = geoPackageCache[layer.options.geoPackageUrl];
      return;
    }

    layer.geoPackageLoaded = false;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', this.options.geoPackageUrl, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function(e) {
      const uInt8Array = new Uint8Array(this.response);
      GeoPackageAPI.open(uInt8Array).then(function(gp) {
        console.timeEnd('Loading GeoPackage ' + layer.options.geoPackageUrl);
        layer.geoPackageLoaded = true;
        layer.geoPackage = gp;
        geoPackageCache[layer.options.geoPackageUrl] = layer.options.noCache || gp;
      });
    };
    console.time('Loading GeoPackage ' + layer.options.geoPackageUrl);
    xhr.send();
  },
  onRemove: function onRemove(map) {
    L.GridLayer.prototype.onRemove.call(this, map);
  },
  createTile: function(tilePoint, done) {
    const canvas = L.DomUtil.create('canvas', 'leaflet-tile');
    const size = this.getTileSize();
    canvas.width = size.x;
    canvas.height = size.y;
    maybeDrawTile(this, tilePoint, canvas, done);
    return canvas;
  },
});

function maybeDrawTile(gridLayer, tilePoint, canvas, done) {
  const geoPackage = gridLayer.geoPackage;
  const layerName = gridLayer.options.layerName;
  const map = gridLayer._map;
  if (!geoPackage) {
    // not loaded yet, just wait
    setTimeout(maybeDrawTile, 250, gridLayer, tilePoint, canvas, done);
    return;
  }
  setTimeout(function() {
    console.time('Draw tile ' + tilePoint.x + ', ' + tilePoint.y + ' zoom: ' + tilePoint.z);

    if (map.options.crs === L.CRS.EPSG4326) {
      const tileSize = gridLayer.getTileSize(),
        nwPoint = tilePoint.scaleBy(tileSize),
        sePoint = nwPoint.add(tileSize),
        nw = map.unproject(nwPoint, tilePoint.z),
        se = map.unproject(sePoint, tilePoint.z);
      console.log('Draw 4326 tile');
      geoPackage
        .projectedTile(
          layerName,
          se.lat,
          nw.lng,
          nw.lat,
          se.lng,
          tilePoint.z,
          'EPSG:4326',
          canvas.width,
          canvas.height,
          canvas,
        )
        .then(function() {
          console.timeEnd('Draw tile ' + tilePoint.x + ', ' + tilePoint.y + ' zoom: ' + tilePoint.z);
          done(null, canvas);
        });
    } else {
      geoPackage
        .xyzTile(layerName, tilePoint.x, tilePoint.y, tilePoint.z, canvas.width, canvas.height, canvas)
        .then(function() {
          console.timeEnd('Draw tile ' + tilePoint.x + ', ' + tilePoint.y + ' zoom: ' + tilePoint.z);
          done(null, canvas);
        });
    }
  }, 0);
}

L.geoPackageTileLayer = function(opts) {
  return new L.GeoPackageTileLayer(opts);
};

L.GeoPackageFeatureLayer = L.GeoJSON.extend({
  options: {
    layerName: '',
    geoPackageUrl: '',
    geoPackage: undefined,
    noCache: false,
    style: function(feature) {
      return {
        color: '#00F',
        weight: 2,
        opacity: 1,
      };
    },
    pointToLayer: function(feature, latlng) {
      return L.circleMarker(latlng, {
        radius: 2,
      });
    },
  },
  initialize: function initialize(data, options) {
    options = L.setOptions(this, options);
    L.GeoJSON.prototype.initialize.call(this, data, options);
  },
  onAdd: function onAdd(map) {
    L.GeoJSON.prototype.onAdd.call(this, map);
    const layer = this;

    if (layer.options.geoPackage) {
      layer.geoPackage = layer.options.geoPackage;
      layer.geoPackageLoaded = true;
      var results = layer.geoPackage.iterateGeoJSONFeatures(layer.options.layerName);
      for (var geoJson of results) {
        geoJson = {
          type: 'Feature',
          geometry: geoJson.geometry,
          id: geoJson.id,
          properties: geoJson.properties,
        };
        layer.addData(geoJson);
      }
      return;
    }

    if (!layer.options.noCache && geoPackageCache[layer.options.geoPackageUrl]) {
      console.log('GeoPackage was %s loaded, pulling from cache', layer.options.geoPackageUrl);
      layer.geoPackageLoaded = true;
      layer.geoPackage = geoPackageCache[layer.options.geoPackageUrl];
      var results = layer.geoPackage.iterateGeoJSONFeatures(layer.options.layerName);
      for (var geoJson of results) {
        geoJson = {
          type: 'Feature',
          geometry: geoJson.geometry,
          id: geoJson.id,
          properties: geoJson.properties,
        };
        layer.addData(geoJson);
      }
      return;
    }
    layer.geoPackageLoaded = false;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', this.options.geoPackageUrl, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function(e) {
      const uInt8Array = new Uint8Array(this.response);
      GeoPackageAPI.open(uInt8Array).then(function(gp) {
        console.timeEnd('Loading GeoPackage ' + layer.options.geoPackageUrl);
        layer.geoPackageLoaded = true;
        layer.geoPackage = gp;
        geoPackageCache[layer.options.geoPackageUrl] = layer.options.noCache || gp;
        const results = layer.geoPackage.iterateGeoJSONFeatures(layer.options.layerName);
        for (let geoJson of results) {
          geoJson = {
            type: 'Feature',
            geometry: geoJson.geometry,
            id: geoJson.id,
            properties: geoJson.properties,
          };
          layer.addData(geoJson);
        }
      });
    };
    console.time('Loading GeoPackage ' + layer.options.geoPackageUrl);
    xhr.send();
  },
});

L.geoPackageFeatureLayer = function(data, opts) {
  return new L.GeoPackageFeatureLayer(data, opts);
};
