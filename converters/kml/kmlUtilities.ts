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
  /**
   * Takes in a KML Point and returns a GeoJSON formatted object.
   * @param node The data from xmlStream with the selector of Placemark.
   */
  public static kmlPointToGeoJson(node: { Point }): { type: string; coordinates: number[] } {
    let geometryData;
    if (node[KMLTAGS.GEOMETRY_TAGS.POINT].length === 1) {
      geometryData = { type: 'Point', coordinates: [] };
    } else {
      geometryData = { type: 'MultiPoint', coordinates: [] };
    }
    node[KMLTAGS.GEOMETRY_TAGS.POINT].forEach(point => {
      const coordPoint = point.coordinates.split(',').map(s => parseFloat(s));
      let coordinate: number[];
      if (coordPoint.length === 3) {
        coordinate = [coordPoint[0], coordPoint[1], coordPoint[2]];
      } else {
        coordinate = [coordPoint[0], coordPoint[1]];
      }
      if (node.Point.length === 1) {
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
  public static kmlLineStringToGeoJson(node: { LineString }): { type: string; coordinates: number[] } {
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
        element = element.split(',').map(s => parseFloat(s));
        if (element.length === 3) {
          coordArray.push([element[0], element[1], element[2]]);
        } else {
          coordArray.push([element[0], element[1]]);
        }
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
  public static kmlPolygonToGeoJson(node: { Polygon }): { type: string; coordinates: number[] } {
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
        element = element.split(',').map(s => parseFloat(s));
        if (element.length === 3) {
          coordArray.push([element[0], element[1], element[2]]);
        } else {
          coordArray.push([element[0], element[1]]);
        }
      });

      const temp = [coordArray];
      if (node[KMLTAGS.GEOMETRY_TAGS.POLYGON].hasOwnProperty('innerBoundaryIs')) {
        const coordText = element.innerBoundaryIs.LinearRing[0].coordinates;
        const coordRing = coordText.split(' ');
        const coordArray = [];
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

      if (node[KMLTAGS.GEOMETRY_TAGS.POLYGON].length === 1) {
        geometryData['coordinates'] = temp;
      } else {
        geometryData['coordinates'].push(temp);
      }
    });
    return geometryData;
  }
}
