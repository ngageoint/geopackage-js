var proj4 = require('proj4')
  , async = require('async');

function tileWorker(e) {
  console.log('Tile Worker - working');
  console.time('tileWorker');
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

  var pieceBoundingBoxInTileProjectionSW = conversion.inverse([tilePieceBoundingBox.minLongitude-pixelXSize, tilePieceBoundingBox.minLatitude-pixelYSize]);
  var pieceBoundingBoxInTileProjectionNE = conversion.inverse([tilePieceBoundingBox.maxLongitude+pixelXSize, tilePieceBoundingBox.maxLatitude+pixelYSize]);
  var pieceBBProjected = {
    minLatitude: pieceBoundingBoxInTileProjectionSW[1],
    maxLatitude: pieceBoundingBoxInTileProjectionNE[1],
    minLongitude: pieceBoundingBoxInTileProjectionSW[0],
    maxLongitude: pieceBoundingBoxInTileProjectionNE[0]
  };
  var latitude;
  var yProjected;

  var startY = y = Math.max(0, Math.floor(-1*((pieceBBProjected.maxLatitude - tileBoundingBox.maxLatitude) / job.tileHeightUnitsPerPixel)));
  var endY = Math.ceil(-1*((pieceBBProjected.minLatitude - tileBoundingBox.minLatitude) / job.tileHeightUnitsPerPixel));
  var startX = x = Math.max(0, Math.floor((pieceBBProjected.minLongitude - tileBoundingBox.minLongitude) / job.tileWidthUnitsPerPixel));
  var endX = Math.ceil((pieceBBProjected.maxLongitude - tileBoundingBox.maxLongitude) / job.tileWidthUnitsPerPixel);
  var finalImageData = new Uint8ClampedArray((width - startX) * (height - startY) * 4);

  async.whilst(
    function() {
      if (y < height) {
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
            if(x < width && latitude >= pieceBBProjected.minLatitude && latitude <= pieceBBProjected.maxLatitude) {
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
                  finalImageData.set(imageData.slice(sliceStart, sliceStart + 4), ((y-startY)*(width-startX)*4) + ((x-startX)*4));
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
      postMessage({message:'done', imageData: finalImageData.buffer, offsetX: startX, offsetY: startY, endX: endX, endY: endY}, [finalImageData.buffer]);
      console.log('Tile Worker - done');
      console.timeEnd('tileWorker');
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
