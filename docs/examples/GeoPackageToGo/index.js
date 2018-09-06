var GeoPackageAPI = window.geopackage;
var geopackageMap = L.map('geopackage-map').setView([38.625800, -90.189933], 14);
L.tileLayer('http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png', {
  attribution: 'Source: Esri, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community. OpenStreetMap.'
}).addTo(geopackageMap);


window.onload = function () {
  window.loadUrl(./StLouis.gpkg");
}


window.loadUrl = function(url) {
  fileName = url.split('/').pop();
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'arraybuffer';

  xhr.onload = function(e) {
    var uInt8Array = new Uint8Array(this.response);
    loadByteArray(uInt8Array);
  };
  xhr.send();
}


function loadByteArray(array, callback) {
  GeoPackageAPI.openGeoPackageByteArray(array, function(err, geoPackage) { // Now you can operate on the GeoPackage
    // Get the tile table names
    geoPackage.getTileTables(function(err, tileTableNames) {
      geoPackage.getTileDaoWithTableName(tileTableNames[0], function(err, tileDao) { // We know we have one tile layer, loop if you have more.
      var maxZoom = tileDao.maxWebMapZoom;
      var minZoom = tileDao.minWebMapZoom;
      var tableLayer = new L.GridLayer({noWrap: true, minZoom: minZoom, maxZoom: maxZoom});
      tableLayer.createTile = function(tilePoint, done) {
        var canvas = L.DomUtil.create('canvas', 'leaflet-tile');
        var size = this.getTileSize();
        canvas.width = size.x;
        canvas.height = size.y;
        setTimeout(function() {
          console.time('Draw tile ' + tilePoint.x + ', ' + tilePoint.y + ' zoom: ' + tilePoint.z);
          GeoPackageAPI.drawXYZTileInCanvas(geoPackage, tileTableNames[0], tilePoint.x, tilePoint.y, tilePoint.z, size.x, size.y, canvas, function(err) {
            console.timeEnd('Draw tile ' + tilePoint.x + ', ' + tilePoint.y + ' zoom: ' + tilePoint.z);
            done(err, canvas);
          });
        }, 0);
        return canvas;
      }
      geopackageMap.addLayer(tableLayer);
      tableLayer.bringToFront();
      });
    });

    // Get the feature table names
    geoPackage.getFeatureTables(function(err, featureTableNames) {
      for (var i = 0; i < featureTableNames.length; i++) {
        geoPackage.getFeatureDaoWithTableName(featureTableNames[i], function(err, featureDao) {
          geoPackage.getInfoForTable(featureDao, function(err, info) {

            // query for all features
            featureDao.queryForEach(function(err, row, rowDone) {
              var feature = featureDao.getFeatureRow(row);
              var geometry = feature.getGeometry();
              if (geometry) {
                // Make the information into something we can display on the map with leaflet
                var geom = geometry.geometry;
                var geoJson = geometry.geometry.toGeoJSON();
                geoJson.properties = {};
                geoJson.properties["table_name"] = feature.featureTable.table_name;

                // map the values from the feature table into GeoJSON properties we can use to style the map and show a popup
                for (var key in feature.values) {
                  if(feature.values.hasOwnProperty(key) && key != feature.getGeometryColumn().name) {
                    var column = info.columnMap[key];
                    geoJson.properties[column.displayName] = feature.values[key];
                  }
                }
                geojsonLayer.addData(geoJson);
              }
              rowDone();
            });
          });
        });
      }
    });
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

  // Configure the icons that we want to use to style our data
  var pizzaIcon = L.icon({
    iconUrl: 'pizza.png',
    shadowUrl: 'shadow.png',
    iconSize: [32, 40],
    shadowSize: [32, 38],
    iconAnchor: [16, 40],
    shadowAnchor: [12, 32],
    popupAnchor: [0, -64]
  });

  var poiIcon = L.icon({
    iconUrl: 'poi.png',
    shadowUrl: 'shadow.png',
    iconSize: [32, 40],
    shadowSize: [32, 38],
    iconAnchor: [16, 40],
    shadowAnchor: [12, 32],
    popupAnchor: [0, -64]
  });
}
