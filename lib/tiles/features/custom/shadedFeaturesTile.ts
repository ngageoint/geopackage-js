// @ts-ignore
import { Canvas } from '../../../canvas/canvas'
import { CustomFeaturesTile } from './customFeaturesTile';

/**
 * Draws a tile which is shaded to indicate too many features. By default a
 * tile border is drawn and the tile is filled with 6.25% transparent black. The
 * paint objects for each draw type can be modified to or set to null (except
 * for the text paint object).
 */
export class ShadedFeaturesTile extends CustomFeaturesTile {
  constructor() {
    super();
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
   * Get the compression format
   * @return {String} the compression format (either png or jpeg)
   */
  getCompressFormat(): string {
    return this.compressFormat;
  }
  /**
   * Set the compression format
   * @param {String} compressFormat either 'png' or 'jpeg'
   */
  setCompressFormat(compressFormat: string): void {
    this.compressFormat = compressFormat;
  }
  /**
   * Draw unindexed tile
   * @param tileWidth
   * @param tileHeight
   * @param canvas
   * @returns {Promise<String|Buffer>}
   */
  async drawUnindexedTile(
    tileWidth: number,
    tileHeight: number,
    canvas: any = null,
  ): Promise<string | Buffer | Uint8Array> {
    let image = null;
    if (this.drawUnindexedTiles) {
      // Draw a tile indicating we have no idea if there are features
      // inside.
      // The table is not indexed and more features exist than the max
      // feature count set.
      image = this.drawTile(tileWidth, tileHeight, '?', canvas);
    }
    return image;
  }
  /**
   * Draw a tile with the provided text label in the middle
   * @param {Number} tileWidth
   * @param {Number} tileHeight
   * @param {String} text
   * @param tileCanvas
   * @return {Promise<String|Buffer>}
   */
  async drawTile(
    tileWidth: number,
    tileHeight: number,
    text: string,
    tileCanvas: null,
  ): Promise<string | Buffer | Uint8Array> {
    await Canvas.initializeAdapter();
    return new Promise(resolve => {
      let canvas;
      let dispose = false;
      if (tileCanvas !== undefined && tileCanvas !== null) {
        canvas = tileCanvas;
      } else {
        canvas = Canvas.create(tileWidth, tileHeight);
        dispose = true;
      }
      const context = canvas.getContext('2d');
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
      const result = canvas.toDataURL('image/' + this.compressFormat);
      if (dispose) {
        Canvas.disposeCanvas(canvas);
      }
      resolve(result);
    });
  }
}
