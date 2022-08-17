/**
 * @module tiles/matrix
 * @see module:dao/dao
 */
import { TileMatrix } from './tileMatrix';
import { Contents } from '../../contents/contents';
import { TileMatrixSet } from '../matrixset/tileMatrixSet';
import { DBValue } from '../../db/dbAdapter';
import { SqliteQueryBuilder } from '../../db/sqliteQueryBuilder';
import { TileColumn } from '../user/tileColumn';
import { GeoPackageDao } from '../../db/geoPackageDao';
import { GeoPackageConnection } from '../../db/geoPackageConnection';
import { TileMatrixKey } from './tileMatrixKey';

/**
 * Tile Matrix Set Data Access Object
 * @class TileMatrixDao
 * @extends Dao
 */
export class TileMatrixDao extends GeoPackageDao<TileMatrix, TileMatrixKey> {
  readonly gpkgTableName: string = 'gpkg_tile_matrix';
  readonly idColumns: string[] = [TileMatrix.COLUMN_ID_1, TileMatrix.COLUMN_ID_2];
  readonly columns: string[] = [
    TileMatrix.COLUMN_TABLE_NAME,
    TileMatrix.COLUMN_ZOOM_LEVEL,
    TileMatrix.COLUMN_MATRIX_WIDTH,
    TileMatrix.COLUMN_MATRIX_HEIGHT,
    TileMatrix.COLUMN_TILE_WIDTH,
    TileMatrix.COLUMN_TILE_HEIGHT,
    TileMatrix.COLUMN_PIXEL_X_SIZE,
    TileMatrix.COLUMN_PIXEL_Y_SIZE,
  ];

  constructor(geoPackageConnection: GeoPackageConnection) {
    super(geoPackageConnection, TileMatrix.TABLE_NAME);
  }

  public static createDao(geoPackageConnection: GeoPackageConnection): TileMatrixDao {
    return new TileMatrixDao(geoPackageConnection);
  }

  queryForIdWithKey(key: TileMatrixKey): TileMatrix {
    return this.queryForMultiId([key.getTableName(), key.getZoomLevel()]);
  }

  createObject(results?: Record<string, DBValue>): TileMatrix {
    const tm = new TileMatrix();
    if (results) {
      tm.setTableName(results.table_name as string);
      tm.setZoomLevel(results.zoom_level as number);
      tm.setMatrixWidth(results.matrix_width as number);
      tm.setMatrixHeight(results.matrix_height as number);
      tm.setTileWidth(results.tile_width as number);
      tm.setTileHeight(results.tile_height as number);
      tm.setPixelXSize(results.pixel_x_size as number);
      tm.setPixelYSize(results.pixel_y_size as number);
    }
    return tm;
  }
  /**
   * get the Contents of the Tile matrix
   * @param  {TileMatrix} tileMatrix the tile matrix
   */
  getContents(tileMatrix: TileMatrix): Contents {
    return this.geoPackage.getContentsDao().queryForId(tileMatrix.getTableName());
  }
  getTileMatrixSet(tileMatrix: TileMatrix): TileMatrixSet {
    return this.geoPackage.tileMatrixSetDao.queryForId(tileMatrix.getTableName());
  }
  tileCount(tileMatrix: TileMatrix): number {
    const where = this.buildWhereWithFieldAndValue(TileColumn.COLUMN_ZOOM_LEVEL, tileMatrix.getZoomLevel());
    const whereArgs = this.buildWhereArgs([tileMatrix.getZoomLevel()]);
    const query = SqliteQueryBuilder.buildCount("'" + tileMatrix.getTableName() + "'", where);
    const result = this.db.get(query, whereArgs);
    return result?.count;
  }
  hasTiles(tileMatrix: TileMatrix): boolean {
    const where = this.buildWhereWithFieldAndValue(TileColumn.COLUMN_ZOOM_LEVEL, tileMatrix.zoom_level);
    const whereArgs = this.buildWhereArgs([tileMatrix.zoom_level]);
    const query = SqliteQueryBuilder.buildQuery(false, "'" + tileMatrix.table_name + "'", undefined, where);
    return this.connection.get(query, whereArgs) != null;
  }
}
