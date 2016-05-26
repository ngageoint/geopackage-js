/**
 * TileMatrix module.
 * @module tiles/matrix
 * @see module:dao/dao
 */

var Dao = require('../../dao/dao')
  // , ContentsDao = require('../../core/contents').ContentsDao
  , TileMatrixSetDao = require('../matrixset').TileMatrixSetDao;

var util = require('util');

/**
 * Tile Matrix object. Documents the structure of the tile matrix at each zoom
 * level in each tiles table. It allows GeoPackages to contain rectangular as
 * well as square tiles (e.g. for better representation of polar regions). It
 * allows tile pyramids with zoom levels that differ in resolution by factors of
 * 2, irregular intervals, or regular intervals other than factors of 2.
 * @class TileMatrix
 */
var TileMatrix = function() {

  /**
   * Tile Pyramid User Data Table Name
   * @member {string}
   */
  this.table_name;

  /**
   * 0 ⇐ zoom_level ⇐ max_level for table_name
   * @member {Number}
   */
  this.zoom_level;

  /**
   * Number of columns (>= 1) in tile matrix at this zoom level
   * @member {Number}
   */
  this.matrix_width;

  /**
   * Number of rows (>= 1) in tile matrix at this zoom level
   * @member {Number}
   */
  this.matrix_height;

  /**
   * Tile width in pixels (>= 1)for this zoom level
   * @member {Number}
   */
  this.tile_width;

  /**
   * Tile height in pixels (>= 1)for this zoom level
   * @member {Number}
   */
  this.tile_height;

  /**
   * In t_table_name srid units or default meters for srid 0 (>0)
   * @member {Number}
   */
  this.pixel_x_size;

  /**
   * In t_table_name srid units or default meters for srid 0 (>0)
   * @member {Number}
   */
  this.pixel_y_size;
};

// /**
//  *  Set the Contents
//  *
//  *  @param contents contents
//  */
// -(void) setContents: (GPKGContents *) contents;
//
// /**
//  *  Set the zoom level
//  *
//  *  @param zoomLevel zoom level
//  */
// -(void) setZoomLevel:(NSNumber *)zoomLevel;
//
// /**
//  *  Set the matrix width
//  *
//  *  @param matrixWidth matrix width
//  */
// -(void) setMatrixWidth:(NSNumber *)matrixWidth;
//
// /**
//  *  Set the matrix height
//  *
//  *  @param matrixHeight matrix height
//  */
// -(void) setMatrixHeight:(NSNumber *)matrixHeight;
//
// /**
//  *  Set the tile width
//  *
//  *  @param tileWidth tile width
//  */
// -(void) setTileWidth:(NSNumber *)tileWidth;
//
// /**
//  *  Set the tile height
//  *
//  *  @param tileHeight tile height
//  */
// -(void) setTileHeight:(NSNumber *)tileHeight;
//
// /**
//  *  Set the pixel x size
//  *
//  *  @param pixelXSize pixel x size
//  */
// -(void) setPixelXSize:(NSDecimalNumber *)pixelXSize;
//
// /**
//  *  Set the pixel y size
//  *
//  *  @param pixelYSize pixel y size
//  */
// -(void) setPixelYSize:(NSDecimalNumber *)pixelYSize;



/**
 * Tile Matrix Set Data Access Object
 * @class TileMatrixSetDao
 * @extends {module:dao/dao~Dao}
 */
var TileMatrixDao = function(connection) {
  Dao.call(this, connection);
}

util.inherits(TileMatrixDao, Dao);

TileMatrixDao.prototype.createObject = function () {
  return new TileMatrix();
};

/**
 * get the Contents of the Tile matrix
 * @param  {tileMatrix} tileMatrix the tile matrix
 * @param  {Function} callback returns the contents
 */
TileMatrixDao.prototype.getContents = function (tileMatrix, callback) {
  var dao = this.getContentsDao();
  return dao.queryForIdObject(tileMatrix.table_name, callback);
};

TileMatrixDao.prototype.getContentsDao = function () {
  var ContentsDao = require('../../core/contents').ContentsDao;

  return new ContentsDao(this.connection);
};

TileMatrixDao.prototype.getTileMatrixSet = function (tileMatrix, callback) {
  var dao = this.getTileMatrixSetDao();
  return dao.queryForIdObject(tileMatrix.table_name, callback);
};

TileMatrixDao.prototype.getTileMatrixSetDao = function () {
  return new TileMatrixSetDao(this.connection);
};

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

TileMatrix.TABLE_NAME = 'tableName';
TileMatrix.ZOOM_LEVEL = 'zoomLevel';
TileMatrix.MATRIX_WIDTH = 'matrixWidth';
TileMatrix.MATRIX_HEIGHT = 'matrixHeight';
TileMatrix.TILE_WIDTH = 'tileWidth';
TileMatrix.TILE_HEIGHT = 'tileHeight';
TileMatrix.PIXEL_X_SIZE = 'pixelXSize';
TileMatrix.PIXEL_Y_SIZE = 'pixelYSize';


TileMatrixDao.prototype.gpkgTableName = 'gpkg_tile_matrix';
TileMatrixDao.prototype.idColumns = [TileMatrixDao.COLUMN_PK1, TileMatrixDao.COLUMN_PK2];
TileMatrixDao.prototype.columns = [TileMatrixDao.COLUMN_TABLE_NAME, TileMatrixDao.COLUMN_ZOOM_LEVEL, TileMatrixDao.COLUMN_MATRIX_WIDTH, TileMatrixDao.COLUMN_MATRIX_HEIGHT, TileMatrixDao.COLUMN_TILE_WIDTH, TileMatrixDao.COLUMN_TILE_HEIGHT, TileMatrixDao.COLUMN_PIXEL_X_SIZE, TileMatrixDao.COLUMN_PIXEL_Y_SIZE];

module.exports.TileMatrixDao = TileMatrixDao;
module.exports.TileMatrix = TileMatrix;
