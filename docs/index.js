var css = require('./includes.css');
var Promise = require('promise-polyfill');
if (!window.Promise) {
  window.Promise = Promise;
}
var async = require('async')
  , reproject = require('reproject')
  , L = require('leaflet')
  , $ = require('jquery')
  , proj4 = require('proj4')
  , async = require('async')
  , Mustache = require('mustache')
  , fileType = require('file-type');

window.proj4 = proj4;
window.async = async;
window.$ = $;
window.L = L;
window.fileType = fileType;
window.reproject = reproject;
window.Mustache = Mustache;

require('leaflet-mapkey-icon');
require('leaflet-basemaps');
require('leaflet.vectorgrid/dist/Leaflet.VectorGrid.bundled.js');

window.GeoPackageAPI = require('../lib/api');
//window.GeoPackageAPI = require('@ngageoint/geopackage');
// window.GeoJSONToGeoPackage = require('geojson-to-geopackage');
window.ShapefileToGeoPackage = require('@ngageoint/shapefile-to-geopackage');
// window.MBTilesToGeoPackage = require('mbtiles-to-geopackage');
// window.PBFToGeoPackage = require('pbf-to-geopackage');
