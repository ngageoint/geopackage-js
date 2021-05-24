import { CanvasAdapter } from './canvasAdapter';
import { CanvasUtils } from './canvasUtils';

/**
 * OffscreenCanvas canvas adapter. This can only run inside a web worker.
 */
export class OffscreenCanvasAdapter implements CanvasAdapter {
  private static initialized = false;

  initialize(): Promise<void> {
    return new Promise(resolve => {
      OffscreenCanvasAdapter.initialized = true;
      resolve();
    });
  }

  isInitialized(): boolean {
    return OffscreenCanvasAdapter.initialized;
  }

  create(width: number, height: number): any {
    return new OffscreenCanvas(width, height);
  }

  createImage(data: any, contentType: string = 'image/png'): Promise<{image: any, width: number, height: number}> {
    return new Promise((resolve, reject) => {
      let blob = data;
      if (data instanceof Buffer || Object.prototype.toString.call(data) === '[object Uint8Array]') {
        blob = new Blob([data], {type: contentType});
      } else if (typeof data === 'string') {
        blob = new Blob([CanvasUtils.base64toUInt8Array(data.split(',')[1])], {type: contentType});
      }
      createImageBitmap(blob).then(image => {
        resolve({
          image: image,
          width: image.width,
          height: image.height,
        });
      }).catch(error => {
        reject(error);
      });
    })
  }

  createImageData(width, height) {
    return new ImageData(width, height);
  }

  disposeCanvas(canvas: any) {
    canvas = null;
  }

  measureText(context: any, fontFace: string, fontSize: number, text: string): number {
    return context.measureText(text).width;
  }

  drawText(context: any, text: string, location: number[], fontFace: string, fontSize: number, fontColor: string) {
    context.save();
    context.font = fontSize + 'px \'' + fontFace + '\'';
    context.fillStyle = fontColor;
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillText(text, location[0], location[1]);
    context.restore();
  }

  async scaleImage(image: { image: any; width: number; height: number }, scale: number): Promise<{ image: any; width: number; height: number }> {
    if (scale === 1.0) {
      return image;
    }
    const scaledWidth = Math.round(scale * image.width);
    const scaledHeight = Math.round(scale * image.height);
    const canvas: any = this.create(scaledWidth, scaledHeight);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image.image, 0, 0, scaledWidth, scaledHeight);
    const result = {
      image: canvas.transferToImageBitmap(),
      width: scaledWidth,
      height: scaledHeight
    };
    this.disposeCanvas(canvas);
    return result;
  }

  toDataURL(canvas: any, format: string = 'image/png'): Promise<string> {
    // @ts-ignore
    return new Promise((resolve) => {
      canvas.convertToBlob({type: format}).then(blob => {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          const result: string = reader.result as string;
          resolve(result)
        });
        reader.readAsDataURL(blob);
      })
    })
  }

  disposeImage(image: {image: any, width: number, height: number}): void {
  }
}
