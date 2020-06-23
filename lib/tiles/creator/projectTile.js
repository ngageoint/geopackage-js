// @ts-nocheck
let proj4 = require('proj4');

proj4 = 'default' in proj4 ? proj4['default'] : proj4;

const TileUtilities = require('./tileUtilities');
const proj4Defs = require('../../proj4Defs');

module.exports = function(job, callback) {
  console.log('Tile Worker - working');
  console.time('Tile Worker - time');

  if (proj4Defs[job.projectionTo]) {
    proj4.defs(job.projectionTo, proj4Defs[job.projectionTo]);
  }
  if (proj4Defs[job.projectionFrom]) {
    proj4.defs(job.projectionFrom, proj4Defs[job.projectionFrom]);
  }
  const proj4To = proj4(job.projectionTo);
  const proj4From = proj4(job.projectionFrom);

  let conversion;
  try {
    conversion = proj4(job.projectionTo, job.projectionFrom);
  } catch (e) {}
  if (!conversion) {
    conversion = proj4(job.projectionTo, job.projectionFromDefinition);
  }

  const tileBoundingBox = JSON.parse(job.tileBoundingBox);
  const tilePieceBoundingBox = JSON.parse(job.tilePieceBoundingBox);

  const piecePosition = TileUtilities.getPiecePosition(
    tilePieceBoundingBox,
    tileBoundingBox,
    job.height,
    job.width,
    job.projectionTo,
    job.projectionFrom,
    job.projectionFromDefinition,
    job.tileHeightUnitsPerPixel,
    job.tileWidthUnitsPerPixel,
    job.pixelXSize,
    job.pixelYSize,
  );
  const x = piecePosition.startX;
  const y = piecePosition.startY;

  const finalWidth = piecePosition.endX - piecePosition.startX;
  const finalHeight = piecePosition.endY - piecePosition.startY;
  if (finalWidth <= 0 || finalHeight <= 0) {
    console.timeEnd('Tile Worker - time');
    if (callback) {
      return callback(null, { message: 'donenodata' });
    } else {
      postMessage({ message: 'donenodata' });
      return this.close();
    }
  }

  const imageData = new Uint8ClampedArray(job.imageData);

  const finalImageData = new Uint8ClampedArray(finalWidth * finalHeight * 4);
  let latitude;

  const yArray = [];
  for (const i = y; i < piecePosition.endY; i++) {
    yArray.push(i);
  }

  const xArray = [];
  for (const i = x; i < piecePosition.endX; i++) {
    xArray.push(i);
  }

  return yArray
    .reduce(function(ySequence, y) {
      return ySequence.then(function() {
        latitude = tileBoundingBox.maxLatitude - y * job.tileHeightUnitsPerPixel;
        const currentXArray = xArray.slice();
        return currentXArray.reduce(function(xSequence, x) {
          return xSequence.then(function() {
            const longitude = tileBoundingBox.minLongitude + x * job.tileWidthUnitsPerPixel;
            const projected = conversion.forward([longitude, latitude]);
            const projectedLongitude = projected[0];
            const projectedLatitude = projected[1];

            const xPixel =
              job.tileWidth - Math.round((tilePieceBoundingBox.maxLongitude - projectedLongitude) / job.pixelXSize);
            const yPixel = Math.round((tilePieceBoundingBox.maxLatitude - projectedLatitude) / job.pixelYSize);
            if (xPixel >= 0 && xPixel < job.tileWidth && yPixel >= 0 && yPixel < job.tileHeight) {
              const sliceStart = yPixel * job.tileWidth * 4 + xPixel * 4;
              if (sliceStart >= 0) {
                finalImageData.set(
                  imageData.slice(sliceStart, sliceStart + 4),
                  (y - piecePosition.startY) * finalWidth * 4 + (x - piecePosition.startX) * 4,
                );
              }
            }
          });
        }, Promise.resolve());
      });
    }, Promise.resolve())
    .then(function() {
      console.timeEnd('Tile Worker - time');
      if (callback) {
        callback(
          null,
          { message: 'done', imageData: finalImageData.buffer, finalWidth: finalWidth, finalHeight: finalHeight },
          [finalImageData.buffer],
        );
      } else {
        postMessage(
          { message: 'done', imageData: finalImageData.buffer, finalWidth: finalWidth, finalHeight: finalHeight },
          [finalImageData.buffer],
        );
        this.close();
      }
    });
};
