import FeatureRow from "../../features/user/featureRow";

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
  geometryCache: {};
  accessHistory: any[];

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
  getGeometryForFeatureRow(featureRow: FeatureRow): any {
    return this.getGeometry(featureRow.getId());
  };
  
  /**
   * Get the cached geometry for the feature row id or null if not cached
   * @param {Number} featureRowId feature row id
   * @return {module:tiles/features~Geometry} geometry or null
   */
  getGeometry(featureRowId: number): any {
    var Geometry = this.geometryCache[featureRowId];
    if (!!Geometry) {
      var index = this.accessHistory.indexOf(featureRowId);
      if (index > -1) {
        this.accessHistory.splice(index, 1);
      }
      this.accessHistory.push(featureRowId);
    }
    return Geometry;
  };
  
  
  /**
   * Cache the Geometry for the feature row id
   * @param {Number} featureRowId feature row id
   * @param {Object} geometry geometry
   */
  setGeometry(featureRowId: number, geometry: any) {
    var index = this.accessHistory.indexOf(featureRowId);
    if (index > -1) {
      this.accessHistory.splice(index, 1);
    }
    this.geometryCache[featureRowId] = geometry;
    this.accessHistory.push(featureRowId);
    if (Object.keys(this.geometryCache).length > this.cacheSize) {
      var featureId = this.accessHistory.shift();
      if (featureId) {
        delete this.geometryCache[featureId];
      }
    }
  };
  
  /**
   * Remove the cached Geometry for the style row id
   * @param {Number} featureRowId style row id
   * @return {module:tiles/features~Geometry} removed feature paint or null
   */
  remove(featureRowId: number): any {
    var removed = this.geometryCache[featureRowId];
    delete this.geometryCache[featureRowId];
    if (!!removed) {
      var index = this.accessHistory.indexOf(featureRowId);
      if (index > -1) {
        this.accessHistory.splice(index, 1);
      }  }
    return removed;
  };
  
  /**
   * Clear the cache
   */
  clear() {
    this.geometryCache = {};
    this.accessHistory = [];
  };
  
  /**
   * Resize the cache
   * @param {Number} maxSize max size
   */
  resize(maxSize: number) {
    this.cacheSize = maxSize;
    var keys = Object.keys(this.geometryCache);
    if (keys.length > maxSize) {
      var numberToRemove = keys.length - maxSize;
      for (var i = 0; i < numberToRemove; i++) {
        var featureRowId = this.accessHistory.shift();
        if (!!featureRowId) {
          delete this.geometryCache[featureRowId];
        }
      }
    }
  };
}