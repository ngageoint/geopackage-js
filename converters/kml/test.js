// import {
//   GeoPackage,
//   GeoPackageAPI,
//   FeatureColumn,
//   GeometryColumns,
//   DataTypes,
//   BoundingBox,
// } from '@ngageoint/geopackage';

const KMLToGeoPackage = require('./built/index.js').KMLToGeoPackage;
const path = require('path');
const fs = require('fs');
const xmlStream = require('xml-stream');

KMLToGeoPackage.prototype.convertKMLToGeoPackage('', '');
// stream = fs.createReadStream(path.join(__dirname, 'KML_Samples.kml'));
// const xml = new xmlStream(stream);
// const converter = new GeoJSONToGeoPackage();

// xml.on('endElement: Placemark', function(node) {
//   console.log(node);
//   console.log(node.hasOwnProperty("LookAt"));
//   const geometryColumns = new GeometryColumns();
//   if (node.hasOwnProperty('name')) {
//     geometryColumns.table_name = node.hasOwnProperty('name');
//   }
//   geometryColumns.column_name = 'geometry';
//   geometryColumns.geometry_type_name = 'GEOMETRY';
//   geometryColumns.z = 2;
//   geometryColumns.m = 2;

//   // FeatureColumn.createColumn(index, prop.name, DataTypes.fromName(prop.type), false, null);
// });
// xml.on('endElement: Folder LookAt', function(node2) {
//   console.log(node2);
// });
// return converter
// .convert({ geoJson: path.join(__dirname, 'test', 'fixtures', 'ne_10m_land.geojson'), geoPackage: 'test.gpkg' })
// .then(function(geopackage) {
//   console.log('completed');
// });
