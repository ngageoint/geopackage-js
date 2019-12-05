/**
 * @memberOf module:extension/style
 * @class StyleRow
 */

import AttributesRow from '../../attributes/attributeRow';
import StyleTable from './styleTable';

/**
 * Color hex pattern
 */
var colorPattern = /^#([0-9a-fA-F]{3}){1,2}$/;

/**
 * Style Row
 * @extends AttributesRow
 * @param  {module:extension/style.StyleTable} styleTable  style table
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 * @constructor
 */
export default class StyleRow extends AttributesRow {
  styleTable: StyleTable;
  constructor(styleTable: StyleTable, columnTypes?: any[], values?: any[]) {
    super(styleTable, columnTypes, values);
    this.styleTable = styleTable;
  }
  /**
   * Get the name column
   * @return {module:user/userColumn~UserColumn}
   */
  getNameColumn() {
    return this.styleTable.getNameColumn();
  }
  /**
   * Gets the name
   * @return {String}
   */
  getName() {
    return this.getValueWithColumnName(this.getNameColumn().name);
  }
  /**
   * Sets the name for the row
   * @param {String} name name
   */
  setName(name) {
    this.setValueWithColumnName(this.getNameColumn().name, name);
  }
  /**
   * Get the description column
   * @return {module:user/userColumn~UserColumn}
   */
  getDescriptionColumn() {
    return this.styleTable.getDescriptionColumn();
  }
  /**
   * Gets the description
   * @return {String}
   */
  getDescription() {
    return this.getValueWithColumnName(this.getDescriptionColumn().name);
  }
  /**
   * Sets the description for the row
   * @param {String} description description
   */
  setDescription(description) {
    this.setValueWithColumnName(this.getDescriptionColumn().name, description);
  }
  /**
   * Get the color column
   * @return {module:user/userColumn~UserColumn}
   */
  getColorColumn() {
    return this.styleTable.getColorColumn();
  }
  /**
   * Get the style color
   * @return {String} color
   */
  getColor() {
    return this.createColor(this.getHexColor(), this.getOpacity());
  }
  /**
   * Check if the style has a color
   * @return true if has a color
   */
  hasColor() {
    return this._hasColor(this.getHexColor(), this.getOpacity());
  }
  /**
   * Get the color
   * @return {String} color
   */
  getHexColor() {
    return this.getValueWithColumnName(this.getColorColumn().name);
  }
  /**
   * Set the color
   * @param {String} color color
   * @param {Number} opacity opacity
   */
  setColor(color, opacity) {
    this.setHexColor(color);
    this.setOpacity(opacity);
  }
  /**
   * Sets the color for the row
   * @param {String} color color
   */
  setHexColor(color) {
    var validatedColor = this.validateColor(color);
    this.setValueWithColumnName(this.getColorColumn().name, validatedColor);
  }
  /**
   * Get the opacity column
   * @return {module:user/userColumn~UserColumn}
   */
  getOpacityColumn() {
    return this.styleTable.getOpacityColumn();
  }
  /**
   * Gets the opacity
   * @return {Number}
   */
  getOpacity() {
    return this.getValueWithColumnName(this.getOpacityColumn().name);
  }
  /**
   * Get the opacity or default value
   * @return {Number} opacity
   */
  getOpacityOrDefault() {
    var opacity = this.getOpacity();
    if (opacity === null) {
      opacity = 1.0;
    }
    return opacity;
  }
  /**
   * Sets the opacity for the row
   * @param {Number} opacity opacity
   */
  setOpacity(opacity) {
    this.validateOpacity(opacity);
    this.setValueWithColumnName(this.getOpacityColumn().name, opacity);
  }
  /**
   * Get the width column
   * @return {module:user/userColumn~UserColumn}
   */
  getWidthColumn() {
    return this.styleTable.getWidthColumn();
  }
  /**
   * Gets the width
   * @return {number}
   */
  getWidth() {
    return this.getValueWithColumnName(this.getWidthColumn().name);
  }
  /**
   * Sets the width for the row
   * @param {Number} width width
   */
  setWidth(width) {
    if (width !== null && width < 0.0) {
      throw new Error("Width must be greater than or equal to 0.0, invalid value: " + width);
    }
    this.setValueWithColumnName(this.getWidthColumn().name, width);
  }
  /**
   * Get the width value or default width
   * @return width
   */
  getWidthOrDefault() {
    var width = this.getWidth();
    if (width === null) {
      width = 1.0;
    }
    return width;
  }
  /**
   * Get the fill color column
   * @return {module:user/userColumn~UserColumn}
   */
  getFillColorColumn() {
    return this.styleTable.getFillColorColumn();
  }
  /**
   * Get the style fill color
   * @return {String} color
   */
  getFillColor() {
    return this.createColor(this.getFillHexColor(), this.getFillOpacity());
  }
  /**
   * Check if the style has a fill color
   * @return true if has a color
   */
  hasFillColor() {
    return this._hasColor(this.getFillHexColor(), this.getFillOpacity());
  }
  /**
   * Get the fill color
   * @return {String} color
   */
  getFillHexColor() {
    return this.getValueWithColumnName(this.getFillColorColumn().name);
  }
  /**
   * Set the fill color
   * @param {String} color color
   * @param {Number} opacity opacity
   */
  setFillColor(color, opacity) {
    this.setFillHexColor(color);
    this.setFillOpacity(opacity);
  }
  /**
   * Sets the fill color for the row
   * @param {String} color color
   */
  setFillHexColor(color) {
    var validatedColor = this.validateColor(color);
    this.setValueWithColumnName(this.getFillColorColumn().name, validatedColor);
  }
  /**
   * Get the fill opacity column
   * @return {module:user/userColumn~UserColumn}
   */
  getFillOpacityColumn() {
    return this.styleTable.getFillOpacityColumn();
  }
  /**
   * Gets the fill opacity
   * @return {Number}
   */
  getFillOpacity() {
    return this.getValueWithColumnName(this.getFillOpacityColumn().name);
  }
  /**
   * Sets the fill opacity for the row
   * @param {Number} fillOpacity fillOpacity
   */
  setFillOpacity(fillOpacity) {
    this.validateOpacity(fillOpacity);
    this.setValueWithColumnName(this.getFillOpacityColumn().name, fillOpacity);
  }
  /**
   * Get the fill opacity or default value
   * @return {Number} fill opacity
   */
  getFillOpacityOrDefault() {
    var fillOpacity = this.getFillOpacity();
    if (fillOpacity == null) {
      fillOpacity = 1.0;
    }
    return fillOpacity;
  }
  /**
   * Validate and adjust the color value
   * @param {String} color color
   */
  validateColor(color) {
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
  }
  /**
   * Validate the opacity value
   * @param {Number} opacity opacity
   */
  validateOpacity(opacity) {
    if (opacity != null && (opacity < 0.0 || opacity > 1.0)) {
      throw new Error("Opacity must be set inclusively between 0.0 and 1.0, invalid value: " + opacity);
    }
  }
  /**
   * Create a color from the hex color and opacity
   * @param {String} hexColor hex color
   * @param {Number} opacity opacity
   * @return {String} rgba color
   */
  createColor(hexColor, opacity) {
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
  }
  /**
   * Determine if a color exists from the hex color and opacity
   * @param {String} hexColor hex color
   * @param {Number} opacity opacity
   * @return true if has a color
   */
  _hasColor(hexColor, opacity) {
    return hexColor !== null || opacity !== null;
  }
}