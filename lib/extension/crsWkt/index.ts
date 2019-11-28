import GeoPackage from "../../geoPackage";

/**
 * CrsWktExtension module.
 * @module extension/crsWkt
 */

var BaseExtension = require('../baseExtension')
  , Extension = require('../extension');

/**
 * OGC Well known text representation of Coordinate Reference Systems extensionName
 * @param  {module:geoPackage~GeoPackage} geoPackage GeoPackage object
 * @class
 * @extends BaseExtension
 */
export default class CrsWktExtension extends BaseExtension {
  constructor(geoPackage: GeoPackage) {
    super(geoPackage);
    this.extensionName = CrsWktExtension.EXTENSION_NAME;
    this.extensionDefinition = CrsWktExtension.EXTENSION_CRS_WKT_DEFINITION;
  }
  /**
   * Get or create the extension
   * @return {Promise<Extension>}
   */
  getOrCreateExtension(): Promise<typeof Extension> {
    return this.getOrCreate(this.extensionName, null, null, this.extensionDefinition, Extension.READ_WRITE);
  }
}

CrsWktExtension.EXTENSION_NAME = 'gpkg_crs_wkt';
CrsWktExtension.EXTENSION_CRS_WKT_AUTHOR = 'gpkg';
CrsWktExtension.EXTENSION_CRS_WKT_NAME_NO_AUTHOR = 'crs_wkt';
CrsWktExtension.EXTENSION_CRS_WKT_DEFINITION = 'http://www.geopackage.org/spec/#extension_crs_wkt';