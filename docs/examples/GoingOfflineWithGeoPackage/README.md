# Going Offline With GeoPackage: MAGE, MapCache, and More
## Lightening talk September 26th, 2022

Map tiles from [OpenStreetMap](https://www.openstreetmap.org/) and [Stamen](http://maps.stamen.com/#toner/12/37.7706/-122.3782).

This example page opens a GeoPackage with local landmarks, and OpenStreetMap tiles from Washington DC and displays them on a Leaflet map using the NGA's GeoPackage Leaflet plugin.

![GeoPackage-JS Example Screenshot](geopackage.png)

### Run

You can run this example using any web server. For simplicity, I prefer to use the Python module SimpleHTTPServer. If you have python installed, then you already have this module as well.

From this directory, run:

```
$ python -m SimpleHTTPServer
```

Open a web browser and point it to http://localhost:8000.

### Code Walkthrough

We are using Leaflet with our [leaflet plugin](https://github.com/ngageoint/geopackage-js/tree/master/leaflet) which has convenience methods for quickly adding data from a GeoPackage to a Leaflet map. 

Setup leaflet and add a map. We are using the Stamen Toner map, which is black and white so our color OSM tiles will show up nicely.
```javascript
const { GeoPackageAPI, setSqljsWasmLocateFile } = window.GeoPackage;
const geoPackageMap = L.map('geopackage-map').setView([38.891033, -77.039604], 14);
L.tileLayer('http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png', {
  attribution:
	 'Source: Esri, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community. OpenStreetMap.',
}).addTo(geoPackageMap);

const sqljsWasmLocateFile = file => 'vendor/ngageoint/leaflet-geopackage/dist/' + file;
setSqljsWasmLocateFile(sqljsWasmLocateFile);
```

### Tiles and features

```javascript
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
```
