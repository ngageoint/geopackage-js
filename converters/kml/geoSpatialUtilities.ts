import * as turf from '@turf/turf';
import { BoundingBox, proj4Defs } from '@ngageoint/geopackage';
import proj4 from 'proj4';
import _ from 'lodash';
export const TILE_SIZE_IN_PIXELS = 256;
export const WEB_MERCATOR_MIN_LAT_RANGE = -85.05112877980659;
export const WEB_MERCATOR_MAX_LAT_RANGE = 85.0511287798066;

export class GeoSpatialUtilities {
  /**
   * Finds the Longitude of a tile
   *
   * Taken from Map Cache Electron
   *
   * @param x x coordinate
   * @param zoom zoom level
   */
  static tile2lon(x: number, zoom: number): number {
    return (x / Math.pow(2, zoom)) * 360 - 180;
  }

  /**
   * Finds the Latitude of a tile
   *
   * Taken from Map Cache Electron
   *
   * @param y y coordinate
   * @param zoom Zoom level
   */
  static tile2lat(y: number, zoom: number): number {
    const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, zoom);
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  }

  /**
   * Finds the x position of a tile
   *
   * Taken from Map Cache Electron
   *
   * @param lon longitude in degrees
   * @param z Zoom level
   */
  static long2tile(lon: number, zoom: number): number {
    return Math.min(Math.pow(2, zoom) - 1, Math.floor(((lon + 180) / 360) * Math.pow(2, zoom)));
  }

  /**
   * Finds the y position of a tile
   *
   * Taken from Map Cache Electron
   *
   * @param lat Latitude in degrees
   * @param z Zoom level
   */
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

  /**
   * Calculates the ranges of tile need for a given longitude range.
   *
   * Taken from Map Cache Electron
   *
   * @param bbox Geopackage Bounding box
   * @param zoom zoom level
   */
  static calculateXTileRange(bbox: BoundingBox, zoom: any): { min: number; max: number } {
    const west = this.long2tile(bbox.maxLongitude, zoom);
    const east = this.long2tile(bbox.minLongitude, zoom);
    // console.log('east', east, typeof bbox.maxLongitude, z, west);
    return {
      min: Math.max(0, Math.min(west, east)),
      max: Math.max(0, Math.max(west, east)),
    };
  }

  /**
   * Calculates the ranges of tile need for a given latitude range.
   *
   * Taken from Map Cache Electron
   *
   * @param bbox Geopackage Bounding box
   * @param zoom zoom level
   */
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
    tileCallback: (arg0: { z: number; x: number; y: number }) => Promise<boolean>,
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

  /**
   * Converts tiles to a geopackage Bounding box.
   * @param x x tile position
   * @param y y tile position
   * @param zoom zoom level
   * @returns Geopackage Bounding box.
   */
  static tileBboxCalculator(x: number, y: number, zoom: number): BoundingBox {
    return new BoundingBox(
      this.tile2lon(x, zoom), // West / MinLongitude
      this.tile2lon(x + 1, zoom), // East / MaxLongitude
      this.tile2lat(y + 1, zoom), // South / MinLatitude
      this.tile2lat(y, zoom), // North / MaxLatitude
    );
  }

  /**
   * Uses turf to rotate a bounding box.
   * @param bbox GeoPackage Bounding Box EPSG:4326
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

  /**
   * Converts the Min/Max Latitude and Longitude into EPSG:3857 (Web Mercator)
   *
   * @param currentProjection EPSG:#### string of the current projection
   * @param bbox Geopackage Bounding Box
   * @returns New Geopackage Bounding Box with the transformed coordinates.
   */
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
    let z = Math.round(naturalScale);
    let ySize: number;
    let xSize: number;
    if (naturalScale < 0) {
      z = 0;
    } else if (naturalScale > 20) {
      z = 20;
    }
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
  /**
   * Expand the bounds to include provided latitude and longitude value.
   * @param boundingBox Bounding Box to be expanded
   * @param latitude Line of latitude to be included the bounding box
   * @param longitude Line of longitude to be included the bounding box
   * @param copyBoundingBox Copy the object and return that or mutate and return the original object.
   */
  public static expandBoundingBoxToIncludeLatLonPoint(
    boundingBox: BoundingBox,
    latitude?: number,
    longitude?: number,
    copyBoundingBox = false,
  ): BoundingBox {
    if (copyBoundingBox) {
      boundingBox = new BoundingBox(boundingBox);
    }
    if (!_.isNil(latitude)) {
      if (_.isNil(boundingBox.minLatitude)) boundingBox.minLatitude = latitude;
      if (_.isNil(boundingBox.maxLatitude)) boundingBox.maxLatitude = latitude;
      if (latitude < boundingBox.minLatitude) boundingBox.minLatitude = latitude;
      if (latitude > boundingBox.maxLatitude) boundingBox.maxLatitude = latitude;
    }
    if (!_.isNil(longitude)) {
      if (_.isNil(boundingBox.minLongitude)) boundingBox.minLongitude = longitude;
      if (_.isNil(boundingBox.maxLongitude)) boundingBox.maxLongitude = longitude;
      if (longitude < boundingBox.minLongitude) boundingBox.minLongitude = longitude;
      if (longitude > boundingBox.maxLongitude) boundingBox.maxLongitude = longitude;
    }
    return boundingBox;
  }
}
