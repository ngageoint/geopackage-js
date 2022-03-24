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
  fs = require('fs'),
  _ = require('lodash');

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
window._ = _;

require('leaflet-mapkey-icon');
require('leaflet-basemaps');

const gp = require('@ngageoint/geopackage/dist/geopackage.min');
gp.setSqljsWasmLocateFile(filename => `/public/${filename}`);
window.GeoPackage = gp;
window.GeoJSONToGeoPackage = require('@ngageoint/geojson-to-geopackage').GeoJSONToGeoPackage;
window.KMLToGeoPackage = require('@ngageoint/kml-to-geopackage').KMLToGeoPackage;
window.ShapefileToGeoPackage = require('@ngageoint/shapefile-to-geopackage').ShapefileToGeoPackage;
window.CSVToGeoPackage = require('@ngageoint/csv-to-geopackage').CSVToGeoPackage;
window.PBFToGeoPackage = require('@ngageoint/pbf-to-geopackage').PBFToGeoPackage;
window.XYZToGeoPackage = require('@ngageoint/xyz-to-geopackage').XYZToGeoPackage;
window.MBTilesToGeoPackage = require('@ngageoint/mbtiles-to-geopackage').MBTilesToGeoPackage;
