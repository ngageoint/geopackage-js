// @ts-ignore
import { ImageUtils } from '../imageUtils';
import { TileCreator } from './tileCreator';
import { TileMatrix } from '../matrix/tileMatrix';
import { TileMatrixSet } from '../matrixset/tileMatrixSet';
import { SpatialReferenceSystem } from '../../core/srs/spatialReferenceSystem';
import { BoundingBox } from '../../boundingBox';
import { Canvas } from '../../canvas/canvas';

export class NodeTileCreator extends TileCreator {
  canvas: any;
  dispose: boolean = false;
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
    await Canvas.initializeAdapter();
    if (this.canvas == null) {
      this.canvas = Canvas.create(this.width, this.height);
      this.dispose = true;
    }
    this.ctx = this.canvas.getContext('2d');
    this.tileCanvas = Canvas.create(this.tileMatrix.tile_width, this.tileMatrix.tile_height);
    this.tileContext = this.tileCanvas.getContext('2d');
    this.tileCanvas.width = this.tileMatrix.tile_width;
    this.tileCanvas.height = this.tileMatrix.tile_height;
    this.imageData = Canvas.createImageData(this.width, this.height);
    return this;
  }
  addPixel(targetX: number, targetY: number, sourceX: number, sourceY: number): void {
    const color = this.tileContext.getImageData(sourceX, sourceY, 1, 1);
    this.imageData.data.set(color.data, targetY * this.width * 4 + targetX * 4);
    this.pixelAdded = true;
  }
  async addTile(tileData: any, gridColumn: number, gridRow: number): Promise<any> {
    const tile = await ImageUtils.getImage(tileData);
    this.tileContext.clearRect(0, 0, this.tileMatrix.tile_width, this.tileMatrix.tile_height);
    this.tileContext.drawImage(tile.image, 0, 0);
    this.chunks = [];
    await this.projectTile(tileData, gridColumn, gridRow);
    if (this.pixelAdded) {
      this.ctx.putImageData(this.imageData, 0, 0);
    }
    if (this.chunks && this.chunks.length) {
      for (let i = 0; i < this.chunks.length; i++) {
        const image = await ImageUtils.getImage(tileData);
        const p = this.chunks[i].position;
        this.ctx.drawImage(image.image, p.sx, p.sy, p.sWidth, p.sHeight, p.dx, p.dy, p.dWidth, p.dHeight);
      }
    }
    return this.canvas;
  }
  async getCompleteTile(): Promise<any> {
    return this.canvas.toDataURL();
  }
  cleanup () {
    if (this.dispose) {
      Canvas.disposeCanvas(this.canvas);
    }
    Canvas.disposeCanvas(this.tileCanvas);
  }
}
