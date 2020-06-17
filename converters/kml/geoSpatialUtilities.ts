import * as turf from '@turf/turf';
import { BoundingBox, GeoPackage } from '@ngageoint/geopackage';
import { Image, createCanvas } from 'canvas';
export const TILE_SIZE_IN_PIXELS = 256;
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
  /**
   * Takes in an image and breaks it up into 256x256 tile with appropriate scaling based on the give zoomLevels.
   * @param image node-canvas image object
   * @param zoomLevels Array of zoom level that image tile will be created for
   * @param bbox Image Bounding Box with Lat-Lon
   * @returns Object of buffer Images, were the key is zoomLevelNumber,x,y
   */
  public static async getZoomImages(
    image: Image,
    zoomLevels: number[],
    imageBbox: BoundingBox,
    geopackage: GeoPackage,
    imageName: string,
  ): Promise<void> {
    // Set up Canvas to handle the drawing of images.
    const canvas = createCanvas(TILE_SIZE_IN_PIXELS, TILE_SIZE_IN_PIXELS);
    const context = canvas.getContext('2d');

    // Calculate the resolution of the image compared to the Bounding Box
    const pixelHeightInDegrees = (imageBbox.maxLatitude - imageBbox.minLatitude) / image.height;
    const pixelWidthInDegrees = (imageBbox.maxLongitude - imageBbox.minLongitude) / image.width;

    // Handles getting the correct Map tiles
    await GeoSpatialUtilities.iterateAllTilesInExtentForZoomLevels(
      imageBbox,
      zoomLevels,
      async (zxy: { z: any; x: number; y: number }): Promise<boolean> => {
        // Clears Canvas
        context.clearRect(0, 0, TILE_SIZE_IN_PIXELS, TILE_SIZE_IN_PIXELS);

        // Gets the Lat - Lon Bounding box for the Map Tile
        const tileBox = GeoSpatialUtilities.tileBboxCalculator(zxy.x, zxy.y, zxy.z);

        /*
         * Code below Calculates the section of the image that corresponds to the current Map Tile
         */
        // Calculates distance between the topLeft corner of the image to the topLeft corner of the Map Tile
        const leftSideImageToLeftSideTile = imageBbox.minLongitude - tileBox.west;
        const topSideImageToTopSideTile = imageBbox.maxLatitude - tileBox.north;

        // Calculates where to start the selection (in the Top Left).
        const horizontalStartingPixelOnOriginalImage = Math.max(0, -leftSideImageToLeftSideTile / pixelWidthInDegrees);
        const verticalStartingPixelOnOriginalImage = Math.max(0, topSideImageToTopSideTile / pixelHeightInDegrees);

        // Calculates the intersection of the Image and the Map Tile
        const horizontalIntersect =
          Math.min(imageBbox.maxLongitude, tileBox.east) - Math.max(imageBbox.minLongitude, tileBox.west);
        const verticalIntersect =
          Math.min(imageBbox.maxLatitude, tileBox.north) - Math.max(imageBbox.minLatitude, tileBox.south);

        // Convert overlap in pixel values
        const horizontalImageIntersectPixels = horizontalIntersect / pixelWidthInDegrees;
        const verticalImageIntersectPixels = verticalIntersect / pixelHeightInDegrees;
        // console.log(horizontalStartingPixelOnOriginalImage, verticalStartingPixelOnOriginalImage, horizontalImageIntersectPixels, verticalImageIntersectPixels);

        /*
         * Code below Calculates the size of the section above is on the Canvas. Proportion on Canvas
         */

        // Calculate where the section of the image should start being drawn.
        const startLeftCanvasPos = Math.max(
          0,
          (TILE_SIZE_IN_PIXELS * (imageBbox.minLongitude - tileBox.west)) / (tileBox.east - tileBox.west),
        );
        const startTopCanvasPos = Math.max(
          0,
          (TILE_SIZE_IN_PIXELS * -(imageBbox.maxLatitude - tileBox.north)) / (tileBox.north - tileBox.south),
        );

        // Calculates the how big the image will be on the canvas
        const horizontalCanvasDistance = TILE_SIZE_IN_PIXELS * (horizontalIntersect / (tileBox.east - tileBox.west));
        const verticalCanvasDistance = TILE_SIZE_IN_PIXELS * (verticalIntersect / (tileBox.north - tileBox.south));
        // console.log('Project Pos', zxy.z, horizontalCanvasDistance, verticalCanvasDistance, startLeftCanvasPos, startTopCanvasPos);

        context.drawImage(
          image,
          // area of Image
          horizontalStartingPixelOnOriginalImage,
          verticalStartingPixelOnOriginalImage,
          horizontalImageIntersectPixels,
          verticalImageIntersectPixels,
          // area on Canvas
          startLeftCanvasPos,
          startTopCanvasPos,
          horizontalCanvasDistance,
          verticalCanvasDistance,
        );
        const bufferedImage = canvas.toBuffer('image/png');
        geopackage.addTile(bufferedImage, imageName, zxy.z, zxy.y, zxy.x);
        return false;
      },
    );
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
