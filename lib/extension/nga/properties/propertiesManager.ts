import { PropertiesExtension } from './propertiesExtension';
import { GeoPackage } from '../../../geoPackage';

/**
 * Properties Manager Core using the Properties Extension on a group of cached
 * GeoPackages
 *
 */
export class PropertiesManager {
  /**
   * GeoPackage name to properties extension map
   */
  private readonly propertiesMap: Map<string, PropertiesExtension> = new Map();

  protected constructor();
  protected constructor(geoPackage: GeoPackage);
  protected constructor(geoPackages: GeoPackage[]);

  /**
   * Constructor
   * @param args
   */
  protected constructor(...args) {
    if (args.length === 1 && args[0] instanceof GeoPackage) {
      this.addGeoPackage(args[0]);
    } else if (args.length === 1 && args[0].length != null) {
      this.addGeoPackages(args[0]);
    }
  }

  public getPropertiesExtension(geoPackage: GeoPackage): PropertiesExtension {
    return new PropertiesExtension(geoPackage);
  }

  /**
   * Get the GeoPackage names
   * @return names
   */
  public getGeoPackageNames(): string[] {
    const keys = [];
    for (const key of this.propertiesMap.keys()) {
      keys.push(key);
    }
    return keys;
  }

  /**
   * Get the number of GeoPackages
   *
   * @return GeoPackage count
   */
  public numGeoPackages(): number {
    return this.propertiesMap.size;
  }

  /**
   * Get the GeoPackages
   *
   * @return collection of GeoPackages
   */
  public getGeoPackages(): GeoPackage[] {
    const geoPackages = [];
    for (const properties of this.propertiesMap.values()) {
      geoPackages.push(properties.getGeoPackage());
    }
    return geoPackages;
  }

  /**
   * Checks if the GeoPackage name exists
   * @param name GeoPackage name
   * @return true if exists
   */
  public hasGeoPackage(name: string): boolean {
    return this.propertiesMap.get(name) != null;
  }

  /**
   * Get the GeoPackage for the GeoPackage name
   * @param name  GeoPackage name
   * @return GeoPackage
   */
  public getGeoPackage(name: string): GeoPackage {
    let geoPackage = null;
    const properties = this.propertiesMap.get(name);
    if (properties != null) {
      geoPackage = properties.getGeoPackage();
    }
    return geoPackage;
  }

  /**
   * Add a collection of GeoPackages
   *
   * @param geoPackages
   *            GeoPackages
   */
  public addGeoPackages(geoPackages: GeoPackage[]): void {
    for (const geoPackage of geoPackages) {
      this.addGeoPackage(geoPackage);
    }
  }

  /**
   * Add GeoPackage
   *
   * @param geoPackage
   *            GeoPackage
   */
  public addGeoPackage(geoPackage: GeoPackage): void {
    this.propertiesMap.set(geoPackage.getName(), this.getPropertiesExtension(geoPackage));
  }

  /**
   * Close all GeoPackages in the manager
   */
  public closeGeoPackages(): void {
    for (const properties of this.propertiesMap.values()) {
      properties.getGeoPackage().close();
    }
    this.propertiesMap.clear();
  }

  /**
   * Remove the GeoPackage with the name but does not close it
   *
   * @param name
   *            GeoPackage name
   * @return removed GeoPackage
   */
  public removeGeoPackage(name: string): GeoPackage {
    let removed = null;
    const properties = this.propertiesMap.get(name);
    this.propertiesMap.delete(name);
    if (properties != null) {
      removed = properties.getGeoPackage();
    }
    return removed;
  }

  /**
   * Clears all cached GeoPackages but does not close them
   */
  public clearGeoPackages(): void {
    this.propertiesMap.clear();
  }

  /**
   * Remove and close the GeoPackage with name, same as
   * {@link #closeGeoPackage(String)}
   *
   * @param name
   *            GeoPackage name
   * @return true if found, removed, and closed
   */
  public removeAndCloseGeoPackage(name: string): boolean {
    return this.closeGeoPackage(name);
  }

  /**
   * Close the GeoPackage with name
   *
   * @param name
   *            GeoPackage name
   * @return true if found and closed
   */
  public closeGeoPackage(name: string): boolean {
    const geoPackage = this.removeGeoPackage(name);
    if (geoPackage != null) {
      geoPackage.close();
    }
    return geoPackage != null;
  }

  /**
   * Close GeoPackages not specified in the retain GeoPackage names
   *
   * @param retain
   *            GeoPackages to retain
   */
  public closeRetainGeoPackages(retain: string[]): void {
    const close = [];

    for (const key of this.propertiesMap.keys()) {
      if (retain.indexOf(key) === -1) {
        close.push(key);
      }
    }
    for (const name of close) {
      this.closeGeoPackage(name);
    }
  }

  /**
   * Close GeoPackages with names
   *
   * @param names GeoPackage names
   */
  public closeGeoPackagesWithNames(names: string[]): void {
    for (const name of names) {
      this.closeGeoPackage(name);
    }
  }

  /**
   * Get the number of unique properties
   *
   * @return property count
   */
  public numProperties(): number {
    return this.getProperties().length;
  }

  /**
   * Get the unique properties
   *
   * @return set of properties
   */
  public getProperties(): string[] {
    const allProperties = [];
    for (const properties of this.propertiesMap.values()) {
      allProperties.push(...properties.getProperties());
    }
    return allProperties;
  }

  /**
   * Get the GeoPackages with the property name
   *
   * @param property property name
   * @return GeoPackages
   */
  public hasProperty(property: string): GeoPackage[] {
    const geoPackages = [];
    for (const properties of this.propertiesMap.values()) {
      if (properties.hasProperty(property)) {
        geoPackages.push(properties.getGeoPackage());
      }
    }
    return geoPackages;
  }

