/**
 * @module tiles/matrix
 * @see module:dao/dao
 */

var Dao = require('../../dao/dao')
  , TileMatrix = require('./tileMatrix');

/**
 * Tile Matrix Set Data Access Object
 * @class TileMatrixDao
 * @extends Dao
 */
class TileMatrixDao extends Dao {
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

TileMatrixDao.TABLE_NAME = "gpkg_tile_matrix";
TileMatrixDao.COLUMN_PK1 = "table_name";
TileMatrixDao.COLUMN_PK2 = "zoom_level";
TileMatrixDao.COLUMN_TABLE_NAME = "table_name";
TileMatrixDao.COLUMN_ZOOM_LEVEL = "zoom_level";
TileMatrixDao.COLUMN_MATRIX_WIDTH = "matrix_width";
TileMatrixDao.COLUMN_MATRIX_HEIGHT = "matrix_height";
TileMatrixDao.COLUMN_TILE_WIDTH = "tile_width";
TileMatrixDao.COLUMN_TILE_HEIGHT = "tile_height";
TileMatrixDao.COLUMN_PIXEL_X_SIZE = "pixel_x_size";
TileMatrixDao.COLUMN_PIXEL_Y_SIZE = "pixel_y_size";



TileMatrixDao.prototype.gpkgTableName = 'gpkg_tile_matrix';
TileMatrixDao.prototype.idColumns = [TileMatrixDao.COLUMN_PK1, TileMatrixDao.COLUMN_PK2];
TileMatrixDao.prototype.columns = [TileMatrixDao.COLUMN_TABLE_NAME, TileMatrixDao.COLUMN_ZOOM_LEVEL, TileMatrixDao.COLUMN_MATRIX_WIDTH, TileMatrixDao.COLUMN_MATRIX_HEIGHT, TileMatrixDao.COLUMN_TILE_WIDTH, TileMatrixDao.COLUMN_TILE_HEIGHT, TileMatrixDao.COLUMN_PIXEL_X_SIZE, TileMatrixDao.COLUMN_PIXEL_Y_SIZE];

module.exports = TileMatrixDao;
