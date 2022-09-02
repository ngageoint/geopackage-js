import { CanvasAdapter } from './canvasAdapter';
import { GeoPackageImage } from '../image/geoPackageImage';
import { ImageType } from '../image/imageType';
import { CanvasUtils } from './canvasUtils';

/**
 * Browser based canvas adapter
 */
export class HtmlCanvasAdapter implements CanvasAdapter {
  private static initialized = false;

  initialize(): Promise<void> {
    return new Promise(resolve => {
      HtmlCanvasAdapter.initialized = true;
      resolve();
    });
  }

  isInitialized(): boolean {
    return HtmlCanvasAdapter.initialized;
  }

  create(width: number, height: number): any {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    return c;
  }

  createImage(data: Uint8Array | Buffer | string | Blob, contentType: string): Promise<GeoPackageImage> {
    return new Promise((resolve, reject) => {
      let src: string = null;
      if (data instanceof Buffer || Object.prototype.toString.call(data) === '[object Uint8Array]') {
        src = URL.createObjectURL(new Blob([data], { type: contentType }));
      } else if (typeof data === 'string') {
        src = data as string;
      } else if (data instanceof Blob) {
        src = URL.createObjectURL(data as Blob);
      }
      const image = new Image();
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      image.onload = () => {
        const result = new GeoPackageImage(image, image.width, image.height);
        resolve(result);
      };
      image.onerror = (error: any): void => {
        reject(error);
      };
      image.crossOrigin = 'Anonymous';
      image.src = src;
    });
  }

  createImageData(width, height): ImageData {
    return new ImageData(width, height);
  }

  disposeCanvas(canvas: any): void {
    canvas = null;
  }

  measureText(context: any, fontFace: string, fontSize: number, text: string): number {
    context.save();
    context.font = fontSize + 'px' + (fontFace != null ? " '" + fontFace + "'" : '');
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    const width = context.measureText(text).width;
    context.restore();
    return width;
  }

  drawText(
    context: any,
    text: string,
    location: number[],
    fontFace: string,
    fontSize: number,
    fontColor: string,
  ): void {
    context.save();
    context.font = fontSize + 'px' + (fontFace != null ? " '" + fontFace + "'" : '');
    context.fillStyle = fontColor;
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillText(text, location[0], location[1]);
    context.restore();
  }

  async scaleImage(image: GeoPackageImage, scale: number): Promise<GeoPackageImage> {
    if (scale === 1.0) {
      return image;
    }
    const scaledWidth = Math.round(scale * image.getWidth());
    const scaledHeight = Math.round(scale * image.getHeight());
    return this.scaleImageToDimensions(image, scaledWidth, scaledHeight);
  }

  async scaleImageToDimensions(
    image: GeoPackageImage,
    scaledWidth: number,
    scaledHeight: number,
  ): Promise<GeoPackageImage> {
    const canvas: any = this.create(scaledWidth, scaledHeight);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image.getImage(), 0, 0, scaledWidth, scaledHeight);
    const result = await this.createImage(await this.toDataURL(canvas, 'image/png'), 'image/png');
    this.disposeCanvas(canvas);
    return result;
  }

  toDataURL(canvas: any, format = 'image/png'): Promise<string> {
    return Promise.resolve(canvas.toDataURL(format));
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  disposeImage(image: GeoPackageImage): void {}

  writeImageToBytes(image: GeoPackageImage, imageFormat: ImageType, compressionQuality: number): Promise<Uint8Array> {
    const canvas: any = this.create(image.getWidth(), image.getHeight());
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image.getImage(), 0, 0);
    if (imageFormat === ImageType.TIFF) {
      // TODO: do something different
    }
    const dataUrl = canvas.toDataURL(canvas, ImageType.getMimeType(imageFormat), compressionQuality);
    return Promise.resolve(CanvasUtils.base64toUInt8Array(dataUrl));
  }

  getImageData(image: GeoPackageImage): ImageData {
    const canvas = this.create(image.getWidth(), image.getHeight());
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image.getImage(), 0, 0);
    return ctx.getImageData(0, 0, image.getWidth(), image.getHeight());
  }

  /**
   * Draw content of fromCanvas into the toContext
   * @param fromCanvas
   * @param toContext
   */
  mergeCanvas(fromCanvas: any, toContext: any): void {
    toContext.drawImage(fromCanvas, 0, 0);
  }
}
