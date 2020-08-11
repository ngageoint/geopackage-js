/**
 * @memberOf module:extension/style
 * @class StyleMappingDao
 */
import { UserMappingDao } from '../relatedTables/userMappingDao';
import { UserCustomDao } from '../../user/custom/userCustomDao';
import { GeoPackage } from '../../geoPackage';
import { StyleMappingTable } from './styleMappingTable';
import { UserMappingTable } from '../relatedTables/userMappingTable';
import { StyleMappingRow } from './styleMappingRow';
import { UserRow } from '../../user/userRow';
import { DBValue } from '../../db/dbAdapter';
import { GeoPackageDataType } from '../../db/geoPackageDataType';

/**
 * Style Mapping DAO for reading user mapping data tables
 * @extends UserMappingDao
 * @param  {module:user/custom~UserCustomDao} userCustomDao
 * @param  {module:geoPackage~GeoPackage} geoPackage      geopackage object
 * @param {StyleMappingTable} [styleMappingTable]
 * @constructor
 */
export class StyleMappingDao extends UserMappingDao<StyleMappingRow> {
  public table: StyleMappingTable;
  constructor(
    userCustomDao: UserCustomDao<StyleMappingRow>,
    geoPackage: GeoPackage,
    styleMappingTable?: StyleMappingTable,
  ) {
    super(
      userCustomDao,
      geoPackage,
      styleMappingTable || new StyleMappingTable(userCustomDao.table.getTableName(), userCustomDao.table.getUserColumns().getColumns(), null),
    );
  }
  /**
   * Create a new {module:user/custom~UserCustomTable}
   * @param  {module:user/custom~UserCustomDao} userCustomDao
   * @return {module:user/custom~UserCustomTable} userCustomTable user custom table
   */
  createMappingTable(userCustomDao: UserCustomDao<UserRow>): StyleMappingTable {
    return new StyleMappingTable(userCustomDao.table.getTableName(), userCustomDao.table.getUserColumns().getColumns(), null);
  }
  /**
   * Create a user mapping row
   * @param  {module:db/geoPackageDataType[]} columnTypes  column types
   * @param  {module:dao/columnValues~ColumnValues[]} values values
   * @return {module:extension/style.StyleMappingRow} style mapping row
   */
  newRow(columnTypes?: { [key: string]: GeoPackageDataType }, values?: Record<string, DBValue>): StyleMappingRow {
    return new StyleMappingRow(this.table, columnTypes, values);
  }
  /**
   * Delete by base id and geometry type
   * @param  {Number} baseId base id
   * @param  {String} geometryType geometry type
   * @return {Number} number of deleted rows
   */
  deleteByBaseIdAndGeometryType(baseId: number, geometryType: string): number {
    let where = '';
    where += this.buildWhereWithFieldAndValue(UserMappingTable.COLUMN_BASE_ID, baseId);
    where += ' AND ';
    where += this.buildWhereWithFieldAndValue(StyleMappingTable.COLUMN_GEOMETRY_TYPE_NAME, geometryType);
    const whereArgs = this.buildWhereArgs([baseId, geometryType]);
    return this.deleteWhere(where, whereArgs);
  }
}
