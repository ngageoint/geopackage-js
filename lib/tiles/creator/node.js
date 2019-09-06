var util = require('util')
  , concat = require('concat-stream')
  , ImageUtils = require('../imageUtils');

var TileCreator = require('./index').TileCreator;

function NodeTileCreator(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, projectionFrom, projectionTo, canvas) {
  TileCreator.apply(this, arguments);

  this.Canvas = require('canvas');
  this.canvas = canvas || this.Canvas.createCanvas(width, height);
  this.ctx = this.canvas.getContext('2d');

  this.tileCanvas = this.Canvas.createCanvas(width, height);
  this.tileContext = this.tileCanvas.getContext('2d');
  this.tileCanvas.width = tileMatrix.tile_width;
  this.tileCanvas.height = tileMatrix.tile_height;
  this.imageData = this.Canvas.createImageData(new Uint8ClampedArray(width * height * 4), width, height);
  this.pixelAdded = false;
}

util.inherits(NodeTileCreator, TileCreator);

NodeTileCreator.prototype.addPixel = function (targetX, targetY, sourceX, sourceY) {
  var color = this.tileContext.getImageData(sourceX, sourceY, 1, 1);
  this.imageData.data.set(color.data, (targetY * this.width * 4) + (targetX * 4));
  this.pixelAdded = true;
};

NodeTileCreator.prototype.addTile = function (tileData, gridColumn, gridRow) {
  return ImageUtils.getImage(tileData)
  .then(function(img) {
    this.tile = img;
    this.tileContext.drawImage(img, 0, 0);
    this.chunks = [];
  }.bind(this))
  .then(function() {
    return this.projectTile(tileData, gridColumn, gridRow);
  }.bind(this))
  .then(function() {
    if (this.pixelAdded) {
      this.ctx.putImageData(this.imageData, 0, 0);
    }
  }.bind(this))
  .then(function() {
    if (this.chunks && this.chunks.length) {
      return this.chunks.reduce(function(sequence, chunk) {
        return sequence.then(function() {
          return ImageUtils.getImage(tileData);
        }.bind(this))
        .then(function(image) {
          var p = chunk.position;
          this.ctx.drawImage(image,
            p.sx,
            p.sy,
            p.sWidth,
            p.sHeight,
            p.dx,
            p.dy,
            p.dWidth,
            p.dHeight
          );
        }.bind(this));
      }.bind(this), Promise.resolve());
    }
  }.bind(this))
  .then(function() {
    return this.canvas;
  }.bind(this));
};

NodeTileCreator.prototype.getCompleteTile = function (format) {
  return new Promise(function (resolve, reject) {
    var writeStream = concat(function(buffer) {
      resolve(buffer);
    });
    var stream = null;
    if (format === 'png') {
      stream = this.canvas.createPNGStream();
    } else {
      stream = this.canvas.createJPEGStream();
    }
    stream.pipe(writeStream);
  }.bind(this));
};

module.exports = NodeTileCreator;
