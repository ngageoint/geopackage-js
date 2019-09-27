/**
 * @memberOf module:extension/style
 * @class IconRow
 */

var MediaRow = require('../relatedTables/mediaRow');
var util = require('util');
var ImageUtils = require('../../tiles/imageUtils');

/**
 * Icon Row
 * @extends {module:extension/relatedTables~MediaRow}
 * @param  {module:extension/style.IconTable} iconTable  icon table
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 * @constructor
 */
var IconRow = function(iconTable, columnTypes, values) {
  MediaRow.call(this, iconTable, columnTypes, values);
  this.iconTable = iconTable;
};

util.inherits(IconRow, MediaRow);

/**
 * Get the name column
 * @return {module:user/userColumn~UserColumn}
 */
IconRow.prototype.getNameColumn = function() {
  return this.iconTable.getNameColumn();
};

/**
 * Gets the name
 * @return {String}
 */
IconRow.prototype.getName = function() {
  return this.getValueWithColumnName(this.getNameColumn().name);
};

/**
 * Sets the name for the row
 * @param {String} name name
 */
IconRow.prototype.setName = function(name) {
  this.setValueWithColumnName(this.getNameColumn().name, name);
};

/**
 * Get the description column
 * @return {module:user/userColumn~UserColumn}
 */
IconRow.prototype.getDescriptionColumn = function() {
  return this.iconTable.getDescriptionColumn();
};

/**
 * Gets the description
 * @return {String}
 */
IconRow.prototype.getDescription = function() {
  return this.getValueWithColumnName(this.getDescriptionColumn().name);
};

/**
 * Sets the description for the row
 * @param {string} description description
 */
IconRow.prototype.setDescription = function(description) {
  this.setValueWithColumnName(this.getDescriptionColumn().name, description);
};

/**
 * Get the width column
 * @return {module:user/userColumn~UserColumn}
 */
IconRow.prototype.getWidthColumn = function() {
  return this.iconTable.getWidthColumn();
};

/**
 * Gets the width
 * @return {Number}
 */
IconRow.prototype.getWidth = function() {
  return this.getValueWithColumnName(this.getWidthColumn().name);
};

/**
 * Sets the width for the row
 * @param {Number} width width
 */
IconRow.prototype.setWidth = function(width) {
  this.setValueWithColumnName(this.getWidthColumn().name, width);
};

/**
 * Get the width or derived width from the icon data and scaled as needed
 * for the height
 *
 * @return {Promise<Number>}  derived width
 */
IconRow.prototype.getDerivedWidth = function() {
  var width = this.getWidth();
  if (width === undefined || width === null) {
    width = this.getDerivedDimensions()[0];
  }
  return width;
};

/**
 * Get the height column
 * @return {module:user/userColumn~UserColumn}
 */
IconRow.prototype.getHeightColumn = function() {
  return this.iconTable.getHeightColumn();
};

/**
 * Gets the height
 * @return {Number}
 */
IconRow.prototype.getHeight = function() {
  return this.getValueWithColumnName(this.getHeightColumn().name);
};

/**
 * Sets the height for the row
 * @param {Number} height height
 */
IconRow.prototype.setHeight = function(height) {
  this.setValueWithColumnName(this.getHeightColumn().name, height);
};

/**
 * Get the height or derived height from the icon data and scaled as needed
 * for the width
 *
 * @return {Promise<Number>} derived height
 */
IconRow.prototype.getDerivedHeight = function() {
  var height = this.getHeight();
  if (height === undefined || height === null) {
    height = this.getDerivedDimensions()[1];
  }
  return height;
};

/**
 * Get the derived width and height from the values and icon data, scaled as needed
 * @return {Number[]} derived dimensions array with two values, width at index 0, height at index 1
 */
IconRow.prototype.getDerivedDimensions = function() {
  var width = this.getWidth();
  var height = this.getHeight();
  if (width === undefined || width === null || height === undefined || height === null) {
    var dataWidth;
    var dataHeight;
    var imageSize = ImageUtils.getImageSize(this.getData());
    dataWidth = imageSize.width;
    dataHeight = imageSize.height;
    if (width === undefined || width === null) {
      width = dataWidth;
      if (height !== undefined && height !== null) {
        width *= (height / dataHeight);
      }
    }
    if (height === undefined || height === null) {
      height = dataHeight;
      if (width !== undefined && width !== null) {
        height *= (width / dataWidth);
      }
    }
  }
  return [width, height];
};

/**
 * Get the anchor_u column
 * @return {module:user/userColumn~UserColumn}
 */
IconRow.prototype.getAnchorUColumn = function() {
  return this.iconTable.getAnchorUColumn();
};

/**
 * Gets the anchor_u
 * @return {Number}
 */
IconRow.prototype.getAnchorU = function() {
  return this.getValueWithColumnName(this.getAnchorUColumn().name);
};

/**
 * Sets the anchor_u for the row
 * @param {Number} anchor_u anchor_u
 */
IconRow.prototype.setAnchorU = function(anchor_u) {
  this.validateAnchor(anchor_u);
  this.setValueWithColumnName(this.getAnchorUColumn().name, anchor_u);
};

/**
 * Get the anchor u value or the default value of 0.5
 * @return {Number} anchor u value
 */
IconRow.prototype.getAnchorUOrDefault = function() {
  var anchorU = this.getAnchorU();
  if (anchorU == null) {
    anchorU = 0.5;
  }
  return anchorU;
};

/**
 * Get the anchor_v column
 * @return {module:user/userColumn~UserColumn}
 */
IconRow.prototype.getAnchorVColumn = function() {
  return this.iconTable.getAnchorVColumn();
};

/**
 * Gets the anchor_v
 * @return {Number}
 */
IconRow.prototype.getAnchorV = function() {
  return this.getValueWithColumnName(this.getAnchorVColumn().name);
};

/**
 * Sets the anchor_v for the row
 * @param {Number} anchor_v anchor_v
 */
IconRow.prototype.setAnchorV = function(anchor_v) {
  this.validateAnchor(anchor_v);
  this.setValueWithColumnName(this.getAnchorVColumn().name, anchor_v);
};

/**
 * Get the anchor v value or the default value of 1.0
 * @return {Number} anchor v value
 */
IconRow.prototype.getAnchorVOrDefault = function() {
  var anchorV = this.getAnchorV();
  if (anchorV == null) {
    anchorV = 1.0;
  }
  return anchorV;
};

/**
 * Validate the anchor value
 * @param {Number} anchor anchor
 */
IconRow.prototype.validateAnchor = function(anchor) {
  if (anchor != null && (anchor < 0.0 || anchor > 1.0)) {
    throw new Error("Anchor must be set inclusively between 0.0 and 1.0, invalid value: " + anchor);
  }
};

module.exports = IconRow;
