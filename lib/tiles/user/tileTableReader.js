/**
 * tileTableReader module.
 * @module tiles/user/tileTableReader
 */

var UserTableReader = require('../../user/userTableReader')
  , DataTypes = require('../../db/dataTypes')
  , TileMatrixSet = require('../matrixset').TileMatrixSet
  , TileTable = require('./tileTable')
  , TileColumn = require('./tileColumn');

var util = require('util');

/**
* Reads the metadata from an existing tile table
* @class TileTableReader
* @extends {module:user~UserTableReader}
*/
var TileTableReader = function(tileMatrixSet) {
  UserTableReader.call(this, tileMatrixSet.table_name);
  this.tileMatrixSet = tileMatrixSet;
}

util.inherits(TileTableReader, UserTableReader);

TileTableReader.prototype.readTileTable = function (geoPackage) {
  return this.readTable(geoPackage.getDatabase());
};

TileTableReader.prototype.createTableWithNameAndColumns = function (tableName, columns) {
  return new TileTable(tableName, columns);
};

TileTableReader.prototype.createColumnWithResults = function (results, index, name, type, max, notNull, defaultValueIndex, primaryKey) {
  var dataType = DataTypes.fromName(type);
  var defaultValue = undefined;
  if (defaultValueIndex) {
    // console.log('default value index', defaultValueIndex);
    // console.log('result', results);
  }
  var column = new TileColumn(index, name, dataType, max, notNull, defaultValue, primaryKey);

  return column;
};

/**
 * The TileTableReader
 * @type {TileTableReader}
 */
module.exports = TileTableReader;
