/**
 * @memberOf module:extension/style
 * @class Styles
 */


/**
 * Styles constructor
 * @constructor
 */
var Styles = function() {
  this.defaultStyle = null;
  this.styles = {};
};

Styles.prototype.setDefault = function(styleRow) {
  this.defaultStyle = styleRow;
};

Styles.prototype.getDefault = function() {
  return this.defaultStyle;
};

Styles.prototype.setStyle = function(styleRow, geometryType) {
  if (geometryType != null) {
    if (styleRow != null) {
      this.styles[geometryType] = styleRow;
    } else {
      delete this.styles[geometryType];
    }
  } else {
    this.setDefault(styleRow);
  }
};

Styles.prototype.getStyle = function(geometryType) {
  var styleRow = null;
  if (geometryType != null) {
    styleRow = this.styles[geometryType];
  }
  if (styleRow === null || geometryType === null) {
    styleRow = this.getDefault();
  }
  return styleRow;
};

Styles.prototype.isEmpty = function() {
  return Object.keys(this.styles).length === 0 && this.defaultStyle === null;
};

module.exports = Styles;
