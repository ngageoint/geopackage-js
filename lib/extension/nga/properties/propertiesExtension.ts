import { BaseExtension } from '../../baseExtension';
import { Extensions } from '../../extensions';
import { NGAExtensionsConstants } from '../ngaExtensionsConstants';
import { Constraints } from '../../../db/table/constraints';
import { UniqueConstraint } from '../../../db/table/uniqueConstraint';
import { AttributesColumn } from '../../../attributes/attributesColumn';
import { GeoPackageDataType } from '../../../db/geoPackageDataType';
import { AttributesDao } from '../../../attributes/attributesDao';
import { AttributesRow } from '../../../attributes/attributesRow';
import { GeoPackageException } from '../../../geoPackageException';
import { DBValue } from '../../../db/dbValue';
import { ColumnValues } from '../../../dao/columnValues';
import { ExtensionScopeType } from '../../extensionScopeType';
import { AttributesTableMetadata } from '../../../attributes/attributesTableMetadata';
import type { GeoPackage } from '../../../geoPackage';

/**
 * GeoPackage properties core extension for defining GeoPackage specific
 * properties, attributes, and metadata
 * <p>
 * <a href=
 * "http://ngageoint.github.io/GeoPackage/docs/extensions/properties.html">http://ngageoint.github.io/GeoPackage/docs/extensions/properties.html</a>
 *
 */
export class PropertiesExtension extends BaseExtension {
  /**
   * Extension author
   */
  public static readonly EXTENSION_AUTHOR: string = NGAExtensionsConstants.EXTENSION_AUTHOR;

  /**
   * Extension name without the author
   */
  public static readonly EXTENSION_NAME_NO_AUTHOR: string = 'properties';

  /**
   * Extension, with author and name
   */
  public static readonly EXTENSION_NAME: string = Extensions.buildExtensionName(
    PropertiesExtension.EXTENSION_AUTHOR,
    PropertiesExtension.EXTENSION_NAME_NO_AUTHOR,
  );

  /**
   * Extension definition URL
   */
  public static readonly EXTENSION_DEFINITION: string =
    'http://ngageoint.github.io/GeoPackage/docs/extensions/properties.html';

  /**
   * Table name
   */
  public static readonly TABLE_NAME: string = PropertiesExtension.EXTENSION_NAME;

  /**
   * Property column
   */
  public static readonly COLUMN_PROPERTY: string = 'property';

  /**
   * Value column
   */
  public static readonly COLUMN_VALUE: string = 'value';

  /**
   * Constructor
   *
   * @param geoPackage
   *            GeoPackage
   *
   */
  public constructor(geoPackage: GeoPackage) {
    super(geoPackage);
  }

  /**
   * {@inheritDoc}
   */

  public getGeoPackage(): GeoPackage {
    return this.geoPackage;
  }

  /**
   * Get or create the extension
   * @return extension
   */
  public getOrCreate(): Extensions {
    // Create the attributes table
    if (!this.geoPackage.isTableOrView(PropertiesExtension.TABLE_NAME)) {
      const propertyColumn = AttributesColumn.createColumn(
        PropertiesExtension.COLUMN_PROPERTY,
        GeoPackageDataType.TEXT,
        true,
        null,
      );
      const valueColumn = AttributesColumn.createColumn(PropertiesExtension.COLUMN_VALUE, GeoPackageDataType.TEXT);
      const additionalColumns: AttributesColumn[] = [];
      additionalColumns.push(propertyColumn);
      additionalColumns.push(valueColumn);
      const constraints = new Constraints();
      constraints.add(new UniqueConstraint(undefined, propertyColumn, valueColumn));
      this.geoPackage.createAttributesTableWithMetadata(
        AttributesTableMetadata.create(PropertiesExtension.TABLE_NAME, additionalColumns, constraints),
      );
    }

    return super.getOrCreate(
      PropertiesExtension.EXTENSION_NAME,
      PropertiesExtension.TABLE_NAME,
      null,
      PropertiesExtension.EXTENSION_DEFINITION,
      ExtensionScopeType.READ_WRITE,
    );
  }

  /**
   * Determine if the GeoPackage has the extension
   *
   * @return true if has extension
   */
  public has(): boolean {
    return (
      super.hasExtension(PropertiesExtension.EXTENSION_NAME, PropertiesExtension.TABLE_NAME, null) &&
      this.geoPackage.isTableOrView(PropertiesExtension.TABLE_NAME)
    );
  }

  /**
   * Get AttributesDao
   * @protected
   */
  protected getDao(): AttributesDao {
    return this.getGeoPackage().getAttributesDao(PropertiesExtension.TABLE_NAME);
  }

  /**
   * {@inheritDoc}
   */
  protected newRow(): AttributesRow {
    return this.getDao().newRow();
  }

  /**
   * Get the number of properties
   *
   * @return property count
   */
  public numProperties(): number {
    return this.getProperties().length;
  }

  /**
   * Get the properties
   * @return list of properties
   */

  public getProperties(): string[] {
    let properties = [];
    if (this.has()) {
      properties = this.getDao()
        .querySingleColumnTypedResultsWithColumnIndex(
          'SELECT DISTINCT ' + PropertiesExtension.COLUMN_PROPERTY + ' FROM ' + PropertiesExtension.TABLE_NAME,
          null,
        )
        .map(result => result[PropertiesExtension.COLUMN_PROPERTY]);
    }
    return properties;
  }

  /**
   * Check if the property exists, same call as {@link #hasValues(String)}
   * @param property property name
   * @return true if has property
   */
  public hasProperty(property: string): boolean {
    return this.hasValues(property);
  }

