const { GeoPackageAPI, setSqljsWasmLocateFile } = window.GeoPackage;
const geoPackageMap = L.map('geopackage-map').setView([38.891033, -77.039604], 14);
L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', {
  attribution:
    'Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under ODbL.',
}).addTo(geoPackageMap);

const sqljsWasmLocateFile = file => 'vendor/ngageoint/leaflet-geopackage/dist/' + file;
setSqljsWasmLocateFile(sqljsWasmLocateFile);

function loadData() {
  // setup poi icon
  const poiIcon = L.icon({
    iconUrl: 'public/images/poi.png',
    shadowUrl: 'public/images/shadow.png',
    iconSize: [32, 40],
    shadowSize: [32, 38],
    iconAnchor: [16, 40],
    shadowAnchor: [12, 32],
    popupAnchor: [0, -64],
  });

  // create Leaflet GeoPackage Tile Layer
  const tileLayer = new L.geoPackageTileLayer({
    geoPackageUrl: 'public/DCTour.gpkg',
    layerName: 'OpenStreetMap',
    sqlJsWasmLocateFile: sqljsWasmLocateFile
  })
  geoPackageMap.addLayer(tileLayer);
  tileLayer.bringToFront();


  // create Leaflet GeoPackage Feature Layers
  const layers = ['Buildings', 'Monuments', 'Museums'];
  layers.forEach(layerName => {
    const featureLayer = L.geoPackageFeatureLayer([], {
      geoPackageUrl: 'public/DCTour.gpkg',
      layerName: layerName,
      sqlJsWasmLocateFile: sqljsWasmLocateFile,
      style: { color: '#00F', weight: 2, opacity: 1, fillColor: '#093', fillOpacity: 0.25 },
      pointToLayer: (feature, latlng) => L.marker(latlng, { icon: poiIcon }),
    });
    geoPackageMap.addLayer(featureLayer);
  });
}

loadData();
