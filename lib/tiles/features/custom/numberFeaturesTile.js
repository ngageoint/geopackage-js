/**
 * NumberFeaturesTile module.
 * @module tiles/features/custom
 */

/**
 * Draws a tile indicating the number of features that exist within the tile,
 * visible when zoomed in closer. The number is drawn in the center of the tile
 * and by default is surrounded by a colored circle with border. By default a
 * tile border is drawn and the tile is colored (transparently most likely). The
 * paint objects for each draw type can be modified to or set to null (except
 * for the text paint object).
 */

var CustomFeatureTile = require('./customFeaturesTile')
  , concat = require('concat-stream')
  , util = require('util');

/**
 *  Tiles drawn from or linked to features. Used to query features and optionally draw tiles
 *  from those features.
 */
var NumberFeaturesTile = function() {
  CustomFeatureTile.call(this);
  this.textSize = 18;
  this.textFont = 'PT Mono';
  this.textColor = "rgba(255, 255, 255, 1.0)";
  this.circleStrokeWidth = 3;
  this.circleBorderColor = "rgba(0, 0, 0, 0.25)";
  this.circleFillColor = "rgba(0, 0, 0, 1.0)";
  this.tileBorderStrokeWidth = 2;
  this.tileBorderColor = "rgba(0, 0, 0, 1.0)";
  this.tileFillColor = "rgba(0, 0, 0, 0.0625)";
  this.circlePaddingPercentage = 0.25;
  this.drawUnindexedTiles = true;
  this.compressFormat = 'png';
  this.defaultFontRegistered = false;
};

util.inherits(NumberFeaturesTile, CustomFeatureTile);


/**
 * register a font
 * @private
 */
NumberFeaturesTile.prototype._registerDefaultFont = function() {
  if (!this.defaultFontRegistered) {
    if (typeof(process) !== 'undefined' && process.version) {
      var Canvas = require('canvas');
      Canvas.registerFont('lib/fonts/PTMono-Regular.ttf', {family: 'PT Mono'});
    }
    this.defaultFontRegistered = true;
  }
};

/**
 * Get the text size
 * @return {Number} text size
 */
NumberFeaturesTile.prototype.getTextSize = function() {
  return this.textSize;
};

/**
 * Set the text size
 * @param {Number} textSize text size
 */
NumberFeaturesTile.prototype.setTextSize = function(textSize) {
  this.textSize = textSize;
};

/**
 * Get the text color
 * @return {String} text color
 */
NumberFeaturesTile.prototype.getTextColor = function() {
  return this.textColor;
};

/**
 * Set the text color
 * @param {String} textColor text color
 */
NumberFeaturesTile.prototype.setTextColor = function(textColor) {
  this.textColor = textColor;
};

/**
 * Get the circle stroke width
 * @return {Number} circle stroke width
 */
NumberFeaturesTile.prototype.getCircleStrokeWidth = function() {
  return this.circleStrokeWidth;
};

/**
 * Set the circle stroke width
 * @param {Number} circleStrokeWidth circle stroke width
 */
NumberFeaturesTile.prototype.setCircleStrokeWidth = function(circleStrokeWidth) {
  this.circleStrokeWidth = circleStrokeWidth;
};

/**
 * Get the circle color
 * @return {String} circle color
 */
NumberFeaturesTile.prototype.getCircleColor = function() {
  return this.circleBorderColor;
};

/**
 * Set the circle color
 * @param {String} circleBorderColor circle color
 */
NumberFeaturesTile.prototype.setCircleColor = function(circleBorderColor) {
  this.circleBorderColor = circleBorderColor;
};

/**
 * Get the circle fill color
 * @return {String} circle fill color
 */
NumberFeaturesTile.prototype.getCircleFillColor = function() {
  return this.circleFillColor;
};

/**
 * Set the circle fill color
 * @param {String} circleFillColor circle fill color
 */
NumberFeaturesTile.prototype.setCircleFillColor = function(circleFillColor) {
  this.circleFillColor = circleFillColor;
};

/**
 * Get the circle padding percentage around the text
 * @return {Number} circle padding percentage, 0.0 to 1.0
 */
NumberFeaturesTile.prototype.getCirclePaddingPercentage = function() {
  return this.circlePaddingPercentage;
};

/**
 * Set the circle padding percentage to pad around the text, value between
 * 0.0 and 1.0
 * @param {Number} circlePaddingPercentage circle padding percentage
 */
NumberFeaturesTile.prototype.setCirclePaddingPercentage = function(circlePaddingPercentage) {
  if (circlePaddingPercentage < 0.0 || circlePaddingPercentage > 1.0) {
    throw new Error("Circle padding percentage must be between 0.0 and 1.0: " + circlePaddingPercentage);
  }
  this.circlePaddingPercentage = circlePaddingPercentage;
};

/**
 * Get the tile border stroke width
 * @return {Number} tile border stroke width
 */
NumberFeaturesTile.prototype.getTileBorderStrokeWidth = function() {
  return this.tileBorderStrokeWidth;
};

/**
 * Set the tile border stroke width
 *
 * @param {Number} tileBorderStrokeWidth tile border stroke width
 */
NumberFeaturesTile.prototype.setTileBorderStrokeWidth = function(tileBorderStrokeWidth) {
  this.tileBorderStrokeWidth = tileBorderStrokeWidth;
};

/**
 * Get the tile border color
 * @return {String} tile border color
 */
NumberFeaturesTile.prototype.getTileBorderColor = function() {
  return this.tileBorderColor;
};

