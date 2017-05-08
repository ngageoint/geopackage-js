var util = require('util')
  , async = require('async')
  , fileType = require('file-type')
  , work = require('webworkify');

var TileCreator = require('./index').TileCreator
  , TileBoundingBoxUtils = require('../tileBoundingBoxUtils')
  , TileUtilities = require('./tileUtilities')
  , ProjectTile = require('./projectTile.js');

function CanvasTileCreator(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, srs, projectionTo, canvas, callback) {
  TileCreator.apply(this, arguments);
  this.canvas = canvas || document.createElement('canvas');
  this.canvas.width  = width;
  this.canvas.height = height;
  this.ctx = this.canvas.getContext('2d');

  this.image = document.createElement('img');

  this.tileCanvas = document.createElement('canvas');
  this.tileContext = this.tileCanvas.getContext('2d');
  this.tileCanvas.width = tileMatrix.tile_width;
  this.tileCanvas.height = tileMatrix.tile_height;

  this.imageData = new Uint8ClampedArray(width * height * 4);

  callback(null, this);
}

util.inherits(CanvasTileCreator, TileCreator);

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
    async.setImmediate(function() {
      this.tileContext.drawImage(this.image, 0, 0);
      this.projectTile(tileData, gridColumn, gridRow, function(err, imageData) {
        async.eachSeries(this.chunks, function(chunk, chunkDone) {
          async.setImmediate(function() {
            var type = fileType(tileData);

            var binary = '';
            var bytes = chunk.chunk;
            var len = bytes.byteLength;
            for (var i = 0; i < len; i++) {
              binary += String.fromCharCode( bytes[ i ] );
            }

            var base64DataChunk = btoa( binary );
            var image = document.createElement('img');
            image.onload = function() {
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
            }.bind(this);
            image.src = 'data:'+type.mime+';base64,' + base64DataChunk;
          }.bind(this));
        }.bind(this), callback);
      }.bind(this));
    }.bind(this));
  }.bind(this);
  this.image.src = 'data:'+type.mime+';base64,' + base64Data;
};

CanvasTileCreator.prototype.getCompleteTile = function (format, callback) {
  callback(null, this.canvas.toDataURL());
};

CanvasTileCreator.prototype.reproject = function (tileData, tilePieceBoundingBox, callback) {
  var ctx = this.ctx;
  var width = this.width;
  var height = this.height;
  var cb = callback;

  var piecePosition = TileUtilities.getPiecePosition(tilePieceBoundingBox, this.tileBoundingBox, this.height, this.width, this.projectionTo, this.projectionFrom, this.projectionFromDefinition, this.tileHeightUnitsPerPixel, this.tileWidthUnitsPerPixel, this.tileMatrix.pixel_x_size, this.tileMatrix.pixel_y_size);

  var job = {
    tileBoundingBox: JSON.stringify(this.tileBoundingBox),
    tileWidthUnitsPerPixel: this.tileWidthUnitsPerPixel,
    tileHeightUnitsPerPixel: this.tileHeightUnitsPerPixel,
    projectionTo: this.projectionTo,
    projectionFrom: this.projectionFrom,
    projectionFromDefinition: this.projectionFromDefinition,
    tileWidth: this.tileMatrix.tile_width,
    tileHeight: this.tileMatrix.tile_height,
    pixelYSize: this.tileMatrix.pixel_y_size,
    pixelXSize: this.tileMatrix.pixel_x_size,
    height: this.height,
    width: this.width,
    tilePieceBoundingBox: JSON.stringify(tilePieceBoundingBox),
    imageData: this.tileContext.getImageData(0, 0, this.tileMatrix.tile_width, this.tileMatrix.tile_height).data.buffer
  };

  try {
    var worker = work(require('./tileWorker.js'));

    worker.onmessage = function(e) {
      workerDone(e.data, piecePosition, ctx, cb);
    };

    worker.postMessage(job, [this.tileContext.getImageData(0, 0, this.tileMatrix.tile_width, this.tileMatrix.tile_height).data.buffer]);

  } catch (e) {
    worker = ProjectTile;
    worker(job, function(err, data) {
      workerDone(data, piecePosition, ctx, cb);
    });
  }
};

function workerDone(data, piecePosition, ctx, cb) {
  if (data.message === 'done') {
    var imageData = new Uint8ClampedArray(data.imageData);
    var offsetX = piecePosition.startX;
    var offsetY = piecePosition.startY;
    var finalWidth = data.finalWidth;
    var finalHeight = data.finalHeight;

    var tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = finalWidth;
    tmpCanvas.height = finalHeight;
    tmpCanvas.getContext('2d').putImageData(new ImageData(imageData, finalWidth, finalHeight), 0, 0);

    ctx.drawImage(tmpCanvas, offsetX, offsetY);
    cb();
  } else if (data.message === 'donenodata') {
    cb();
  }
}


module.exports = CanvasTileCreator;
