/**
 * VTLayersRow module.
 * @module extension/vt
 */

var UserRow = require('../../user/userRow');

var util = require('util');

/**
 * Vector Tile Layers Row containing the values from a single result set row
 * @class
 * @extends {module:user/userRow~UserRow}
 * @param  {module:extension/vt~VTLayersTable} vtLayersTable
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 */
var VTLayersRow = function(vtLayersTable, columnTypes, values) {
  UserRow.call(this, vtLayersTable, columnTypes, values);
  this.vtLayersTable = vtLayersTable;
}

util.inherits(VTLayersRow, UserRow);

/**
 * Gets the id column
 * @return {module:user/userColumn~UserColumn}
 */
VTLayersRow.prototype.getIdColumn = function() {
  return this.vtLayersTable.getIdColumn();
}

/**
 * Gets the id
 * @return {Number}
 */
VTLayersRow.prototype.getId = function() {
  return this.getValueWithColumnName(this.getIdColumn().name);
}

/**
 * Get the table name column
 * @return {module:user/userColumn~UserColumn}
 */
VTLayersRow.prototype.getTableNameColumn = function() {
  return this.vtLayersTable.getTableNameColumn();
}

/**
 * Gets the table name
 * @return {string}
 */
VTLayersRow.prototype.getTableName = function() {
  return this.getValueWithColumnName(this.getTableNameColumn().name);
}

/**
 * Sets the table name for the row
 * @param  {string} tableName the table name
 */
VTLayersRow.prototype.setTableName = function(tableName) {
  this.setValueWithColumnName(this.getTableNameColumn().name, tableName);
}

/**
 * Get the layer name column
 * @return {module:user/userColumn~UserColumn}
 */
VTLayersRow.prototype.getLayerNameColumn = function() {
  return this.vtLayersTable.getLayerNameColumn();
}

/**
 * Gets the layer name
 * @return {string}
 */
VTLayersRow.prototype.getLayerName = function() {
  return this.getValueWithColumnName(this.getLayerNameColumn().name);
}

/**
 * Sets the layer name for the row
 * @param  {string} layerName the layer name
 */
VTLayersRow.prototype.setLayerName = function(layerName) {
  this.setValueWithColumnName(this.getLayerNameColumn().name, layerName);
}

/**
 * Get the layer description column
 * @return {module:user/userColumn~UserColumn}
 */
VTLayersRow.prototype.getLayerDescriptionColumn = function() {
  return this.vtLayersTable.getLayerDescriptionColumn();
}

/**
 * Gets the layer description
 * @return {string}
 */
VTLayersRow.prototype.getLayerDescription = function() {
  return this.getValueWithColumnName(this.getLayerDescriptionColumn().name);
}

/**
 * Sets the layer description for the row
 * @param  {string} layerDescription the layer description
 */
VTLayersRow.prototype.setLayerDescription = function(layerDescription) {
  this.setValueWithColumnName(this.getLayerDescriptionColumn().name, layerDescription);
}

/**
 * Get the min zoom column
 * @return {module:user/userColumn~UserColumn}
 */
VTLayersRow.prototype.getMinZoomColumn = function() {
  return this.vtLayersTable.getMinZoomColumn();
}

/**
 * Gets the min zoom for the layer
 * @return {Number}
 */
VTLayersRow.prototype.getMinZoom = function() {
  return this.getValueWithColumnName(this.getMinZoom().name);
}

/**
 * Sets the min zoom for the layer
 * @param  {Number} minZoom the min zoom to set
 */
VTLayersRow.prototype.setMinZoom = function(minZoom) {
  this.setValueWithColumnName(this.getMinZoomColumn().name, minZoom);
}

/**
 * Get the max zoom column
 * @return {module:user/userColumn~UserColumn}
 */
VTLayersRow.prototype.getMaxZoomColumn = function() {
  return this.vtLayersTable.getMaxZoomColumn();
}

/**
 * Gets the max zoom for the layer
 * @return {Number}
 */
VTLayersRow.prototype.getMaxZoom = function() {
  return this.getValueWithColumnName(this.getMaxZoom().name);
}

/**
 * Sets the max zoom for the layer
 * @param  {Number} minZoom the min zoom to set
 */
VTLayersRow.prototype.setMaxZoom = function(maxZoom) {
  this.setValueWithColumnName(this.getMaxZoomColumn().name, maxZoom);
}

module.exports = VTLayersRow;
