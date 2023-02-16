import { CanvasAdapter } from './canvasAdapter';
import { GeoPackageImage } from '../image/geoPackageImage';
import { ImageType } from '../image/imageType';
import { GeoPackageException } from '../geoPackageException';

/**
 * Canvas Wrapper Class for interacting with HTMLCanvas and CanvasKit
 */
export class Canvas {
  private static adapter: CanvasAdapter = undefined;

  static registerCanvasAdapter(adapter: new () => CanvasAdapter): void {
    Canvas.adapter = new adapter();
  }

  static adapterInitialized(): boolean {
    return Canvas.adapter != null && Canvas.adapter.isInitialized();
  }

  static async initializeAdapter(): Promise<void> {
    if (!Canvas.adapter.isInitialized()) {
      await Canvas.adapter.initialize();
    }
  }

  static checkCanvasAdapter(): void {
    if (!Canvas.adapter) {
      throw new GeoPackageException('Canvas adapter not registered.');
    } else if (!Canvas.adapter.isInitialized()) {
      throw new GeoPackageException('Canvas adapter not initialized.');
    }
  }

  static create(width, height): HTMLCanvasElement {
    Canvas.checkCanvasAdapter();
    return Canvas.adapter.create(width, height);
  }

  static async createImage(data: Uint8Array | Buffer | string, contentType = 'image/png'): Promise<GeoPackageImage> {
    Canvas.checkCanvasAdapter();
    return Canvas.adapter.createImage(data, contentType);
  }

  static createImageData(width, height): ImageData {
    Canvas.checkCanvasAdapter();
    return Canvas.adapter.createImageData(width, height);
  }

  static disposeCanvas(canvas): void {
    Canvas.checkCanvasAdapter();
    Canvas.adapter.disposeCanvas(canvas);
  }

  static measureText(context: CanvasRenderingContext2D, fontFace: string, fontSize: number, text: string): number {
    Canvas.checkCanvasAdapter();
    return Canvas.adapter.measureText(context, fontFace, fontSize, text);
  }

  static drawText(
    context: CanvasRenderingContext2D,
    text: string,
    location: number[],
    fontFace: string,
    fontSize: number,
    fontColor: string,
  ): void {
    Canvas.checkCanvasAdapter();
    return Canvas.adapter.drawText(context, text, location, fontFace, fontSize, fontColor);
  }

  static scaleImage(image: GeoPackageImage, scale: number): Promise<GeoPackageImage> {
    Canvas.checkCanvasAdapter();
    return Canvas.adapter.scaleImage(image, scale);
  }

  static scaleImageToDimensions(
    image: GeoPackageImage,
    scaledWidth: number,
    scaledHeight: number,
  ): Promise<GeoPackageImage> {
    Canvas.checkCanvasAdapter();
    return Canvas.adapter.scaleImageToDimensions(image, scaledWidth, scaledHeight);
  }

  static async toDataURL(canvas, format = 'image/png', quality?: number): Promise<string> {
    Canvas.checkCanvasAdapter();
    return Canvas.adapter.toDataURL(canvas, format, quality);
  }

  static disposeImage(image: GeoPackageImage): void {
    Canvas.checkCanvasAdapter();
    Canvas.adapter.disposeImage(image);
  }

  static writeImageToBytes(
    image: GeoPackageImage,
    imageFormat: ImageType,
    compressionQuality: number,
  ): Promise<Uint8Array> {
    Canvas.checkCanvasAdapter();
    return Canvas.adapter.writeImageToBytes(image, imageFormat, compressionQuality);
  }

  static getImageData(image: GeoPackageImage): ImageData {
    Canvas.checkCanvasAdapter();
    return Canvas.adapter.getImageData(image);
  }
  /**
   * Draw content of fromCanvas into the toContext
   * @param fromCanvas
   * @param toContext
   */
  static mergeCanvas(fromCanvas: any, toContext: any): void {
    Canvas.checkCanvasAdapter();
    return Canvas.adapter.mergeCanvas(fromCanvas, toContext);
  }

  /**
   * Returns the byte array representing the drawn content of a canvas.
   * @param canvas
   * @param imageFormat
   * @param compressionQuality
   */
  static toBytes(
    canvas: any,
    imageFormat: ImageType = ImageType.PNG,
    compressionQuality?: number,
  ): Promise<Uint8Array> {
    return Canvas.adapter.toBytes(canvas, imageFormat, compressionQuality);
  }
}
