import { GeoPackageZoomLevelProgress } from '../../../lib/io/geoPackageZoomLevelProgress';

export class TestGeoPackageProgress implements GeoPackageZoomLevelProgress {
  private max: number = null;
  private progress = 0;
  private active = true;

  public setMax(max: number): void {
    this.max = max;
  }

  public addProgress(progress: number): void {
    this.progress += progress;
  }

  public isActive(): boolean {
    return this.active && (this.max == null || this.progress < this.max);
  }

  public cleanupOnCancel(): boolean {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  public setZoomLevelMax(zoomLevel: number, max: number): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  public addZoomLevelProgress(zoomLevel: number, progress: number): void {}

  public cancel(): void {
    this.active = false;
  }

  public getMax(): number {
    return this.max;
  }

  public getProgress(): number {
    return this.progress;
  }
}
