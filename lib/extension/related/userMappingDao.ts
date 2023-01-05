/**
 * @module extension/relatedTables
 */
import { UserCustomDao } from '../../user/custom/userCustomDao';
import { UserMappingTable } from './userMappingTable';
import { UserMappingRow } from './userMappingRow';
import { UserCustomResultSet } from '../../user/custom/userCustomResultSet';
import { UserCustomRow } from '../../user/custom/userCustomRow';
import { SQLUtils } from '../../db/sqlUtils';
import { DBValue } from '../../db/dbValue';

/**
 * User Mapping DAO for reading user mapping data tables
 */
export class UserMappingDao extends UserCustomDao {
  /**
   * Constructor
   * @param dao user custom data access object
   * @param userMappingTable user mapping table
   */
  public constructor(dao: UserCustomDao, userMappingTable?: UserMappingTable) {
    super(dao, userMappingTable != null ? userMappingTable : new UserMappingTable(dao.getTable()));
  }

  /**
   * {@inheritDoc}
   */
  public getTable(): UserMappingTable {
    return super.getTable() as UserMappingTable;
  }

  /**
   * {@inheritDoc}
   */
  public newRow(): UserMappingRow {
    return new UserMappingRow(this.getTable());
  }

  /**
   * Get the user mapping row from the current result set location
   * @param resultSet result set
   * @return user mapping row
   */
  public getRow(resultSet: UserCustomResultSet): UserMappingRow {
    return this.getRowWithUserCustomRow(resultSet.getRow());
  }

  /**
   * Get a user mapping row from the user custom row
   * @param row custom row
   * @return user mapping row
   */
  public getRowWithUserCustomRow(row: UserCustomRow): UserMappingRow {
    return new UserMappingRow(row);
  }

  /**
   * Query by base id
   * @param userMappingRow user mapping row
   * @return result set
   */
  public queryByBaseIdWithUserMappingRow(userMappingRow: UserMappingRow): UserCustomResultSet {
    return this.queryByBaseId(userMappingRow.getBaseId());
  }

  /**
   * Query by base id
   *
   * @param baseId
   *            base id
   * @return result set
   */
  public queryByBaseId(baseId: number): UserCustomResultSet {
    return this.queryForEqWithColumns(this.getTable().getColumnNames(), UserMappingTable.COLUMN_BASE_ID, baseId);
  }

  /**
   * Count by base id
   *
   * @param userMappingRow
   *            user mapping row
   * @return count
   */
  public countByBaseIdWithUserMappingRow(userMappingRow: UserMappingRow): number {
    return this.countByBaseId(userMappingRow.getBaseId());
  }

  /**
   * Count by base id
   * @param baseId base id
   * @return count
   */
  public countByBaseId(baseId: number): number {
    return this.countForEq(UserMappingTable.COLUMN_BASE_ID, baseId);
  }

  /**
   * Query by related id
   *
   * @param userMappingRow
   *            user mapping row
   * @return result set
   */
  public queryByRelatedIdWithUserMappingRow(userMappingRow: UserMappingRow): UserCustomResultSet {
    return this.queryByRelatedId(userMappingRow.getRelatedId());
  }

  /**
   * Query by related id
   *
   * @param relatedId
   *            related id
   * @return result set
   */
  public queryByRelatedId(relatedId: number): UserCustomResultSet {
    return this.queryForEqWithColumns(this.getTable().getColumnNames(), UserMappingTable.COLUMN_RELATED_ID, relatedId);
  }

  /**
   * Count by related id
   *
   * @param userMappingRow
   *            user mapping row
   * @return count
   */
  public countByRelatedIdWithUserMappingRow(userMappingRow: UserMappingRow): number {
    return this.countByRelatedId(userMappingRow.getRelatedId());
  }

  /**
   * Count by related id
   *
   * @param relatedId
   *            related id
   * @return count
   */
  public countByRelatedId(relatedId: number): number {
    return this.countForEq(UserMappingTable.COLUMN_RELATED_ID, relatedId);
  }

  /**
   * Query by both base id and related id
   *
   * @param userMappingRow
   *            user mapping row
   * @return result set
   */
  public queryByIdsWithUserMappingRow(userMappingRow: UserMappingRow): UserCustomResultSet {
    return this.queryByIds(userMappingRow.getBaseId(), userMappingRow.getRelatedId());
  }

  /**
   * Query by both base id and related id
   * @param baseId base id
   * @param relatedId related id
   * @return result set
   */
  public queryByIds(baseId: number, relatedId: number): UserCustomResultSet {
    return this.query(
      this.buildWhereIds(baseId, relatedId),
      this.buildWhereIdsArgs(baseId, relatedId),
    );
  }

