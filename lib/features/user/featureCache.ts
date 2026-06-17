import { FeatureRow } from './featureRow';

/**
 * Feature Row Cache for a single feature table
 */
export class FeatureCache {
  /**
   * Default max number of feature rows to retain in cache
   */
  public static readonly DEFAULT_CACHE_MAX_SIZE = 1000;

  /**
   * Feature Row cache
   */
  private readonly cache: Map<number, FeatureRow>;

  /**
   * Max cache size
   */
  private maxSize: number;

  /**
   * Constructor
   * @param size max feature rows to retain in the cache
   */
  public constructor(size = FeatureCache.DEFAULT_CACHE_MAX_SIZE) {
    this.maxSize = size;
    this.cache = new Map<number, FeatureRow>();
  }

  /**
   * Get the cache max size
   *
   * @return max size
   */
  public getMaxSize(): number {
    return this.maxSize;
  }

  /**
   * Get the current cache size, number of feature rows cached
   *
   * @return cache size
   */
  public getSize(): number {
    return this.cache.size;
  }

  /**
   * Get the cached feature row by feature id
   * @param featureId feature row id
   * @return feature row or null
   */
  public get(featureId: number): FeatureRow {
    const val = this.cache.get(featureId);

    if (val != null) {
      this.cache.delete(featureId);
      this.cache.set(featureId, val);
    }

    return val;
  }

  /**
   * Cache the feature row
   *
   * @param featureRow feature row
   * @return previous cached feature row or null
   */
  public put(featureRow: FeatureRow): FeatureRow {
    const key = featureRow.getId();
    const previous = this.cache[key];
    this.cache.delete(key);

    if (this.cache.size === this.maxSize) {
      this.cache.delete(this.cache.keys().next().value);
      this.cache.set(key, featureRow);
    } else {
      this.cache.set(key, featureRow);
    }
    return previous;
  }

  /**
   * Remove the cached feature row
   * @param featureRow feature row
   * @return removed feature row or null
   */
  public removeFeature(featureRow: FeatureRow): FeatureRow {
    return this.remove(featureRow.getId());
  }

  /**
   * Remove the cached feature row by id
   * @param featureId feature row id
   * @return removed feature row or null
   */
  public remove(featureId: number): FeatureRow {
    const value = this.cache.get(featureId);
    this.cache.delete(featureId);
    return value;
  }

  /**
   * Clear the cache
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Resize the cache
   * @param maxSize max size
   */
  public resize(maxSize: number): void {
    this.maxSize = maxSize;
    while (this.cache.size > maxSize) {
      this.cache.delete(this.cache.keys().next().value);
    }
  }

  /**
   * Clear and resize the cache
   * @param maxSize max size of the cache
   */
  public clearAndResize(maxSize: number): void {
    this.clear();
    this.resize(maxSize);
  }
}
