import path from 'path';
import { GeoPackage } from '../geoPackage';
import { GeoPackageConstants } from '../geoPackageConstants';

export class GeoPackageValidationError {
  constructor(public error: string, public fatal?: boolean) {}
}

export class GeoPackageValidate {
  /**
   * Check the file extension to see if it is a GeoPackage
   * @param  {string}   filePath Absolute path to the GeoPackage to create
   * @return {boolean} true if GeoPackage extension
   */
  static hasGeoPackageExtension(filePath: string): boolean {
    const extension = path.extname(filePath);
    return (
      extension &&
      extension !== '' &&
      (extension.toLowerCase() === '.' + GeoPackageConstants.GEOPACKAGE_EXTENSION.toLowerCase() ||
        extension.toLowerCase() === '.' + GeoPackageConstants.GEOPACKAGE_EXTENDED_EXTENSION.toLowerCase())
    );
  }

  /**
   * Validate the extension file as a GeoPackage
   * @param  {string}   filePath Absolute path to the GeoPackage to create
   * @return {GeoPackageValidationError}    error if the extension is not valid
   */
  static validateGeoPackageExtension(filePath: string): GeoPackageValidationError {
    if (!GeoPackageValidate.hasGeoPackageExtension(filePath)) {
      return new GeoPackageValidationError(
        "GeoPackage database file '" +
          filePath +
          "' does not have a valid extension of '" +
          GeoPackageConstants.GEOPACKAGE_EXTENSION +
          "' or '" +
          GeoPackageConstants.GEOPACKAGE_EXTENDED_EXTENSION +
          "'",
        true,
      );
    }
  }

  static validateMinimumTables(geoPackage: GeoPackage): GeoPackageValidationError[] {
    const errors: GeoPackageValidationError[] = [];
    const srsExists = geoPackage.spatialReferenceSystemDao.isTableExists();
    const contentsExists = geoPackage.contentsDao.isTableExists();
    if (!srsExists) {
      errors.push(new GeoPackageValidationError('gpkg_spatial_ref_sys table does not exist', true));
    }
    if (!contentsExists) {
      errors.push(new GeoPackageValidationError('gpkg_contents table does not exist', true));
    }
    return errors;
  }

  /**
   * Check the GeoPackage for the minimum required tables
   * @param  {Object}   geoPackage GeoPackage to check
   */
  static hasMinimumTables(geoPackage: GeoPackage): boolean {
    return this.validateMinimumTables(geoPackage).length == 0;
  }
}
