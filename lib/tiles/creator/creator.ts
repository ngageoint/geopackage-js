import { TileMatrix } from '../matrix/tileMatrix';
import { TileMatrixSet } from '../matrixset/tileMatrixSet';
import { BoundingBox } from '../../boundingBox';
import { SpatialReferenceSystem } from '../../core/srs/spatialReferenceSystem';

export class Creator {
  private static tileCreator: any = undefined;

  static registerTileCreator (tileCreator) {
    Creator.tileCreator = tileCreator;
  }

  /**
   * Calls the constructor for the registered tile creator
   * @param width
   * @param height
   * @param tileMatrix
   * @param tileMatrixSet
   * @param tileBoundingBox
   * @param srs
   * @param projectionTo
   * @param canvas
   */
  static create (
    width: number,
    height: number,
    tileMatrix: TileMatrix,
    tileMatrixSet: TileMatrixSet,
    tileBoundingBox: BoundingBox,
    srs: SpatialReferenceSystem,
    projectionTo: string,
    canvas: any) {

    return new Creator.tileCreator(
      width,
      height,
      tileMatrix,
      tileMatrixSet,
      tileBoundingBox,
      srs,
      projectionTo,
      canvas,
    );
  }
}
