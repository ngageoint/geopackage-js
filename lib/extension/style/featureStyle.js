/**
 * FeatureStyle constructor
 * @param {module:extension/style.StyleRow} styleRow
 * @param {module:extension/style.IconRow} iconRow
 * @constructor
 */
class FeatureStyle {
  constructor(styleRow, iconRow) {
    this.styleRow = styleRow;
    this.iconRow = iconRow;
  }
  /**
   * Set style
   * @param {module:extension/style.StyleRow} styleRow
   */
  setStyle(styleRow) {
    this.styleRow = styleRow;
  }
  /**
   * Get style
   * @returns {module:extension/style.StyleRow}
   */
  getStyle() {
    return this.styleRow;
  }
  /**
   * Returns true if has style
   * @returns {Boolean}
   */
  hasStyle() {
    return !!this.styleRow;
  }
  /**
   * Set icon
   * @param {module:extension/style.IconRow} iconRow
   */
  setIcon(iconRow) {
    this.iconRow = iconRow;
  }
  /**
   * Get icon
   * @returns {module:extension/style.IconRow}
   */
  getIcon() {
    return this.iconRow;
  }
  /**
   * Returns true if has icon
   * @returns {Boolean}
   */
  hasIcon() {
    return !!this.iconRow;
  }
}

module.exports = FeatureStyle;
