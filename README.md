# GeoPackage JS

GeoPackage JS is an implementation of the OGC GeoPackage spec.  This library works in both the browser and Node 12+.

### GeoPackage Viewer ###
[GeoPackage Viewer](http://ngageoint.github.io/geopackage-viewer-js/)

Cloning this repository and opening the docs/index.html in your browser will run the demo locally.

### Installation ###

[![Build Status](https://travis-ci.org/ngageoint/geopackage-js.svg?branch=master)](https://travis-ci.org/ngageoint/geopackage-js)
[![NPM](https://img.shields.io/npm/v/@ngageoint/geopackage.svg)](https://www.npmjs.com/package/@ngageoint/geopackage)
[![Coverage Status](https://coveralls.io/repos/github/ngageoint/geopackage-js/badge.svg)](https://coveralls.io/github/ngageoint/geopackage-js)

```sh
$ npm install @ngageoint/geopackage
```

#### GeoPackage JS Library ####

The [GeoPackage Libraries](http://ngageoint.github.io/GeoPackage/) were developed at the [National Geospatial-Intelligence Agency (NGA)](http://www.nga.mil/) in collaboration with [BIT Systems](http://www.bit-sys.com/). The government has "unlimited rights" and is releasing this software to increase the impact of government investments by providing developers with the opportunity to take things in new directions. The software use, modification, and distribution rights are stipulated within the [MIT license](http://choosealicense.com/licenses/mit/).

### Pull Requests ###
If you'd like to contribute to this project, please make a pull request. We'll review the pull request and discuss the changes. All pull request contributions to this project will be released under the MIT license.

Software source code previously released under an open source license and then modified by NGA staff is considered a "joint work" (see 17 USC § 101); it is partially copyrighted, partially public domain, and as a whole is protected by the copyrights of the non-government authors and must be released according to the terms of the original open source license.

### About ###

[GeoPackage JS](https://github.com/ngageoint/geopackage-js) is a [GeoPackage Library](http://ngageoint.github.io/GeoPackage/) JavaScript implementation of the Open Geospatial Consortium [GeoPackage](http://www.geopackage.org/) [spec](http://www.geopackage.org/spec/).  It is listed as an [OGC GeoPackage Implementation](http://www.geopackage.org/#implementations_nga) by the National Geospatial-Intelligence Agency.

<a href='http://www.opengeospatial.org/resource/products/details/?pid=1628'>
    <img src="https://github.com/ngageoint/GeoPackage/raw/master/docs/images/ogc.gif" height=50>
</a>

The GeoPackage JavaScript library currently provides the ability to read GeoPackage files.  This library works both in the browser and in Node.  In the browser tiles are rendered using HTML5 Canvas and GeoPackages are read using [sql.js](https://github.com/kripken/sql.js/).  In Node tiles are rendered  [PureImage](https://github.com/joshmarinacci/node-pureimage) and GeoPackages are read using [node-sqlite3](https://github.com/mapbox/node-sqlite3).

### Changelog

##### 5.0.1
- Added in FeatureTileGenerator
- Added in UrlTileGenerator
- Rebuilt CanvasKit to add support for webp and jpeg

##### 5.0.0
- GeoPackage JS's API has been updated to more closely match GeoPackage Java v6.4.0
  - Not yet implemented: 2D Gridded Tile Coverage Extension and OGC API Feature Generator 
- GeoPackageExtensions is now ExtensionManager
- GeoPackageAPI is now GeoPackageManager
- Added FeatureTileTableLink extension
- Added support for extended geometry types
- Added Properties extension
- Added ZoomOther extension
- Added support for drawing extended geometry types
- Updated to use NGA simple features javascript libraries
- Updated to use NGA projections javascript library
- Added UserCustomRow
- Reworked UserRow, UserTable, and UserColumn and updated all super types
- Added in FeatureConnection, TileConnection, AttributesConnection and UserCustomConnections.
- Added GeoPackageCache

##### 4.2.3

- fix cached geometry error

##### 4.2.2

- fix simplify error

##### 4.2.1

- Fix for drawing geometries outside of the 3857 bounds

##### 4.2.0

- Support for drawing vector data into EPSG:4326 tiles
- Added createStandardWGS84TileTable

##### 4.1.0

- Typescript updates
- Extract converters, leaflet plugin, mobile optimizer, and viewer into their own packages

##### 4.0.0

- Alter tables functions (copy, rename for table and columns)
- Publish separate node and browser module
- GeoPackageJS can now be run in Node.js worker_threads and Web Workers

##### 2.1.0

- Implementation of the Feature Style Extension and Contents ID Extension

##### 2.0.8

- Checks for Electron when returning a tile creator

##### 2.0

- All new API utilizing Promises

##### 1.1.4

- Adds a method to retrieve tiles in EPSG:4326

##### 1.1.3

- Fixes issue #115

##### 1.1.2

- fix case where GeoPackage Zoom does not correspond to the web map zoom

##### 1.1.1

- fix more instances of proj4 bug for react
- fixed tile generation for images with different x and y pixel densities

##### 1.1.0

- accept pull request adding support for react
- fix bug with projected tiles that spanned the date line

##### 1.0.25

- ensure we use proj4 2.4.3 instead of 2.4.4

##### 1.0.22

- Fixed bug where querying for indexed features only returned the geometry instead of the entire feature

##### 1.0.19

- Remove dependency on Lwip

### Usage ###

View the latest [docs](https://ngageoint.github.io/geopackage-js/).

#### Browser Usage ####
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test</title>
  <script src="/path/to/geopackage.min.js"></script>
</head>
<body>
<input id="fileInput" type="file"/>
<script src="./index.js"></script>
</body>
</html>
```
```javascript
// Specify folder containing the sql-wasm.wasm file.
// By default, geopackage loads from https://server/public/sql-wasm.wasm
const {
  GeoPackageManager,
  Canvas,
  TileUtils,
  GeoPackageTileRetriever,
  FeatureTiles,
  FeatureIndexManager,
  BoundingBox,
  setSqljsWasmLocateFile
} = window.GeoPackage

setSqljsWasmLocateFile(file => 'public/' + file);

// attach an event listener onto a file input
document.getElementById('fileInput').addEventListener('change',  function () {
  const file =this.files[0];
  const fileReader = new FileReader();
  fileReader.onload = function() {
    loadByteArray(new Uint8Array(fileReader.result));
  }
  fileReader.readAsArrayBuffer(file);
}, false);

function loadByteArray(array) {
  GeoPackageManager.open(array).then(async (geoPackage) => {
    // get the tile table names
    const tileTables = geoPackage.getTileTables();

    for (let i = 0; i < tileTables.length; i++) {
      const table = tileTables[i];
      // get tile dao
      const tileDao = geoPackage.getTileDao(table);

      // get table info
      const tableInfo = geoPackage.getInfoForTable(tileDao);

      // Get a GeoPackageTile and then draw it into a canvas.
      const canvas = Canvas.create(TileUtils.TILE_PIXELS_DEFAULT, TileUtils.TILE_PIXELS_DEFAULT);
      const context = canvas.getContext('2d');
      const gpr = new GeoPackageTileRetriever(tileDao);
      const x = 0;
      const y = 0;
      const zoom = 0;

      // Get the GeoPackageTile for a particular web mercator tile
      const geoPackageTile = await gpr.getTile(x, y, zoom)
      // get the tile data as a Buffer
      let tileData = geoPackageTile.getData();
      // Get the GeoPackageImage from the GeoPackageTile
      const geoPackageImage = await geoPackageTile.getGeoPackageImage()
      // draw the tile and use the canvas to get the Data URL
      context.drawImage(geoPackageImage.getImage(), 0, 0);
      const base64String = canvas.toDataURL('image/png');

      // In node.js, users must dispose of any GeoPackageImage and Canvas created to prevent memory leaks
      Canvas.disposeImage(geoPackageImage);
      Canvas.disposeCanvas(canvas);

      // Query tile table directly.
      const tileRow = tileDao.queryForTile(x, y, zoom);
      tileData = tileRow.getTileData();  // the raw bytes from the GeoPackage
    }

    // get the feature table names
    const featureTables = geoPackage.getFeatureTables();

    for (let i = 0; i < featureTables.length; i++) {
      const table = featureTables[i];
      // get the feature dao
      const featureDao = geoPackage.getFeatureDao(table);

      // get the info for the table
      const tableInfo = geoPackage.getInfoForTable(featureDao);

      // draw tiles using features
      const canvas = Canvas.create(TileUtils.TILE_PIXELS_DEFAULT, TileUtils.TILE_PIXELS_DEFAULT);
      const context = canvas.getContext('2d');
      const ft = new FeatureTiles(geoPackage, featureDao);
      var x = 0;
      var y = 0;
      var zoom = 0;
      const geoPackageImage = await ft.drawTile(x, y, zoom);
      context.drawImage(geoPackageImage.getImage(), 0, 0);
      const base64String = canvas.toDataURL('image/png');
      Canvas.disposeImage(geoPackageImage);
      Canvas.disposeCanvas(canvas);

      // iterate over indexed features that intersect the bounding box
      const featureIndexManager = new FeatureIndexManager(geoPackage, table);
      const resultSet = featureIndexManager.query();
      for (const featureRow of resultSet) {
        // ...
      }
      resultSet.close();

      // iterate over all features in a table in the geojson format
      const geoJSONResultSet = geoPackage.queryForGeoJSONFeatures(table);
      for (const feature of geoJSONResultSet) {
        // ...
      }
      geoJSONResultSet.close();
    }
  }).catch(function(error) {
    console.error(error);
  });
}

```

#### Web Worker Usage ####
##### index.html #####
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Test</title>
    <script src="/path/to/geopackage.min.js"></script>
</head>
<body>
<input id="fileInput" type="file" onchange="openConnection(this.files)"/>
<canvas id="canvas" width="256px" height="256px"></canvas>
<br>
<input id="table" type="text">Table:</input>
<br>
<input id="column" type="number">X:</input>
<br>
<input id="row" type="number">Y:</input>
<br>
<input id="zoom" type="number">Zoom:</input>
<br>
<button onclick="drawFeatureTileInCanvas(document.getElementById('table').value, document.getElementById('column').value, document.getElementById('row').value, document.getElementById('zoom').value)">GetFeatureTile</button>
<br>
<button onclick="drawTileInCanvas(document.getElementById('table').value, document.getElementById('column').value, document.getElementById('row').value, document.getElementById('zoom').value)">DrawTileInCanvas</button>
<br>
<button onclick="getFeatureTableAsGeoJSON(document.getElementById('table').value)">GetFeatureTableAsGeoJSON</button>
<br>
<button onclick="closeConnection()">Close</button>
<br>
<script src="./index.js"></script>
</body>
</html>
```
##### index.js #####
```javascript
// canvas for drawing, will need to be defined in html file.
var canvas = document.getElementById('canvas');

// setup worker
var geopackageWorker;
if (window.Worker) {
  geopackageWorker = new Worker("worker.js");

  // handle responses from the geopackage web worker
  geopackageWorker.onmessage = function(e) {
    // draw tile
    if (e.data.type === 'tile') {
      const ctx = canvas.getContext('2d');
      ctx.putImageData(e.data.tileImageData, 0, 0);
      // print geojson
    } else if (e.data.type === 'geojson') {
      console.log(e.data.geojson)
    }
  }
}

/**
 * Attach this method to a file input onchange event to open a geopackage connection
 * files[0] should be a valid .gpkg file
 * @param files - event.target.files
 */
openConnection = function(files) {
  var f = files[0];
  var r = new FileReader();
  r.onload = function() {
    var array = new Uint8Array(r.result);
    // create a connection to the geopackage
    geopackageWorker.postMessage({
      type: 'load',
      file: array
    });
  }
  r.readAsArrayBuffer(f);
}

/**
 * Closes the geopackage connection inside the worker
 */
closeConnection = function () {
  geopackageWorker.postMessage({
    type: 'close',
  });
}

/**
 * Will request the x,y,z feature tile to be drawn
 * @param table
 * @param x
 * @param y
 * @param z
 */
drawFeatureTileInCanvas = function (table, x, y, z) {
  console.log([table, x, y, z]);
  geopackageWorker.postMessage({
    type: 'get-feature-tile',
    table: table,
    x: x,
    y: y,
    z: z,
    width: canvas.width,
    height: canvas.height
  });
}

/**
 * Will request the x,y,z file to be drawn
 * @param table
 * @param x
 * @param y
 * @param z
 */
drawTileInCanvas = function (table, x, y, z) {
  geopackageWorker.postMessage({
    type: 'get-tile',
    table: table,
    x: x,
    y: y,
    z: z,
    width: canvas.width,
    height: canvas.height
  });
}

/**
 * Will request the features of a table in geojson format
 * @param table
 */
getFeatureTableAsGeoJSON = function (table) {
  geopackageWorker.postMessage({
    type: 'get-geojson',
    table: table
  });
}
```
##### worker.js ####
```javascript
// import the geopackage browser library
self.importScripts('/path/to/geopackage.min.js');
const {
  GeoPackageManager,
  Canvas,
  TileUtils,
  GeoPackageTileRetriever,
  FeatureTiles,
  BoundingBox,
  setSqljsWasmLocateFile
} = GeoPackage;

// specify the location of the sql.wasm file
setSqljsWasmLocateFile(file => 'public/' + file);

// message listener
onmessage = function(e) {
  // open geopackage connection to fileData provided in message
  if (e.data.type === 'load') {
    GeoPackageManager.open(e.data.file).then(gp => {
      self.gp = gp;
    });
    // close the geopackage connection
  } else if (e.data.type === 'close') {
    self.gp.close();
    // request a tile from a feature table
  } else if (e.data.type === 'get-feature-tile') {
    const table = e.data.table;
    const x = parseInt(e.data.x);
    const y = parseInt(e.data.y);
    const z = parseInt(e.data.z);
    const width = parseInt(e.data.width);
    const height = parseInt(e.data.height);
    const featureDao = self.gp.getFeatureDao(table);
    const ft = new FeatureTiles(self.gp, featureDao, width, height);
    ft.drawTile(x, y, z).then(tile => {
      postMessage({
        type: 'tile',
        tileImageData: tile.getImageData()
      });
    });
    // request a tile from a tile table
  } else if (e.data.type === 'get-tile') {
    const table = e.data.table;
    const x = parseInt(e.data.x);
    const y = parseInt(e.data.y);
    const z = parseInt(e.data.z);
    const width = parseInt(e.data.width);
    const height = parseInt(e.data.height);
    self.gp.xyzTile(table, x, y, z, width, height).then(gpTile => {
      gpTile.getGeoPackageImage().then(gpImage => {
        postMessage({
          type: 'tile',
          tileImageData: gpImage.getImageData()
        });
      })
    })
    // request the features from a feature table in geojson format
  } else if (e.data.type === 'get-geojson') {
    const table = e.data.table;
    const features = [];
    const featureResultSet = self.gp.queryForGeoJSONFeatures(table);
    for(const feature of featureResultSet) {
      features.push(feature);
    }
    featureResultSet.close();
    const featureCollection = {
      type: 'FeatureCollection',
      features: features
    }
    postMessage({
      type: 'geojson',
      geojson: featureCollection
    });
  }
}
```

#### NodeJS Usage ####
```javascript
const {
  setCanvasKitWasmLocateFile,
  GeoPackageManager,
  GeoPackageTileRetriever,
  FeatureTiles,
  Canvas,
  FeatureIndexManager,
  BoundingBox,
  TileUtils
} = require('@ngageoint/geopackage');
const { Projections } = require('@ngageoint/projections-js')
const { GeometryType } = require('@ngageoint/simple-features-js')

// specify the CanvasKit WebAssembly module's location.
setCanvasKitWasmLocateFile(file => '/path/to/node_modules/@ngageoint/geopackage/dist/canvaskit/' + file);

// open the .gpkg file
GeoPackageManager.open('/path/to/file.gpkg').then(async (geoPackage) => {
  // get the tile table names
  const tileTables = geoPackage.getTileTables();

  for (let i = 0; i < tileTables.length; i++) {
    const table = tileTables[i];
    // get tile dao
    const tileDao = geoPackage.getTileDao(table);

    // get table info
    const tableInfo = geoPackage.getInfoForTable(tileDao);

    // Get a GeoPackageTile and then draw it into a canvas.
    const canvas = Canvas.create(TileUtils.TILE_PIXELS_DEFAULT, TileUtils.TILE_PIXELS_DEFAULT);
    const context = canvas.getContext('2d');
    const gpr = new GeoPackageTileRetriever(tileDao);
    const x = 0;
    const y = 0;
    const zoom = 0;

    // Get the GeoPackageTile for a particular web mercator tile
    const geoPackageTile = await gpr.getTile(x, y, zoom)
    // get the tile data as a Buffer
    let tileData = geoPackageTile.getData();
    // Get the GeoPackageImage from the GeoPackageTile
    const geoPackageImage = await geoPackageTile.getGeoPackageImage()
    // draw the tile and use the canvas to get the Data URL
    context.drawImage(geoPackageImage.getImage(), 0, 0);
    const base64String = canvas.toDataURL('image/png');

    // In node.js, users must dispose of any GeoPackageImage and Canvas created to prevent memory leaks
    Canvas.disposeImage(geoPackageImage);
    Canvas.disposeCanvas(canvas);

    // Query tile table directly.
    const tileRow = tileDao.queryForTile(x, y, zoom);
    tileData = tileRow.getTileData();  // the raw bytes from the GeoPackage
  }

  // get the feature table names
  const featureTables = geoPackage.getFeatureTables();

  for (let i = 0; i < featureTables.length; i++) {
    const table = featureTables[i];
    // get the feature dao
    const featureDao = geoPackage.getFeatureDao(table);

    // get the info for the table
    const tableInfo = geoPackage.getInfoForTable(featureDao);

    // draw tiles using features
    const canvas = Canvas.create(TileUtils.TILE_PIXELS_DEFAULT, TileUtils.TILE_PIXELS_DEFAULT);
    const context = canvas.getContext('2d');
    const ft = new FeatureTiles(geoPackage, featureDao);
    var x = 0;
    var y = 0;
    var zoom = 0;
    const geoPackageImage = await ft.drawTile(x, y, zoom);
    context.drawImage(geoPackageImage.getImage(), 0, 0);
    // canvas.toDataURL('image/png'));
    Canvas.disposeImage(geoPackageImage);
    Canvas.disposeCanvas(canvas);

    // iterate over indexed features that intersect the bounding box
    const featureIndexManager = new FeatureIndexManager(geoPackage, table);
    const resultSet = featureIndexManager.queryWithBoundingBoxAndProjection(new BoundingBox(0, -90, 180, 90), Projections.getWGS84Projection());
    for (const featureRow of resultSet) {
      // ...
    }
    resultSet.close();

    // iterate over all features in a table in the geojson format
    const geoJSONResultSet = geoPackage.queryForGeoJSONFeatures(table);
    for (const feature of geoJSONResultSet) {
      // ...
    }
    geoJSONResultSet.close();
  }
});

```
