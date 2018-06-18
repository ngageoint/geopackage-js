## shapefile-to-geopackage &mdash; Convert Shapefiles to GeoPackage

This package converts Shapefiles and Shapefile zips to layers in a GeoPackage

### Usage

```js
ShapefileToGeoPackage.convert({
  shapefile: path to Shapefile,
  geopackage: path to GeoPackage file
}, function(status, callback) {
  callback();
}, function(err, geopackage) {
  // geopackage now has a feature table with the shapefile data in it
});
```

### Conversion Options

The following options can be passed to addLayer and convert in the options object.  Calling the convert method with a string argument in the options object for geopackage will result in no operation if the file already exists.  In this case you should call the addLayer method which will append to the geopackage file.

| option       | type    |  |
| ------------ | ------- | -------------- |
| `geopackage`     | varies  | This option can either be a string or a GeoPackage object.  If the option is a string it is interpreted as a path to a GeoPackage file.  If that file exists, it is opened.  If it does not exist, a new file is created and opened. |
| `shapezipData`   | Buffer  | Buffer with the data for a zip file containing a shapefile and it's associated files |  
| `shapeData` | Buffer | Buffer with the data for a shapefile (.shp) |
| `shapefile` | String | Interpreted as a path to a .shp or .zip file |
| `dbfData` | String | Only used if the 'shapeData' parameter was provided.  Buffer with the data for a dbf file (.dbf) |

#### GeoPackage JS Library ####

The [GeoPackage Libraries](http://ngageoint.github.io/GeoPackage/) were developed at the [National Geospatial-Intelligence Agency (NGA)](http://www.nga.mil/) in collaboration with [BIT Systems](http://www.bit-sys.com/). The government has "unlimited rights" and is releasing this software to increase the impact of government investments by providing developers with the opportunity to take things in new directions. The software use, modification, and distribution rights are stipulated within the [MIT license](http://choosealicense.com/licenses/mit/).

### Pull Requests ###
If you'd like to contribute to this project, please make a pull request. We'll review the pull request and discuss the changes. All pull request contributions to this project will be released under the MIT license.

Software source code previously released under an open source license and then modified by NGA staff is considered a "joint work" (see 17 USC § 101); it is partially copyrighted, partially public domain, and as a whole is protected by the copyrights of the non-government authors and must be released according to the terms of the original open source license.
