/* eslint-disable @typescript-eslint/no-var-requires */
import { TileMatrix } from '../matrix/tileMatrix';
import { TileMatrixSet } from '../matrixset/tileMatrixSet';
import { SpatialReferenceSystem } from '../../core/srs/spatialReferenceSystem';

import fileType from 'file-type';
import { TileCreator } from './tileCreator';
import { TileUtilities } from './tileUtilities';
import ProjectTile from './projectTile';
import { BoundingBox } from '../../boundingBox';
import { Canvas } from '../../canvas/canvas';

export class CanvasTileCreator extends TileCreator {
  canvas: any;
  dispose: boolean = false;
  ctx: any;
  image: any;
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
  }
  async initialize(): Promise<CanvasTileCreator> {
    await Canvas.initializeAdapter();
    // eslint-disable-next-line no-undef
    if (this.canvas == null) {
      this.canvas = Canvas.create(this.width, this.height);
      this.dispose = true;
    }
    this.ctx = this.canvas.getContext('2d');
    // eslint-disable-next-line no-undef
    this.image = document.createElement('img');
    // eslint-disable-next-line no-undef
    this.tileCanvas = Canvas.create(this.tileMatrix.tile_width, this.tileMatrix.tile_height);
    this.tileContext = this.tileCanvas.getContext('2d');
    this.imageData = Canvas.createImageData(this.width, this.height);
    return this;
  }
  addPixel(targetX: number, targetY: number, sourceX: number, sourceY: number): void {
    const color = this.tileContext.getImageData(sourceX, sourceY, 1, 1);
    this.imageData.data.set(color.data, targetY * this.width * 4 + targetX * 4);
  }
  async loadImage(tileData: any): Promise<any> {
    const type = fileType(tileData);
    let binary = '';
    const bytes = tileData;
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    // eslint-disable-next-line no-undef
    const base64Data = btoa(binary);
    return new Promise((resolve: Function) => {
      this.image.onload = (): void => {
        this.tileContext.clearRect(0, 0, this.tileMatrix.tile_width, this.tileMatrix.tile_height);
        this.tileContext.drawImage(this.image, 0, 0)
        resolve();
      };
      this.image.src = 'data:' + type.mime + ';base64,' + base64Data;
    });
  }

  async addTile(tileData: any, gridColumn: number, gridRow: number): Promise<void> {
    await this.loadImage(tileData);
    // This is being cut and scaled
    await this.projectTile(tileData, gridColumn, gridRow);
    if (this.chunks && this.chunks.length) {
      return this.chunks.reduce((sequence, chunk) => {
        const type = fileType(tileData);
        let binary = '';
        const bytes = chunk.chunk;
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        // eslint-disable-next-line no-undef
        const base64DataChunk = btoa(binary);
        // eslint-disable-next-line no-undef
        const image = document.createElement('img');
        return sequence.then(() => {
          return new Promise(resolve => {
            image.onload = (): void => {
              const p = chunk.position;
              this.ctx.drawImage(image, p.sx, p.sy, p.sWidth, p.sHeight, p.dx, p.dy, p.dWidth, p.dHeight);
              resolve();
            };
            image.src = 'data:' + type.mime + ';base64,' + base64DataChunk;
          });
        });
      }, Promise.resolve());
    }
  }
  async getCompleteTile(): Promise<any> {
    return this.canvas.toDataURL();
  }
  async reproject(tileData: any, tilePieceBoundingBox: any): Promise<void> {
    if (window.Worker) {
      TileUtilities.getPiecePosition(
        tilePieceBoundingBox,
        this.tileBoundingBox,
        this.height,
        this.width,
        this.projectionTo,
        this.projectionFrom,
        this.projectionFromDefinition,
        this.tileHeightUnitsPerPixel,
        this.tileWidthUnitsPerPixel,
        this.tileMatrix.pixel_x_size,
        this.tileMatrix.pixel_y_size,
      );
      const job = {
        sourceImageData: this.tileContext.getImageData(0, 0, this.tileMatrix.tile_width, this.tileMatrix.tile_height)
          .data.buffer,
        height: this.height,
        width: this.width,
        projectionTo: this.projectionTo,
        projectionFrom: this.projectionFrom,
        projectionFromDefinition: this.projectionFromDefinition,
        maxLatitude: this.tileBoundingBox.maxLatitude,
        minLongitude: this.tileBoundingBox.minLongitude,
        tileWidthUnitsPerPixel: this.tileWidthUnitsPerPixel,
        tileHeightUnitsPerPixel: this.tileHeightUnitsPerPixel,
        tilePieceBoundingBox: JSON.stringify(tilePieceBoundingBox),
        tileBoundingBox: JSON.stringify(this.tileBoundingBox),
        pixel_y_size: this.tileMatrix.pixel_y_size,
        pixel_x_size: this.tileMatrix.pixel_x_size,
        tile_width: this.tileMatrix.tile_width,
        tile_height: this.tileMatrix.tile_height,
      };
      return new Promise(resolve => {
        try {
          const work = require('webworkify');
          const worker = work(require('./tileWorker.js'));
          worker.onmessage = (e: { data: any }): void => {
            const tmpCanvas = Canvas.create(this.width, this.height);
            tmpCanvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(e.data), this.height, this.width), 0, 0);
            this.canvas.getContext('2d').drawImage(tmpCanvas, 0, 0);
            Canvas.disposeCanvas(tmpCanvas);
            resolve();
          };
          worker.postMessage(job, [
            this.tileContext.getImageData(0, 0, this.tileMatrix.tile_width, this.tileMatrix.tile_height).data.buffer,
          ]);
        } catch (e) {
          const worker = ProjectTile;
          const data = worker(job);
          const tmpCanvas = Canvas.create(this.width, this.height);
          tmpCanvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(data), this.height, this.width), 0, 0);
          this.canvas.getContext('2d').drawImage(tmpCanvas, 0, 0);
          Canvas.disposeCanvas(tmpCanvas);
          resolve();
        }
      });
    } else {
      console.log('No web worker');
      await super.reproject(tileData, tilePieceBoundingBox);
      this.canvas.getContext('2d').putImageData(new ImageData(this.imageData.data, this.height, this.width), 0, 0);
    }
  }
  cleanup () {
    if (this.dispose) {
      Canvas.disposeCanvas(this.canvas);
    }
    Canvas.disposeCanvas(this.tileCanvas);
  }
}
