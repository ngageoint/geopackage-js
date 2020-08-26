/**
 * MetadataExtension module.
 * @module extension/metadata
 */

import { BaseExtension } from '../baseExtension';
import { GeoPackage } from '../../geoPackage';
import { Extension } from '../extension';
import { MetadataReferenceDao } from '../../metadata/reference/metadataReferenceDao';
import { MetadataDao } from '../../metadata/metadataDao';

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
  getOrCreateExtension(): Extension {
    return this.getOrCreate(this.extensionName, null, null, this.extensionDefinition, Extension.READ_WRITE);
  }

  has() {
    return this.hasExtension(MetadataExtension.EXTENSION_NAME, null, null);
  }

  removeExtension() {
    if (this.geoPackage.isTable(MetadataReferenceDao.TABLE_NAME)) {
      this.geoPackage.dropTable(MetadataReferenceDao.TABLE_NAME);
    }
    if (this.geoPackage.isTable(MetadataDao.TABLE_NAME)) {
      this.geoPackage.dropTable(MetadataDao.TABLE_NAME);
    }
    try {
      if (this.extensionsDao.isTableExists()) {
        this.extensionsDao.deleteByExtension(MetadataExtension.EXTENSION_NAME);
      }
    } catch (e) {
      throw new Error("Failed to delete Schema extension. GeoPackage: " + this.geoPackage.name);
    }
  }
}
