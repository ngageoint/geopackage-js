import { BaseExtension } from './baseExtension';
import { Extensions } from './extensions';
import { GeoPackageConstants } from '../geoPackageConstants';
import { TileTable } from '../tiles/user/tileTable';
import { ExtensionScopeType } from './extensionScopeType';
import type { GeoPackage } from '../geoPackage';

/**
 * Zoom Other Intervals extension
 */
export class ZoomOtherExtension extends BaseExtension {
  /**
   * Name
   */
  public static readonly NAME: string = 'zoom_other';

  /**
   * Extension name
   */
  public static readonly EXTENSION_NAME: string =
    GeoPackageConstants.EXTENSION_AUTHOR + Extensions.EXTENSION_NAME_DIVIDER + ZoomOtherExtension.NAME;

  /**
   * Extension definition URL
   */
  public static readonly DEFINITION: string = 'https://www.geopackage.org/spec/#extension_zoom_other_intervals';

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
   * Get or create the extension
   *
   * @param tableName
   *            table name
   * @return extension
   */
  public getOrCreate(tableName: string): Extensions {
    return super.getOrCreate(
      ZoomOtherExtension.EXTENSION_NAME,
      tableName,
      TileTable.COLUMN_TILE_DATA,
      ZoomOtherExtension.DEFINITION,
      ExtensionScopeType.READ_WRITE,
    );
  }

  /**
   * Determine if the GeoPackage has the extension
   *
   * @param tableName
   *            table name
   * @return true if has extension
   */
  public has(tableName: string): boolean {
    return this.hasExtension(ZoomOtherExtension.EXTENSION_NAME, tableName, TileTable.COLUMN_TILE_DATA);
  }
}
