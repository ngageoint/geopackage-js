import { GeoPackageTile } from './geoPackageTile';

/**
 * Interface defining the tile retrieval methods
 */
export interface TileRetriever {
  /**
   * Check if there is a tile for the x, y, and zoom
   * @param x  x coordinate
   * @param y y coordinate
   * @param zoom zoom level
   * @return true if a tile exists
   */
  hasTile(x: number, y: number, zoom: number): boolean;

  /**
   * Get a tile from the x, y, and zoom
   * @param x x coordinate
   * @param y y coordinate
   * @param zoom zoom level
   * @return tile with dimensions and bytes
   */
  getTile(x: number, y: number, zoom: number): Promise<GeoPackageTile>;
}
