import { GeoPackageProgress } from './geoPackageProgress';

/**
 * GeoPackage Progress interface for receiving zoom level specific progress
 * information and handling cancellations
 */
export interface GeoPackageZoomLevelProgress extends GeoPackageProgress {
  /**
   * Set the max progress value for the zoom level
   * @param zoomLevel zoom level
   * @param max max
   */
  setZoomLevelMax(zoomLevel: number, max: number): void;

  /**
   * Add to the total progress at the zoom level
   * @param zoomLevel zoom level
   * @param progress progress
   */
  addZoomLevelProgress(zoomLevel: number, progress: number): void;
}
