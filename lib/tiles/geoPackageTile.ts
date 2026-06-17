import { GeoPackageImage } from '../image/geoPackageImage';
import { Canvas } from '../canvas/canvas';
import { ImageType } from '../image/imageType';

/**
 * GeoPackage tile wrapper containing tile dimensions and the image or raw image
 * bytes
 */
export class GeoPackageTile {
  /**
   * Tile width
   */
  public readonly width: number;

  /**
   * Tile height
   */
  public readonly height: number;

  /**
   * Image
   */
  private image: GeoPackageImage;

  /**
   * Image bytes
   */
  private data: Buffer | Uint8Array;

  /**
   * Image format
   */
  private imageFormat: ImageType;

  /**
   * Constructor
   * @param width tile width
   * @param height tile height
   * @param data tile data
   * @param imageFormat tile data format
   */
  public constructor(width: number, height: number, data: Buffer | Uint8Array, imageFormat: ImageType = ImageType.PNG) {
    this.width = width;
    this.height = height;
    this.data = data;
    this.imageFormat = imageFormat;
  }

  /**
   * Get width
   * @return width
   */
  public getWidth(): number {
    return this.width;
  }

  /**
   * Get height
   * @return height
   */
  public getHeight(): number {
    return this.height;
  }

  /**
   * Get a GeoPackageImage for this GeoPackageTile
   * @return {Promise<GeoPackageImage>} image
   */
  public async getGeoPackageImage(): Promise<GeoPackageImage> {
    return await Canvas.createImage(this.getData());
  }

  /**
   * Get image data
   * @return image data
   */
  public getData(): Buffer | Uint8Array {
    return this.data;
  }

  /**
   * Set the image data
   * @param data image data
   */
  public setData(data: Buffer): void {
    this.data = data;
  }

  /**
   * Get the mime type of the data
   */
  public getMimeType(): string {
    return ImageType.getMimeType(this.imageFormat);
  }

  /**
   * Get the image format
   */
  public getImageFormat(): ImageType {
    return this.imageFormat;
  }
}
