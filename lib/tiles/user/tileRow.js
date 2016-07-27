/**
 * tileRow module.
 * @module tiles/user/tileRow
 */

var UserRow = require('../../user/UserRow');

var util = require('util');

/**
 * Tile Row containing the values from a single result set row
 * @param  {TileTable} tileTable tile table
 * @param  {Array} columnTypes  column types
 * @param  {Array} values       values
 */
var TileRow = function(tileTable, columnTypes, values) {
  UserRow.call(this, tileTable, columnTypes, values);
  this.tileTable = tileTable;
}

util.inherits(TileRow, UserRow);

TileRow.prototype.toObjectValue = function (value) {
  return value;
};

TileRow.prototype.toDatabaseValue = function (columnName) {
  return this.getValueWithColumnName(columnName);
};

/**
 * Get the zoom level column index
 * @return {Number} zoom level column index
 */
TileRow.prototype.getZoomLevelColumnIndex = function () {
  return this.tileTable.zoomLevelIndex;
};

/**
 * Get the zoom level column
 * @return {TileColumn} zoom level column
 */
TileRow.prototype.getZoomLevelColumn = function() {
  return this.tileTable.getZoomLevelColumn();
}

/**
 * Get the zoom level
 * @return {Number} zoom level
 */
TileRow.prototype.getZoomLevel = function () {
  return this.getValueWithColumnName(this.getZoomLevelColumn().name);
};

/**
 * Set the zoom level
 * @param {Number} zoomLevel zoom level
 */
TileRow.prototype.setZoomLevel = function (zoomLevel) {
  this.setValueWithIndex(this.getZoomLevelColumnIndex(), zoomLevel);
};

/**
 * Get the tile column column Index
 * @return {number} tile column column index
 */
TileRow.prototype.getTileColumnColumnIndex = function () {
  return this.tileTable.tileColumnIndex;
};

/**
 * Get the tile column column
 * @return {TileColumn} tile column column
 */
TileRow.prototype.getTileColumnColumn = function () {
  return this.tileTable.getTileColumnColumn();
};

/**
 * Get the tile column
 * @return {Number} tile column
 */
TileRow.prototype.getTileColumn = function () {
  return this.getValueWithColumnName(this.getTileColumnColumn().name);
};

/**
 * Set the tile column
 * @param {number} tileColumn tile column
 */
TileRow.prototype.setTileColumn = function (tileColumn) {
  this.setValueWithColumnName(this.getTileColumnColumn().name, tileColumn);
};

/**
 * Get the tile row column index
 * @return {Number} tile row column index
 */
TileRow.prototype.getTileRowColumnIndex = function () {
  return this.tileTable.tileRowIndex;
};

/**
 * Get the tile row column
 * @return {TileColumn} tile row column
 */
TileRow.prototype.getTileRowColumn = function () {
  return this.tileTable.getTileRowColumn();
};

/**
 * Get the tile row
 * @return {Number} tile row
 */
TileRow.prototype.getTileRow = function () {
  return this.getValueWithColumnName(this.getTileRowColumn().name);
};

/**
 * Set the tile row
 * @param {Number} tileRow tile row
 */
TileRow.prototype.setTileRow = function (tileRow) {
  this.setValueWithColumnName(this.getTileRowColumn().name, tileRow);
};

/**
 * Get the tile data column index
 * @return {Number} tile data column index
 */
TileRow.prototype.getTileDataColumnIndex = function () {
  return this.tileTable.tileDataIndex;
};

/**
 * Get the tile data column
 * @return {TileColumn} tile data column
 */
TileRow.prototype.getTileDataColumn = function () {
  return this.tileTable.getTileDataColumn();
};

/**
 * Get the tile data
 * @return {Buffer} tile data
 */
TileRow.prototype.getTileData = function () {
  return this.getValueWithColumnName(this.getTileDataColumn().name);
};

/**
 * Set the tile data
 * @param {Buffer} tileData tile data
 */
TileRow.prototype.setTileData = function (tileData) {
  this.setValueWithColumnName(this.getTileDataColumn().name, tileData);
};

/**
 * Get the tile data as an image
 * @return {image} tile image
 */
TileRow.prototype.getTileDataImage = function () {
  // TODO
};


// /**
//  *  Get the tile data as a scaled image
//  *
//  *  @param scale scale, 0.0 to 1.0
//  *
//  *  @return tile image
//  */
// -(UIImage *) getTileDataImageWithScale: (CGFloat) scale;
//
// /**
//  *  Set the tile data with an image
//  *
//  *  @param image  image
//  *  @param format image format
//  */
// -(void) setTileDataWithImage: (UIImage *) image andFormat: (enum GPKGCompressFormat) format;
//
// /**
//  *  Set the tile data with an image
//  *
//  *  @param image  image
//  *  @param format image format
//  *  @param quality compression quality, 0.0 to 1.0, used only for GPKG_CF_JPEG
//  */
// -(void) setTileDataWithImage: (UIImage *) image andFormat: (enum GPKGCompressFormat) format andQuality: (CGFloat) quality;


module.exports = TileRow;
