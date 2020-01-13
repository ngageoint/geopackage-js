/**
 * @module tiles/matrix
 * @see module:dao/dao
 */
import {Dao} from '../../dao/dao';

import { TileMatrix } from './tileMatrix';
import {Contents} from '../../core/contents/contents';
import { TileMatrixSet } from '../matrixset/tileMatrixSet';

/**
 * Tile Matrix Set Data Access Object
 * @class TileMatrixDao
 * @extends Dao
 */
export class TileMatrixDao extends Dao<TileMatrix> {
  public static readonly TABLE_NAME: string = "gpkg_tile_matrix";
  public static readonly COLUMN_PK1: string = "table_name";
  public static readonly COLUMN_PK2: string = "zoom_level";
  public static readonly COLUMN_TABLE_NAME: string = "table_name";
  public static readonly COLUMN_ZOOM_LEVEL: string = "zoom_level";
  public static readonly COLUMN_MATRIX_WIDTH: string = "matrix_width";
  public static readonly COLUMN_MATRIX_HEIGHT: string = "matrix_height";
  public static readonly COLUMN_TILE_WIDTH: string = "tile_width";
  public static readonly COLUMN_TILE_HEIGHT: string = "tile_height";
  public static readonly COLUMN_PIXEL_X_SIZE: string = "pixel_x_size";
  public static readonly COLUMN_PIXEL_Y_SIZE: string = "pixel_y_size";

  readonly gpkgTableName: string = 'gpkg_tile_matrix';
  readonly idColumns: string[] = [TileMatrixDao.COLUMN_PK1, TileMatrixDao.COLUMN_PK2];
  readonly columns: string[] = [TileMatrixDao.COLUMN_TABLE_NAME, TileMatrixDao.COLUMN_ZOOM_LEVEL, TileMatrixDao.COLUMN_MATRIX_WIDTH, TileMatrixDao.COLUMN_MATRIX_HEIGHT, TileMatrixDao.COLUMN_TILE_WIDTH, TileMatrixDao.COLUMN_TILE_HEIGHT, TileMatrixDao.COLUMN_PIXEL_X_SIZE, TileMatrixDao.COLUMN_PIXEL_Y_SIZE];

  createObject(): TileMatrix {
    return new TileMatrix();
  }
  /**
   * get the Contents of the Tile matrix
   * @param  {TileMatrix} tileMatrix the tile matrix
   */
  getContents(tileMatrix: TileMatrix): Contents {
    var dao = this.geoPackage.getContentsDao();
    return dao.queryForId(tileMatrix.table_name);
  }
  getTileMatrixSet(tileMatrix: TileMatrix): TileMatrixSet {
    var dao = this.geoPackage.getTileMatrixSetDao();
    return dao.queryForId(tileMatrix.table_name);
  }
}