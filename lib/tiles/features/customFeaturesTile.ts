import { GeoPackageImage } from '../../image/geoPackageImage';
import { FeatureIndexResults } from '../../features/index/featureIndexResults';
import { FeatureResultSet } from '../../features/user/featureResultSet';
import { EmulatedCanvas2D } from '../../../@types/canvaskit';

/**
 * Custom Feature Tile
 * @constructor
 */
export interface CustomFeaturesTile {
  /**
   * Draw a tile with the provided text label in the middle
   * @param tileWidth tile width to draw
   * @param tileHeight tile height to draw
   * @param tileFeatureCount count of features in the requested tile
   * @param featureIndexResults feature index results
   * @param canvas canvas to draw in
   * @return custom image, or null
   */
  drawTile(
    tileWidth: number,
    tileHeight: number,
    tileFeatureCount: number,
    featureIndexResults: FeatureIndexResults,
    canvas?: HTMLCanvasElement | OffscreenCanvas | EmulatedCanvas2D,
  ): Promise<GeoPackageImage>;

  /**
   * Draw a custom tile when the number of features within the tile is
   * unknown. This is called when a feature table is not indexed and more
   * total features exist than the max per tile.
   *
   * @param tileWidth tile width to draw
   * @param tileHeight tile height to draw
   * @param totalFeatureCount count of total features in the feature table
   * @param allFeatureResults results in a feature result set
   * @param canvas canvas to draw in
   * @return custom image, or null
   */
  drawUnindexedTile(
    tileWidth: number,
    tileHeight: number,
    totalFeatureCount: number,
    allFeatureResults: FeatureResultSet,
    canvas?: HTMLCanvasElement | OffscreenCanvas | EmulatedCanvas2D,
  ): Promise<GeoPackageImage>;
}
