import * as turf from '@turf/turf';
import { BoundingBox, GeoPackage, proj4Defs } from '@ngageoint/geopackage';
import { Image, createCanvas } from 'canvas';
import proj4 from 'proj4';
import { KMLUtilities } from './kmlUtilities';
export const TILE_SIZE_IN_PIXELS = 256;
export const WEB_MERCATOR_MIN_LAT_RANGE = -85.05112877980659;
export const WEB_MERCATOR_MAX_LAT_RANGE = 85.0511287798066;
export class GeoSpatialUtilities {
  // Taken from Map Cache Electron
  static tile2lon(x: number, z: number): number {
    return (x / Math.pow(2, z)) * 360 - 180;
  }

  // Taken from Map Cache Electron
  static tile2lat(y: number, z: number): number {
    const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  }

  // Taken from Map Cache Electron
  static long2tile(lon: number, zoom: number): number {
    return Math.min(Math.pow(2, zoom) - 1, Math.floor(((lon + 180) / 360) * Math.pow(2, zoom)));
  }

  // Taken from Map Cache Electron
  static lat2tile(lat: number, zoom: number): number {
    if (lat < WEB_MERCATOR_MIN_LAT_RANGE) {
      lat = WEB_MERCATOR_MIN_LAT_RANGE;
    } else if (lat > WEB_MERCATOR_MAX_LAT_RANGE) {
      lat = WEB_MERCATOR_MAX_LAT_RANGE;
    }
    return Math.floor(
      ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
        Math.pow(2, zoom),
    );
  }

  // Taken from Map Cache Electron
  static calculateXTileRange(bbox: BoundingBox, z: any): { min: number; max: number } {
    const west = this.long2tile(bbox.maxLongitude, z);
    const east = this.long2tile(bbox.minLongitude, z);
    // console.log('east', east, typeof bbox.maxLongitude, z, west);
    return {
      min: Math.max(0, Math.min(west, east)),
      max: Math.max(0, Math.max(west, east)),
    };
  }

  // Taken from Map Cache Electron
  static calculateYTileRange(bbox: BoundingBox, z: any): { min: number; max: number; current: number } {
    const south = this.lat2tile(bbox.minLatitude, z);
    const north = this.lat2tile(bbox.maxLatitude, z);
    // console.log(south, north);
    return {
      min: Math.max(0, Math.min(south, north)),
      max: Math.max(0, Math.max(south, north)),
      current: Math.max(0, Math.min(south, north)),
    };
  }

  // Taken from Map Cache Electron
  /**
   * Calls function for each tile needed.
   * @param extent Bounding Box
   * @param zoomLevels Array of Zoom Levels
   * @param tileCallback Function that will be called for every tile
   */
  static async iterateAllTilesInExtentForZoomLevels(
    extent: BoundingBox,
    zoomLevels: number[],
    tileCallback: (arg0: { z: any; x: number; y: number }) => Promise<boolean>,
  ): Promise<void> {
    let stop = false;
    for (let i = 0; i < zoomLevels.length && !stop; i++) {
      const z = zoomLevels[i];
      const yRange = this.calculateYTileRange(extent, z);
      // console.log(yRange);
      const xRange = this.calculateXTileRange(extent, z);
      for (let x = xRange.min; x <= xRange.max && !stop; x++) {
        for (let y = yRange.min; y <= yRange.max && !stop; y++) {
          stop = await tileCallback({ z, x, y });
        }
      }
    }
  }

  // Taken From Map Cache Electron
  static tileBboxCalculator(
    x: number,
    y: number,
    z: number,
  ): { north: number; east: number; south: number; west: number } {
    return {
      north: this.tile2lat(y, z),
      east: this.tile2lon(x + 1, z),
      south: this.tile2lat(y + 1, z),
      west: this.tile2lon(x, z),
    };
  }

