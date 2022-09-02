import { GeoPackageImage } from '../image/geoPackageImage';

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
   * Constructor
   * @param width tile width
   * @param height tile height
   * @param imageOrData tile image
   */
  public constructor(width: number, height: number, imageOrData: GeoPackageImage | Buffer | Uint8Array) {
    this.width = width;
    this.height = height;
    if (imageOrData instanceof GeoPackageImage) {
      this.image = imageOrData as GeoPackageImage;
    } else {
      this.data = imageOrData;
    }
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
   * Get the image
   * @return image
   */
  public getImage(): GeoPackageImage {
    return this.image;
  }

  /**
   * Get image data
   * @return image data
   */
  public getData(): Buffer | Uint8Array {
    return this.data;
  }

  /**
   * Set the image
   * @param image buffered image
   */
  public setImage(image: GeoPackageImage): void {
    this.image = image;
  }

  /**
   * Set the image data
   * @param data image data
   */
  public setData(data: Buffer): void {
    this.data = data;
  }
}
