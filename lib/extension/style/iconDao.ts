/**
 * @memberOf module:extension/style
 * @class IconDao
 */
import { MediaDao } from '../relatedTables/mediaDao';
import { IconRow } from './iconRow';
import { IconTable } from './iconTable';
import { GeoPackage } from '../../geoPackage';
import { DBValue } from '../../db/dbAdapter';
import { GeoPackageDataType } from '../../db/geoPackageDataType';

/**
 * Icon DAO for reading user icon data tables
 * @extends MediaDao
 * @param  {module:db/geoPackageConnection~GeoPackageConnection} geoPackage connection
 * @param  {string} table table name
 * @constructor
 */
export class IconDao extends MediaDao<IconRow> {
  constructor(geoPackage: GeoPackage, table: IconTable) {
    super(geoPackage, table);
  }
  /**
   * Create a icon row with the column types and values
   * @param  {module:db/geoPackageDataType[]} columnTypes  column types
   * @param  {module:dao/columnValues~ColumnValues[]} values      values
   * @return {module:extension/style.IconRow}             icon row
   */
  newRow(columnTypes?: { [key: string]: GeoPackageDataType }, values?: Record<string, DBValue>): IconRow {
    return new IconRow(this.table as IconTable, columnTypes, values);
  }
}
