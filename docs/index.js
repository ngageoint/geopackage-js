const css = require('./includes.css');
const Promise = require('promise-polyfill');
if (!window.Promise) {
  window.Promise = Promise;
}
const async = require('async'),
  reproject = require('reproject'),
  L = require('leaflet'),
  $ = require('jquery'),
  proj4 = require('proj4'),
  Mustache = require('mustache'),
  fileType = require('file-type'),
  FileSaver = require('file-saver'),
  path = require('path'),
  fs = require('fs');

window.proj4 = proj4;
window.async = async;
window.$ = $;
window.L = L;
window.fileType = fileType;
window.reproject = reproject;
window.Mustache = Mustache;
window.FileSaver = FileSaver;
window.path = path;
window.fs = fs;

require('leaflet-mapkey-icon');
require('leaflet-basemaps');

const gp = require('@ngageoint/geopackage');
console.log('gp is', gp);
window.GeoPackage = gp;
window.GeoJSONToGeoPackage = require('@ngageoint/geojson-to-geopackage').GeoJSONToGeoPackage;
window.KMLToGeoPackage = require('@ngageoint/kml-to-geopackage').KMLToGeoPackage;
