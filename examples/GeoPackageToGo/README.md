# GeoPackage To Go: Offline Maps from Web to Mobile
## FOSS4G North America 2018 - St. Louis, MO

A browser based GeoPackage example using [GeoPackage JS](https://github.com/ngageoint/geopackage-js) from the session at [FOSS4G](https://2018.foss4g-na.org/session/geopackage-go-offline-maps-web-mobile). There are also examples for [iOS](https://github.com/ngageoint/geopackage-ios/tree/master/docs/examples/swift/GeoPackage-to-go-iOS) and [Android](https://github.com/ngageoint/geopackage-android-map/tree/master/docs/examples/kotlin/GeoPackageToGoAndroid).

![GeoPackage-JS Example Screenshot](gpjs.png)
Map tiles from [OpenStreetMap](https://www.openstreetmap.org/).

This example page opens a GeoPackage with local landmarks, pizza restaurants, vectors of the parks, and OpenStreetMap tiles from St. Louis and displays them on a Leaflet map.

Want to learn more? See the API [documentation](https://ngageoint.github.io/geopackage-js/api-docs/).

### Run

You can run this example using any web server. For simplicity, I prefer to use the Python module SimpleHTTPServer. If you have python installed, then you already have this module as well.

From this directory, run:

```
$ python -m SimpleHTTPServer
```

Open a web browser and point it to http://localhost:8000.

### Code Walkthrough

We are using Leaflet, but you could use any map you like. There is also a [leaflet plugin](https://github.com/ngageoint/geopackage-js/tree/master/leaflet) that has convenience methods for quickly adding data from a GeoPackage to a Leaflet map. 

In your HTML, you can include GeoPackage JS from unpkg.

```html
<script type="text/javascript" src="https://unpkg.com/@ngageoint/geopackage/dist/geopackage.min.js"></script>
```

For a full end to end example, please see index.js in this directory. Once you have your file loaded, you can access the tiles inside like so:

```javascript
const { GeoPackageAPI, setSqljsWasmLocateFile } = window.GeoPackage;

// need to load this web assembly module to interact with database in browser.
setSqljsWasmLocateFile(file => 'https://unpkg.com/@ngageoint/geopackage/dist/' + file);

...

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
});

```

Now for the features. We need to pull the features out of the tables and convert them into a format that Leaflet can use display them on the map, in this case GeoJSON.

```javascript
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

```