  /**
   * Get the number of total values combined for all properties
   *
   * @return number of total property values
   */
  public numValues(): number {
    let count = 0;
    if (this.has()) {
      count = this.getDao().count();
    }
    return count;
  }

  /**
   * Get the number of values for the property
   *
   * @param property
   *            property name
   * @return number of values
   */
  public numValuesForProperty(property: string): number {
    let count = 0;
    if (this.has()) {
      const result = this.queryForValues(property);
      try {
        count = result.getCount();
      } finally {
        result.close();
      }
    }
    return count;
  }

  /**
   * Check if the property has a single value
   *
   * @param property
   *            property name
   * @return true if has a single value
   */
  public hasSingleValue(property: string): boolean {
    return this.numValuesForProperty(property) === 1;
  }

  /**
   * Check if the property has any values
   *
   * @param property
   *            property name
   * @return true if has any values
   */
  public hasValues(property: string): boolean {
    return this.numValuesForProperty(property) > 0;
  }

  /**
   * Get the first value for the property
   *
   * @param property  property name
   * @return value or null
   */
  public getValue(property: string): string {
    let value = null;
    const values = this.getValues(property);
    if (values.length !== 0) {
      value = values[0];
    }
    return value;
  }

  /**
   * Get the values for the property
   *
   * @param property property name
   * @return list of values
   */
  public getValues(property: string): string[] {
    return this.getValuesForResults(this.queryForValues(property));
  }

  /**
   * Check if the property has the value
   *
   * @param property
   *            property name
   * @param value
   *            property value
   * @return true if property has the value
   */
  public hasValue(property: string, value: string): boolean {
    let hasValue = false;
    if (this.has()) {
      const fieldValues = this.buildColumnValues(property, value);
      hasValue = this.getDao().countForFieldValues(fieldValues) > 0;
    }
    return hasValue;
  }

  /**
   * Add a property value, creating the extension if needed
   *
   * @param property
   *            property name
   * @param value
   *            value
   * @return true if added, false if already existed
   */
  public addValue(property: string, value: string): boolean {
    if (!this.has()) {
      this.getOrCreate();
    }
    let added = false;
    if (!this.hasValue(property, value)) {
      const row = this.newRow();
      row.setValueWithColumnName(PropertiesExtension.COLUMN_PROPERTY, property);
      row.setValueWithColumnName(PropertiesExtension.COLUMN_VALUE, value);
      this.getDao().create(row);
      added = true;
    }
    return added;
  }

  /**
   * Delete the property and all the property values
   * @param property property name
   * @return deleted values count
   */
  public deleteProperty(property: string): number {
    let count = 0;
    if (this.has()) {
      const dao = this.getDao();
      const where = dao.buildWhere(PropertiesExtension.COLUMN_PROPERTY, property);
      const whereArgs = dao.buildWhereArgs(property);
      count = dao.delete(where, whereArgs);
    }
    return count;
  }

  /**
   * Delete the property value
   *
   * @param property
   *            property name
   * @param value
   *            property value
   * @return deleted values count
   */
  public deleteValue(property: string, value: string): number {
    let count = 0;
    if (this.has()) {
      const fieldValues = this.buildColumnValues(property, value);
      count = this.getDao().deleteWithFieldValues(fieldValues);
    }
    return count;
  }

  /**
   * Delete all properties and values
   *
   * @return deleted values count
   */
  public deleteAll(): number {
    let count = 0;
    if (this.has()) {
      count = this.getDao().delete();
    }
    return count;
  }

  /**
   * Remove the extension
   */
  public removeExtension(): void {
    const extensionsDao = this.geoPackage.getExtensionsDao();
    if (this.geoPackage.isTable(PropertiesExtension.TABLE_NAME)) {
      const contentsDao = this.geoPackage.getContentsDao();
      contentsDao.deleteTable(PropertiesExtension.TABLE_NAME);
    }
    try {
      if (extensionsDao.isTableExists()) {
        extensionsDao.deleteByExtensionAndTableName(PropertiesExtension.EXTENSION_NAME, PropertiesExtension.TABLE_NAME);
      }
    } catch (e) {
      throw new GeoPackageException('Failed to delete Properties extension. GeoPackage: ' + this.geoPackage.getName());
    }
  }

  /**
   * Build field values from the property and value
   *
   * @param property property name
   * @param value property value
   * @return field values mapping
   */
  private buildColumnValues(property: string, value: string): ColumnValues {
    const columnValues = new ColumnValues();
    columnValues.addColumn(PropertiesExtension.COLUMN_PROPERTY, property);
    columnValues.addColumn(PropertiesExtension.COLUMN_VALUE, value);
    return columnValues;
  }

  /**
   * Query for the property values
   * @param property property name
   * @return result
   */
  private queryForValues(property: string): any {
    let result = null;
    if (this.has()) {
      result = this.getDao().queryForEqWithFieldAndValue(PropertiesExtension.COLUMN_PROPERTY, property);
    }
    return result;
  }

  /**
   * Get the values from the results and close the results
   * @param results  results
   * @return list of values
   */
  private getValuesForResults(results: Array<Record<string, DBValue>>): string[] {
    let values = [];
    if (results != null) {
      for (const result of results) {
        values = this.getColumnResults(PropertiesExtension.COLUMN_VALUE, results);
      }
    }

    return values;
  }

  /**
   * Get the results of a column at the index and close the results
   * @param property column index
   * @param results results
   * @return list of column index values
   */
  private getColumnResults(property: string, results: Array<Record<string, DBValue>>): string[] {
    const values = [];
    for (const result of results) {
      values.push(result[property]);
    }
    return values;
  }
}
