import { Canvas } from '../../../canvas/canvas';
import { CustomFeaturesTile } from '../customFeaturesTile';
import { GeoPackageImage } from '../../../image/geoPackageImage';
import { FeatureIndexResults } from '../../../features/index/featureIndexResults';
import { EmulatedCanvas2D } from '../../../../@types/canvaskit';
import { FeatureResultSet } from '../../../features/user/featureResultSet';

/**
 * Draws a tile which is shaded to indicate too many features. By default a
 * tile border is drawn and the tile is filled with 6.25% transparent black. The
 * paint objects for each draw type can be modified to or set to null (except
 * for the text paint object).
 */
export class ShadedFeaturesTile implements CustomFeaturesTile {
  /**
   * Tile Border stroke width
   */
  protected tileBorderStrokeWidth: number;

  /**
   * Tile Border color
   */
  protected tileBorderColor: string;

  /**
   * Tile fill color
   */
  protected tileFillColor: string;

  /**
   * Flag indicating whether tiles should be drawn for feature tables that are
   * not indexed
   */
  private drawUnindexedTiles: boolean;

  public constructor() {
    this.drawUnindexedTiles = true;
  }

  /**
   * Get the tile border stroke width
   * @return {Number} tile border stroke width
   */
  getTileBorderStrokeWidth(): number {
    return this.tileBorderStrokeWidth;
  }
  /**
   * Set the tile border stroke width
   *
   * @param {Number} tileBorderStrokeWidth tile border stroke width
   */
  setTileBorderStrokeWidth(tileBorderStrokeWidth: number): void {
    this.tileBorderStrokeWidth = tileBorderStrokeWidth;
  }
  /**
   * Get the tile border color
   * @return {String} tile border color
   */
  getTileBorderColor(): string {
    return this.tileBorderColor;
  }
  /**
   * Set the tile border color
   * @param {String} tileBorderColor tile border color
   */
  setTileBorderColor(tileBorderColor: string): void {
    this.tileBorderColor = tileBorderColor;
  }
  /**
   * Get the tile fill color
   * @return {String} tile fill color
   */
  getTileFillColor(): string {
    return this.tileFillColor;
  }
  /**
   * Set the tile fill color
   * @param {String} tileFillColor tile fill color
   */
  setTileFillColor(tileFillColor: string): void {
    this.tileFillColor = tileFillColor;
  }
  /**
   * Is the draw unindexed tiles option enabled
   * @return {Boolean} true if drawing unindexed tiles
   */
  isDrawUnindexedTiles(): boolean {
    return this.drawUnindexedTiles;
  }
  /**
   * Set the draw unindexed tiles option
   * @param {Boolean} drawUnindexedTiles draw unindexed tiles flag
   */
  setDrawUnindexedTiles(drawUnindexedTiles: boolean): void {
    this.drawUnindexedTiles = drawUnindexedTiles;
  }

  /**
   * Draw unindexed tile
   * @param tileWidth
   * @param tileHeight
   * @param totalFeatureCount
   * @param allFeatureResults
   * @param canvas
   * @returns {Promise<GeoPackageImage>}
   */
  async drawUnindexedTile(
    tileWidth: number,
    tileHeight: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    totalFeatureCount: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    allFeatureResults: FeatureResultSet,
    canvas?: EmulatedCanvas2D | HTMLCanvasElement,
  ): Promise<GeoPackageImage> {
    let image = null;
    if (this.drawUnindexedTiles) {
      // Draw a tile indicating we have no idea if there are features
      // inside.
      // The table is not indexed and more features exist than the max
      // feature count set.
      image = this.drawTile(tileWidth, tileHeight, totalFeatureCount, undefined, canvas);
    }
    return image;
  }
  /**
   * Draw a tile with the provided text label in the middle
   * @param {Number} tileWidth
   * @param {Number} tileHeight
   * @param tileFeatureCount
   * @param featureIndexResults
   * @param canvas
   * @return {Promise<GeoPackageImage>}
   */
  async drawTile(
    tileWidth: number,
    tileHeight: number,
    tileFeatureCount: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    featureIndexResults: FeatureIndexResults,
    canvas?: EmulatedCanvas2D | HTMLCanvasElement,
  ): Promise<GeoPackageImage> {
    await Canvas.initializeAdapter();
    return new Promise((resolve) => {
      let tileCanvas;
      let dispose = false;
      if (canvas !== undefined && canvas !== null) {
        tileCanvas = canvas;
      } else {
        tileCanvas = Canvas.create(tileWidth, tileHeight);
        dispose = true;
      }
      const context = tileCanvas.getContext('2d');
      context.clearRect(0, 0, tileWidth, tileHeight);
      // Draw the tile border
      if (this.tileFillColor !== null) {
        context.fillStyle = this.tileFillColor;
        context.fillRect(0, 0, tileWidth, tileHeight);
      }
      // Draw the tile border
      if (this.tileBorderColor !== null) {
        context.strokeStyle = this.tileBorderColor;
        context.lineWidth = this.tileBorderStrokeWidth;
        context.strokeRect(0, 0, tileWidth, tileHeight);
      }
      Canvas.toDataURL(tileCanvas, 'image/png').then((result) => {
        if (dispose) {
          Canvas.disposeCanvas(tileCanvas);
        }
        resolve(Canvas.createImage(result));
      });
    });
  }
}
