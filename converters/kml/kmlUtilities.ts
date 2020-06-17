import * as KMLTAGS from './KMLTags.js';
import { error } from 'console';
import _ from 'lodash';

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

  public static getKmlInnerFields(node): any[] {
    console.log('getKMLInnerFields:', node);
    const props = [];
    node.forEach(element => {
      for (const subProp in element) {
        props.push(subProp);
      }
    });
    console.log(props);
    return props;
  }
  public static getKmlInnerFieldsValue(node, props): {} {
    node.forEach(element => {
      for (const subProp in element) {
        if (
          _.findKey(KMLTAGS.INNER_ITEMS_TO_IGNORE, o => {
            return o === subProp;
          }) === undefined
        ) {
          if (_.isNil(props[subProp])) {
            props[subProp] = [element[subProp]];
          } else {
            props[subProp].push(element[subProp]);
          }
        }
      }
    });
    console.log(props);
    return props;
  }
  public static propsToStrings(props): {} {
    for (const prop in props) {
      props[prop] = props[prop].toString();
    }
    return props;
  }
  public static kmlToGeoJSon(node): any {
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
