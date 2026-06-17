/**
 * GeoPackage Progress interface for receiving progress information and handling
 * cancellations
 *
 * @author osbornb
 */
export interface GeoPackageProgress {
  /**
   * Set the max progress value
   *
   * @param max
   *            max value
   */
  setMax(max: number): void;

  /**
   * Add to the total progress
   *
   * @param progress progress made
   */
  addProgress(progress: number): void;

  /**
   * Is the process still active
   * @return true if active, false if canceled
   */
  isActive(): boolean;

  /**
   * Should the progress so far be deleted when canceled ({@link #isActive()}
   * becomes false)
   * @return true to cleanup progress
   */
  cleanupOnCancel(): boolean;
}
