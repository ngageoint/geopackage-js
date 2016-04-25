var fileType = require('file-type')
  , proj4 = require('proj4')
  , async = require('async')
  , PNG = require('pngjs').PNG;

var TileBoundingBoxUtils = require('../tileBoundingBoxUtils');

module.exports.initialize = function(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, projectionFrom, projectionTo, callback) {
  if (typeof(process) !== 'undefined' && process.version) {
    new LwipTileCreator(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, projectionFrom, projectionTo, callback);
  } else {
    new CanvasTileCreator(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, projectionFrom, projectionTo, callback);
  }
}

function CanvasTileCreator(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, projectionFrom, projectionTo, callback) {
  this.canvas = document.createElement('canvas');
  this.canvas.width  = width;
  this.canvas.height = height;
  this.ctx = this.canvas.getContext('2d');

  this.width = width;
  this.height = height;
  this.tileMatrix = tileMatrix;
  this.projectionFrom = projectionFrom;
  this.projectionTo = projectionTo;
  this.tileBoundingBox = tileBoundingBox;
  this.tileMatrixSet = tileMatrixSet;

  this.tileHeightUnitsPerPixel = (tileBoundingBox.maxLatitude - tileBoundingBox.minLatitude) / height;
  this.tileWidthUnitsPerPixel = (tileBoundingBox.maxLongitude - tileBoundingBox.minLongitude) / width;

  callback(null, this);
}

CanvasTileCreator.prototype.addTile = function (tileData, gridColumn, gridRow, callback) {
  // var tileCanvas = document.createElement('canvas');
  // var tileContext = this.canvas.getContext('2d');
  var bb = TileBoundingBoxUtils.getWebMercatorBoundingBox(this.tileMatrixSet.getBoundingBox(), this.tileMatrix, gridColumn, gridRow);

  var type = fileType(tileData);

  var png = new PNG();
  png.parse(tileData, function(err, data) {
    for (var y = 0; y < this.height; y++) {
      for (var x = 0; x < this.width; x++) {
        // get the pixel for the result image from the other image

        // get the location of the pixel in resultant projection
        var longitude = this.tileBoundingBox.minLongitude + (x*this.tileWidthUnitsPerPixel);
        var latitude = this.tileBoundingBox.maxLatitude - (y*this.tileHeightUnitsPerPixel);
        var projected = proj4(this.projectionTo, this.projectionFrom, [longitude, latitude]);
        var projectedLongitude = projected[0];
        var projectedLatitude = projected[1];


        var xPixel = this.tileMatrix.tileWidth - Math.round((bb.maxLongitude - projectedLongitude) / this.tileMatrix.pixelXSize);
        var yPixel = Math.round((bb.maxLatitude - projectedLatitude) / this.tileMatrix.pixelYSize);
        if (xPixel >= 0 && xPixel < this.tileMatrix.tileWidth
        && yPixel >= 0 && yPixel < this.tileMatrix.tileHeight) {
          var idx = (png.width * yPixel + xPixel) << 2;
          var imageData = [];
          imageData.push(idx);
          imageData.push(idx+1);
          imageData.push(idx+2);
          imageData.push(idx+3);
          console.log('put image data', imageData);
          console.log('x: ' + x + ' y: '+ y);
          // var color = tileContext.getImageData(xPixel, yPixel, 1, 1);
          this.ctx.putImageData(imageData, x, y);
          // pixels.push({
          //   x: x,
          //   y: y,
          //   color: tile.getPixel(xPixel, yPixel)
          // });
        }
      }
    }
    delete png;
    callback();
  }.bind(this));

  // var tileCanvas = document.createElement('canvas');
  // var tileContext = tileCanvas.getContext('2d');
  // tileCanvas.width = this.width;
  // tileCanvas.height = this.height;
  // tileContext.drawImage(tileData, 0, 0);
  // var base64Data = tileCanvas.toDataURL("image/png");

  // var binary = '';
  // var bytes = tileData;
  // var len = bytes.byteLength;
  // for (var i = 0; i < len; i++) {
  //     binary += String.fromCharCode( bytes[ i ] );
  // }
  // var base64Data = btoa( binary );
  // var image = document.createElement('img');
  // image.onload = function() {
  //   tileContext.drawImage(image, 0, 0);
  //   for (var y = 0; y < this.height; y++) {
  //     for (var x = 0; x < this.width; x++) {
  //       // get the pixel for the result image from the other image
  //
  //       // get the location of the pixel in resultant projection
  //       var longitude = this.tileBoundingBox.minLongitude + (x*this.tileWidthUnitsPerPixel);
  //       var latitude = this.tileBoundingBox.maxLatitude - (y*this.tileHeightUnitsPerPixel);
  //       var projected = proj4(this.projectionTo, this.projectionFrom, [longitude, latitude]);
  //       var projectedLongitude = projected[0];
  //       var projectedLatitude = projected[1];
  //
  //
  //       var xPixel = this.tileMatrix.tileWidth - Math.round((bb.maxLongitude - projectedLongitude) / this.tileMatrix.pixelXSize);
  //       var yPixel = Math.round((bb.maxLatitude - projectedLatitude) / this.tileMatrix.pixelYSize);
  //       if (xPixel >= 0 && xPixel < this.tileMatrix.tileWidth
  //       && yPixel >= 0 && yPixel < this.tileMatrix.tileHeight) {
  //         var color = tileContext.getImageData(xPixel, yPixel, 1, 1);
  //         this.ctx.putImageData(color, x, y);
  //         // pixels.push({
  //         //   x: x,
  //         //   y: y,
  //         //   color: tile.getPixel(xPixel, yPixel)
  //         // });
  //       }
  //     }
  //   }
  //   callback();
  // }.bind(this);
  // image.src = 'data:'+type.mime+';base64,' + base64Data;
};

