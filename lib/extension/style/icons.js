/**
 * @memberOf module:extension/style
 * @class Icons
 */
/**
 * Icons constructor
 * @constructor
 */
class Icons {
  constructor() {
    this.defaultIcon = null;
    this.icons = {};
  }
  setDefault(iconRow) {
    this.defaultIcon = iconRow;
  }
  getDefault() {
    return this.defaultIcon;
  }
  setIcon(iconRow, geometryType) {
    if (geometryType != null) {
      if (iconRow != null) {
        this.icons[geometryType] = iconRow;
      }
      else {
        delete this.icons[geometryType];
      }
    }
    else {
      this.setDefault(iconRow);
    }
  }
  getIcon(geometryType) {
    var iconRow = null;
    if (geometryType != null) {
      iconRow = this.icons[geometryType];
    }
    if (iconRow === null || geometryType === null) {
      iconRow = this.getDefault();
    }
    return iconRow;
  }
  isEmpty() {
    return Object.keys(this.icons).length === 0 && this.defaultIcon === null;
  }
}






module.exports = Icons;
