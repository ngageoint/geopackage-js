
var map = L.map('map').setView([45, 15], 3);

var baseLayer = L.tileLayer('https://mapbox.geointservices.io/v4/mapbox.light/{z}/{x}/{y}.png');
baseLayer.addTo(map);

L.gridLayer.geoPackage({
    geoPackageUrl: 'http://ngageoint.github.io/GeoPackage/examples/rivers.gpkg',
    layerName: 'rivers_tiles'
}).addTo(map);
