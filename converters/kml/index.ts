import {
  BoundingBox,
  DataTypes,
  FeatureColumn,
  GeometryColumns,
  GeoPackage,
  GeoPackageAPI,
} from '@ngageoint/geopackage';
import { FeatureTableStyles } from '@ngageoint/geopackage/built/lib/extension/style/featureTableStyles';
import { StyleRow } from '@ngageoint/geopackage/built/lib/extension/style/styleRow';
import fs from 'fs';
import _ from 'lodash';
import xmlStream from 'xml-stream';
import * as KMLTAGS from './KMLTags.js';

export interface KMLConverterOptions {
  kmlPath?: string;
  append?: boolean;
  geoPackage?: GeoPackage | string;
  srsNumber?: number | 4326;
  tableName?: string;
  indexTable?: boolean;
}
/**
 * Convert KML file to GeoPackages.
 */
export class KMLToGeoPackage {
  private options?: KMLConverterOptions;
  boundingBox: BoundingBox;
  styleMap: Map<string, object>;
  styleUrlMap: Map<string, number>;
  styleRowMap: Map<number, any>;
  constructor(private optionsUser: KMLConverterOptions = {}) {
    this.options = optionsUser;
    this.styleMap = new Map();
    this.styleUrlMap = new Map();
    this.styleRowMap = new Map();
  }

  /**
   * Takes a KML file and does a 2 pass method to exact the features and styles and inserts those item properly into a geopackage.
   * @param kmlPath Path to KML file
   * @param geopackage String or name of Geopackage to use
   * @param tableName Name of table with geometry
   */
  async convertKMLToGeoPackage(kmlPath: string, geopackage: GeoPackage, tableName: string): Promise<GeoPackage> {
    const props = await this.getMetaDataKML(kmlPath);

    const geopkg = await this.setUpTableKML(kmlPath, props, geopackage, tableName);

    const defualtStyles = await this.setUpStyleKML(kmlPath, geopkg, tableName);

    // Geometry and Style Insertion
    await this.addKMLDataToGeoPackage(kmlPath, geopkg, defualtStyles, tableName);
    if (this.options.indexTable) {
      await this.indexTable(geopackage, tableName);
    }
    return geopackage;
  }

