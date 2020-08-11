/**
 * @module extension/relatedTables
 */
import { UserCustomDao } from '../../user/custom/userCustomDao';
import { GeoPackage } from '../../geoPackage';
import { UserMappingTable } from './userMappingTable';
import { UserMappingRow } from './userMappingRow';
import { ColumnValues } from '../../dao/columnValues';
import { UserRow } from '../../user/userRow';
import { DBValue } from '../../db/dbAdapter';
import { GeoPackageDataType } from '../../db/geoPackageDataType';

/**
 * User Mapping DAO for reading user mapping data tables
 * @class
 * @param  {string} table table name
 * @param  {module:geoPackage~GeoPackage} geoPackage      geopackage object
 * @param {UserMappingTable} [userMappingTable]
 */
export class UserMappingDao<T extends UserMappingRow> extends UserCustomDao<UserMappingRow> {
  constructor(
    userCustomDao: UserCustomDao<UserMappingRow>,
    geoPackage: GeoPackage,
    userMappingTable?: UserMappingTable,
  ) {
    super(
      geoPackage,
      userMappingTable || UserMappingDao.createMappingTable(userCustomDao),
    );
  }
  /**
   * Create a new {module:user/custom~UserCustomTable}
   * @param  {module:user/custom~UserCustomDao} userCustomDao
   * @return {module:user/custom~UserCustomTable} userCustomTable user custom table
   */
  static createMappingTable(userCustomDao: UserCustomDao<UserRow>): UserMappingTable {
    return new UserMappingTable(userCustomDao.table.getTableName(), userCustomDao.table.getUserColumns().getColumns(), UserMappingTable.requiredColumns())
  }
  /**
   * Gets the {module:extension/relatedTables~UserMappingTable}
   * @return {module:extension/relatedTables~UserMappingTable}
   */
  get table(): UserMappingTable {
    return this._table as UserMappingTable;
  }
  /**
   * Create a user mapping row
   * @param  {module:db/geoPackageDataType[]} columnTypes  column types
   * @param  {module:dao/columnValues~ColumnValues[]} values      values
   * @return {module:extension/relatedTables~UserMappingRow}             user mapping row
   */
  newRow(columnTypes?: { [key: string]: GeoPackageDataType }, values?: Record<string, DBValue>): UserMappingRow {
    return new UserMappingRow(this.table, columnTypes, values);
  }
  /**
   * Gets the user mapping row from the result
   * @param  {Object} result db result
   * @return {module:extension/relatedTables~UserMappingRow}             user mapping row
   */
  getUserMappingRow(result: Record<string, DBValue>): UserMappingRow {
    return this.getRow(result) as UserMappingRow;
  }
  /**
   * Query by base id
   * @param  {(UserMappingRow | Number)} baseId base id
   * @return {Object[]}
   */
  queryByBaseId(baseId: UserMappingRow | number): Record<string, DBValue>[] {
    return this.queryForAllEq(
      UserMappingTable.COLUMN_BASE_ID,
      baseId instanceof UserMappingRow ? baseId.baseId : baseId,
    );
  }
  /**
   * Query by related id
   * @param  {(Number & UserMappingRow)} relatedId related id
   * @return {Object[]}
   */
  queryByRelatedId(relatedId: UserMappingRow | number): Record<string, DBValue>[] {
    return this.queryForAllEq(
      UserMappingTable.COLUMN_RELATED_ID,
      relatedId instanceof UserMappingRow ? relatedId.relatedId : relatedId,
    );
  }
  /**
   * Query by base id and related id
   * @param  {(UserMappingRow | Number)} baseId base id
   * @param  {(UserMappingRow | Number)} [relatedId] related id
   * @return {Iterable<any>}
   */
  queryByIds(
    baseId: UserMappingRow | number,
    relatedId?: UserMappingRow | number,
  ): IterableIterator<Record<string, DBValue>> {
    const values = new ColumnValues();
    values.addColumn(UserMappingTable.COLUMN_BASE_ID, baseId instanceof UserMappingRow ? baseId.baseId : baseId);
    if (relatedId !== undefined) {
      values.addColumn(
        UserMappingTable.COLUMN_RELATED_ID,
        relatedId instanceof UserMappingRow ? relatedId.relatedId : relatedId,
      );
    }
    return this.queryForFieldValues(values);
  }
  /**
   * The unique related ids
   * @return {Number[]}
   */
  uniqueRelatedIds(): { related_id: number }[] {
    let query = 'SELECT DISTINCT ';
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
    const values = new ColumnValues();
    values.addColumn(UserMappingTable.COLUMN_BASE_ID, baseId instanceof UserMappingRow ? baseId.baseId : baseId);
    if (relatedId !== undefined) {
      values.addColumn(
        UserMappingTable.COLUMN_RELATED_ID,
        relatedId instanceof UserMappingRow ? relatedId.relatedId : relatedId,
      );
    }
    return this.count(values);
  }
  /**
   * Delete by base id
   * @param  {(UserMappingRow | Number)} baseId base id
   * @return {Number} number of deleted rows
   */
  deleteByBaseId(baseId: UserMappingRow | number): number {
    let where = '';
    where += this.buildWhereWithFieldAndValue(
      UserMappingTable.COLUMN_BASE_ID,
      baseId instanceof UserMappingRow ? baseId.baseId : baseId,
    );
    const whereArgs = this.buildWhereArgs([baseId instanceof UserMappingRow ? baseId.baseId : baseId]);
    return this.deleteWhere(where, whereArgs);
  }
  /**
   * Delete by related id
   * @param  {(UserMappingRow | Number)} relatedId related id
   * @return {Number} number of deleted rows
   */
  deleteByRelatedId(relatedId: UserMappingRow | number): number {
    let where = '';
    where += this.buildWhereWithFieldAndValue(
      UserMappingTable.COLUMN_RELATED_ID,
      relatedId instanceof UserMappingRow ? relatedId.relatedId : relatedId,
    );
    const whereArgs = this.buildWhereArgs([relatedId instanceof UserMappingRow ? relatedId.relatedId : relatedId]);
    return this.deleteWhere(where, whereArgs);
  }
  /**
   * Delete by base id and related id
   * @param  {(UserMappingRow | Number)} baseId    base id
   * @param  {(UserMappingRow | Number)} [relatedId] related id
   * @return {Number} number of deleted rows
   */
  deleteByIds(baseId: UserMappingRow | number, relatedId?: UserMappingRow | number): number {
    let where = '';
    const whereParams = [baseId instanceof UserMappingRow ? baseId.baseId : baseId];
    where += this.buildWhereWithFieldAndValue(
      UserMappingTable.COLUMN_BASE_ID,
      baseId instanceof UserMappingRow ? baseId.baseId : baseId,
    );
    if (relatedId !== undefined) {
      where += ' and ';
      where += this.buildWhereWithFieldAndValue(
        UserMappingTable.COLUMN_RELATED_ID,
        relatedId instanceof UserMappingRow ? relatedId.relatedId : relatedId,
      );
      whereParams.push(relatedId instanceof UserMappingRow ? relatedId.relatedId : relatedId);
    }
    const whereArgs = this.buildWhereArgs(whereParams);
    return this.deleteWhere(where, whereArgs);
  }
}
