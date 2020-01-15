import { GeoPackage } from '../../geoPackage';
import { BaseExtension } from '../baseExtension';
import { Extension } from '../extension';

export class WebPExtension extends BaseExtension {
  public static readonly EXTENSION_NAME: string = 'gpkg_webp';
  public static readonly EXTENSION_WEBP_AUTHOR: string = 'gpkg';
  public static readonly EXTENSION_WEBP_NAME_NO_AUTHOR: string = 'webp';
  public static readonly EXTENSION_WEBP_DEFINITION: string = 'http://www.geopackage.org/spec/#extension_webp';
  constructor(geoPackage: GeoPackage, tableName: string) {
    super(geoPackage);
    this.tableName = tableName;
  }
  getOrCreateExtension(): Promise<Extension> {
    return this.getOrCreate(
      WebPExtension.EXTENSION_NAME,
      this.tableName,
      'tile_data',
      WebPExtension.EXTENSION_WEBP_DEFINITION,
      Extension.READ_WRITE,
    );
  }
}
