/**
 * @memberOf module:extension/style
 * @class FeatureStyle
 */

/**
 * FeatureStyle constructor
 * @param {module:extension/style.StyleRow} styleRow
 * @param {module:extension/style.IconRow} iconRow
 * @constructor
 */
var FeatureStyle = function(styleRow, iconRow) {
  this.styleRow = styleRow;
  this.iconRow = iconRow;
};

/**
 * Set style
 * @param {module:extension/style.StyleRow} styleRow
 */
FeatureStyle.prototype.setStyle = function(styleRow) {
  this.styleRow = styleRow;
};

/**
 * Get style
 * @returns {module:extension/style.StyleRow}
 */
FeatureStyle.prototype.getStyle = function() {
  return this.styleRow;
};

/**
 * Returns true if has style
 * @returns {Boolean}
 */
FeatureStyle.prototype.hasStyle = function() {
  return !!this.styleRow;
};

/**
 * Set icon
 * @param {module:extension/style.IconRow} iconRow
 */
FeatureStyle.prototype.setIcon = function(iconRow) {
  this.iconRow = iconRow;
};

/**
 * Get icon
 * @returns {module:extension/style.IconRow}
 */
FeatureStyle.prototype.getIcon = function() {
  return this.iconRow;
};

/**
 * Returns true if has icon
 * @returns {Boolean}
 */
FeatureStyle.prototype.hasIcon = function() {
  return !!this.iconRow;
};

module.exports = FeatureStyle;
