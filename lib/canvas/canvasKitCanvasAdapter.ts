import { CanvasAdapter } from './canvasAdapter';
import path from 'path';
import fs from 'fs';
import http from 'http';
import CanvasKitInit from '../../canvaskit/canvaskit.js';
import { CanvasUtils } from './canvasUtils';

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
  static setCanvasKitWasmLocateFile(locateFile: (filename: string) => string) {
    CanvasKitCanvasAdapter.canvasKitWasmLocateFile = locateFile;
  }

  // Let user set CanvasKit from outside of this module. i.e. they load it into their context and then pass the CanvasKit object to this adapter.
  static setCanvasKit (CanvasKit) {
    CanvasKitCanvasAdapter.CanvasKit = CanvasKit;
    CanvasKitCanvasAdapter.initialized = true;
  }

  initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        CanvasKitInit({
          locateFile: CanvasKitCanvasAdapter.canvasKitWasmLocateFile
        }).then(CanvasKit => {
          CanvasKitCanvasAdapter.CanvasKit = CanvasKit;
          CanvasKitCanvasAdapter.initialized = true;
          resolve();
        }).catch(err => {
          console.error('error initializing CanvasKit:', err);
          if (err instanceof Error) {
            return reject(err);
          }
          reject('Failed to load the CanvasKit WebAssembly file at ' + CanvasKitCanvasAdapter.canvasKitWasmLocateFile('canvaskit.wasm') + '.\nUpdate file locator function using NodeCanvasAdapter.setCanvasKitWasmLocateFile.');
        });
      } catch (e) {
        reject('Failed to load the CanvasKit WebAssembly file at ' + CanvasKitCanvasAdapter.canvasKitWasmLocateFile('canvaskit.wasm') + '.\nUpdate file locator function using NodeCanvasAdapter.setCanvasKitWasmLocateFile.');
      }
    });
  }

  isInitialized(): boolean {
    return CanvasKitCanvasAdapter.initialized;
  }

  create(width: number, height: number): any {
    return CanvasKitCanvasAdapter.CanvasKit.MakeCanvas(width, height);
  }

  /**
   * Supports creating an image from file, base64 encoded image, image data buffer or url
   * @param imageData
   * @param contentType
   */
  async createImage(imageData: any, contentType: string): Promise<{image: any, width: number, height: number}> {
    let src = imageData;
    let image;
    let width;
    let height;
    try {
      if (typeof imageData === 'string') {
        if (/^\s*data:/.test(imageData)) {
          src = CanvasUtils.base64toUInt8Array(imageData.split(',')[1]);
        } else if (/^\s*https?:\/\//.test(imageData)) {
          src = await new Promise((resolve, reject) => {
            http.get(imageData, res => {
              const data = [];
              if (res.statusCode === 200) {
                res.on('data', function(chunk) {
                  data.push(chunk);
                }).on('end', function() {
                  resolve(Buffer.concat(data).buffer);
                }).on('error', function(e) {
                  reject(e);
                });
              } else {
                reject('Code: ' + res.statusCode);
              }
            })
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
            })
          });
        }
      }
      image = CanvasKitCanvasAdapter.CanvasKit.MakeImageFromEncoded(src);
      if (image != null) {
        width = image.width();
        height = image.height();
      }
    } catch (e) {
      throw new Error('Failed to create image.');
    }

    if (image == null) {
      throw new Error('Failed to create image.');
    }

    return {image: image, width: width, height: height};
  }

  createImageData(width, height): any {
    return new CanvasKitCanvasAdapter.CanvasKit.ImageData(width, height);
  }

  disposeCanvas(canvas: any) {
    if (canvas != null) {
      canvas.dispose();
      canvas = null;
    }
  }

  measureText(context: any, fontFace: string, fontSize: number, text: string): number {
    const font = new CanvasKitCanvasAdapter.CanvasKit.Font(null, fontSize);
    const ids = font.getGlyphIDs(text);
    const paint = new CanvasKitCanvasAdapter.CanvasKit.Paint();
    paint.setStyle(CanvasKitCanvasAdapter.CanvasKit.PaintStyle.Fill);
    const size = font.getGlyphWidths(ids, paint).reduce(function(a, b){
      return a + b;
    }, 0);
    paint.delete();
    return size;
  }

  drawText(context: any, text: string, location: number[], fontFace: string, fontSize: number, fontColor: string): void {
    context.save();
    context.fillStyle = fontColor;
    context.font = fontSize + 'px \'' + fontFace + '\'';
    context.textBaseline = 'middle';
    const textWidth = this.measureText(context, fontFace, fontSize, text);
    context.fillText(text, location[0] - textWidth / 2, location[1] + fontSize / 4);
    context.restore();
  }

  toDataURL(canvas: any, format: string = 'image/png'): Promise<string> {
    return Promise.resolve(canvas.toDataURL(format));
  }

  async scaleImage(image: { image: any; width: number; height: number }, scale: number): Promise<{ image: any; width: number; height: number }> {
    const scaledWidth = Math.round(scale * image.width);
    const scaledHeight = Math.round(scale * image.height);
    return this.scaleImageToDimensions(image, scaledWidth, scaledHeight);
  }

  async scaleImageToDimensions(image: { image: any; width: number; height: number }, scaledWidth: number, scaledHeight: number): Promise<{ image: any; width: number; height: number }> {
    const canvas: any = this.create(scaledWidth, scaledHeight);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image.image, 0, 0, scaledWidth, scaledHeight);
    const result = await this.createImage(await this.toDataURL(canvas, 'image/png'), 'image/png');
    this.disposeCanvas(canvas);
    return result;
  }

  disposeImage(image: {image: any, width: number, height: number}): void {
    if (image != null && image.image && image.image.delete) {
      image.image.delete();
      image.image = null;
    }
  }
}
