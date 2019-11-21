var Dao = require('../../dao/dao')
  , TileMatrixSet = require('./tileMatrixSet');

/**
 * Tile Matrix Set Data Access Object
 * @class TileMatrixSetDao
 * @extends Dao
 */
class TileMatrixSetDao extends Dao {
  createObject() {
    return new TileMatrixSet();
  }
  /**
   * Get the tile table names
   * @returns {string[]} tile table names
   */
  getTileTables() {
    var tableNames = [];
    for (var result of this.connection.each('select ' + TileMatrixSetDao.COLUMN_TABLE_NAME + ' from ' + TileMatrixSetDao.TABLE_NAME)) {
      tableNames.push(result[TileMatrixSetDao.COLUMN_TABLE_NAME]);
    }
    return tableNames;
  }
  getProjection(tileMatrixSet) {
    var srs = this.getSrs(tileMatrixSet);
    if (!srs)
      return;
    var srsDao = this.geoPackage.getSpatialReferenceSystemDao();
    return srsDao.getProjection(srs);
  }
  /**
   * Get the Spatial Reference System of the Tile Matrix set
   * @param  {TileMatrixSet}   tileMatrixSet tile matrix set
   */
  getSrs(tileMatrixSet) {
    var dao = this.geoPackage.getSpatialReferenceSystemDao();
    return dao.queryForId(tileMatrixSet.srs_id);
  }
  /**
   * @param {TileMatrixSet} tileMatrixSet
   */
  getContents(tileMatrixSet) {
    var dao = this.geoPackage.getContentsDao();
    return dao.queryForId(tileMatrixSet.table_name);
  }
}

TileMatrixSetDao.TABLE_NAME = "gpkg_tile_matrix_set";
TileMatrixSetDao.COLUMN_PK = "table_name";
TileMatrixSetDao.COLUMN_TABLE_NAME = "table_name";
TileMatrixSetDao.COLUMN_SRS_ID = "srs_id";
TileMatrixSetDao.COLUMN_MIN_X = "min_x";
TileMatrixSetDao.COLUMN_MIN_Y = "min_y";
TileMatrixSetDao.COLUMN_MAX_X = "max_x";
TileMatrixSetDao.COLUMN_MAX_Y = "max_y";

TileMatrixSetDao.prototype.gpkgTableName = 'gpkg_tile_matrix_set';
TileMatrixSetDao.prototype.idColumns = [TileMatrixSetDao.COLUMN_PK];
TileMatrixSetDao.prototype.columns = [TileMatrixSetDao.COLUMN_TABLE_NAME, TileMatrixSetDao.COLUMN_SRS_ID, TileMatrixSetDao.COLUMN_MIN_X, TileMatrixSetDao.COLUMN_MIN_Y, TileMatrixSetDao.COLUMN_MAX_X, TileMatrixSetDao.COLUMN_MAX_Y];

TileMatrixSetDao.prototype.columnToPropertyMap = {};
TileMatrixSetDao.prototype.columnToPropertyMap[TileMatrixSetDao.COLUMN_TABLE_NAME] = TileMatrixSet.TABLE_NAME;
TileMatrixSetDao.prototype.columnToPropertyMap[TileMatrixSetDao.COLUMN_SRS_ID] = TileMatrixSet.SRS_ID;
TileMatrixSetDao.prototype.columnToPropertyMap[TileMatrixSetDao.COLUMN_MIN_X] = TileMatrixSet.MIN_X;
TileMatrixSetDao.prototype.columnToPropertyMap[TileMatrixSetDao.COLUMN_MIN_Y] = TileMatrixSet.MIN_Y;
TileMatrixSetDao.prototype.columnToPropertyMap[TileMatrixSetDao.COLUMN_MAX_X] = TileMatrixSet.MAX_X;
TileMatrixSetDao.prototype.columnToPropertyMap[TileMatrixSetDao.COLUMN_MAX_Y] = TileMatrixSet.MAX_Y;

module.exports = TileMatrixSetDao;