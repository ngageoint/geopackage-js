/**
 * @memberOf module:extension/style
 * @class Styles
 */
/**
 * Styles constructor
 * @constructor
 */
class Styles {
  constructor() {
    this.defaultStyle = null;
    this.styles = {};
  }
  setDefault(styleRow) {
    this.defaultStyle = styleRow;
  }
  getDefault() {
    return this.defaultStyle;
  }
  setStyle(styleRow, geometryType) {
    if (geometryType != null) {
      if (styleRow != null) {
        this.styles[geometryType] = styleRow;
      }
      else {
        delete this.styles[geometryType];
      }
    }
    else {
      this.setDefault(styleRow);
    }
  }
  getStyle(geometryType) {
    var styleRow = null;
    if (geometryType != null) {
      styleRow = this.styles[geometryType];
    }
    if (styleRow === null || geometryType === null) {
      styleRow = this.getDefault();
    }
    return styleRow;
  }
  isEmpty() {
    return Object.keys(this.styles).length === 0 && this.defaultStyle === null;
  }
}

module.exports = Styles;
