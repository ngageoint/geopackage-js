import { FeatureCache } from './featureCache';
import { FeatureRow } from './featureRow';

/**
 * Feature Row Cache for multiple feature tables in a single GeoPackage
 */
export class FeatureCacheTables {
  /**
   * Mapping between feature table name and a feature row cache
   */
  private tableCache: Map<string, FeatureCache> = new Map();

  /**
   * Cache size
   */
  private maxCacheSize: number;

  /**
   * Constructor
   * @param maxCacheSize max feature rows to retain in each feature table cache
   */
  public constructor(maxCacheSize = FeatureCache.DEFAULT_CACHE_MAX_SIZE) {
    this.maxCacheSize = maxCacheSize;
  }

  /**
   * Get the max cache size used when creating new feature row caches
   * @return max cache size
   */
  public getMaxCacheSize(): number {
    return this.maxCacheSize;
  }

  /**
   * Set the max cache size to use when creating new feature row caches
   * @param maxCacheSize feature row max cache size
   */
  public setMaxCacheSize(maxCacheSize: number): void {
    this.maxCacheSize = maxCacheSize;
  }

  /**
   * Get the feature table names with a feature row cache
   * @return feature table names
   */
  public getTables(): string[] {
    return Object.keys(this.tableCache);
  }

  /**
   * Get or create a feature row cache for the table name
   * @param tableName feature table name
   * @return feature row cache
   */
  public getCache(tableName: string): FeatureCache {
    let cache = this.tableCache.get(tableName);
    if (cache == null) {
      cache = new FeatureCache(this.maxCacheSize);
      this.tableCache.set(tableName, cache);
    }
    return cache;
  }

  /**
   * Get or create a feature row cache for the feature row
   * @param featureRow feature row
   * @return feature row cache
   */
  public getCacheWithFeatureRow(featureRow: FeatureRow): FeatureCache {
    return this.getCache(featureRow.getTable().getTableName());
  }

  /**
   * Get the cache max size for the table name
   * @param tableName feature table name
   * @return max size
   */
  public getMaxSize(tableName: string): number {
    return this.getCache(tableName).getMaxSize();
  }

  /**
   * Get the current cache size, number of feature rows cached, for the table
   * name
   * @param tableName feature table name
   * @return cache size
   */
  public getSize(tableName: string): number {
    return this.getCache(tableName).getSize();
  }

  /**
   * Get the cached feature row by table name and feature id
   * @param tableName feature table name
   * @param featureId feature row id
   * @return feature row or null
   */
  public get(tableName: string, featureId: number): FeatureRow {
    return this.getCache(tableName).get(featureId);
  }

  /**
   * Cache the feature row
   * @param featureRow feature row
   * @return previous cached feature row or null
   */
  public put(featureRow: FeatureRow): FeatureRow {
    return this.getCacheWithFeatureRow(featureRow).put(featureRow);
  }

  /**
   * Remove the cached feature row
   * @param featureRow feature row
   * @return removed feature row or null
   */
  public removeWithFeatureRow(featureRow: FeatureRow): FeatureRow {
    return this.remove(featureRow.getTable().getTableName(), featureRow.getId());
  }

  /**
   * Remove the cached feature row by id
   * @param tableName feature table name
   * @param featureId feature row id
   * @return removed feature row or null
   */
  public remove(tableName: string, featureId: number): FeatureRow {
    return this.getCache(tableName).remove(featureId);
  }

  /**
   * Clear the feature table cache
   * @param tableName feature table name
   */
  public clear(tableName: string): void {
    this.tableCache.delete(tableName);
  }

  /**
   * Clear all caches
   */
  public clearAll(): void {
    this.tableCache.clear();
  }

  /**
   * Resize the feature table cache
   * @param tableName feature table name
   * @param maxCacheSize max cache size
   */
  public resize(tableName: string, maxCacheSize: number): void {
    this.getCache(tableName).resize(maxCacheSize);
  }

  /**
   * Resize all caches and update the max cache size
   *
   * @param maxCacheSize max cache size
   */
  public resizeAll(maxCacheSize: number): void {
    this.setMaxCacheSize(maxCacheSize);
    for (const cache of this.tableCache.values()) {
      cache.resize(maxCacheSize);
    }
  }

  /**
   * Clear and resize the feature table cache
   *
   * @param tableName
   *            feature table name
   * @param maxCacheSize
   *            max cache size
   */
  public clearAndResize(tableName: string, maxCacheSize: number): void {
    this.getCache(tableName).clearAndResize(maxCacheSize);
  }

  /**
   * Clear and resize all caches and update the max cache size
   *
   * @param maxCacheSize
   *            max cache size
   */
  public clearAndResizeAll(maxCacheSize: number): void {
    this.setMaxCacheSize(maxCacheSize);
    for (const cache of this.tableCache.values()) {
      cache.clearAndResize(maxCacheSize);
    }
  }
}
