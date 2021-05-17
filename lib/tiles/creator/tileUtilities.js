let proj4 = require('proj4');
proj4 = 'default' in proj4 ? proj4['default'] : proj4;

export class TileUtilities {
  static getPiecePosition (
    tilePieceBoundingBox,
    tileBoundingBox,
    height,
    width,
    projectionTo,
    projectionFrom,
    projectionFromDefinition,
    tileHeightUnitsPerPixel,
    tileWidthUnitsPerPixel,
    pixelXSize,
    pixelYSize
  ) {
    let conversion;
    try {
      conversion = proj4(projectionTo, projectionFrom);
    } catch (e) {}
    if (!conversion) {
      conversion = proj4(projectionTo, projectionFromDefinition);
    }

    let maxLatitude = tilePieceBoundingBox.maxLatitude;
    let minLatitude = tilePieceBoundingBox.minLatitude;
    let minLongitude = tilePieceBoundingBox.minLongitude - pixelXSize;
    let maxLongitude = tilePieceBoundingBox.maxLongitude + pixelXSize;

    if (projectionTo.toUpperCase() === 'EPSG:3857' && projectionFrom.toUpperCase() === 'EPSG:4326') {
      maxLatitude = maxLatitude > 85.0511 ? 85.0511 : maxLatitude;
      minLatitude = minLatitude < -85.0511 ? -85.0511 : minLatitude;
      minLongitude = minLongitude < -180.0 ? -180.0 : minLongitude;
      maxLongitude = maxLongitude > 180.0 ? 180.0 : maxLongitude;
    }

    // ensure the projeced longitude wont wrap around the world
    const negative180 = proj4('EPSG:4326', projectionTo, [-180, 0]);
    const positive180 = proj4('EPSG:4326', projectionTo, [180, 0]);
    minLongitude = minLongitude < negative180[0] ? negative180[0] : minLongitude;
    maxLongitude = maxLongitude > positive180[0] ? positive180[0] : maxLongitude;

    const pieceBoundingBoxInTileProjectionSW = conversion.inverse([minLongitude, minLatitude]);
    const pieceBoundingBoxInTileProjectionNE = conversion.inverse([maxLongitude, maxLatitude]);

    const pieceBBProjected = {
      minLatitude: isNaN(pieceBoundingBoxInTileProjectionSW[1])
        ? tileBoundingBox.minLatitude
        : pieceBoundingBoxInTileProjectionSW[1],
      maxLatitude: isNaN(pieceBoundingBoxInTileProjectionNE[1])
        ? tileBoundingBox.maxLatitude
        : pieceBoundingBoxInTileProjectionNE[1],
      minLongitude: pieceBoundingBoxInTileProjectionSW[0],
      maxLongitude: pieceBoundingBoxInTileProjectionNE[0],
    };

    const startY = Math.max(
      0,
      Math.floor((tileBoundingBox.maxLatitude - pieceBBProjected.maxLatitude) / tileHeightUnitsPerPixel),
    );
    const startX = Math.max(
      0,
      Math.floor((pieceBBProjected.minLongitude - tileBoundingBox.minLongitude) / tileWidthUnitsPerPixel),
    );

    const endY = Math.min(
      height,
      height - Math.floor((pieceBBProjected.minLatitude - tileBoundingBox.minLatitude) / tileHeightUnitsPerPixel),
    );
    const endX = Math.min(
      width,
      width - Math.floor((tileBoundingBox.maxLongitude - pieceBBProjected.maxLongitude) / tileWidthUnitsPerPixel),
    );

    return {
      startY: startY,
      startX: startX,
      endY: endY,
      endX: endX,
    };
  }
}
