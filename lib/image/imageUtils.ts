import sizeOf from 'image-size';
import { ISizeCalculationResult } from 'image-size/dist/types/interface';
import { Canvas } from '../canvas/canvas';
import { GeoPackageImage } from './geoPackageImage';
import { ImageType } from './imageType';

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
  public static async getImage(
    data: Uint8Array | Buffer | string,
    contentType = 'image/png',
  ): Promise<GeoPackageImage> {
    return new Promise(resolve => {
      if (data instanceof GeoPackageImage) {
        resolve(data);
      } else {
        Canvas.initializeAdapter()
          .then(() => {
            Canvas.createImage(data, contentType)
              .then(image => {
                resolve(image);
              })
              .catch(e => {
                console.error(e);
                resolve(null);
              });
          })
          .catch(e => {
            console.error(e);
            resolve(null);
          });
      }
    });
  }

  /**
   * Get a scaled image
   * @param {Buffer} data
   * @param {Number} scale
   * @returns {Promise<any>}
   */
  public static async getScaledImage(data: Buffer | string, scale: number): Promise<GeoPackageImage> {
    return new Promise(resolve => {
      ImageUtils.getImage(data)
        .then(image => {
          if (scale === 1.0) {
            resolve(image);
          } else {
            Canvas.scaleImage(image, scale)
              .then(scaledImage => {
                Canvas.disposeImage(image);
                resolve(scaledImage);
              })
              .catch(e => {
                Canvas.disposeImage(image);
                console.error(e);
                resolve(null);
              });
          }
        })
        .catch(e => {
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
  public static async scaleImage(image: any, scaledWidth: number, scaledHeight: number): Promise<GeoPackageImage> {
    return new Promise(resolve => {
      Canvas.scaleImageToDimensions(image, scaledWidth, scaledHeight)
        .then(scaledImage => {
          Canvas.disposeImage(image);
          resolve(scaledImage);
        })
        .catch(e => {
          Canvas.disposeImage(image);
          console.error(e);
          resolve(null);
        });
    });
  }

  /**
   * Converts a base64 image into a binary array and associated mime type
   * @param base64String
   * @private
   */
  private static base64toUInt8Array(base64String: string): Uint8Array {
    const data = base64String.split(',')[1];
    const buffer = Buffer.from(data, 'base64').toString('binary');
    let length = buffer.length;
    const bytes = new Uint8Array(length);

    // Loop and convert.
    while (length--) {
      bytes[length] = buffer.charCodeAt(length);
    }

    return bytes;
  }

  /**
   * Writes a GeoPackage Image to bytes
   * @param image
   * @param imageFormat
   * @param compressionQuality
   * @return Uint8Array
   */
  public static async writeImageToBytes(
    image: GeoPackageImage,
    imageFormat: ImageType,
    compressionQuality: number,
  ): Promise<Uint8Array> {
    return Canvas.writeImageToBytes(image, imageFormat, compressionQuality);
  }

  /**
   * Check if the image is fully transparent, meaning it contains only
   * transparent pixels as an empty image
   *
   * @param data image as GeoPackageImage
   * @param width
   * @param height
   * @return true if fully transparent
   */
  public static async isFullyTransparent(data: Uint8Array | Buffer, width, height): Promise<boolean> {
    let transparent = true;
    let image = await Canvas.createImage(data);
    const imageData = Canvas.getImageData(image);
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const offset = y * width + x;
        transparent = imageData[offset + 3] === 0;
        if (!transparent) {
          break;
        }
      }
      if (!transparent) {
        break;
      }
    }
    Canvas.disposeImage(image);
    return transparent;
  }
}
