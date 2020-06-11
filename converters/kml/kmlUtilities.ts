import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { BoundingBox } from '@ngageoint/geopackage';
import { imageSize } from 'image-size';
import { ISizeCalculationResult } from 'image-size/dist/types/interface';
import { Canvas, Image } from 'canvas';

export const TILE_SIZE_PX = 256;
export const ZoomLevelWidthLong = [
  360,
  180,
  90,
  45,
  22.5,
  11.25,
  5.625,
  2.813,
  1.406,
  0.703,
  0.352,
  0.176,
  0.088,
  0.044,
  0.022,
  0.011,
  0.005,
  0.003,
  0.001,
  0.0005,
  0.00025,
];
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
    const west = KMLUtilities.long2tile(bbox.minLongitude, z);
    const east = KMLUtilities.long2tile(bbox.maxLongitude, z);
    return {
      min: Math.max(0, Math.min(west, east)),
      max: Math.max(0, Math.max(west, east)),
    };
  }
  // Taken from Map Cache Electron
  static calculateYTileRange(bbox: BoundingBox, z: any): { min: number; max: number; current: number } {
    const south = KMLUtilities.lat2tile(bbox.minLatitude, z);
    const north = KMLUtilities.lat2tile(bbox.maxLatitude, z);
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
      console.log(z);
      const yRange = KMLUtilities.calculateYTileRange(extent, z);
      console.log(yRange);
      const xRange = KMLUtilities.calculateXTileRange(extent, z);
      console.log(xRange);
      for (let x = xRange.min; x <= xRange.max && !stop; x++) {
        for (let y = yRange.min; y <= yRange.max && !stop; y++) {
          stop = await tileCallback({ z, x, y });
        }
      }
    }
  }
  static getZoomLevelResolutionPixelsPerMeter(z: number): number {
    const zoomLevelResolutionsPixelsPerMeter = [
      156412,
      78206,
      39103,
      19551,
      9776,
      4888,
      2444,
      1222,
      610.984,
      305.492,
      152.746,
      76.373,
      38.187,
      19.093,
      9.547,
      4.773,
      2.387,
      1.193,
      0.596,
      0.298,
    ];
    return zoomLevelResolutionsPixelsPerMeter[z];
  }
  // static getZoomLevelResoluiton
  static tileBboxCalculator(x, y, z): { north: number; east: number; south: number; west: number } {
    x = Number(x);
    y = Number(y);
    const tileBounds = {
      north: KMLUtilities.tile2lat(y, z),
      east: KMLUtilities.tile2lon(x + 1, z),
      south: KMLUtilities.tile2lat(y + 1, z),
      west: KMLUtilities.tile2lon(x, z),
    };

    return tileBounds;
  }
  
  public static async getZoomImages(
    canvas: Canvas,
    image: Image,
    imageDim: ISizeCalculationResult,
    naturalScale: number,
    scaleFactor: number,
    bbox: BoundingBox,
  ): Promise<any> {
    const pixelsPerLat = (bbox.maxLatitude - bbox.minLatitude) / imageDim.height;
    const pixelsPerLon = (bbox.maxLongitude - bbox.minLongitude) / imageDim.width;
    console.log(pixelsPerLat, pixelsPerLon);
    const bufferImages = {};
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    await KMLUtilities.iterateAllTilesInExtentForZoomLevels(
      bbox,
      [2, 4, 6, 8, 10, 12, 13],
      async (zxy: { z: any; x: number; y: number }): Promise<boolean> => {
        console.log('zoom:', zxy.z, 'x:', zxy.x, 'y:', zxy.y);
        const tileBox = this.tileBboxCalculator(zxy.x, zxy.y, zxy.z);
        const startHeight = (bbox.maxLatitude - tileBox.north) / pixelsPerLat;
        const startWidth = (bbox.maxLongitude - tileBox.west) / pixelsPerLon;
        const sizeHeight = (tileBox.north - tileBox.south) / pixelsPerLat;
        const sizeWidth = (tileBox.west - tileBox.east) / pixelsPerLat;
        console.log(startWidth, startHeight, sizeWidth, sizeHeight);
        // console.log(this.tileBboxCalculator(zxy.x, zxy.y, zxy.z));

        context.drawImage(
          image,
          // area of Image
          startWidth,
          startHeight,
          sizeWidth,
          sizeHeight,
          // area on Canvas
          0,
          0,
          TILE_SIZE_PX,
          TILE_SIZE_PX,
        );
        const bufImage = canvas.toBuffer('image/png');
        const urlImage = canvas.toDataURL('image/png');
        console.error(urlImage, '\n');
        const name = '' + zxy.z + ',' + zxy.x + ',' + zxy.y;
        bufferImages[name] = bufImage;
        context.clearRect(0, 0, TILE_SIZE_PX, TILE_SIZE_PX);
        return false;
      },
    );
    const scale = Math.pow(2, scaleFactor);

    // for (let i = 0; i < Math.ceil(imageDim.width / (TILE_SIZE_PX * scale)); i++) {
    //   for (let j = 0; j < Math.ceil(imageDim.height / (TILE_SIZE_PX * scale)); j++) {
    //     let widthSize = TILE_SIZE_PX * scale;
    //     let heightSize = TILE_SIZE_PX * scale;
    //     if ((i + 1) * TILE_SIZE_PX * scale > imageDim.width) {
    //       widthSize = imageDim.width - i * TILE_SIZE_PX * scale;
    //     }
    //     if ((j + 1) * TILE_SIZE_PX * scale > imageDim.height) {
    //       heightSize = imageDim.height - j * TILE_SIZE_PX * scale;
    //     }
    //     // console.log(widthSize, heightSize, Math.floor(widthSize / scale), Math.floor(heightSize / scale));
    //     context.drawImage(
    //       image,
    //       // area of Image
    //       i * TILE_SIZE_PX * scale,
    //       j * TILE_SIZE_PX * scale,
    //       widthSize,
    //       heightSize,
    //       // area on Canvas
    //       0,
    //       0,
    //       Math.floor(widthSize / scale),
    //       Math.floor(heightSize / scale),
    //     );
    //     // console.log(i, j, i * TILE_SIZE_PX * scale, j * TILE_SIZE_PX * scale, scaleFactor);
    //     const bufImage = canvas.toBuffer('image/png');
    //     // fs.writeFile(__dirname + '/temp' + i + '_' + j + '.png', bufImage, 'binary', err => {
    //     //   if (err) throw err;
    //     //   console.log('Done?');
    //     // });
    //     const dataUrlImage = await canvas.toDataURL('image/png');
    //     const name = '' + i + ',' + j;
    //     bufferImages[name] = bufImage;
    //     context.clearRect(0, 0, TILE_SIZE_PX, TILE_SIZE_PX);
    //  }
    // }
    return bufferImages;
  }
  public static getNearestPowerOfTwoUpper(imageDim: ISizeCalculationResult): number {
    return Math.pow(2, Math.ceil(Math.log2(Math.max(imageDim.width, imageDim.height))));
  }
  /**
   * Returns floored scale.
   *  360 / 2^x = y°
   * @param bbox Must be in EPS: 4326
   */
  public static getNaturalScale(bbox: BoundingBox, imageDim: ISizeCalculationResult): number {
    const widthHeight = this.getWidthAndHeightFromBBox(bbox);
    const tileWidthInDegrees = (256 * widthHeight.width) / imageDim.width;
    console.log(widthHeight.width, tileWidthInDegrees);
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
            console.error('Status Code', response);
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
            console.error('Status Code', response);
            reject('Status Code ' + response.statusCode + ': ' + response.statusMessage);
          }
        });
      } else {
        const fileName = __dirname + '/tmp/' + href;
        console.log(fileName);
        const data = fs.readFileSync(fileName).toString('base64');
        const dataUrl = 'data:image/' + path.extname(href).substring(1) + ';base64,' + data;
        resolve(dataUrl);
      }
    });
  }
}
