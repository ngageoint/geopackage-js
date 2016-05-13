var proj4 = require('proj4')
  , async = require('async');

function tileWorker(e) {
  var self = this;
  var job = e.data;
  var y = 0;
  var x = 0;
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

  var finalImageData = new Uint8ClampedArray(width * height * 4);

  var tilePieceBoundingBox = JSON.parse(job.tilePieceBoundingBox);
  var latitude;
  async.whilst(
    function() {
      latitude = tileBoundingBox.maxLatitude - (y*job.tileHeightUnitsPerPixel);
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
              var longitude = tileBoundingBox.minLongitude + (x*job.tileWidthUnitsPerPixel);
              var projected = conversion.forward([longitude, latitude]);
              var projectedLongitude = projected[0];
              var projectedLatitude = projected[1];

              var xPixel = tileWidth - Math.round((tilePieceBoundingBox.maxLongitude - projectedLongitude) / pixelXSize);
              var yPixel = Math.round((tilePieceBoundingBox.maxLatitude - projectedLatitude) / pixelYSize);
              if (xPixel >= 0 && xPixel < tileWidth
              && yPixel >= 0 && yPixel < tileHeight) {
                var sliceStart = (yPixel * tileWidth * 4) + (xPixel * 4);
                finalImageData.set(imageData.slice(sliceStart, sliceStart + 4), (y*width*4) + (x*4));
              }
              x++;
              xDone();
            });
          },
          function() {
            x = 0;
            y++;
            yDone();
          }
        );
      });
    },
    function() {
      postMessage({message:'done', imageData: finalImageData.buffer}, [finalImageData.buffer]);
      self.close();
      // callback();
    }
  );
}

module.exports = function(self) {
  self.onmessage = tileWorker;
  self.onerror = function(e) {
    console.log('error', e);
  }
};
