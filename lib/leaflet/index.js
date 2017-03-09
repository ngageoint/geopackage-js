var GeoPackageAPI = require('../../index.js');

L.GridLayer.GeoPackage = L.GridLayer.extend({
	options: {
		layerName: '',
    geoPackageUrl: ''
	},
	initialize: function initialize(options) {
		options = L.setOptions(this, options);
		L.GridLayer.prototype.initialize.call(this, options);
	},
	onAdd: function onAdd(map) {
		L.GridLayer.prototype.onAdd.call(this, map);
    var layer = this;
    layer.geoPackageLoaded = false;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', this.options.geoPackageUrl, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function(e) {
      var uInt8Array = new Uint8Array(this.response);
      GeoPackageAPI.openGeoPackageByteArray(uInt8Array, function(err, gp) {
        console.timeEnd('Loading GeoPackage ' + layer.options.geoPackageUrl);
        layer.geoPackageLoaded = true;
        layer.geoPackage = gp;
      });
    };
    console.time('Loading GeoPackage ' + layer.options.geoPackageUrl);
    xhr.send();
	},
	onRemove: function onRemove(map) {
		L.GridLayer.prototype.onRemove.call(this, map);
	},
  createTile: function(tilePoint, done) {
    var canvas = L.DomUtil.create('canvas', 'leaflet-tile');
    var size = this.getTileSize();
    canvas.width = size.x;
    canvas.height = size.y;
    maybeDrawTile(this, tilePoint, canvas, done);
    return canvas;
  }
});

function maybeDrawTile(gridLayer, tilePoint, canvas, callback) {
  var geoPackage = gridLayer.geoPackage;
  var layerName = gridLayer.options.layerName;
  if (!geoPackage) {
    // not loaded yet, just wait
    setTimeout(maybeDrawTile, 250, gridLayer, tilePoint, canvas, callback);
    return;
  }
  setTimeout(function() {
    console.time('Draw tile ' + tilePoint.x + ', ' + tilePoint.y + ' zoom: ' + tilePoint.z);
    GeoPackageAPI.drawXYZTileInCanvas(geoPackage, layerName, tilePoint.x, tilePoint.y, tilePoint.z, canvas.width, canvas.height, canvas, function(err) {
      console.timeEnd('Draw tile ' + tilePoint.x + ', ' + tilePoint.y + ' zoom: ' + tilePoint.z);
      callback(err, canvas);
    });
  }, 0);
}

L.gridLayer.geoPackage = function(opts){
	return new L.GridLayer.GeoPackage(opts);
}
