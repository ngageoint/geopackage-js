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
        if (scale === 1.0) {
          resolve(image);
        } else {
          Canvas.scaleImage(image, scale).then(scaledImage => {
            Canvas.disposeImage(image);
            resolve(scaledImage)
          }).catch((e) => {
            Canvas.disposeImage(image);
            console.error(e);
            resolve(null);
          })
        }
      }).catch(e => {
        console.error(e);
        resolve(null);
      });
    });
  }

  /**
   * Get a scaled image
   * @param {any} image
   * @param {Number} scaledWidth
   * @param {Number} scaledHeight
   * @returns {Promise<any>}
   */
  public static async scaleImage(image: any, scaledWidth: number, scaledHeight: number): Promise<{image: any, width: number, height: number}> {
    return new Promise((resolve) => {
      Canvas.scaleImageToDimensions(image, scaledWidth, scaledHeight).then(scaledImage => {
        Canvas.disposeImage(image);
        resolve(scaledImage)
      }).catch((e) => {
        Canvas.disposeImage(image);
        console.error(e);
        resolve(null);
      })
    });
  }
}
