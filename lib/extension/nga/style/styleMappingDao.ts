import { UserMappingDao } from '../../related/userMappingDao';
import { UserCustomDao } from '../../../user/custom/userCustomDao';
import { StyleMappingTable } from './styleMappingTable';
import { UserMappingTable } from '../../related/userMappingTable';
import { StyleMappingRow } from './styleMappingRow';
import { GeometryType } from '@ngageoint/simple-features-js';
import { UserCustomResultSet } from '../../../user/custom/userCustomResultSet';
import { UserCustomRow } from '../../../user/custom/userCustomRow';

/**
 * Style Mapping DAO for reading user mapping data tables
 */
export class StyleMappingDao extends UserMappingDao {
  /**
   * Constructor
   * @param userCustomDao
   */
  constructor(userCustomDao: UserCustomDao) {
    super(userCustomDao, StyleMappingDao.createMappingTable(userCustomDao));
  }

  /**
   * Get StyleMappingTable
   */
  getTable(): StyleMappingTable {
    return super.getTable() as StyleMappingTable;
  }

  /**
   * Create a new {UserCustomTable}
   * @param  {UserCustomDao} userCustomDao
   * @return {UserCustomTable} userCustomTable user custom table
   */
  static createMappingTable(userCustomDao: UserCustomDao): StyleMappingTable {
    return new StyleMappingTable(userCustomDao.getTableName(), userCustomDao.getColumns(), null);
  }
  /**
   * Create a user mapping row
   */
  newRow(): StyleMappingRow {
    return new StyleMappingRow(this.getTable());
  }

  /**
   * Get the style mapping row from the current result set location
   *
   * @param resultSet
   *            result set
   * @return style mapping row
   */
  public getRow(resultSet: UserCustomResultSet): StyleMappingRow {
    return this.getRowWithUserCustomRow(resultSet.getRow());
  }

  /**
   * Get a style mapping row from the user custom row
   *
   * @param row
   *            custom row
   * @return style mapping row
   */
  public getRowWithUserCustomRow(row: UserCustomRow): StyleMappingRow {
    return new StyleMappingRow(row);
  }

  /**
   * Query for style mappings by base id
   *
   * @param id
   *            base id, feature contents id or feature geometry id
   * @return style mappings rows
   */
  public queryByBaseFeatureId(id: number): StyleMappingRow[] {
    const rows = [];
    const resultSet = this.queryByBaseId(id);
    while (resultSet.moveToNext()) {
      rows.push(this.getRow(resultSet));
    }
    return rows;
  }

  /**
   * Delete by base id and geometry type
   * @param  {Number} baseId base id
   * @param  {GeometryType} geometryType geometry type
   * @return {Number} number of deleted rows
   */
  deleteByBaseIdAndGeometryType(baseId: number, geometryType: GeometryType): number {
    let where = '';
    where += this.buildWhere(UserMappingTable.COLUMN_BASE_ID, baseId);
    where += ' AND ';
    where += this.buildWhere(StyleMappingTable.COLUMN_GEOMETRY_TYPE_NAME, GeometryType.nameFromType(geometryType));
    const whereArgs = this.buildWhereArgs([baseId, GeometryType.nameFromType(geometryType)]);
    return this.delete(where, whereArgs);
  }
}