  /**
   * Get the unique base ids
   * @return list of unique base ids
   */
  public uniqueBaseIds(): number[] {
    const uniqueBaseIds = [];
    const results = this.getDb().all(
      'SELECT DISTINCT ' +
        SQLUtils.quoteWrap(UserMappingTable.COLUMN_BASE_ID) +
        ' FROM ' +
        SQLUtils.quoteWrap(this.getTableName()),
    );
    for (const result of results) {
      uniqueBaseIds.push(result[UserMappingTable.COLUMN_BASE_ID]);
    }
    return uniqueBaseIds;
  }

  /**
   * Get the unique related ids
   * @return list of unique related idsx
   */
  public uniqueRelatedIds(): number[] {
    const uniqueBaseIds = [];
    const results = this.getDb().all(
      'SELECT DISTINCT ' +
        SQLUtils.quoteWrap(UserMappingTable.COLUMN_RELATED_ID) +
        ' FROM ' +
        SQLUtils.quoteWrap(this.getTableName()),
    );
    for (const result of results) {
      uniqueBaseIds.push(result[UserMappingTable.COLUMN_RELATED_ID]);
    }
    return uniqueBaseIds;
  }

  /**
   * Count by both base id and related id
   *
   * @param userMappingRow
   *            user mapping row
   * @return count
   */
  public countByIdsWithUserMappingRow(userMappingRow: UserMappingRow): number {
    return this.countByIds(userMappingRow.getBaseId(), userMappingRow.getRelatedId());
  }

  /**
   * Count by both base id and related id
   *
   * @param baseId base id
   * @param relatedId related id
   * @return count
   */
  public countByIds(baseId: number, relatedId: number): number {
    return this.count(
      this.buildWhereIds(baseId, relatedId),
      this.buildWhereIdsArgs(baseId, relatedId),
    );
  }

  /**
   * Delete user mappings by base id
   * @param userMappingRow user mapping row
   * @return rows deleted
   */
  public deleteByBaseIdWithUserMappingRow(userMappingRow: UserMappingRow): number {
    return this.deleteByBaseId(userMappingRow.getBaseId());
  }

  /**
   * Delete user mappings by base id
   * @param baseId  base id
   * @return rows deleted
   */
  public deleteByBaseId(baseId: number): number {
    const whereArgs = this.buildWhereArgs([baseId]);
    return this.delete(this.buildWhere(UserMappingTable.COLUMN_BASE_ID, baseId), whereArgs);
  }

  /**
   * Delete user mappings by related id
   *
   * @param userMappingRow
   *            user mapping row
   * @return rows deleted
   */
  public deleteByRelatedIdWithUserMappingRow(userMappingRow: UserMappingRow): number {
    return this.deleteByRelatedId(userMappingRow.getRelatedId());
  }

  /**
   * Delete user mappings by related id
   *
   * @param relatedId
   *            related id
   * @return rows deleted
   */
  public deleteByRelatedId(relatedId: number): number {
    const whereArgs = this.buildWhereArgs([relatedId]);
    return this.delete(this.buildWhere(UserMappingTable.COLUMN_RELATED_ID, relatedId), whereArgs);
  }

  /**
   * Delete user mappings by both base id and related id
   * @param userMappingRow user mapping row
   * @return rows deleted
   */
  public deleteByIdsWithUserMappingRow(userMappingRow: UserMappingRow): number {
    return this.deleteByIds(userMappingRow.getBaseId(), userMappingRow.getRelatedId());
  }

  /**
   * Delete user mappings by both base id and related id
   *
   * @param baseId base id
   * @param relatedId related id
   * @return rows deleted
   */
  public deleteByIds(baseId: number, relatedId: number): number {
    return this.delete(this.buildWhereIds(baseId, relatedId), this.buildWhereIdsArgs(baseId, relatedId));
  }

  /**
   * Build the where ids clause
   *
   * @param baseId base id
   * @param relatedId related id
   * @return where clause
   */
  private buildWhereIds(baseId: number, relatedId: number): string {
    const where = [];
    where.push(this.buildWhere(UserMappingTable.COLUMN_BASE_ID, baseId));
    where.push(' AND ');
    where.push(this.buildWhere(UserMappingTable.COLUMN_RELATED_ID, relatedId));
    return where.join('');
  }

  /**
   * Build the where ids clause arguments
   * @param baseId  base id
   * @param relatedId related id
   * @return where args
   */
  private buildWhereIdsArgs(baseId: number, relatedId: number): DBValue[] {
    return this.buildWhereArgs([baseId, relatedId]);
  }
}
