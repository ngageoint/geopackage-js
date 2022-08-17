import { GeoPackage } from './geoPackage';
import { GeoPackageManager } from './geoPackageManager';

/**
 * GeoPackage Cache
 * @since 5.0.0
 */
export class GeoPackageCache {
  /**
   * Cache of GeoPackage names and GeoPackages
   */
  private cache = new Map<string, GeoPackage>();

  /**
   * Close quietly flag
   */
  private closeQuietly = true;

  /**
   * Get the cached GeoPackage or open the GeoPackage file without caching it
   *
   * @param gppathOrByteArray GeoPackage buffer, Uint8Array or filePath
   * @return GeoPackage
   * @since 3.1.0
   */
  public async getOrNoCacheOpen(gppathOrByteArray: string | Uint8Array | Buffer): Promise<GeoPackage> {
    return this.getOrOpen(undefined, gppathOrByteArray, false);
  }

  /**
   * Get the cached GeoPackage or open the GeoPackage file without caching it
   *
   * @param name
   *            GeoPackage name, defaults to filePath's basename or 'geopackage' for buffers
   * @param gppathOrByteArray
   *            GeoPackage buffer, Uint8Array or filePath
   * @param cache
   *            true to cache opened GeoPackages
   * @return GeoPackage
   */
  private async getOrOpen(
    name: string,
    gppathOrByteArray: string | Uint8Array | Buffer,
    cache = false,
  ): Promise<GeoPackage> {
    let geoPackage = this.get(name);
    if (geoPackage == null) {
      geoPackage = await GeoPackageManager.open(gppathOrByteArray, name);
      if (cache) {
        this.add(geoPackage);
      }
    }
    return geoPackage;
  }

  /**
   * Is close quietly mode enabled
   *
   * @return true if close quiet mode
   */
  public isCloseQuietly(): boolean {
    return this.closeQuietly;
  }

  /**
   * Set the close quietly mode
   * @param closeQuietly true to close quietly
   */
  public setCloseQuietly(closeQuietly: boolean): void {
    this.closeQuietly = closeQuietly;
  }

  /**
   * Get the names of the cached GeoPackages
   *
   * @return set of cached GeoPackage names
   */
  public getNames(): string[] {
    return Object.keys(this.cache);
  }

  /**
   * Get the cached GeoPackages
   *
   * @return collection of cached GeoPackages
   */
  public getGeoPackages(): GeoPackage[] {
    return Object.values(this.cache);
  }

  /**
   * Determine if the cache has the GeoPackage name
   *
   * @param name
   *            GeoPackage name
   * @return true if has cached GeoPackage
   */
  public has(name: string): boolean {
    return this.cache.has(name);
  }

  /**
   * Get the GeoPackage with name
   *
   * @param name
   *            GeoPackage name
   * @return cached GeoPackage
   */
  public get(name: string): GeoPackage {
    return this.cache.get(name);
  }

  /**
   * Checks if the GeoPackage name exists in the cache
   *
   * @param name
   *            GeoPackage name
   * @return true if exists
   */
  public exists(name: string): boolean {
    return this.cache.has(name);
  }

  /**
   * Close all GeoPackages in the cache
   */
  public closeAll(): void {
    for (const geoPackage of this.cache.values()) {
      this.close(geoPackage);
    }
    this.cache.clear();
  }

  /**
   * Add a GeoPackage to the cache
   *
   * @param geoPackage
   *            GeoPackage
   */
  public add(geoPackage: GeoPackage): void {
    this.cache.set(geoPackage.getName(), geoPackage);
  }

  /**
   * Add the collection of GeoPackages
   * @param geoPackages GeoPackages
   */
  public addAll(geoPackages: GeoPackage[]): void {
    for (const geoPackage of geoPackages) {
      this.add(geoPackage);
    }
  }

  /**
   * Remove the GeoPackage with the name but does not close it, call
   * {@link #close(String)} to close and remove
   *
   * @param name
   *            GeoPackage name
   * @return removed GeoPackage
   */
  public remove(name: string): GeoPackage {
    const geoPackage = this.cache.get(name);
    this.cache.delete(name);
    return geoPackage;
  }

  /**
   * Clears all cached GeoPackages but does not close them, call
   * {@link #closeAll()} to close and clear all GeoPackages
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Remove and close the GeoPackage with name, same as {@link #close(String)}
   *
   * @param name
   *            GeoPackage name
   * @return true if found, removed, and closed
   */
  public removeAndClose(name: string): boolean {
    return this.closeWithName(name);
  }

  /**
   * Close the GeoPackage with name
   * @param name GeoPackage name
   * @return true if found and closed
   * @since 1.0.1
   */
  public closeWithName(name: string): boolean {
    const geoPackage = this.remove(name);
    if (geoPackage != null) {
      this.close(geoPackage);
    }
    return geoPackage != null;
  }

  /**
   * Close GeoPackages not specified in the retain GeoPackage names
   * @param retain GeoPackages to retain
   */
  public closeRetain(retain: string[]): void {
    const close = Object.keys(this.cache).filter(name => retain.indexOf(name) === -1);
    this.closeWithNames(close);
  }

  /**
   * Close GeoPackages with names
   * @param names GeoPackage names
   */
  public closeWithNames(names: string[]): void {
    for (const name of names) {
      this.closeWithName(name);
    }
  }

  /**
   * Close the GeoPackage
   * @param geoPackage GeoPackage
   */
  public close(geoPackage: GeoPackage): void {
    if (geoPackage != null) {
      try {
        geoPackage.close();
      } catch (e) {
        console.error('Error closing GeoPackage: ' + geoPackage.getName());
        if (!this.closeQuietly) {
          throw e;
        }
      }
    }
  }

  /**
   * Close the GeoPackage if it is cached (same GeoPackage instance)
   *
   * @param geoPackage GeoPackage
   * @return true if closed
   */
  public closeIfCached(geoPackage: GeoPackage): boolean {
    let closed = false;
    if (geoPackage != null) {
      const cached = this.get(geoPackage.getName());
      if (cached != null && cached == geoPackage) {
        closed = this.closeWithName(geoPackage.getName());
      }
    }
    return closed;
  }

  /**
   * Close the GeoPackage if it is not cached (GeoPackage not cached or
   * different instance)
   *
   * @param geoPackage
   *            GeoPackage
   * @return true if closed
   * @since 3.1.0
   */
  public closeIfNotCached(geoPackage: GeoPackage): boolean {
    let closed = false;
    if (geoPackage != null) {
      const cached = this.get(geoPackage.getName());
      if (cached == null || cached != geoPackage) {
        this.close(geoPackage);
        closed = true;
      }
    }
    return closed;
  }
}
