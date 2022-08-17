import { CanvasAdapter } from './canvasAdapter';

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

  createImage(data: any, contentType: string): Promise<{ image: any; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      let src = data;
      if (data instanceof Buffer || Object.prototype.toString.call(data) === '[object Uint8Array]') {
        src = URL.createObjectURL(new Blob([data], { type: contentType }));
      }
      const image = new Image();
      image.onload = () => {
        const result = {
          image: image,
          width: image.width,
          height: image.height,
        };
        resolve(result);
      };
      image.onerror = (error: any): void => {
        reject(error);
      };
      image.crossOrigin = 'Anonymous';
      image.src = src;
    });
  }

  createImageData(width, height) {
    return new ImageData(width, height);
  }

  disposeCanvas(canvas: any) {
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

  drawText(context: any, text: string, location: number[], fontFace: string, fontSize: number, fontColor: string) {
    context.save();
    context.font = fontSize + 'px' + (fontFace != null ? " '" + fontFace + "'" : '');
    context.fillStyle = fontColor;
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillText(text, location[0], location[1]);
    context.restore();
  }

  async scaleImage(
    image: { image: any; width: number; height: number },
    scale: number,
  ): Promise<{ image: any; width: number; height: number }> {
    if (scale === 1.0) {
      return image;
    }
    const scaledWidth = Math.round(scale * image.width);
    const scaledHeight = Math.round(scale * image.height);
    return this.scaleImageToDimensions(image, scaledWidth, scaledHeight);
  }

  async scaleImageToDimensions(
    image: { image: any; width: number; height: number },
    scaledWidth: number,
    scaledHeight: number,
  ): Promise<{ image: any; width: number; height: number }> {
    const canvas: any = this.create(scaledWidth, scaledHeight);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image.image, 0, 0, scaledWidth, scaledHeight);
    const result = await this.createImage(await this.toDataURL(canvas, 'image/png'), 'image/png');
    this.disposeCanvas(canvas);
    return result;
  }

  toDataURL(canvas: any, format = 'image/png'): Promise<string> {
    return Promise.resolve(canvas.toDataURL(format));
  }

  disposeImage(image: { image: any; width: number; height: number }): void {}
}
