import fileType from 'file-type';
import proj4 from 'proj4';
import ProjectTile from './projectTile';

import { TileBoundingBoxUtils } from '../tileBoundingBoxUtils';
import { TileMatrix } from '../matrix/tileMatrix';
import { TileMatrixSet } from '../matrixset/tileMatrixSet';
import { SpatialReferenceSystem } from '../../core/srs/spatialReferenceSystem';
import { BoundingBox } from '../../boundingBox';
import { Canvas } from '../../canvas/canvas';
import { ImageUtils } from '../imageUtils';
import { TileUtilities } from './tileUtilities';
import { Projection } from '../../projection/projection';
import { ProjectionConstants } from '../../projection/projectionConstants';

export class TileCreator {
  dispose: boolean = false;
  canvas: any = null;
  ctx: any;
  image: any;
  tileCanvas: any;
  tileContext: any;
  imageData: any;
  pixelsAdded: boolean = false;
  width: number;
  height: number;
  tileMatrix: TileMatrix;
  projectionFrom: string;
  projectionFromDefinition: string;
  projectionTo: string;
  projectionToDefinition: string | proj4.ProjectionDefinition;
  tileBoundingBox: BoundingBox;
  tileMatrixSet: TileMatrixSet;
  chunks: any[];
  tileHeightUnitsPerPixel: number;
  tileWidthUnitsPerPixel: number;
  sameProjection: boolean;

  constructor (
    width: number,
    height: number,
    tileMatrix: TileMatrix,
    tileMatrixSet: TileMatrixSet,
    tileBoundingBox: BoundingBox,
    srs: SpatialReferenceSystem,
    projectionTo: string,
    projectionToDefinition: string | proj4.ProjectionDefinition,
    canvas: any,
  ) {
    this.width = width;
    this.height = height;
    this.tileMatrix = tileMatrix;
    this.projectionFrom = srs.organization.toUpperCase() + ':' + srs.organization_coordsys_id;
    this.projectionFromDefinition = srs.definition;
    this.projectionTo = projectionTo.toUpperCase();
    this.projectionToDefinition = projectionToDefinition
    this.tileBoundingBox = tileBoundingBox;
    this.tileMatrixSet = tileMatrixSet;
    this.chunks = [];
    this.tileHeightUnitsPerPixel = (tileBoundingBox.height) / height;
    this.tileWidthUnitsPerPixel = (tileBoundingBox.width) / width;
    // use this as a quick check if the projections are equal.  If they are we can shortcut some math
    // special cases 'EPSG:900913' =='EPSG:3857' == 'EPSG:102113'
    this.sameProjection =
      this.projectionFrom === this.projectionTo ||
      (this.projectionTo === ProjectionConstants.EPSG_3857 &&
        (this.projectionFrom === ProjectionConstants.EPSG_900913 || this.projectionFrom === ProjectionConstants.EPSG_102113));

    this.canvas = canvas;
  }

  /**
   * Factory method to generate a TileCreator instance
   * @param width
   * @param height
   * @param tileMatrix
   * @param tileMatrixSet
   * @param tileBoundingBox
   * @param srs
   * @param projectionTo
   * @param projectionToDefinition
   * @param canvas
   */
  static async create(
    width: number,
    height: number,
    tileMatrix: TileMatrix,
    tileMatrixSet: TileMatrixSet,
    tileBoundingBox: BoundingBox,
    srs: SpatialReferenceSystem,
    projectionTo: string,
    projectionToDefinition: string | proj4.ProjectionDefinition,
    canvas: any,
  ): Promise<TileCreator> {
    const creator = new TileCreator(
      width,
      height,
      tileMatrix,
      tileMatrixSet,
      tileBoundingBox,
      srs,
      projectionTo,
      projectionToDefinition,
      canvas,
    );
    await creator.initialize();
    return creator;
  }

  /**
   * Initialize the TileCreator
   */
  async initialize(): Promise<TileCreator> {
    await Canvas.initializeAdapter();
    if (this.canvas == null) {
      this.canvas = Canvas.create(this.width, this.height);
      this.dispose = true;
    }
    this.ctx = this.canvas.getContext('2d');
    this.tileCanvas = Canvas.create(this.tileMatrix.tile_width, this.tileMatrix.tile_height);
    this.tileContext = this.tileCanvas.getContext('2d');
    this.imageData = Canvas.createImageData(this.width, this.height);
    return this;
  }

