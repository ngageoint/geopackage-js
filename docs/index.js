const css = require('./includes.css');
const Promise = require('promise-polyfill');
if (!window.Promise) {
  window.Promise = Promise;
}
var async = require('async'),
  reproject = require('reproject'),
  L = require('leaflet'),
  $ = require('jquery'),
  proj4 = require('proj4'),
  async = require('async'),
  Mustache = require('mustache'),
  fileType = require('file-type'),
  FileSaver = require('file-saver');

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

const gp = require('@ngageoint/geopackage');
console.log('gp is', gp);
window.GeoPackage = gp;
window.GeoJSONToGeoPackage = require('@ngageoint/geojson-to-geopackage').GeoJSONToGeoPackage;
