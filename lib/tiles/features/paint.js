/**
 * Paint module.
 * @module tiles/features
 */
var Paint = function () {
  this.color = '#000000FF';
  this.strokeWidth = 1.0;
};

/**
 * Get the color
 * @returns {String} color
 */
Paint.prototype.getColor = function() {
  return this.color;
};

/**
 * Get the color
 * @returns {String} color
 */
Paint.prototype.getColorRGBA = function() {
  // assumes color is in the format #RRGGBB or #RRGGBBAA
  var red = parseInt(this.color.substr(1,2), 16);
  var green = parseInt(this.color.substr(3,2), 16);
  var blue = parseInt(this.color.substr(5,2), 16);
  var alpha = 1.0;
  if (this.color.length > 6) {
    alpha = parseInt(this.color.substr(7,2), 16) / 255;
  }
  return 'rgba(' + red + ',' + green + ',' + blue + ',' + alpha + ')';
};

/**
 * Set the color
 * @param {String} color
 */
Paint.prototype.setColor = function(color) {
  this.color = color;
};

/**
 * Get the stroke width
 * @returns {Number} strokeWidth
 */
Paint.prototype.getStrokeWidth = function() {
  return this.strokeWidth;
};

/**
 * Set the stroke width
 * @param {Number} strokeWidth
 */
Paint.prototype.setStrokeWidth = function(strokeWidth) {
  this.strokeWidth = strokeWidth;
};

module.exports = Paint;
