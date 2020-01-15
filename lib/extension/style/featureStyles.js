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
class FeatureStyles {
  constructor(styles = null, icons = null) {
    this.styles = styles;
    this.icons = icons;
  }
  /**
   * Set style
   * @param {module:extension/style.Styles} styles
   */
  setStyles(styles) {
    this.styles = styles;
  }
  /**
   * Get style
   * @returns {module:extension/style.Styles}
   */
  getStyles() {
    return this.styles;
  }
  /**
   * Set icon
   * @param {module:extension/style.Icons} icons
   */
  setIcons(icons) {
    this.icons = icons;
  }
  /**
   * Get icon
   * @returns {module:extension/style.Icons}
   */
  getIcons() {
    return this.icons;
  }
}

module.exports = FeatureStyles;
