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
    kml: string, 
    // geopackage: GeoPackage,
    tableName: string,
  ): void {
    this.streamKML('../KML_Samples.kml', 0);
  }

  streamKML(kml: string, pass: number): void {
    if (pass === 0) {
      const stream = fs.createReadStream(path.join(__dirname, kml));
      const xml = new xmlStream(stream);
      xml.on('endElement: Placemark', function(node) {
        console.log(node);
        console.log(node.hasOwnProperty("LookAt"));
        // FeatureColumn.createColumn(index, prop.name, DataTypes.fromName(prop.type), false, null);
      });
    } else {
      const stream = fs.createReadStream(path.join(__dirname, kml));
      const xml2 = new xmlStream(stream);
    }
  }
}
// const test = new KMLToGeoPackage();
// test.convertKMLToGeoPackage('', '');
