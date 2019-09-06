/**
 * @memberOf module:extension/style
 * @class StyleRow
 */

var AttributesRow = require('../../attributes/attributeRow');

var util = require('util');

/**
 * Color hex pattern
 */
var colorPattern = /^#([0-9a-fA-F]{3}){1,2}$/;

/**
 * Style Row
 * @extends {module:attributes/attributeRow~AttributesRow}
 * @param  {module:extension/style.StyleTable} styleTable  style table
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 * @constructor
 */
var StyleRow = function(styleTable, columnTypes, values) {
  AttributesRow.call(this, styleTable, columnTypes, values);
  this.styleTable = styleTable;
};

util.inherits(StyleRow, AttributesRow);

/**
 * Get the name column
 * @return {module:user/userColumn~UserColumn}
 */
StyleRow.prototype.getNameColumn = function() {
  return this.styleTable.getNameColumn();
};

/**
 * Gets the name
 * @return {String}
 */
StyleRow.prototype.getName = function() {
  return this.getValueWithColumnName(this.getNameColumn().name);
};

/**
 * Sets the name for the row
 * @param {String} name name
 */
StyleRow.prototype.setName = function(name) {
  this.setValueWithColumnName(this.getNameColumn().name, name);
};

/**
 * Get the description column
 * @return {module:user/userColumn~UserColumn}
 */
StyleRow.prototype.getDescriptionColumn = function() {
  return this.styleTable.getDescriptionColumn();
};

/**
 * Gets the description
 * @return {String}
 */
StyleRow.prototype.getDescription = function() {
  return this.getValueWithColumnName(this.getDescriptionColumn().name);
};

/**
 * Sets the description for the row
 * @param {String} description description
 */
StyleRow.prototype.setDescription = function(description) {
  this.setValueWithColumnName(this.getDescriptionColumn().name, description);
};

/**
 * Get the color column
 * @return {module:user/userColumn~UserColumn}
 */
StyleRow.prototype.getColorColumn = function() {
  return this.styleTable.getColorColumn();
};

/**
 * Get the style color
 * @return {String} color
 */
StyleRow.prototype.getColor = function() {
  return this.createColor(this.getHexColor(), this.getOpacity());
};

/**
 * Check if the style has a color
 * @return true if has a color
 */
StyleRow.prototype.hasColor = function() {
  return this._hasColor(this.getHexColor(), this.getOpacity());
};

/**
 * Get the color
 * @return {String} color
 */
StyleRow.prototype.getHexColor = function() {
  return this.getValueWithColumnName(this.getColorColumn().name);
};

/**
 * Set the color
 * @param {String} color color
 * @param {Number} opacity opacity
 */
StyleRow.prototype.setColor = function(color, opacity) {
  this.setHexColor(color);
  this.setOpacity(opacity);
};

/**
 * Sets the color for the row
 * @param {String} color color
 */
StyleRow.prototype.setHexColor = function(color) {
  var validatedColor = this.validateColor(color);
  this.setValueWithColumnName(this.getColorColumn().name, validatedColor);
};

/**
 * Get the opacity column
 * @return {module:user/userColumn~UserColumn}
 */
StyleRow.prototype.getOpacityColumn = function() {
  return this.styleTable.getOpacityColumn();
};

/**
 * Gets the opacity
 * @return {Number}
 */
StyleRow.prototype.getOpacity = function() {
  return this.getValueWithColumnName(this.getOpacityColumn().name);
};

/**
 * Get the opacity or default value
 * @return {Number} opacity
 */
StyleRow.prototype.getOpacityOrDefault = function() {
  var opacity = this.getOpacity();
  if (opacity === null) {
    opacity = 1.0;
  }
  return opacity;
};

/**
 * Sets the opacity for the row
 * @param {Number} opacity opacity
 */
StyleRow.prototype.setOpacity = function(opacity) {
  this.validateOpacity(opacity);
  this.setValueWithColumnName(this.getOpacityColumn().name, opacity);
};

/**
 * Get the width column
 * @return {module:user/userColumn~UserColumn}
 */
StyleRow.prototype.getWidthColumn = function() {
  return this.styleTable.getWidthColumn();
};

/**
 * Gets the width
 * @return {int}
 */
StyleRow.prototype.getWidth = function() {
  return this.getValueWithColumnName(this.getWidthColumn().name);
};

/**
 * Sets the width for the row
 * @param {Number} width width
 */
