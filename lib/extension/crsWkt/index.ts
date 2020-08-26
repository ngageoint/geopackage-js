import { GeoPackage } from '../../geoPackage';
import { Extension } from '../extension';
import { BaseExtension } from '../baseExtension';

/**
 * OGC Well known text representation of Coordinate Reference Systems extensionName
 */
export class CrsWktExtension extends BaseExtension {
  public static readonly EXTENSION_NAME: string = 'gpkg_crs_wkt';
  public static readonly EXTENSION_CRS_WKT_AUTHOR: string = 'gpkg';
  public static readonly EXTENSION_CRS_WKT_NAME_NO_AUTHOR: string = 'crs_wkt';
  public static readonly EXTENSION_CRS_WKT_DEFINITION: string = 'http://www.geopackage.org/spec/#extension_crs_wkt';
  /**
   * OGC Well known text representation of Coordinate Reference Systems extensionName
   */
  constructor(geoPackage: GeoPackage) {
    super(geoPackage);
    this.extensionName = CrsWktExtension.EXTENSION_NAME;
    this.extensionDefinition = CrsWktExtension.EXTENSION_CRS_WKT_DEFINITION;
  }
  /**
   * Get or create the extension
   */
  getOrCreateExtension(): Extension {
    return this.getOrCreate(this.extensionName, null, null, this.extensionDefinition, Extension.READ_WRITE);
  }

  has() {
    return this.hasExtension(CrsWktExtension.EXTENSION_NAME, null, null);
  }

  removeExtension() {
    try {
      if (this.extensionsDao.isTableExists()) {
        this.extensionsDao.deleteByExtension(CrsWktExtension.EXTENSION_NAME);
      }
    } catch (e) {
      throw new Error("Failed to delete CrsWkt extension. GeoPackage: " + this.geoPackage.name);
    }
  }
}
