import { Canvas } from '../../../canvas/canvas';
import { CustomFeaturesTile } from '../customFeaturesTile';
import { GeoPackageException } from '../../../geoPackageException';
import { FeatureIndexResults } from '../../../features/index/featureIndexResults';
import { GeoPackageImage } from '../../../image/geoPackageImage';
import { FeatureResultSet } from '../../../features/user/featureResultSet';
import { EmulatedCanvas2D } from '../../../../@types/canvaskit';

/**
 * Draws a tile indicating the number of features that exist within the tile,
 * visible when zoomed in closer. The number is drawn in the center of the tile
 * and by default is surrounded by a colored circle with border. By default a
 * tile border is drawn and the tile is colored (transparently most likely). The
 * paint objects for each draw type can be modified to or set to null (except
 * for the text paint object).
 */
export class NumberFeaturesTile implements CustomFeaturesTile {
  /**
   * Text size
   */
  protected textSize: number;

  /**
   * Text font
   */
  protected textFont: string;

  /**
   * Text color
   */
  protected textColor: string;

  /**
   * Circle stroke width
   */
  protected circleStrokeWidth: number;

  /**
   * Circle color
   */
  protected circleColor: string;

  /**
   * Circle fill color
   */
  protected circleFillColor: string;

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
   * The percentage of border to include around the edges of the text in the
   * circle
   */
  private circlePaddingPercentage: number;

  /**
   * Flag indicating whether tiles should be drawn for feature tables that are
   * not indexed
   */
  private drawUnindexedTiles: boolean;

  /**
   * Constructor
   */
  public constructor() {
    // Set the default text values
    this.textSize = 18;
    this.textFont = 'Serif'; // Noto Mono
    this.textColor = 'rgba(255, 255, 255, 1.0)';

    // Set the default circle paint values
    this.circleStrokeWidth = 3.0;
    this.circleColor = 'rgba(0, 0, 0, 0.25)';

    // Set the default circle fill paint values
    this.circleFillColor = 'rgba(0, 0, 0, 1.0)';

    // Set the default tile border paint values
    this.tileBorderStrokeWidth = 2.0;
    this.tileBorderColor = 'rgba(0, 0, 0, 1.0)';

    // Set the default tile fill paint values
    this.tileFillColor = 'rgba(0, 0, 0, 0.0625)';

    // Set the default circle padding percentage
    this.circlePaddingPercentage = 0.25;

    // Set the default draw unindexed tiles value
    this.drawUnindexedTiles = true;
  }

  /**
   * Get the text size
   *
   * @return text size
   */
  public getTextSize(): number {
    return this.textSize;
  }

  /**
   * Set the text size
   * @param textSize text size
   */
  public setTextSize(textSize: number): void {
    this.textSize = textSize;
  }

  /**
   * Get the text color
   * @return text color
   */
  public getTextColor(): string {
    return this.textColor;
  }

  /**
   * Set the text color
   * @param textColor text color
   */
  public setTextColor(textColor: string): void {
    this.textColor = textColor;
  }

  /**
   * Get the circle stroke width
   * @return circle stroke width
   */
  public getCircleStrokeWidth(): number {
    return this.circleStrokeWidth;
  }

  /**
   * Set the circle stroke width
   * @param circleStrokeWidth circle stroke width
   */
  public setCircleStrokeWidth(circleStrokeWidth: number): void {
    this.circleStrokeWidth = circleStrokeWidth;
  }

  /**
   * Get the circle color
   * @return circle color
   */
  public getCircleColor(): string {
    return this.circleColor;
  }

  /**
   * Set the circle color
   * @param circleColor circle color
   */
  public setCircleColor(circleColor: string): void {
    this.circleColor = circleColor;
  }

  /**
   * Get the circle fill color
   * @return circle fill color
   */
  public getCircleFillColor(): string {
    return this.circleFillColor;
  }

  /**
   * Set the circle fill color
   * @param circleFillColor circle fill color
   */
  public setCircleFillColor(circleFillColor: string): void {
    this.circleFillColor = circleFillColor;
  }

  /**
   * Get the circle padding percentage around the text
   * @return circle padding percentage, 0.0 to 1.0
   */
  public getCirclePaddingPercentage(): number {
    return this.circlePaddingPercentage;
  }

  /**
   * Set the circle padding percentage to pad around the text, value between
   * 0.0 and 1.0
   * @param circlePaddingPercentage circle padding percentage
   */
  public setCirclePaddingPercentage(circlePaddingPercentage: number): void {
    if (circlePaddingPercentage < 0.0 || circlePaddingPercentage > 1.0) {
      throw new GeoPackageException(
        'Circle padding percentage must be between 0.0 and 1.0: ' + circlePaddingPercentage,
      );
    }
    this.circlePaddingPercentage = circlePaddingPercentage;
  }

