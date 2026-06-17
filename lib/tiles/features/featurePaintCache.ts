import { StyleRow } from '../../extension/nga/style/styleRow';
import { FeaturePaint } from './featurePaint';
import { FeatureDrawType } from './featureDrawType';
import { Paint } from './paint';

/**
 * Constructor, created with cache size of {@link #DEFAULT_CACHE_SIZE}
 * @constructor
 */
export class FeaturePaintCache {
  static DEFAULT_STYLE_PAINT_CACHE_SIZE = 100;
  paintCache: { [key: number]: FeaturePaint } = {};
  accessHistory: number[] = [];
  /**
   * @param {Number} size size of the cache
   */
  constructor(public cacheSize = FeaturePaintCache.DEFAULT_STYLE_PAINT_CACHE_SIZE) {}
  /**
   * Get the cached featurePaint for the style row or null if not cached
   * @param {StyleRow} styleRow style row
   * @return {FeaturePaint} feature paint or null
   */
  getFeaturePaintForStyleRow(styleRow: StyleRow): FeaturePaint {
    return this.getFeaturePaint(styleRow.getId());
  }
  /**
   * Get the cached featurePaint for the style row id or null if not cached
   * @param {Number} styleRowId style row id
   * @return {FeaturePaint} feature paint or null
   */
  getFeaturePaint(styleRowId: number): FeaturePaint {
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
   * @param {StyleRow} styleRow style row
   * @param {FeatureDrawType} type feature draw type
   * @return {Paint} paint
   */
  getPaintForStyleRow(styleRow: StyleRow, type: FeatureDrawType): Paint {
    return this.getPaint(styleRow.getId(), type);
  }
  /**
   * Get the paint for the style row id and draw type
   * @param {Number} styleId  style row id
   * @param {String} type feature draw type
   * @return {Paint} paint
   */
  getPaint(styleId: number, type: FeatureDrawType): Paint {
    let paint = null;
    const featurePaint = this.getFeaturePaint(styleId);
    if (featurePaint !== undefined && featurePaint !== null) {
      paint = featurePaint.getPaint(type);
    }
    return paint;
  }
  /**
   * Cache the featurePaint for the style row
   * @param {StyleRow} styleRow style row
   * @param {FeatureDrawType} type feature draw type
   * @param {Paint} paint paint
   */
  setPaintForStyleRow(styleRow: StyleRow, type: FeatureDrawType, paint: Paint): void {
    this.setPaint(styleRow.getId(), type, paint);
  }
  /**
   * Cache the featurePaint for the style row id
   * @param {Number} styleRowId style row id
   * @param {FeatureDrawType} type feature draw type
   * @param {Paint} paint paint
   */
  setPaint(styleRowId: number, type: FeatureDrawType, paint: Paint): void {
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
   * @return {FeaturePaint} removed feature paint or null
   */
  remove(styleRowId: number): FeaturePaint {
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
  clear(): void {
    this.paintCache = {};
    this.accessHistory = [];
  }
  /**
   * Resize the cache
   * @param {Number} maxSize max size
   */
  resize(maxSize: number): void {
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
