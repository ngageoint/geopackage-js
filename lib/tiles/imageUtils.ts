import sizeOf from 'image-size';
import { ISizeCalculationResult } from 'image-size/dist/types/interface';
import { Canvas } from '../canvas/canvas';

export class ImageUtils {

  /**
   * Get image for data
   * @param {Buffer|String} data file data or file path
   * @returns {Object}
   */
  public static getImageSize(data: Buffer | string): ISizeCalculationResult {
    return sizeOf.imageSize(data);
  }

  /**
   * Get image for data
   * @param {Buffer|String} data file data or file path
   * @param {String} contentType
   * @returns {Promise<any>}
   */
  public static async getImage(data: Buffer | string, contentType = 'image/png'): Promise<{image: any, width: number, height: number}> {
    return new Promise(resolve => {
      Canvas.initializeAdapter().then(() => {
        Canvas.createImage(data, contentType).then(image => {
          resolve(image);
        }).catch(e => {
          console.error(e);
          resolve(null);
        });
      }).catch(e => {
        console.error(e);
        resolve(null);
      });
    });
  }

  /**
   * Get a scaled image
   * @param {Buffer} data
   * @param {Number} scale
   * @returns {Promise<any>}
   */
  public static async getScaledImage(data: Buffer | string, scale: number): Promise<{image: any, width: number, height: number}> {
    return new Promise((resolve) => {
      ImageUtils.getImage(data).then(image => {
        ImageUtils.scaleBitmap(image, scale).then(scaledImage => resolve(scaledImage)).catch((e) => {
          console.error(e);
          resolve(null);
        })
      }).catch(e => {
        console.error(e);
        resolve(null);
      });
    });
  }

  /**
   * Get a scaled image
   * @param {typeof Image} image
   * @param {Number} scale
   * @returns {Promise<typeof Image>}
   */
  public static async scaleBitmap(image: {image: any, width: number, height: number}, scale: number): Promise<{image: any, width: number, height: number}> {
    return Canvas.scaleImage(image, scale);
  }
}
