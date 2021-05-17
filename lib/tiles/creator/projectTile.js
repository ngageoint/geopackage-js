// @ts-nocheck
let proj4 = require('proj4');
proj4 = 'default' in proj4 ? proj4['default'] : proj4;

module.exports = function (job) {
  const tilePieceBoundingBox = JSON.parse(job.tilePieceBoundingBox);
  const tileBoundingBox = JSON.parse(job.tileBoundingBox);
  const height = job.height;
  const width = job.width;
  const imageData = new Uint8ClampedArray(width * height * 4);
  const sourceImageData = new Uint8ClampedArray(job.sourceImageData);
  let conversion;
  try {
    conversion = proj4(job.projectionTo, job.projectionFrom);
  } catch (e) {}
  if (!conversion) {
    conversion = proj4(job.projectionTo, job.projectionFromDefinition);
  }
  let latitude;
  for (let row = 0; row < height; row++) {
    latitude = tileBoundingBox._maxLatitude - row * job.tileHeightUnitsPerPixel;
    for (let column = 0; column < width; column++) {
      // loop over all pixels in the target tile
      // determine the position of the current pixel in the target tile
      const longitude = tileBoundingBox._minLongitude + column * job.tileWidthUnitsPerPixel;
      // project that lat/lng to the source coordinate system
      const projected = conversion.forward([longitude, latitude]);
      const projectedLongitude = projected[0];
      const projectedLatitude = projected[1];
      // now find the source pixel
      const xPixel =
        job.tile_width - Math.round((tilePieceBoundingBox._maxLongitude - projectedLongitude) / job.pixel_x_size);
      const yPixel = Math.round((tilePieceBoundingBox._maxLatitude - projectedLatitude) / job.pixel_y_size);
      if (xPixel >= 0 && xPixel < job.tile_width && yPixel >= 0 && yPixel < job.tile_height) {
        const sliceStart = yPixel * job.tile_width * 4 + xPixel * 4;
        const color = sourceImageData.slice(sliceStart, sliceStart + 4);
        imageData.set(color, row * width * 4 + column * 4);
      }
    }
  }
  return imageData.buffer;
};
