/**
 * vector tile table module.
 * @module extension/vt
 */

var UserTable = require('../../user/userTable')
  , UserColumn = require('../../user/userColumn')
  , DataType = require('../../db/dataTypes');

var util = require('util');


var VTLayersTable = function() {
  var columns = VTLayersTable.createRequiredColumns();
  UserTable.call(this, 'gpkgext_vt_layers', columns);
}

util.inherits(VTLayersTable, UserTable);

/**
 * Get the required columns
 * @return {string[]}
 */
VTLayersTable.requiredColumns = function() {
  var requiredColumns = [];
  requiredColumns.push(VTLayersTable.COLUMN_ID);
  requiredColumns.push(VTLayersTable.COLUMN_TABLE_NAME);
  requiredColumns.push(VTLayersTable.COLUMN_NAME);
  requiredColumns.push(VTLayersTable.COLUMN_DESCRIPTION);
  requiredColumns.push(VTLayersTable.COLUMN_MIN_ZOOM);
  requiredColumns.push(VTLayersTable.COLUMN_MAX_ZOOM);
  return requiredColumns;
}

/**
 * Get the number of required columns
 * @return {Number}
 */
VTLayersTable.numRequiredColumns = function(){
  return VTLayersTable.requiredColumns().length;
}

/**
 * Create the required columns
 * @param  {Number} [startingIndex=0] starting index of the required columns
 * @param  {string} [idColumnName=id]  id column name
 * @return {module:user/userColumn~UserColumn[]}
 */
VTLayersTable.createRequiredColumns = function(startingIndex) {
  startingIndex = startingIndex || 0;
  return [
    VTLayersTable.createIdColumn(startingIndex++),
    VTLayersTable.createTableNameColumn(startingIndex++),
    VTLayersTable.createLayerNameColumn(startingIndex++),
    VTLayersTable.createLayerDescriptionColumn(startingIndex++),
    VTLayersTable.createMinZoomColumn(startingIndex++),
    VTLayersTable.createMaxZoomColumn(startingIndex++)
  ];
}

/**
 * Create the primary key id column
 * @param  {Number} index        index of the column
 * @return {module:user/userColumn~UserColumn}
 */
VTLayersTable.createIdColumn = function(index) {
  return UserColumn.createPrimaryKeyColumnWithIndexAndName(index, VTLayersTable.COLUMN_ID);
}

/**
 * Create the table name column
 * @param  {Number} index        index of the column
 * @return {module:user/userColumn~UserColumn}
 */
VTLayersTable.createTableNameColumn = function(index) {
  return UserColumn.createColumnWithIndex(index, VTLayersTable.COLUMN_TABLE_NAME, DataType.GPKGDataType.GPKG_DT_TEXT, true);
}

/**
 * Create the layer name column
 * @param  {Number} index        index of the column
 * @return {module:user/userColumn~UserColumn}
 */
VTLayersTable.createLayerNameColumn = function(index) {
  return UserColumn.createColumnWithIndex(index, VTLayersTable.COLUMN_NAME, DataType.GPKGDataType.GPKG_DT_TEXT, true);
}

/**
 * Create the layer description column
 * @param  {Number} index        index of the column
 * @return {module:user/userColumn~UserColumn}
 */
VTLayersTable.createLayerDescriptionColumn = function(index) {
  return UserColumn.createColumnWithIndex(index, VTLayersTable.COLUMN_DESCRIPTION, DataType.GPKGDataType.GPKG_DT_TEXT, true);
}

/**
 * Create the min zoom column
 * @param  {Number} index        index of the column
 * @return {module:user/userColumn~UserColumn}
 */
VTLayersTable.createMinZoomColumn = function(index) {
  return UserColumn.createColumnWithIndex(index, VTLayersTable.COLUMN_MIN_ZOOM, DataType.GPKGDataType.GPKG_DT_INTEGER, true);
}

/**
 * Create the max zoom column
 * @param  {Number} index        index of the column
 * @return {module:user/userColumn~UserColumn}
 */
VTLayersTable.createMaxZoomColumn = function(index) {
  return UserColumn.createColumnWithIndex(index, VTLayersTable.COLUMN_MAX_ZOOM, DataType.GPKGDataType.GPKG_DT_INTEGER, true);
}

/**
 * Get the primary key id column
 * @return {module:user/userColumn~UserColumn}
 */
VTLayersTable.prototype.getIdColumn = function() {
  return this.getPkColumn();
}

/**
 * Get the table name column
 * @return {module:user/userColumn~UserColumn}
 */
VTLayersTable.prototype.getTableNameColumn = function() {
  return this.getColumnWithColumnName(VTLayersTable.COLUMN_TABLE_NAME);
}

/**
 * Get the layer name column
 * @return {module:user/userColumn~UserColumn}
 */
VTLayersTable.prototype.getLayerNameColumn = function() {
  return this.getColumnWithColumnName(VTLayersTable.COLUMN_NAME);
}

/**
 * Get the layer description column
 * @return {module:user/userColumn~UserColumn}
 */
VTLayersTable.prototype.getLayerDescriptionColumn = function() {
  return this.getColumnWithColumnName(VTLayersTable.COLUMN_DESCRIPTION);
}

/**
 * Get the minimum zoom column
 * @return {module:user/userColumn~UserColumn}
 */
VTLayersTable.prototype.getMinZoomColumn = function() {
  return this.getColumnWithColumnName(VTLayersTable.COLUMN_MIN_ZOOM);
}

/**
 * Get the maximum zoom column
 * @return {module:user/userColumn~UserColumn}
 */
VTLayersTable.prototype.getMinZoomColumn = function() {
  return this.getColumnWithColumnName(VTLayersTable.COLUMN_MAX_ZOOM);
}

VTLayersTable.COLUMN_ID = 'id';
VTLayersTable.COLUMN_TABLE_NAME = 'table_name';
VTLayersTable.COLUMN_NAME = 'name';
VTLayersTable.COLUMN_DESCRIPTION = 'description';
VTLayersTable.COLUMN_MIN_ZOOM = 'minzoom';
VTLayersTable.COLUMN_MAX_ZOOM = 'maxzoom';

module.exports = VTLayersTable;
