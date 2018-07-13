/**
 * UserDao module.
 * @module user/userDao
 * @see module:dao/dao
 */

var UserRow = require('./userRow')
  , Dao = require('../dao/dao');

var util = require('util');

/**
 * Abstract User DAO for reading user tables
 * @class UserDao
 * @extends {module:dao/dao~Dao}
 * @param  {GeoPackageConnection} connection        connection
 * @param  {string} table table name
 */
var UserDao = function(connection, table) {
  Dao.call(this, connection);
  this.table = table;
  this.table_name = table.table_name;
  this.gpkgTableName = table.table_name;
  if (table.getPkColumn()) {
    this.idColumns = [table.getPkColumn().name];
  } else {
    this.idColumns = [];
  }
  this.columns = table.columnNames;
}

util.inherits(UserDao, Dao);

UserDao.prototype.createObject = function () {
  return UserRow();
};

UserDao.prototype.setValueInObject = function (object, columnIndex, value) {
  object.setValueNoValidationWithIndex(columnIndex, value);
};

/**
 * Get a user row from the current results
 * @param  {results} results result set
 * @return {UserRow}         the user row
 */
UserDao.prototype.getRow = function (results) {
  var row = undefined;
  if (!this.table) return row;
  var columns = this.table.columnCount();
  var columnTypes = {};
  for (var i = 0; i < columns; i++) {
    var column = this.table.getColumnWithIndex(i);
    columnTypes[column.name] = column.dataType;
  }
  return this.newRowWithColumnTypes(columnTypes, results);
};

/**
 * Create a user row
 * @param  {Array} columnTypes column Types
 * @param  {Array} values      values
 * @return {UserRow}             user row
 */
UserDao.prototype.newRowWithColumnTypes = function (columnTypes, values) {
  return new UserRow(this.table, columnTypes, values);
};

/**
 * Get the projection
 * @return {Projection} the projection
 */
UserDao.prototype.getProjection = function () {
  return this.projection;
};

/**
 *  Get the approximate zoom level of where the bounding box of the user data fits into the world
 *
 *  @return zoom level
 */
UserDao.prototype.getZoomLevel = function () {
  return 0;
  // if(self.projection == nil){
  //     [NSException raise:@"No Projection" format:@"No projection was set which is required to determine the zoom level"];
  // }
  // GPKGBoundingBox * boundingBox = [self getBoundingBox];
  // if([self.projection.epsg intValue] == PROJ_EPSG_WORLD_GEODETIC_SYSTEM){
  //     boundingBox = [GPKGTileBoundingBoxUtils boundWgs84BoundingBoxWithWebMercatorLimits:boundingBox];
  // }
  // GPKGProjectionTransform * webMercatorTransform = [[GPKGProjectionTransform alloc] initWithFromProjection:self.projection andToEpsg:PROJ_EPSG_WEB_MERCATOR];
  // GPKGBoundingBox * webMercatorBoundingBox = [webMercatorTransform transformWithBoundingBox:boundingBox];
  // int zoomLevel = [GPKGTileBoundingBoxUtils getZoomLevelWithWebMercatorBoundingBox:webMercatorBoundingBox];
  // return zoomLevel;
};

UserDao.prototype.getCount = function () {
  return this.connection.count(this.table_name);
};

module.exports = UserDao;
