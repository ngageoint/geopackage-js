import {
  GeoPackage,
  GeoPackageAPI,
  FeatureColumn,
  GeometryColumns,
  DataTypes,
  BoundingBox,
} from '@ngageoint/geopackage';
import fs from 'fs';
import path from 'path';
// import bbox from '@turf/bbox';

import xmlStream from 'xml-stream';

export interface KMLConverterOptions {
  append?: boolean;
  geoPackage?: GeoPackage | string;
  srsNumber?: number;
  tableName?: string;
  geoJson?: any;
}

export class KMLToGeoPackage {
  constructor(private options?: KMLToGeoPackage) {}

  async convertKMLToGeoPackage(
    kmlPath: string,
    // geopackage: GeoPackage,
    tableName: string,
  ): Promise<Set<string>> {
    const props = this.getAllPropertiesKML(kmlPath);
    return this.addToTable(kmlPath, await props, 'test');
    // return this.properties;
  }

  addToTable(kmlPath: string, properties: Set<string>, tableName: string): Promise<any>{
    return new Promise(resolve => {
      const geometryColumns = new GeometryColumns();
      geometryColumns.table_name = tableName;
      geometryColumns.column_name = 'geometry';
      geometryColumns.geometry_type_name = 'GEOMETRY';
      geometryColumns.z = 2;
      geometryColumns.m = 2;

      const columns = [];
      columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
      columns.push(FeatureColumn.createGeometryColumn(1, 'geometry', 'GEOMETRY', false, null));
      let index = 2;

      for (const prop of properties) {
        columns.push(FeatureColumn.createColumn(index, prop, DataTypes.fromName('string'), false, null));
        index++;
      }
      // for (const key in properties) {
      //   const prop = properties[key];
      //   if (prop.name.toLowerCase() !== 'id') {
      //     columns.push(FeatureColumn.createColumn(index, prop.name, DataTypes.fromName(prop.type), false, null));
      //     index++;
      //   } else {
      //     columns.push(
      //       FeatureColumn.createColumn(index, '_properties_' + prop.name, DataTypes.fromName(prop.type), false, null),
      //     );
      //     index++;
      //   }
      // }
      console.log(columns);
      // const stream = fs.createReadStream(kmlPath);
      // const xml = new xmlStream(stream);
      // xml.on('endElement: Placemark', node => {
      //   console.log(node);
      // });
    });
  }

  getAllPropertiesKML(kmlPath: string): Promise<any> {
    return new Promise(resolve => {
      const properties = new Set();
      const stream = fs.createReadStream(kmlPath);
      const xml = new xmlStream(stream);

      xml.on('endElement: Placemark', node => {
        // console.log(node);
        // console.log(node.hasOwnProperty('LookAt'));
        // FeatureColumn.createColumn(index, prop.name, DataTypes.fromName(prop.type), false, null);
        for (const property in node) {
          properties.add(property);
        }
      });
      xml.on('end', () => {
        console.log('End ', properties);
        resolve(properties);
      });
    });
  }
}
// const test = new KMLToGeoPackage();
// test.convertKMLToGeoPackage('', '');
