/**
 * FeatureTilePointIcon module.
 * @memberOf tiles/features
 */

/**
 * Constructor
 * @class FeatureTilePointIcon
 * @param {Image} icon
 * @constructor
 */
var FeatureTilePointIcon = function (icon) {
  this.icon = icon;
  this.width = icon.width;
  this.height = icon.height;
  this.pinIconDefault();
};

/**
 * Pin the icon to the point, lower middle on the point
 */
FeatureTilePointIcon.prototype.pinIconDefault = function() {
  this.xOffset = this.width / 2.0;
  this.yOffset = this.height;
};

/**
 * Center the icon on the point
 */
FeatureTilePointIcon.prototype.pinIconCenter = function() {
  this.xOffset = this.width / 2.0;
  this.yOffset = this.height / 2.0;
};

/**
 * Get the icon
 * @returns {Image} icon
 */
FeatureTilePointIcon.prototype.getIcon = function() {
  return this.icon;
};

/**
 * Get the width
 * @return {Number} width
 */
FeatureTilePointIcon.prototype.getWidth = function() {
  return this.width;
};

/**
 * Set the display width and adjust the x offset
 * @param {Number} width icon display width
 */
FeatureTilePointIcon.prototype.setWidth = function(width) {
  this.xOffset = this.xOffset / this.width * width;
  this.width = width;
};

/**
 * Get the height
 * @return {Number} height
 */
FeatureTilePointIcon.prototype.getHeight = function() {
  return this.height;
};

/**
 * Set the display height and adjust the y offset
 * @param {Number} height  icon display height
 */
FeatureTilePointIcon.prototype.setHeight = function(height) {
  this.yOffset = this.yOffset / this.height * height;
  this.height = height;
};

/**
 * Get the x offset
 * @return {Number} x offset
 */
FeatureTilePointIcon.prototype.getXOffset = function() {
  return this.xOffset;
};

/**
 * Set the x offset
 * @param {Number} xOffset x offset
 */
FeatureTilePointIcon.prototype.setXOffset = function(xOffset) {
  this.xOffset = xOffset;
};

/**
 * Get the y offset
 * @return {Number} y offset
 */
FeatureTilePointIcon.prototype.getYOffset = function() {
  return this.yOffset;
};

/**
 * Set the y offset
 * @param {Number} yOffset y offset
 */
FeatureTilePointIcon.prototype.setYOffset = function(yOffset) {
  this.yOffset = yOffset;
};

module.exports = FeatureTilePointIcon;
