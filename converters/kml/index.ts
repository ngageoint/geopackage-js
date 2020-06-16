import {
  BoundingBox,
  DataTypes,
  FeatureColumn,
  GeometryColumns,
  GeoPackage,
  GeoPackageAPI,
  TileScaling,
  TileScalingType,
  FeatureTableStyles,
} from '@ngageoint/geopackage';
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
import { GeoSpatialUtilities } from './geoSpatialUtilities.js';

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
            const fileDestination = path.join(__dirname, key);
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
                  // console.log(key, 'was written to', __dirname + '/' + key);
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

    if (this.options.indexTable && props.size !== 0) {
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
      const geopkg = await this.createOrOpenGeoPackage(geopackage, { append: true });
      // console.log('There are: ', properties.size, 'properties');
      if (properties.size !== 0) {
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
        await geopkg.createFeatureTable(
          tableName,
          geometryColumns,
          columns,
          this.boundingBox,
          this.options.hasOwnProperty('srsNumber') ? this.options.srsNumber : 4326,
        );
      }
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
      if (this.styleMap.size !== 0 || this.iconMap.size !== 0) {
        const defaultStyles = await this.setUpDefaultStyles(geopkg, tableName);
        // Specific Styles SetUp
        if (this.styleMap.size !== 0) this.addSpecificStyles(defaultStyles, this.styleMap);
        if (this.iconMap.size !== 0) await this.addSpecificIcons(defaultStyles, this.iconMap);
        resolve(defaultStyles);
      }
      resolve(null);
    });
  }

  /**
   * Reads the KML file and extracts Geometric data and matches styles with the Geometric data.
   * Also read the Ground Overlays.
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
        const imageName = node.name;
        let kmlBBox = new BoundingBox(
          parseFloat(node.LatLonBox.west),
          parseFloat(node.LatLonBox.east),
          parseFloat(node.LatLonBox.south),
          parseFloat(node.LatLonBox.north),
        );

        const matrixSetBounds = new BoundingBox(
          -20037508.342789244,
          20037508.342789244,
          -20037508.342789244,
          20037508.342789244,
        );

        const contentsSrsId = 4326;
        const tileMatrixSetSrsId = 3857;
        geopackage.createStandardWebMercatorTileTable(
          imageName,
          kmlBBox,
          contentsSrsId,
          matrixSetBounds,
          tileMatrixSetSrsId,
          0,
          20,
        );

        const tileScalingExt = geopackage.getTileScalingExtension(imageName);
        await tileScalingExt.getOrCreateExtension();
        const ts = new TileScaling();
        ts.scaling_type = TileScalingType.IN_OUT;
        ts.zoom_in = 2;
        ts.zoom_out = 2;
        tileScalingExt.createOrUpdate(ts);

        const imageLocation = node.Icon.href.startsWith('http') ? node.Icon.href : path.join(__dirname, node.Icon.href);
        const img = await Jimp.read(imageLocation);
        let rotation = 0;
        if (node.LatLonBox.hasOwnProperty('rotation')) {
          rotation = parseFloat(node.LatLonBox.rotation);
          kmlBBox = GeoSpatialUtilities.getKmlBBoxRotation(kmlBBox, rotation);
          img.rotate(rotation);
        }
        // Convert img to a buffered PNG image
        const imageBuffer = await img.getBufferAsync(Jimp.MIME_PNG);
        await loadImage(imageBuffer).then(
          image => {
            const naturalScale = GeoSpatialUtilities.getNaturalScale(kmlBBox, image.width);
            const zoomLevels = GeoSpatialUtilities.getZoomLevels(kmlBBox, naturalScale);
            GeoSpatialUtilities.getZoomImages(image, zoomLevels, kmlBBox, geopackage, imageName);
          },
          () => {
            console.error('Rejected');
          },
        );
      });
      kml.on('endElement: ' + KMLTAGS.PLACEMARK_TAG, node => {
        let isGeom = false;
        let geometryData;
        let props = {};
        if (node.hasOwnProperty(KMLTAGS.GEOMETRY_TAGS.POLYGON)) {
          isGeom = true;
          geometryData = KMLUtilities.kmlPolygonToGeoJson(node);
          props = KMLUtilities.getKmlInnerFieldsValue(node[KMLTAGS.GEOMETRY_TAGS.POLYGON], props);
        } else if (node.hasOwnProperty(KMLTAGS.GEOMETRY_TAGS.POINT)) {
          isGeom = true;
          geometryData = KMLUtilities.kmlPointToGeoJson(node);
          props = KMLUtilities.getKmlInnerFieldsValue(node[KMLTAGS.GEOMETRY_TAGS.POINT], props);
        } else if (node.hasOwnProperty(KMLTAGS.GEOMETRY_TAGS.LINESTRING)) {
          isGeom = true;
          geometryData = KMLUtilities.kmlLineStringToGeoJson(node);
          props = KMLUtilities.getKmlInnerFieldsValue(node[KMLTAGS.GEOMETRY_TAGS.LINESTRING], props);
        } else if (node.hasOwnProperty(KMLTAGS.GEOMETRY_TAGS.MULTIGEOMETRY)) {
          isGeom = true;
          geometryData = { type: 'GeometryCollection', geometries: [] };
          if (node.MultiGeometry.hasOwnProperty(KMLTAGS.GEOMETRY_TAGS.POINT)) {
            const temp = KMLUtilities.kmlPointToGeoJson(node.MultiGeometry);
            props = KMLUtilities.getKmlInnerFieldsValue(
              node[KMLTAGS.GEOMETRY_TAGS.MULTIGEOMETRY][KMLTAGS.GEOMETRY_TAGS.POINT],
              props,
            );
            geometryData['geometries'].push(temp);
          }
          if (node.MultiGeometry.hasOwnProperty(KMLTAGS.GEOMETRY_TAGS.LINESTRING)) {
            const temp = KMLUtilities.kmlLineStringToGeoJson(node.MultiGeometry);
            props = KMLUtilities.getKmlInnerFieldsValue(
              node[KMLTAGS.GEOMETRY_TAGS.MULTIGEOMETRY][KMLTAGS.GEOMETRY_TAGS.LINESTRING],
              props,
            );
            geometryData['geometries'].push(temp);
          }
          if (node.MultiGeometry.hasOwnProperty(KMLTAGS.GEOMETRY_TAGS.POLYGON)) {
            const temp = KMLUtilities.kmlPolygonToGeoJson(node.MultiGeometry);
            props = KMLUtilities.getKmlInnerFieldsValue(
              node[KMLTAGS.GEOMETRY_TAGS.MULTIGEOMETRY][KMLTAGS.GEOMETRY_TAGS.POLYGON],
              props,
            );
            geometryData['geometries'].push(temp);
          }
        }
        props = KMLUtilities.propsToStrings(props);
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
                iconId = this.iconUrlMap.get(normalStyle);
                iconRow = this.iconRowMap.get(iconId);
              }
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
          // if (
          //   _.findKey(KMLTAGS.GEOMETRY_TAGS, o => {
          //     return o === prop;
          //   })
          // ) {
          //   for (const numProp in node[prop]) {
          //     console.log(prop, node[prop])
          //     for (const subProp in node[prop][numProp]) {
          //       console.log('subProp', typeof subProp, subProp, node[prop][numProp][subProp]);
          //       if (
          //         _.findIndex(KMLTAGS.ITEMS_TO_IGNORE, o => {
          //           return o === subProp;
          //         }) === -1
          //       ) {
          //         props[subProp] = node[prop][numProp][subProp];
          //       } else if (subProp === KMLTAGS.GEOMETRY_TAGS.MULTIGEOMETRY) {
          //         for (const subNumProp in node[prop][numProp][subProp]) {
          //           for (const subSubProp in node[prop][numProp][subProp][subNumProp]) {
          //             console.log(KMLTAGS.GEOMETRY_TAGS.MULTIGEOMETRY, subSubProp);
          //           }
          //         }
          //       }
          //     }
          //   }
          // } else 
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
        // console.log(feature);
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
            _.findIndex(KMLTAGS.ITEM_TO_SEARCH_WITHIN, o => {
              return o === property;
            }) !== -1
          ) {
            // console.log('node[property]', node[property]);
            for (const subProperty in node[property]) {
              if (
                _.findIndex(KMLTAGS.INNER_ITEMS_TO_IGNORE, o => {
                  return o === subProperty;
                }) === -1
              ) {
                properties.add(subProperty);
                // console.log(subProperty);
              }
            }
          }
          // if (
          //   _.findIndex(KMLTAGS.ITEM_TO_SEARCH_WITHIN, o => {
          //     return o === property;
          //   }) !== -1
          // ) {
          // } 
          else {
            properties.add(property);
            // console.log(property);
          }
        }
        // console.log(properties);
      });
      kml.on('endElement: ' + KMLTAGS.PLACEMARK_TAG + ' ' + KMLTAGS.COORDINATES_TAG, (node: { $text: string }) => {
        const rows = node.$text.split(/\s/);
        rows.forEach((element: string) => {
          const temp = element.split(',').map(s => Number(s));
          if (minLat === undefined) minLat = temp[0];
          if (minLon === undefined) minLon = temp[1];
          if (maxLat === undefined) maxLat = temp[0];
          if (maxLon === undefined) maxLon = temp[1];

          if (temp[0] < minLat) minLat = temp[0];
          if (temp[0] > maxLat) maxLat = temp[0];
          if (temp[1] < minLon) minLon = temp[1];
          if (temp[1] > maxLon) maxLon = temp[1];
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
  private imageDataToDataBase(dataUrl: string, newIcon: IconRow, styleTable: FeatureTableStyles, id: string): void {
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
      const kmlStyle = item[1];
      newIcon.name = item[0];
      if (kmlStyle.hasOwnProperty(KMLTAGS.STYLE_TYPES.ICON_STYLE)) {
        const iconStyle = kmlStyle[KMLTAGS.STYLE_TYPES.ICON_STYLE];
        let iconLocation = iconStyle[KMLTAGS.ICON_TAG]['href'];
        iconLocation = iconLocation.startsWith('http') ? iconLocation : path.join(__dirname, iconLocation);
        const dataUrl = await Jimp.read(iconLocation).then(img => {
          if (iconStyle.hasOwnProperty('scale')) {
            img.scale(parseFloat(iconStyle.scale));
          }
          // console.log(img.getBase64Async(img.getMIME()));
          return img.getBase64Async(img.getMIME());
        });
        this.imageDataToDataBase(dataUrl, newIcon, styleTable, item[0]);
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
      const styleName = item[0];
      const kmlStyle = item[1];
      const newStyle = styleTable.getStyleDao().newRow();
      newStyle.setName(styleName);

      // Styling for Lines
      if (kmlStyle.hasOwnProperty(KMLTAGS.STYLE_TYPES.LINE_STYLE)) {
        isStyle = true;
        if (kmlStyle[KMLTAGS.STYLE_TYPES.LINE_STYLE].hasOwnProperty('color')) {
          const abgr = kmlStyle[KMLTAGS.STYLE_TYPES.LINE_STYLE]['color'];
          const { rgb, a } = KMLUtilities.abgrStringToColorOpacity(abgr);
          newStyle.setColor(rgb, a);
        }
        if (kmlStyle[KMLTAGS.STYLE_TYPES.LINE_STYLE].hasOwnProperty('width')) {
          newStyle.setWidth(kmlStyle[KMLTAGS.STYLE_TYPES.LINE_STYLE]['width']);
        }
      }

      // Styling for Polygons
      if (kmlStyle.hasOwnProperty(KMLTAGS.STYLE_TYPES.POLY_STYLE)) {
        isStyle = true;
        if (kmlStyle[KMLTAGS.STYLE_TYPES.POLY_STYLE].hasOwnProperty('color')) {
          const abgr = kmlStyle[KMLTAGS.STYLE_TYPES.POLY_STYLE]['color'];
          const { rgb, a } = KMLUtilities.abgrStringToColorOpacity(abgr);
          newStyle.setFillColor(rgb, a);
        }
        if (kmlStyle[KMLTAGS.STYLE_TYPES.POLY_STYLE].hasOwnProperty('fill')) {
          if (!kmlStyle[KMLTAGS.STYLE_TYPES.POLY_STYLE]['fill']) {
            newStyle.setFillOpacity(0);
          }
        }
        if (kmlStyle[KMLTAGS.STYLE_TYPES.POLY_STYLE].hasOwnProperty('outline')) {
          // No property Currently TODO
          // newStyle.(item[1]['LineStyle']['outline']);
        }
      }

      // Add Style to Geopackage
      if (isStyle) {
        const newStyleId = styleTable.getFeatureStyleExtension().getOrInsertStyle(newStyle);
        this.styleUrlMap.set('#' + styleName, newStyleId);
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
}
