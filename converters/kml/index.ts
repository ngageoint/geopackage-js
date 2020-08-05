import {
  BoundingBox,
  DataTypes,
  FeatureColumn,
  GeometryColumns,
  GeoPackage,
  GeoPackageAPI,
  FeatureTableStyles,
  UserMappingTable,
} from '@ngageoint/geopackage';

import { StyleRow } from '@ngageoint/geopackage/built/lib/extension/style/styleRow';
import { IconRow } from '@ngageoint/geopackage/built/lib/extension/style/iconRow';
import { RelatedTablesExtension } from '@ngageoint/geopackage/built/lib/extension/relatedTables';

// Read KML
import fs, { PathLike } from 'fs';
import XmlStream from 'xml-stream-saxjs';
import path from 'path';

// Read KMZ
import JSZip from 'jszip';
import mkdirp from 'mkdirp';

// Utilities
import _ from 'lodash';

// Handle images
import Jimp from 'jimp';
import axios from 'axios';

// Utilities and Tags
import * as KMLTAGS from './KMLTags';
import { KMLUtilities } from './kmlUtilities';
import { GeoSpatialUtilities } from './geoSpatialUtilities';
import Streamer from 'stream';

import { isBrowser, isNode } from 'browser-or-node';
import { ImageUtilities } from './imageUtilities';

export interface KMLConverterOptions {
  kmlOrKmzPath?: PathLike;
  kmlOrKmzData?: Uint8Array;
  isKMZ?: boolean | false;
  mainTableName?: string;
  append?: boolean;
  preserverFolders?: boolean;
  geoPackage?: GeoPackage | string;
  srsNumber?: number | 4326;
  indexTable?: boolean;
}
/**
 * Convert KML file to GeoPackages.
 */
export class KMLToGeoPackage {
  private options?: KMLConverterOptions;
  hasStyles: boolean;
  hasMultiGeometry: boolean;
  zipFileMap: Map<string, any>;
  styleMap: Map<string, object>;
  styleUrlMap: Map<string, number>;
  styleRowMap: Map<number, StyleRow>;
  styleMapPair: Map<string, string>;
  iconMap: Map<string, object>;
  iconUrlMap: Map<string, number>;
  iconRowMap: Map<number, IconRow>;
  iconMapPair: Map<string, string>;
  properties: Set<string>;
  numberOfPlacemarks: number;
  numberOfGroundOverLays: number;

  constructor(optionsUser: KMLConverterOptions = {}) {
    this.options = optionsUser;
    // Icon and Style Map are used to help fill out cross reference tables in the Geopackage Database
    this.zipFileMap = new Map();
    this.styleMapPair = new Map();
    this.styleMap = new Map();
    this.styleUrlMap = new Map();
    this.styleRowMap = new Map();
    this.iconMap = new Map();
    this.iconUrlMap = new Map();
    this.iconRowMap = new Map();
    this.iconMapPair = new Map();
    this.hasMultiGeometry = false;
    this.hasStyles = false;
    this.properties = new Set();
    this.numberOfPlacemarks = 0;
    this.numberOfGroundOverLays = 0;
  }
  /**
   * Converts KML and KMZ to GeoPackages.
   *
   * @param {KMLConverterOptions} options
   * @param {Function} progressCallback 
   */
  async convert(options?: KMLConverterOptions, progressCallback?: Function): Promise<GeoPackage> {
    const clonedOptions = { ...options };
    const kmlOrKmzPath = clonedOptions.kmlOrKmzPath || undefined;
    const isKMZ = clonedOptions.isKMZ || false;
    const geopackage = clonedOptions.geoPackage || undefined;
    const tableName = clonedOptions.mainTableName;
    const kmlOrKmzData = clonedOptions.kmlOrKmzData;
    return this.convertKMLOrKMZToGeopackage(kmlOrKmzPath, isKMZ, geopackage, tableName, kmlOrKmzData, progressCallback);
  }

