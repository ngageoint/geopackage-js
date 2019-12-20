import GeoPackage from "../../geoPackage";

/**
 * WebPExtension module.
 * @module WebPExtension
 * @see module:extension/BaseExtension
 */

import BaseExtension from '../baseExtension'
import Extension from '../extension';

export default class WebPExtension extends BaseExtension {
  public static readonly EXTENSION_NAME = 'gpkg_webp';
  public static readonly EXTENSION_WEBP_AUTHOR = 'gpkg';
  public static readonly EXTENSION_WEBP_NAME_NO_AUTHOR = 'webp';
  public static readonly EXTENSION_WEBP_DEFINITION = 'http://www.geopackage.org/spec/#extension_webp';
  constructor(geoPackage: GeoPackage, tableName: string) {
    super(geoPackage);
    this.tableName = tableName;
  }
  getOrCreateExtension(): Promise<Extension> {
    return this.getOrCreate(WebPExtension.EXTENSION_NAME, this.tableName, 'tile_data', WebPExtension.EXTENSION_WEBP_DEFINITION, Extension.READ_WRITE);
  }
}