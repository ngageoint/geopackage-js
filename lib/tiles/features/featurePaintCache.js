/**
 * Feature Paint Cache.
 * @module tiles/features
 */
var FeaturePaint = require('./featurePaint');


/**
 * Constructor, created with cache size of {@link #DEFAULT_CACHE_SIZE}
 * @constructor
 */
var FeaturePaintCache = function(size = null) {
  this.cacheSize = size !== null ? size : FeaturePaintCache.DEFAULT_STYLE_PAINT_CACHE_SIZE;
  this.paintCache = {};
  this.accessHistory = [];
};

/**
 * Get the cached featurePaint for the style row or null if not cached
 * @param {module:extension/style~StyleRow} styleRow style row
 * @return {module:tiles/features~FeaturePaint} feature paint or null
 */
FeaturePaintCache.prototype.getFeaturePaintForStyleRow = function(styleRow) {
  return this.getFeaturePaint(styleRow.getId());
};

/**
 * Get the cached featurePaint for the style row id or null if not cached
 * @param {Number} styleRowId style row id
 * @return {module:tiles/features~FeaturePaint} feature paint or null
 */
FeaturePaintCache.prototype.getFeaturePaint = function(styleRowId) {
  var featurePaint = this.paintCache[styleRowId];
  if (!!featurePaint) {
    var index = this.accessHistory.indexOf(styleRowId);
    if (index > -1) {
      this.accessHistory.splice(index, 1);
    }
    this.accessHistory.push(styleRowId);
  }
  return featurePaint;
};

/**
 * Get the paint for the style row and draw type
 * @param {module:extension/style~StyleRow} styleRow style row
 * @param {String} type feature draw type
 * @return {module:tiles/features~Paint} paint
 */
FeaturePaintCache.prototype.getPaintForStyleRow = function(styleRow, type) {
  return this.getPaint(styleRow.getId(), type);
};

/**
 * Get the paint for the style row id and draw type
 * @param {Number} styleId  style row id
 * @param {String} type feature draw type
 * @return {module:tiles/features~Paint} paint
 */
FeaturePaintCache.prototype.getPaint = function(styleId, type) {
  var paint = null;
  var featurePaint = this.getFeaturePaint(styleId);
  if (featurePaint !== undefined && featurePaint !== null) {
    paint = featurePaint.getPaint(type);
  }
  return paint;
};

/**
 * Cache the featurePaint for the style row
 * @param {module:extension/style~StyleRow} styleRow style row
 * @param {module:tiles/features~FeatureDrawType} type feature draw type
 * @param {module:tiles/features~Paint} paint paint
 */
FeaturePaintCache.prototype.setPaintForStyleRow = function(styleRow, type, paint) {
  this.setPaint(styleRow.getId(), type, paint);
};

/**
 * Cache the featurePaint for the style row id
 * @param {Number} styleRowId style row id
 * @param {module:tiles/features~FeatureDrawType} type feature draw type
 * @param {module:tiles/features~Paint} paint paint
 */
FeaturePaintCache.prototype.setPaint = function(styleRowId, type, paint) {
  var featurePaint = this.paintCache[styleRowId];
  if (!featurePaint) {
    featurePaint = new FeaturePaint();
  } else {
    var index = this.accessHistory.indexOf(styleRowId);
    if (index > -1) {
      this.accessHistory.splice(index, 1);
    }
  }
  featurePaint.setPaint(type, paint);
  this.paintCache[styleRowId] = featurePaint;
  this.accessHistory.push(styleRowId);
  if (Object.keys(this.paintCache).length > this.cacheSize) {
    var styleId = this.accessHistory.shift();
    if (styleId) {
      delete this.paintCache[styleId];
    }
  }
};

/**
 * Remove the cached featurePaint for the style row id
 * @param {Number} styleRowId style row id
 * @return {module:tiles/features~FeaturePaint} removed feature paint or null
 */
FeaturePaintCache.prototype.remove = function(styleRowId) {
  var removed = this.paintCache[styleRowId];
  delete this.paintCache[styleRowId];
  if (!!removed) {
    var index = this.accessHistory.indexOf(styleRowId);
    if (index > -1) {
      this.accessHistory.splice(index, 1);
    }  }
  return removed;
};

/**
 * Clear the cache
 */
FeaturePaintCache.prototype.clear = function() {
  this.paintCache = {};
  this.accessHistory = [];
};

/**
 * Resize the cache
 * @param {Number} maxSize max size
 */
FeaturePaintCache.prototype.resize = function(maxSize) {
  this.cacheSize = maxSize;
  var keys = Object.keys(this.paintCache);
  if (keys.length > maxSize) {
    var numberToRemove = keys.length - maxSize;
    for (var i = 0; i < numberToRemove; i++) {
      var styleRowId = this.accessHistory.shift();
      if (!!styleRowId) {
        delete this.paintCache[styleRowId];
      }
    }
  }
};

FeaturePaintCache.DEFAULT_STYLE_PAINT_CACHE_SIZE = 100;


module.exports = FeaturePaintCache;
