import { IconRow } from './iconRow';
/**
 * @memberOf module:extension/style
 * @class IconCache
 */
/**
 * Constructor, created with cache size of {@link #IconCache.DEFAULT_CACHE_SIZE}
 * @constructor
 */
export class IconCache {
  public static DEFAULT_CACHE_SIZE = 100;
  iconCache: { [key: number]: any } = {};
  accessHistory: number[] = [];

  constructor(public cacheSize = IconCache.DEFAULT_CACHE_SIZE) {}
  /**
   * Get the cached image for the icon row or null if not cached
   * @param {module:extension/style.IconRow} iconRow icon row
   * @return {Image} icon image or null
   */
  getIconForIconRow(iconRow: IconRow): any {
    return this.get(iconRow.id);
  }
  /**
   * Get the cached image for the icon row id or null if not cached
   * @param {Number} iconRowId icon row id
   * @return {Image} icon image or null
   */
  get(iconRowId: number): any {
    const image = this.iconCache[iconRowId];
    if (image) {
      const index = this.accessHistory.indexOf(iconRowId);
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
  putIconForIconRow(iconRow: IconRow, image: any): any {
    return this.put(iconRow.id, image);
  }
  /**
   * Cache the icon image for the icon row id
   * @param {Number} iconRowId icon row id
   * @param {Image} image icon image
   * @return {Image} previous cached icon image or null
   */
  put(iconRowId: number, image: any): any {
    const previous = this.iconCache[iconRowId];
    this.iconCache[iconRowId] = image;
    if (previous) {
      const index = this.accessHistory.indexOf(iconRowId);
      if (index > -1) {
        this.accessHistory.splice(index, 1);
      }
    }
    this.accessHistory.push(iconRowId);
    if (Object.keys(this.iconCache).length > this.cacheSize) {
      const iconId = this.accessHistory.shift();
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
  removeIconForIconRow(iconRow: IconRow): any {
    return this.remove(iconRow.id);
  }
  /**
   * Remove the cached image for the icon row id
   * @param {Number} iconRowId icon row id
   * @return {Image} removed icon image or null
   */
  remove(iconRowId: number): any {
    const removed = this.iconCache[iconRowId];
    delete this.iconCache[iconRowId];
    if (removed) {
      const index = this.accessHistory.indexOf(iconRowId);
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
    this.iconCache = {};
    this.accessHistory = [];
  }
  /**
   * Resize the cache
   * @param {Number} maxSize max size
   */
  resize(maxSize: number): void {
    this.cacheSize = maxSize;
    const keys = Object.keys(this.iconCache);
    if (keys.length > maxSize) {
      const numberToRemove = keys.length - maxSize;
      for (let i = 0; i < numberToRemove; i++) {
        delete this.iconCache[this.accessHistory.shift()];
      }
    }
  }
  /**
   * Create or retrieve from cache an icon image for the icon row
   * @param {module:extension/style.IconRow} icon icon row
   * @return {Promise<Image>} icon image
   */
  async createIcon(icon: IconRow): Promise<any> {
    return this.createAndCacheIcon(icon, this);
  }
  /**
   * Create or retrieve from cache an icon image for the icon row
   * @param {module:extension/style.IconRow} icon icon row
   * @param {Number} scale scale factor
   * @return {Promise<Image>} icon image
   */
  async createScaledIcon(icon: IconRow, scale: number): Promise<any> {
    return this.createAndCacheScaledIcon(icon, scale, this);
  }
  /**
   * Create an icon image for the icon row without caching
   * @param {module:extension/style.IconRow} icon icon row
   * @return {Promise<Image>} icon image
   */
  async createIconNoCache(icon: IconRow): Promise<any> {
    return this.createScaledIconNoCache(icon, 1.0);
  }
  /**
   * Create an icon image for the icon row without caching
   * @param icon icon row
   * @param scale scale factor
   * @return {Promise<Image>} icon image
   */
  async createScaledIconNoCache(icon: IconRow, scale: number): Promise<any> {
    return this.createAndCacheScaledIcon(icon, scale, null);
  }
  /**
   * Create or retrieve from cache an icon image for the icon row
   * @param {module:extension/style.IconRow} icon icon row
   * @param {module:extension/style.IconCache} iconCache icon cache
   * @return {Promise<Image>} icon image
   */
  async createAndCacheIcon(icon: IconRow, iconCache: IconCache): Promise<any> {
    return this.createAndCacheScaledIcon(icon, 1.0, iconCache);
  }
  /**
   * Create or retrieve from cache an icon image for the icon row
   * @param {module:extension/style.IconRow} icon icon row
   * @param {Number} scale scale factor
   * @param {module:extension/style.IconCache} iconCache icon cache
   * @return {Promise<Image>} icon image
   */
  async createAndCacheScaledIcon(icon: IconRow, scale: number, iconCache: IconCache): Promise<any> {
    let iconImage = null;
    if (icon != null) {
      const iconId = icon.id;
      if (iconCache !== null) {
        iconImage = iconCache.get(iconId);
      }
      const iconScaledWidth = Math.round(icon.getWidth() * scale);
      const iconScaledHeight = Math.round(icon.getHeight() * scale);
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
