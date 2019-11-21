var sizeOf = require('image-size');
var ImageUtils = {};
var isElectron = !!(typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf(' electron/') > -1);
// @ts-ignore
var isPhantom = !!(typeof window !== 'undefined' && window.callPhantom && window._phantom);
var isNode = typeof(process) !== 'undefined' && process.version;
ImageUtils.useNodeCanvas =  isNode && !isPhantom && !isElectron;

/**
 * Get image for data
 * @param {Buffer|String} data file data or file path
 * @returns {Object}
 */
ImageUtils.getImageSize = function (data) {
  return sizeOf(data);
};

/**
 * Get image for data
 * @param {Buffer|String} data file data or file path
 * @param {String} contentType
 * @returns {Promise<typeof Image>}
 */
ImageUtils.getImage = function (data, contentType = 'image/png') {
  return new Promise(function (resolve, reject) {
    var image;
    if (ImageUtils.useNodeCanvas) {
      var Canvas = require('canvas');
      image = new Canvas.Image();
    } else {
      // eslint-disable-next-line no-undef
      image = new Image();
    }
    image.onload = () => {
      resolve(image);
    };
    image.onerror = (error) => {
      reject(error);
    };
    var src = data;
    if (data instanceof Buffer) {
      src = 'data:' + contentType + ';base64,' + data.toString('base64');
    }
    image.src = src;
  }.bind(this));
};

/**
 * Get a scaled image
 * @param {Buffer} data
 * @param {Number} scale
 * @returns {Promise<Image>}
 */
ImageUtils.getScaledImage = function (data, scale) {
  return ImageUtils.getImage(data).then(function (image) {
    return ImageUtils.scaleBitmap(image, scale);
  }.bind(this));
};

/**
 * Get a scaled image
 * @param {typeof Image} image
 * @param {Number} scale
 * @returns {Promise<typeof Image>}
 */
ImageUtils.scaleBitmap = function (image, scale) {
  if (scale === 1.0) {
    return Promise.resolve(image);
  } else {
    var iconWidth = image.width;
    var iconHeight = image.height;
    var scaledWidth = Math.round(scale * iconWidth);
    var scaledHeight = Math.round(scale * iconHeight);
    var canvas, ctx, img;
    if (ImageUtils.useNodeCanvas) {
      var Canvas = require('canvas');
      canvas = Canvas.createCanvas(scaledWidth, scaledHeight);
      img = new Canvas.Image();
    } else {
      // eslint-disable-next-line no-undef
      canvas = document.createElement('canvas');
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
      // eslint-disable-next-line no-undef
      img = new Image();
    }
    ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, iconWidth, iconHeight, 0, 0, scaledWidth, scaledHeight);
    return new Promise(function (resolve) {
      img.onload = () => { resolve(img); };
      img.src = canvas.toDataURL();
    }.bind(this));
  }
};

module.exports = ImageUtils;
