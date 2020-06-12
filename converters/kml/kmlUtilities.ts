import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { BoundingBox } from '@ngageoint/geopackage';
import { imageSize } from 'image-size';
import { ISizeCalculationResult } from 'image-size/dist/types/interface';
import { Canvas, Image, createCanvas } from 'canvas';
import { start } from 'repl';

export const TILE_SIZE_IN_PIXELS = 256;

export class KMLUtilities {
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
    const west = KMLUtilities.long2tile(bbox.maxLongitude, z);
    const east = KMLUtilities.long2tile(bbox.minLongitude, z);
    // console.log('east', east, typeof bbox.maxLongitude, z, west);
    return {
      min: Math.max(0, Math.min(west, east)),
      max: Math.max(0, Math.max(west, east)),
    };
  }
  // Taken from Map Cache Electron
  static calculateYTileRange(bbox: BoundingBox, z: any): { min: number; max: number; current: number } {
    const south = KMLUtilities.lat2tile(bbox.minLatitude, z);
    const north = KMLUtilities.lat2tile(bbox.maxLatitude, z);
    // console.log(south, north);
    return {
      min: Math.max(0, Math.min(south, north)),
      max: Math.max(0, Math.max(south, north)),
      current: Math.max(0, Math.min(south, north)),
    };
  }
  // Taken from Map Cache Electron
  static async iterateAllTilesInExtentForZoomLevels(
    extent: BoundingBox,
    zoomLevels: number[],
    tileCallback: (arg0: { z: any; x: number; y: number }) => Promise<boolean>,
  ): Promise<void> {
    let stop = false;
    for (let i = 0; i < zoomLevels.length && !stop; i++) {
      const z = zoomLevels[i];
      // console.log(z);
      const yRange = KMLUtilities.calculateYTileRange(extent, z);
      // console.log(yRange);
      const xRange = KMLUtilities.calculateXTileRange(extent, z);
      // console.log(xRange);
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
    const tileBounds = {
      north: KMLUtilities.tile2lat(y, z),
      east: KMLUtilities.tile2lon(x + 1, z),
      south: KMLUtilities.tile2lat(y + 1, z),
      west: KMLUtilities.tile2lon(x, z),
    };

    return tileBounds;
  }

  /**
   * Takes in an image and breaks it up into 256x256 tile with appropriate scaling based on the give zoomLevels.
   * @param image node-canvas image object
   * @param zoomLevels Array of zoom level that image tile will be created for
   * @param bbox Image Bounding Box with Lat-Lon
   * @returns Object of buffer Images, were the key is zoomLevelNumber,x,y
   */
  public static async getZoomImages(image: Image, zoomLevels: number[], imageBbox: BoundingBox): Promise<{}> {
    // Set up Canvas to handle the drawing of images.
    const canvas = createCanvas(TILE_SIZE_IN_PIXELS, TILE_SIZE_IN_PIXELS);
    const context = canvas.getContext('2d');

    // Calculate the resolution of the image compared to the Bounding Box
    const pixelsPerLat = (imageBbox.maxLatitude - imageBbox.minLatitude) / image.height;
    const pixelsPerLon = (imageBbox.maxLongitude - imageBbox.minLongitude) / image.width;

    // Create object where resultant image buffer will be stored
    const bufferedImages = {};

    // Handles getting the correct Map tiles
    await KMLUtilities.iterateAllTilesInExtentForZoomLevels(
      imageBbox,
      zoomLevels,
      async (zxy: { z: any; x: number; y: number }): Promise<boolean> => {
        // Clears Canvas
        context.clearRect(0, 0, TILE_SIZE_IN_PIXELS, TILE_SIZE_IN_PIXELS);

        // Gets the Lat - Lon Bounding box for the Map Tile
        const tileBox = this.tileBboxCalculator(zxy.x, zxy.y, zxy.z);

        /*
         * Code below Calculates the section of the image that corresponds to the current Map Tile
         */
        // Calculates distance between the topLeft corner of the image to the topLeft corner of the Map Tile
        const leftSideImageToLeftSideTile = imageBbox.minLongitude - tileBox.west;
        const topSideImageToTopSideTile = imageBbox.maxLatitude - tileBox.north;

        // Calculates where to start the selection (in the Top Left).
        const distanceLeftPixels = Math.max(0, -leftSideImageToLeftSideTile / pixelsPerLon);
        const distanceDownPixels = Math.max(0, topSideImageToTopSideTile / pixelsPerLat);

        // Calculates the intersection of the Image and the Map Tile
        const horizontalIntersect =
          Math.min(imageBbox.maxLongitude, tileBox.east) - Math.max(imageBbox.minLongitude, tileBox.west);
        const verticalIntersect =
          Math.min(imageBbox.maxLatitude, tileBox.north) - Math.max(imageBbox.minLatitude, tileBox.south);

        // Convert overlap in pixel values
        const horizontalImageIntersectPixels = horizontalIntersect / pixelsPerLon;
        const verticalImageIntersectPixels = verticalIntersect / pixelsPerLat;
        // console.log(distanceLeftPixels, distanceDownPixels, horizontalImageIntersectPixels, verticalImageIntersectPixels);

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
          distanceLeftPixels,
          distanceDownPixels,
          horizontalImageIntersectPixels,
          verticalImageIntersectPixels,
          // area on Canvas
          startLeftCanvasPos,
          startTopCanvasPos,
          horizontalCanvasDistance,
          verticalCanvasDistance,
        );
        const bufferedImage = canvas.toBuffer('image/png');
        // const urlImage = canvas.toDataURL('image/png');
        // console.error(urlImage, '\n');
        const name = '' + zxy.z + ',' + zxy.x + ',' + zxy.y;
        bufferedImages[name] = bufferedImage;
        return false;
      },
    );
    return bufferedImages;
  }
  public static getNearestPowerOfTwoUpper(imageDim: ISizeCalculationResult): number {
    return Math.pow(2, Math.ceil(Math.log2(Math.max(imageDim.width, imageDim.height))));
  }
  /**
   * Returns floored scale.
   *  360 / 2^x = y°
   * @param bbox Must be in EPS: 4326
   */
  public static getNaturalScale(bbox: BoundingBox, imageDim: Image): number {
    const widthHeight = this.getWidthAndHeightFromBBox(bbox);
    const tileWidthInDegrees = (256 * widthHeight.width) / imageDim.width;
    // console.log(widthHeight.width, tileWidthInDegrees);
    return Math.floor(Math.log2(360 / tileWidthInDegrees));
  }
  public static getWidthAndHeightFromBBox(bbox: BoundingBox): { width: number; height: number } {
    return {
      height: Math.abs(bbox.maxLatitude - bbox.minLatitude),
      width: Math.abs(bbox.maxLongitude - bbox.minLongitude),
    };
  }
  public static getImageDataUrlFromKMLHref(href: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (href.startsWith('https')) {
        https.get(href, response => {
          if (response.statusCode === 200) {
            let imgBuf = Buffer.alloc(0);
            response.on('data', chunk => {
              imgBuf = Buffer.concat([imgBuf, chunk]);
            });
            response.on('end', () => {
              const data = imgBuf.toString('base64');
              const dataUrl = 'data:image/' + path.extname(href).substring(1) + ';base64,' + data;
              resolve(dataUrl);
            });
          } else {
            console.error('Status Code ', response);
            reject('Status Code ' + response.statusCode + ': ' + response.statusMessage);
          }
        });
      } else if (href.startsWith('http')) {
        http.get(href, response => {
          if (response.statusCode === 200) {
            let imgBuf = Buffer.alloc(0);
            response.on('data', chunk => {
              imgBuf = Buffer.concat([imgBuf, chunk]);
            });
            response.on('end', () => {
              const data = imgBuf.toString('base64');
              const dataUrl = 'data:image/' + path.extname(href).substring(1) + ';base64,' + data;
              resolve(dataUrl);
            });
          } else {
            console.error('Status Code ', response);
            reject('Status Code ' + response.statusCode + ': ' + response.statusMessage);
          }
        });
      } else {
        const fileName = __dirname + '/' + href;
        console.log(fileName);
        const data = fs.readFileSync(fileName).toString('base64');
        const dataUrl = 'data:image/' + path.extname(href).substring(1) + ';base64,' + data;
        resolve(dataUrl);
      }
    });
  }
}
