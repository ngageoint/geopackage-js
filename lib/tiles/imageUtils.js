var fileType = require('file-type')
	, Duplex = require('stream').Duplex
	, pureimage = require('pureimage');

var ImageUtils = {};

/**
 * Get image for data
 * @param {Buffer} data
 * @returns {Promise<Bitmap>}
 */
ImageUtils.getImage = function (data) {
	var type = fileType(data);
	var stream = new Duplex();
	stream.push(data);
	stream.push(null);
	var decodeFunction = type.ext === 'png' ? pureimage.decodePNGFromStream : pureimage.decodeJPEGFromStream;
	return decodeFunction(stream)
		.then(function(img) {
			return img;
		}.bind(this));
};

/**
 * Get a scaled image
 * @param {Buffer} data
 * @param {Number} scale
 * @returns {Promise<Bitmap>}
 */
ImageUtils.getScaledImage = function (data, scale) {
	return ImageUtils.getImage(data).then(function (bitmap) {
		return ImageUtils.scaleBitmap(bitmap, scale);
	}.bind(this));
};

/**
 * Get a scaled image
 * @param {Bitmap} bitmap
 * @param {Number} scale
 * @returns {Bitmap}
 */
ImageUtils.scaleBitmap = function (bitmap, scale) {
	if (scale === 1.0) {
		return bitmap;
	} else {
		var iconWidth = bitmap.width;
		var iconHeight = bitmap.height;
		var scaledWidth = Math.round(scale * iconWidth);
		var scaledHeight = Math.round(scale * iconHeight);
		var img = pureimage.make(scaledWidth,scaledHeight, null);
		var ctx = img.getContext();
		ctx.drawImage(bitmap, 0, 0, iconWidth, iconHeight, 0, 0, scaledWidth, scaledHeight);
		return img;
	}
};

module.exports = ImageUtils;