/**
 * Set the tile border color
 * @param {String} tileBorderColor tile border color
 */
NumberFeaturesTile.prototype.setTileBorderColor = function(tileBorderColor) {
  this.tileBorderColor = tileBorderColor;
};

/**
 * Get the tile fill color
 * @return {String} tile fill color
 */
NumberFeaturesTile.prototype.getTileFillColor = function() {
  return this.tileFillColor;
};

/**
 * Set the tile fill color
 * @param {String} tileFillColor tile fill color
 */
NumberFeaturesTile.prototype.setTileFillColor = function(tileFillColor) {
  this.tileFillColor = tileFillColor;
};

/**
 * Is the draw unindexed tiles option enabled
 * @return {Boolean} true if drawing unindexed tiles
 */
NumberFeaturesTile.prototype.isDrawUnindexedTiles = function() {
  return this.drawUnindexedTiles;
};

/**
 * Set the draw unindexed tiles option
 * @param {Boolean} drawUnindexedTiles draw unindexed tiles flag
 */
NumberFeaturesTile.prototype.setDrawUnindexedTiles = function(drawUnindexedTiles) {
  this.drawUnindexedTiles = drawUnindexedTiles;
};

/**
 * Get the compression format
 * @return {String} the compression format (either png or jpeg)
 */
NumberFeaturesTile.prototype.getCompressFormat = function() {
  return this.compressFormat;
};

/**
 * Set the compression format
 * @param {String} compressFormat either 'png' or 'jpeg'
 */
NumberFeaturesTile.prototype.setCompressFormat = function(compressFormat) {
  this.compressFormat = compressFormat;
};

/**
 * Draw unindexed tile
 * @param tileWidth
 * @param tileHeight
 * @param canvas
 * @returns {Buffer}
 */
NumberFeaturesTile.prototype.drawUnindexedTile = function(tileWidth, tileHeight, canvas = null) {
  var image = null;
  if (this.drawUnindexedTiles) {
    // Draw a tile indicating we have no idea if there are features
    // inside.
    // The table is not indexed and more features exist than the max
    // feature count set.
    image = this.drawTile(tileWidth, tileHeight, "?", canvas);
  }
  return image;
};

/**
 * Draw a tile with the provided text label in the middle
 * @param {Number} tileWidth
 * @param {Number} tileHeight
 * @param {String} text
 * @param tileCanvas
 * @return {Promise<Image>}
 */
NumberFeaturesTile.prototype.drawTile = function(tileWidth, tileHeight, text, tileCanvas) {
  return new Promise(function(resolve, reject) {
    this._registerDefaultFont();
    var canvas;
    if (tileCanvas !== undefined && tileCanvas !== null) {
      canvas = tileCanvas
    } else {
      if (typeof(process) !== 'undefined' && process.version) {
        var Canvas = require('canvas');
        canvas = Canvas.createCanvas(tileWidth, tileHeight);
      } else {
        canvas = document.createElement('canvas');
        canvas.width = tileWidth;
        canvas.height = tileHeight;
      }
    }
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, tileWidth, tileHeight);
    // Draw the tile border
    if (this.tileFillColor !== null) {
      context.fillStyle = this.tileFillColor;
      context.fillRect(0, 0, tileWidth, tileHeight);
    }
    // Draw the tile border
    if (this.tileBorderColor !== null) {
      context.strokeStyle = this.tileBorderColor;
      context.lineWidth = this.tileBorderStrokeWidth
      context.strokeRect(0, 0, tileWidth, tileHeight);
    }

    context.font = this.textSize + 'px \'' + this.textFont + '\'';
    var textSize = context.measureText(text);
    var textWidth = textSize.width;
    var textHeight = this.textSize;

      // Determine the center of the tile
    var centerX = Math.round(tileWidth / 2.0);
    var centerY = Math.round(tileHeight / 2.0);

    // Draw the circle
    if (this.circleBorderColor != null || this.circleFillColor != null) {
      var diameter = Math.max(textWidth, textHeight);
      var radius = Math.round(diameter / 2.0);
      radius = Math.round(radius + (diameter * this.circlePaddingPercentage));
      // Draw the circle
      if (this.circleFillColor != null) {
        context.fillStyle = this.circleFillColor;
        context.beginPath();
        context.arc(centerX, centerY, radius, 0, 2 * Math.PI, true);
        context.closePath();
        context.fill();
      }
      // Draw the circle border
      if (this.circleBorderColor != null) {
        context.strokeStyle = this.circleBorderColor;
        context.lineWidth = this.circleStrokeWidth;
        context.beginPath();
        context.arc(centerX, centerY, radius, 0, 2 * Math.PI, true);
        context.closePath();
        context.stroke();
      }
    }
    // Draw the text
    var textX = centerX - Math.round(textWidth / 2.0);
    var textY = centerY;
    context.fillStyle = this.textColor;
    context.textBaseline = "middle";
    context.fillText(text, textX, textY);
    if (typeof(process) !== 'undefined' && process.version) {
      var writeStream = concat(function (buffer) {
        resolve(buffer);
      });
      var stream = null;
      if (this.compressFormat === 'png') {
        stream = canvas.createPNGStream();
      } else {
        stream = canvas.createJPEGStream();
      }
      stream.pipe(writeStream);
    } else {
      resolve(canvas.toDataURL('image/' + this.compressFormat));
    }
  }.bind(this));
};


module.exports = NumberFeaturesTile;
