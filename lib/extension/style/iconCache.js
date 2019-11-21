/**
 * @memberOf module:extension/style
 * @class IconCache
 */
/**
 * Constructor, created with cache size of {@link #IconCache.DEFAULT_CACHE_SIZE}
 * @constructor
 */
class IconCache {
  constructor(size = null) {
    this.cacheSize = size !== null ? size : IconCache.DEFAULT_CACHE_SIZE;
    this.iconCache = {};
    this.accessHistory = [];
  }
  /**
   * Get the cached image for the icon row or null if not cached
   * @param {module:extension/style.IconRow} iconRow icon row
   * @return {Image} icon image or null
   */
  getIconForIconRow(iconRow) {
    return this.get(iconRow.getId());
  }
  /**
   * Get the cached image for the icon row id or null if not cached
   * @param {Number} iconRowId icon row id
   * @return {Image} icon image or null
   */
  get(iconRowId) {
    var image = this.iconCache[iconRowId];
    if (image) {
      var index = this.accessHistory.indexOf(iconRowId);
      if (index > -1) {
        this.accessHistory.splice(index, 1);
      }
      this.accessHistory.push(iconRowId);
    }
    return image;
  }
  /**
   * Cache the icon image for the icon row
   * @param {module:extension/style.IconRow} iconRow icon row
   * @param {Image} image icon image
   * @return {Image} previous cached icon image or null
   */
  putIconForIconRow(iconRow, image) {
    return this.put(iconRow.getId(), image);
  }
  /**
   * Cache the icon image for the icon row id
   * @param {Number} iconRowId icon row id
   * @param {Image} image icon image
   * @return {Image} previous cached icon image or null
   */
  put(iconRowId, image) {
    var previous = this.iconCache[iconRowId];
    this.iconCache[iconRowId] = image;
    if (previous) {
      var index = this.accessHistory.indexOf(iconRowId);
      if (index > -1) {
        this.accessHistory.splice(index, 1);
      }
    }
    this.accessHistory.push(iconRowId);
    if (Object.keys(this.iconCache).length > this.cacheSize) {
      var iconId = this.accessHistory.shift();
      if (iconId) {
        delete this.iconCache[iconId];
      }
    }
    return previous;
  }
  /**
   * Remove the cached image for the icon row
   * @param {module:extension/style.IconRow} iconRow icon row
   * @return {Image} removed icon image or null
   */
  removeIconForIconRow(iconRow) {
    return this.remove(iconRow.getId());
  }
  /**
   * Remove the cached image for the icon row id
   * @param {Number} iconRowId icon row id
   * @return {Image} removed icon image or null
   */
  remove(iconRowId) {
    var removed = this.iconCache[iconRowId];
    delete this.iconCache[iconRowId];
    if (removed) {
      var index = this.accessHistory.indexOf(iconRowId);
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
    this.iconCache = {};
    this.accessHistory = [];
  }
  /**
   * Resize the cache
   * @param {Number} maxSize max size
   */
  resize(maxSize) {
    this.cacheSize = maxSize;
    var keys = Object.keys(this.iconCache);
    if (keys.length > maxSize) {
      var numberToRemove = keys.length - maxSize;
      for (var i = 0; i < numberToRemove; i++) {
        delete this.iconCache[this.accessHistory.shift()];
      }
    }
  }
  /**
   * Create or retrieve from cache an icon image for the icon row
   * @param {module:extension/style.IconRow} icon icon row
   * @return {Promise<Image>} icon image
   */
  createIcon(icon) {
    return this.createAndCacheIcon(icon, this);
  }
  /**
   * Create or retrieve from cache an icon image for the icon row
   * @param {module:extension/style.IconRow} icon icon row
   * @param {Number} scale scale factor
   * @return {Promise<Image>} icon image
   */
  createScaledIcon(icon, scale) {
    return this.createAndCacheScaledIcon(icon, scale, this);
  }
  /**
   * Create an icon image for the icon row without caching
   * @param {module:extension/style.IconRow} icon icon row
   * @return {Promise<Image>} icon image
   */
  createIconNoCache(icon) {
    return this.createScaledIconNoCache(icon, 1.0);
  }
  /**
   * Create an icon image for the icon row without caching
   * @param icon icon row
   * @param scale scale factor
   * @return {Promise<Image>} icon image
   */
  createScaledIconNoCache(icon, scale) {
    return this.createAndCacheScaledIcon(icon, scale, null);
  }
  /**
   * Create or retrieve from cache an icon image for the icon row
   * @param {module:extension/style.IconRow} icon icon row
   * @param {module:extension/style.IconCache} iconCache icon cache
   * @return {Promise<Image>} icon image
   */
  createAndCacheIcon(icon, iconCache) {
    return this.createAndCacheScaledIcon(icon, 1.0, iconCache);
  }
  /**
   * Create or retrieve from cache an icon image for the icon row
   * @param {module:extension/style.IconRow} icon icon row
   * @param {Number} scale scale factor
   * @param {module:extension/style.IconCache} iconCache icon cache
   * @return {Promise<Image>} icon image
   */
  async createAndCacheScaledIcon(icon, scale, iconCache) {
    var iconImage = null;
    if (icon != null) {
      var iconId = icon.getId();
      if (iconCache !== null) {
        iconImage = iconCache.get(iconId);
      }
      var iconScaledWidth = Math.round(icon.getWidth() * scale);
      var iconScaledHeight = Math.round(icon.getHeight() * scale);
      if (!iconImage || iconImage.width !== iconScaledWidth || iconImage.height !== iconScaledHeight) {
        iconImage = await icon.getScaledDataImage(scale);
      }
      if (iconCache !== null) {
        iconCache.putIconForIconRow(icon, iconImage);
      }
    }
    return iconImage;
  }
}















IconCache.DEFAULT_CACHE_SIZE = 100;

module.exports = IconCache;
