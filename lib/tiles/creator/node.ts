// @ts-ignore
import concat from 'concat-stream';

import { ImageUtils } from '../imageUtils';
import { TileCreator } from './tileCreator';
import { TileMatrix } from '../matrix/tileMatrix';
import { TileMatrixSet } from '../matrixset/tileMatrixSet';
import { BoundingBox } from '../../..';
import { SpatialReferenceSystem } from '../../core/srs/spatialReferenceSystem';

export class NodeTileCreator extends TileCreator {
  canvas: any;
  pixelAdded: boolean;
  Canvas: any;
  ctx: any;
  tileCanvas: any;
  tileContext: any;
  imageData: any;

  constructor(
    width: number,
    height: number,
    tileMatrix: TileMatrix,
    tileMatrixSet: TileMatrixSet,
    tileBoundingBox: BoundingBox,
    srs: SpatialReferenceSystem,
    projectionTo: string,
    canvas?: any,
  ) {
    super(width, height, tileMatrix, tileMatrixSet, tileBoundingBox, srs, projectionTo);
    this.canvas = canvas;
    this.pixelAdded = false;
  }
  async initialize(): Promise<NodeTileCreator> {
    this.Canvas = await import('canvas');
    this.canvas = this.canvas || this.Canvas.createCanvas(this.width, this.height);
    this.ctx = this.canvas.getContext('2d');
    this.tileCanvas = this.Canvas.createCanvas(this.width, this.height);
    this.tileContext = this.tileCanvas.getContext('2d');
    this.tileCanvas.width = this.tileMatrix.tile_width;
    this.tileCanvas.height = this.tileMatrix.tile_height;
    this.imageData = this.Canvas.createImageData(
      new Uint8ClampedArray(this.width * this.height * 4),
      this.width,
      this.height,
    );
    return this;
  }
  addPixel(targetX: number, targetY: number, sourceX: number, sourceY: number): void {
    const color = this.tileContext.getImageData(sourceX, sourceY, 1, 1);
    this.imageData.data.set(color.data, targetY * this.width * 4 + targetX * 4);
    this.pixelAdded = true;
  }
  async addTile(tileData: any, gridColumn: number, gridRow: number): Promise<any> {
    const tile = await ImageUtils.getImage(tileData);
    this.tileContext.drawImage(tile, 0, 0);
    this.chunks = [];
    await this.projectTile(tileData, gridColumn, gridRow);
    if (this.pixelAdded) {
      this.ctx.putImageData(this.imageData, 0, 0);
    }
    if (this.chunks && this.chunks.length) {
      for (let i = 0; i < this.chunks.length; i++) {
        const image = await ImageUtils.getImage(tileData);
        const p = this.chunks[i].position;
        this.ctx.drawImage(image, p.sx, p.sy, p.sWidth, p.sHeight, p.dx, p.dy, p.dWidth, p.dHeight);
      }
    }
    return this.canvas;
  }
  async getCompleteTile(format?: string): Promise<Buffer> {
    return new Promise(resolve => {
      const writeStream = concat(function(buffer: Buffer) {
        resolve(buffer);
      });
      let stream = null;
      if (format === 'png') {
        stream = this.canvas.createPNGStream();
      } else {
        stream = this.canvas.createJPEGStream();
      }
      stream.pipe(writeStream);
    });
  }
}
