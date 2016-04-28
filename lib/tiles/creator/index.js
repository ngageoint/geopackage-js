var fileType = require('file-type')
  , proj4 = require('proj4')
  , async = require('async')
  , util = require('util');

var TileBoundingBoxUtils = require('../tileBoundingBoxUtils');

module.exports.initialize = function(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, projectionFrom, projectionTo, callback) {
  if (typeof(process) !== 'undefined' && process.version) {
    new LwipTileCreator(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, projectionFrom, projectionTo, callback);
  } else {
    new CanvasTileCreator(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, projectionFrom, projectionTo, callback);
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

  this.tileHeightUnitsPerPixel = (tileBoundingBox.maxLatitude - tileBoundingBox.minLatitude) / height;
  this.tileWidthUnitsPerPixel = (tileBoundingBox.maxLongitude - tileBoundingBox.minLongitude) / width;

  // use this as a quick check if the projections are equal.  If they are we can shortcut some math
  this.sameProjection = projectionFrom.oProj.title === projectionTo.oProj.title;
}

function CanvasTileCreator(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, projectionFrom, projectionTo, callback) {
  TileCreator.apply(this, arguments);

  this.canvas = document.createElement('canvas');
  this.canvas.width  = width;
  this.canvas.height = height;
  this.ctx = this.canvas.getContext('2d');

  this.image = document.createElement('img');

  this.tileCanvas = document.createElement('canvas');
  this.tileContext = this.tileCanvas.getContext('2d');
  this.tileCanvas.width = tileMatrix.tileWidth;
  this.tileCanvas.height = tileMatrix.tileHeight;

  callback(null, this);
}

util.inherits(CanvasTileCreator, TileCreator);

TileCreator.prototype.projectTile = function(gridColumn, gridRow, callback) {
  var bb = TileBoundingBoxUtils.getWebMercatorBoundingBox(this.tileMatrixSet.getBoundingBox(), this.tileMatrix, gridColumn, gridRow);
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

              var xPixel = this.tileMatrix.tileWidth - Math.round((bb.maxLongitude - projectedLongitude) / this.tileMatrix.pixelXSize);
              var yPixel = Math.round((bb.maxLatitude - projectedLatitude) / this.tileMatrix.pixelYSize);
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
}

CanvasTileCreator.prototype.addPixel = function (targetX, targetY, sourceX, sourceY) {
  var color = this.tileContext.getImageData(sourceX, sourceY, 1, 1);
  this.ctx.putImageData(color, targetX, targetY);
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
    this.projectTile(gridColumn, gridRow, callback);
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

LwipTileCreator.prototype.addTile = function (tileData, gridColumn, gridRow, callback) {
  var type = fileType(tileData);
  this.lwip.open(tileData, type.ext, function(err, tile) {
    this.tile = tile;
    this.projectTile(gridColumn, gridRow, function() {
      async.eachSeries(this.pixels, function(pixel, pixelDone) {
        this.image.setPixel(pixel.x, pixel.y, pixel.color, pixelDone);
      }.bind(this), function(err) {
        callback(err, this.image);
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
