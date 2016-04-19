var fileType = require('file-type');

module.exports.initialize = function(width, height, callback) {
  if (typeof(process) !== 'undefined' && process.version) {
    new LwipTileCreator(width, height, callback);
  } else {
    new CanvasTileCreator(width, height, callback);
  }
}

function CanvasTileCreator(width, height, callback) {
  this.canvas = document.createElement('canvas');
  this.canvas.width  = width;
  this.canvas.height = height;
  this.ctx = this.canvas.getContext('2d');
  callback(null, this);
}

CanvasTileCreator.prototype.addTile = function (tileData, xOffset, yOffset, callback) {
  var type = fileType(tileData);

  var base64Data = btoa(String.fromCharCode.apply(null, tileData));
  var image = document.createElement('img');
  image.onload = function() {
    this.ctx.drawImage(image, xOffset, yOffset);
    callback();
  }.bind(this);
  image.src = 'data:'+type.mime+';base64,' + base64Data;
};

CanvasTileCreator.prototype.getCompleteTile = function (format, callback) {
  callback(null, this.canvas.toDataURL());
};

function LwipTileCreator(width, height, callback) {
  this.lwip = require('lwip');
  this.width = width;
  this.height = height;
  // width and height are the size of the resultant tile.  We need to make an image
  // that has that amount of padding around the outside so we can paste outside of
  // the resultant bounds
  this.lwip.create(this.width * 3, this.height * 3, function(err, image){
    this.image = image;
    callback(null, this);
  }.bind(this));
}

LwipTileCreator.prototype.addTile = function (tileData, xOffset, yOffset, callback) {
  var type = fileType(tileData);
  this.lwip.open(tileData, type.ext, function(err, tile) {
    this.image.paste(xOffset+this.width, yOffset+this.height, tile, callback);
  }.bind(this));
};

LwipTileCreator.prototype.getCompleteTile = function (format, callback) {
  this.image.writeFile('/tmp/lwip.png', function(err) {
    this.image.batch()
    .crop(this.width, this.height)
    .toBuffer(format, callback);

  }.bind(this));
};
