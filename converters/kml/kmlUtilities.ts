import * as KMLTAGS from './KMLTags.js';
import _ from 'lodash';
import { BoundingBox, GeoPackage, TileScaling, TileScalingType } from '@ngageoint/geopackage';
import { GeoSpatialUtilities } from './geoSpatialUtilities';
import { ImageUtilities } from './imageUtilities';
import Jimp from 'jimp/*';

export class KMLUtilities {
  /**
   * Converts the KML Color format into rgb 000000 - FFFFFF and opacity 0.0 - 1.0
   * @param abgr KML Color format AABBGGRR alpha (00-FF) blue (00-FF) green (00-FF) red (00-FF)
   */
  public static abgrStringToColorOpacity(abgr: string): { rgb: string; a: number } {
    if (abgr.match(/^[0-9A-Fa-f]{8}$/)) {
      const rgb = abgr.slice(6, 8) + abgr.slice(4, 6) + abgr.slice(2, 4);
      const a = parseInt('0x' + abgr.slice(0, 2)) / 255;
      return { rgb, a };
    } else {
      // console.error('Invalid Color');
      throw new Error('Invalid Color');
    }
  }

  /**
   * Converts KML Ground Overlay into appropriate tile sets.
   * @param node Ground Overlay KML node
   * @param geopackage Geopackage
   */
  public static async handleGroundOverLay(
    node: any,
    geopackage: GeoPackage,
    image: Jimp,
    progressCallback?: Function,
  ): Promise<void> {
    if (progressCallback) progressCallback({ status: 'Setting Up Web Mercator Tile Table' });
    const imageName = node.name;
    let kmlBBox = KMLUtilities.getLatLonBBox(node);

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

    if (progressCallback) progressCallback({ status: 'Setting Up tile Scaling Extension' });
    const tileScalingExt = geopackage.getTileScalingExtension(imageName);
    await tileScalingExt.getOrCreateExtension();
    const ts = new TileScaling();
    ts.scaling_type = TileScalingType.IN_OUT;
    ts.zoom_in = 2;
    // ts.zoom_out = 2;
    tileScalingExt.createOrUpdate(ts);

    if (node.LatLonBox.hasOwnProperty('rotation')) {
      if (progressCallback) progressCallback({ status: 'Rotating Ground Overlay' });
      const rotation = parseFloat(node.LatLonBox.rotation);
      kmlBBox = GeoSpatialUtilities.getKmlBBoxRotation(kmlBBox, rotation);
      image.rotate(rotation);
    }

    if (progressCallback) progressCallback({ status: 'Making 4326 Image fit 3857 bounding Box.' });
    [kmlBBox, image] = await ImageUtilities.truncateImage(kmlBBox, image);

    const naturalScale = GeoSpatialUtilities.getNaturalScale(kmlBBox, image.getWidth());
    const zoomLevels = GeoSpatialUtilities.getZoomLevels(kmlBBox, naturalScale);

    if (progressCallback)
      progressCallback({
        status: 'Inserting Zoomed and transformed images into Geopackage database.',
        data: { naturalScale: naturalScale, zoomLevels: zoomLevels },
      });
    ImageUtilities.insertZoomImages(image, zoomLevels, kmlBBox, geopackage, imageName);
  }

  /**
   * Converts node that contains a LatLonBox tag into a geopackage Bounding box
   * @param node node from KML
   * @returns Geopackage Bounding box.
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
   * @param node KML Placemark node
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
    // console.error('Placemark geometry feature not supported:', node);
    return null;
  }
  /**
   * Takes in a KML Point and returns a GeoJSON formatted object.
   * @param node The data from xmlStream with the selector of Placemark.
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
   * Takes in a KML LineString and returns a GeoJSON formatted object.
   * @param node The data from xmlStream with the selector of Placemark.
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
   * Takes in a KML Polygon and returns a GeoJSON formatted object.
   * @param node The data from xmlStream with the selector of Placemark.
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
      if (node.hasOwnProperty('innerBoundaryIs')) {
        const coordRing = element.innerBoundaryIs.LinearRing[0].coordinates[KMLTAGS.XML_STREAM_CHILDREN_SELECTOR].split(
          /\s+/,
        );
        const coordArray = [];
        coordRing.forEach((elementRing: string) => {
          const coords = elementRing.split(',').map(s => parseFloat(s));
          if (coords.length === 3) {
            coordArray.push([coords[0], coords[1], coords[2]]);
          } else if (coords.length == 2) {
            coordArray.push([coords[0], coords[1]]);
          } else {
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
}
