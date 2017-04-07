require('leaflet-geopackage');

var map = L.map('map').setView([45, 15], 3);

var baseLayer = L.tileLayer('https://mapbox.geointservices.io/v4/mapbox.light/{z}/{x}/{y}.png', {
  attribution: '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>'
});
baseLayer.addTo(map);

var tileLayer = L.tileLayer('http://localhost:4234/rivers_indexed/rivers/{z}/{x}/{y}.png', {
  attribution: 'GeoPackage JS'
});

tileLayer.addTo(map);

var tileLayer2 = L.tileLayer('http://localhost:4234/rivers_indexed/rivers_tiles/{z}/{x}/{y}.png', {
  attribution: 'GeoPackage JS'
});

//tileLayer2.addTo(map);

// var tileLayer = L.geoPackageTileLayer({
//     geoPackageUrl: 'http://ngageoint.github.io/GeoPackage/examples/rivers.gpkg',
//     layerName: 'rivers_tiles'
// }).addTo(map);
//
// tileLayer.on('load', function() {
//   tileLayer.off('load');
//   L.geoPackageFeatureLayer([], {
//       geoPackageUrl: 'http://ngageoint.github.io/GeoPackage/examples/rivers.gpkg',
//       layerName: 'rivers',
//       style: function (feature) {
//         return {
//           color: "#F00",
//           weight: 2,
//           opacity: 1
//         };
//       },
//       onEachFeature: function (feature, layer) {
//         var string = "";
//         for (var key in feature.properties) {
//           string += '<div class="item"><span class="label">' + key + ': </span><span class="value">' + feature.properties[key] + '</span></div>';
//         }
//         layer.bindPopup(string);
//       }
//   }).addTo(map);
// });
