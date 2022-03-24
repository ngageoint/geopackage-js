var geopackageMap = L.map('geopackage-map').setView([38.625800, -90.189933], 14);
L.tileLayer('http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png', {
  attribution: 'Source: Esri, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community. OpenStreetMap.'
}).addTo(geopackageMap);

window.onload = function () {
  window.loadUrl('./StLouis.gpkg');
}

window.loadUrl = function(url) {
  fileName = url.split('/').pop();
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'arraybuffer';

  xhr.onload = function(e) {
    var uInt8Array = new Uint8Array(this.response);
    loadGeoPackage(uInt8Array);
  };
  xhr.send();
}

function loadGeoPackage(array, callback) {
  window.GeoPackage.setSqljsWasmLocateFile(filename => 'https://unpkg.com/@ngageoint/geopackage@4.1.0/dist/' + filename);
  window.GeoPackage.GeoPackageAPI.open(array).then((geoPackage) => { // Now you can operate on the GeoPackage
    // Get the tile table names
    const tileTableNames = geoPackage.getTileTables()
    const tileDao = geoPackage.getTileDao(tileTableNames[0])
    var maxZoom = tileDao.maxWebMapZoom;
    var minZoom = tileDao.minWebMapZoom;
    var tableLayer = new L.GridLayer({noWrap: true, minZoom: minZoom, maxZoom: maxZoom});
    tableLayer.createTile = function(tilePoint, done) {
      var canvas = L.DomUtil.create('canvas', 'leaflet-tile');
      var size = this.getTileSize();
      canvas.width = size.x;
      canvas.height = size.y;
      setTimeout(() => {
        console.time('Draw tile ' + tilePoint.x + ', ' + tilePoint.y + ' zoom: ' + tilePoint.z);
        geoPackage.xyzTile(tileTableNames[0], tilePoint.x, tilePoint.y, tilePoint.z, size.x, size.y, canvas).then(() => {
          console.timeEnd('Draw tile ' + tilePoint.x + ', ' + tilePoint.y + ' zoom: ' + tilePoint.z);
          done(null, canvas);
        }).catch((err) => {
          console.timeEnd('Draw tile ' + tilePoint.x + ', ' + tilePoint.y + ' zoom: ' + tilePoint.z);
          done(err, canvas);
        });
      }, 0);
      return canvas;
    }
    geopackageMap.addLayer(tableLayer);
    tableLayer.bringToFront();

    const featureTableNames = geoPackage.getFeatureTables()
    for (var i = 0; i < featureTableNames.length; i++) {
      const featureDao = geoPackage.getFeatureDao(featureTableNames[i])
      const info = geoPackage.getInfoForTable(featureDao)
      const iterator = featureDao.queryForEach()
      for (const row of iterator) {
        var feature = featureDao.getRow(row);
        var geometry = feature.geometry;
        if (geometry) {
          // Make the information into something we can display on the map with leaflet
          var geom = geometry.geometry;
          var geoJson = geometry.geometry.toGeoJSON();
          geoJson.properties = {};
          geoJson.properties["table_name"] = featureTableNames[i];

          // map the values from the feature table into GeoJSON properties we can use to style the map and show a popup
          for (var key in feature.values) {
            if(feature.values.hasOwnProperty(key) && key != feature.geometryColumn.name) {
              var column = info.columnMap[key];
              geoJson.properties[column.displayName] = feature.values[key];
            }
          }
          geojsonLayer.addData(geoJson);
        }
      }
    }
  }).catch(err => {
    console.error(err);
  });

  // Configure the icons that we want to use to style our data
  var pizzaIcon = L.icon({
    iconUrl: 'public/images/pizza.png',
    shadowUrl: 'public/images/shadow.png',
    iconSize: [32, 40],
    shadowSize: [32, 38],
    iconAnchor: [16, 40],
    shadowAnchor: [12, 32],
    popupAnchor: [0, -64]
  });

  var poiIcon = L.icon({
    iconUrl: 'public/images/poi.png',
    shadowUrl: 'public/images/shadow.png',
    iconSize: [32, 40],
    shadowSize: [32, 38],
    iconAnchor: [16, 40],
    shadowAnchor: [12, 32],
    popupAnchor: [0, -64]
  });

  var geojsonLayer = L.geoJson([], {
      style: function (feature) { // Style the polygons
          return {
            color: "#000",
            weight: 2,
            opacity: 1,
            fillColor: "#093"
          };
      },
      onEachFeature: function (feature, layer) {
        layer.bindPopup("<div>" + feature.properties.name + "</div>");

        if (feature.properties.table_name == "Pizza") {
          layer.setIcon(pizzaIcon);
        } else if (feature.properties.table_name == "PointsOfInterest") {
          layer.setIcon(poiIcon);
        }
      }
  }).addTo(geopackageMap);
}
