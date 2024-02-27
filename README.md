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

### Usage ###

View the latest [docs](https://ngageoint.github.io/geopackage-js/).

#### Browser Usage ####
```html
<script src="/path/to/geopackage/dist/geopackage.min.js"></script>
```
```javascript

// Specify folder containing the sql-wasm.wasm file.
// By default, geopackage loads from https://server/public/sql-wasm.wasm
window.GeoPackage.setSqljsWasmLocateFile(file => '/path/to/geopackage/dist/' + file);

// attach this method to a file input onchange event
window.loadGeoPackage = function(files) {
  var f = files[0];
  var r = new FileReader();
  r.onload = function() {
    var array = new Uint8Array(r.result);
    loadByteArray(array);
  }
  r.readAsArrayBuffer(f);
}

function loadByteArray(array, callback) {
  window.GeoPackage.open(array).then(function(geoPackage) {
    // get the tile table names
    const tileTables = geoPackage.getTileTables();

    tileTables.forEach(table => {
      // get tile dao
      const tileDao = geoPackage.getTileDao(table);

      // get table info
      const tableInfo = geoPackage.getInfoForTable(tileDao);

      // draw a tile into a canvas for an XYZ tile
      var canvas = canvasFromSomewhere;
      var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
      var x = 0;
      var y = 0;
      var zoom = 0;

      gpr.drawTileIn(x, y, zoom, canvas).then(() => {
        // tile completed drawing
      }).catch(e => {
        // error drawing tile
        console.error(e);
      })

      // or get a tile base64 data URL for an XYZ tile
      gpr.getTile(x, y, zoom).then(base64DataUrl => {
        console.log(base64DataUrl);
      }).catch(e => {
        // error retrieving tile
        console.error(e);
      });

      // or get a tile from a GeoPackage tile column and tile row
      const tileRow = tileDao.queryForTile(tileColumn, tileRow, zoom);
      var tileData = tileRow.tileData();  // the raw bytes from the GeoPackage
    });

    // get the feature table names
    const featureTables = geoPackage.getFeatureTables();

    featureTables.forEach(table => {
      // get the feature dao
      const featureDao = geoPackage.getFeatureDao(table);

      // get the info for the table
      const tableInfo = geoPackage.geoPackage.getInfoForTable(featureDao);

      // draw tiles using features
      const ft = new FeatureTiles(featureDao);
      var x = 0;
      var y = 0;
      var zoom = 0;
      ft.drawTile(x, y, zoom).then(base64DataUrl => {
        console.log(base64DataUrl);
      }).catch(e => {
        // error retrieving tile
        console.error(e);
      });

      // query for all features as geojson
      const geojsonFeatures = geoPackage.queryForGeoJSONFeaturesInTable(table);
    });
  }).catch(function(error) {
    console.error(error);
  });
}

```

#### Web Worker Usage ####
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
      const img = new Image();
      img.onload = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = e.data.tile
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
 * Closes the geopackage connection inside of the worker
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
self.importScripts('/path/to/geopackage/dist/geopackage.min.js');
// specify the location of the sql.wasm file
GeoPackage.setSqljsWasmLocateFile(file => '/path/to/geopackage/dist/' + file);

// message listener
onmessage = function(e) {
  // open geopackage connection to fileData provided in message
  if (e.data.type === 'load') {
    GeoPackage.GeoPackageAPI.open(e.data.file).then(gp => {
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
    const ft = new GeoPackage.FeatureTiles(featureDao, width, height);
    ft.drawTile(x, y, z).then(tile => {
      postMessage({
        type: 'tile',
        tile: tile
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
    const tile = self.gp.xyzTile(table, x, y, z, 256, 256)
    postMessage(tile);
    // request the features from a feature table in geojson format
  } else if (e.data.type === 'get-geojson') {
    const table = e.data.table;
    const featureDao = self.gp.getFeatureDao(table);
    const srs = featureDao.srs
    let iterator = featureDao.queryForEach()
    const features = []
    for (let row of iterator) {
      if (!isNil(row)) {
        const featureRow = featureDao.getRow(row)
        const feature = GeoPackage.GeoPackage.parseFeatureRowIntoGeoJSON(featureRow, srs)
        feature.type = 'Feature'
        features.push(feature)
      }
    }
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
var {
  GeoPackageAPI,
  GeoPackageTileRetriever,
  FeatureTiles,
  setCanvasKitWasmLocateFile,
  SpatialReferenceSystem,
  Projection
} = require('@ngageoint/geopackage');

setCanvasKitWasmLocateFile(file => 'path/to/geopackage/dist/canvaskit/' + file);

// open the .gpkg file
GeoPackageAPI.open('filename.gpkg').then(geoPackage => {
  // get the tile table names
  const tileTables = geoPackage.getTileTables();

  tileTables.forEach(table => {
    // get tile dao
    const tileDao = geoPackage.getTileDao(table);

    // get table info
    const tableInfo = geoPackage.getInfoForTable(tileDao);

    // draw a tile into a canvas for an XYZ tile
    var canvas = canvasFromSomewhere;
    var gpr = new GeoPackageTileRetriever(tileDao, 256, 256);
    var x = 0;
    var y = 0;
    var zoom = 0;

    gpr.drawTileIn(x, y, zoom, canvas).then(() => {
      // tile completed drawing
    }).catch(e => {
      // error drawing tile
      console.error(e);
    })

    // or get a tile base64 data URL for an XYZ tile
    gpr.getTile(x, y, zoom).then(base64DataUrl => {
      console.log(base64DataUrl);
    }).catch(e => {
      // error retrieving tile
      console.error(e);
    });

    // or get a tile from a GeoPackage tile column and tile row
    const tileRow = tileDao.queryForTile(tileColumn, tileRow, zoom);
    var tileData = tileRow.tileData();  // the raw bytes from the GeoPackage
  });

  // get the feature table names
  const featureTables = geoPackage.getFeatureTables();

  featureTables.forEach(table => {
    // get the feature dao
    const featureDao = geoPackage.getFeatureDao(table);

    // get the info for the table
    const tableInfo = geoPackage.geoPackage.getInfoForTable(featureDao);

    // draw tiles using features
    const ft = new FeatureTiles(featureDao);
    var x = 0;
    var y = 0;
    var zoom = 0;
    ft.drawTile(x, y, zoom).then(base64DataUrl => {
      console.log(base64DataUrl);
    }).catch(e => {
      // error retrieving tile
      console.error(e);
    });

    // query for all features as geojson
    const geojsonFeatures = geoPackage.queryForGeoJSONFeaturesInTable(table);
  });

  // add a spatial reference system to the geopackage
  const srs = new SpatialReferenceSystem();
  srs.srs_name = 'NAD27 / UTM zone 11N';
  srs.srs_id = 26711;
  srs.organization = 'EPSG';
  srs.organization_coordsys_id = 26711;
  srs.definition = 'PROJCS["NAD27 / UTM zone 11N",GEOGCS["NAD27",DATUM["North_American_Datum_1927",SPHEROID["Clarke 1866",6378206.4,294.9786982138982,AUTHORITY["EPSG","7008"]],AUTHORITY["EPSG","6267"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4267"]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",-117],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["Easting",EAST],AXIS["Northing",NORTH],AUTHORITY["EPSG","26711"]]';
  geoPackage.createSpatialReferenceSystem(srs);

  // create a tile table using the spatial reference system
  // bounding box is the bounds for EPSG:26711
  const boundingBox = new BoundingBox(202161.66, 568941.68, 2982030.40, 8674415.25);
  geoPackage.createTileTableWithTableName(
    tableName,
    boundingBox,
    srs.srs_id,
    boundingBox,
    srs.srs_id,
  );

  /**
   * Note: any projection in the spatial reference system table is loaded into proj4 for use throughout the geopackage api
   * By default, this includes EPSG:3856 and EPSG:4326
   */
  // Load a projection to be used by API, but not saved to spatial reference system table.
  Projection.loadProjection('EPSG:26711', srs.definition)
});

```
