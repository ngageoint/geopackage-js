import { CanvasAdapter } from './canvasAdapter';
import path from 'path';
import fs from 'fs';
import http from 'http';
import CanvasKitInit from '../../canvaskit/canvaskit.js';
import { CanvasUtils } from './canvasUtils';
import { GeoPackageImage } from '../image/geoPackageImage';
import { EmulatedCanvas2D, EmulatedImageData, EncodedImageFormat } from '../../@types/canvaskit';
import { ImageType } from '../image/imageType';
import { GeoPackageException } from '../geoPackageException';

/**
 * Node based canvas creation
 */
export class CanvasKitCanvasAdapter implements CanvasAdapter {
  private static CanvasKit;
  private static initialized = false;

  // default wasm locator
  static canvasKitWasmLocateFile: (filename: string) => string = (filename) => {
    return path.join(__dirname, '..', '..', 'canvaskit', filename);
  };

  // allow user to set the locate file function, if they place it somewhere else
  static setCanvasKitWasmLocateFile(locateFile: (filename: string) => string): void {
    CanvasKitCanvasAdapter.canvasKitWasmLocateFile = locateFile;
  }

  // Let user set CanvasKit from outside this module. i.e. they load it into their context and then pass the CanvasKit object to this adapter.
  static setCanvasKit(CanvasKit): void {
    CanvasKitCanvasAdapter.CanvasKit = CanvasKit;
    CanvasKitCanvasAdapter.initialized = true;
  }

