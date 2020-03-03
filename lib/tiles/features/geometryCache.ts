import { FeatureRow } from '../../features/user/featureRow';
import { Geometry } from 'geojson';
import { CrsGeometry } from '../../types/CrsGeometry';

/**
 * Feature Paint Cache.
 * @module tiles/features
 */

/**
 * Constructor, created with cache size of {@link #DEFAULT_GEOMETRY_CACHE_SIZE}
 * @constructor
 */
export class GeometryCache {
  public static readonly DEFAULT_GEOMETRY_CACHE_SIZE = 100;
  geometryCache: Record<number, Geometry & CrsGeometry>;
  accessHistory: number[];

  constructor(public cacheSize: number = GeometryCache.DEFAULT_GEOMETRY_CACHE_SIZE) {
    // this.cacheSize = size !== null ? size : GeometryCache.DEFAULT_GEOMETRY_CACHE_SIZE;
    this.geometryCache = {};
    this.accessHistory = [];
  }

  /**
   * Get the cached geometry for the feature row
   * @param featureRow
   * @returns {module:tiles/features~Geometry}
   */
  getGeometryForFeatureRow(featureRow: FeatureRow): Geometry & CrsGeometry {
    return this.getGeometry(featureRow.id);
  }

  /**
   * Get the cached geometry for the feature row id or null if not cached
   * @param {Number} featureRowId feature row id
   * @return {module:tiles/features~Geometry} geometry or null
   */
  getGeometry(featureRowId: number): Geometry & CrsGeometry {
    const Geometry = this.geometryCache[featureRowId];
    if (!!Geometry) {
      const index = this.accessHistory.indexOf(featureRowId);
      if (index > -1) {
        this.accessHistory.splice(index, 1);
      }
      this.accessHistory.push(featureRowId);
    }
    return Geometry;
  }

  /**
   * Cache the Geometry for the feature row id
   * @param {Number} featureRowId feature row id
   * @param {Object} geometry geometry
   */
  setGeometry(featureRowId: number, geometry: Geometry & CrsGeometry): void {
    const index = this.accessHistory.indexOf(featureRowId);
    if (index > -1) {
      this.accessHistory.splice(index, 1);
    }
    this.geometryCache[featureRowId] = geometry;
    this.accessHistory.push(featureRowId);
    if (Object.keys(this.geometryCache).length > this.cacheSize) {
      const featureId = this.accessHistory.shift();
      if (featureId) {
        delete this.geometryCache[featureId];
      }
    }
  }

  /**
   * Remove the cached Geometry for the style row id
   * @param {Number} featureRowId style row id
   * @return {module:tiles/features~Geometry} removed feature paint or null
   */
  remove(featureRowId: number): Geometry & CrsGeometry {
    const removed = this.geometryCache[featureRowId];
    delete this.geometryCache[featureRowId];
    if (!!removed) {
      const index = this.accessHistory.indexOf(featureRowId);
      if (index > -1) {
        this.accessHistory.splice(index, 1);
      }
    }
    return removed;
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.geometryCache = {};
    this.accessHistory = [];
  }

  /**
   * Resize the cache
   * @param {Number} maxSize max size
   */
  resize(maxSize: number): void {
    this.cacheSize = maxSize;
    const keys = Object.keys(this.geometryCache);
    if (keys.length > maxSize) {
      const numberToRemove = keys.length - maxSize;
      for (let i = 0; i < numberToRemove; i++) {
        const featureRowId = this.accessHistory.shift();
        if (!!featureRowId) {
          delete this.geometryCache[featureRowId];
        }
      }
    }
  }
}