  /**
   * Get the GeoPackages missing the property name
   *
   * @param property property name
   * @return GeoPackages
   */
  public missingProperty(property: string): GeoPackage[] {
    const geoPackages = [];
    for (const properties of this.propertiesMap.values()) {
      if (!properties.hasProperty(property)) {
        geoPackages.push(properties.getGeoPackage());
      }
    }
    return geoPackages;
  }

  /**
   * Get the number of unique values for the property
   * @param property property name
   * @return number of values
   */
  public numValues(property: string): number {
    return this.getValues(property).length;
  }

  /**
   * Check if the property has any values
   * @param property property name
   * @return true if has any values
   */
  public hasValues(property: string): boolean {
    return this.numValues(property) > 0;
  }

  /**
   * Get the unique values for the property
   * @param property property name
   * @return set of values
   */
  public getValues(property: string): string[] {
    const allValues = [];
    for (const properties of this.propertiesMap.values()) {
      allValues.push(...properties.getValues(property));
    }
    return allValues;
  }

  /**
   * Get the GeoPackages with the property name and value
   *
   * @param property
   *            property name
   * @param value
   *            property value
   * @return GeoPackages
   */
  public hasValue(property: string, value: string): GeoPackage[] {
    const geoPackages = [];
    for (const properties of this.propertiesMap.values()) {
      if (properties.hasValue(property, value)) {
        geoPackages.push(properties.getGeoPackage());
      }
    }
    return geoPackages;
  }

  /**
   * Get the GeoPackages missing the property name and value
   *
   * @param property
   *            property name
   * @param value
   *            property value
   * @return GeoPackages
   */
  public missingValue(property: string, value: string): GeoPackage[] {
    const geoPackages = [];
    for (const properties of this.propertiesMap.values()) {
      if (!properties.hasValue(property, value)) {
        geoPackages.push(properties.getGeoPackage());
      }
    }
    return geoPackages;
  }

  /**
   * Add a property value to all GeoPackages
   *
   * @param property
   *            property name
   * @param value
   *            value
   * @return number of GeoPackages added to
   */
  public addValue(property: string, value: string): number {
    let count = 0;
    for (const geoPackage of this.propertiesMap.keys()) {
      if (this.addValueToGeoPackage(geoPackage, property, value)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Add a property value to a specified GeoPackage
   *
   * @param geoPackage
   *            GeoPackage name
   * @param property
   *            property name
   * @param value
   *            value
   * @return true if added
   */
  public addValueToGeoPackage(geoPackage: string, property: string, value: string): boolean {
    let added = false;
    const properties = this.propertiesMap.get(geoPackage);
    if (properties != null) {
      added = properties.addValue(property, value);
    }
    return added;
  }

  /**
   * Delete the property and values from all GeoPackages
   *
   * @param property
   *            property name
   * @return number of GeoPackages deleted from
   */
  public deleteProperty(property: string): number {
    let count = 0;
    for (const geoPackage of this.propertiesMap.keys()) {
      if (this.deletePropertyInGeoPackage(geoPackage, property)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Delete the property and values from a specified GeoPackage
   * @param geoPackage GeoPackage name
   * @param property property name
   * @return true if deleted
   */
  public deletePropertyInGeoPackage(geoPackage: string, property: string): boolean {
    let deleted = false;
    const properties = this.propertiesMap.get(geoPackage);
    if (properties != null) {
      deleted = properties.deleteProperty(property) > 0;
    }
    return deleted;
  }

  /**
   * Delete the property value from all GeoPackages
   *
   * @param property
   *            property name
   * @param value
   *            property value
   * @return number of GeoPackages deleted from
   */
  public deleteValue(property: string, value: string): number {
    let count = 0;
    for (const geoPackage of this.propertiesMap.keys()) {
      if (this.deleteValueInGeoPackage(geoPackage, property, value)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Delete the property value from a specified GeoPackage
   *
   * @param geoPackage
   *            GeoPackage name
   * @param property
   *            property name
   * @param value
   *            property value
   * @return true if deleted
   */
  public deleteValueInGeoPackage(geoPackage: string, property: string, value: string): boolean {
    let deleted = false;
    const properties = this.propertiesMap.get(geoPackage);
    if (properties != null) {
      deleted = properties.deleteValue(property, value) > 0;
    }
    return deleted;
  }

  /**
   * Delete all properties and values from all GeoPackages
   *
   * @return number of GeoPackages deleted from
   */
  public deleteAll(): number {
    let count = 0;
    for (const geoPackage of this.propertiesMap.keys()) {
      if (this.deleteAllByName(geoPackage)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Delete all properties and values from a specified GeoPackage
   *
   * @param geoPackage
   *            GeoPackage name
   * @return true if any deleted
   */
  public deleteAllByName(geoPackage: string): boolean {
    let deleted = false;
    const properties = this.propertiesMap.get(geoPackage);
    if (properties != null) {
      deleted = properties.deleteAll() > 0;
    }
    return deleted;
  }

  /**
   * Remove the extension from all GeoPackages
   */
  public removeExtension(): void {
    for (const geoPackage of this.propertiesMap.keys()) {
      this.removeExtensionByName(geoPackage);
    }
  }

  /**
   * Remove the extension from a specified GeoPackage
   *
   * @param geoPackage
   *            GeoPackage name
   */
  public removeExtensionByName(geoPackage: string): void {
    const properties = this.propertiesMap.get(geoPackage);
    if (properties != null) {
      properties.removeExtension();
    }
  }
}