  /**
   * Uses turf to rotate a bounding box.
   * @param bbox GeoPackage Bounding Box ESPG:4326
   * @param rotation Rotation in degrees North clockwise negative
   * @returns GeoPackage Bounding Box Rotated by given number of degrees
   */
  public static getKmlBBoxRotation(bbox: BoundingBox, rotation: number): BoundingBox {
    // Convert to geoJson polygon format which turf can read.
    // turf rotates and returns a geoJson polygon
    const rotatedPoly = turf.transformRotate(bbox.toGeoJSON().geometry, rotation);
    // Coverts the geoJson polygon to a geoJson bbox
    const rotatedBBox = turf.bbox(rotatedPoly);
    // Converts geoJson bbox into a Geopackage js bounding box.
    const rotMinLongitude = rotatedBBox[0];
    const rotMinLatitude = rotatedBBox[1];
    const rotMaxLongitude = rotatedBBox[2];
    const rotMaxLatitude = rotatedBBox[3];

    return new BoundingBox(rotMinLongitude, rotMaxLongitude, rotMinLatitude, rotMaxLatitude);
  }

  /**
   * Returns floored scale.
   *  360 / 2^x = y°
   * @param bbox Must be in EPSG:4326
   * @param imageWidth Must be in Pixels
   */
  public static getNaturalScale(bbox: BoundingBox, imageWidth: number): number {
    const widthHeight = this.getWidthAndHeightFromBBox(bbox);
    const tileWidthInDegrees = (256 * widthHeight.width) / imageWidth;
    // console.log(widthHeight.width, tileWidthInDegrees);
    return Math.floor(Math.log2(360 / tileWidthInDegrees));
  }

  /**
   * Get height and width of a bounding box
   * @param bbox geopackage bounding box.
   */
  public static getWidthAndHeightFromBBox(bbox: BoundingBox): { width: number; height: number } {
    return {
      height: Math.abs(bbox.maxLatitude - bbox.minLatitude),
      width: Math.abs(bbox.maxLongitude - bbox.minLongitude),
    };
  }


  public static getWebMercatorBoundingBox(currentProjection: string, bbox: BoundingBox): BoundingBox {
    proj4.defs(currentProjection, proj4Defs[currentProjection]);
    proj4.defs(
      'EPSG:3857',
      '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs',
    );
    const converter = proj4('EPSG:4326', 'EPSG:3857');
    const temp = new BoundingBox(bbox);
    if (temp.minLatitude < WEB_MERCATOR_MIN_LAT_RANGE) {
      temp.minLatitude = WEB_MERCATOR_MIN_LAT_RANGE;
    }
    if (temp.maxLatitude > WEB_MERCATOR_MAX_LAT_RANGE) {
      temp.maxLatitude = WEB_MERCATOR_MAX_LAT_RANGE;
    }
    [temp.minLongitude, temp.minLatitude] = converter.forward([temp.minLongitude, temp.minLatitude]);
    [temp.maxLongitude, temp.maxLatitude] = converter.forward([temp.maxLongitude, temp.maxLatitude]);
    // console.log(temp);
    return temp;
  }
  /**
   * Creates a list of zoom level where the number of filled tiles changes.
   * @param bbox Bounding box after rotation
   * @param naturalScale Zoom level closest to one to one in terms of pixels
   * @returns A list of zoom levels
   */
  public static getZoomLevels(bbox: BoundingBox, naturalScale: number): number[] {
    const levels = [];
    let z = naturalScale;
    let ySize: number;
    let xSize: number;
    do {
      const yRange = GeoSpatialUtilities.calculateYTileRange(bbox, z);
      const xRange = GeoSpatialUtilities.calculateXTileRange(bbox, z);
      ySize = yRange.max - yRange.min + 1;
      xSize = xRange.max - xRange.min + 1;
      levels.push(z);
      // console.log('getZoomLevels', yRange.max, yRange.min, xRange.max, xRange.min, xSize, ySize, z, levels);
      z -= 2;
    } while (xSize * ySize !== 1 && z > 0);
    return levels;
  }
}
