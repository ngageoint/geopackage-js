/**
 * Paint module.
 * @module tiles/features
 */
var Paint = function () {
  this.color = '#000000FF';
  this.strokeWidth = 1.0;
  this.strokeStyle = '#000000FF';
};

/**
 * Get the color
 * @returns {String} color
 */
Paint.prototype.getColor = function() {
  return this.color;
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

/**
 * Get the stroke style
 * @returns {String} strokeStyle
 */
Paint.prototype.getStrokeStyle = function() {
  return this.strokeStyle;
};

/**
 * Set the stroke style
 * @param {String} strokeStyle
 */
Paint.prototype.setStrokeStyle = function(strokeStyle) {
  this.strokeStyle = strokeStyle;
};

module.exports = Paint;
