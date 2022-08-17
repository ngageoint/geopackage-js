/**
 * Tile grid with x and y ranges
 * @module tiles/tileGrid
 * @class
 */
export class TileGrid {
  constructor(public min_x: number, public max_x: number, public min_y: number, public max_y: number) {}

  /**
   * Get count of tiles
   */
  count(): number {
    return (this.max_x + 1 - this.min_x) * (this.max_y + 1 - this.min_y);
  }

  /**
   * Get min x
   */
  public getMinX(): number {
    return this.min_x;
  }

  /**
   * Get max x
   */
  public getMaxX(): number {
    return this.max_x;
  }

  /**
   * Get min y
   */
  public getMinY(): number {
    return this.min_y;
  }

  /**
   * Get max y
   */
  public getMaxY(): number {
    return this.max_y;
  }

  /**
   * Get width
   */
  public getWidth(): number {
    return this.max_x - this.min_x;
  }

  /**
   * Get height
   */
  public getHeight(): number {
    return this.max_y - this.min_y;
  }

  /**
   * Check if tile grids are equal
   * @param tileGrid
   */
  equals(tileGrid: TileGrid): boolean {
    if (!tileGrid) return false;
    return (
      this.min_x === tileGrid.min_x &&
      this.max_x === tileGrid.max_x &&
      this.min_y === tileGrid.min_y &&
      this.max_y === tileGrid.max_y
    );
  }
}
