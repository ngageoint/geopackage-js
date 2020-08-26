import { Dao } from '../../dao/dao';
import { TileScaling } from './tileScaling';
import { DBValue } from '../../db/dbAdapter';

/**
 * Tile Scaling Data Access Object
 * @constructor
 * @extends Dao
 */
export class TileScalingDao extends Dao<TileScaling> {
  public static readonly TABLE_NAME: string = 'nga_tile_scaling';
  public static readonly COLUMN_TABLE_NAME: string = 'table_name';
  public static readonly COLUMN_SCALING_TYPE: string = 'scaling_type';
  public static readonly COLUMN_ZOOM_IN: string = 'zoom_in';
  public static readonly COLUMN_ZOOM_OUT: string = 'zoom_out';

  readonly gpkgTableName: string = TileScalingDao.TABLE_NAME;
  readonly idColumns: string[] = [];
  /**
   * Create a {module:extension/scale.TileScaling} object
   * @return {module:extension/scale.TileScaling}
   */
  createObject(results?: Record<string, DBValue>): TileScaling {
    const c = new TileScaling();
    if (results) {
      c.table_name = results.table_name as string;
      c.scaling_type = results.scaling_type as string;
      c.zoom_in = results.zoom_in as number;
      c.zoom_out = results.zoom_out as number;
    }
    return c;
  }
  /**
   * Create the necessary tables for this dao
   * @return {Promise}
   */
  createTable(): boolean {
    return this.geoPackage.getTableCreator().createTileScaling();
  }
  /**
   * Query by table name
   * @param  {string} tableName name of the table
   * @return {module:extension/scale.TileScaling}
   */
  queryForTableName(tableName: string): TileScaling {
    const tileScaling = this.queryForAll(
      this.buildWhereWithFieldAndValue(TileScalingDao.COLUMN_TABLE_NAME, tableName),
      this.buildWhereArgs(tableName),
    );
    if (tileScaling.length > 0) {
      return this.createObject(tileScaling[0]);
    } else {
      return null;
    }
  }
  /**
   * Delete by tableName
   * @param  {string} tableName the table name to delete by
   * @return {number} number of deleted rows
   */
  deleteByTableName(tableName: string): number {
    return this.deleteWhere(
      this.buildWhereWithFieldAndValue(TileScalingDao.COLUMN_TABLE_NAME, tableName),
      this.buildWhereArgs(tableName),
    );
  }
}
