import { StyleRow } from '../../extension/style/styleRow';
import { FeaturePaint } from './featurePaint';
import { FeatureDrawType } from './featureDrawType';
import { Paint } from './paint';
/**
 * Constructor, created with cache size of {@link #DEFAULT_CACHE_SIZE}
 * @constructor
 */
export declare class FeaturePaintCache {
    cacheSize: number;
    static DEFAULT_STYLE_PAINT_CACHE_SIZE: number;
    paintCache: {
        [key: number]: FeaturePaint;
    };
    accessHistory: number[];
    /**
     * @param {Number} size size of the cache
     */
    constructor(cacheSize?: number);
    /**
     * Get the cached featurePaint for the style row or null if not cached
     * @param {module:extension/style~StyleRow} styleRow style row
     * @return {module:tiles/features~FeaturePaint} feature paint or null
     */
    getFeaturePaintForStyleRow(styleRow: StyleRow): FeaturePaint;
    /**
     * Get the cached featurePaint for the style row id or null if not cached
     * @param {Number} styleRowId style row id
     * @return {module:tiles/features~FeaturePaint} feature paint or null
     */
    getFeaturePaint(styleRowId: number): FeaturePaint;
    /**
     * Get the paint for the style row and draw type
     * @param {module:extension/style~StyleRow} styleRow style row
     * @param {module:tiles/features~FeatureDrawType} type feature draw type
     * @return {module:tiles/features~Paint} paint
     */
    getPaintForStyleRow(styleRow: StyleRow, type: FeatureDrawType): Paint;
    /**
     * Get the paint for the style row id and draw type
     * @param {Number} styleId  style row id
     * @param {String} type feature draw type
     * @return {module:tiles/features~Paint} paint
     */
    getPaint(styleId: number, type: FeatureDrawType): Paint;
    /**
     * Cache the featurePaint for the style row
     * @param {module:extension/style~StyleRow} styleRow style row
     * @param {module:tiles/features~FeatureDrawType} type feature draw type
     * @param {module:tiles/features~Paint} paint paint
     */
    setPaintForStyleRow(styleRow: StyleRow, type: FeatureDrawType, paint: Paint): void;
    /**
     * Cache the featurePaint for the style row id
     * @param {Number} styleRowId style row id
     * @param {module:tiles/features~FeatureDrawType} type feature draw type
     * @param {module:tiles/features~Paint} paint paint
     */
    setPaint(styleRowId: number, type: FeatureDrawType, paint: Paint): void;
    /**
     * Remove the cached featurePaint for the style row id
     * @param {Number} styleRowId style row id
     * @return {module:tiles/features~FeaturePaint} removed feature paint or null
     */
    remove(styleRowId: number): FeaturePaint;
    /**
     * Clear the cache
     */
    clear(): void;
    /**
     * Resize the cache
     * @param {Number} maxSize max size
     */
    resize(maxSize: number): void;
}
