var ImageUtils = {};

/**
 * Get image for data
 * @param {Buffer|String} data file data or file path
 * @returns {Promise<Image>}
 */
ImageUtils.getImage = function (data) {
	return new Promise(function (resolve, reject) {
		if (typeof(process) !== 'undefined' && process.version) {
			var Canvas = require('canvas');
			const image = new Canvas.Image();
			image.onload = () => { resolve(image); };
			image.onerror = err => { reject(err); };
			image.src = data;
		} else {
			var image = new Image();
			image.onload =  () => { resolve(image); };
			var src = data;
			if (data instanceof Buffer) {
				src = 'data:image/png;base64,' + data.toString('base64');
			}
			image.src = src;
		}
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
 * @param {Image} image
 * @param {Number} scale
 * @returns {Promise<Image>}
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
		if (typeof(process) !== 'undefined' && process.version) {
			var Canvas = require('canvas');
			canvas = Canvas.createCanvas(scaledWidth, scaledHeight);
			img = new Canvas.Image();
		} else {
			canvas = document.createElement('canvas');
			canvas.width = scaledWidth;
			canvas.height = scaledHeight;
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
