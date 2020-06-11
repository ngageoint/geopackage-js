import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { BoundingBox } from '@ngageoint/geopackage';
import { imageSize } from 'image-size';
import { ISizeCalculationResult } from 'image-size/dist/types/interface';
import { Canvas, Image } from 'canvas';

export const TILE_SIZE_PX = 256;
export class KMLUtilities {
  public static async getZoomImages(
    canvas: Canvas,
    image: Image,
    imageDim: ISizeCalculationResult,
    naturalScale: number,
    scaleFactor: number,
  ): Promise<any> {
    const scale = Math.pow(2, scaleFactor);

    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    const bufferImages = {};
    for (let i = 0; i < Math.ceil(imageDim.width / (TILE_SIZE_PX * scale)); i++) {
      for (let j = 0; j < Math.ceil(imageDim.height / (TILE_SIZE_PX * scale)); j++) {
        let widthSize = TILE_SIZE_PX * scale;
        let heightSize = TILE_SIZE_PX * scale;
        if ((i + 1) * TILE_SIZE_PX * scale > imageDim.width) {
          widthSize = imageDim.width - i * TILE_SIZE_PX * scale;
        }
        if ((j + 1) * TILE_SIZE_PX * scale > imageDim.height) {
          heightSize = imageDim.height - j * TILE_SIZE_PX * scale;
        }
        console.log(widthSize, heightSize, Math.floor(widthSize / scale), Math.floor(heightSize / scale));
        context.drawImage(
          image,
          // area of Image
          i * TILE_SIZE_PX * scale,
          j * TILE_SIZE_PX * scale,
          widthSize,
          heightSize,
          // area on Canvas
          0,
          0,
          Math.floor(widthSize / scale),
          Math.floor(heightSize / scale),
        );
        // console.log(i, j, i * TILE_SIZE_PX * scale, j * TILE_SIZE_PX * scale, scaleFactor);
        const bufImage = canvas.toBuffer('image/png');
        // fs.writeFile(__dirname + '/temp' + i + '_' + j + '.png', bufImage, 'binary', err => {
        //   if (err) throw err;
        //   console.log('Done?');
        // });
        const dataUrlImage = await canvas.toDataURL('image/png');
        const name = '' + i + ',' + j;
        bufferImages[name] = bufImage;
        context.clearRect(0, 0, TILE_SIZE_PX, TILE_SIZE_PX);
      }
    }
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
