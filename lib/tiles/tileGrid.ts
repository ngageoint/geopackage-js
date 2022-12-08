/**
 * Tile grid with x and y ranges
 * @module tiles/tileGrid
 * @class
 */
export class TileGrid {
  /**
   * Min x
   */
  private minX: number;

  /**
   * Max x
   */
  private maxX: number;

  /**
   * Min y
   */
  private minY: number;

  /**
   * Max y
   */
  private maxY: number;

  /**
   * Constructor
   * @param minX
   * @param minY
   * @param maxX
   * @param maxY
   */
  constructor(minX: number, minY: number, maxX: number, maxY: number) {
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
}

  /**
   * Get count of tiles
   */
  count(): number {
    return (this.maxX + 1 - this.minX) * (this.maxY + 1 - this.minY);
  }

  /**
   * Get min x
   */
  public getMinX(): number {
    return this.minX;
  }

  /**
   * Get max x
   */
  public getMaxX(): number {
    return this.maxX;
  }

  /**
   * Get min y
   */
  public getMinY(): number {
    return this.minY;
  }

  /**
   * Get max y
   */
  public getMaxY(): number {
    return this.maxY;
  }

  /**
   * Get width
   */
  public getWidth(): number {
    return this.maxX - this.minX;
  }

  /**
   * Get height
   */
  public getHeight(): number {
    return this.maxY - this.minY;
  }

  /**
   * Check if tile grids are equal
   * @param tileGrid
   */
  equals(tileGrid: TileGrid): boolean {
    if (!tileGrid) return false;
    return (
      this.minX === tileGrid.minX &&
      this.maxX === tileGrid.maxX &&
      this.minY === tileGrid.minY &&
      this.maxY === tileGrid.maxY
    );
  }
}
