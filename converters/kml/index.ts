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
import bbox from '@turf/bbox';
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
  // KMLToGeoPackageEquiv = {
  //   Point: 'GEOMETRY',
  //   Polygon: 'GEOMETRY',
  //   LineString: 'GEOMETRY',
  //   name: 'TEXT',
  //   description: 'TEXT',

  // };
  boundingBox: BoundingBox;
  constructor(private options?: KMLToGeoPackage) {}

  async convertKMLToGeoPackage(kmlPath: string, geopackage: GeoPackage, tableName: string): Promise<Set<string>> {
    const props = this.getMetaDataKML(kmlPath);
    return this.setupTableKML(kmlPath, await props, geopackage, 'test');
    // return this.properties;
  }

  async setupTableKML(
    kmlPath: string,
    properties: Set<string>,
    geopackage: GeoPackage,
    tableName: string,
  ): Promise<any> {
    return new Promise(async resolve => {
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
        columns.push(FeatureColumn.createColumn(index, prop, DataTypes.fromName('TEXT'), false, null));
        index++;
      }
      await this.createOrOpenGeoPackage(geopackage, { append: true })
        .then(async value => {
          const featureDao = await value.createFeatureTable(
            tableName,
            geometryColumns,
            columns,
            this.boundingBox,
            4326,
          );
          this.addDataToTableKML(kmlPath, value, tableName);
        })
        .catch(e => {
          console.log(e.message);
        });

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
      // console.log(columns);
      resolve('test');
      // const stream = fs.createReadStream(kmlPath);
      // const xml = new xmlStream(stream);
      // xml.on('endElement: Placemark', node => {
      //   console.log(node);
      // });
    });
  }

  addDataToTableKML(kmlPath: string, geopackage: GeoPackage, tableName: string): void {
    const stream = fs.createReadStream(kmlPath);
    const xml = new xmlStream(stream);
    xml.collect('LinearRing');
    xml.on('endElement: Placemark', (node: any) => {
      // console.log(node);
      if (node.hasOwnProperty('Polygon')) {
        const temp = { type: 'Polygon' };
        const coordText = node.Polygon.outerBoundaryIs.LinearRing[0].coordinates;
        const coordRing = coordText.split(' ');
        const coordArray = [];
        coordRing.forEach(element => {
          element = element.split(',');
          coordArray.push([element[0], element[1]]);
        });
        temp['coordinates'] = [coordArray];
        if (node.Polygon.hasOwnProperty('innerBoundaryIs')) {
          // console.log('innerBoundaryIs!!');
          const coordText = node.Polygon.innerBoundaryIs.LinearRing[0].coordinates;
          const coordRing = coordText.split(' ');
          const coordArray = [];
          coordRing.forEach(element => {
            element = element.split(',');
            coordArray.push([element[0], element[1]]);
          });
          temp['coordinates'].push(coordArray);
        }
        // console.log('Polygon!', temp);
      }
    });
  }

  getMetaDataKML(kmlPath: string): Promise<any> {
    return new Promise(resolve => {
      const properties = new Set();
      // Bounding box
      let minLat: number, minLon: number;
      let maxLat: number, maxLon: number;

      const stream = fs.createReadStream(kmlPath);
      const xml = new xmlStream(stream);

      xml.on('endElement: Placemark', (node: any) => {
        for (const property in node) {
          // Item to be treated like a Geometry
          if (
            property === 'Point' ||
            property === 'LineString' ||
            property === 'LineRing' ||
            property === 'Polygon' ||
            property === 'MultiGeomtry' ||
            property === 'Model'
          ) {
          } else {
            properties.add(property);
          }
        }
      });
      xml.on('endElement: Placemark coordinates', (node: { $text: string }) => {
        const rows = node.$text.split(/\s/);
        rows.forEach((element: string) => {
          const temp = element.split(',');
          if (minLat === undefined) minLat = Number(temp[0]);
          if (minLon === undefined) minLon = Number(temp[1]);
          if (maxLat === undefined) maxLat = Number(temp[0]);
          if (maxLon === undefined) maxLon = Number(temp[1]);

          if (Number(temp[0]) < minLat) minLat = Number(temp[0]);
          if (Number(temp[0]) > maxLat) maxLat = Number(temp[0]);
          if (Number(temp[1]) < minLon) minLon = Number(temp[1]);
          if (Number(temp[1]) > maxLon) maxLon = Number(temp[1]);
        });
      });
      xml.on('end', () => {
        this.boundingBox = new BoundingBox(minLat, maxLat, minLon, maxLon);
        resolve(properties);
      });
    });
  }
  async createOrOpenGeoPackage(
    geopackage: GeoPackage | string,
    options: KMLConverterOptions,
    progressCallback?: Function,
  ): Promise<GeoPackage> {
    if (typeof geopackage === 'object') {
      if (progressCallback) await progressCallback({ status: 'Opening GeoPackage' });
      return geopackage;
    } else {
      let stats: fs.Stats;
      try {
        stats = fs.statSync(geopackage);
      } catch (e) {}
      if (stats && !options.append) {
        console.log('GeoPackage file already exists, refusing to overwrite ' + geopackage);
        throw new Error('GeoPackage file already exists, refusing to overwrite ' + geopackage);
      } else if (stats) {
        console.log('open geopackage');
        return GeoPackageAPI.open(geopackage);
      }
      if (progressCallback) await progressCallback({ status: 'Creating GeoPackage' });
      console.log('Create new geopackage', geopackage);
      return GeoPackageAPI.create(geopackage);
    }
  }
}
