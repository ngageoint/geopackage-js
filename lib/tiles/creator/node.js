var util = require('util')
  , async = require('async')
  , fileType = require('file-type')
  , Duplex = require('stream').Duplex
  , Writable = require('stream').Writable;

var TileCreator = require('./index').TileCreator;

function NodeTileCreator(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, projectionFrom, projectionTo, callback) {
  TileCreator.apply(this, arguments);

  this.pureimage = require('pureimage');
  this.pixels = [];
  this.canvas = this.pureimage.make(this.width, this.height);
  this.ctx = this.canvas.getContext('2d');
  callback(null, this);
}

util.inherits(NodeTileCreator, TileCreator);

NodeTileCreator.prototype.addPixel = function (targetX, targetY, sourceX, sourceY) {
  this.pixels.push({
    x: targetX,
    y: targetY,
    color: this.tile.getPixelRGBA(sourceX, sourceY)
  });
};

NodeTileCreator.prototype.addTile = function (tileData, gridColumn, gridRow, callback) {
  var type = fileType(tileData);
  var stream = new Duplex();
  stream.push(tileData);
  stream.push(null);

  var decodeFunction = type.ext === 'png' ? this.pureimage.decodePNGFromStream : this.pureimage.decodeJPEGFromStream;

  decodeFunction(stream).then(function(img) {

    this.tile = img;
    this.chunks = [];
    this.projectTile(tileData, gridColumn, gridRow, function(err, imageData) {
      async.eachSeries(this.pixels, function(pixel, pixelDone) {
        async.setImmediate(function () {
          // console.log('pixel color', pixel.color);
          this.canvas.setPixelRGBA(pixel.x, pixel.y, pixel.color);
          pixelDone();
        }.bind(this));
      }.bind(this), function(err) {
        async.eachSeries(this.chunks, function(chunk, chunkDone) {
          var type = fileType(chunk.chunk);
          var image = this.image;
          var chunkStream = new Duplex();
          chunkStream.push(tileData);
          chunkStream.push(null);
          decodeFunction(chunkStream).then(function(image) {
            var p = chunk.position;

            var xPositionOfImageToDrawFrom = p.tileCropXStart;
            var yPositionOfImageToDrawFrom = p.tileCropYStart;
            var widthOfImageToDraw = 1 + p.tileCropXEnd - p.tileCropXStart;
            var heightOfImageToDraw = 1 + p.tileCropYEnd - p.tileCropYStart;
            var xPositionToPlaceImageInCanvas = p.xPositionInFinalTileStart;
            var yPositionToPlaceImageInCanvas = p.yPositionInFinalTileStart;
            var imageWidth = p.xPositionInFinalTileEnd - p.xPositionInFinalTileStart;
            var imageHeight = p.yPositionInFinalTileEnd - p.yPositionInFinalTileStart;

            this.ctx.drawImage(image,
              xPositionOfImageToDrawFrom,
              yPositionOfImageToDrawFrom,
              widthOfImageToDraw,
              heightOfImageToDraw,
              xPositionToPlaceImageInCanvas,
              yPositionToPlaceImageInCanvas,
              imageWidth,
              imageHeight
            );
            chunkDone();
          }.bind(this));
        }.bind(this), function(err) {
          callback(err, this.canvas);
        }.bind(this));
      }.bind(this));
    }.bind(this));
  }.bind(this));
};

NodeTileCreator.prototype.getCompleteTile = function (format, callback) {
  var stream = new Writable();
  var buffers = [];
  stream._write = function(chunk, enc, next) {
    buffers.push(chunk);
    next();
  };
  if (format === 'jpg') {
    this.pureimage.encodeJPEGToStream(this.canvas, stream).then(function() {
      callback(null, Buffer.concat(buffers));
    });
  } else {
    this.pureimage.encodePNGToStream(this.canvas, stream).then(function() {
      callback(null, Buffer.concat(buffers));
    });
  }
};

module.exports = NodeTileCreator;
