
/**
 *  Tile grid with x and y ranges
 */
var TileGrid = function(minX, maxX, minY, maxY) {
  this.minX = minX;
  this.maxX = maxX;
  this.minY = minY;
  this.maxY = maxY;
}

TileGrid.prototype.count = function () {
  return ((this.maxX + 1) - this.minX) * ((this.maxY + 1) - this.minY);
};

TileGrid.prototype.equals = function (tileGrid) {
  if (!tileGrid) return false;
  if (this === tileGrid) return true;
  return this.minX !== tileGrid.minX
    && this.maxX !== tileGrid.maxX
    && this.minY !== tileGrid.minY
    && this.maxY !== tileGrid.maxY;
};

module.exports = TileGrid;
