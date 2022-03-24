(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const map = L.map('map', {
  crs: L.CRS.EPSG4326,
}).setView([45, 15], 3);

const osm = L.tileLayer('https://osm-{s}.gs.mil/tiles/default_pc/{z}/{x}/{y}.png', {
  subdomains: '1234',
  attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong>',
});
osm.addTo(map);

// const tileLayer = L.geoPackageTileLayer({
//   geoPackageUrl: 'https://ngageoint.github.io/GeoPackage/examples/rivers.gpkg',
//   layerName: 'rivers_tiles',
// }).addTo(map);

// tileLayer.on('load', function() {
//   tileLayer.off('load');
L.geoPackageFeatureLayer([], {
  geoPackageUrl: 'https://ngageoint.github.io/GeoPackage/examples/rivers.gpkg',
  layerName: 'rivers',
  style: function(feature) {
    return {
      color: '#F00',
      weight: 2,
      opacity: 1,
    };
  },
  onEachFeature: function(feature, layer) {
    let string = '';
    for (const key in feature.properties) {
      string +=
        '<div class="item"><span class="label">' +
        key +
        ': </span><span class="value">' +
        feature.properties[key] +
        '</span></div>';
    }
    layer.bindPopup(string);
  },
}).addTo(map);
// });

},{}]},{},[1]);
