/**
 * MetadataExtension module.
 * @module extension/metadata
 */

import {BaseExtension} from '../baseExtension';
import {GeoPackage} from '../../geoPackage';
import {Extension} from '../extension';

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
  getOrCreateExtension(): Promise<Extension> {
    return this.getOrCreate(this.extensionName, null, null, this.extensionDefinition, Extension.READ_WRITE);
  }
}
