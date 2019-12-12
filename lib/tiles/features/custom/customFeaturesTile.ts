/**
 * CustomFeaturesTile module.
 * @module tiles/features/custom
 */
/**
 * Custom Feature Tile
 * @constructor
 */
export class CustomFeaturesTile {

  static readonly isElectron = !!(typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf(' electron/') > -1);
  // @ts-ignore
  static readonly isPhantom = !!(typeof window !== 'undefined' && window.callPhantom && window._phantom);
  static readonly isNode = typeof (process) !== 'undefined' && process.version;
  static readonly useNodeCanvas = CustomFeaturesTile.isNode && !CustomFeaturesTile.isPhantom && !CustomFeaturesTile.isElectron;

  /**
   * Draw a tile with the provided text label in the middle
   * @param {Number} tileWidth
   * @param {Number} tileHeight
   * @param {String} text
   * @param canvas optional canvas
   * @return {Promise<String|Buffer>}
   */
  drawTile(tileWidth, tileHeight, text, canvas?: any) {
    throw new Error('Not Yet Implemented');
  }
  /**
   * Draw a tile with the provided text label in the middle
   * @param {Number} tileWidth
   * @param {Number} tileHeight
   * @param canvas optional canvas
   * @return {Promise<String|Buffer>}
   */
  drawUnindexedTile(tileWidth, tileHeight, canvas?: any) {
    throw new Error('Not Yet Implemented');
  }
}