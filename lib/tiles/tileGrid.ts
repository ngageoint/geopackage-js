/**
 * Tile grid with x and y ranges
 * @module tiles/tileGrid
 * @class
 */
export default class TileGrid {
  min_x: number;
  max_x: number;
  min_y: number;
  max_y: number;
  constructor(minX: number, maxX: number, minY: number, maxY: number) {
    this.min_x = minX;
    this.max_x = maxX;
    this.min_y = minY;
    this.max_y = maxY;
  }
  count() {
    return ((this.max_x + 1) - this.min_x) * ((this.max_y + 1) - this.min_y);
  }
  equals(tileGrid: TileGrid) {
    if (!tileGrid)
      return false;
    return this.min_x === tileGrid.min_x
      && this.max_x === tileGrid.max_x
      && this.min_y === tileGrid.min_y
      && this.max_y === tileGrid.max_y;
  }
}