  /**
   * Determines what convert function to call based on the files extension.
   * @param kmlOrKmzPath Path to .kml, .kmz, and .zip to be converted into a geopackage file.
   * @param geopackage String or instance of the Geopackage to use.
   * @param tableName Name of Main Geometry table
   * @callback progressCallback Passed the current status of the function.
   */
  async convertKMLOrKMZToGeopackage(
    kmlOrKmzPath: PathLike,
    isKMZ?: boolean,
    geopackage?: GeoPackage | string,
    tableName?: string,
    kmlOrKmzData?: Uint8Array | null,
    progressCallback?: Function,
  ): Promise<GeoPackage> {
    if (typeof geopackage === 'string' || _.isNil(geopackage)) {
      geopackage = await this.createOrOpenGeoPackage(geopackage, this.options);
    }
    // console.log(geopackage);
    if (!isKMZ) {
      if (progressCallback) await progressCallback({ status: 'Converting KML file to GeoPackage' });
      if (isNode) {
        return this.convertKMLToGeoPackage(kmlOrKmzPath, geopackage, tableName, progressCallback);
      } else if (isBrowser) {
        return this.convertKMLToGeoPackage(kmlOrKmzData, geopackage, tableName, progressCallback);
      }
    }
    if (isKMZ) {
      if (progressCallback)
        await progressCallback({ status: 'Converting a KMZ file to GeoPackage', file: kmlOrKmzPath });
      if (isNode) {
        return this.convertKMZToGeoPackage(kmlOrKmzPath, geopackage, tableName, progressCallback);
      } else if (isBrowser) {
        return this.convertKMZToGeoPackage(kmlOrKmzData, geopackage, tableName, progressCallback);
      }
    }

    if (progressCallback) await progressCallback({ status: 'Invalid File Extension. Throwing Error' });
    throw new Error('Invalid File Extension.');
  }
  /**
   * Unzips and stores data from a KMZ file in the current directory.
   * @param {(PathLike | Uint8Array)} kmzPath PathLike to the KMZ file (Which the zipped version of a KML)
   * @param geopackage  String or name of Geopackage to use
   * @param tableName  Name of the main Geometry Table
   * @callback progressCallback Passed the current status of the function.
   */
  async convertKMZToGeoPackage(
    kmzData: PathLike | Uint8Array,
    geopackage: GeoPackage | string,
    tableName: string,
    progressCallback?: Function,
  ): Promise<any> {
    if (typeof geopackage === 'string' || _.isNil(geopackage)) {
      geopackage = await this.createOrOpenGeoPackage(geopackage, this.options);
    }
    let data: PathLike | Uint8Array;
    if (kmzData instanceof Uint8Array) {
      data = kmzData;
    } else {
      data = fs.readFileSync(kmzData);
    }
    const zip = await JSZip.loadAsync(data).catch(() => {
      throw new Error('Invalid KMZ / ZIP file');
    });
    let kmlData: PathLike | Uint8Array;
    let gp: GeoPackage;
    await new Promise(async resolve => {
      if (progressCallback) await progressCallback({ status: 'Extracting files form KMZ' });
      // console.log(zip.files);
      for (const key in zip.files) {
        // console.log(key, zip.files);
        await new Promise(async (resolve, reject) => {
          if (zip.files.hasOwnProperty(key)) {
            if (isNode) {
              const fileDestination = path.join(path.dirname(kmzData.toString()), key);
              kmlData = zip.files[key].name.endsWith('.kml') ? fileDestination : kmlData;
              const dir = mkdirp(path.dirname(fileDestination));
              if (!_.isNil(dir)) {
                await dir.catch(err => {
                  console.error('mkdirp was not able to be made', err);
                  reject();
                });
              }
              const file = zip.file(key);
              if (!_.isNil(file)) {
                file
                  .nodeStream()
                  .pipe(
                    fs.createWriteStream(fileDestination, {
                      flags: 'w',
                    }),
                  )
                  .on('finish', () => {
                    resolve();
                  });
              } else {
                resolve();
              }
            } else if (isBrowser) {
              if (key.endsWith('.kml')) {
                kmlData = await zip.files[key].async('uint8array');
              } else {
                this.zipFileMap.set(key, await zip.files[key].async('base64'));
              }
              resolve();
            }
          }
        }).catch(err => {
          if (progressCallback) progressCallback({ status: 'KMZ -> KML extraction was not successful.', error: err });
          console.error('KMZ -> KML extraction was not successful');
          throw err;
        });
      }
      resolve();
    })
      .then(async () => {
        if (progressCallback) progressCallback({ status: 'Converting kmz to a Geopackage', file: kmlData });
        gp = await this.convertKMLToGeoPackage(kmlData, geopackage, tableName, progressCallback);
      })
      .catch(err => {
        if (progressCallback) progressCallback({ status: 'KMZ -> KML extraction was not successful.', error: err });
        console.error('KMZ -> KML extraction was not successful');
        throw err;
      });
    return gp;
  }

