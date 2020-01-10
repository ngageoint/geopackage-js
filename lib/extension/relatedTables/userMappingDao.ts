/**
 * @module extension/relatedTables
 */
import {UserCustomDao} from '../../user/custom/userCustomDao';
import GeoPackage from '../../geoPackage';
import UserMappingTable from './userMappingTable';
import UserMappingRow from './userMappingRow';
import ColumnValues from '../../dao/columnValues';
import UserRow from '../../user/userRow';
import { DataTypes } from '../../..';

/**
 * User Mapping DAO for reading user mapping data tables
 * @class
 * @param  {string} table table name
 * @param  {module:geoPackage~GeoPackage} geoPackage      geopackage object
 * @param {UserMappingTable} [userMappingTable]
 */
export class UserMappingDao<T extends UserMappingRow> extends UserCustomDao<UserMappingRow> {

  public table: UserMappingTable;
  
  constructor(userCustomDao: UserCustomDao<UserMappingRow>, geoPackage: GeoPackage, userMappingTable?: UserMappingTable) {
    super(geoPackage, userMappingTable || new UserMappingTable(userCustomDao.table.table_name, userCustomDao.table.columns));
  }
  /**
   * Create a new {module:user/custom~UserCustomTable}
   * @param  {module:user/custom~UserCustomDao} userCustomDao
   * @return {module:user/custom~UserCustomTable} userCustomTable user custom table
   */
  createMappingTable(userCustomDao: UserCustomDao<UserRow>) {
    return new UserMappingTable(userCustomDao.table.table_name, userCustomDao.table.columns);
  }
  /**
   * Create a new {module:extension/relatedTables~UserMappingRow}
   * @return {module:extension/relatedTables~UserMappingRow}
   */
  newRow(): UserMappingRow {
    return new UserMappingRow(this.table);
  }
  /**
   * Gets the {module:extension/relatedTables~UserMappingTable}
   * @return {module:extension/relatedTables~UserMappingTable}
   */
  getTable(): UserMappingTable {
    return this.table;
  }
  /**
   * Create a user mapping row
   * @param  {module:db/dataTypes[]} columnTypes  column types
   * @param  {module:dao/columnValues~ColumnValues[]} values      values
   * @return {module:extension/relatedTables~UserMappingRow}             user mapping row
   */
  newRowWithColumnTypes(columnTypes: DataTypes[], values: ColumnValues[]): UserMappingRow {
    return new UserMappingRow(this.table, columnTypes, values);
  }
  /**
   * Gets the user mapping row from the result
   * @param  {Object} result db result
   * @return {module:extension/relatedTables~UserMappingRow}             user mapping row
   */
  getUserMappingRow(result: any): UserMappingRow {
    return this.getRow(result);
  }
  /**
   * Query by base id
   * @param  {(UserMappingRow | Number)} baseId base id
   * @return {Object[]}
   */
  queryByBaseId(baseId: UserMappingRow | number): any[] {
    return this.queryForAllEq(UserMappingTable.COLUMN_BASE_ID, baseId instanceof UserMappingRow ? baseId.getBaseId() : baseId);
  }
  /**
   * Query by related id
   * @param  {(Number & UserMappingRow)} relatedId related id
   * @return {Object[]}
   */
  queryByRelatedId(relatedId: UserMappingRow | number): any[] {
    return this.queryForAllEq(UserMappingTable.COLUMN_RELATED_ID, relatedId instanceof UserMappingRow ? relatedId.getRelatedId() : relatedId);
  }
  /**
   * Query by base id and related id
   * @param  {(UserMappingRow | Number)} baseId base id
   * @param  {(UserMappingRow | Number)} [relatedId] related id
   * @return {Iterable<any>}
   */
  queryByIds(baseId: UserMappingRow | number, relatedId?: UserMappingRow | number): IterableIterator<any> {
    var values = new ColumnValues();
    values.addColumn(UserMappingTable.COLUMN_BASE_ID, baseId instanceof UserMappingRow ? baseId.getBaseId() : baseId);
    if (relatedId !== undefined) {
      values.addColumn(UserMappingTable.COLUMN_RELATED_ID, relatedId instanceof UserMappingRow ? relatedId.getRelatedId() : relatedId);
    }
    return this.queryForFieldValues(values);
  }
  /**
   * The unique related ids
   * @return {Number[]}
   */
  uniqueRelatedIds(): number[] {
    var query = 'SELECT DISTINCT ';
    query += UserMappingTable.COLUMN_RELATED_ID;
    query += ' FROM ';
    query += "'" + this.gpkgTableName + "'";
    return this.connection.all(query);
  }
  /**
   * Count user mapping rows by base id and related id
   * @param  {(UserMappingRow | Number)} baseId    base id
   * @param  {(UserMappingRow | Number)} [relatedId] related id
   * @return {Number}
   */
  countByIds(baseId: UserMappingRow | number, relatedId?: UserMappingRow | number): number {
    var values = new ColumnValues();
    values.addColumn(UserMappingTable.COLUMN_BASE_ID, baseId instanceof UserMappingRow ? baseId.getBaseId() : baseId);
    if (relatedId !== undefined) {
      values.addColumn(UserMappingTable.COLUMN_RELATED_ID, relatedId instanceof UserMappingRow ? relatedId.getRelatedId() : relatedId);
    }
    return this.count(values);
  }
  /**
   * Delete by base id
   * @param  {(UserMappingRow | Number)} baseId base id
   * @return {Number} number of deleted rows
   */
  deleteByBaseId(baseId: UserMappingRow | number): number {
    var where = '';
    where += this.buildWhereWithFieldAndValue(UserMappingTable.COLUMN_BASE_ID, baseId instanceof UserMappingRow ? baseId.getBaseId() : baseId);
    var whereArgs = this.buildWhereArgs([baseId instanceof UserMappingRow ? baseId.getBaseId() : baseId]);
    return this.deleteWhere(where, whereArgs);
  }
  /**
   * Delete by related id
   * @param  {(UserMappingRow | Number)} relatedId related id
   * @return {Number} number of deleted rows
   */
  deleteByRelatedId(relatedId: UserMappingRow | number): number {
    var where = '';
    where += this.buildWhereWithFieldAndValue(UserMappingTable.COLUMN_RELATED_ID, relatedId instanceof UserMappingRow ? relatedId.getRelatedId() : relatedId);
    var whereArgs = this.buildWhereArgs([relatedId instanceof UserMappingRow ? relatedId.getRelatedId() : relatedId]);
    return this.deleteWhere(where, whereArgs);
  }
  /**
   * Delete by base id and related id
   * @param  {(UserMappingRow | Number)} baseId    base id
   * @param  {(UserMappingRow | Number)} [relatedId] related id
   * @return {Number} number of deleted rows
   */
  deleteByIds(baseId: UserMappingRow | number, relatedId?: UserMappingRow | number): number {
    var where = '';
    var whereParams = [baseId instanceof UserMappingRow ? baseId.getBaseId() : baseId];
    where += this.buildWhereWithFieldAndValue(UserMappingTable.COLUMN_BASE_ID, baseId instanceof UserMappingRow ? baseId.getBaseId() : baseId);
    if (relatedId !== undefined) {
      where += ' and ';
      where += this.buildWhereWithFieldAndValue(UserMappingTable.COLUMN_RELATED_ID, relatedId instanceof UserMappingRow ? relatedId.getRelatedId() : relatedId);
      whereParams.push(relatedId instanceof UserMappingRow ? relatedId.getRelatedId() : relatedId);
    }
    var whereArgs = this.buildWhereArgs(whereParams);
    return this.deleteWhere(where, whereArgs);
  }
}