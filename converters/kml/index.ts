import {
  GeoPackage,
  GeoPackageAPI,
  FeatureColumn,
  GeometryColumns,
  DataTypes,
  BoundingBox,
} from '@ngageoint/geopackage';
import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import bbox from '@turf/bbox';
// import bbox from '@turf/bbox';

import xmlStream from 'xml-stream';
import { notDeepEqual } from 'assert';
import { FeatureTableStyles } from '@ngageoint/geopackage/built/lib/extension/style/featureTableStyles';
import { resolve } from 'dns';

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
  styleMap: Map<string, object>;
  styleUrlMap: Map<string, number>;
  styleRowMap: Map<number, any>;
  constructor(private options?: KMLToGeoPackage) {
    this.styleMap = new Map();
    this.styleUrlMap = new Map();
    this.styleRowMap = new Map();
  }

  async convertKMLToGeoPackage(kmlPath: string, geopackage: GeoPackage, tableName: string): Promise<Set<string>> {
    const props = this.getMetaDataKML(kmlPath);
    return this.setupTableKML(kmlPath, await props, geopackage, tableName);
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
      const geopkg = await this.createOrOpenGeoPackage(geopackage, { append: true });
      await geopkg.createFeatureTable(tableName, geometryColumns, columns, this.boundingBox, 4326);

      // Boilerplate for creating a style tables (a geopackage extension)
      // Create Default Styles
      const defaultStyles = await this.setUpDefaultStyles(geopkg, tableName);
      console.log(typeof defaultStyles);
      // Specific Styles SetUp
      this.setUpSpecificStyles(defaultStyles);
      // Geometry and Style Insertion
      await this.addKMLDataToGeoPackage(kmlPath, geopkg, defaultStyles, tableName);
      resolve('test');
    });
  }

  private setUpSpecificStyles(defaultStyles: any): any {
    for (const item of this.styleMap) {
      const newStyle = defaultStyles.getStyleDao().newRow();
      if (item[1].hasOwnProperty('LineStyle')) {
        if (item[1]['LineStyle'].hasOwnProperty('color')) {
          const abgr = item[1]['LineStyle']['color'];
          const { rgb, a } = this.abgrStringToColorOpacity(abgr);
          newStyle.setColor(rgb, a);
        }
        if (item[1]['LineStyle'].hasOwnProperty('width')) {
          newStyle.setWidth(item[1]['LineStyle']['width']);
        }
      }

      if (item[1].hasOwnProperty('PolyStyle')) {
        if (item[1]['PolyStyle'].hasOwnProperty('color')) {
          const abgr = item[1]['PolyStyle']['color'];
          const { rgb, a } = this.abgrStringToColorOpacity(abgr);
          newStyle.setFillColor(rgb, a);
        }
        if (item[1]['PolyStyle'].hasOwnProperty('fill')) {
          if (!item[1]['PolyStyle']['fill']) {
            newStyle.setFillOpacity(0);
          }
        }
        if (item[1]['PolyStyle'].hasOwnProperty('outline')) {
          // No property Currently TODO
          // newStyle.(item[1]['LineStyle']['outline']);
        }
      }
      newStyle.setName(item[0]);

      const newStyleId = defaultStyles.getFeatureStyleExtension().getOrInsertStyle(newStyle);
      this.styleUrlMap.set('#' + item[0], newStyleId);
      this.styleRowMap.set(newStyleId, newStyle);
    }
  }

  private async setUpDefaultStyles(geopkg: GeoPackage, tableName: string): Promise<any> {
    const defaultStyles = new FeatureTableStyles(geopkg, tableName);
    await defaultStyles.getFeatureStyleExtension().getOrCreateExtension(tableName);
    await defaultStyles
      .getFeatureStyleExtension()
      .getRelatedTables()
      .getOrCreateExtension();
    await defaultStyles
      .getFeatureStyleExtension()
      .getContentsId()
      .getOrCreateExtension();
    // Tablewide
    await defaultStyles.createTableStyleRelationship();
    await defaultStyles.createTableIconRelationship();
    // Each feature
    await defaultStyles.createStyleRelationship();
    await defaultStyles.createIconRelationship();

    const polygonStyleRow = defaultStyles.getStyleDao().newRow();
    polygonStyleRow.setColor('FF0000', 1.0);
    polygonStyleRow.setFillColor('FF0000', 0.2);
    polygonStyleRow.setWidth(2.0);
    polygonStyleRow.setName('Table Polygon Style');
    defaultStyles.getFeatureStyleExtension().getOrInsertStyle(polygonStyleRow);

    const lineStringStyleRow = defaultStyles.getStyleDao().newRow();
    lineStringStyleRow.setColor('FF0000', 1.0);
    lineStringStyleRow.setWidth(2.0);
    lineStringStyleRow.setName('Table Line Style');
    defaultStyles.getFeatureStyleExtension().getOrInsertStyle(lineStringStyleRow);

    const pointStyleRow = defaultStyles.getStyleDao().newRow();
    pointStyleRow.setColor('FF0000', 1.0);
    pointStyleRow.setWidth(2.0);
    pointStyleRow.setName('Table Point Style');
    defaultStyles.getFeatureStyleExtension().getOrInsertStyle(pointStyleRow);

    await defaultStyles.setTableStyle('Polygon', polygonStyleRow);
    await defaultStyles.setTableStyle('LineString', lineStringStyleRow);
    await defaultStyles.setTableStyle('Point', pointStyleRow);
    await defaultStyles.setTableStyle('MultiPolygon', polygonStyleRow);
    await defaultStyles.setTableStyle('MultiLineString', lineStringStyleRow);
    await defaultStyles.setTableStyle('MultiPoint', pointStyleRow);

    return defaultStyles;
  }

  private abgrStringToColorOpacity(abgr: string): { rgb: string; a: number } {
    const rgb = abgr.slice(6, 8) + abgr.slice(4, 6) + abgr.slice(2, 4);
    const a = parseInt('0x' + abgr.slice(0, 2)) / 255;
    // console.log(abgr, rgb, a);
    return { rgb, a };
  }

  async addKMLDataToGeoPackage(
    kmlPath: string,
    geopackage: GeoPackage,
    defaultStyles,
    tableName: string,
  ): Promise<any> {
    return new Promise(async resolve => {
      const stream = fs.createReadStream(kmlPath);
      const xml = new xmlStream(stream);
      xml.collect('LinearRing');
      xml.collect('Polygon');
      xml.collect('Point');
      xml.collect('LineString');
      xml.on('endElement: Placemark', (node: any) => {
        let isGeom = false;
        let geometryData: any;
        if (node.hasOwnProperty('Polygon')) {
          isGeom = true;
          geometryData = this.handlePolygons(node);
        } else if (node.hasOwnProperty('Point')) {
          isGeom = true;
          geometryData = this.handlePoints(node);
        } else if (node.hasOwnProperty('LineString')) {
          isGeom = true;
          geometryData = this.handleLineStrings(node);
        } else if (node.hasOwnProperty('MultiGeometry')) {
          isGeom = true;
          geometryData = { type: 'GeometryCollection', geometries: [] };
          if (node.MultiGeometry.hasOwnProperty('Point')) {
            const temp = this.handlePoints(node.MultiGeometry);
            geometryData['geometries'].push(temp);
          }
          if (node.MultiGeometry.hasOwnProperty('LineString')) {
            const temp = this.handleLineStrings(node.MultiGeometry);
            geometryData['geometries'].push(temp);
          }
          if (node.MultiGeometry.hasOwnProperty('Polygon')) {
            const temp = this.handlePolygons(node.MultiGeometry);
            geometryData['geometries'].push(temp);
          }
        }
        const props = {};
        for (const prop in node) {
          if (prop === 'styleUrl') {
            try {
              const styleId = this.styleUrlMap.get(node[prop]);
              const styleRow = this.styleRowMap.get(styleId);
              if (isGeom && styleId && styleRow) {
                defaultStyles.setStyle(this.styleUrlMap.get(node[prop]), geometryData.type, styleRow);
              }
            } catch (error) {
              console.error(error);
            }
          }
          if (prop === 'Style') {
            // TODO
            console.error(prop);
          }
          if (typeof node[prop] === 'string') {
            props[prop] = node[prop];
          } else if (typeof node[prop] === 'object') {
            props[prop] = JSON.stringify(node[prop]);
          } else if (typeof node[prop] === 'number') {
            props[prop] = node[prop];
          }
        }
        const feature: any = {
          type: 'Feature',
          geometry: geometryData,
          properties: props,
        };
        if (isGeom) geopackage.addGeoJSONFeatureToGeoPackage(feature, tableName);
      });
      xml.on('end', async (node: any) => {
        const featureDao = geopackage.getFeatureDao(tableName);
        const fti = featureDao.featureTableIndex;
        if (fti) {
          await fti.index();
          // if (!_.isNil(fti.tableIndex)) {
          //   console.log('start indexing');
          //   console.log("End");
          // }
        }
        resolve();
      });
    });
  }

  private handleLineStrings(node: any): { type: string; coordinates: number[] } {
    let geometryData;
    if (node.LineString.length === 1) {
      geometryData = { type: 'LineString', coordinates: [] };
    } else {
      geometryData = { type: 'MultiLineString', coordinates: [] };
    }
    node.LineString.forEach(element => {
      const coordPoints = element.coordinates.split(' ');
      const coordArray = [];
      coordPoints.forEach(element => {
        element = element.split(',');
        coordArray.push([Number(element[0]), Number(element[1])]);
      });
      if (node.LineString.length === 1) {
        geometryData['coordinates'] = coordArray;
      } else {
        geometryData['coordinates'].push(coordArray);
      }
    });
    return geometryData;
  }

  private handlePoints(node: any): { type: string; coordinates: number[] } {
    let geometryData;
    if (node.Point.length === 1) {
      geometryData = { type: 'Point', coordinates: [] };
    } else {
      geometryData = { type: 'MultiPoint', coordinates: [] };
    }
    node.Point.forEach(point => {
      const coordPoint = point.coordinates.split(',');
      const coord = [parseFloat(coordPoint[0]), parseFloat(coordPoint[1])];
      if (node.Point.length === 1) {
        geometryData['coordinates'] = [parseFloat(coordPoint[0]), parseFloat(coordPoint[1])];
      } else {
        geometryData['coordinates'].push(coord);
      }
    });
    return geometryData;
  }

  private handlePolygons(node: any): { type: string; coordinates: number[] } {
    let geometryData;
    if (node.Polygon.length === 1) {
      geometryData = { type: 'Polygon', coordinates: [] };
    } else {
      geometryData = { type: 'MultiPolygon', coordinates: [] };
    }
    // console.log(typeof node.Polygon);
    // console.log(node.Polygon[0]);
    node.Polygon.forEach(element => {
      const coordText = element.outerBoundaryIs.LinearRing[0].coordinates;
      // console.log(coordText);
      const coordRing = coordText.split(' ');
      const coordArray = [];
      coordRing.forEach(element => {
        element = element.split(',');
        coordArray.push([parseFloat(element[0]), parseFloat(element[1])]);
      });
      const temp = [coordArray];
      // console.log(coordArray);
      if (node.Polygon.hasOwnProperty('innerBoundaryIs')) {
        const coordText = element.innerBoundaryIs.LinearRing[0].coordinates;
        const coordRing = coordText.split(' ');
        const coordArray = [];
        coordRing.forEach(elementRing => {
          elementRing = elementRing.split(',');
          coordArray.push([parseFloat(elementRing[0]), parseFloat(elementRing[1])]);
        });
        temp.push(coordArray);
      }
      // console.log(temp);
      if (node.Polygon.length === 1) {
        geometryData['coordinates'] = temp;
      } else {
        geometryData['coordinates'].push(temp);
      }
    });
    // console.log(geometryData);
    return geometryData;
  }

  getMetaDataKML(kmlPath: string): Promise<any> {
    return new Promise(resolve => {
      const properties = new Set();
      // Bounding box
      let minLat: number, minLon: number;
      let maxLat: number, maxLon: number;

      const stream = fs.createReadStream(kmlPath);
      const xml = new xmlStream(stream);
      xml.collect('Pair');
      xml.on('endElement: Placemark', (node: any) => {
        for (const property in node) {
          // Item to be treated like a Geometry
          if (
            property === 'Point' ||
            property === 'LineString' ||
            property === 'Polygon' ||
            property === 'MultiGeomtry' ||
            property === 'Model'
          ) {
          } else if (property === 'Style') {
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
      xml.on('endElement: Document>Style', (node: any) => {
        // console.log(node['$'].id);
        if (node['$']) {
          this.styleMap.set(node['$'].id, node);
        }
      });
      // TODO
      // xml.on('endElement: Document>StyleMap', (node: any) => {
      //   console.log(node);
      //   if (node.Pair[0].key === 'normal') {

      //   }
      //   if (node['$']) {
      //     this.styleMap.set(node['$'].id, node);
      //   }
      // });
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
