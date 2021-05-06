import { GeoPackage } from './geoPackage';
import { GeoPackageConnection } from './db/geoPackageConnection';
import { GeoPackageValidate } from './validate/geoPackageValidate';
import { Canvas } from './canvas/canvas';
import path from 'path';
import fs from 'fs';

/**
 * This module is the entry point to the GeoPackage API, providing static
 * methods for opening and building GeoPackage files.
 */

export class GeoPackageAPI {
  static readonly version: string = '3.0.0';
  /**
   * In Node, open a GeoPackage file at the given path, or in a browser, load an
   * in-memory GeoPackage from the given byte array.
   * @param  {string|Uint8Array|Buffer} gppathOrByteArray path to the GeoPackage file or `Uint8Array` of GeoPackage bytes
   * @return {Promise<GeoPackage>} promise that resolves with the open {@link module:geoPackage~GeoPackage} object or rejects with an `Error`
   */
  static async open(gppathOrByteArray: string | Uint8Array | Buffer): Promise<GeoPackage> {
    const valid =
      typeof gppathOrByteArray !== 'string' ||
      (typeof gppathOrByteArray === 'string' &&
        (gppathOrByteArray.indexOf('http') === 0 ||
          !GeoPackageValidate.validateGeoPackageExtension(gppathOrByteArray)));
    if (!valid) {
      throw new Error('Invalid GeoPackage - Invalid GeoPackage Extension');
    }
    const connection = await GeoPackageConnection.connect(gppathOrByteArray);
    await Canvas.initializeAdapter();
    let geoPackage;
    if (gppathOrByteArray && typeof gppathOrByteArray === 'string') {
      geoPackage = new GeoPackage(path.basename(gppathOrByteArray), gppathOrByteArray, connection);
    } else {
      geoPackage = new GeoPackage('geopackage', undefined, connection);
    }
    return geoPackage;
  }

  /**
   * In Node, create a GeoPackage file at the given file path, or in a browser,
   * create an in-memory GeoPackage.
   * @param  {string} gppath path of the created GeoPackage file; ignored in the browser
   * @return {Promise<typeof GeoPackage>} promise that resolves with the open {@link module:geoPackage~GeoPackage} object or rejects with an  `Error`
   */
  static async create(gppath?: string): Promise<GeoPackage> {
    const valid =
      typeof gppath !== 'string' ||
      (typeof gppath === 'string' && !GeoPackageValidate.validateGeoPackageExtension(gppath));
    if (!valid) {
      throw new Error('Invalid GeoPackage');
    }

    if (typeof process !== 'undefined' && process.version && gppath) {
      try {
        fs.mkdirSync(path.dirname(gppath));
      } catch (e) {
        // it's fine if we can't create the directory
      }
    }

    const connection = await GeoPackageConnection.connect(gppath);
    await Canvas.initializeAdapter();
    connection.setApplicationId();
    let geopackage: GeoPackage;
    if (gppath) {
      geopackage = new GeoPackage(path.basename(gppath), gppath, connection);
    } else {
      geopackage = new GeoPackage('geopackage', undefined, connection);
    }
    await geopackage.createRequiredTables();
    geopackage.createSupportedExtensions();

    return geopackage;
  }
}
