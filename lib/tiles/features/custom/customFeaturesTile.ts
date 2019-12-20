/**
 * CustomFeaturesTile module.
 * @module tiles/features/custom
 */
/**
 * Custom Feature Tile
 * @constructor
 */
export abstract class CustomFeaturesTile {

  static readonly isElectron = !!(typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf(' electron/') > -1);
  // @ts-ignore
  static readonly isPhantom = !!(typeof window !== 'undefined' && window.callPhantom && window._phantom);
  static readonly isNode = typeof (process) !== 'undefined' && process.version;
  static readonly useNodeCanvas = CustomFeaturesTile.isNode && !CustomFeaturesTile.isPhantom && !CustomFeaturesTile.isElectron;

  tileBorderStrokeWidth: number;
  tileBorderColor: string;
  tileFillColor: string;
  compressFormat: string;
  drawUnindexedTiles: boolean;

  constructor() {
    this.compressFormat = 'png';
    this.tileBorderStrokeWidth = 2;
    this.tileBorderColor = "rgba(0, 0, 0, 1.0)";
    this.tileFillColor = "rgba(0, 0, 0, 0.0625)";
    this.drawUnindexedTiles = true;
  }

  /**
   * Draw a tile with the provided text label in the middle
   * @param {Number} tileWidth
   * @param {Number} tileHeight
   * @param {String} text
   * @param canvas optional canvas
   * @return {Promise<String|Buffer>}
   */
  abstract drawTile(tileWidth: number, tileHeight: number, text: string, canvas?: any): Promise<string | Buffer>;
  /**
   * Draw a tile with the provided text label in the middle
   * @param {Number} tileWidth
   * @param {Number} tileHeight
   * @param canvas optional canvas
   * @return {Promise<String|Buffer>}
   */
  abstract drawUnindexedTile(tileWidth: number, tileHeight: number, canvas?: any): Promise<string | Buffer>;
}