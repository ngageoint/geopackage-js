import { GeoPackageProgress } from './geoPackageProgress';

/**
 * Progress logger
 */
export class Progress implements GeoPackageProgress {
  /**
   * Decimal format
   */
  protected decimalFormat = {
    format: function (num: number): string {
      return num.toFixed(2);
    },
  };

  /**
   * Max number
   */
  protected max: number = null;

  /**
   * Total progress
   */
  protected progress = 0;

  /**
   * Active flag
   */
  protected active = true;

  /**
   * Log Title
   */
  protected readonly title: string;

  /**
   * Log Unit
   */
  protected unit: string;

  /**
   * Log count frequency
   */
  protected countFrequency: number;

  /**
   * Log time frequency, stored in milliseconds
   */
  protected timeFrequency: number;

  /**
   * Local count between logs
   */
  protected localCount = 0;

  /**
   * Local time between logs
   */
  protected localTime: Date = new Date();

  /**
   * Constructor
   * @param title title
   * @param unit unit
   * @param countFrequency count frequency
   * @param timeFrequency time frequency in seconds
   */
  public constructor(title: string, countFrequency: number, timeFrequency: number, unit: string) {
    this.title = title;
    this.unit = unit != null ? ' ' + unit : '';
    this.setCountFrequency(countFrequency);
    this.setTimeFrequency(timeFrequency);
  }

  /**
   * @inheritDoc
   */
  public setMax(max: number): void {
    this.max = max;
  }

  /**
   * @inheritDoc
   */
  public addProgress(progress: number): void {
    this.progress += progress;
    this.localCount += progress;
    if (
      this.localCount >= this.countFrequency ||
      this.localTime.getTime() + this.timeFrequency <= new Date().getTime() ||
      (this.max != null && this.max == this.progress)
    ) {
      this.logProgress();
      this.localCount = 0;
      this.localTime = new Date();
    }
  }

  /**
   * Log the progress
   */
  protected logProgress(): void {
    console.info(
      this.title +
        ' - ' +
        this.progress +
        (this.max != null
          ? ' of ' + this.max + this.unit + ' (' + this.getPercentage(this.progress, this.max) + ')'
          : this.unit),
    );
  }

  /**
   * @inheritDoc
   */
  public isActive(): boolean {
    return this.active;
  }

  /**
   * @inheritDoc
   */
  public cleanupOnCancel(): boolean {
    return false;
  }

  /**
   * Cancel the operation
   */
  public cancel(): void {
    this.active = false;
  }

  /**
   * Get the max
   * @return max
   */
  public getMax(): number {
    return this.max;
  }

  /**
   * Get the count frequency
   * @return count frequency
   */
  public getCountFrequency(): number {
    return this.countFrequency;
  }

  /**
   * Set the count frequency
   * @param countFrequency count frequency
   */
  public setCountFrequency(countFrequency: number): void {
    this.countFrequency = countFrequency;
  }

  /**
   * Get the time frequency in seconds
   * @return time frequency in seconds
   */
  public getTimeFrequency(): number {
    return this.timeFrequency / 1000;
  }

  /**
   * Set the time frequency in seconds
   * @param timeFrequency time frequency in seconds
   */
  public setTimeFrequency(timeFrequency: number): void {
    this.timeFrequency = timeFrequency * 1000;
  }

  /**
   * Get the total progress
   * @return progress
   */
  public getProgress(): number {
    return this.progress;
  }

  /**
   * Get the string percentage of the count and total
   * @param count current count
   * @param total total count
   * @return string percentage
   */
  protected getPercentage(count: number, total: number): string {
    return this.decimalFormat.format((count / total) * 100.0) + '%';
  }
}
