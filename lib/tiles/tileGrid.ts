/**
 * Tile grid with x and y ranges
 * @module tiles/tileGrid
 * @class
 */
export default class TileGrid {
  constructor(public min_x: number, public max_x: number, public min_y: number, public max_y: number) {
  }
  count(): number {
    return ((this.max_x + 1) - this.min_x) * ((this.max_y + 1) - this.min_y);
  }
  equals(tileGrid: TileGrid): boolean {
    if (!tileGrid)
      return false;
    return this.min_x === tileGrid.min_x
      && this.max_x === tileGrid.max_x
      && this.min_y === tileGrid.min_y
      && this.max_y === tileGrid.max_y;
  }
}