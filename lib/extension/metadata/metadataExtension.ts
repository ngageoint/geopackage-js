/**
 * MetadataExtension module.
 * @module extension/metadata
 */

import { BaseExtension } from '../baseExtension';
import { GeoPackage } from '../../geoPackage';
import { Extensions } from '../extensions';
import { ExtensionScopeType } from '../extensionScopeType';
import { GeoPackageException } from '../../geoPackageException';
import { MetadataReference } from './reference/metadataReference';
import { Metadata } from './metadata';

/**
 * Metadata extension
 * @param  {module:geoPackage~GeoPackage} geoPackage GeoPackage object
 * @class
 * @extends BaseExtension
 */
export class MetadataExtension extends BaseExtension {
  public static readonly EXTENSION_NAME: string = 'gpkg_metadata';
  public static readonly EXTENSION_Metadata_AUTHOR: string = 'gpkg';
  public static readonly EXTENSION_Metadata_NAME_NO_AUTHOR: string = 'metadata';
  public static readonly EXTENSION_Metadata_DEFINITION: string = 'http://www.geopackage.org/spec/#extension_metadata';

  constructor(geoPackage: GeoPackage) {
    super(geoPackage);
    this.extensionName = MetadataExtension.EXTENSION_NAME;
    this.extensionDefinition = MetadataExtension.EXTENSION_Metadata_DEFINITION;
  }
  /**
   * Get or create the metadata extension
   */
  getOrCreateExtension(): Extensions {
    return this.getOrCreate(this.extensionName, null, null, this.extensionDefinition, ExtensionScopeType.READ_WRITE);
  }

  has(): boolean {
    return this.hasExtension(MetadataExtension.EXTENSION_NAME, null, null);
  }

  removeExtension(): void {
    if (this.geoPackage.isTable(MetadataReference.TABLE_NAME)) {
      this.geoPackage.dropTable(MetadataReference.TABLE_NAME);
    }
    if (this.geoPackage.isTable(Metadata.TABLE_NAME)) {
      this.geoPackage.dropTable(Metadata.TABLE_NAME);
    }
    try {
      if (this.extensionsDao.isTableExists()) {
        this.extensionsDao.deleteByExtension(MetadataExtension.EXTENSION_NAME);
      }
    } catch (e) {
      throw new GeoPackageException('Failed to delete Schema extension. GeoPackage: ' + this.geoPackage.getName());
    }
  }
}
