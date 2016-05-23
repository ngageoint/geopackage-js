var util = require('util')
  , async = require('async')
  , fileType = require('file-type');

var TileCreator = require('./index').TileCreator;

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
            tile.crop(Math.abs(Math.min(0, chunk.x)), Math.abs(Math.min(0, chunk.y)), Math.min(this.tileMatrix.tile_width-1, this.tileMatrix.tile_width - chunk.x), Math.min(this.tileMatrix.tile_height-1, this.tileMatrix.tile_height - chunk.y), function(err, tile) {
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

module.exports = LwipTileCreator;
