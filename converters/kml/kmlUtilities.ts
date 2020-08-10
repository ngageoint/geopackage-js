import * as KMLTAGS from './KMLTags';
import _ from 'lodash';
import { BoundingBox, GeoPackage, TileScaling, TileScalingType, FeatureTableStyles } from '@ngageoint/geopackage';
import { GeoSpatialUtilities } from './geoSpatialUtilities';
import { ImageUtilities } from './imageUtilities';
import Jimp from 'jimp';
import { IconRow } from '@ngageoint/geopackage/built/lib/extension/style/iconRow';
import { RelatedTablesExtension } from '@ngageoint/geopackage/built/lib/extension/relatedTables';
import path from 'path';

/**
 * Function directly related the processing of parsed kml data
 *
 * @export
 * @class KMLUtilities
 */
export class KMLUtilities {
  /**
   * Converts the KML Color format into rgb 000000 - FFFFFF and opacity 0.0 - 1.0
   *
   * @static
   * @param {string} abgr KML Color format AABBGGRR alpha (00-FF) blue (00-FF) green (00-FF) red (00-FF)
   * @returns {{ rgb: string; a: number }}
   * @memberof KMLUtilities
   */
  public static abgrStringToColorOpacity(abgr: string): { rgb: string; a: number } {
    // Valid Color and Hex number
    if (abgr.match(/^[0-9A-Fa-f]{8}$/)) {
      const rgb = abgr.slice(6, 8) + abgr.slice(4, 6) + abgr.slice(2, 4);
      const a = parseInt('0x' + abgr.slice(0, 2)) / 255;
      return { rgb, a };
    } else {
      throw new Error('Invalid Color');
    }
  }

  /**
   * Converts KML Ground Overlay into appropriate tile sets.
   *
   * @static
   * @param {*} node Ground Overlay KML node
   * @param {GeoPackage} geopackage
   * @param {Jimp} image
   * @param {Function} [progressCallback]
   * @returns {Promise<void>}
   * @memberof KMLUtilities
   */
  public static async handleGroundOverLay(
    node: any,
    geopackage: GeoPackage,
    image: Jimp,
    progressCallback?: Function,
  ): Promise<void> {
    const imageName = node[KMLTAGS.NAME_TAG];
    let kmlBBox = KMLUtilities.getLatLonBBox(node);

    if (node.LatLonBox.hasOwnProperty('rotation')) {
      if (progressCallback) progressCallback({ status: 'Rotating Ground Overlay' });
      const rotation = parseFloat(node.LatLonBox.rotation);
      kmlBBox = GeoSpatialUtilities.getKmlBBoxRotation(kmlBBox, rotation);
      image.rotate(rotation);
    }
    const kmlBBoxWebMercator = kmlBBox.projectBoundingBox('EPSG:4326', 'EPSG:3857');

    if (progressCallback) progressCallback({ status: 'Making 4326 Image fit 3857 bounding Box.' });
    [kmlBBox, image] = await ImageUtilities.truncateImage(kmlBBox, image);

    const naturalScale = GeoSpatialUtilities.getNaturalScale(kmlBBox, image.getWidth());
    const zoomLevels = GeoSpatialUtilities.getZoomLevels(kmlBBox, naturalScale);

    if (progressCallback) progressCallback({ status: 'Setting Up Web Mercator Tile Table' });
    geopackage.createStandardWebMercatorTileTableWithZoomLevels(
      imageName,
      kmlBBoxWebMercator,
      kmlBBoxWebMercator,
      zoomLevels,
    );

    if (progressCallback) progressCallback({ status: 'Setting Up tile Scaling Extension' });
    const tileScalingExt = geopackage.getTileScalingExtension(imageName);
    await tileScalingExt.getOrCreateExtension();
    const ts = new TileScaling();
    ts.scaling_type = TileScalingType.IN_OUT;
    ts.zoom_in = 2;
    ts.zoom_out = 2;
    tileScalingExt.createOrUpdate(ts);
    if (progressCallback)
      progressCallback({
        status: 'Inserting Zoomed and transformed images into Geopackage database.',
        data: { naturalScale: naturalScale, zoomLevels: zoomLevels },
      });
    ImageUtilities.insertZoomImages(image, Array.from(zoomLevels), kmlBBox, geopackage, imageName, progressCallback);

    if (progressCallback)
      progressCallback({
        status: 'Inserted images.',
      });
  }

