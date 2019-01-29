
/**
 * Tile grid with x and y ranges
 * @module tiles/tileGrid
 * @class
 */
var TileGrid = function(minX, maxX, minY, maxY) {
  this.min_x = minX;
  this.max_x = maxX;
  this.min_y = minY;
  this.max_y = maxY;
}

TileGrid.prototype.count = function () {
  return ((this.max_x + 1) - this.min_x) * ((this.max_y + 1) - this.min_y);
};

TileGrid.prototype.equals = function (tileGrid) {
  if (!tileGrid) return false;
  return this.min_x === tileGrid.min_x
    && this.max_x === tileGrid.max_x
    && this.min_y === tileGrid.min_y
    && this.max_y === tileGrid.max_y;
};

module.exports = TileGrid;
