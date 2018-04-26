## @ngageoint/geopackage-mobile-optimizer &mdash; Optimize GeoPackages for mobile consumption

This utility will convert a GeoPackage into a GeoPackage which allows for friendly consumption on a web mercator mobile or web map.  The utility will convert to EPSG:3857 and place tiles aligned with regular XYZ coordinates.  This allows the clients to read the tiles from the tile tables without reprojecting or cropping.

### Installation ###

[![NPM](https://img.shields.io/npm/v/@ngageoint/geopackage-mobile-optimizer.svg)](https://www.npmjs.com/package/@ngageoint/geopackage-mobile-optimizer)

```sh
$ npm install @ngageoint/geopackage-mobile-optimizer
```

### Usage

#### Command Line

```sh
./mobile-optimizer /path/to/file/to/convert.gpkg /path/to/file/to/create.gpkg
```

```javascript
var fs = require('fs');
var GeoPackageAPI = require('@ngageoint/geopackage');
var GeoPackageOptimizer = require("@ngageoint/geopackage-mobile-optimizer");

var geoPackageFile = '/path/to/file/to/convert.gpkg';
var outputGeoPackageFile = '/path/to/file/to/create.gpkg';

async.series({
  fileExists: function(callback) {
    fs.stat(geoPackageFile, function(err, stats) {
      if (err || !stats || !stats.isFile()) {
        return callback('File does not exist.');
      }
      return callback(null, true);
    });
  },
  geoPackage: function(callback) {
    GeoPackageAPI.openGeoPackage(geoPackageFile, function(err, result) {
      if (err || !result) {
        return callback('Invalid GeoPackage file.');
      }
      console.log('Processing %s', geoPackageFile);
      callback(null, result);
    });
  },
  outputGeoPackage: function (callback) {
    GeoPackageAPI.createGeoPackage(outputGeoPackageFile, function(err, result) {
      if (err || !result) {
        return callback('Invalid GeoPackage file.');
      }
      console.log('Writing mobile optimized GeoPackage to %s', outputGeoPackageFile);
      callback(null, result);
    });
  }
},
function(err, results) {
  if (err) {
    console.log('Failed to convert with error', err);
    process.exit(1);
  } else {
    GeoPackageOptimizer(results.geoPackage, results.outputGeoPackage, function(err) {
      console.log('Optimization Complete, optimized file: %s', outputGeoPackageFile);
      process.exit(0);
    });
  }
});
GeoPackageOptimizer(results.geoPackage, results.outputGeoPackage, function(err) {
  console.log('Optimization Complete, optimized file: %s', outputGeoPackageFile);
  process.exit(0);
});
```

#### GeoPackage JS Library ####

The [GeoPackage Libraries](http://ngageoint.github.io/GeoPackage/) were developed at the [National Geospatial-Intelligence Agency (NGA)](http://www.nga.mil/) in collaboration with [BIT Systems](http://www.bit-sys.com/). The government has "unlimited rights" and is releasing this software to increase the impact of government investments by providing developers with the opportunity to take things in new directions. The software use, modification, and distribution rights are stipulated within the [MIT license](http://choosealicense.com/licenses/mit/).

### Pull Requests ###
If you'd like to contribute to this project, please make a pull request. We'll review the pull request and discuss the changes. All pull request contributions to this project will be released under the MIT license.

Software source code previously released under an open source license and then modified by NGA staff is considered a "joint work" (see 17 USC § 101); it is partially copyrighted, partially public domain, and as a whole is protected by the copyrights of the non-government authors and must be released according to the terms of the original open source license.


### Changelog

##### 1.0.0

- Initial release.
