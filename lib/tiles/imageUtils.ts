import sizeOf from 'image-size';

export class ImageUtils {
  public static readonly isElectron = !!(
    typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf(' electron/') > -1
  );
  public static readonly isNode = typeof process !== 'undefined' && process.version;
  public static readonly useNodeCanvas = ImageUtils.isNode && !ImageUtils.isElectron;

  /**
   * Get image for data
   * @param {Buffer|String} data file data or file path
   * @returns {Object}
   */
  public static getImageSize(data: Buffer | string): any {
    return sizeOf.imageSize(data);
  }

  /**
   * Get image for data
   * @param {Buffer|String} data file data or file path
   * @param {String} contentType
   * @returns {Promise<typeof Image>}
   */
  public static async getImage(data: Buffer | string, contentType = 'image/png'): Promise<any> {
    return new Promise((resolve, reject) => {
      let image;
      if (ImageUtils.useNodeCanvas) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Canvas = require('canvas');
        image = new Canvas.Image();
      } else {
        // eslint-disable-next-line no-undef
        image = new Image();
      }
      image.onload = (): void => {
        resolve(image);
      };
      image.onerror = (error): void => {
        reject(error);
      };
      let src = data;
      if (data instanceof Buffer) {
        src = 'data:' + contentType + ';base64,' + data.toString('base64');
      }
      image.src = src;
    });
  }

  /**
   * Get a scaled image
   * @param {Buffer} data
   * @param {Number} scale
   * @returns {Promise<typeof Image>}
   */
  public static async getScaledImage(data: Buffer | string, scale: number): Promise<any> {
    const image = await ImageUtils.getImage(data);
    return ImageUtils.scaleBitmap(image, scale);
  }

  /**
   * Get a scaled image
   * @param {typeof Image} image
   * @param {Number} scale
   * @returns {Promise<typeof Image>}
   */
  public static async scaleBitmap(image: any, scale: number): Promise<any> {
    if (scale === 1.0) {
      return image;
    } else {
      const iconWidth = image.width;
      const iconHeight = image.height;
      const scaledWidth = Math.round(scale * iconWidth);
      const scaledHeight = Math.round(scale * iconHeight);
      let canvas, img;
      if (ImageUtils.useNodeCanvas) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Canvas = require('canvas');
        canvas = Canvas.createCanvas(scaledWidth, scaledHeight);
        img = new Canvas.Image();
      } else {
        // eslint-disable-next-line no-undef
        canvas = document.createElement('canvas');
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
        // eslint-disable-next-line no-undef
        img = new Image();
      }
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0, iconWidth, iconHeight, 0, 0, scaledWidth, scaledHeight);
      return new Promise(resolve => {
        img.onload = (): void => {
          resolve(img);
        };
        img.src = canvas.toDataURL();
      });
    }
  }
}
