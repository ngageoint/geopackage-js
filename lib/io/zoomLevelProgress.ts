import { GeoPackageZoomLevelProgress } from './geoPackageZoomLevelProgress';
import { Progress } from './progress';

/**
 * Progress logger
 */
export class ZoomLevelProgress extends Progress implements GeoPackageZoomLevelProgress {
  /**
   * Zoom level max number of tiles
   */
  private zoomLevelMax: Map<number, number> = new Map();

  /**
   * Zoom level progress
   */
  private zoomLevelProgress: Map<number, number> = new Map();

  /**
   * Current zoom level
   */
  private currentZoom = -1;

  /**
   * Constructor
   * @param title title
   * @param unit unit
   * @param countFrequency count frequency
   * @param timeFrequency time frequency in seconds
   */
  public constructor(title: string, countFrequency: number, timeFrequency: number, unit: string) {
    super(title, countFrequency, timeFrequency, unit);
  }

  /**
   * @inheritDoc
   */
  public setZoomLevelMax(zoomLevel: number, max: number): void {
    this.zoomLevelMax.set(zoomLevel, max);
  }

  /**
   * @inheritDoc
   */
  protected logProgress(): void {
    const zoomCount = this.getZoomLevelProgress(this.currentZoom);
    const zoomTotal = this.getZoomLevelMax(this.currentZoom);
    console.info(
      this.title +
        ' - ' +
        this.progress +
        ' of ' +
        this.max +
        this.unit +
        ' (' +
        this.getPercentage(this.progress, this.max) +
        '), Zoom ' +
        this.currentZoom +
        ' - ' +
        zoomCount +
        ' of ' +
        zoomTotal +
        this.unit +
        ' (' +
        this.getPercentage(zoomCount, zoomTotal) +
        ')',
    );
  }

  /**
   * @inheritDoc
   */
  public addZoomLevelProgress(zoomLevel: number, progress: number): void {
    let zoomProgress = this.getZoomLevelProgress(zoomLevel);
    zoomProgress += progress;
    this.zoomLevelProgress.set(zoomLevel, zoomProgress);
    if (this.currentZoom > -1 && this.currentZoom != zoomLevel) {
      console.info(
        this.title +
          ' - Finished Zoom Level ' +
          this.currentZoom +
          ', Tiles: ' +
          this.getZoomLevelProgress(this.currentZoom),
      );
    }
    this.currentZoom = zoomLevel;
  }

  /**
   * Get the max at the zoom level
   * @param zoomLevel zoom level
   * @return max
   */
  public getZoomLevelMax(zoomLevel: number): number {
    let zoomMax = this.zoomLevelMax.get(zoomLevel);
    if (zoomMax == null) {
      zoomMax = 0;
    }
    return zoomMax;
  }

  /**
   * Get the total progress at the zoom level
   * @param zoomLevel zoom level
   * @return progress
   */
  public getZoomLevelProgress(zoomLevel: number): number {
    let zoomProgress = this.zoomLevelProgress.get(zoomLevel);
    if (zoomProgress == null) {
      zoomProgress = 0;
    }
    return zoomProgress;
  }
}
