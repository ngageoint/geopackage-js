import { Canvas } from '../canvas/canvas';

/**
 * Image class to wrap HTML Images and CanvasKit Images and ImageBitmaps
 */
export class GeoPackageImage {
  private readonly image: any;
  private readonly width: number;
  private readonly height: number;
  private readonly format: string;
  private imageData: ImageData;

  /**
   * Constructor
   * @param image - Image | HTMLImageElement | ImageBitmap
   * @param width
   * @param height
   * @param format
   */
  constructor(image: any, width: number, height: number, format = 'image/png') {
    this.image = image;
    this.width = width;
    this.height = height;
    this.format = format;
  }

  /**
   * Returns the underlying image object
   */
  public getImage(): any {
    return this.image;
  }

  /**
   * Returns the width
   */
  public getWidth(): number {
    return this.width;
  }

  /**
   * Returns the height
   */
  public getHeight(): number {
    return this.height;
  }

  /**
   * Returns the format
   */
  public getFormat(): string {
    return this.format;
  }

  public getImageData(): ImageData {
    if (this.imageData == null) {
      this.imageData = Canvas.getImageData(this);
    }
    return this.imageData;
  }

  public getPixel(x: number, y: number): number {
    const imageData = this.getImageData().data;
    const offset = y * this.width + x;
    return (
      (imageData[offset + 3] << 24) | (imageData[offset] << 16) | (imageData[offset + 1] << 8) | imageData[offset + 2]
    );
  }

  public isPixelTransparent(x: number, y: number): boolean {
    const imageData = this.getImageData().data;
    const offset = y * this.width + x;
    return imageData[offset + 3] === 0;
  }
}