  /**
   * Converts node that contains a LatLonBox tag into a geopackage Bounding box
   *
   * @static
   * @param {*} node node from KML
   * @returns {BoundingBox} Geopackage Bounding box.
   * @memberof KMLUtilities
   */
  static getLatLonBBox(node: any): BoundingBox {
    return new BoundingBox(
      parseFloat(node.LatLonBox.west), // minLongitude
      parseFloat(node.LatLonBox.east), // maxLongitude
      parseFloat(node.LatLonBox.south), // minLatitude
      parseFloat(node.LatLonBox.north), // maxLatitude
    );
  }

  /**
   * Converts kml geometries (Point, LineString, and Polygon) into GeoJSON features
   *
   * @static
   * @param {*} node KML parsed Placemark node
   * @returns {*}
   * @memberof KMLUtilities
   */
  public static kmlToGeoJSON(node): any {
    if (node.hasOwnProperty(KMLTAGS.GEOMETRY_TAGS.POLYGON)) {
      return KMLUtilities.kmlPolygonToGeoJson(node[KMLTAGS.GEOMETRY_TAGS.POLYGON]);
    }
    if (node.hasOwnProperty(KMLTAGS.GEOMETRY_TAGS.POINT)) {
      return KMLUtilities.kmlPointToGeoJson(node[KMLTAGS.GEOMETRY_TAGS.POINT]);
    }
    if (node.hasOwnProperty(KMLTAGS.GEOMETRY_TAGS.LINESTRING)) {
      return KMLUtilities.kmlLineStringToGeoJson(node[KMLTAGS.GEOMETRY_TAGS.LINESTRING]);
    }
    return null;
  }

  /**
   * Takes in a KML parsed Point and returns a GeoJSON formatted object.
   *
   * @static
   * @param {any[]} node The data from xmlStream with the selector of Placemark.
   * @returns {{ type: string; coordinates: number[] }}
   * @memberof KMLUtilities
   */
  public static kmlPointToGeoJson(node: any[]): { type: string; coordinates: number[] } {
    const geometryData = { type: 'Point', coordinates: [] };
    node.forEach(point => {
      const coordPoint = point.coordinates[KMLTAGS.XML_STREAM_TEXT_SELECTOR]
        .split(',')
        .map((s: string) => parseFloat(s));
      let coordinate: number[];
      if (coordPoint.length === 3) {
        coordinate = [coordPoint[0], coordPoint[1], coordPoint[2]];
      } else if (coordPoint.length === 2) {
        coordinate = [coordPoint[0], coordPoint[1]];
      } else {
        console.error(
          'Invalid Point: Coordinates must have a length of 2 or 3. You gave: ',
          coordPoint.length,
          point.coordinates[KMLTAGS.XML_STREAM_CHILDREN_SELECTOR],
        );
        return null;
      }
      geometryData['coordinates'] = coordinate;
    });
    return geometryData;
  }

  /**
   * Takes in a KML parsed LineString and returns a GeoJSON formatted object.
   *
   * @static
   * @param {any[]} node The data from xmlStream with the selector of Placemark.
   * @returns {{ type: string; coordinates: number[] }}
   * @memberof KMLUtilities
   */
  public static kmlLineStringToGeoJson(node: any[]): { type: string; coordinates: number[] } {
    const geometryData = { type: 'LineString', coordinates: [] };
    node.forEach(element => {
      const coordPoints = element.coordinates[KMLTAGS.XML_STREAM_TEXT_SELECTOR].split(/\s+/);
      const coordArray = [];
      coordPoints.forEach((element: string) => {
        const coords = element.split(',').map(s => parseFloat(s));
        if (coords.length === 1 && isNaN(coords[0])) {
        } else if (coords.length === 3) {
          coordArray.push([coords[0], coords[1], coords[2]]);
        } else if (coords.length === 2) {
          coordArray.push([coords[0], coords[1]]);
        } else {
          console.error(
            'Invalid Line String: Coordinates must have a length of 2 or 3. You gave: ',
            coords.length,
            coords,
          );
          return null;
        }
      });
      geometryData['coordinates'] = coordArray;
    });
    return geometryData;
  }

