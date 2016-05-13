var proj4 = require('proj4')
  , async = require('async');

var TileBoundingBoxUtils = require('../tileBoundingBoxUtils');

module.exports.initialize = function(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, projectionFrom, projectionTo, canvas, callback) {
  if (typeof(process) !== 'undefined' && process.version) {
    var LwipTileCreator = require('./lwip');
    new LwipTileCreator(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, projectionFrom, projectionTo, callback);
  } else {
    var CanvasTileCreator = require('./canvas');
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
  this.sameProjection = projectionFrom.toUpperCase() === projectionTo.toUpperCase();
}

module.exports.TileCreator = TileCreator;

TileCreator.prototype.projectTile = function(tileData, gridColumn, gridRow, callback) {
  var bb = TileBoundingBoxUtils.getTileBoundingBox(this.tileMatrixSet.getBoundingBox(), this.tileMatrix, gridColumn, gridRow);

  if (!this.sameProjection) {
    this.reproject(tileData, bb, callback);
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

TileCreator.prototype.reproject = function (tileData, tilePieceBoundingBox, callback) {
  var y = 0;
  var x = 0;
  var height = this.height;
  var width = this.width;
  var proj4To = proj4(this.projectionTo);
  var proj4From = proj4(this.projectionFrom);
  var conversion = proj4(this.projectionTo, this.projectionFrom);
  var latitude;
  async.whilst(
    function() {
      latitude = this.tileBoundingBox.maxLatitude - (y*this.tileHeightUnitsPerPixel);
      return y < height;
    }.bind(this),
    function(yDone) {
      async.setImmediate(function () {
        async.whilst(
          function() {
            return x < width;
          },
          function(xDone) {
            async.setImmediate(function () {
              var longitude = this.tileBoundingBox.minLongitude + (x*this.tileWidthUnitsPerPixel);
              var projected = conversion.forward([longitude, latitude]);
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
