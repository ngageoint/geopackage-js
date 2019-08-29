/**
 * CustomFeaturesTile module.
 * @module tiles/features/custom
 */


/**
 * Custom Feature Tile
 * @constructor
 */
var CustomFeaturesTile = function() {

};

/**
 * Draw a tile with the provided text label in the middle
 *
 * @param {Number} tileWidth
 * @param {Number} tileHeight
 * @param {String} text
 * @return {Promise<Bitmap>}
 */
CustomFeaturesTile.prototype.drawTile = function(tileWidth, tileHeight, text) {
  throw new Error('Not Yet Implemented');
};

/**
 * Draw a tile with the provided text label in the middle
 *
 * @param {Number} tileWidth
 * @param {Number} tileHeight
 * @return {Promise<Bitmap>}
 */
CustomFeaturesTile.prototype.drawUnindexedTile = function(tileWidth, tileHeight) {
  throw new Error('Not Yet Implemented');
};


module.exports = CustomFeaturesTile;