  /**
   * Takes in a KML parsed Polygon and returns a GeoJSON formatted object.
   *
   * @static
   * @param {Array<any>} node The data from xmlStream with the selector of Placemark.
   * @returns {{ type: string; coordinates: number[][][] }}
   * @memberof KMLUtilities
   */
  public static kmlPolygonToGeoJson(node: Array<any>): { type: string; coordinates: number[][][] } {
    const geometryData = { type: 'Polygon', coordinates: [] };
    node.forEach(element => {
      const coordRing = element.outerBoundaryIs.LinearRing[0].coordinates[KMLTAGS.XML_STREAM_TEXT_SELECTOR].split(
        /\s+/,
      );
      const coordArray = [];
      coordRing.forEach((elementRing: string) => {
        const coords = elementRing.split(',').map(s => parseFloat(s));
        if (coords.length === 1 && isNaN(coords[0])) {
        } else if (coords.length === 3) {
          coordArray.push([coords[0], coords[1], coords[2]]);
        } else if (coords.length === 2) {
          coordArray.push([coords[0], coords[1]]);
        } else {
          console.error(
            'Invalid Outer Boundary: Coordinates must have a length of 2 or 3. You gave: ',
            coords.length,
            coords,
          );
          return null;
        }
      });

      const temp = [coordArray];

      if (element.hasOwnProperty(KMLTAGS.INNER_BOUNDARY_TAG)) {
        const coordRing = element[KMLTAGS.INNER_BOUNDARY_TAG][KMLTAGS.LINEAR_RING_TAG][0][KMLTAGS.COORDINATES_TAG][KMLTAGS.XML_STREAM_TEXT_SELECTOR].split(
          /\s+/,
        );
        const coordArray = [];
        coordRing.forEach((elementRing: string) => {
          const coords = elementRing.split(',').map(s => parseFloat(s));
          if (coords.length === 3) {
            coordArray.push([coords[0], coords[1], coords[2]]);
          } else if (coords.length == 2) {
            coordArray.push([coords[0], coords[1]]);
          } else if(coords.length === 1 && coords[0] === NaN) {} 
          else {
            console.error(
              'Invalid InnerBoundary: Coordinates must have a length of 2 or 3. You gave: ',
              coords.length,
              elementRing,
              node,
            );
            return null;
          }
        });
        temp.push(coordArray);
      }
      geometryData['coordinates'] = temp;
    });
    return geometryData;
  }

