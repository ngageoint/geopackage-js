var proj4 = require('proj4')
  , async = require('async');

function tileWorker(e) {
  console.log('Tile Worker - working');
  console.time('Tile Worker - time');
  var self = this;
  var job = e.data;

  var height = job.height;
  var width = job.width;
  var proj4To = proj4(job.projectionTo);
  var proj4From = proj4(job.projectionFrom);
  var conversion = proj4(job.projectionTo, job.projectionFrom);
  var tileBoundingBox = JSON.parse(job.tileBoundingBox);
  var tileHeight = job.tileHeight;
  var tileWidth = job.tileWidth;
  var pixelYSize = job.pixelYSize;
  var pixelXSize = job.pixelXSize;
  var imageData = new Uint8ClampedArray(job.imageData);
  var tilePieceBoundingBox = JSON.parse(job.tilePieceBoundingBox);

  var maxLatitude;
  var minLatitude;

  if (job.projectionTo.toUpperCase() === 'EPSG:3857' && job.projectionFrom.toUpperCase() === 'EPSG:4326') {
    maxLatitude = tilePieceBoundingBox.maxLatitude > 85.0511 ? 85.0511 : tilePieceBoundingBox.maxLatitude;
    minLatitude = tilePieceBoundingBox.minLatitude < -85.0511 ? -85.0511 : tilePieceBoundingBox.minLatitude;
    minLongitude = tilePieceBoundingBox.minLongitude - pixelXSize < -180.0 ? -180.0 : tilePieceBoundingBox.minLongitude - pixelXSize;
    maxLongitude = tilePieceBoundingBox.maxLongitude + pixelXSize > 180.0 ? 180.0 : tilePieceBoundingBox.maxLongitude + pixelXSize;
  }
  var pieceBoundingBoxInTileProjectionSW = conversion.inverse([minLongitude, minLatitude]);
  var pieceBoundingBoxInTileProjectionNE = conversion.inverse([maxLongitude, maxLatitude]);
  var pieceBBProjected = {
    minLatitude: isNaN(pieceBoundingBoxInTileProjectionSW[1]) ? tileBoundingBox.minLatitude : pieceBoundingBoxInTileProjectionSW[1],
    maxLatitude: isNaN(pieceBoundingBoxInTileProjectionNE[1]) ? tileBoundingBox.maxLatitude : pieceBoundingBoxInTileProjectionNE[1],
    minLongitude: pieceBoundingBoxInTileProjectionSW[0],
    maxLongitude: pieceBoundingBoxInTileProjectionNE[0]
  };
  var latitude;
  var yProjected;

  var startY = y = Math.max(0, Math.floor((tileBoundingBox.maxLatitude - pieceBBProjected.maxLatitude) / job.tileHeightUnitsPerPixel));
  var startX = x = Math.max(0, Math.floor((pieceBBProjected.minLongitude - tileBoundingBox.minLongitude) / job.tileWidthUnitsPerPixel));

  var endY = Math.min(height, height - Math.floor((pieceBBProjected.minLatitude - tileBoundingBox.minLatitude) / job.tileHeightUnitsPerPixel));
  var endX = Math.min(width, width - Math.floor((tileBoundingBox.maxLongitude - pieceBBProjected.maxLongitude) / job.tileWidthUnitsPerPixel));

  var finalWidth = (endX - startX);
  var finalHeight = (endY - startY);
  if (finalWidth <= 0 || finalHeight <= 0) {
    postMessage({message:'donenodata'});
    console.timeEnd('Tile Worker - time');
    return self.close();
  }

  var finalImageData = new Uint8ClampedArray(finalWidth * finalHeight * 4);

  async.whilst(
    function() {
      if (y < endY) {
        latitude = tileBoundingBox.maxLatitude - (y*job.tileHeightUnitsPerPixel);
        return true;
      }
      return false;
    },
    function(yDone) {
      x = startX;
      var longitude;
      async.setImmediate(function () {
        async.whilst(
          function() {
            if(x < endX) {
              longitude = tileBoundingBox.minLongitude + (x*job.tileWidthUnitsPerPixel);
              return true;
            }
            return false;
          },
          function(xDone) {
            async.setImmediate(function () {
              if (longitude > pieceBBProjected.maxLongitude || longitude < pieceBBProjected.minLongitude) {
                x++;
                return xDone();
              }
              var projected = conversion.forward([longitude, latitude]);
              var projectedLongitude = projected[0];
              var projectedLatitude = projected[1];

              var xPixel = tileWidth - Math.round((tilePieceBoundingBox.maxLongitude - projectedLongitude) / pixelXSize);
              var yPixel = Math.round((tilePieceBoundingBox.maxLatitude - projectedLatitude) / pixelYSize);
              if (xPixel >= 0 && xPixel < tileWidth
              && yPixel >= 0 && yPixel < tileHeight) {
                var sliceStart = (yPixel * tileWidth * 4) + (xPixel * 4);
                if (sliceStart >= 0) {
                  finalImageData.set(imageData.slice(sliceStart, sliceStart + 4), ((y-startY)*finalWidth*4) + ((x-startX)*4));
                }
              }
              x++;
              xDone();
            });
          },
          function() {
            y++;
            yDone();
          }
        );
      });
    },
    function() {
      postMessage({message:'done', imageData: finalImageData.buffer, offsetX: startX, offsetY: startY, finalWidth: finalWidth, finalHeight: finalHeight}, [finalImageData.buffer]);
      console.timeEnd('Tile Worker - time');
      self.close();
    }
  );
}

module.exports = function(self) {
  self.onmessage = tileWorker;
  self.onerror = function(e) {
    console.log('error', e);
  }
};
