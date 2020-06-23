/* eslint-disable @typescript-eslint/no-var-requires */
import { TileMatrix } from '../matrix/tileMatrix';
import { TileMatrixSet } from '../matrixset/tileMatrixSet';
import { SpatialReferenceSystem } from '../../core/srs/spatialReferenceSystem';

import fileType from 'file-type';
import { TileCreator } from './tileCreator';
import TileUtilities from './tileUtilities';
import ProjectTile from './projectTile';
import { BoundingBox } from '../../boundingBox';

export class CanvasTileCreator extends TileCreator {
  canvas: HTMLCanvasElement;
  ctx: any;
  image: HTMLImageElement;
  tileCanvas: HTMLCanvasElement;
  tileContext: any;
  imageData: Uint8ClampedArray;
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
    // eslint-disable-next-line no-undef
    this.canvas = canvas || document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');
    // eslint-disable-next-line no-undef
    this.image = document.createElement('img');
    // eslint-disable-next-line no-undef
    this.tileCanvas = document.createElement('canvas');
    this.tileContext = this.tileCanvas.getContext('2d');
    this.tileCanvas.width = tileMatrix.tile_width;
    this.tileCanvas.height = tileMatrix.tile_height;
    this.imageData = new Uint8ClampedArray(width * height * 4);
  }
  async initialize(): Promise<CanvasTileCreator> {
    return this;
  }
  addPixel(targetX: number, targetY: number, sourceX: number, sourceY: number): void {
    const color = this.tileContext.getImageData(sourceX, sourceY, 1, 1);
    this.imageData.set(color.data, targetY * this.width * 4 + targetX * 4);
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
        resolve(this.tileContext.drawImage(this.image, 0, 0));
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
    const useWorker = false;
    if (useWorker) {
      console.log('Using a web worker');
      const ctx = this.ctx;
      const piecePosition = TileUtilities.getPiecePosition(
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
        imageData: this.tileContext.getImageData(0, 0, this.tileMatrix.tile_width, this.tileMatrix.tile_height).data
          .buffer,
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
            this.canvas
              .getContext('2d')
              .putImageData(new ImageData(new Uint8ClampedArray(e.data.imageData), this.height, this.width), 0, 0);
            resolve();
            // resolve(CanvasTileCreator.workerDone(e.data, piecePosition, ctx));
          };
          worker.postMessage(job, [
            this.tileContext.getImageData(0, 0, this.tileMatrix.tile_width, this.tileMatrix.tile_height).data.buffer,
          ]);
        } catch (e) {
          const worker = ProjectTile;
          worker(job, (err: any, data: any) => {
            this.canvas.getContext('2d').putImageData(new ImageData(data, this.height, this.width), 0, 0);
            resolve();
            // resolve(CanvasTileCreator.workerDone(data, piecePosition, ctx));
          });
        }
      });
    } else {
      console.log('No web worker');
      await super.reproject(tileData, tilePieceBoundingBox);
      this.canvas.getContext('2d').putImageData(new ImageData(this.imageData, this.height, this.width), 0, 0);
    }
  }
  static workerDone(data: any, piecePosition: any, ctx: any): void {
    if (data.message === 'done') {
      const imageData = new Uint8ClampedArray(data.imageData);
      const offsetX = piecePosition.startX;
      const offsetY = piecePosition.startY;
      const finalWidth = data.finalWidth;
      const finalHeight = data.finalHeight;

      // eslint-disable-next-line no-undef
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = finalWidth;
      tmpCanvas.height = finalHeight;
      tmpCanvas.getContext('2d').putImageData(new ImageData(imageData, finalWidth, finalHeight), 0, 0);

      ctx.drawImage(tmpCanvas, offsetX, offsetY);
    }
  }
}
