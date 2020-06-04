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
const kmlPath = path.join(__dirname, 'KML_Samples.kml');
test
  .convertKMLToGeoPackage(kmlPath, './temp.gpkg', 'nepal')
  .then(value => {
    console.log('Returned ', value);
    console.log('Test', test.boundingBox);
  })
  .catch(e => {
    console.log('Error', e.message);
  });
console.log('Before');
