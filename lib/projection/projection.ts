import proj4 from 'proj4';
import { ProjectionConstants } from './projectionConstants';

export class Projection {
  static loadProjection(name: string, definition: string | proj4.ProjectionDefinition): void {
    if (!name || !definition) {
      throw new Error('Invalid projection name/definition');
    }
    if (proj4.defs(name) == null) {
      proj4.defs(name, definition);
    }
  }

  static loadProjections(items: {name: string, definition: string | proj4.ProjectionDefinition}[]): void {
    if (!items) throw new Error('Invalid array of projections');
    for (let i = 0; i < items.length; i++) {
      if (!items[i] || !items[i].name || !items[i].definition) {
        throw new Error('Invalid projection in array. Valid projection {name: string, definition: string}.');
      }
      Projection.loadProjection(items[i].name, items[i].definition);
    }
  }

  static isConverter(x: proj4.Converter | string): x is proj4.Converter {
    return (x as proj4.Converter).forward !== undefined;
  }

  static hasProjection(name: string): proj4.ProjectionDefinition {
    return proj4.defs(name);
  }

  /**
   * Get proj4.Converter
   * @param from - name of from projection
   * @param to - name of to projection
   * @return proj4.Converter
   */
  static getConverter(from: string, to?: string): proj4.Converter {
    if (from != null && proj4(from) == null) {
      throw new Error('Projection ' + from + ' has not been defined.')
    }
    if (to != null && proj4(to) == null) {
      throw new Error('Projection ' + to + ' has not been defined.')
    }
    return proj4(from, to);
  }

  /**
   * Convert coordinates
   * @param from - name of from projection
   * @param to - name of to projection
   * @param coordinates - coordinates
   * @return proj4.Converter
   */
  static convertCoordinates(from: string, to: string, coordinates: any): proj4.Converter {
    if (from != null && proj4(from) == null) {
      throw new Error('Projection ' + from + ' has not been defined.')
    }
    if (to != null && proj4(to) == null) {
      throw new Error('Projection ' + to + ' has not been defined.')
    }
    return proj4(from, to, coordinates);
  }

  static getEPSGConverter(epsgId: number): proj4.Converter {
    return proj4(ProjectionConstants.EPSG_PREFIX + epsgId);
  }

  static getWebMercatorToWGS84Converter(): proj4.Converter {
    return proj4(ProjectionConstants.EPSG_3857);
  }
}
