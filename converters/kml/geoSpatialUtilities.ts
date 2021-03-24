import * as turf from '@turf/turf';
import { BoundingBox, proj4Defs } from '@ngageoint/geopackage';
import proj4 from 'proj4';
import isNil from 'lodash/isNil';
export const TILE_SIZE_IN_PIXELS = 256;
export const WEB_MERCATOR_MIN_LAT_RANGE = -85.05112877980659;
export const WEB_MERCATOR_MAX_LAT_RANGE = 85.0511287798066;

export class GeoSpatialUtilities {
  /**
   * Finds the Longitude of a tile
   *
   * Taken from Map Cache Electron
   *
   * @static
   * @param {number} x x tile coordinate
   * @param {number} zoom zoom level
   * @returns {number}
   * @memberof GeoSpatialUtilities
   */
  static tile2lon(x: number, zoom: number): number {
    return (x / Math.pow(2, zoom)) * 360 - 180;
  }

  /**
   * Finds the Latitude of a tile
   *
   * Taken from Map Cache Electron
   *
   * @static
   * @param {number} y y tile coordinate
   * @param {number} zoom Zoom level
   * @returns {number}
   * @memberof GeoSpatialUtilities
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
   * @static
   * @param {number} lon longitude in degrees
   * @param {number} zoom Zoom level
   * @returns {number}
   * @memberof GeoSpatialUtilities
   */
  static long2tile(lon: number, zoom: number): number {
    return Math.min(Math.pow(2, zoom) - 1, Math.floor(((lon + 180) / 360) * Math.pow(2, zoom)));
  }


  /**
   * Finds the y position of a tile
   *
   * Taken from Map Cache Electron
   * @static
   * @param {number} lat Latitude in degrees
   * @param {number} zoom Zoom level
   * @returns {number}
   * @memberof GeoSpatialUtilities
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
   * @static
   * @param {BoundingBox} bbox Geopackage Bounding box
   * @param {*} zoom zoom level
   * @returns {{ min: number; max: number }} Max and Min X Tiles
   * @memberof GeoSpatialUtilities
   */
  static calculateXTileRange(bbox: BoundingBox, zoom: any): { min: number; max: number } {
    const west = this.long2tile(bbox.maxLongitude, zoom);
    const east = this.long2tile(bbox.minLongitude, zoom);
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
   * @static
   * @param {BoundingBox} Geopackage Bounding box
   * @param {*} zoom zoom level
   * @returns {{ min: number; max: number; current: number }}
   * @memberof GeoSpatialUtilities
   */
  static calculateYTileRange(bbox: BoundingBox, zoom: any): { min: number; max: number; current: number } {
    const south = this.lat2tile(bbox.minLatitude, zoom);
    const north = this.lat2tile(bbox.maxLatitude, zoom);
    return {
      min: Math.max(0, Math.min(south, north)),
      max: Math.max(0, Math.max(south, north)),
      current: Math.max(0, Math.min(south, north)),
    };
  }

  /**
   * Calls function for each tile needed.
   *
   * Taken from Map Cache Electron
   *
   * @static
   * @param {BoundingBox} extent Bounding Box
   * @param {number[]} zoomLevels Array of Zoom Levels
   * @param {(arg0: { z: number; x: number; y: number }) => Promise<boolean>} tileCallback Function that will be called for every tile
   * @returns {Promise<void>}
   * @memberof GeoSpatialUtilities
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
   *
   * @static
   * @param {number} x x tile position
   * @param {number} y y tile position
   * @param {number} zoom zoom level
   * @returns {BoundingBox} Geopackage Bounding box.
   * @memberof GeoSpatialUtilities
   */
  static tileBboxCalculator(x: number, y: number, zoom: number): BoundingBox {
    return new BoundingBox(
      this.tile2lon(x, zoom), // West -> MinLongitude
      this.tile2lon(x + 1, zoom), // East -> MaxLongitude
      this.tile2lat(y + 1, zoom), // South -> MinLatitude
      this.tile2lat(y, zoom), // North -> MaxLatitude
    );
  }

  /**
   * Uses turf to rotate a bounding box.
   *
   * @static
   * @param {BoundingBox} bbox GeoPackage Bounding Box EPSG:4326
   * @param {number} rotation Rotation in degrees; clockwise rotations are negative
   * @returns {BoundingBox} GeoPackage Bounding Box Rotated by given number of degrees
   * @memberof GeoSpatialUtilities
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
   * Returns the floor of the zoom level where 1 image pixel equals 1 tile pixel.
   *  floor(log_2((360 * imageWidth) / (bbox_width * tile_size)))
   * @static
   * @param {BoundingBox} bbox Must be in EPSG:4326
   * @param {number} imageWidth Must be in Pixels
   * @returns {number} zoom level
   * @memberof GeoSpatialUtilities
   */
  public static getNaturalScale(bbox: BoundingBox, imageWidth: number): number {
    const widthHeight = this.getWidthAndHeightFromBBox(bbox);
    return Math.floor(Math.log2((360 * imageWidth) / (widthHeight.width * TILE_SIZE_IN_PIXELS)));
  }

  /**
   * Get height and width of a bounding box
   *
   * @static
   * @param {BoundingBox} bbox geopackage bounding box.
   * @returns {{ width: number; height: number }} Object with width and height
   * @memberof GeoSpatialUtilities
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
   * @static
   * @param {string} currentProjection EPSG:#### string of the current projection
   * @param {BoundingBox} bbox Geopackage Bounding Box
   * @returns {BoundingBox} New Geopackage Bounding Box with the transformed coordinates.
   * @memberof GeoSpatialUtilities
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
    return temp;
  }


  /**
   * Creates a list of zoom level where the number of filled tiles changes.
   *
   * @static
   * @param {BoundingBox} bbox Bounding box after rotation
   * @param {number} naturalScale Zoom level closest to one to one in terms of pixels
   * @returns {Set<number>} A set of zoom levels
   * @memberof GeoSpatialUtilities
   */
  public static getZoomLevels(bbox: BoundingBox, naturalScale: number): Set<number> {
    const levels = new Set<number>();
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
      levels.add(z);
      z -= 2;
    } while (xSize * ySize !== 1 && z > 0);
    return levels;
  }

