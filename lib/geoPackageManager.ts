import path from 'path';
import fs from 'fs';
import { Db } from './db/db';
import { DBAdapter } from './db/dbAdapter';
import { GeoPackage } from './geoPackage';
import { GeoPackageConnection } from './db/geoPackageConnection';
import { GeoPackageException } from './geoPackageException';
import { GeoPackageValidate } from './validate/geoPackageValidate';
import { Canvas } from './canvas/canvas';

/**
 * GeoPackage Manager used to create and open GeoPackages
 */
export class GeoPackageManager {
  static readonly version: string = '5.0.0';
  /**
   * In Node, open a GeoPackage file at the given path, or in a browser, load an in-memory GeoPackage from the given byte array.
   * @param  {string|Uint8Array|Buffer} gppathOrByteArray path to the GeoPackage file or `Uint8Array` of GeoPackage bytes
   * @param  {string} name - name of GeoPackage, but defaults to file path in Node
   * @return {Promise<GeoPackage>} promise that resolves with the open {@link GeoPackage} object or rejects with an `Error`
   */
  static async open(gppathOrByteArray: string | Uint8Array | Buffer, name: string = undefined): Promise<GeoPackage> {
    let geoPackage: GeoPackage;
    const valid =
      typeof gppathOrByteArray !== 'string' ||
      (typeof gppathOrByteArray === 'string' &&
        (gppathOrByteArray.indexOf('http') === 0 ||
          !GeoPackageValidate.validateGeoPackageExtension(gppathOrByteArray)));
    if (!valid) {
      throw new GeoPackageException('Invalid GeoPackage - Invalid GeoPackage Extension');
    }
    try {
      await Canvas.initializeAdapter();
    } catch (e) {
      throw new GeoPackageException('Unable to initialize canvas.');
    }
    try {
      const connection = await GeoPackageManager.connect(gppathOrByteArray);
      if (gppathOrByteArray && typeof gppathOrByteArray === 'string') {
        geoPackage = new GeoPackage(name ? name : path.basename(gppathOrByteArray), gppathOrByteArray, connection);
      } else {
        geoPackage = new GeoPackage(name ? name : 'geopackage', undefined, connection);
      }
    } catch (e) {
      throw new GeoPackageException('Unable to open GeoPackage.');
    }
    return geoPackage;
  }

  /**
   * In Node, create a GeoPackage file at the given file path, or in a browser,
   * create an in-memory GeoPackage.
   * @param  {string} gppath path of the created GeoPackage file; ignored in the browser
   * @return {Promise<typeof GeoPackage>} promise that resolves with the open {@link GeoPackage} object or rejects with an  `Error`
   */
  static async create(gppath?: string): Promise<GeoPackage> {
    let geoPackage: GeoPackage;
    const valid = typeof gppath !== 'string' ||
      (typeof gppath === 'string' && !GeoPackageValidate.validateGeoPackageExtension(gppath));
    if (!valid) {
      throw new GeoPackageException('Invalid GeoPackage');
    }

    if (typeof process !== 'undefined' && process.version && gppath) {
      try {
        fs.mkdirSync(path.dirname(gppath));
      } catch (e) {
        // it's fine if we can't create the directory
      }
    }

    try {
      await Canvas.initializeAdapter();
    } catch (e) {
      console.error(e);
      throw new GeoPackageException('Unable to initialize canvas.');
    }
    try {
      const connection = await GeoPackageManager.connect(gppath);
      connection.setApplicationId();
      if (gppath) {
        geoPackage = new GeoPackage(path.basename(gppath), gppath, connection);
      } else {
        geoPackage = new GeoPackage('geopackage', undefined, connection);
      }
      await geoPackage.createRequiredTables();
      geoPackage.createSupportedExtensions();
    } catch (e) {
      console.error(e);
      throw new GeoPackageException('Unable to create GeoPackage.');
    }
    return geoPackage;
  }

  /**
   * Connects to the database and returns a GeoPackageConnection
   * @param filePath
   */
  static async connect(filePath: string | Buffer | Uint8Array): Promise<GeoPackageConnection> {
    let connection: DBAdapter = null;
    try {
      connection = Db.create(filePath);
      await connection.initialize();
    } catch (e) {
      throw new GeoPackageException('Failed to connect');
    }
    return new GeoPackageConnection(connection);
  }

  /**
   * Creates a GeoPackageConnection with an existing database adapter
   * @param db
   */
  static async connectWithDatabase(db: DBAdapter): Promise<GeoPackageConnection> {
    const connection = await new GeoPackageConnection(db);
    connection.setDBConnection(db);
    return connection;
  }
}
