const { GeoPackageAPI, setSqljsWasmLocateFile } = window.GeoPackage;
const geopackageMap = L.map('geopackage-map').setView([38.6258, -90.189933], 14);
L.tileLayer('http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png', {
  attribution:
    'Source: Esri, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community. OpenStreetMap.',
}).addTo(geopackageMap);

setSqljsWasmLocateFile(file => 'https://unpkg.com/@ngageoint/geopackage/dist/' + file);

window.onload = function() {
  window.loadUrl('./StLouis.gpkg');
};

window.loadUrl = function(url) {
  fileName = url.split('/').pop();
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'arraybuffer';

  xhr.onload = function(e) {
    const uInt8Array = new Uint8Array(this.response);
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    loadByteArray(uInt8Array);
  };
  xhr.send();
};

function loadByteArray(array) {
  GeoPackageAPI.open(array).then(geoPackage => {
    // Now you can operate on the GeoPackage
    // Get the tile table names
    const tileTableNames = geoPackage.getTileTables();
    const tileDao = geoPackage.getTileDao(tileTableNames[0]); // We know we have one tile layer, loop if you have more.
    const maxZoom = tileDao.maxWebMapZoom;
    const minZoom = tileDao.minWebMapZoom;
    const tableLayer = new L.GridLayer({ noWrap: true, minZoom: minZoom, maxZoom: maxZoom });
    tableLayer.createTile = function(tilePoint, done) {
      const canvas = L.DomUtil.create('canvas', 'leaflet-tile');
      const size = this.getTileSize();
      canvas.width = size.x;
      canvas.height = size.y;
      let error = null;
      setTimeout(function() {
        console.time('Draw tile ' + tilePoint.x + ', ' + tilePoint.y + ' zoom: ' + tilePoint.z);
        geoPackage
          .xyzTile(tileTableNames[0], tilePoint.x, tilePoint.y, tilePoint.z, size.x, size.y, canvas)
          .catch(err => {
            error = err;
          })
          .finally(() => {
            console.timeEnd('Draw tile ' + tilePoint.x + ', ' + tilePoint.y + ' zoom: ' + tilePoint.z);
            done(error, canvas);
          });
      }, 0);
      return canvas;
    };
    geopackageMap.addLayer(tableLayer);
    tableLayer.bringToFront();

    const featureTableNames = geoPackage.getFeatureTables();
    featureTableNames.forEach(featureTable => {
      console.log('featureTable: ' + featureTable);
      const featureDao = geoPackage.getFeatureDao(featureTable);
      const info = geoPackage.getInfoForTable(featureDao);
      // query for all features
      const iterator = featureDao.queryForEach();
      for (const row of iterator) {
        const feature = featureDao.getRow(row);
        const geometry = feature.geometry;
        if (geometry) {
          // Make the information into something we can display on the map with leaflet
          const geom = geometry.geometry;
          const geoJson = geom.toGeoJSON();
          geoJson.properties = {};
          geoJson.properties['table_name'] = featureTable;

          // map the values from the feature table into GeoJSON properties we can use to style the map and show a popup
          for (const key in feature.values) {
            if (feature.values.hasOwnProperty(key) && key != feature.geometryColumn.name) {
              const column = info.columnMap[key];
              geoJson.properties[column.displayName] = feature.values[key];
            }
          }
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          geojsonLayer.addData(geoJson);
        }
      }
    });
  });

  const geojsonLayer = L.geoJson([], {
    style: function(feature) {
      // Style the polygons
      return {
        color: '#000',
        weight: 2,
        opacity: 1,
        fillColor: '#093',
      };
    },
    onEachFeature: function(feature, layer) {
      layer.bindPopup('<div>' + feature.properties.name + '</div>');
      if (feature.properties.table_name == 'Pizza') {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        layer.setIcon(pizzaIcon);
      } else if (feature.properties.table_name == 'PointsOfInterest') {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        layer.setIcon(poiIcon);
      }
    },
  }).addTo(geopackageMap);

  // Configure the icons that we want to use to style our data
  const pizzaIcon = L.icon({
    iconUrl: 'pizza.png',
    shadowUrl: 'shadow.png',
    iconSize: [32, 40],
    shadowSize: [32, 38],
    iconAnchor: [16, 40],
    shadowAnchor: [12, 32],
    popupAnchor: [0, -64],
  });

  const poiIcon = L.icon({
    iconUrl: 'poi.png',
    shadowUrl: 'shadow.png',
    iconSize: [32, 40],
    shadowSize: [32, 38],
    iconAnchor: [16, 40],
    shadowAnchor: [12, 32],
    popupAnchor: [0, -64],
  });
}
