var css = require('./includes.css');

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

window.GeoPackageAPI = require('geopackage');
window.GeoJSONToGeoPackage = require('geojson-to-geopackage');
window.ShapefileToGeoPackage = require('shapefile-to-geopackage');
window.MBTilesToGeoPackage = require('mbtiles-to-geopackage');
window.PBFToGeoPackage = require('pbf-to-geopackage');
