import { CanvasAdapter } from './canvasAdapter';

/**
 * Browser based canvas adapter
 */
export class BrowserCanvasAdapter implements CanvasAdapter {
  private static initialized = false;

  initialize(): Promise<void> {
    return new Promise(resolve => {
      BrowserCanvasAdapter.initialized = true;
      resolve();
    });
  }

  isInitialized(): boolean {
    return BrowserCanvasAdapter.initialized;
  }

  create(width: number, height: number): any {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    return c;
  }

  createImage(data: any, contentType: string): Promise<{image: any, width: number, height: number}> {
    return new Promise((resolve, reject) => {
      let src = data;
      if (data instanceof Buffer) {
        src = 'data:' + contentType + ';base64,' + data.toString('base64');
      }
      const image = new Image();
      image.onload = (): void => {
        resolve({
          image: image,
          width: image.width,
          height: image.height,
        });
      };
      image.onerror = (error: any): void => {
        reject(error);
      };
      image.crossOrigin = 'Anonymous';
      image.src = src;
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
    context.font = fontSize + "px '" + fontFace + "'";
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
    const iconWidth = image.width;
    const iconHeight = image.height;
    const scaledWidth = Math.round(scale * iconWidth);
    const scaledHeight = Math.round(scale * iconHeight);
    const canvas: any = this.create(scaledWidth, scaledHeight);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image.image, 0, 0, iconWidth, iconHeight, 0, 0, scaledWidth, scaledHeight);
    const result = await this.createImage(canvas.toDataURL(), 'image/png');
    this.disposeCanvas(canvas);
    return result;
  }
}
