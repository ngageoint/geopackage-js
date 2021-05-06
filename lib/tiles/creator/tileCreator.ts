import { TileBoundingBoxUtils } from '../tileBoundingBoxUtils';
import proj4 from 'proj4';
import { TileMatrix } from '../matrix/tileMatrix';
import { TileMatrixSet } from '../matrixset/tileMatrixSet';
import { SpatialReferenceSystem } from '../../core/srs/spatialReferenceSystem';
import { BoundingBox } from '../../boundingBox';
import { Creator } from './creator';

export abstract class TileCreator {
  width: number;
  height: number;
  tileMatrix: TileMatrix;
  projectionFrom: string;
  projectionFromDefinition: string;
  projectionTo: string;
  tileBoundingBox: BoundingBox;
  tileMatrixSet: TileMatrixSet;
  chunks: any[];
  tileHeightUnitsPerPixel: number;
  tileWidthUnitsPerPixel: number;
  sameProjection: boolean;

  abstract async initialize(): Promise<TileCreator>;
  abstract getCompleteTile(format?: string): Promise<any>;
  abstract addPixel(targetX: number, targetY: number, sourceX: number, sourceY: number): void;
  abstract async addTile(tileData: any, gridColumn: number, gridRow: number): Promise<any>;
  abstract cleanup();

  static async create(
    width: number,
    height: number,
    tileMatrix: TileMatrix,
    tileMatrixSet: TileMatrixSet,
    tileBoundingBox: BoundingBox,
    srs: SpatialReferenceSystem,
    projectionTo: string,
    canvas: any,
  ): Promise<TileCreator> {
    const creator = Creator.create(
      width,
      height,
      tileMatrix,
      tileMatrixSet,
      tileBoundingBox,
      srs,
      projectionTo,
      canvas,
    );
    await creator.initialize();
    return creator;
  }

  constructor(
    width: number,
    height: number,
    tileMatrix: TileMatrix,
    tileMatrixSet: TileMatrixSet,
    tileBoundingBox: BoundingBox,
    srs: SpatialReferenceSystem,
    projectionTo: string,
  ) {
    this.width = width;
    this.height = height;
    this.tileMatrix = tileMatrix;
    this.projectionFrom = srs.organization.toUpperCase() + ':' + srs.organization_coordsys_id;
    this.projectionFromDefinition = srs.definition;
    this.projectionTo = projectionTo.toUpperCase();
    this.tileBoundingBox = tileBoundingBox;
    this.tileMatrixSet = tileMatrixSet;
    this.chunks = [];
    this.tileHeightUnitsPerPixel = (tileBoundingBox.maxLatitude - tileBoundingBox.minLatitude) / height;
    this.tileWidthUnitsPerPixel = (tileBoundingBox.maxLongitude - tileBoundingBox.minLongitude) / width;
    // use this as a quick check if the projections are equal.  If they are we can shortcut some math
    // special cases 'EPSG:900913' =='EPSG:3857' == 'EPSG:102113'
    this.sameProjection =
      this.projectionFrom === this.projectionTo ||
      (this.projectionTo === 'EPSG:3857' &&
        (this.projectionFrom === 'EPSG:900913' || this.projectionFrom === 'EPSG:102113'));
  }

  async projectTile(tileData: any, gridColumn: number, gridRow: number): Promise<any> {
    const bb = TileBoundingBoxUtils.getTileBoundingBox(
      this.tileMatrixSet.boundingBox,
      this.tileMatrix,
      gridColumn,
      gridRow,
    );
    if (!this.sameProjection) {
      return this.reproject(tileData, bb);
    } else {
      return this.cutAndScale(tileData, bb);
    }
  }
  cutAndScale(tileData: any, tilePieceBoundingBox: BoundingBox): void {
    const position = TileBoundingBoxUtils.determinePositionAndScale(
      tilePieceBoundingBox,
      this.tileMatrix.tile_height,
      this.tileMatrix.tile_width,
      this.tileBoundingBox,
      this.height,
      this.width,
    );
    if (position.xPositionInFinalTileStart >= this.width || position.yPositionInFinalTileStart >= this.height) {
      // this tile doesn't belong just skip it
    } else {
      this.addChunk(tileData, position);
    }
  }
  addChunk(chunk: any, position: any): void {
    this.chunks.push({
      chunk: chunk,
      position: position,
    });
  }
  async reproject(tileData: any, tilePieceBoundingBox: BoundingBox): Promise<void> {
    const height = this.height;
    const width = this.width;
    const tileHeight = this.tileMatrix.tile_height;
    const tileWidth = this.tileMatrix.tile_width;
    let conversion;
    try {
      conversion = proj4(this.projectionTo, this.projectionFrom);
    } catch (e) {}
    if (!conversion) {
      conversion = proj4(this.projectionTo, this.projectionFromDefinition);
    }
    let latitude;
    for (let row = 0; row < height; row++) {
      latitude = this.tileBoundingBox.maxLatitude - row * this.tileHeightUnitsPerPixel;
      for (let column = 0; column < width; column++) {
        const longitude = this.tileBoundingBox.minLongitude + column * this.tileWidthUnitsPerPixel;
        const projected = conversion.forward([longitude, latitude]);
        const xPixel = tileWidth - Math.round((tilePieceBoundingBox.maxLongitude - projected[0]) / this.tileMatrix.pixel_x_size);
        const yPixel = Math.round((tilePieceBoundingBox.maxLatitude - projected[1]) / this.tileMatrix.pixel_y_size);
        if (xPixel >= 0 && xPixel < tileWidth && yPixel >= 0 && yPixel < tileHeight) {
          this.addPixel(column, row, xPixel, yPixel);
        }
      }
    }
  }
}
