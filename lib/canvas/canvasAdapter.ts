export interface CanvasAdapter {
  /**
   * Initializes the adapter for use.
   */
  initialize(): Promise<void>

  /**
   * Returns if the Adapter has been initialized.
   */
  isInitialized(): boolean

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
  createImage(data: any, contentType: string): Promise<{image: any, width: number, height: number}>;

  /**
   * Scales an image created using this adapter.
   * @param image
   * @param scale
   */
  scaleImage(image: {image: any, width: number, height: number}, scale: number): Promise<{image: any, width: number, height: number}>;

  /**
   * Creates an ImageData object
   * @param width
   * @param height
   */
  createImageData(width, height): any;

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
  disposeImage(image: {image: any, width: number, height: number}): void;
}
