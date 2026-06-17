import { EmulatedCanvas2D } from '../../../@types/canvaskit';
import { Canvas } from '../../canvas/canvas';
import { GeoPackageTile } from '../geoPackageTile';
import { ImageType } from '../../image/imageType';

/**
 * Feature Tile Canvas for creating layered tiles to draw ordered features.
 * Draw Order: polygons, lines, points, icons
 */
export class FeatureTileCanvas {
  /**
   * Polygon layer index
   */
  private static readonly POLYGON_LAYER = 0;

  /**
   * Line layer index
   */
  private static readonly LINE_LAYER = 1;

  /**
   * Point layer index
   */
  private static readonly POINT_LAYER = 2;

  /**
   * Icon layer index
   */
  private static readonly ICON_LAYER = 3;

  /**
   * Tile width
   */
  private readonly tileWidth: number;

  /**
   * Tile height
   */
  private readonly tileHeight: number;

  /**
   * Canvas
   */
  private canvas: HTMLCanvasElement | EmulatedCanvas2D | OffscreenCanvas = null;

  /**
   * Track if cnvas was provided by user
   * @private
   */
  private userProvidedCanvas = false;

  /**
   * Layered canvas
   */
  private readonly layeredCanvas: HTMLCanvasElement[] | EmulatedCanvas2D[] | OffscreenCanvas[] = [
    null,
    null,
    null,
    null,
  ];

  /**
   * Constructor
   * @param tileWidth tile width
   * @param tileHeight tile height
   * @param canvas user provided canvas (must match size)
   */
  public constructor(
    tileWidth: number,
    tileHeight: number,
    canvas?: HTMLCanvasElement | EmulatedCanvas2D | OffscreenCanvas,
  ) {
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.canvas = canvas;
    if (canvas != null) {
      this.userProvidedCanvas = true;
    }
  }

  /**
   * Get the polygon graphics
   *
   * @return polygon graphics
   */
  public getPolygonCanvas(): HTMLCanvasElement | EmulatedCanvas2D | OffscreenCanvas {
    return this.getCanvas(FeatureTileCanvas.POLYGON_LAYER);
  }

  /**
   * Get the line graphics
   *
   * @return line graphics
   */
  public getLineCanvas(): HTMLCanvasElement | EmulatedCanvas2D | OffscreenCanvas {
    return this.getCanvas(FeatureTileCanvas.LINE_LAYER);
  }

  /**
   * Get the point graphics
   *
   * @return point graphics
   */
  public getPointCanvas(): HTMLCanvasElement | EmulatedCanvas2D | OffscreenCanvas {
    return this.getCanvas(FeatureTileCanvas.POINT_LAYER);
  }

  /**
   * Get the icon canvas
   *
   * @return icon canvas
   */
  public getIconCanvas(): HTMLCanvasElement | EmulatedCanvas2D | OffscreenCanvas {
    return this.getCanvas(FeatureTileCanvas.ICON_LAYER);
  }

  /**
   * Create the final image from the layers, resets the layers
   * @return image
   */
  public async createTile(): Promise<GeoPackageTile> {
    let tile = null;
    let context = null;
    for (let layer = 0; layer < 4; layer++) {
      const layeredCanvas = this.layeredCanvas[layer];
      if (layeredCanvas != null) {
        if (this.canvas == null) {
          this.canvas = Canvas.create(this.tileWidth, this.tileHeight);
          context = this.canvas.getContext('2d');
        }
        Canvas.mergeCanvas(layeredCanvas, context);
        Canvas.disposeCanvas(layeredCanvas);
        this.layeredCanvas[layer] = null;
      }
    }
    if (this.canvas != null && !this.isTransparent(this.canvas)) {
      const data = await Canvas.toBytes(this.canvas, ImageType.PNG);
      if (!this.userProvidedCanvas) {
        Canvas.disposeCanvas(this.canvas);
      }
      tile = new GeoPackageTile(this.tileWidth, this.tileHeight, data, ImageType.PNG);
    }
    return tile;
  }

  /**
   * Checks if the canvas is fully transparent (i.e. blank)
   */
  private isTransparent(canvas): boolean {
    let isTransparent = true;
    const data = canvas.getContext('2d').getImageData(0, 0, this.tileWidth, this.tileHeight).data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] !== 0) {
        isTransparent = false;
        break;
      }
    }
    return isTransparent;
  }

  /**
   * Dispose of the layered graphics and images
   */
  public dispose(): void {
    for (let layer = 0; layer < 4; layer++) {
      const canvas = this.layeredCanvas[layer];
      if (canvas != null) {
        Canvas.disposeCanvas(canvas);
        this.layeredCanvas[layer] = null;
      }
    }
  }

  /**
   * Get the graphics for the layer index
   * @param layer layer index
   * @return graphics
   */
  private getCanvas(layer: number): HTMLCanvasElement | EmulatedCanvas2D | OffscreenCanvas {
    let canvas = this.layeredCanvas[layer];
    if (canvas == null) {
      this.createCanvasForLayer(layer);
      canvas = this.layeredCanvas[layer];
    }
    return canvas;
  }

  /**
   * Create a new empty Image and Canvas
   * @param layer layer index
   */
  private createCanvasForLayer(layer: number): void {
    this.layeredCanvas[layer] = Canvas.create(this.tileWidth, this.tileHeight);
  }
}