  /**
   * Expand the bounds to include provided latitude and longitude value.
   *
   * @static
   * @param {BoundingBox} boundingBox Bounding Box to be expanded
   * @param {number} [latitude] Line of latitude to be included the bounding box
   * @param {number} [longitude] Line of longitude to be included the bounding box
   * @param {boolean} [copyBoundingBox=false] Copy the object and return that or mutate and return the original object.
   * @returns {BoundingBox}
   * @memberof GeoSpatialUtilities
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
    if (!isNil(latitude)) {
      if (isNil(boundingBox.minLatitude)) {
        if (isNil(boundingBox.maxLatitude)) {
          boundingBox.minLatitude = latitude;
        } else {
          boundingBox.minLatitude = boundingBox.maxLatitude;
        }
      }
      if (isNil(boundingBox.maxLatitude)) {
        if (isNil(boundingBox.minLatitude)) {
          boundingBox.maxLatitude = latitude;
        } else {
          boundingBox.maxLatitude = boundingBox.minLatitude;
        }
      }
      if (latitude < boundingBox.minLatitude) boundingBox.minLatitude = latitude;
      if (latitude > boundingBox.maxLatitude) boundingBox.maxLatitude = latitude;
    }
    if (!isNil(longitude)) {
      if (isNil(boundingBox.minLongitude)) {
        if (isNil(boundingBox.maxLongitude)) {
          boundingBox.minLongitude = longitude;
        } else {
          boundingBox.minLongitude = boundingBox.maxLongitude;
        }
      }
      if (isNil(boundingBox.maxLongitude)) {
        if (isNil(boundingBox.minLongitude)) {
          boundingBox.maxLongitude = longitude;
        } else {
          boundingBox.maxLongitude = boundingBox.minLongitude;
        }
      }
      if (longitude < boundingBox.minLongitude) boundingBox.minLongitude = longitude;
      if (longitude > boundingBox.maxLongitude) boundingBox.maxLongitude = longitude;
    }
    return boundingBox;
  }
}
