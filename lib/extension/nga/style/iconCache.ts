import { IconRow } from './iconRow';
import { Canvas } from '../../../canvas/canvas';
import { ImageUtils } from '../../../image/imageUtils';
import { GeoPackageImage } from '../../../image/geoPackageImage';
import { GeoPackageException } from '../../../geoPackageException';

/**
 * @memberOf module:extension/nga/style
 * @class IconCache
 */
/**
 * Constructor, created with cache size of {@link #IconCache.DEFAULT_CACHE_SIZE}
 * @constructor
 */
export class IconCache {
  public static DEFAULT_CACHE_SIZE = 100;
  iconCache: { [key: number]: GeoPackageImage } = {};
  accessHistory: number[] = [];

  constructor(public cacheSize = IconCache.DEFAULT_CACHE_SIZE) {}

  /**
   * Get the cached image for the icon row or null if not cached
   * @param {module:extension/nga/style.IconRow} iconRow icon row
   * @return {GeoPackageImage} icon image or null
   */
  getIconForIconRow(iconRow: IconRow): GeoPackageImage {
    return this.get(iconRow.id);
  }
  /**
   * Get the cached image for the icon row id or null if not cached
   * @param {Number} iconRowId icon row id
   * @return {GeoPackageImage} icon image or null
   */
  get(iconRowId: number): GeoPackageImage {
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
   * @param {module:extension/nga/style.IconRow} iconRow icon row
   * @param {GeoPackageImage} image icon image
   * @return {GeoPackageImage} previous cached icon image or null
   */
  putIconForIconRow(iconRow: IconRow, image: GeoPackageImage): GeoPackageImage {
    return this.put(iconRow.getId(), image);
  }
  /**
   * Cache the icon image for the icon row id
   * @param {Number} iconRowId icon row id
   * @param {GeoPackageImage} image icon image
   * @return {GeoPackageImage} previous cached icon image or null
   */
  put(iconRowId: number, image: GeoPackageImage): GeoPackageImage {
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
        const iconToDelete = this.iconCache[iconId];
        if (iconToDelete) {
          Canvas.disposeImage(iconToDelete);
        }
        delete this.iconCache[iconId];
      }
    }
    return previous;
  }
  /**
   * Remove the cached image for the icon row, if using CanvasKitCanvasAdapter, dispose of returned image to free up memory using Canvas.dispose(icon.image)
   * @param {module:extension/nga/style.IconRow} iconRow icon row
   * @return {GeoPackageImage} removed icon image or null
   */
  removeIconForIconRow(iconRow: IconRow): GeoPackageImage {
    return this.remove(iconRow.id);
  }
  /**
   * Remove the cached image for the icon row id
   * @param {Number} iconRowId icon row id
   * @return {GeoPackageImage} removed icon image or null
   */
  remove(iconRowId: number): GeoPackageImage {
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
    Object.keys(this.iconCache).forEach(key => {
      const icon = this.iconCache[key];
      Canvas.disposeImage(icon);
    });
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
        const indexToRemove = this.accessHistory.shift();
        const icon = this.iconCache[indexToRemove];
        Canvas.disposeImage(icon);
        delete this.iconCache[indexToRemove];
      }
    }
  }
  /**
   * Create or retrieve from cache an icon image for the icon row
   * @param {module:extension/nga/style.IconRow} icon icon row
   * @return {Promise<GeoPackageImage>} icon image
   */
  async createIcon(icon: IconRow): Promise<GeoPackageImage> {
    return this.createAndCacheIcon(icon, this);
  }
  /**
   * Create or retrieve from cache an icon image for the icon row
   * @param {module:extension/nga/style.IconRow} icon icon row
   * @param {Number} scale scale factor
   * @return {Promise<GeoPackageImage>} icon image
   */
  async createScaledIcon(icon: IconRow, scale: number): Promise<GeoPackageImage> {
    return this.createAndCacheScaledIcon(icon, scale, this);
  }
  /**
   * Create an icon image for the icon row without caching
   * @param {module:extension/nga/style.IconRow} icon icon row
   * @return {Promise<GeoPackageImage>} icon image
   */
  async createIconNoCache(icon: IconRow): Promise<GeoPackageImage> {
    return this.createScaledIconNoCache(icon, 1.0);
  }
  /**
   * Create an icon image for the icon row without caching
   * @param icon icon row
   * @param scale scale factor
   * @return {Promise<GeoPackageImage>} icon image
   */
  async createScaledIconNoCache(icon: IconRow, scale: number): Promise<GeoPackageImage> {
    return this.createAndCacheScaledIcon(icon, scale, null);
  }
  /**
   * Create or retrieve from cache an icon image for the icon row
   * @param {module:extension/nga/style.IconRow} icon icon row
   * @param {module:extension/nga/style.IconCache} iconCache icon cache
   * @return {Promise<GeoPackageImage>} icon image
   */
  async createAndCacheIcon(icon: IconRow, iconCache: IconCache): Promise<GeoPackageImage> {
    return this.createAndCacheScaledIcon(icon, 1.0, iconCache);
  }
  /**
   * Create or retrieve from cache an icon image for the icon row
   * @param {module:extension/nga/style.IconRow} icon icon row
   * @param {Number} scale scale factor
   * @param {module:extension/nga/style.IconCache} iconCache icon cache
   * @return {Promise<GeoPackageImage>} icon image
   */
  async createAndCacheScaledIcon(icon: IconRow, scale: number, iconCache: IconCache): Promise<GeoPackageImage> {
    let iconImage = null;
    if (icon != null) {
      const iconId = icon.getId();

      if (iconCache != null) {
        iconImage = iconCache.get(iconId);
      }

      if (iconImage == null) {
        try {
          iconImage = await ImageUtils.getImage(icon.getData());
        } catch (e) {
          throw new GeoPackageException('Failed to get the Icon Row image. Id: ' + iconId + ', Name: ' + icon.getName());
        }

        const dataWidth = iconImage.width;
        const dataHeight = iconImage.height;
        let iconWidth = icon.getWidth();
        let iconHeight = icon.getHeight();

        let scaleImage = iconWidth != null || iconHeight != null;
        if (!scaleImage && scale != 1.0) {
          iconWidth = dataWidth;
          iconHeight = dataHeight;
          scaleImage = true;
        }

        if (scaleImage) {
          if (iconWidth == null) {
            iconWidth = dataWidth * (iconHeight / dataHeight);
          } else if (iconHeight == null) {
            iconHeight = dataHeight * (iconWidth / dataWidth);
          }

          const scaledWidth = Math.round(scale * iconWidth);
          const scaledHeight = Math.round(scale * iconHeight);

          if (scaledWidth != dataWidth || scaledHeight != dataHeight) {
            iconImage = await ImageUtils.scaleImage(iconImage, scaledWidth, scaledHeight);
          }
        }

        if (iconCache != null) {
          iconCache.putIconForIconRow(icon, iconImage);
        }
      }
    }
    return iconImage;
  }
}
