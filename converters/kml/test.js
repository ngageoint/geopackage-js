// import  {
//   GeoPackage,
//   GeoPackageAPI,
//   FeatureColumn,
//   GeometryColumns,
//   DataTypes,
//   BoundingBox,
// } from '@ngageoint/geopackage';
const GeoPackage = require('@ngageoint/geopackage');
const KMLToGeoPackage = require('./built/index.js').KMLToGeoPackage;
const path = require('path');

const test = new KMLToGeoPackage();
// let tempGeo = new GeoPackage.GeoPackage();
// let kmlPath = path.join(__dirname, 'KML_Samples.kml');
// test.convertKMLToGeoPackage(kmlPath, './temp.gpkg', 'sample')

let kmlPath = path.join(__dirname, 'nepal.kmz');
test.convertKMZToGeoPackage(kmlPath, './temp.gpkg', 'nepal');
