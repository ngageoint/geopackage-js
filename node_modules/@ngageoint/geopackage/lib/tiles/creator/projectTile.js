// @ts-nocheck
var proj4 = require('proj4');

proj4 = 'default' in proj4 ? proj4['default'] : proj4;

var TileUtilities = require('./tileUtilities')
  , proj4Defs = require('../../proj4Defs');

module.exports = function(job, callback) {
  console.log('Tile Worker - working');
  console.time('Tile Worker - time');
  var self = this;

  if (proj4Defs[job.projectionTo]) {
    proj4.defs(job.projectionTo, proj4Defs[job.projectionTo]);
  }
  if (proj4Defs[job.projectionFrom]) {
    proj4.defs(job.projectionFrom, proj4Defs[job.projectionFrom]);
  }
  var proj4To = proj4(job.projectionTo);
  var proj4From = proj4(job.projectionFrom);

  var conversion;
  try {
    conversion = proj4(job.projectionTo, job.projectionFrom);
  } catch (e) {}
  if (!conversion) {
    conversion = proj4(job.projectionTo, job.projectionFromDefinition);
  }

  var tileBoundingBox = JSON.parse(job.tileBoundingBox);
  var tilePieceBoundingBox = JSON.parse(job.tilePieceBoundingBox);

  var piecePosition = TileUtilities.getPiecePosition(tilePieceBoundingBox, tileBoundingBox, job.height, job.width, job.projectionTo, job.projectionFrom, job.projectionFromDefinition, job.tileHeightUnitsPerPixel, job.tileWidthUnitsPerPixel, job.pixelXSize, job.pixelYSize);
  var x = piecePosition.startX;
  var y = piecePosition.startY;

  var finalWidth = (piecePosition.endX - piecePosition.startX);
  var finalHeight = (piecePosition.endY - piecePosition.startY);
  if (finalWidth <= 0 || finalHeight <= 0) {
    console.timeEnd('Tile Worker - time');
    if (callback) {
      return callback(null, {message:'donenodata'});
    } else {
      postMessage({message:'donenodata'});
      return self.close();
    }
  }

  var imageData = new Uint8ClampedArray(job.imageData);

  var finalImageData = new Uint8ClampedArray(finalWidth * finalHeight * 4);
  var latitude;

  var yArray = [];
  for (var i = y; i < piecePosition.endY; i++) {
    yArray.push(i);
  }

  var xArray = [];
  for (var i = x; i < piecePosition.endX; i++) {
    xArray.push(i);
  }

  return yArray.reduce(function(ySequence, y) {
    return ySequence.then(function() {
      latitude = tileBoundingBox.maxLatitude - (y * job.tileHeightUnitsPerPixel);
      var currentXArray = xArray.slice();
      return currentXArray.reduce(function(xSequence, x) {
        return xSequence.then(function() {
          var longitude = tileBoundingBox.minLongitude + (x * job.tileWidthUnitsPerPixel);
          var projected = conversion.forward([longitude, latitude]);
          var projectedLongitude = projected[0];
          var projectedLatitude = projected[1];

          var xPixel = job.tileWidth - Math.round((tilePieceBoundingBox.maxLongitude - projectedLongitude) / job.pixelXSize);
          var yPixel = Math.round((tilePieceBoundingBox.maxLatitude - projectedLatitude) / job.pixelYSize);
          if (xPixel >= 0 && xPixel < job.tileWidth
          && yPixel >= 0 && yPixel < job.tileHeight) {
            var sliceStart = (yPixel * job.tileWidth * 4) + (xPixel * 4);
            if (sliceStart >= 0) {
              finalImageData.set(imageData.slice(sliceStart, sliceStart + 4), ((y-piecePosition.startY)*finalWidth*4) + ((x-piecePosition.startX)*4));
            }
          }
        });
      }, Promise.resolve());
    });
  }, Promise.resolve())
    .then(function() {
      console.timeEnd('Tile Worker - time');
      if (callback) {
        callback(null, {message:'done', imageData: finalImageData.buffer, finalWidth: finalWidth, finalHeight: finalHeight}, [finalImageData.buffer]);
      } else {
        postMessage({message:'done', imageData: finalImageData.buffer, finalWidth: finalWidth, finalHeight: finalHeight}, [finalImageData.buffer]);
        self.close();
      }
    });
};