  /**
   * Get the tile border stroke width
   * @return tile border stroke width
   */
  public getTileBorderStrokeWidth(): number {
    return this.tileBorderStrokeWidth;
  }

  /**
   * Set the tile border stroke width
   * @param tileBorderStrokeWidth tile border stroke width
   */
  public setTileBorderStrokeWidth(tileBorderStrokeWidth: number): void {
    this.tileBorderStrokeWidth = tileBorderStrokeWidth;
  }

  /**
   * Get the tile border color
   * @return tile border color
   */
  public getTileBorderColor(): string {
    return this.tileBorderColor;
  }

  /**
   * Set the tile border color
   * @param tileBorderColor tile border color
   */
  public setTileBorderColor(tileBorderColor: string): void {
    this.tileBorderColor = tileBorderColor;
  }

  /**
   * Get the tile fill color
   * @return tile fill color
   */
  public getTileFillColor(): string {
    return this.tileFillColor;
  }

  /**
   * Set the tile fill color
   * @param tileFillColor tile fill color
   */
  public setTileFillColor(tileFillColor: string): void {
    this.tileFillColor = tileFillColor;
  }

  /**
   * Is the draw unindexed tiles option enabled
   * @return true if drawing unindexed tiles
   */
  public isDrawUnindexedTiles(): boolean {
    return this.drawUnindexedTiles;
  }

  /**
   * Set the draw unindexed tiles option
   * @param drawUnindexedTiles draw unindexed tiles flag
   */
  public setDrawUnindexedTiles(drawUnindexedTiles: boolean): void {
    this.drawUnindexedTiles = drawUnindexedTiles;
  }

  /**
   * @inheritDoc
   */
  public async drawTile(
    tileWidth: number,
    tileHeight: number,
    tileFeatureCount: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    featureIndexResults: FeatureIndexResults,
    canvas?: EmulatedCanvas2D | HTMLCanvasElement,
  ): Promise<GeoPackageImage> {
    const featureText = tileFeatureCount.toString();
    return this.drawNumberFeaturesTile(tileWidth, tileHeight, featureText, canvas);
  }

  /**
   * @inheritDoc
   */
  public async drawUnindexedTile(
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
      // Draw a tile indicating we have no idea if there are features inside.
      // The table is not indexed and more features exist than the max feature count set.
      image = this.drawNumberFeaturesTile(tileWidth, tileHeight, '?', canvas);
    }
    return image;
  }
  /**
   * Draw a tile with the provided text label in the middle
   * @param {Number} tileWidth
   * @param {Number} tileHeight
   * @param {String} text
   * @param {EmulatedCanvas2D | HTMLCanvasElement} tileCanvas
   * @return {Promise<String|Buffer>}
   */
  private async drawNumberFeaturesTile(
    tileWidth: number,
    tileHeight: number,
    text: string,
    tileCanvas,
  ): Promise<GeoPackageImage> {
    // eslint-disable-next-line complexity
    await Canvas.initializeAdapter();
    return new Promise((resolve) => {
      const canvasProvided = tileCanvas != null;
      let canvas = tileCanvas;
      if (!canvasProvided) {
        canvas = Canvas.create(tileWidth, tileHeight);
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
      if (this.circleColor != null || this.circleFillColor != null) {
        const diameter = Math.max(textWidth, textHeight);
        let radius = Math.round(diameter / 2.0);
        radius = Math.round(radius + diameter * this.circlePaddingPercentage);

        // Draw the filled circle
        if (this.circleFillColor != null) {
          context.fillStyle = this.circleFillColor;
          context.beginPath();
          context.arc(centerX, centerY, radius, 0, 2 * Math.PI, true);
          context.closePath();
          context.fill();
        }

        // Draw the circle
        if (this.circleColor != null) {
          context.strokeStyle = this.circleColor;
          context.lineWidth = this.circleStrokeWidth;
          context.beginPath();
          context.arc(centerX, centerY, radius, 0, 2 * Math.PI, true);
          context.closePath();
          context.stroke();
        }
      }
      Canvas.drawText(context, text, [centerX, centerY], this.textFont, this.textSize, this.textColor);
      Canvas.toDataURL(canvas, 'image/png').then((result) => {
        Canvas.disposeCanvas(canvas);
        resolve(Canvas.createImage(result));
      });
    });
  }
}