StyleRow.prototype.setWidth = function(width) {
  if (width !== null && width < 0.0) {
    throw new Error("Width must be greater than or equal to 0.0, invalid value: " + width);
  }
  this.setValueWithColumnName(this.getWidthColumn().name, width);
};

/**
 * Get the width value or default width
 * @return width
 */
StyleRow.prototype.getWidthOrDefault = function() {
  var width = this.getWidth();
  if (width === null) {
    width = 1.0;
  }
  return width;
};

/**
 * Get the fill color column
 * @return {module:user/userColumn~UserColumn}
 */
StyleRow.prototype.getFillColorColumn = function() {
  return this.styleTable.getFillColorColumn();
};


/**
 * Get the style fill color
 * @return {String} color
 */
StyleRow.prototype.getFillColor = function() {
  return this.createColor(this.getFillHexColor(), this.getFillOpacity());
};

/**
 * Check if the style has a fill color
 * @return true if has a color
 */
StyleRow.prototype.hasFillColor = function() {
  return this._hasColor(this.getFillHexColor(), this.getFillOpacity());
};

/**
 * Get the fill color
 * @return {String} color
 */
StyleRow.prototype.getFillHexColor = function() {
  return this.getValueWithColumnName(this.getFillColorColumn().name);
};

/**
 * Set the fill color
 * @param {String} color color
 * @param {Number} opacity opacity
 */
StyleRow.prototype.setFillColor = function(color, opacity) {
  this.setFillHexColor(color);
  this.setFillOpacity(opacity);
};

/**
 * Sets the fill color for the row
 * @param {String} color color
 */
StyleRow.prototype.setFillHexColor = function(color) {
  var validatedColor = this.validateColor(color);
  this.setValueWithColumnName(this.getFillColorColumn().name, validatedColor);
};

/**
 * Get the fill opacity column
 * @return {module:user/userColumn~UserColumn}
 */
StyleRow.prototype.getFillOpacityColumn = function() {
  return this.styleTable.getFillOpacityColumn();
};

/**
 * Gets the fill opacity
 * @return {Number}
 */
StyleRow.prototype.getFillOpacity = function() {
  return this.getValueWithColumnName(this.getFillOpacityColumn().name);
};

/**
 * Sets the fill opacity for the row
 * @param {Number} fillOpacity fillOpacity
 */
StyleRow.prototype.setFillOpacity = function(fillOpacity) {
  this.validateOpacity(fillOpacity);
  this.setValueWithColumnName(this.getFillOpacityColumn().name, fillOpacity);
};

/**
 * Get the fill opacity or default value
 * @return {Number} fill opacity
 */
StyleRow.prototype.getFillOpacityOrDefault = function() {
  var fillOpacity = this.getFillOpacity();
  if (fillOpacity == null) {
    fillOpacity = 1.0;
  }
  return fillOpacity;
};

/**
 * Validate and adjust the color value
 * @param {String} color color
 */
StyleRow.prototype.validateColor = function(color) {
  var validated = color;
  if (color != null) {
    if (!color.startsWith("#")) {
      validated = "#" + color;
    }
    if (!colorPattern.test(validated)) {
      throw new Error("Color must be in hex format #RRGGBB or #RGB, invalid value: " + color);
    }
    validated = validated.toUpperCase();
  }
  return validated;
};

/**
 * Validate the opacity value
 * @param {Number} opacity opacity
 */
StyleRow.prototype.validateOpacity = function(opacity) {
  if (opacity != null && (opacity < 0.0 || opacity > 1.0)) {
    throw new Error("Opacity must be set inclusively between 0.0 and 1.0, invalid value: " + opacity);
  }
};

/**
 * Create a color from the hex color and opacity
 * @param {String} hexColor hex color
 * @param {Number} opacity opacity
 * @return {String} rgba color
 */
StyleRow.prototype.createColor = function(hexColor, opacity) {
  var color = '#000000';
  if (hexColor !== null) {
    color = hexColor;
  }
  if (opacity !== null) {
    var a = Math.round(opacity * 255).toString(16);
    if (a.length === 1) {
      a = "0" + a;
    }
    color += a;
  }
  return color.toUpperCase();
};

/**
 * Determine if a color exists from the hex color and opacity
 * @param {String} hexColor hex color
 * @param {Number} opacity opacity
 * @return true if has a color
 */
StyleRow.prototype._hasColor = function(hexColor, opacity) {
  return hexColor !== null || opacity !== null;
};

module.exports = StyleRow;