  /**
   * Takes in KML and the properties of the KML and creates a table in the geopackage floder.
   * @param kmlPath file directory path to the KML file to be converted
   * @param properties columns name gotten from getMetaDataKML
   * @param geopackage file name or Geopackage object
   * @param tableName name the Database table will be called
   * @returns Promise<GeoPackage>
   */
  async setUpTableKML(
    kmlPath: string,
    properties: Set<string>,
    geopackage: GeoPackage,
    tableName: string,
  ): Promise<GeoPackage> {
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
      await geopkg.createFeatureTable(
        tableName,
        geometryColumns,
        columns,
        this.boundingBox,
        this.options.hasOwnProperty('srsNumber') ? this.options.srsNumber : 4326,
      );

      resolve(geopkg);
    });
  }

  /**
   * Inserts style information from the KML in the GeoPackage.
   * @param kmlPath Path to file
   * @param geopkg Geopackage Object
   * @param tableName Name of Main Table
   */
  setUpStyleKML(kmlPath: string, geopkg: GeoPackage, tableName: string): Promise<FeatureTableStyles> {
    return new Promise(async resolve => {
      // Boilerplate for creating a style tables (a geopackage extension)
      // Create Default Styles
      const defaultStyles = await this.setUpDefaultStyles(geopkg, tableName);
      // Specific Styles SetUp
      this.setUpSpecificStyles(defaultStyles, this.styleMap);

      resolve(defaultStyles);
    });
  }

  /**
   * Reads the KML file and extracts Geomertic data and matches styles with the Geometric data.
   * @param kmlPath Path to KML file
   * @param geopackage GeoPackage Object
   * @param defaultStyles Feature Style Object
   * @param tableName Name of Main table for Geometry
   */
  async addKMLDataToGeoPackage(
    kmlPath: string,
    geopackage: GeoPackage,
    defaultStyles: FeatureTableStyles,
    tableName: string,
  ): Promise<void> {
    return new Promise(async resolve => {
      const stream = fs.createReadStream(kmlPath);
      const kml = new xmlStream(stream);
      kml.collect('LinearRing');
      kml.collect('Polygon');
      kml.collect('Point');
      kml.collect('LineString');

      // Think about spliting up in kml.on
      kml.on('endElement: ' + KMLTAGS.PLACEMARK_TAG, node => {
        let isGeom = false;
        let geometryData;
        if (node.hasOwnProperty(KMLTAGS.GEOMETRY_TAGS.POLYGON)) {
          isGeom = true;
          geometryData = this.handlePolygons(node);
        } else if (node.hasOwnProperty(KMLTAGS.GEOMETRY_TAGS.POINT)) {
          isGeom = true;
          geometryData = this.handlePoints(node);
        } else if (node.hasOwnProperty(KMLTAGS.GEOMETRY_TAGS.LINESTRING)) {
          isGeom = true;
          geometryData = this.handleLineStrings(node);
        } else if (node.hasOwnProperty(KMLTAGS.GEOMETRY_TAGS.MULTIGEOMETRY)) {
          isGeom = true;
          geometryData = { type: 'GeometryCollection', geometries: [] };
          if (node.MultiGeometry.hasOwnProperty(KMLTAGS.GEOMETRY_TAGS.POINT)) {
            const temp = this.handlePoints(node.MultiGeometry);
            geometryData['geometries'].push(temp);
          }
          if (node.MultiGeometry.hasOwnProperty(KMLTAGS.GEOMETRY_TAGS.LINESTRING)) {
            const temp = this.handleLineStrings(node.MultiGeometry);
            geometryData['geometries'].push(temp);
          }
          if (node.MultiGeometry.hasOwnProperty(KMLTAGS.GEOMETRY_TAGS.POLYGON)) {
            const temp = this.handlePolygons(node.MultiGeometry);
            geometryData['geometries'].push(temp);
          }
        }
        const props = {};
        let styleRow: StyleRow;
        for (const prop in node) {
          if (prop === KMLTAGS.STYLE_URL_TAG) {
            try {
              const styleId = this.styleUrlMap.get(node[prop]);
              styleRow = this.styleRowMap.get(styleId);
            } catch (error) {
              console.error(error);
            }
          }

          if (prop === KMLTAGS.STYLE_TAG) {
            const tempMap = new Map<string, object>();
            tempMap.set(node.Style['$'].id, node.Style);
            this.setUpSpecificStyles(defaultStyles, tempMap);

            const styleId = this.styleUrlMap.get('#' + node.Style['$'].id);
            styleRow = this.styleRowMap.get(styleId);
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
        let featureID: number;
        if (isGeom) {
          featureID = geopackage.addGeoJSONFeatureToGeoPackage(feature, tableName);
          if (!_.isNil(styleRow)) {
            defaultStyles.setStyle(featureID, geometryData.type, styleRow);
          }
        }
      });
      kml.on('end', async () => {
        resolve();
      });
    });
  }

  /**
   * Runs through KML and finds name for Columns and Style information
   * @param kmlPath Path to KML file
   */
  getMetaDataKML(kmlPath: string): Promise<Set<string>> {
    return new Promise(resolve => {
      const properties = new Set<string>();
      // Bounding box
      let minLat: number, minLon: number;
      let maxLat: number, maxLon: number;

      const stream = fs.createReadStream(kmlPath);
      const kml = new xmlStream(stream);
      kml.collect('Pair');
      kml.on('endElement: ' + KMLTAGS.PLACEMARK_TAG, (node: {}) => {
        for (const property in node) {
          // TODO:
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
      kml.on('endElement: ' + KMLTAGS.PLACEMARK_TAG + ' ' + KMLTAGS.COORDINATES_TAG, (node: { $text: string }) => {
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
      kml.on('endElement: ' + KMLTAGS.DOCUMENT_TAG + '>' + KMLTAGS.STYLE_TAG, (node: {}) => {
        if (node['$']) {
          this.styleMap.set(node['$'].id, node);
        }
      });
      // TODO
      // kml.on('endElement: Document>StyleMap', (node: any) => {
      //   console.log(node);
      //   if (node.Pair[0].key === 'normal') {

      //   }
      //   if (node['$']) {
      //     this.styleMap.set(node['$'].id, node);
      //   }
      // });
      kml.on('end', () => {
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

  /*
   * Private Methods
   * */

  private async indexTable(geopackage: GeoPackage, tableName: string): Promise<void> {
    const featureDao = geopackage.getFeatureDao(tableName);
    const fti = featureDao.featureTableIndex;
    if (fti) {
      await fti.index();
      // if (!_.isNil(fti.tableIndex)) {
      //   console.log('start indexing');
      //   console.log("End");
      // }
    }
  }
  private setUpSpecificStyles(defaultStyles: FeatureTableStyles, items: Map<string, object>): void {
    for (const item of items) {
      const newStyle = defaultStyles.getStyleDao().newRow();
      newStyle.setName(item[0]);
      if (item[1].hasOwnProperty(KMLTAGS.STYLE_TYPES.LINE_STYLE)) {
        if (item[1][KMLTAGS.STYLE_TYPES.LINE_STYLE].hasOwnProperty('color')) {
          const abgr = item[1][KMLTAGS.STYLE_TYPES.LINE_STYLE]['color'];
          const { rgb, a } = this.abgrStringToColorOpacity(abgr);
          newStyle.setColor(rgb, a);
        }
        if (item[1][KMLTAGS.STYLE_TYPES.LINE_STYLE].hasOwnProperty('width')) {
          newStyle.setWidth(item[1][KMLTAGS.STYLE_TYPES.LINE_STYLE]['width']);
        }
      }

      if (item[1].hasOwnProperty(KMLTAGS.STYLE_TYPES.POLY_STYLE)) {
        if (item[1][KMLTAGS.STYLE_TYPES.POLY_STYLE].hasOwnProperty('color')) {
          const abgr = item[1][KMLTAGS.STYLE_TYPES.POLY_STYLE]['color'];
          const { rgb, a } = this.abgrStringToColorOpacity(abgr);
          newStyle.setFillColor(rgb, a);
        }
        if (item[1][KMLTAGS.STYLE_TYPES.POLY_STYLE].hasOwnProperty('fill')) {
          if (!item[1][KMLTAGS.STYLE_TYPES.POLY_STYLE]['fill']) {
            newStyle.setFillOpacity(0);
          }
        }
        if (item[1][KMLTAGS.STYLE_TYPES.POLY_STYLE].hasOwnProperty('outline')) {
          // No property Currently TODO
          // newStyle.(item[1]['LineStyle']['outline']);
        }
      }

      const newStyleId = defaultStyles.getFeatureStyleExtension().getOrInsertStyle(newStyle);
      this.styleUrlMap.set('#' + item[0], newStyleId);
      this.styleRowMap.set(newStyleId, newStyle);
    }
  }

  private async setUpDefaultStyles(geopkg: GeoPackage, tableName: string): Promise<FeatureTableStyles> {
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
  /**
   * Converts the KML Color format into rgb 000000 - FFFFFF and opacity 0.0 - 1.0
   * @param abgr KML Color format aabbggrr alpha (00-FF) blue (00-FF) green (00-FF) red (00-FF)
   */
  private abgrStringToColorOpacity(abgr: string): { rgb: string; a: number } {
    const rgb = abgr.slice(6, 8) + abgr.slice(4, 6) + abgr.slice(2, 4);
    const a = parseInt('0x' + abgr.slice(0, 2)) / 255;
    return { rgb, a };
  }

  private handlePoints(node: { Point }): { type: string; coordinates: number[] } {
    let geometryData;
    if (node[KMLTAGS.GEOMETRY_TAGS.POINT].length === 1) {
      geometryData = { type: 'Point', coordinates: [] };
    } else {
      geometryData = { type: 'MultiPoint', coordinates: [] };
    }
    node[KMLTAGS.GEOMETRY_TAGS.POINT].forEach(point => {
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

  private handleLineStrings(node: { LineString }): { type: string; coordinates: number[] } {
    let geometryData;
    if (node[KMLTAGS.GEOMETRY_TAGS.LINESTRING].length === 1) {
      geometryData = { type: 'LineString', coordinates: [] };
    } else {
      geometryData = { type: 'MultiLineString', coordinates: [] };
    }
    node[KMLTAGS.GEOMETRY_TAGS.LINESTRING].forEach(element => {
      const coordPoints = element.coordinates.split(' ');
      const coordArray = [];
      coordPoints.forEach(element => {
        element = element.split(',');
        coordArray.push([Number(element[0]), Number(element[1])]);
      });
      if (node[KMLTAGS.GEOMETRY_TAGS.LINESTRING].length === 1) {
        geometryData['coordinates'] = coordArray;
      } else {
        geometryData['coordinates'].push(coordArray);
      }
    });
    return geometryData;
  }

  private handlePolygons(node: { Polygon }): { type: string; coordinates: number[] } {
    let geometryData;
    if ([KMLTAGS.GEOMETRY_TAGS.POLYGON].length === 1) {
      geometryData = { type: 'Polygon', coordinates: [] };
    } else {
      geometryData = { type: 'MultiPolygon', coordinates: [] };
    }
    node[KMLTAGS.GEOMETRY_TAGS.POLYGON].forEach(element => {
      const coordText = element.outerBoundaryIs.LinearRing[0].coordinates;
      const coordRing = coordText.split(' ');
      const coordArray = [];
      coordRing.forEach(element => {
        element = element.split(',');
        coordArray.push([parseFloat(element[0]), parseFloat(element[1])]);
      });

      const temp = [coordArray];
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

      if (node[KMLTAGS.GEOMETRY_TAGS.POLYGON].length === 1) {
        geometryData['coordinates'] = temp;
      } else {
        geometryData['coordinates'].push(temp);
      }
    });
    return geometryData;
  }
}
