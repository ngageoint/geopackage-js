import {
  BoundingBox,
  DataTypes,
  FeatureColumn,
  GeometryColumns,
  GeoPackage,
  GeoPackageAPI,
  TileScaling,
  TileScalingType,
} from '@ngageoint/geopackage';
import { FeatureTableStyles } from '@ngageoint/geopackage/built/lib/extension/style/featureTableStyles';
import { StyleRow } from '@ngageoint/geopackage/built/lib/extension/style/styleRow';
import fs from 'fs';
import _ from 'lodash';
import xmlStream from 'xml-stream';
import * as KMLTAGS from './KMLTags.js';
import { KMLUtilities } from './kmlUtilities';

import JSZip from 'jszip';
import mkdirp from 'mkdirp';
import path from 'path';
import { imageSize } from 'image-size';
import { IconRow } from '@ngageoint/geopackage/built/lib/extension/style/iconRow';
import { loadImage } from 'canvas';
import Jimp from 'jimp';

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
  styleRowMap: Map<number, StyleRow>;
  styleMapPair: Map<string, string>;
  iconMap: Map<string, object>;
  iconUrlMap: Map<string, number>;
  iconRowMap: Map<number, IconRow>;
  iconMapPair: Map<string, string>;
  constructor(private optionsUser: KMLConverterOptions = {}) {
    this.options = optionsUser;
    // Icon and Style Map are used to help fill out cross reference tables in the Geopackage Database
    this.styleMapPair = new Map();
    this.styleMap = new Map();
    this.styleUrlMap = new Map();
    this.styleRowMap = new Map();
    this.iconMap = new Map();
    this.iconUrlMap = new Map();
    this.iconRowMap = new Map();
    this.iconMapPair = new Map();
  }

  /**
   * Unzips and stores data from a KMZ file in the current directory.
   * @param kmzPath Path to the KMZ file (Which the zipped version of a KML)
   * @param geopackage  String or name of Geopackage to use
   * @param tableName  Name of the main Geometry Table
   */
  async convertKMZToGeoPackage(kmzPath: string, geopackage: GeoPackage, tableName: string): Promise<any> {
    const dataPath = fs.readFileSync(kmzPath);
    const zip = await JSZip.loadAsync(dataPath);
    let kmlPath: string;
    let gp: GeoPackage;
    await new Promise(async resolve => {
      for (const key in zip.files) {
        await new Promise(async resolve => {
          if (zip.files.hasOwnProperty(key)) {
            const fileDestination = __dirname + '/' + key;
            kmlPath = zip.files[key].name.endsWith('.kml') ? zip.files[key].name : kmlPath;
            await mkdirp(path.dirname(fileDestination), function(err) {
              if (err) console.error(err);
              zip
                .file(key)
                .nodeStream()
                .pipe(
                  fs.createWriteStream(fileDestination, {
                    flags: 'w',
                  }),
                )
                .on('finish', () => {
                  console.log(key, 'was written to', __dirname + '/' + key);
                  resolve();
                });
            });
          }
        });
      }
      resolve();
    }).then(async () => {
      gp = await this.convertKMLToGeoPackage(kmlPath, geopackage, tableName);
      //if no kml
    });
    // clean up stuff
    return gp;
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
    const defaultStyles = await this.setUpStyleKML(kmlPath, geopkg, tableName);

    // Geometry and Style Insertion
    await this.addKMLDataToGeoPackage(kmlPath, geopkg, defaultStyles, tableName);

    if (this.options.indexTable) {
      await this.indexTable(geopackage, tableName);
    }
    return geopackage;
  }

  /**
   * Takes in KML and the properties of the KML and creates a table in the geopackage floder.
   * @param kmlPath file directory path to the KML file to be converted
   * @param properties columns name gotten from getMetaDataKML
   * @param geopackage file name or GeoPackage object
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
   * @param geopkg GeoPackage Object
   * @param tableName Name of Main Table
   */
  setUpStyleKML(kmlPath: string, geopkg: GeoPackage, tableName: string): Promise<FeatureTableStyles> {
    return new Promise(async resolve => {
      // Boilerplate for creating a style tables (a geopackage extension)
      // Create Default Styles
      const defaultStyles = await this.setUpDefaultStyles(geopkg, tableName);
      // Specific Styles SetUp
      this.addSpecificStyles(defaultStyles, this.styleMap);
      await this.addSpecificIcons(defaultStyles, this.iconMap);
      resolve(defaultStyles);
    });
  }

  /**
   * Reads the KML file and extracts Geometric data and matches styles with the Geometric data.
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
      kml.on('endElement: ' + KMLTAGS.GROUND_OVERLAY_TAG, async node => {
        let kmlBBox = new BoundingBox(
          parseFloat(node.LatLonBox.west),
          parseFloat(node.LatLonBox.east),
          parseFloat(node.LatLonBox.south),
          parseFloat(node.LatLonBox.north),
        );

        let rotation = 0;
        if (node.LatLonBox.hasOwnProperty('rotation')) {
          rotation = parseFloat(node.LatLonBox.rotation);
          kmlBBox = KMLUtilities.getKmlBBoxRotation(kmlBBox, rotation);
          // console.log('Should have rotated', kmlBBox, 'by', parseFloat(node.LatLonBox.rotation), 'and is now', temp);
          // kmlBBox = temp;
        }

        const matrixSetBounds = new BoundingBox(
          -20037508.342789244,
          20037508.342789244,
          -20037508.342789244,
          20037508.342789244,
        );

        const contentsSrsId = 4326;
        const tileMatrixSetSrsId = 3857;
        geopackage.createStandardWebMercatorTileTable(
          node.name,
          kmlBBox,
          contentsSrsId,
          matrixSetBounds,
          tileMatrixSetSrsId,
          0,
          20,
        );

        const tileScalingExt = geopackage.getTileScalingExtension(node.name);
        await tileScalingExt.getOrCreateExtension();
        const ts = new TileScaling();
        ts.scaling_type = TileScalingType.IN_OUT;
        ts.zoom_in = 2;
        ts.zoom_out = 2;
        tileScalingExt.createOrUpdate(ts);

        const imageLocation = node.Icon.href.startsWith('http') ? node.Icon.href : __dirname + '/' + node.Icon.href;
        const img = await Jimp.read(imageLocation);
        img.rotate(rotation);
        await loadImage(await img.getBufferAsync(Jimp.MIME_PNG)).then(
          image => {
            const naturalScale = KMLUtilities.getNaturalScale(kmlBBox, image);
            const zoomLevels = _.range(naturalScale % 2 ? 1 : 0, naturalScale + 2, 2);
            console.log('Creating Zoom Levels: ', zoomLevels);
            const imageBuffers = KMLUtilities.getZoomImages(image, zoomLevels, kmlBBox);
            imageBuffers.then(buffers => {
              console.log('Adding zoom tile to DataBase');
              for (const key in buffers) {
                if (buffers.hasOwnProperty(key)) {
                  const zxy = key.split(',');
                  geopackage.addTile(buffers[key], node.name, parseInt(zxy[0]), parseInt(zxy[2]), parseInt(zxy[1]));
                }
              }
            });
          },
          () => {
            console.error('Rejected');
          },
        );
      });
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
        let iconRow: IconRow;
        for (const prop in node) {
          if (prop === KMLTAGS.STYLE_URL_TAG) {
            try {
              let styleId = this.styleUrlMap.get(node[prop]);
              let iconId = this.iconUrlMap.get(node[prop]);
              if (styleId !== undefined) {
                styleRow = this.styleRowMap.get(styleId);
              } else {
                const normalStyle = this.styleMapPair.get(node[prop]);
                styleId = this.styleUrlMap.get(normalStyle);
                styleRow = this.styleRowMap.get(styleId);
              }
              if (iconId !== undefined) {
                iconRow = this.iconRowMap.get(iconId);
              } else {
                const normalStyle = this.iconMapPair.get(node[prop]);
                // console.log(normalStyle);
                iconId = this.iconUrlMap.get(normalStyle);
                // console.log(this.iconUrlMap.get(normalStyle), normalStyle);
                iconRow = this.iconRowMap.get(iconId);
                // console.log(iconRow);
              }
              // console.log(iconRow, node[prop]);
            } catch (error) {
              console.error(error);
            }
          }

          if (prop === KMLTAGS.STYLE_TAG) {
            const tempMap = new Map<string, object>();
            tempMap.set(node.name, node.Style);
            this.addSpecificStyles(defaultStyles, tempMap);
            this.addSpecificIcons(defaultStyles, tempMap);
            const styleId = this.styleUrlMap.get('#' + node.name);
            styleRow = this.styleRowMap.get(styleId);
            const iconId = this.iconUrlMap.get('#' + node.name);
            iconRow = this.iconRowMap.get(iconId);
          }

          if (prop === KMLTAGS.STYLE_MAP_TAG) {
            const normalStyle = this.styleMapPair.get(node['$'].id);
            const styleId = this.styleUrlMap.get(normalStyle);
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
        }
        if (!_.isNil(styleRow)) {
          defaultStyles.setStyle(featureID, geometryData.type, styleRow);
        }
        if (!_.isNil(iconRow)) {
          defaultStyles.setIcon(featureID, geometryData.type, iconRow);
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
      let minLat: number, minLon: number, maxLat: number, maxLon: number;

      const stream = fs.createReadStream(kmlPath);
      const kml = new xmlStream(stream);
      kml.collect('Pair');
      kml.on('endElement: ' + KMLTAGS.PLACEMARK_TAG, (node: {}) => {
        for (const property in node) {
          // Item to be treated like a Geometry
          if (
            !(
              property === 'Point' ||
              property === 'LineString' ||
              property === 'Polygon' ||
              property === 'MultiGeometry' ||
              property === 'Model' ||
              property === 'Style'
            )
          ) {
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
        if (
          node.hasOwnProperty(KMLTAGS.STYLE_TYPES.LINE_STYLE) ||
          node.hasOwnProperty(KMLTAGS.STYLE_TYPES.POLY_STYLE)
        ) {
          this.styleMap.set(node['$'].id, node);
        }
        if (node.hasOwnProperty(KMLTAGS.STYLE_TYPES.ICON_STYLE)) {
          this.iconMap.set(node['$'].id, node);
        }
      });
      kml.on('endElement: ' + KMLTAGS.DOCUMENT_TAG + '>' + KMLTAGS.STYLE_MAP_TAG, node => {
        node.Pair.forEach((item: { key: string; styleUrl: string }) => {
          if (item.key === 'normal') {
            this.styleMapPair.set('#' + node['$'].id, item.styleUrl);
            this.iconMapPair.set('#' + node['$'].id, item.styleUrl);
          }
        });
      });
      kml.on('end', () => {
        this.boundingBox = new BoundingBox(minLat, maxLat, minLon, maxLon);
        resolve(properties);
      });
    });
  }

  /**
   * Determines whether to create a new file or open an existing file.
   * @param geopackage
   * @param options
   * @param progressCallback
   */
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
   * Private/Helper Methods
   */

  /**
   * Index the table to make searching for points faster.
   * @param geopackage GeoPackage Object
   * @param tableName Name of Main table with Geometry
   */
  private async indexTable(geopackage: GeoPackage, tableName: string): Promise<void> {
    const featureDao = geopackage.getFeatureDao(tableName);
    const fti = featureDao.featureTableIndex;
    if (fti) {
      await fti.index();
    }
  }

  /**
   * Converts Item into a data URL and adds it and information about to the database.
   * @param iconLocation Used to find the extension type
   * @param data base64 string of the image data
   * @param newIcon Row for the new Icon
   * @param styleTable Main styleTable in the database
   * @param id Id from KML
   */
  private imageDataToDataBase(
    iconLocation: string,
    dataUrl: string,
    newIcon: IconRow,
    styleTable: FeatureTableStyles,
    id: string,
  ): void {
    newIcon.data = Buffer.from(dataUrl.split(',')[1], 'base64');
    const dim = imageSize(newIcon.data);
    newIcon.width = dim.width;
    newIcon.height = dim.height;
    newIcon.contentType = 'image/' + dim.type;
    newIcon.anchorU = 0;
    newIcon.anchorV = 0;
    const newIconId = styleTable.getFeatureStyleExtension().getOrInsertIcon(newIcon);
    this.iconUrlMap.set('#' + id, newIconId);
    this.iconRowMap.set(newIconId, newIcon);
  }

  /**
   * Adds an Icon into the Database
   * @param styleTable Database Object for the style
   * @param item The id from KML and the object data from KML
   */
  private async addSpecificIcon(styleTable: FeatureTableStyles, item: [string, object]): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const newIcon = styleTable.getIconDao().newRow();
      newIcon.name = item[0];
      if (item[1].hasOwnProperty(KMLTAGS.STYLE_TYPES.ICON_STYLE)) {
        const iconStyle = item[1][KMLTAGS.STYLE_TYPES.ICON_STYLE];
        const iconLocation = iconStyle[KMLTAGS.ICON_TAG]['href'];
        const dataUrl = await KMLUtilities.getImageDataUrlFromKMLHref(iconLocation).catch(error => {
          console.error(error);
          return 'ERROR';
        });
        if (dataUrl === 'ERROR') {
          reject();
        }
        this.imageDataToDataBase(iconLocation, dataUrl, newIcon, styleTable, item[0]);
        resolve();
      }
    });
  }

  /**
   * Loops through provided map of names of icons and object data of the icons.
   * @param styleTable Feature Table Style
   * @param items icons to add to the style table
   */
  private async addSpecificIcons(styleTable: FeatureTableStyles, items: Map<string, object>): Promise<void> {
    return new Promise(async resolve => {
      for (const item of items) {
        await this.addSpecificIcon(styleTable, item);
      }
      resolve();
    });
  }

  /**
   * Adds styles to the table provided.
   * Saves id and name in this.styleRowMap and this.styleUrlMap
   * @param styleTable Feature Style Table
   * @param items Map of the name of the style and the style itself from the KML
   */
  private addSpecificStyles(styleTable: FeatureTableStyles, items: Map<string, object>): void {
    for (const item of items) {
      let isStyle = false;
      const newStyle = styleTable.getStyleDao().newRow();
      newStyle.setName(item[0]);

      // Styling for Lines
      if (item[1].hasOwnProperty(KMLTAGS.STYLE_TYPES.LINE_STYLE)) {
        isStyle = true;
        if (item[1][KMLTAGS.STYLE_TYPES.LINE_STYLE].hasOwnProperty('color')) {
          const abgr = item[1][KMLTAGS.STYLE_TYPES.LINE_STYLE]['color'];
          const { rgb, a } = this.abgrStringToColorOpacity(abgr);
          newStyle.setColor(rgb, a);
        }
        if (item[1][KMLTAGS.STYLE_TYPES.LINE_STYLE].hasOwnProperty('width')) {
          newStyle.setWidth(item[1][KMLTAGS.STYLE_TYPES.LINE_STYLE]['width']);
        }
      }

      // Styling for Polygons
      if (item[1].hasOwnProperty(KMLTAGS.STYLE_TYPES.POLY_STYLE)) {
        isStyle = true;
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

      // Add Style to Geopackage
      if (isStyle) {
        const newStyleId = styleTable.getFeatureStyleExtension().getOrInsertStyle(newStyle);
        this.styleUrlMap.set('#' + item[0], newStyleId);
        this.styleRowMap.set(newStyleId, newStyle);
      }
    }
  }

  // private async setUpDefaultIcon(geopkg: GeoPackage, tableName: string): Promise<FeatureTableStyles> {

  // }
  /**
   * Provides default styles for the Geometry table.
   * Currently set to Red
   * @param geopkg GeoPackage
   * @param tableName Name of the Main Geometry table
   */
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

    // Table Wide
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
   * @param abgr KML Color format AABBGGRR alpha (00-FF) blue (00-FF) green (00-FF) red (00-FF)
   */
  private abgrStringToColorOpacity(abgr: string): { rgb: string; a: number } {
    const rgb = abgr.slice(6, 8) + abgr.slice(4, 6) + abgr.slice(2, 4);
    const a = parseInt('0x' + abgr.slice(0, 2)) / 255;
    return { rgb, a };
  }

  /**
   * Takes in a KML Point and returns a GeoJSON formatted object.
   * @param node The data from xmlStream with the selector of Placemark.
   */
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

  /**
   * Takes in a KML LineString and returns a GeoJSON formatted object.
   * @param node The data from xmlStream with the selector of Placemark.
   */
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

  /**
   * Takes in a KML Polygon and returns a GeoJSON formatted object.
   * @param node The data from xmlStream with the selector of Placemark.
   */
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
      if (node[KMLTAGS.GEOMETRY_TAGS.POLYGON].hasOwnProperty('innerBoundaryIs')) {
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
