var util = require('util')
  , async = require('async')
  , fileType = require('file-type');

var TileCreator = require('./index').TileCreator
  , TileBoundingBoxUtils = require('../tileBoundingBoxUtils');

function CanvasTileCreator(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, projectionFrom, projectionTo, canvas, callback) {
  TileCreator.apply(this, arguments);

  this.canvas = canvas || document.createElement('canvas');
  this.canvas.width  = width;
  this.canvas.height = height;
  this.ctx = this.canvas.getContext('2d');

  this.image = document.createElement('img');

  this.tileCanvas = document.createElement('canvas');
  this.tileContext = this.tileCanvas.getContext('2d');
  this.tileCanvas.width = tileMatrix.tileWidth;
  this.tileCanvas.height = tileMatrix.tileHeight;

  this.imageData = new Uint8ClampedArray(width * height * 4);

  callback(null, this);
}

util.inherits(CanvasTileCreator, TileCreator);

CanvasTileCreator.prototype.addChunk = function (chunk, xOffset, yOffset) {
  this.chunks.push({
    chunk: chunk,
    x: xOffset,
    y: yOffset
  });
};

CanvasTileCreator.prototype.addPixel = function (targetX, targetY, sourceX, sourceY) {
  var color = this.tileContext.getImageData(sourceX, sourceY, 1, 1);
  this.imageData.set(color.data, (targetY * this.width * 4) + (targetX * 4));
};

CanvasTileCreator.prototype.addTile = function (tileData, gridColumn, gridRow, callback) {
  var bb = TileBoundingBoxUtils.getTileBoundingBox(this.tileMatrixSet.getBoundingBox(), this.tileMatrix, gridColumn, gridRow);

  var type = fileType(tileData);
  var binary = '';
  var bytes = tileData;
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode( bytes[ i ] );
  }
  var base64Data = btoa( binary );
  this.image.onload = function() {
    this.tileContext.drawImage(this.image, 0, 0);
    this.projectTile(tileData, gridColumn, gridRow, function() {
      this.ctx.putImageData(new ImageData(this.imageData, this.width, this.height), 0, 0);
      async.eachSeries(this.chunks, function(chunk, chunkDone) {
        var type = fileType(tileData);

        var base64Data = btoa(String.fromCharCode.apply(null, chunk.chunk));
        var image = document.createElement('img');
        image.onload = function() {
          this.ctx.drawImage(image, chunk.x, chunk.y);
          chunkDone();
        }.bind(this);
        image.src = 'data:'+type.mime+';base64,' + base64Data;
      }.bind(this), callback);
    }.bind(this));
  }.bind(this);
  this.image.src = 'data:'+type.mime+';base64,' + base64Data;
};

CanvasTileCreator.prototype.getCompleteTile = function (format, callback) {
  callback(null, this.canvas.toDataURL());
};

module.exports = CanvasTileCreator;