  /**
   * Provides default styles and Icons for the Geometry table.
   * Currently set to White to match google earth.
   * Icon set to yellow pushpin google earth default.
   *
   * @static
   * @param {GeoPackage} geopackage
   * @param {string} tableName Name of the Main Geometry table
   * @param {Function} [progressCallback]
   * @returns {Promise<FeatureTableStyles>}
   * @memberof KMLUtilities
   */
  public static async setUpKMLDefaultStylesAndIcons(
    geopackage: GeoPackage,
    tableName: string,
    progressCallback?: Function,
  ): Promise<FeatureTableStyles> {
    if (progressCallback) progressCallback({ status: 'Creating Style and Icon tables.' });
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

    if (progressCallback) progressCallback({ status: 'Creating KML Default Styles and Icons.' });
    const defaultIcon = defaultStyles.getIconDao().newRow();
    try {
      defaultIcon.name = 'black_marker';
      defaultIcon.anchorU = 0.5;
      defaultIcon.anchorV = 0;
      const defaultImage =
        'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAk9JREFUaAXtmb1KxEAUhf3BQhtrtbMUbESwEhYLBVGsfBNfQER8BmsfQC0ttFAQQbBWwVIrC9FKRfR8sCkcMzs3uzNJFnPgsJmZO+fcuZkku9mBgQZNBf53BQYjL39OehviojglTorgSXwUL8Rj8UasFTaVzZ34bSSxzKkc08rgSrQm7sYxF41K0JLrs+gmVbSNBlqloiW3D7Fosr54tNAsBZzyGJV3F4NmKduplz3vJu220U4K7hyuaex20rtTkVtltwvDIwl4SFmTOlfsujjRJsf0WefjFR3bUrQksKu4oRx3+hizaOAVHWdSDJlT5bzks2QYIyakg1d0WPY/WyUEYkILSHIdvBmM2fMhEBNaAF4mdDrdrsCw25GwbfYqsgCelCHMhwI0bomxeBmsfoecqhk69VygnYrCGDEhHbxM6GTmCly7HTltfsjsiHm69DFGTAgWr5DGn/EV9YQql41T5V4eZHhFx4gUX8QsyVSfeOBlQt6p9k381MChbzBiPx54JcGCVFNVPtPFIym4wDKz2J9JLl63GqsJF4B2KbiUS+zqo1kaluQUewFolgrL12vrIpN8fQ5VY1YBMV6toIFWJdiTq7XKvjg0KsOonB9EX3KhfuaiUSmW5R5K1DfO3FpgX1n4kvT1M6c2GFMmt6IvWbefWObUCrzLeRfdZN02MUne+8SoxpZhAcTUFvxldSS6Vc/ajMX+Wyt6McaleJ+zCPoY6wvMKMtXMas8x/T1FdaU7VebHCeB+QVSF+5sGSp/Ih50Mb+Z0lSgqYChAj/TCV35EewaiAAAAABJRU5ErkJggg==';
      const bufferImg = Buffer.from(defaultImage, 'base64');
      defaultIcon.data = await Jimp.read(bufferImg)
        .then(img => {
          defaultIcon.width = img.getWidth();
          defaultIcon.height = img.getHeight();
          defaultIcon.contentType = Jimp.MIME_PNG;
          return img.getBufferAsync(Jimp.MIME_PNG);
        })
        .catch(err => {
          console.error(err);
          throw err;
        });
      defaultStyles.getFeatureStyleExtension().getOrInsertIcon(defaultIcon);
    } catch (err) {
      console.error(err);
    }

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
  /**
   * Converts Item into a data URL and adds it and information about to the database.
   * @param dataUrl
   * @param newIcon
   * @param styleTable
   * @param anchorU
   * @param anchorV
   */
  public static async insertIconImageData(
    jimpImage: Jimp,
    newIcon: IconRow,
    styleTable: FeatureTableStyles,
    anchorU = 0.5,
    anchorV = 0.5,
  ): Promise<number> {
    newIcon.data = await jimpImage.getBufferAsync(jimpImage.getMIME());
    if (_.isNil(newIcon.data)) {
      console.error('NULL', newIcon);
    }
    newIcon.width = jimpImage.getWidth();
    newIcon.height = jimpImage.getHeight();
    newIcon.contentType = jimpImage.getMIME();
    newIcon.anchorU = anchorU;
    newIcon.anchorV = anchorV;
    return styleTable.getFeatureStyleExtension().getOrInsertIcon(newIcon);
  }
  /**
   * Adds an Icon into the Database
   * @param styleTable Database Object for the style
   * @param item The id from KML and the object data from KML
   */
  public static async addSpecificIcon(
    styleTable: FeatureTableStyles,
    item: [string, object],
  ): Promise<{ id: number; newIcon: IconRow }> {
    return new Promise(async (resolve, reject) => {
      const newIcon = styleTable.getIconDao().newRow();
      const kmlStyle = item[1];
      newIcon.name = item[0];
      let id = -2;
      if (_.isNil(kmlStyle)) {
        console.error('kml Style Undefined');
        reject();
      }
      if (kmlStyle.hasOwnProperty(KMLTAGS.STYLE_TYPE_TAGS.ICON_STYLE)) {
        let aU = 0.5;
        let aV = 0.5;
        const iconStyle = kmlStyle[KMLTAGS.STYLE_TYPE_TAGS.ICON_STYLE];
        if (_.isNil(iconStyle)) {
          console.error('Icon Style Undefined');
          reject();
        }
        if (_.isNil(iconStyle[KMLTAGS.ICON_TAG])) {
          console.error('Icon Tag Undefined');
          reject();
          return;
        }
        if (iconStyle[KMLTAGS.ICON_TAG].hasOwnProperty('href') && !_.isNil(iconStyle[KMLTAGS.ICON_TAG]['href'])) {
          let iconLocation = iconStyle[KMLTAGS.ICON_TAG]['href'];
          iconLocation = iconLocation.startsWith('http') ? iconLocation : path.join(__dirname, iconLocation);
          const img: Jimp = await Jimp.read(iconLocation).catch(err => {
            console.error('Image Reading Error', err);
            throw err;
          });
          if (_.isNil(img)) {
            reject();
          }
          if (iconStyle.hasOwnProperty(KMLTAGS.SCALE_TAG)) {
            img.scale(parseFloat(iconStyle[KMLTAGS.SCALE_TAG]));
          }
          const iconTag = iconStyle[KMLTAGS.ICON_TAG];
          let cropX = 0;
          let cropY = 0;
          let cropH = img.getHeight();
          let cropW = img.getWidth();
          if (iconTag.hasOwnProperty('gx:x')) {
            cropX = parseInt(iconTag['gx:x']);
          }
          if (iconTag.hasOwnProperty('gx:y')) {
            cropY = cropH - parseInt(iconTag['gx:y']);
          }
          if (iconTag.hasOwnProperty('gx:w')) {
            cropW = parseInt(iconTag['gx:w']);
          }
          if (iconTag.hasOwnProperty('gx:h')) {
            cropH = parseInt(iconTag['gx:h']);
          }
          if (cropX > img.getWidth()) {
            cropX = 0;
            console.error('Pallet X position not valid');
          }
          if (cropY < 0) {
            cropY = 0;
            console.error('Pallet Y position not valid');
          }
          img.crop(cropX, cropY, cropW, cropH);
          if (iconStyle.hasOwnProperty(KMLTAGS.HOTSPOT_TAG)) {
            const hotSpot = iconStyle[KMLTAGS.HOTSPOT_TAG]['$'];
            switch (hotSpot['xunits']) {
              case 'fraction':
                aU = parseFloat(hotSpot['x']);
                break;
              case 'pixels':
                aU = 1 - parseFloat(hotSpot['x']) / img.getWidth();
                break;
              case 'insetPixels':
                aU = parseFloat(hotSpot['x']) / img.getWidth();
              default:
                break;
            }
            switch (hotSpot['yunits']) {
              case 'fraction':
                aV = 1 - parseFloat(hotSpot['y']);
                break;
              case 'pixels':
                aV = 1 - parseFloat(hotSpot['y']) / img.getHeight();
                break;
              case 'insetPixels':
                aV = parseFloat(hotSpot['y']) / img.getHeight();
              default:
                break;
            }
          }
          id = await KMLUtilities.insertIconImageData(img, newIcon, styleTable, aU, aV).catch(e => {
            console.error('error', e);
            return -1;
          });
        }
        resolve({ id: id, newIcon: newIcon });
      }
      reject();
    });
  }

  /**
   * Creates a list of node that need to be processed.
   * @param node Placemark Node from kml via xml-stream
   */
  public static setUpGeometryNodes(node: any, progressCallback?: Function): any[] {
    // console.log(JSON.stringify(node));
    const nodes = [];
    if (progressCallback) {
      progressCallback({
        status: 'Handling Geometry and MultiGeometry',
        data: node,
      });
    }
    if (node.hasOwnProperty(KMLTAGS.GEOMETRY_TAGS.MULTIGEOMETRY)) {
      for (const key in node[KMLTAGS.GEOMETRY_TAGS.MULTIGEOMETRY]) {
        const item = {};
        for (const prop in node) {
          if (prop != KMLTAGS.GEOMETRY_TAGS.MULTIGEOMETRY) {
            item[prop] = node[prop];
          }
        }
        if (node[KMLTAGS.GEOMETRY_TAGS.MULTIGEOMETRY].hasOwnProperty(key)) {
          const shapeType = node[KMLTAGS.GEOMETRY_TAGS.MULTIGEOMETRY][key];
          shapeType.forEach(shape => {
            item[key] = [shape];
            nodes.push({ ...item });
          });
        }
      }
    } else if (!_.isNil(node)) {
      nodes.push(node);
    } else {
      console.error('Placemark node is Nil.');
    }
    return nodes;
  }

  /**
   * Writes and maps MultiGeometries into the database
   * @param geometryIds List of Ids for the item in the Multi geometry
   * @param geopackage Geopackage Database
   * @param multiGeometryTableName Name on the table that stores the id of the MultiGeometry
   * @param relatedTableExtension Used to connect tables.
   * @param multiGeometryMapName Cross reference table (map) between the Geometry table and the MultiGeometry Table
   */
  public static writeMultiGeometry(
    geometryIds: any[],
    geopackage: GeoPackage,
    multiGeometryTableName: string,
    relatedTableExtension: RelatedTablesExtension,
    multiGeometryMapName: string,
  ): void {
    const multiGeometryId = geopackage.addAttributeRow(multiGeometryTableName, {
      number_of_geometries: geometryIds.length,
    });
    const userMappingDao = relatedTableExtension.getMappingDao(multiGeometryMapName);
    for (const id of geometryIds) {
      const userMappingRow = userMappingDao.newRow();
      userMappingRow.baseId = parseInt(id);
      userMappingRow.relatedId = multiGeometryId;
      userMappingDao.create(userMappingRow);
    }
  }
}
