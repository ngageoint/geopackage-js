/**
 * @module tiles/matrix
 * @see module:dao/dao
 */
import Dao from '../../dao/dao';

var TileMatrix = require('./tileMatrix');

/**
 * Tile Matrix Set Data Access Object
 * @class TileMatrixDao
 * @extends Dao
 */
export default class TileMatrixDao extends Dao<typeof TileMatrix> {
  public static readonly TABLE_NAME = "gpkg_tile_matrix";
  public static readonly COLUMN_PK1 = "table_name";
  public static readonly COLUMN_PK2 = "zoom_level";
  public static readonly COLUMN_TABLE_NAME = "table_name";
  public static readonly COLUMN_ZOOM_LEVEL = "zoom_level";
  public static readonly COLUMN_MATRIX_WIDTH = "matrix_width";
  public static readonly COLUMN_MATRIX_HEIGHT = "matrix_height";
  public static readonly COLUMN_TILE_WIDTH = "tile_width";
  public static readonly COLUMN_TILE_HEIGHT = "tile_height";
  public static readonly COLUMN_PIXEL_X_SIZE = "pixel_x_size";
  public static readonly COLUMN_PIXEL_Y_SIZE = "pixel_y_size";



  readonly gpkgTableName = 'gpkg_tile_matrix';
  readonly idColumns = [TileMatrixDao.COLUMN_PK1, TileMatrixDao.COLUMN_PK2];
  readonly columns = [TileMatrixDao.COLUMN_TABLE_NAME, TileMatrixDao.COLUMN_ZOOM_LEVEL, TileMatrixDao.COLUMN_MATRIX_WIDTH, TileMatrixDao.COLUMN_MATRIX_HEIGHT, TileMatrixDao.COLUMN_TILE_WIDTH, TileMatrixDao.COLUMN_TILE_HEIGHT, TileMatrixDao.COLUMN_PIXEL_X_SIZE, TileMatrixDao.COLUMN_PIXEL_Y_SIZE];


  createObject() {
    return new TileMatrix();
  }
  /**
   * get the Contents of the Tile matrix
   * @param  {TileMatrix} tileMatrix the tile matrix
   */
  getContents(tileMatrix) {
    var dao = this.geoPackage.getContentsDao();
    return dao.queryForId(tileMatrix.table_name);
  }
  getTileMatrixSet(tileMatrix) {
    var dao = this.geoPackage.getTileMatrixSetDao();
    return dao.queryForId(tileMatrix.table_name);
  }
}