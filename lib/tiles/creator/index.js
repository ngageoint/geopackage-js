var proj4 = require('proj4')
  , async = require('async');

var TileBoundingBoxUtils = require('../tileBoundingBoxUtils');

module.exports.initialize = function(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, srs, projectionTo, canvas, callback) {
  var isPhantom = !!(typeof window != 'undefined' && window.callPhantom && window._phantom);
  var isNode = typeof(process) !== 'undefined' && process.version;
  if (isNode && !isPhantom) {
    var LwipTileCreator = require('./lwip');
    new LwipTileCreator(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, srs, projectionTo, callback);
  } else {
    var CanvasTileCreator = require('./canvas');
    new CanvasTileCreator(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, srs, projectionTo, canvas, callback);
  }
}

function TileCreator(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, srs, projectionTo, callback) {
  this.width = width;
  this.height = height;
  this.tileMatrix = tileMatrix;
  this.projectionFrom = srs.organization.toUpperCase() + ':' + srs.organization_coordsys_id;
  this.projectionFromDefinition = srs.definition;
  this.projectionTo = projectionTo.toUpperCase();
  this.tileBoundingBox = tileBoundingBox;
  this.tileMatrixSet = tileMatrixSet;
  this.chunks = [];

  this.tileHeightUnitsPerPixel = (tileBoundingBox.maxLatitude - tileBoundingBox.minLatitude) / height;
  this.tileWidthUnitsPerPixel = (tileBoundingBox.maxLongitude - tileBoundingBox.minLongitude) / width;

  // use this as a quick check if the projections are equal.  If they are we can shortcut some math
  // special cases 'EPSG:900913' =='EPSG:3857' == 'EPSG:102113'
  this.sameProjection = (this.projectionFrom === this.projectionTo) || (this.projectionTo === 'EPSG:3857' && (this.projectionFrom === 'EPSG:900913' || this.projectionFrom === 'EPSG:102113'));
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

  var position = TileBoundingBoxUtils.determinePositionAndScale(tilePieceBoundingBox, this.tileMatrix.tile_height, this.tileMatrix.tile_width, this.tileBoundingBox, this.height, this.width);

  if (position.xPositionInFinalTileStart >= this.width || position.xPositionInFinalTileEnd <= 0 || position.yPositionInFinalTileStart >= this.height || position.yPositionInFinalTileEnd <= 0) {
    // this tile doesn't belong just skip it
    callback();
  } else {
    this.addChunk(tileData, position);
    callback();
  }
};

TileCreator.prototype.addChunk = function (chunk, position) {
  this.chunks.push({
    chunk: chunk,
    position: position
  });
};

TileCreator.prototype.reproject = function (tileData, tilePieceBoundingBox, callback) {
  var y = 0;
  var x = 0;
  var height = this.height;
  var width = this.width;
  var proj4To = proj4(this.projectionTo);
  var proj4From;
  if (this.projectionFrom) {
    try {
      proj4From = proj4(this.projectionFrom);
    } catch (e) {}
  }
  if (!proj4From && this.projectionFromDefinition) {
    proj4From = proj4(this.projectionFromDefinition);
  }
  var conversion;
  try {
    conversion = proj4(this.projectionTo, this.projectionFrom);
  } catch (e) {}
  if (!conversion) {
    conversion = proj4(this.projectionTo, this.projectionFromDefinition);
  }

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
              var xPixel = this.tileMatrix.tile_width - Math.round((tilePieceBoundingBox.maxLongitude - projectedLongitude) / this.tileMatrix.pixel_x_size);
              var yPixel = Math.round((tilePieceBoundingBox.maxLatitude - projectedLatitude) / this.tileMatrix.pixel_y_size);
              if (xPixel >= 0 && xPixel < this.tileMatrix.tile_width
              && yPixel >= 0 && yPixel < this.tileMatrix.tile_height) {
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
