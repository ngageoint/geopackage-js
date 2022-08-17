import { GeoPackage } from '../geoPackage';
import { Extensions } from './extensions';
import { BaseExtension } from './baseExtension';
import { ExtensionScopeType } from './extensionScopeType';
import { GeoPackageConstants } from '../geoPackageConstants';
import { SpatialReferenceSystem } from '../srs/spatialReferenceSystem';
import { AlterTable } from '../db/alterTable';
import { SpatialReferenceSystemConstants } from '../srs/spatialReferenceSystemConstants';

/**
 * OGC Well known text representation of Coordinate Reference Systems extensionName
 */
export class CrsWktExtension extends BaseExtension {
  /**
   * Name
   */
  public static readonly NAME = 'crs_wkt';

  /**
   * Extension name
   */
  public static readonly EXTENSION_NAME =
    GeoPackageConstants.EXTENSION_AUTHOR + Extensions.EXTENSION_NAME_DIVIDER + CrsWktExtension.NAME;

  /**
   * Extension definition URL
   */
  public static readonly DEFINITION = 'http://www.geopackage.org/spec/#extension_crs_wkt';

  /**
   * Extension new column name
   */
  public static readonly COLUMN_NAME = 'definition_12_063';

  /**
   * Extension new column definition
   */
  public static readonly COLUMN_DEF = "TEXT NOT NULL DEFAULT ''";

  /**
   * OGC Well known text representation of Coordinate Reference Systems extensionName
   */
  constructor(geoPackage: GeoPackage) {
    super(geoPackage);
    this.extensionName = CrsWktExtension.EXTENSION_NAME;
    this.extensionDefinition = CrsWktExtension.DEFINITION;
  }
  /**
   * Get or create the extension
   */
  getOrCreateExtension(): Extensions {
    if (!this.hasColumn()) {
      this.createColumn();
    }
    return this.getOrCreate(this.extensionName, null, null, this.extensionDefinition, ExtensionScopeType.READ_WRITE);
  }

  has(): boolean {
    return this.hasExtension(CrsWktExtension.EXTENSION_NAME, null, null);
  }

  /**
   * Update the extension definition
   *
   * @param srsId
   *            srs id
   * @param definition
   *            definition
   */
  public updateDefinition(srsId: number, definition: string): void {
    this.connection.run(
      'UPDATE ' +
        SpatialReferenceSystem.TABLE_NAME +
        ' SET ' +
        CrsWktExtension.COLUMN_NAME +
        " = '" +
        definition +
        "' WHERE " +
        SpatialReferenceSystem.COLUMN_SRS_ID +
        ' = ' +
        srsId,
    );
  }

  /**
   * Get the extension definition
   * @param srsId srs id
   * @return definition
   */
  public getDefinition(srsId: number): string {
    let definition = null;
    const record = this.connection.get(
      'SELECT ' +
        CrsWktExtension.COLUMN_NAME +
        ' FROM ' +
        SpatialReferenceSystem.TABLE_NAME +
        ' WHERE ' +
        SpatialReferenceSystem.COLUMN_SRS_ID +
        ' = ?',
      [srsId.toString()],
    );
    if (record != null) {
      definition = record[CrsWktExtension.COLUMN_NAME];
    }
    return definition;
  }

  /**
   * Create the extension column
   */
  private createColumn(): void {
    AlterTable.addColumn(
      this.connection,
      SpatialReferenceSystem.TABLE_NAME,
      CrsWktExtension.COLUMN_NAME,
      CrsWktExtension.COLUMN_DEF,
    );

    // Update the existing known SRS values
    this.updateDefinition(
      SpatialReferenceSystemConstants.WORLD_GEODETIC_SYSTEM_SRS_ID,
      SpatialReferenceSystemConstants.WORLD_GEODETIC_DEFINITION_12_063,
    );
    this.updateDefinition(
      SpatialReferenceSystemConstants.WEB_MERCATOR_SRS_ID,
      SpatialReferenceSystemConstants.WEB_MERCATOR_DEFINITION_12_063,
    );
    this.updateDefinition(
      SpatialReferenceSystemConstants.UNDEFINED_GEOGRAPHIC_SRS_ID,
      SpatialReferenceSystemConstants.UNDEFINED_GEOGRAPHIC_DEFINITION_12_063,
    );
    this.updateDefinition(
      SpatialReferenceSystemConstants.UNDEFINED_CARTESIAN_SRS_ID,
      SpatialReferenceSystemConstants.UNDEFINED_CARTESIAN_DEFINITION_12_063,
    );
  }

  /**
   * Determine if the GeoPackage SRS table has the extension column
   *
   * @return
   */
  private hasColumn(): boolean {
    return this.connection.columnExists(SpatialReferenceSystem.TABLE_NAME, CrsWktExtension.COLUMN_NAME);
  }

  /**
   * Leaves the column and values
   */
  removeExtension(): void {
    try {
      if (this.extensionsDao.isTableExists()) {
        this.extensionsDao.deleteByExtension(CrsWktExtension.EXTENSION_NAME);
      }
    } catch (e) {
      throw new Error('Failed to delete CrsWkt extension. GeoPackage: ' + this.geoPackage.getName());
    }
  }
}
