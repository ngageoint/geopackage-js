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
  , fileType = require('file-type')
  , FileSaver = require('file-saver');

window.proj4 = proj4;
window.async = async;
window.$ = $;
window.L = L;
window.fileType = fileType;
window.reproject = reproject;
window.Mustache = Mustache;
window.FileSaver = FileSaver;

require('leaflet-mapkey-icon');
require('leaflet-basemaps');

var gp = require('@ngageoint/geopackage');
console.log('gp is', gp);
window.GeoPackage = gp;
window.GeoPackageAPI = gp.GeoPackage;
// window.GeoJSONToGeoPackage = require('@ngageoint/geojson-to-geopackage');
// window.ShapefileToGeoPackage = require('@ngageoint/shapefile-to-geopackage');
// window.MBTilesToGeoPackage = require('mbtiles-to-geopackage');
// window.PBFToGeoPackage = require('pbf-to-geopackage');
