import type { GeoPackage } from '../geoPackage';

/**
 * Extension Management for deleting and copying extensions
 */
export abstract class ExtensionManagement {
  /**
   * GeoPackage
   */
  protected readonly geoPackage: GeoPackage;

  /**
   * Constructor
   *
   * @param geoPackage  GeoPackage
   */
  protected constructor(geoPackage: GeoPackage) {
    this.geoPackage = geoPackage;
  }

  /**
   * Get the GeoPackage
   *
   * @return GeoPackage
   */
  public getGeoPackage(): GeoPackage {
    return this.geoPackage;
  }

  /**
   * Get the extension author
   *
   * @return author
   */
  public abstract getAuthor(): string;

  /**
   * Delete all table extensions for the table
   *
   * @param table table name
   */
  public abstract deleteTableExtensions(table: string): void;

  /**
   * Delete all extensions including custom extension tables
   */
  public abstract deleteExtensions(): void;

  /**
   * Copy all table extensions for the table
   *
   * @param table
   *            table name
   * @param newTable
   *            new table name
   */
  public abstract copyTableExtensions(table: string, newTable: string): void;
}
