var fileType = require('file-type')
  , proj4 = require('proj4')
  , async = require('async')
  , util = require('util');

var TileBoundingBoxUtils = require('../tileBoundingBoxUtils');

module.exports.initialize = function(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, projectionFrom, projectionTo, canvas, callback) {
  if (typeof(process) !== 'undefined' && process.version) {
    new LwipTileCreator(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, projectionFrom, projectionTo, callback);
  } else {
    new CanvasTileCreator(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, projectionFrom, projectionTo, canvas, callback);
  }
}

function TileCreator(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, projectionFrom, projectionTo, callback) {
  this.width = width;
  this.height = height;
  this.tileMatrix = tileMatrix;
  this.projectionFrom = projectionFrom;
  this.projectionTo = projectionTo;
  this.tileBoundingBox = tileBoundingBox;
  this.tileMatrixSet = tileMatrixSet;
  this.chunks = [];

  this.tileHeightUnitsPerPixel = (tileBoundingBox.maxLatitude - tileBoundingBox.minLatitude) / height;
  this.tileWidthUnitsPerPixel = (tileBoundingBox.maxLongitude - tileBoundingBox.minLongitude) / width;

  // use this as a quick check if the projections are equal.  If they are we can shortcut some math
  this.sameProjection = projectionFrom.oProj.title === projectionTo.oProj.title;
}

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

TileCreator.prototype.projectTile = function(tileData, gridColumn, gridRow, callback) {
  var bb = TileBoundingBoxUtils.getTileBoundingBox(this.tileMatrixSet.getBoundingBox(), this.tileMatrix, gridColumn, gridRow);

  if (!this.sameProjection) {
    this.reproject(bb, callback);
  } else {
    this.cutAndScale(tileData, bb, callback);
  }
}

TileCreator.prototype.cutAndScale = function (tileData, tilePieceBoundingBox, callback) {

  var xOffset = Math.round(TileBoundingBoxUtils.getXPixelOffset(this.width || tileWidth, tilePieceBoundingBox, this.tileBoundingBox.minLongitude));
  var yOffset = Math.round(TileBoundingBoxUtils.getYPixelOffset(this.height || tileHeight, tilePieceBoundingBox, this.tileBoundingBox.maxLatitude));

  if (xOffset <= -(this.height || tileHeight) || xOffset >= (this.height || tileHeight) || yOffset <= -(this.width || tileWidth) || yOffset >= (this.width || tileWidth)) {
    // this tile doesn't belong just skip it
    callback();
  } else {
    this.addChunk(tileData, xOffset, yOffset);
    callback();
  }
};

TileCreator.prototype.reproject = function (tilePieceBoundingBox, callback) {
  var y = 0;
  var x = 0;
  var height = this.height;
  var width = this.width;
  async.whilst(
    function() {
      return y < height;
    },
    function(yDone) {
      async.setImmediate(function () {
        async.whilst(
          function() {
            return x < width;
          },
          function(xDone) {
            async.setImmediate(function () {
              var longitude = this.tileBoundingBox.minLongitude + (x*this.tileWidthUnitsPerPixel);
              var latitude = this.tileBoundingBox.maxLatitude - (y*this.tileHeightUnitsPerPixel);
              var projected = proj4(this.projectionTo, this.projectionFrom, [longitude, latitude]);
              var projectedLongitude = projected[0];
              var projectedLatitude = projected[1];

              var xPixel = this.tileMatrix.tileWidth - Math.round((tilePieceBoundingBox.maxLongitude - projectedLongitude) / this.tileMatrix.pixelXSize);
              var yPixel = Math.round((tilePieceBoundingBox.maxLatitude - projectedLatitude) / this.tileMatrix.pixelYSize);
              if (xPixel >= 0 && xPixel < this.tileMatrix.tileWidth
              && yPixel >= 0 && yPixel < this.tileMatrix.tileHeight) {
                this.addPixel(x, y, xPixel, yPixel);
              }
              x++;
              xDone();
            }.bind(this));
          }.bind(this),
          function() {
            x = 0;
            y++;
            yDone();
          }
        );
      }.bind(this));
    }.bind(this),
    function() {
      callback();
    }
  );
};

CanvasTileCreator.prototype.addChunk = function (chunk, xOffset, yOffset) {
  console.log('chunk', xOffset,yOffset);
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
  var bb = TileBoundingBoxUtils.getWebMercatorBoundingBox(this.tileMatrixSet.getBoundingBox(), this.tileMatrix, gridColumn, gridRow);

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
      console.log('chunks', this.chunks.length);
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

function LwipTileCreator(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, projectionFrom, projectionTo, callback) {
  TileCreator.apply(this, arguments);

  this.lwip = require('lwip');
  this.pixels = [];
  this.lwip.create(this.width, this.height, function(err, image){
    this.image = image;
    callback(null, this);
  }.bind(this));
}

util.inherits(LwipTileCreator, TileCreator);

LwipTileCreator.prototype.addPixel = function (targetX, targetY, sourceX, sourceY) {
  this.pixels.push({
    x: targetX,
    y: targetY,
    color: this.tile.getPixel(sourceX, sourceY)
  });
};

LwipTileCreator.prototype.addChunk = function (chunk, xOffset, yOffset) {
  this.chunks.push({
    chunk: chunk,
    x: xOffset,
    y: yOffset
  });
};

LwipTileCreator.prototype.addTile = function (tileData, gridColumn, gridRow, callback) {
  var type = fileType(tileData);
  this.lwip.open(tileData, type.ext, function(err, tile) {
    this.tile = tile;
    this.projectTile(tileData, gridColumn, gridRow, function() {
      async.eachSeries(this.pixels, function(pixel, pixelDone) {
        this.image.setPixel(pixel.x, pixel.y, pixel.color, pixelDone);
      }.bind(this), function(err) {
        async.eachSeries(this.chunks, function(chunk, chunkDone) {
          var type = fileType(chunk.chunk);
          this.lwip.open(chunk.chunk, type.ext, function(err, tile) {
            tile.crop(Math.abs(Math.min(0, chunk.x)), Math.abs(Math.min(0, chunk.y)), Math.min(this.tileMatrix.tileWidth-1, this.tileMatrix.tileWidth - chunk.x), Math.min(this.tileMatrix.tileHeight-1, this.tileMatrix.tileHeight - chunk.y), function(err, tile) {
              this.image.paste(Math.max(0, chunk.x), Math.max(0, chunk.y), tile, chunkDone);
            }.bind(this));
          }.bind(this));
        }.bind(this), function(err) {
          callback(err, this.image);
        });
      }.bind(this));
    }.bind(this));
  }.bind(this));
};

LwipTileCreator.prototype.getCompleteTile = function (format, callback) {
  this.image.writeFile('/tmp/lwip.png', function(err) {
    this.image.batch()
    .toBuffer(format, callback);

  }.bind(this));
};
