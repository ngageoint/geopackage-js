/**
 * @memberOf module:extension/style
 * @class Icons
 */

/**
 * Icons constructor
 * @constructor
 */
var Icons = function() {
  this.defaultIcon = null;
  this.icons = {};
};

Icons.prototype.setDefault = function(iconRow) {
  this.defaultIcon = iconRow;
};

Icons.prototype.getDefault = function() {
  return this.defaultIcon;
};

Icons.prototype.setIcon = function(iconRow, geometryType) {
  if (geometryType != null) {
    if (iconRow != null) {
      this.icons[geometryType] = iconRow;
    } else {
      delete this.icons[geometryType];
    }
  } else {
    this.setDefault(iconRow);
  }
};

Icons.prototype.getIcon = function(geometryType) {
  var iconRow = null;
  if (geometryType != null) {
    iconRow = this.icons[geometryType];
  }
  if (iconRow === null || geometryType === null) {
    iconRow = this.getDefault();
  }
  return iconRow;
};

Icons.prototype.isEmpty = function() {
  return Object.keys(this.icons).length === 0 && this.defaultIcon === null;
};

module.exports = Icons;
