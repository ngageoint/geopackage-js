/**
 * @module user/custom
 */
import {UserDao} from '../userDao';
import {GeoPackage} from '../../geoPackage';
import {UserCustomTableReader} from './userCustomTableReader';
import {UserRow} from '../userRow';

/**
 * User Custom Dao
 * @class
 * @extends UserDao
 * @param  {module:geoPackage~GeoPackage} geoPackage      geopackage object
 * @param  {module:user/custom~UserCustomTable} userCustomTable user custom table
 */
export class UserCustomDao<T extends UserRow> extends UserDao<UserRow> {

  createObject(results: any) {
    return this.getRow(results);
  }
  /**
   * Create a new UserRow
   * @return {module:user/userRow~UserRow}
   */
  newRow(): UserRow {
    return new UserRow(this.table);
  }
  /**
   * Reads the table specified from the geopackage
   * @param  {module:geoPackage~GeoPackage} geoPackage      geopackage object
   * @param  {string} tableName       table name
   * @param  {string[]} [requiredColumns] required columns
   * @return {module:user/custom~UserCustomDao}
   */
  static readTable(geoPackage: GeoPackage, tableName: string, requiredColumns?: string[]): UserCustomDao<UserRow> {
    var reader = new UserCustomTableReader(tableName, requiredColumns);
    var userCustomTable = reader.readTable(geoPackage.getDatabase());
    return new UserCustomDao(geoPackage, userCustomTable);
  }
}