  /**
   * @inheritDoc
   */
  initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        CanvasKitInit({
          locateFile: CanvasKitCanvasAdapter.canvasKitWasmLocateFile,
        })
          .then((CanvasKit) => {
            CanvasKitCanvasAdapter.CanvasKit = CanvasKit;
            CanvasKitCanvasAdapter.initialized = true;
            resolve();
          })
          .catch(() => {
            reject(
              'Failed to load the CanvasKit WebAssembly file at ' +
                CanvasKitCanvasAdapter.canvasKitWasmLocateFile('canvaskit.wasm') +
                '.\nUpdate file locator function using NodeCanvasAdapter.setCanvasKitWasmLocateFile.',
            );
          });
      } catch (e) {
        reject(
          'Failed to load the CanvasKit WebAssembly file at ' +
            CanvasKitCanvasAdapter.canvasKitWasmLocateFile('canvaskit.wasm') +
            '.\nUpdate file locator function using NodeCanvasAdapter.setCanvasKitWasmLocateFile.',
        );
      }
    });
  }

  /**
   * @inheritDoc
   */
  isInitialized(): boolean {
    return CanvasKitCanvasAdapter.initialized;
  }

  /**
   * @inheritDoc
   */
  create(width: number, height: number): EmulatedCanvas2D {
    return CanvasKitCanvasAdapter.CanvasKit.MakeCanvas(width, height);
  }

  /**
   * Supports creating an image from file, base64 encoded image, image data buffer or url
   * @param imageData
   * @param contentType
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createImage(imageData: Uint8Array | Buffer | string | Blob, contentType: string): Promise<GeoPackageImage> {
    let src = imageData;
    let image;
    let width;
    let height;
    try {
      if (typeof imageData === 'string') {
        const imageString = imageData as string;
        if (/^\s*data:/.test(imageData)) {
          src = CanvasUtils.base64toUInt8Array(imageString.split(',')[1]);
        } else if (/^\s*https?:\/\//.test(imageString)) {
          src = await new Promise((resolve, reject) => {
            http.get(imageString, (res) => {
              const data = [];
              if (res.statusCode === 200) {
                res
                  .on('data', function (chunk) {
                    data.push(chunk);
                  })
                  .on('end', function () {
                    resolve(Buffer.concat(data).buffer as Buffer);
                  })
                  .on('error', function (e) {
                    reject(e);
                  });
              } else {
                reject('Code: ' + res.statusCode);
              }
            });
          });
        } else {
          // imageData is a file path
          src = await new Promise((resolve, reject) => {
            fs.readFile(imageData, (e, data) => {
              if (e) {
                reject(e);
              } else {
                resolve(data);
              }
            });
          });
        }
      }
      image = CanvasKitCanvasAdapter.CanvasKit.MakeImageFromEncoded(src);
      if (image != null) {
        width = image.width();
        height = image.height();
      }
    } catch (e) {
      throw new GeoPackageException('Failed to create image.');
    }

    if (image == null) {
      throw new GeoPackageException('Failed to create image.');
    }

    return new GeoPackageImage(image, width, height);
  }

  /**
   * @inheritDoc
   */
  createImageData(width, height): EmulatedImageData {
    return new CanvasKitCanvasAdapter.CanvasKit.ImageData(width, height);
  }

  /**
   * @inheritDoc
   */
  disposeCanvas(canvas: EmulatedCanvas2D): void {
    if (canvas != null) {
      canvas.dispose();
      canvas = null;
    }
  }

  /**
   * @inheritDoc
   */
  measureText(context: any, fontFace: string, fontSize: number, text: string): number {
    const font = new CanvasKitCanvasAdapter.CanvasKit.Font(null, fontSize);
    const ids = font.getGlyphIDs(text);
    const paint = new CanvasKitCanvasAdapter.CanvasKit.Paint();
    paint.setStyle(CanvasKitCanvasAdapter.CanvasKit.PaintStyle.Fill);
    const size = font.getGlyphWidths(ids, paint).reduce(function (a, b) {
      return a + b;
    }, 0);
    paint.delete();
    return size;
  }

  /**
   * @inheritDoc
   */
  drawText(
    context: any,
    text: string,
    location: number[],
    fontFace: string,
    fontSize: number,
    fontColor: string,
  ): void {
    context.save();
    context.fillStyle = fontColor;
    context.font = fontSize + "px '" + fontFace + "'";
    context.textBaseline = 'middle';
    const textWidth = this.measureText(context, fontFace, fontSize, text);
    context.fillText(text, location[0] - textWidth / 2, location[1] + fontSize / 4);
    context.restore();
  }

  /**
   * @inheritDoc
   */
  toDataURL(canvas: any, format = 'image/png'): Promise<string> {
    return Promise.resolve(canvas.toDataURL(format));
  }

  /**
   * @inheritDoc
   */
  async scaleImage(image: GeoPackageImage, scale: number): Promise<GeoPackageImage> {
    const scaledWidth = Math.round(scale * image.getWidth());
    const scaledHeight = Math.round(scale * image.getHeight());
    return this.scaleImageToDimensions(image, scaledWidth, scaledHeight);
  }

  /**
   * @inheritDoc
   */
  async scaleImageToDimensions(
    image: GeoPackageImage,
    scaledWidth: number,
    scaledHeight: number,
  ): Promise<GeoPackageImage> {
    const canvas = this.create(scaledWidth, scaledHeight);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image.getImage(), 0, 0, scaledWidth, scaledHeight);
    const result = await this.createImage(await this.toDataURL(canvas, 'image/png'), 'image/png');
    this.disposeCanvas(canvas);
    return result;
  }

  /**
   * @inheritDoc
   */
  disposeImage(image: GeoPackageImage): void {
    if (image != null && image.getImage() && image.getImage().delete != null) {
      try {
        image.getImage().delete();
        image = null;
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * Writes the GeoPackageImage to a buffer
   * @param image
   * @param imageFormat
   * @param compressionQuality
   */
  writeImageToBytes(image: GeoPackageImage, imageFormat: ImageType, compressionQuality: number): Promise<Uint8Array> {
    const internalImage = image.getImage();
    return Promise.resolve(internalImage.encodeToBytes(this.getTypeForImageFormat(imageFormat), compressionQuality));
  }

  /**
   * Gets the image data
   */
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
    const image = fromCanvas.bf.makeImageSnapshot();
    toContext.drawImage(image, 0, 0);
  }

  /**
   * Gets the type for the image format
   * @param imageFormat
   */
  getTypeForImageFormat(imageFormat: ImageType): EncodedImageFormat {
    let type = CanvasKitCanvasAdapter.CanvasKit.ImageFormat.PNG;
    switch (imageFormat) {
      case ImageType.PNG:
        type = CanvasKitCanvasAdapter.CanvasKit.ImageFormat.PNG;
        break;
      case ImageType.JPG:
      case ImageType.JPEG:
        type = CanvasKitCanvasAdapter.CanvasKit.ImageFormat.JPEG;
        break;
      case ImageType.WEBP:
        type = CanvasKitCanvasAdapter.CanvasKit.ImageFormat.WEBP;
        break;
    }
    // need to do something else here
    if (imageFormat === ImageType.TIFF) {
      // TODO: figure out how to encode geotiff
    }

    return type;
  }

  /**
   * Converts the contents drawn in a canvas to a byte array
   * @param canvas
   * @param imageFormat
   * @param compressionQuality
   * @return Promise<Uint8Array>
   */
  async toBytes(canvas: any, imageFormat: ImageType = ImageType.PNG, compressionQuality = 100): Promise<Uint8Array> {
    const image = canvas.bf.makeImageSnapshot();
    return Promise.resolve(image.encodeToBytes(this.getTypeForImageFormat(imageFormat), compressionQuality));
  }
}
