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
 * @param {Number} tileWidth
 * @param {Number} tileHeight
 * @param {String} text
 * @param canvas optional canvas
 * @return {Promise<Image>}
 */
CustomFeaturesTile.prototype.drawTile = function(tileWidth, tileHeight, text, canvas) {
  throw new Error('Not Yet Implemented');
};

/**
 * Draw a tile with the provided text label in the middle
 * @param {Number} tileWidth
 * @param {Number} tileHeight
 * @param canvas optional canvas
 * @return {Promise<Image>}
 */
CustomFeaturesTile.prototype.drawUnindexedTile = function(tileWidth, tileHeight, canvas) {
  throw new Error('Not Yet Implemented');
};


module.exports = CustomFeaturesTile;
