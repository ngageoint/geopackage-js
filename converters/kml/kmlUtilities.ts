import * as KMLTAGS from './KMLTags.js';
import { error } from 'console';
import _ from 'lodash';
import { BoundingBox, GeoPackage, TileScaling, TileScalingType } from '@ngageoint/geopackage';
import Jimp from 'jimp';
import { GeoSpatialUtilities } from './geoSpatialUtilities';
import { ImageUtilities } from './imageUtilities';
import path from 'path';
export class KMLUtilities {
  /**
   * Converts the KML Color format into rgb 000000 - FFFFFF and opacity 0.0 - 1.0
   * @param abgr KML Color format AABBGGRR alpha (00-FF) blue (00-FF) green (00-FF) red (00-FF)
   */
  public static abgrStringToColorOpacity(abgr: string): { rgb: string; a: number } {
    if (abgr.length === 8) {
      const rgb = abgr.slice(6, 8) + abgr.slice(4, 6) + abgr.slice(2, 4);
      const a = parseInt('0x' + abgr.slice(0, 2)) / 255;
      return { rgb, a };
    } else {
      throw error;
    }
  }

  /**
   * Converts KML Ground Overlay into appropriate tile sets.
   * @param node Ground Overlay KML node
   * @param geopackage Geopackage
   */
  public static async handleGroundOverLay(node: any, geopackage: GeoPackage): Promise<void> {
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

    const tileScalingExt = geopackage.getTileScalingExtension(imageName);
    await tileScalingExt.getOrCreateExtension();
    const ts = new TileScaling();
    ts.scaling_type = TileScalingType.IN_OUT;
    ts.zoom_in = 2;
    // ts.zoom_out = 2;
    tileScalingExt.createOrUpdate(ts);

    // Determines whether the image is local or online.
    const imageLocation = node.Icon.href.startsWith('http') ? node.Icon.href : path.join(__dirname, node.Icon.href);

    // Reads in Image (stored as bitmap)
    let img = await Jimp.read(imageLocation);

    if (node.LatLonBox.hasOwnProperty('rotation')) {
      const rotation = parseFloat(node.LatLonBox.rotation);
      kmlBBox = GeoSpatialUtilities.getKmlBBoxRotation(kmlBBox, rotation);
      img.rotate(rotation);
    }

    [kmlBBox, img] = await ImageUtilities.truncateImage(kmlBBox, img);

    const naturalScale = GeoSpatialUtilities.getNaturalScale(kmlBBox, img.getWidth());
    const zoomLevels = GeoSpatialUtilities.getZoomLevels(kmlBBox, naturalScale);
    ImageUtilities.getZoomImages(img, zoomLevels, kmlBBox, geopackage, imageName);
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
    return null;
  }
  /**
   * Takes in a KML Point and returns a GeoJSON formatted object.
   * @param node The data from xmlStream with the selector of Placemark.
   */
  public static kmlPointToGeoJson(node: any[]): { type: string; coordinates: number[] } {
    let geometryData;
    if (node.length === 1) {
      geometryData = { type: 'Point', coordinates: [] };
    } else {
      geometryData = { type: 'MultiPoint', coordinates: [] };
    }
    node.forEach(point => {
      const coordPoint = point.coordinates.split(',').map(s => parseFloat(s));
      let coordinate: number[];
      if (coordPoint.length === 3) {
        coordinate = [coordPoint[0], coordPoint[1], coordPoint[2]];
      } else {
        coordinate = [coordPoint[0], coordPoint[1]];
      }
      if (node.length === 1) {
        geometryData['coordinates'] = coordinate;
      } else {
        geometryData['coordinates'].push(coordinate);
      }
    });
    return geometryData;
  }

  /**
   * Takes in a KML LineString and returns a GeoJSON formatted object.
   * @param node The data from xmlStream with the selector of Placemark.
   */
  public static kmlLineStringToGeoJson(node: any[]): { type: string; coordinates: number[] } {
    let geometryData;
    if (node.length === 1) {
      geometryData = { type: 'LineString', coordinates: [] };
    } else {
      geometryData = { type: 'MultiLineString', coordinates: [] };
    }
    node.forEach(element => {
      const coordPoints = element.coordinates.split(' ');
      const coordArray = [];
      coordPoints.forEach(element => {
        element = element.split(',').map(s => parseFloat(s));
        if (element.length === 3) {
          coordArray.push([element[0], element[1], element[2]]);
        } else {
          coordArray.push([element[0], element[1]]);
        }
      });
      if (node.length === 1) {
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
  public static kmlPolygonToGeoJson(node: Array<any>): { type: string; coordinates: number[] } {
    let geometryData;
    if (node.length === 1) {
      geometryData = { type: 'Polygon', coordinates: [] };
    } else {
      geometryData = { type: 'MultiPolygon', coordinates: [] };
    }
    node.forEach(element => {
      const coordText = element.outerBoundaryIs.LinearRing[0].coordinates;
      const coordRing = coordText.split(' ');
      const coordArray = [];
      coordRing.forEach(element => {
        element = element.split(',').map(s => parseFloat(s));
        if (element.length === 3) {
          coordArray.push([element[0], element[1], element[2]]);
        } else {
          coordArray.push([element[0], element[1]]);
        }
      });

      const temp = [coordArray];
      if (node.hasOwnProperty('innerBoundaryIs')) {
        const coordText = element.innerBoundaryIs.LinearRing[0].coordinates;
        const coordRing = coordText.split(' ');
        const coordArray = [];
        console.log(coordRing);
        coordRing.forEach(elementRing => {
          elementRing = elementRing.split(',').map(s => parseFloat(s));
          if (elementRing.length === 3) {
            coordArray.push([elementRing[0], elementRing[1], elementRing[2]]);
          } else {
            coordArray.push([elementRing[0], elementRing[1]]);
          }
        });
        temp.push(coordArray);
      }

      if (node.length === 1) {
        geometryData['coordinates'] = temp;
      } else {
        geometryData['coordinates'].push(temp);
      }
    });
    return geometryData;
  }
}
