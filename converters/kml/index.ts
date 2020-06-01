import {
  GeoPackage,
  GeoPackageAPI,
  FeatureColumn,
  GeometryColumns,
  DataTypes,
  BoundingBox,
} from '@ngageoint/geopackage';
const fs = require('fs');
const path = require('path');
// import bbox from '@turf/bbox';

const xmlStream = require('xml-stream');

export interface KMLConverterOptions {
  append?: boolean;
  geoPackage?: GeoPackage | string;
  srsNumber?: number;
  tableName?: string;
  geoJson?: any;
}

export class KMLToGeoPackage {
  constructor(private options?: KMLToGeoPackage) {}

  convertKMLToGeoPackage(
    kmlPath: string, 
    // geopackage: GeoPackage,
    tableName: string,
  ): void {
    this.streamKML(kmlPath, 0);
  }

  streamKML(kmlPath: string, pass: number): void {
    if (pass === 0) {
      const stream = fs.createReadStream(kmlPath);
      const xml = new xmlStream(stream);
      xml.on('endElement: Placemark', function(node) {
        console.log(node);
        console.log(node.hasOwnProperty("LookAt"));
        // FeatureColumn.createColumn(index, prop.name, DataTypes.fromName(prop.type), false, null);
      });
    } else {
      const stream = fs.createReadStream(path.join(__dirname, kmlPath));
      const xml2 = new xmlStream(stream);
    }
  }
}
// const test = new KMLToGeoPackage();
// test.convertKMLToGeoPackage('', '');
