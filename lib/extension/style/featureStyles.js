/**
 * @memberOf module:extension/style
 * @class FeatureStyles
 */

/**
 * FeatureStyles constructor
 * @param {module:extension/style.Styles} styles
 * @param {module:extension/style.Icons} icons
 * @constructor
 */
var FeatureStyles = function(styles = null, icons = null) {
  this.styles = styles;
  this.icons = icons;
};

/**
 * Set style
 * @param {module:extension/style.Styles} styles
 */
FeatureStyles.prototype.setStyles = function(styles) {
  this.styles = styles;
};

/**
 * Get style
 * @returns {module:extension/style.Styles}
 */
FeatureStyles.prototype.getStyles = function() {
  return this.styles;
};

/**
 * Set icon
 * @param {module:extension/style.Icons} icons
 */
FeatureStyles.prototype.setIcons = function(icons) {
  this.icons = icons;
};

/**
 * Get icon
 * @returns {module:extension/style.Icons}
 */
FeatureStyles.prototype.getIcons = function() {
  return this.icons;
};

module.exports = FeatureStyles;
