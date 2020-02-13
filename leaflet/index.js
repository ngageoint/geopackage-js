var map = L.map('map', {
  crs: L.CRS.EPSG4326
}).setView([45, 15], 3);

var baseLayer = L.tileLayer('https://osm.geointservices.io/tiles/default_pc/{z}/{x}/{y}.png', {
  attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});
baseLayer.addTo(map);

var tileLayer = L.geoPackageTileLayer({
    geoPackageUrl: './4326.gpkg',
    layerName: 'Slate_Canvas_tiles'
}).addTo(map);

tileLayer.on('load', function() {
  tileLayer.off('load');
  L.geoPackageFeatureLayer([], {
      geoPackageUrl: 'https://ngageoint.github.io/GeoPackage/examples/rivers.gpkg',
      layerName: 'rivers',
      style: function (feature) {
        return {
          color: "#F00",
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
  }).addTo(map);
});
