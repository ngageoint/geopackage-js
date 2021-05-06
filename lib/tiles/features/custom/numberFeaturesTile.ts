// @ts-ignore
import { Canvas } from '../../../canvas/canvas';
import { CustomFeaturesTile } from './customFeaturesTile';

/**
 * Draws a tile indicating the number of features that exist within the tile,
 * visible when zoomed in closer. The number is drawn in the center of the tile
 * and by default is surrounded by a colored circle with border. By default a
 * tile border is drawn and the tile is colored (transparently most likely). The
 * paint objects for each draw type can be modified to or set to null (except
 * for the text paint object).
 */
export class NumberFeaturesTile extends CustomFeaturesTile {
  textSize: number;
  textFont: string;
  textColor: string;
  circleStrokeWidth: number;
  circleBorderColor: string;
  circleFillColor: string;
  circlePaddingPercentage: number;
  defaultFontRegistered: boolean;
  constructor() {
    super();
    this.textSize = 18;
    this.textFont = 'Noto Mono';
    this.textColor = 'rgba(255, 255, 255, 1.0)';
    this.circleStrokeWidth = 3;
    this.circleBorderColor = 'rgba(0, 0, 0, 0.25)';
    this.circleFillColor = 'rgba(0, 0, 0, 1.0)';
    this.circlePaddingPercentage = 0.25;
    this.defaultFontRegistered = false;
  }

  /**
   * Get the text size
   * @return {Number} text size
   */
  getTextSize(): number {
    return this.textSize;
  }
  /**
   * Set the text size
   * @param {Number} textSize text size
   */
  setTextSize(textSize: number): void {
    this.textSize = textSize;
  }
  /**
   * Get the text color
   * @return {String} text color
   */
  getTextColor(): string {
    return this.textColor;
  }
  /**
   * Set the text color
   * @param {String} textColor text color
   */
  setTextColor(textColor: string): void {
    this.textColor = textColor;
  }
  /**
   * Get the circle stroke width
   * @return {Number} circle stroke width
   */
  getCircleStrokeWidth(): number {
    return this.circleStrokeWidth;
  }
  /**
   * Set the circle stroke width
   * @param {Number} circleStrokeWidth circle stroke width
   */
  setCircleStrokeWidth(circleStrokeWidth: number): void {
    this.circleStrokeWidth = circleStrokeWidth;
  }
  /**
   * Get the circle color
   * @return {String} circle color
   */
  getCircleColor(): string {
    return this.circleBorderColor;
  }
  /**
   * Set the circle color
   * @param {String} circleBorderColor circle color
   */
  setCircleColor(circleBorderColor: string): void {
    this.circleBorderColor = circleBorderColor;
  }
  /**
   * Get the circle fill color
   * @return {String} circle fill color
   */
  getCircleFillColor(): string {
    return this.circleFillColor;
  }
  /**
   * Set the circle fill color
   * @param {String} circleFillColor circle fill color
   */
  setCircleFillColor(circleFillColor: string): void {
    this.circleFillColor = circleFillColor;
  }
  /**
   * Get the circle padding percentage around the text
   * @return {Number} circle padding percentage, 0.0 to 1.0
   */
  getCirclePaddingPercentage(): number {
    return this.circlePaddingPercentage;
  }
  /**
   * Set the circle padding percentage to pad around the text, value between
   * 0.0 and 1.0
   * @param {Number} circlePaddingPercentage circle padding percentage
   */
  setCirclePaddingPercentage(circlePaddingPercentage: number): void {
    if (circlePaddingPercentage < 0.0 || circlePaddingPercentage > 1.0) {
      throw new Error('Circle padding percentage must be between 0.0 and 1.0: ' + circlePaddingPercentage);
    }
    this.circlePaddingPercentage = circlePaddingPercentage;
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
    // eslint-disable-next-line complexity
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
      const textWidth = Canvas.measureText(context, this.textFont, this.textSize, text);
      const textHeight = this.textSize;
      // Determine the center of the tile
      const centerX = Math.round(tileWidth / 2.0);
      const centerY = Math.round(tileHeight / 2.0);
      // Draw the circle
      if (this.circleBorderColor != null || this.circleFillColor != null) {
        const diameter = Math.max(textWidth, textHeight);
        let radius = Math.round(diameter / 2.0);
        radius = Math.round(radius + diameter * this.circlePaddingPercentage);
        // Draw the circle
        if (this.circleFillColor != null) {
          context.fillStyle = this.circleFillColor;
          context.beginPath();
          context.arc(centerX, centerY, radius, 0, 2 * Math.PI, true);
          context.closePath();
          context.fill();
        }
        // Draw the circle border
        if (this.circleBorderColor != null) {
          context.strokeStyle = this.circleBorderColor;
          context.lineWidth = this.circleStrokeWidth;
          context.beginPath();
          context.arc(centerX, centerY, radius, 0, 2 * Math.PI, true);
          context.closePath();
          context.stroke();
        }
      }

      Canvas.drawText(context, text, [centerX, centerY], this.textFont, this.textSize, this.textColor);

      const result = canvas.toDataURL('image/' + this.compressFormat);
      if (dispose) {
        Canvas.disposeCanvas(canvas);
      }
      resolve(result);
    });
  }
}
