/**
 * @module user/custom
 */
import { UserDao } from '../userDao';
import { GeoPackage } from '../../geoPackage';
import { UserCustomTableReader } from './userCustomTableReader';
import { UserRow } from '../userRow';
import { UserCustomTable } from './userCustomTable';

/**
 * User Custom Dao
 * @class
 * @extends UserDao
 * @param  {module:geoPackage~GeoPackage} geoPackage      geopackage object
 * @param  {module:user/custom~UserCustomTable} userCustomTable user custom table
 */
export class UserCustomDao<T extends UserRow> extends UserDao<UserRow> {
  constructor(geoPackage: GeoPackage, table: UserCustomTable) {
    super(geoPackage, table);
  }
  createObject(results: any): UserRow {
    return this.getRow(results);
  }
  /**
   * Reads the table specified from the geopackage
   * @param  {module:geoPackage~GeoPackage} geoPackage      geopackage object
   * @param  {string} tableName       table name
   * @return {module:user/custom~UserCustomDao}
   */
  static readTable(geoPackage: GeoPackage, tableName: string): UserCustomDao<UserRow> {
    const reader = new UserCustomTableReader(tableName);
    const userCustomTable = reader.readTable(geoPackage.database);
    return new UserCustomDao(geoPackage, userCustomTable);
  }
}