  /**
   * Adds a single pixel from one image to another
   * @param targetX
   * @param targetY
   * @param sourceX
   * @param sourceY
   */
  addPixel(targetX: number, targetY: number, sourceX: number, sourceY: number): void {
    const color = this.tileContext.getImageData(sourceX, sourceY, 1, 1);
    this.imageData.data.set(color.data, targetY * this.width * 4 + targetX * 4);
    this.pixelsAdded = true
  }

  /**
   * Adds a tile and reprojects it if necessary before drawing it into the target canvas
   * @param tileData
   * @param gridColumn
   * @param gridRow
   */
  async addTile(tileData: any, gridColumn: number, gridRow: number): Promise<void> {
    const type = fileType(tileData);
    const tile = await ImageUtils.getImage(tileData, type.mime);
    this.tileContext.clearRect(0, 0, this.tileMatrix.tile_width, this.tileMatrix.tile_height);
    this.tileContext.drawImage(tile.image, 0, 0);
    this.chunks = [];
    await this.projectTile(tileData, gridColumn, gridRow);
    if (this.pixelsAdded) {
      this.ctx.putImageData(this.imageData, 0, 0);
    }
    if (this.chunks && this.chunks.length) {
      for (let i = 0; i < this.chunks.length; i++) {
        const p = this.chunks[i].position;
        this.ctx.drawImage(tile.image, p.sx, p.sy, p.sWidth, p.sHeight, p.dx, p.dy, p.dWidth, p.dHeight);
      }
    }
    Canvas.disposeImage(tile);
  }

  /**
   * Projects the tile into the target projection and renders into the target canvas
   * @param tileData
   * @param gridColumn
   * @param gridRow
   */
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

  /**
   * Cuts and scales tile data to fit the specified bounding box
   * @param tileData
   * @param tilePieceBoundingBox
   */
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

  /**
   * Adds chunks to the chunk list.
   * @param chunk
   * @param position
   */
  addChunk(chunk: any, position: any): void {
    this.chunks.push({
      chunk: chunk,
      position: position,
    });
  }

  /**
   * Reprojection tile data into target
   * @param tileData
   * @param tilePieceBoundingBox
   */
  async reproject(tileData: any, tilePieceBoundingBox: BoundingBox): Promise<void> {
    // if web workers are available, execute the reprojection in a web worker
    if (typeof window !== 'undefined' && window.Worker) {
      TileUtilities.getPiecePosition(
        tilePieceBoundingBox,
        this.tileBoundingBox,
        this.height,
        this.width,
        this.projectionTo,
        this.projectionToDefinition,
        this.projectionFrom,
        this.projectionFromDefinition,
        this.tileHeightUnitsPerPixel,
        this.tileWidthUnitsPerPixel,
        this.tileMatrix.pixel_x_size,
        this.tileMatrix.pixel_y_size,
      );
      const job = {
        sourceImageData: this.tileContext.getImageData(0, 0, this.tileMatrix.tile_width, this.tileMatrix.tile_height).data.buffer,
        height: this.height,
        width: this.width,
        projectionTo: this.projectionTo,
        projectionToDefinition: this.projectionToDefinition,
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
            this.canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(e.data), this.height, this.width), 0, 0);
            resolve();
          };
          worker.postMessage(job, [
            this.tileContext.getImageData(0, 0, this.tileMatrix.tile_width, this.tileMatrix.tile_height).data.buffer,
          ]);
        } catch (e) {
          const worker = ProjectTile;
          const data = worker(job);
          this.canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(data), this.height, this.width), 0, 0);
          resolve();
        }
      });
    } else {
      const height = this.height;
      const width = this.width;
      const tileHeight = this.tileMatrix.tile_height;
      const tileWidth = this.tileMatrix.tile_width;
      let conversion;
      try {
        if (Projection.hasProjection(this.projectionTo) == null) {
          Projection.loadProjection(this.projectionTo, this.projectionToDefinition)
        }
        if (Projection.hasProjection(this.projectionFrom) == null) {
          Projection.loadProjection(this.projectionFrom, this.projectionFromDefinition)
        }
        conversion = proj4(this.projectionTo, this.projectionFrom);
      } catch (e) {}
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
      this.canvas.getContext('2d').putImageData(this.imageData, 0, 0);
    }
  }

  /**
   * Gets the complete tile as a base64 encoded data url
   * @param format
   */
  async getCompleteTile(format?: string): Promise<any> {
    return Canvas.toDataURL(this.canvas, format);
  }

  /**
   * Cleans up any canvases that may have been created
   */
  cleanup () {
    if (this.dispose) {
      Canvas.disposeCanvas(this.canvas);
    }
    Canvas.disposeCanvas(this.tileCanvas);
  }
}