CanvasTileCreator.prototype.getCompleteTile = function (format, projectionFrom, projectionTo, fullBoundingBox, cropBoundingBox, callback) {
  callback(null, this.canvas.toDataURL());
};

function LwipTileCreator(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, projectionFrom, projectionTo, callback) {
  this.lwip = require('lwip');
  this.width = width;
  this.height = height;
  this.tileMatrix = tileMatrix;
  this.projectionFrom = projectionFrom;
  this.projectionTo = projectionTo;
  this.tileBoundingBox = tileBoundingBox;
  this.tileMatrixSet = tileMatrixSet;

  this.tileHeightUnitsPerPixel = (tileBoundingBox.maxLatitude - tileBoundingBox.minLatitude) / height;
  this.tileWidthUnitsPerPixel = (tileBoundingBox.maxLongitude - tileBoundingBox.minLongitude) / width;

  this.lwip.create(this.width, this.height, function(err, image){
    this.image = image;
    callback(null, this);
  }.bind(this));
}

LwipTileCreator.prototype.addTile = function (tileData, gridColumn, gridRow, callback) {

  var bb = TileBoundingBoxUtils.getWebMercatorBoundingBox(this.tileMatrixSet.getBoundingBox(), this.tileMatrix, gridColumn, gridRow);
  var pixels = [];
  var type = fileType(tileData);
  this.lwip.open(tileData, type.ext, function(err, tile) {
    for (var y = 0; y < this.height; y++) {
      for (var x = 0; x < this.width; x++) {
        // get the pixel for the result image from the other image

        // get the location of the pixel in resultant projection
        var longitude = this.tileBoundingBox.minLongitude + (x*this.tileWidthUnitsPerPixel);
        var latitude = this.tileBoundingBox.maxLatitude - (y*this.tileHeightUnitsPerPixel);
        var projected = proj4(this.projectionTo, this.projectionFrom, [longitude, latitude]);
        var projectedLongitude = projected[0];
        var projectedLatitude = projected[1];


        var xPixel = this.tileMatrix.tileWidth - Math.round((bb.maxLongitude - projectedLongitude) / this.tileMatrix.pixelXSize);
        var yPixel = Math.round((bb.maxLatitude - projectedLatitude) / this.tileMatrix.pixelYSize);
        if (xPixel >= 0 && xPixel < this.tileMatrix.tileWidth
        && yPixel >= 0 && yPixel < this.tileMatrix.tileHeight) {
          pixels.push({
            x: x,
            y: y,
            color: tile.getPixel(xPixel, yPixel)
          });
        }
      }
    }

    async.eachSeries(pixels, function(pixel, pixelDone) {
      this.image.setPixel(pixel.x, pixel.y, pixel.color, pixelDone);
    }.bind(this), function(err) {
      callback(err, this.image);
    }.bind(this));
  }.bind(this));
};

LwipTileCreator.prototype.getCompleteTile = function (format, projectionFrom, projectionTo, fullBoundingBox, cropBoundingBox, callback) {
  this.image.writeFile('/tmp/lwip.png', function(err) {
    this.image.batch()
    .toBuffer(format, callback);

  }.bind(this));
};
