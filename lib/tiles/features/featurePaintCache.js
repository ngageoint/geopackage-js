/**
 * Feature Paint Cache.
 * @module tiles/features
 */
const FeaturePaint = require('./featurePaint');

/**
 * Constructor, created with cache size of {@link #DEFAULT_CACHE_SIZE}
 * @constructor
 */
class FeaturePaintCache {
  /**
   * @param {Number} size size of the cache
   */
  constructor(size = null) {
    this.cacheSize = size !== null ? size : FeaturePaintCache.DEFAULT_STYLE_PAINT_CACHE_SIZE;
    this.paintCache = {};
    this.accessHistory = [];
  }
  /**
   * Get the cached featurePaint for the style row or null if not cached
   * @param {module:extension/style~StyleRow} styleRow style row
   * @return {module:tiles/features~FeaturePaint} feature paint or null
   */
  getFeaturePaintForStyleRow(styleRow) {
    return this.getFeaturePaint(styleRow.getId());
  }
  /**
   * Get the cached featurePaint for the style row id or null if not cached
   * @param {Number} styleRowId style row id
   * @return {module:tiles/features~FeaturePaint} feature paint or null
   */
  getFeaturePaint(styleRowId) {
    const featurePaint = this.paintCache[styleRowId];
    if (featurePaint) {
      const index = this.accessHistory.indexOf(styleRowId);
      if (index > -1) {
        this.accessHistory.splice(index, 1);
      }
      this.accessHistory.push(styleRowId);
    }
    return featurePaint;
  }
  /**
   * Get the paint for the style row and draw type
   * @param {module:extension/style~StyleRow} styleRow style row
   * @param {module:tiles/features~FeatureDrawType} type feature draw type
   * @return {module:tiles/features~Paint} paint
   */
  getPaintForStyleRow(styleRow, type) {
    return this.getPaint(styleRow.getId(), type);
  }
  /**
   * Get the paint for the style row id and draw type
   * @param {Number} styleId  style row id
   * @param {String} type feature draw type
   * @return {module:tiles/features~Paint} paint
   */
  getPaint(styleId, type) {
    let paint = null;
    const featurePaint = this.getFeaturePaint(styleId);
    if (featurePaint !== undefined && featurePaint !== null) {
      paint = featurePaint.getPaint(type);
    }
    return paint;
  }
  /**
   * Cache the featurePaint for the style row
   * @param {module:extension/style~StyleRow} styleRow style row
   * @param {module:tiles/features~FeatureDrawType} type feature draw type
   * @param {module:tiles/features~Paint} paint paint
   */
  setPaintForStyleRow(styleRow, type, paint) {
    this.setPaint(styleRow.getId(), type, paint);
  }
  /**
   * Cache the featurePaint for the style row id
   * @param {Number} styleRowId style row id
   * @param {module:tiles/features~FeatureDrawType} type feature draw type
   * @param {module:tiles/features~Paint} paint paint
   */
  setPaint(styleRowId, type, paint) {
    let featurePaint = this.paintCache[styleRowId];
    if (!featurePaint) {
      featurePaint = new FeaturePaint();
    } else {
      const index = this.accessHistory.indexOf(styleRowId);
      if (index > -1) {
        this.accessHistory.splice(index, 1);
      }
    }
    featurePaint.setPaint(type, paint);
    this.paintCache[styleRowId] = featurePaint;
    this.accessHistory.push(styleRowId);
    if (Object.keys(this.paintCache).length > this.cacheSize) {
      const styleId = this.accessHistory.shift();
      if (styleId) {
        delete this.paintCache[styleId];
      }
    }
  }
  /**
   * Remove the cached featurePaint for the style row id
   * @param {Number} styleRowId style row id
   * @return {module:tiles/features~FeaturePaint} removed feature paint or null
   */
  remove(styleRowId) {
    const removed = this.paintCache[styleRowId];
    delete this.paintCache[styleRowId];
    if (removed) {
      const index = this.accessHistory.indexOf(styleRowId);
      if (index > -1) {
        this.accessHistory.splice(index, 1);
      }
    }
    return removed;
  }
  /**
   * Clear the cache
   */
  clear() {
    this.paintCache = {};
    this.accessHistory = [];
  }
  /**
   * Resize the cache
   * @param {Number} maxSize max size
   */
  resize(maxSize) {
    this.cacheSize = maxSize;
    const keys = Object.keys(this.paintCache);
    if (keys.length > maxSize) {
      const numberToRemove = keys.length - maxSize;
      for (let i = 0; i < numberToRemove; i++) {
        const styleRowId = this.accessHistory.shift();
        if (styleRowId) {
          delete this.paintCache[styleRowId];
        }
      }
    }
  }
}

FeaturePaintCache.DEFAULT_STYLE_PAINT_CACHE_SIZE = 100;

module.exports = FeaturePaintCache;
