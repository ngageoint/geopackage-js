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
  // @ts-ignore
  , concat = require('concat-stream')
  , path = require('path');

var isElectron = !!(typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf(' electron/') > -1);
// @ts-ignore
var isPhantom = !!(typeof window !== 'undefined' && window.callPhantom && window._phantom);
var isNode = typeof (process) !== 'undefined' && process.version;

/**
 *  Tiles drawn from or linked to features. Used to query features and optionally draw tiles
 *  from those features.
 */
class NumberFeaturesTile extends CustomFeatureTile {
  constructor() {
    super();
    this.useNodeCanvas = isNode && !isPhantom && !isElectron;
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
  }
  /**
   * register a font
   * @private
   */
  _registerDefaultFont() {
    if (!this.defaultFontRegistered) {
      if (this.useNodeCanvas) {
        var Canvas = require('canvas');
        Canvas.registerFont(path.join(__dirname, '..', '..', '..', 'fonts', 'PTMono-Regular.ttf'), { family: 'PT Mono' });
      }
      this.defaultFontRegistered = true;
    }
  }
  /**
   * Get the text size
   * @return {Number} text size
   */
  getTextSize() {
    return this.textSize;
  }
  /**
   * Set the text size
   * @param {Number} textSize text size
   */
  setTextSize(textSize) {
    this.textSize = textSize;
  }
  /**
   * Get the text color
   * @return {String} text color
   */
  getTextColor() {
    return this.textColor;
  }
  /**
   * Set the text color
   * @param {String} textColor text color
   */
  setTextColor(textColor) {
    this.textColor = textColor;
  }
  /**
   * Get the circle stroke width
   * @return {Number} circle stroke width
   */
  getCircleStrokeWidth() {
    return this.circleStrokeWidth;
  }
  /**
   * Set the circle stroke width
   * @param {Number} circleStrokeWidth circle stroke width
   */
  setCircleStrokeWidth(circleStrokeWidth) {
    this.circleStrokeWidth = circleStrokeWidth;
  }
  /**
   * Get the circle color
   * @return {String} circle color
   */
  getCircleColor() {
    return this.circleBorderColor;
  }
  /**
   * Set the circle color
   * @param {String} circleBorderColor circle color
   */
  setCircleColor(circleBorderColor) {
    this.circleBorderColor = circleBorderColor;
  }
  /**
   * Get the circle fill color
   * @return {String} circle fill color
   */
  getCircleFillColor() {
    return this.circleFillColor;
  }
  /**
   * Set the circle fill color
   * @param {String} circleFillColor circle fill color
   */
  setCircleFillColor(circleFillColor) {
    this.circleFillColor = circleFillColor;
  }
  /**
   * Get the circle padding percentage around the text
   * @return {Number} circle padding percentage, 0.0 to 1.0
   */
  getCirclePaddingPercentage() {
    return this.circlePaddingPercentage;
  }
  /**
   * Set the circle padding percentage to pad around the text, value between
   * 0.0 and 1.0
   * @param {Number} circlePaddingPercentage circle padding percentage
   */
  setCirclePaddingPercentage(circlePaddingPercentage) {
    if (circlePaddingPercentage < 0.0 || circlePaddingPercentage > 1.0) {
      throw new Error("Circle padding percentage must be between 0.0 and 1.0: " + circlePaddingPercentage);
    }
    this.circlePaddingPercentage = circlePaddingPercentage;
  }
  /**
   * Get the tile border stroke width
   * @return {Number} tile border stroke width
   */
  getTileBorderStrokeWidth() {
    return this.tileBorderStrokeWidth;
  }
  /**
   * Set the tile border stroke width
   *
   * @param {Number} tileBorderStrokeWidth tile border stroke width
   */
  setTileBorderStrokeWidth(tileBorderStrokeWidth) {
    this.tileBorderStrokeWidth = tileBorderStrokeWidth;
  }
  /**
   * Get the tile border color
   * @return {String} tile border color
   */
  getTileBorderColor() {
    return this.tileBorderColor;
  }
  /**
   * Set the tile border color
   * @param {String} tileBorderColor tile border color
   */
  setTileBorderColor(tileBorderColor) {
    this.tileBorderColor = tileBorderColor;
  }
  /**
   * Get the tile fill color
   * @return {String} tile fill color
   */
  getTileFillColor() {
    return this.tileFillColor;
  }
  /**
   * Set the tile fill color
   * @param {String} tileFillColor tile fill color
   */
  setTileFillColor(tileFillColor) {
    this.tileFillColor = tileFillColor;
  }
  /**
   * Is the draw unindexed tiles option enabled
   * @return {Boolean} true if drawing unindexed tiles
   */
  isDrawUnindexedTiles() {
    return this.drawUnindexedTiles;
  }
  /**
   * Set the draw unindexed tiles option
   * @param {Boolean} drawUnindexedTiles draw unindexed tiles flag
   */
  setDrawUnindexedTiles(drawUnindexedTiles) {
    this.drawUnindexedTiles = drawUnindexedTiles;
  }
  /**
   * Get the compression format
   * @return {String} the compression format (either png or jpeg)
   */
  getCompressFormat() {
    return this.compressFormat;
  }
  /**
   * Set the compression format
   * @param {String} compressFormat either 'png' or 'jpeg'
   */
  setCompressFormat(compressFormat) {
    this.compressFormat = compressFormat;
  }
  /**
   * Draw unindexed tile
   * @param tileWidth
   * @param tileHeight
   * @param canvas
   * @returns {Promise<String|Buffer>}
   */
  drawUnindexedTile(tileWidth, tileHeight, canvas = null) {
    var image = null;
    if (this.drawUnindexedTiles) {
      // Draw a tile indicating we have no idea if there are features
      // inside.
      // The table is not indexed and more features exist than the max
      // feature count set.
      image = this.drawTile(tileWidth, tileHeight, "?", canvas);
    }
    return Promise.resolve(image);
  }
  /**
   * Draw a tile with the provided text label in the middle
   * @param {Number} tileWidth
   * @param {Number} tileHeight
   * @param {String} text
   * @param tileCanvas
   * @return {Promise<String|Buffer>}
   */
  drawTile(tileWidth, tileHeight, text, tileCanvas) {
    // @ts-ignore
    // eslint-disable-next-line complexity
    return new Promise(function (resolve) {
      this._registerDefaultFont();
      var canvas;
      if (tileCanvas !== undefined && tileCanvas !== null) {
        canvas = tileCanvas;
      }
      else {
        if (this.useNodeCanvas) {
          var Canvas = require('canvas');
          canvas = Canvas.createCanvas(tileWidth, tileHeight);
        }
        else {
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
        context.lineWidth = this.tileBorderStrokeWidth;
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
      if (this.useNodeCanvas) {
        var writeStream = concat(function (buffer) {
          resolve(buffer);
        });
        var stream = null;
        if (this.compressFormat === 'png') {
          stream = canvas.createPNGStream();
        }
        else {
          stream = canvas.createJPEGStream();
        }
        stream.pipe(writeStream);
      }
      else {
        resolve(canvas.toDataURL('image/' + this.compressFormat));
      }
    }.bind(this));
  }
}

module.exports = NumberFeaturesTile;