  /**
   * Takes a KML file and does a 2 pass method to exact the features and styles and inserts those item properly into a geopackage.
   * @param kmlPath Path to KML file
   * @param geopackage String or name of Geopackage to use
   * @param tableName Name of table with geometry
   * @callback progressCallback Passed the current status of the function.
   */
  async convertKMLToGeoPackage(
    kmlData: PathLike | Uint8Array,
    geopackage: GeoPackage | string,
    tableName: string,
    progressCallback?: Function,
  ): Promise<GeoPackage> {
    if (typeof geopackage === 'string' || _.isNil(geopackage)) {
      geopackage = await this.createOrOpenGeoPackage(geopackage, this.options);
    }
    if (progressCallback) progressCallback({ status: 'Obtaining Meta-Data about KML', file: kmlData });
    const { props: props, bbox: BoundingBox } = await this.getMetaDataKML(kmlData, geopackage, progressCallback);
    this.properties = props;
    if (progressCallback)
      progressCallback({
        status: 'Setting Up Geometry table',
        data: 'with props: ' + props.toString() + ', Bounding Box: ' + BoundingBox.toString(),
      });
    geopackage = await this.setUpTableKML(tableName, geopackage, props, BoundingBox, progressCallback);
    if (progressCallback) progressCallback({ status: 'Setting Up Style and Icon Tables' });
    const defaultStyles = await this.setUpStyleKML(geopackage, tableName);

    // Geometry and Style Insertion
    if (progressCallback) progressCallback({ status: 'Adding Data to the Geopackage' });
    await this.addKMLDataToGeoPackage(kmlData, geopackage, defaultStyles, tableName, progressCallback);

    if (this.options.indexTable && props.size !== 0) {
      if (progressCallback) progressCallback({ status: 'Indexing the Geopackage' });
      await this.indexTable(geopackage, tableName);
    }
    return geopackage;
  }

