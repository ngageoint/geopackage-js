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
  UserColumn,
  UserMappingTable,
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
import { RelatedTablesExtension } from '@ngageoint/geopackage/built/lib/extension/relatedTables';
import { SimpleAttributesTable } from '@ngageoint/geopackage/built/lib/extension/relatedTables/simpleAttributesTable';

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
    const { props: props, bbox: BoundingBox } = await this.getMetaDataKML(kmlPath);
    geopackage = await this.setUpTableKML(kmlPath, props, BoundingBox, geopackage, tableName);
    const defaultStyles = await this.setUpStyleKML(kmlPath, geopackage, tableName);

    // Geometry and Style Insertion
    await this.addKMLDataToGeoPackage(kmlPath, geopackage, defaultStyles, tableName);

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
    boundingBox: BoundingBox,
    geopackage: GeoPackage,
    tableName: string,
  ): Promise<GeoPackage> {
    return new Promise(async resolve => {
      geopackage = await this.createOrOpenGeoPackage(geopackage, this.options);
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
        await geopackage.createFeatureTable(
          tableName,
          geometryColumns,
          columns,
          boundingBox,
          this.options.hasOwnProperty('srsNumber') ? this.options.srsNumber : 4326,
        );
      }
      resolve(geopackage);
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
        const defaultStyles = await this.setUpDefaultStylesAndIcons(geopkg, tableName);
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
      const multiGeometryTableName = 'multi_geometry';
      const multiGeometryMapName = multiGeometryTableName + '_' + tableName;
      geopackage.createSimpleAttributesTable(multiGeometryTableName, [
        { name: 'number_of_geometries', dataType: 'INT' },
      ]);
      const multiGeometryMap = UserMappingTable.create(multiGeometryMapName);

      const rte = new RelatedTablesExtension(geopackage);
      const relationShip = RelatedTablesExtension.RelationshipBuilder()
        .setBaseTableName(tableName)
        .setRelatedTableName(multiGeometryTableName)
        .setUserMappingTable(multiGeometryMap);
      await rte.addSimpleAttributesRelationship(relationShip);
      const stream = fs.createReadStream(kmlPath);
      const kml = new xmlStream(stream);
      // geopackage.createExtensionTable().
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
        let isMultiGeometry = false;
        const geometryIds = [];
        const newNode = [];
        if (node.hasOwnProperty(KMLTAGS.GEOMETRY_TAGS.MULTIGEOMETRY)) {
          isMultiGeometry = true;
          for (const key in node[KMLTAGS.GEOMETRY_TAGS.MULTIGEOMETRY]) {
            const item = new Object();
            for (const prop in node) {
              if (prop != KMLTAGS.GEOMETRY_TAGS.MULTIGEOMETRY) {
                item[prop] = node[prop];
              }
            }
            if (node[KMLTAGS.GEOMETRY_TAGS.MULTIGEOMETRY].hasOwnProperty(key)) {
              const shapeType = node[KMLTAGS.GEOMETRY_TAGS.MULTIGEOMETRY][key];
              shapeType.forEach(shape => {
                item[key] = [shape];
                newNode.push(item);
              });
            }
          }
        } else {
          newNode.push(node);
        }
        do {
          node = newNode.pop();
          let props = {};
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
            const element = _.findIndex(KMLTAGS.ITEM_TO_SEARCH_WITHIN, o => {
              return o === prop;
            });
            if (element !== -1) {
              for (const subProp in node[prop][0]) {
                if (
                  _.findIndex(KMLTAGS.INNER_ITEMS_TO_IGNORE, o => {
                    return o === subProp;
                  }) === -1
                ) {
                  props[subProp] = node[prop][0][subProp];
                }
              }
            } else {
              if (typeof node[prop] === 'string') {
                props[prop] = node[prop];
              } else if (typeof node[prop] === 'object') {
                props[prop] = JSON.stringify(node[prop]);
              } else if (typeof node[prop] === 'number') {
                props[prop] = node[prop];
              }
            }
          }
          const geometryData = KMLUtilities.kmlToGeoJSon(node);
          const isGeom = !_.isNil(geometryData);

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
            if (!_.isNil(iconRow)) {
              defaultStyles.setIcon(featureID, geometryData.type, iconRow);
            }
            geometryIds.push(featureID);
          }
        } while (newNode.length !== 0);
        if (isMultiGeometry) {
          const len = geometryIds.length;
          const multiGeometryId = geopackage.addAttributeRow(multiGeometryTableName, { number_of_geometries: len });
          const userMappingDao = rte.getMappingDao(multiGeometryMapName);
          for (const id of geometryIds) {
            const userMappingRow = userMappingDao.newRow();
            userMappingRow.baseId = parseInt(id);
            userMappingRow.relatedId = multiGeometryId;
            userMappingDao.create(userMappingRow);
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
  getMetaDataKML(kmlPath: string): Promise<{ props: Set<string>; bbox: BoundingBox }> {
    return new Promise(resolve => {
      const properties = new Set<string>();
      // Bounding box
      let minLat: number, minLon: number, maxLat: number, maxLon: number;

      const stream = fs.createReadStream(kmlPath);
      const kml = new xmlStream(stream);
      kml.collect('Pair');
      kml.collect(KMLTAGS.GEOMETRY_TAGS.POINT);
      kml.collect(KMLTAGS.GEOMETRY_TAGS.LINESTRING);
      kml.collect(KMLTAGS.GEOMETRY_TAGS.POLYGON);
      kml.on('endElement: ' + KMLTAGS.PLACEMARK_TAG, (node: {}) => {
        for (const property in node) {
          // Item to be treated like a Geometry
          if (
            _.findIndex(KMLTAGS.ITEM_TO_SEARCH_WITHIN, o => {
              return o === property;
            }) !== -1
          ) {
            // console.log('node[property]', node[property]);
            node[property].forEach(element => {
              for (const subProperty in element) {
                if (
                  _.findIndex(KMLTAGS.INNER_ITEMS_TO_IGNORE, o => {
                    return o === subProperty;
                  }) === -1
                ) {
                  properties.add(subProperty);
                  // console.log(subProperty);
                }
              }
            });
          } else if (property === KMLTAGS.GEOMETRY_TAGS.MULTIGEOMETRY) {
            for (const subProperty in node[property]) {
              // console.log(subProperty);
              node[property][subProperty].forEach(element => {
                for (const subSubProperty in element) {
                  if (
                    _.findIndex(KMLTAGS.INNER_ITEMS_TO_IGNORE, o => {
                      return o === subSubProperty;
                    }) === -1
                  ) {
                    properties.add(subSubProperty);
                    // console.log(typeof element[subSubProperty]);
                  }
                }
              });
            }
          } else {
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
      kml.on('endElement: ' + KMLTAGS.DOCUMENT_TAG + ' ' + KMLTAGS.STYLE_TAG, (node: {}) => {
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
        resolve({ props: properties, bbox: new BoundingBox(minLat, maxLat, minLon, maxLon) });
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
    dataUrl: string,
    newIcon: IconRow,
    styleTable: FeatureTableStyles,
    id: string,
    anchorU = 0.5,
    anchorV = 0.5,
  ): void {
    newIcon.data = Buffer.from(dataUrl.split(',')[1], 'base64');
    const dim = imageSize(newIcon.data);
    newIcon.width = dim.width;
    newIcon.height = dim.height;
    newIcon.contentType = 'image/' + dim.type;
    newIcon.anchorU = anchorU;
    newIcon.anchorV = anchorV;
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
      // console.log(item)
      const newIcon = styleTable.getIconDao().newRow();
      const kmlStyle = item[1];
      newIcon.name = item[0];
      if (kmlStyle.hasOwnProperty(KMLTAGS.STYLE_TYPES.ICON_STYLE)) {
        let aU = 0.5;
        let aV = 0.5;
        const iconStyle = kmlStyle[KMLTAGS.STYLE_TYPES.ICON_STYLE];
        let iconLocation = iconStyle[KMLTAGS.ICON_TAG]['href'];
        iconLocation = iconLocation.startsWith('http') ? iconLocation : path.join(__dirname, iconLocation);
        const dataUrl = await Jimp.read(iconLocation).then(img => {
          if (iconStyle.hasOwnProperty(KMLTAGS.SCALE_TAG)) {
            img.scale(parseFloat(iconStyle[KMLTAGS.SCALE_TAG]));
          }
          if (iconStyle.hasOwnProperty(KMLTAGS.HOTSPOT_TAG)) {
            const hotSpot = iconStyle[KMLTAGS.HOTSPOT_TAG]['$'];
            switch (hotSpot['xunits']) {
              case 'fraction':
                aU = parseFloat(hotSpot['x']);
                break;
              case 'pixels':
                aU = parseFloat(hotSpot['x']) / img.getWidth();
                break;
              case 'insetPixels':
                aU = 1 - parseFloat(hotSpot['x']) / img.getWidth();
              default:
                break;
            }
            switch (hotSpot['yunits']) {
              case 'fraction':
                aV = parseFloat(hotSpot['y']);
                break;
              case 'pixels':
                aV = parseFloat(hotSpot['y']) / img.getHeight();
                break;
              case 'insetPixels':
                aV = 1 - parseFloat(hotSpot['y']) / img.getHeight();
              default:
                break;
            }
          }
          // console.log(img.getBase64Async(img.getMIME()));
          return img.getBase64Async(img.getMIME());
        });
        this.imageDataToDataBase(dataUrl, newIcon, styleTable, item[0], aU, aV);
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
          console.log(kmlStyle[KMLTAGS.STYLE_TYPES.POLY_STYLE]);
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

  /**
   * Provides default styles and Icons for the Geometry table.
   * Currently set to White to match google earth.
   * Icon set to yellow pushpin google earth default.
   * @param geopackage GeoPackage
   * @param tableName Name of the Main Geometry table
   */
  private async setUpDefaultStylesAndIcons(geopackage: GeoPackage, tableName: string): Promise<FeatureTableStyles> {
    const defaultStyles = new FeatureTableStyles(geopackage, tableName);
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

    const defaultIcon = defaultStyles.getIconDao().newRow();
    defaultIcon.name = 'ylw-pushpin';
    defaultIcon.anchorU = 0.5;
    defaultIcon.anchorV = 0.5;
    defaultIcon.data = await Jimp.read('http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png').then(img => {
      defaultIcon.width = img.getWidth();
      defaultIcon.height = img.getHeight();
      defaultIcon.contentType = Jimp.MIME_PNG;
      return img.getBufferAsync(Jimp.MIME_PNG);
    });
    defaultStyles.getFeatureStyleExtension().getOrInsertIcon(defaultIcon);

    await defaultStyles.setTableIcon('Point', defaultIcon);
    const polygonStyleRow = defaultStyles.getStyleDao().newRow();
    polygonStyleRow.setColor('FFFFFF', 1.0);
    polygonStyleRow.setFillColor('FFFFFF', 1.0);
    polygonStyleRow.setWidth(2.0);
    polygonStyleRow.setName('Table Polygon Style');
    defaultStyles.getFeatureStyleExtension().getOrInsertStyle(polygonStyleRow);

    const lineStringStyleRow = defaultStyles.getStyleDao().newRow();
    lineStringStyleRow.setColor('FFFFFF', 1.0);
    lineStringStyleRow.setWidth(2.0);
    lineStringStyleRow.setName('Table Line Style');
    defaultStyles.getFeatureStyleExtension().getOrInsertStyle(lineStringStyleRow);

    const pointStyleRow = defaultStyles.getStyleDao().newRow();
    pointStyleRow.setColor('FFFFFF', 1.0);
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
