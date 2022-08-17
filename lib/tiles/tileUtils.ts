/**
 * Tile utilities and constants
 */
export class TileUtils {
  /**
   * Displayed device-independent pixels
   */
  public static readonly TILE_DP = 256;

  /**
   * Tile pixels for default dpi tiles
   */
  public static readonly TILE_PIXELS_DEFAULT = TileUtils.TILE_DP;

  /**
   * Tile pixels for high dpi tiles
   */
  public static readonly TILE_PIXELS_HIGH = TileUtils.TILE_PIXELS_DEFAULT * 2;

  /**
   * Get the tile side (width and height) dimension based upon the scale
   *
   * @param scale
   *            scale
   * @return default tile length
   */
  public static tileLength(scale: number): number {
    return Math.round(scale * TileUtils.TILE_DP);
  }

  /**
   * Get the tile scale based upon the tile dimensions
   *
   * @param tileWidth
   *            tile width
   * @param tileHeight
   *            tile height
   * @return tile scale
   */
  public static tileScale(tileWidth: number, tileHeight: number): number {
    return TileUtils.tileScaleForLength(Math.min(tileWidth, tileHeight));
  }

  /**
   * Get the tile scale based upon the tile length (width or height)
   * @param tileLength tile length (width or height)
   * @return tile scale
   */
  public static tileScaleForLength(tileLength: number): number {
    return tileLength / TileUtils.TILE_DP;
  }
}
