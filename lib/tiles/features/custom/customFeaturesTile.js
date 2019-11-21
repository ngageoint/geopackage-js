/**
 * CustomFeaturesTile module.
 * @module tiles/features/custom
 */
/**
 * Custom Feature Tile
 * @constructor
 */
class CustomFeaturesTile {
  /**
   * Draw a tile with the provided text label in the middle
   * @param {Number} tileWidth
   * @param {Number} tileHeight
   * @param {String} text
   * @param canvas optional canvas
   * @return {Promise<String|Buffer>}
   */
  drawTile(tileWidth, tileHeight, text, canvas) {
    throw new Error('Not Yet Implemented');
  }
  /**
   * Draw a tile with the provided text label in the middle
   * @param {Number} tileWidth
   * @param {Number} tileHeight
   * @param canvas optional canvas
   * @return {Promise<String|Buffer>}
   */
  drawUnindexedTile(tileWidth, tileHeight, canvas) {
    throw new Error('Not Yet Implemented');
  }
}

module.exports = CustomFeaturesTile;
