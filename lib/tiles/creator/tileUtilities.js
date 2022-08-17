import { ProjectionConstants } from '../../projection/projectionConstants';
import { Projection } from '../../projection/projection';

export class TileUtilities {
  static getPiecePosition (
    tilePieceBoundingBox,
    tileBoundingBox,
    height,
    width,
    projectionTo,
    projectionToDefinition,
    projectionFrom,
    projectionFromDefinition,
    tileHeightUnitsPerPixel,
    tileWidthUnitsPerPixel,
    pixelXSize,
    pixelYSize
  ) {
    let conversion;
    try {
      if (Projection.hasProjection(projectionTo) == null) {
        Projection.loadProjection(projectionTo, projectionToDefinition)
      }
      if (Projection.hasProjection(projectionFrom) == null) {
        Projection.loadProjection(projectionFrom, projectionFromDefinition)
      }
      conversion = Projection.getConverter(projectionTo, projectionFrom);
    } catch (e) {
      throw new Error('Error creating projection conversion between ' + projectionTo + ' and ' + projectionFrom + '.');
    }

    let maxLatitude = tilePieceBoundingBox.maxLatitude;
    let minLatitude = tilePieceBoundingBox.minLatitude;
    let minLongitude = tilePieceBoundingBox.minLongitude - pixelXSize;
    let maxLongitude = tilePieceBoundingBox.maxLongitude + pixelXSize;

    if (projectionTo.toUpperCase() === ProjectionConstants.EPSG_WEB_MERCATOR && projectionFrom.toUpperCase() === ProjectionConstants.EPSG_4326) {
      maxLatitude = maxLatitude > ProjectionConstants.WEB_MERCATOR_MAX_LAT_RANGE ? ProjectionConstants.WEB_MERCATOR_MAX_LAT_RANGE : maxLatitude;
      minLatitude = minLatitude < ProjectionConstants.WEB_MERCATOR_MIN_LAT_RANGE ? ProjectionConstants.WEB_MERCATOR_MIN_LAT_RANGE : minLatitude;
      minLongitude = minLongitude < ProjectionConstants.WEB_MERCATOR_MIN_LON_RANGE ? ProjectionConstants.WEB_MERCATOR_MIN_LON_RANGE : minLongitude;
      maxLongitude = maxLongitude > ProjectionConstants.WEB_MERCATOR_MAX_LON_RANGE ? ProjectionConstants.WEB_MERCATOR_MAX_LON_RANGE : maxLongitude;
    }

    // ensure the projected longitude wont wrap around the world
    const negative180 = Projection.convertCoordinates(ProjectionConstants.EPSG_4326, projectionTo, [-180, 0]);
    const positive180 = Projection.convertCoordinates(ProjectionConstants.EPSG_4326, projectionTo, [180, 0]);
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