  /**
   * Takes in KML and the properties of the KML and creates a table in the geopackage folder.
   *
   * @param {string} tableName name the Database table will be called
   * @param {GeoPackage} geopackage file name or GeoPackage object
   * @param {Set<string>} properties columns name gotten from getMetaDataKML
   * @param {BoundingBox} boundingBox
   * @callback progressCallback Passed the current status of the function.
   * @returns {Promise<GeoPackage>} Promise of a GeoPackage
   */
  async setUpTableKML(
    tableName: string,
    geopackage: GeoPackage,
    properties: Set<string>,
    boundingBox: BoundingBox,
    progressCallback?: Function,
  ): Promise<GeoPackage> {
    return new Promise(async resolve => {
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
        if (progressCallback) progressCallback({ status: 'Creating Geometry Table' });
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
   * @param geopackage GeoPackage Object
   * @param tableName Name of Main Table
   * @callback progressCallback Passed the current status of the function.
   */
  setUpStyleKML(geopackage: GeoPackage, tableName: string, progressCallback?: Function): Promise<FeatureTableStyles> {
    return new Promise(async resolve => {
      if (this.hasStyles) {
        if (progressCallback) progressCallback({ status: 'Creating Default KML Styles and Icons.' });
        const defaultStyles = await KMLUtilities.setUpKMLDefaultStylesAndIcons(geopackage, tableName, progressCallback);
        // Specific Styles SetUp
        if (progressCallback) progressCallback({ status: 'Adding Styles and Icon if they exist.' });
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
   * @param {(PathLike|Uint8Array)} kmlPath Path to KML file
   * @param {GeoPackage} geopackage GeoPackage Object
   * @param {FeatureTableStyles} defaultStyles Feature Style Object
   * @param {string} tableName Name of Main table for Geometry
   * @callback progressCallback
   */
  async addKMLDataToGeoPackage(
    kmlData: PathLike | Uint8Array,
    geopackage: GeoPackage,
    defaultStyles: FeatureTableStyles,
    tableName: string,
    progressCallback?: Function,
  ): Promise<void> {
    return new Promise(async resolve => {
      if (progressCallback) progressCallback({ status: 'Setting up Multi Geometry table.' });
      const multiGeometryTableName = 'multi_geometry';
      const multiGeometryMapName = multiGeometryTableName + '_' + tableName;
      const relatedTableExtension = new RelatedTablesExtension(geopackage);
      const multiGeometryMap = UserMappingTable.create(multiGeometryMapName);
      if (this.hasMultiGeometry) {
        if (progressCallback) progressCallback({ status: 'Creating MultiGeometry Tables' });
        geopackage.createSimpleAttributesTable(multiGeometryTableName, [
          { name: 'number_of_geometries', dataType: 'INT' },
        ]);
        const relationShip = RelatedTablesExtension.RelationshipBuilder()
          .setBaseTableName(tableName)
          .setRelatedTableName(multiGeometryTableName)
          .setUserMappingTable(multiGeometryMap);
        await relatedTableExtension.addSimpleAttributesRelationship(relationShip);
      }
      let stream: Streamer.Duplex | fs.ReadStream;
      if (kmlData instanceof Uint8Array) {
        stream = new Streamer.Duplex();
        stream.push(kmlData);
        stream.push(null);
      } else {
        stream = fs.createReadStream(kmlData);
      }
      const kml = new XmlStream(stream, 'UTF-8');
      kml.preserve('coordinates', true);
      kml.collect('LinearRing');
      kml.collect('Polygon');
      kml.collect('Point');
      kml.collect('LineString');
      kml.collect('Data');
      kml.collect('value');
      // kml.collect('Folder');
      // kml.collect('Placemark');
      let asyncProcessesRunning = 0;
      kml.on('endElement: ' + KMLTAGS.GROUND_OVERLAY_TAG, async node => {
        asyncProcessesRunning++;
        if (progressCallback) progressCallback({ status: 'Handling GroundOverlay Tag.', data: node });
        let image: Jimp | void;
        if (isNode) {
          if (progressCallback) progressCallback({ status: 'Moving Ground Overlay image into Memory' });
          // Determines whether the image is local or online.
          image = await ImageUtilities.getJimpImage(node.Icon.href, path.dirname(kmlData.toString())).catch(err =>
            console.error(err),
          );
        } else if (isBrowser) {
          image = await ImageUtilities.getJimpImage(node.Icon.href, null, this.zipFileMap).catch(err =>
            console.error(err),
          );
        }
        if (image) {
          KMLUtilities.handleGroundOverLay(node, geopackage, image, progressCallback).catch(err =>
            console.error('Error not able to Handle Ground Overlay :', err),
          );
        }
        asyncProcessesRunning--;
      });
      kml.on('endElement: ' + KMLTAGS.PLACEMARK_TAG, node => {
        if (progressCallback) progressCallback({ status: 'Handling Placemark Tag.', data: node });
        let isMultiGeometry = false;
        const geometryIds = [];
        const geometryNodes = KMLUtilities.setUpGeometryNodes(node);
        if (geometryNodes.length > 1) isMultiGeometry = true;
        do {
          const currentNode = geometryNodes.pop();
          const geometryId = this.addPropertiesAndGeometryValues(currentNode, defaultStyles, geopackage, tableName);
          if (geometryId !== -1) geometryIds.push(geometryId);
        } while (geometryNodes.length !== 0);
        if (isMultiGeometry && this.hasMultiGeometry) {
          KMLUtilities.writeMultiGeometry(
            geometryIds,
            geopackage,
            multiGeometryTableName,
            relatedTableExtension,
            multiGeometryMapName,
          );
        }
      });
      kml.on('end', async () => {
        while (asyncProcessesRunning > 0) {
          if (progressCallback) progressCallback({ status: 'Waiting on Async Functions' });
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        if (progressCallback) progressCallback({ status: 'Finished adding data to the Geopackage' });
        resolve();
      });
    });
  }

  /**
   * Runs through KML and finds name for Columns and Style information. Handles Networks Links. Handles Bounding Boxes
   * @param kmlData Path to KML File or Uint8 array
   * @param {GeoPackage} geopackage
   * @param progressCallback
   */
  getMetaDataKML(
    kmlData: PathLike | Uint8Array,
    geopackage: GeoPackage,
    progressCallback?: Function,
  ): Promise<{ props: Set<string>; bbox: BoundingBox }> {
    return new Promise(async resolve => {
      if (progressCallback)
        progressCallback({ status: 'Setting up XML-Stream to find Meta-data about the KML file', file: kmlData });
      const properties = new Set<string>();
      // Bounding box
      const boundingBox = new BoundingBox(null);
      let kmlOnsRunning = 0;
      let stream: Streamer.Duplex | fs.ReadStream;
      if (kmlData instanceof Uint8Array) {
        stream = new Streamer.Duplex();
        stream.push(kmlData);
        stream.push(null);
      } else {
        stream = fs.createReadStream(kmlData);
      }
      const kml = new XmlStream(stream, 'UTF-8');
      kml.preserve(KMLTAGS.COORDINATES_TAG, true);
      kml.collect(KMLTAGS.PAIR_TAG);
      kml.collect(KMLTAGS.GEOMETRY_TAGS.POINT);
      kml.collect(KMLTAGS.GEOMETRY_TAGS.LINESTRING);
      kml.collect(KMLTAGS.GEOMETRY_TAGS.POLYGON);
      kml.collect('Data');
      kml.collect('value');
      kml.collect('Placemark');
      kml.on('endElement: ' + KMLTAGS.NETWORK_LINK_TAG, async (node: any) => {
        kmlOnsRunning++;
        if (node.hasOwnProperty('Link') || node.hasOwnProperty('Url')) {
          const linkType = node.hasOwnProperty('Link') ? 'Link' : 'Url';
          if (progressCallback) {
            progressCallback({
              status: 'Handling Network Link Tag. Handling Meta Data',
              file: node[linkType].href,
              data: node,
            });
          }
          // TODO: Handle Browser Case.
          if (node[linkType].href.toString().startsWith('http')) {
            await axios
              .get(node[linkType].href.toString())
              .then(async response => {
                const fileName = path.join(__dirname, path.basename(node[linkType].href));
                fs.createWriteStream(fileName).write(response.data);
                this.options.append = true;
                const linkedFile = new KMLToGeoPackage({ append: true });
                await linkedFile.convertKMLOrKMZToGeopackage(
                  fileName,
                  false,
                  geopackage,
                  path.basename(fileName, path.extname(fileName)),
                );
                kmlOnsRunning--;
              })
              .catch(error => {
                console.error(error);
              });
          } else {
            console.error(node[linkType].href.toString(), 'locator is not supported.');
          }
          // Need to add handling for other files
        } else {
          kmlOnsRunning--;
        }
      });
      kml.on('endElement: ' + KMLTAGS.PLACEMARK_TAG, (node: {}) => {
        this.numberOfPlacemarks++;
        if (progressCallback) {
          progressCallback({
            status: 'Handling Placemark Tag. Adds an addition KML file',
            data: node,
          });
        }
        kmlOnsRunning++;
        for (const property in node) {
          // Item to be treated like a Geometry
          if (
            _.findIndex(KMLTAGS.ITEM_TO_SEARCH_WITHIN, o => {
              return o === property;
            }) !== -1
          ) {
            node[property].forEach(element => {
              for (const subProperty in element) {
                if (
                  _.findIndex(KMLTAGS.INNER_ITEMS_TO_IGNORE, o => {
                    return o === subProperty;
                  }) === -1
                ) {
                  properties.add(subProperty);
                }
              }
            });
          } else if (property === KMLTAGS.GEOMETRY_TAGS.MULTIGEOMETRY) {
            this.hasMultiGeometry = true;
            for (const subProperty in node[property]) {
              node[property][subProperty].forEach(element => {
                for (const subSubProperty in element) {
                  if (
                    _.findIndex(KMLTAGS.INNER_ITEMS_TO_IGNORE, o => {
                      return o === subSubProperty;
                    }) === -1
                  ) {
                    properties.add(subSubProperty);
                  }
                }
              });
            }
          } else {
            properties.add(property);
          }
        }
        kmlOnsRunning--;
      });
      kml.on('endElement: ' + KMLTAGS.PLACEMARK_TAG + ' ' + KMLTAGS.COORDINATES_TAG, node => {
        kmlOnsRunning++;
        if (!_.isEmpty(node)) {
          try {
            const rows = node[KMLTAGS.XML_STREAM_TEXT_SELECTOR].split(/\s+/);
            rows.forEach((element: string) => {
              const temp = element.split(',').map(s => Number(s));
              GeoSpatialUtilities.expandBoundingBoxToIncludeLatLonPoint(boundingBox, temp[0], temp[1]);
            });
          } catch (error) {
            console.error('Something went wrong when reading coordinates:', error);
          }
        }
        kmlOnsRunning--;
      });
      kml.on('endElement: ' + KMLTAGS.DOCUMENT_TAG + ' ' + KMLTAGS.STYLE_TAG, (node: {}) => {
        kmlOnsRunning++;
        if (
          node.hasOwnProperty(KMLTAGS.STYLE_TYPE_TAGS.LINE_STYLE) ||
          node.hasOwnProperty(KMLTAGS.STYLE_TYPE_TAGS.POLY_STYLE)
        ) {
          try {
            this.styleMap.set(node['$'].id, node);
          } catch (err) {
            console.error(err);
          } finally {
            this.hasStyles = true;
          }
        }
        if (node.hasOwnProperty(KMLTAGS.STYLE_TYPE_TAGS.ICON_STYLE)) {
          try {
            this.iconMap.set(node['$'].id, node);
          } finally {
            this.hasStyles = true;
          }
        }
        kmlOnsRunning--;
      });
      kml.on('endElement: ' + KMLTAGS.DOCUMENT_TAG + '>' + KMLTAGS.STYLE_MAP_TAG, node => {
        kmlOnsRunning++;
        node.Pair.forEach((item: { key: string; styleUrl: string }) => {
          if (item.key === 'normal') {
            this.styleMapPair.set('#' + node['$'].id, item.styleUrl);
            this.iconMapPair.set('#' + node['$'].id, item.styleUrl);
          }
        });
        kmlOnsRunning--;
      });
      kml.on('end', async () => {
        while (kmlOnsRunning > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (progressCallback) {
          progressCallback({
            status: 'Finished Reading KML File.',
          });
        }
        resolve({ props: properties, bbox: boundingBox });
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
   * Adds style and geometries to the geopackage.
   * @param node node from kml by xml-stream
   * @param defaultStyles style table
   * @param geopackage Geopackage information will be entered into
   * @param tableName name of geometry table
   */
  private addPropertiesAndGeometryValues(
    node: any,
    defaultStyles: FeatureTableStyles,
    geopackage: GeoPackage,
    tableName: string,
    progressCallback?: Function,
  ): number {
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
            iconId = this.iconUrlMap.get(normalStyle);
            iconRow = this.iconRowMap.get(iconId);
          }
        } catch (error) {
          console.error('Error in mapping style or icons', error);
        }
      } else if (prop === KMLTAGS.STYLE_TAG) {
        try {
          const tempMap = new Map<string, object>();
          tempMap.set(node.name, node.Style);
          this.addSpecificStyles(defaultStyles, tempMap);
          this.addSpecificIcons(defaultStyles, tempMap);
          const styleId = this.styleUrlMap.get('#' + node.name);
          styleRow = this.styleRowMap.get(styleId);
          const iconId = this.iconUrlMap.get('#' + node.name);
          iconRow = this.iconRowMap.get(iconId);
        } catch (err) {
          console.error('Error in mapping local style tags:', err);
        }
      } else if (prop === KMLTAGS.STYLE_MAP_TAG) {
        try {
          const normalStyle = this.styleMapPair.get(node['$'].id);
          const styleId = this.styleUrlMap.get(normalStyle);
          styleRow = this.styleRowMap.get(styleId);
        } catch (err) {
          console.error('Error in Style Map:', err);
        }
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
    const geometryData = KMLUtilities.kmlToGeoJSON(node);
    const isGeom = !_.isNil(geometryData);

    const feature: any = {
      type: 'Feature',
      geometry: geometryData,
      properties: props,
    };

    let featureID = -1;
    if (isGeom) {
      featureID = geopackage.addGeoJSONFeatureToGeoPackage(feature, tableName);
      if (!_.isNil(styleRow)) {
        defaultStyles.setStyle(featureID, geometryData.type, styleRow);
      }
      if (!_.isNil(iconRow) && !_.isNil(iconRow.data)) {
        defaultStyles.setIcon(featureID, geometryData.type, iconRow).catch(e => console.error(e));
      }
    } else {
      featureID = geopackage.addGeoJSONFeatureToGeoPackage(feature, tableName);
    }

    return featureID;
  }

  /**
   * Index the table to make searching for points faster.
   * @param geopackage GeoPackage Object
   * @param tableName Name of Main table with Geometry
   */
  private async indexTable(geopackage: GeoPackage, tableName: string): Promise<void> {
    geopackage.indexFeatureTable(tableName);
  }

  /**
   * Loops through provided map of names of icons and object data of the icons.
   * @param styleTable Feature Table Style
   * @param items icons to add to the style table
   */
  private async addSpecificIcons(styleTable: FeatureTableStyles, items: Map<string, object>): Promise<void> {
    return new Promise(async resolve => {
      for (const item of items) {
        const { id: id, newIcon: icon } = await KMLUtilities.addSpecificIcon(styleTable, item).catch(e => {
          console.error(e);
          return { id: -1, newIcon: null };
        });
        if (id >= 0 && !_.isNil(icon)) {
          this.iconUrlMap.set('#' + item[0], id);
          this.iconRowMap.set(id, icon);
        }
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
      if (kmlStyle.hasOwnProperty(KMLTAGS.STYLE_TYPE_TAGS.LINE_STYLE)) {
        isStyle = true;
        if (kmlStyle[KMLTAGS.STYLE_TYPE_TAGS.LINE_STYLE].hasOwnProperty('color')) {
          const abgr = kmlStyle[KMLTAGS.STYLE_TYPE_TAGS.LINE_STYLE]['color'];
          const { rgb, a } = KMLUtilities.abgrStringToColorOpacity(abgr);
          newStyle.setColor(rgb, a);
        }
        if (kmlStyle[KMLTAGS.STYLE_TYPE_TAGS.LINE_STYLE].hasOwnProperty('width')) {
          newStyle.setWidth(kmlStyle[KMLTAGS.STYLE_TYPE_TAGS.LINE_STYLE]['width']);
        }
      }

      // Styling for Polygons
      if (kmlStyle.hasOwnProperty(KMLTAGS.STYLE_TYPE_TAGS.POLY_STYLE)) {
        isStyle = true;
        if (kmlStyle[KMLTAGS.STYLE_TYPE_TAGS.POLY_STYLE].hasOwnProperty('color')) {
          const abgr = kmlStyle[KMLTAGS.STYLE_TYPE_TAGS.POLY_STYLE]['color'];
          const { rgb, a } = KMLUtilities.abgrStringToColorOpacity(abgr);
          newStyle.setFillColor(rgb, a);
        }
        if (kmlStyle[KMLTAGS.STYLE_TYPE_TAGS.POLY_STYLE].hasOwnProperty('fill')) {
          if (!kmlStyle[KMLTAGS.STYLE_TYPE_TAGS.POLY_STYLE]['fill']) {
            newStyle.setFillOpacity(0);
          }
        }
        if (kmlStyle[KMLTAGS.STYLE_TYPE_TAGS.POLY_STYLE].hasOwnProperty('outline')) {
          // console.log(kmlStyle[KMLTAGS.STYLE_TYPES.POLY_STYLE]);
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
}
