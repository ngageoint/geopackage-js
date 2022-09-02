import { GeoPackageImage } from '../image/geoPackageImage';
import { ImageType } from '../image/imageType';

export interface CanvasAdapter {
  /**
   * Initializes the adapter for use.
   */
  initialize(): Promise<void>;

  /**
   * Returns if the Adapter has been initialized.
   */
  isInitialized(): boolean;

  /**
   * Creates a canvas object
   * @param width
   * @param height
   */
  create(width: number, height: number): any;

  /**
   * Creates an Image object to be used in the context.drawImage function
   * @param data
   * @param contentType
   */
  createImage(data: Uint8Array | Buffer | string | Blob, contentType: string): Promise<GeoPackageImage>;

  /**
   * Scales an image created using this adapter.
   * @param image
   * @param scale
   */
  scaleImage(image: GeoPackageImage, scale: number): Promise<GeoPackageImage>;

  /**
   * Scales an image created using this adapter.
   * @param image
   * @param scaledWidth
   * @param scaledHeight
   */
  scaleImageToDimensions(image: GeoPackageImage, scaledWidth: number, scaledHeight: number): Promise<GeoPackageImage>;

  /**
   * Creates an ImageData object
   * @param width
   * @param height
   */
  createImageData(width, height): ImageData;

  /**
   * Performs any cleanup needed for the specified canvas. The canvas should not be used after calling this function.
   * @param canvas
   */
  disposeCanvas(canvas: any);

  /**
   * Returns the width of the text in the given font face and font size
   * @param context
   * @param fontFace
   * @param fontSize
   * @param text
   */
  measureText(context: any, fontFace: string, fontSize: number, text: string): number;

  /**
   * Draws text centered at the location specified in the canvas rendering context
   * @param context
   * @param text
   * @param location
   * @param fontFace
   * @param fontSize
   * @param fontColor
   */
  drawText(context: any, text: string, location: number[], fontFace: string, fontSize: number, fontColor: string): void;

  /**
   * Converts the canvas to a base64 data url in the format specified
   * @param canvas
   * @param format
   */
  toDataURL(canvas: any, format: string): Promise<string>;

  /**
   * Performs any cleanup needed for the specified image
   * @param image
   */
  disposeImage(image: GeoPackageImage): void;

  /**
   * Writes the image to a buffer
   * @param image
   * @param imageFormat
   * @param compressionQuality
   */
  writeImageToBytes(image: GeoPackageImage, imageFormat: ImageType, compressionQuality: number): Promise<Uint8Array>;

  /**
   * Gets the image as ImageData
   * @param image
   */
  getImageData(image: GeoPackageImage): ImageData;

  /**
   * Draw content of fromCanvas into the toContext
   * @param fromCanvas
   * @param toContext
   */
  mergeCanvas(fromCanvas: any, toContext: any): void;
}
