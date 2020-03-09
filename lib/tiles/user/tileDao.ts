import proj4 from 'proj4';
import { UserDao } from '../../user/userDao';
import { TileMatrixDao } from '../matrix/tileMatrixDao';
import { TileMatrixSetDao } from '../matrixset/tileMatrixSetDao';
import { TileRow } from './tileRow';
import { TileColumn } from './tileColumn';
import { TileGrid } from '../tileGrid';
import { ColumnValues } from '../../dao/columnValues';
import { TileMatrix } from '../matrix/tileMatrix';
import { TileBoundingBoxUtils } from '../tileBoundingBoxUtils';
import { BoundingBox } from '../../boundingBox';
import { SpatialReferenceSystem } from '../../core/srs/spatialReferenceSystem';
import { TileMatrixSet } from '../matrixset/tileMatrixSet';
import { GeoPackage } from '../../geoPackage';
import { TileTable } from './tileTable';
import { DataTypes } from '../../db/dataTypes';
import { DBValue } from '../../db/dbAdapter';

/**
 * `TileDao` is a {@link module:dao/dao~Dao} subclass for reading
 * [user tile tables]{@link module:tiles/user/tileTable~TileTable}.
 *
 * @class TileDao
 * @extends UserDao
 * @param  {GeoPackageConnection} connection
 * @param  {TileTable} table
 * @param  {TileMatrixSet} tileMatrixSet
 * @param  {TileMatrix[]} tileMatrices
 */
export class TileDao extends UserDao<TileRow> {
  zoomLevelToTileMatrix: TileMatrix[];
  widths: number[];
  heights: number[];
  minZoom: number;
  maxZoom: number;
  srs: SpatialReferenceSystem;
  projection: string;
  minWebMapZoom: number;
  maxWebMapZoom: number;
  webZoomToGeoPackageZooms: Record<number, number>;
  constructor(
    geoPackage: GeoPackage,
    table: TileTable,
    public tileMatrixSet: TileMatrixSet,
    public tileMatrices: TileMatrix[],
  ) {
    super(geoPackage, table);
    this.zoomLevelToTileMatrix = [];
    this.widths = [];
    this.heights = [];
    if (tileMatrices.length === 0) {
      this.minZoom = 0;
      this.maxZoom = 0;
    } else {
      this.minZoom = this.tileMatrices[0].zoom_level;
      this.maxZoom = this.tileMatrices[this.tileMatrices.length - 1].zoom_level;
    }
    // Populate the zoom level to tile matrix and the sorted tile widths and heights
    for (let i = this.tileMatrices.length - 1; i >= 0; i--) {
      const tileMatrix = this.tileMatrices[i];
      this.zoomLevelToTileMatrix[tileMatrix.zoom_level] = tileMatrix;
    }
    this.initialize();
  }
  initialize(): void {
    const tileMatrixSetDao = this.geoPackage.tileMatrixSetDao;
    this.srs = tileMatrixSetDao.getSrs(this.tileMatrixSet);
    this.projection = this.srs.organization.toUpperCase() + ':' + this.srs.organization_coordsys_id;
    // Populate the zoom level to tile matrix and the sorted tile widths and heights
    for (let i = this.tileMatrices.length - 1; i >= 0; i--) {
      const tileMatrix = this.tileMatrices[i];
      let width = tileMatrix.pixel_x_size * tileMatrix.tile_width;
      let height = tileMatrix.pixel_y_size * tileMatrix.tile_height;
      const proj4Projection: proj4.Converter & { to_meter?: number } = proj4(this.projection);
      if (proj4Projection.to_meter) {
        width = proj4Projection.to_meter * tileMatrix.pixel_x_size * tileMatrix.tile_width;
        height = proj4Projection.to_meter * tileMatrix.pixel_y_size * tileMatrix.tile_height;
      }
      this.widths.push(width);
      this.heights.push(height);
    }
    this.setWebMapZoomLevels();
  }
  webZoomToGeoPackageZoom(webZoom: number): number {
    const webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(0, 0, webZoom);
    return this.determineGeoPackageZoomLevel(webMercatorBoundingBox, webZoom);
  }
  setWebMapZoomLevels(): void {
    this.minWebMapZoom = 20;
    this.maxWebMapZoom = 0;
    this.webZoomToGeoPackageZooms = {};
    const totalTileWidth = this.tileMatrixSet.max_x - this.tileMatrixSet.min_x;
    const totalTileHeight = this.tileMatrixSet.max_y - this.tileMatrixSet.min_y;
    for (let i = 0; i < this.tileMatrices.length; i++) {
      const tileMatrix = this.tileMatrices[i];
      const singleTileWidth = totalTileWidth / tileMatrix.matrix_width;
      const singleTileHeight = totalTileHeight / tileMatrix.matrix_height;
      const tileBox = new BoundingBox(
        this.tileMatrixSet.min_x,
        this.tileMatrixSet.min_x + singleTileWidth,
        this.tileMatrixSet.min_y,
        this.tileMatrixSet.min_y + singleTileHeight,
      );
      const proj4Projection = proj4(this.projection, 'EPSG:4326');
      const ne = proj4Projection.forward([tileBox.maxLongitude, tileBox.maxLatitude]);
      const sw = proj4Projection.forward([tileBox.minLongitude, tileBox.minLatitude]);
      const width = ne[0] - sw[0];
      const zoom = Math.ceil(Math.log2(360 / width));
      if (this.minWebMapZoom > zoom) {
        this.minWebMapZoom = zoom;
      }
      if (this.maxWebMapZoom < zoom) {
        this.maxWebMapZoom = zoom;
      }
      this.webZoomToGeoPackageZooms[zoom] = tileMatrix.zoom_level;
    }
  }
  determineGeoPackageZoomLevel(webMercatorBoundingBox: BoundingBox, zoom: number): number {
    return this.webZoomToGeoPackageZooms[zoom];
  }
  /**
   * Get the bounding box of tiles at the zoom level
   * @param  {Number} zoomLevel zoom level
   * @return {BoundingBox}           bounding box of the zoom level, or null if no tiles
   */
  getBoundingBoxWithZoomLevel(zoomLevel: number): BoundingBox {
    let boundingBox;
    const tileMatrix = this.getTileMatrixWithZoomLevel(zoomLevel);
    if (tileMatrix) {
      const tileGrid = this.queryForTileGridWithZoomLevel(zoomLevel);
      if (tileGrid) {
        const matrixSetBoundingBox = this.boundingBox;
        boundingBox = TileBoundingBoxUtils.getTileGridBoundingBox(
          matrixSetBoundingBox,
          tileMatrix.matrix_width,
          tileMatrix.matrix_height,
          tileGrid,
        );
      }
      return boundingBox;
    } else {
      return boundingBox;
    }
  }
  get boundingBox(): BoundingBox {
    return this.tileMatrixSet.boundingBox;
  }
  queryForTileGridWithZoomLevel(zoomLevel: number): TileGrid {
    const where = this.buildWhereWithFieldAndValue(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel);
    const whereArgs = this.buildWhereArgs(zoomLevel);
    const minX = this.minOfColumn(TileColumn.COLUMN_TILE_COLUMN, where, whereArgs);
    const maxX = this.maxOfColumn(TileColumn.COLUMN_TILE_COLUMN, where, whereArgs);
    const minY = this.minOfColumn(TileColumn.COLUMN_TILE_ROW, where, whereArgs);
    const maxY = this.maxOfColumn(TileColumn.COLUMN_TILE_ROW, where, whereArgs);
    let tileGrid;
    if (minX != null && minY != null && maxX != null && maxY != null) {
      tileGrid = new TileGrid(minX, maxX, minY, maxY);
    }
    return tileGrid;
  }
  /**
   * Get the tile grid of the zoom level
   * @param  {Number} zoomLevel zoom level
   * @return {TileGrid}           tile grid at zoom level, null if no tile matrix at zoom level
   */
  getTileGridWithZoomLevel(zoomLevel: number): TileGrid {
    let tileGrid;
    const tileMatrix = this.getTileMatrixWithZoomLevel(zoomLevel);
    if (tileMatrix) {
      tileGrid = new TileGrid(0, ~~tileMatrix.matrix_width - 1, 0, ~~tileMatrix.matrix_height - 1);
    }
    return tileGrid;
  }
  /**
   * get the tile table
   * @return {TileTable} tile table
   */
  get table(): TileTable {
    return this._table as TileTable;
  }
  /**
   * Create a new tile row with the column types and values
   * @param  {Array} columnTypes column types
   * @param  {Array} values      values
   * @return {TileRow}             tile row
   */
  newRow(columnTypes?: { [key: string]: DataTypes }, values?: Record<string, DBValue>): TileRow {
    return new TileRow(this.table, columnTypes, values);
  }
  /**
   * Adjust the tile matrix lengths if needed. Check if the tile matrix width
   * and height need to expand to account for pixel * number of pixels fitting
   * into the tile matrix lengths
   */
  adjustTileMatrixLengths(): void {
    const tileMatrixWidth = this.tileMatrixSet.max_x - this.tileMatrixSet.min_x;
    const tileMatrixHeight = this.tileMatrixSet.max_y - this.tileMatrixSet.min_y;
    for (let i = 0; i < this.tileMatrices.length; i++) {
      const tileMatrix = this.tileMatrices[i];
      const tempMatrixWidth = ~~(tileMatrixWidth / (tileMatrix.pixel_x_size * ~~tileMatrix.tile_width));
      const tempMatrixHeight = ~~(tileMatrixHeight / (tileMatrix.pixel_y_size * ~~tileMatrix.tile_height));
      if (tempMatrixWidth > ~~tileMatrix.matrix_width) {
        tileMatrix.matrix_width = ~~tempMatrixWidth;
      }
      if (tempMatrixHeight > ~~tileMatrix.matrix_height) {
        tileMatrix.matrix_height = ~~tempMatrixHeight;
      }
    }
  }
  /**
   * Get the tile matrix at the zoom level
   * @param  {Number} zoomLevel zoom level
   * @returns {TileMatrix}           tile matrix
   */
  getTileMatrixWithZoomLevel(zoomLevel: number): TileMatrix {
    return this.zoomLevelToTileMatrix[zoomLevel];
  }
  /**
   * Query for a tile
   * @param  {Number} column    column
   * @param  {Number} row       row
   * @param  {Number} zoomLevel zoom level
   */
  queryForTile(column: number, row: number, zoomLevel: number): TileRow {
    const fieldValues = new ColumnValues();
    fieldValues.addColumn(TileColumn.COLUMN_TILE_COLUMN, column);
    fieldValues.addColumn(TileColumn.COLUMN_TILE_ROW, row);
    fieldValues.addColumn(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel);
    let tileRow;
    for (const rawRow of this.queryForFieldValues(fieldValues)) {
      tileRow = this.getRow(rawRow) as TileRow;
    }
    return tileRow;
  }
  queryForTilesWithZoomLevel(zoomLevel: number): IterableIterator<TileRow> {
    const iterator = this.queryForEach(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel);
    return {
      [Symbol.iterator](): IterableIterator<TileRow> {
        return this;
      },
      next: (): IteratorResult<TileRow> => {
        const nextRow = iterator.next();
        if (!nextRow.done) {
          return {
            value: this.getRow(nextRow.value) as TileRow,
            done: false,
          };
        }
        return {
          value: undefined,
          done: true,
        };
      },
    };
  }
  /**
   * Query for Tiles at a zoom level in descending row and column order
   * @param  {Number} zoomLevel    zoom level
   * @returns {IterableIterator<TileRow>}
   */
  queryForTilesDescending(zoomLevel: number): IterableIterator<TileRow> {
    const iterator = this.queryForEach(
      TileColumn.COLUMN_ZOOM_LEVEL,
      zoomLevel,
      undefined,
      undefined,
      TileColumn.COLUMN_TILE_COLUMN + ' DESC, ' + TileColumn.COLUMN_TILE_ROW + ' DESC',
    );
    return {
      [Symbol.iterator](): IterableIterator<TileRow> {
        return this;
      },
      next: (): IteratorResult<TileRow> => {
        const nextRow = iterator.next();
        if (!nextRow.done) {
          return {
            value: this.getRow(nextRow.value) as TileRow,
            done: false,
          };
        }
        return {
          value: undefined,
          done: true,
        };
      },
    };
  }
  /**
   * Query for tiles at a zoom level and column
   * @param  {Number} column       column
   * @param  {Number} zoomLevel    zoom level
   * @returns {IterableIterator<TileRow>}
   */
  queryForTilesInColumn(column: number, zoomLevel: number): IterableIterator<TileRow> {
    const fieldValues = new ColumnValues();
    fieldValues.addColumn(TileColumn.COLUMN_TILE_COLUMN, column);
    fieldValues.addColumn(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel);
    const iterator = this.queryForFieldValues(fieldValues);
    return {
      [Symbol.iterator](): IterableIterator<TileRow> {
        return this;
      },
      next: (): IteratorResult<TileRow> => {
        const nextRow = iterator.next();
        if (!nextRow.done) {
          const tileRow = this.getRow(nextRow.value) as TileRow;
          return {
            value: tileRow,
            done: false,
          };
        } else {
          return {
            value: undefined,
            done: true,
          };
        }
      },
    };
  }
  /**
   * Query for tiles at a zoom level and row
   * @param  {Number} row       row
   * @param  {Number} zoomLevel    zoom level
   */
  queryForTilesInRow(row: number, zoomLevel: number): IterableIterator<TileRow> {
    const fieldValues = new ColumnValues();
    fieldValues.addColumn(TileColumn.COLUMN_TILE_ROW, row);
    fieldValues.addColumn(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel);
    const iterator = this.queryForFieldValues(fieldValues);
    return {
      [Symbol.iterator](): IterableIterator<TileRow> {
        return this;
      },
      next: (): IteratorResult<TileRow> => {
        const nextRow = iterator.next();
        if (!nextRow.done) {
          const tileRow = this.getRow(nextRow.value) as TileRow;
          return {
            value: tileRow,
            done: false,
          };
        } else {
          return {
            value: undefined,
            done: true,
          };
        }
      },
    };
  }
  /**
   * Query by tile grid and zoom level
   * @param  {TileGrid} tileGrid  tile grid
   * @param  {Number} zoomLevel zoom level
   * @returns {IterableIterator<any>}
   */
  queryByTileGrid(tileGrid: TileGrid, zoomLevel: number): IterableIterator<TileRow> {
    if (!tileGrid) return;
    let where = '';
    where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel);
    where += ' and ';
    where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_TILE_COLUMN, tileGrid.min_x, '>=');
    where += ' and ';
    where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_TILE_COLUMN, tileGrid.max_x, '<=');
    where += ' and ';
    where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_TILE_ROW, tileGrid.min_y, '>=');
    where += ' and ';
    where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_TILE_ROW, tileGrid.max_y, '<=');
    const whereArgs = this.buildWhereArgs([zoomLevel, tileGrid.min_x, tileGrid.max_x, tileGrid.min_y, tileGrid.max_y]);
    const iterator = this.queryWhereWithArgsDistinct(where, whereArgs);
    return {
      [Symbol.iterator](): IterableIterator<TileRow> {
        return this;
      },
      next: (): IteratorResult<TileRow> => {
        const nextRow = iterator.next();
        if (!nextRow.done) {
          const tileRow = this.getRow(nextRow.value) as TileRow;
          return {
            value: tileRow,
            done: false,
          };
        } else {
          return {
            value: undefined,
            done: true,
          };
        }
      },
    };
  }
  /**
   * count by tile grid and zoom level
   * @param  {TileGrid} tileGrid  tile grid
   * @param  {Number} zoomLevel zoom level
   * @returns {Number} count of tiles
   */
  countByTileGrid(tileGrid: TileGrid, zoomLevel: number): number {
    if (!tileGrid) return;
    let where = '';
    where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel);
    where += ' and ';
    where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_TILE_COLUMN, tileGrid.min_x, '>=');
    where += ' and ';
    where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_TILE_COLUMN, tileGrid.max_x, '<=');
    where += ' and ';
    where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_TILE_ROW, tileGrid.min_y, '>=');
    where += ' and ';
    where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_TILE_ROW, tileGrid.max_y, '<=');
    const whereArgs = this.buildWhereArgs([zoomLevel, tileGrid.min_x, tileGrid.max_x, tileGrid.min_y, tileGrid.max_y]);
    return this.countWhere(where, whereArgs);
  }

  deleteTile(column: number, row: number, zoomLevel: number): number {
    let where = '';
    where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_ZOOM_LEVEL, zoomLevel);
    where += ' and ';
    where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_TILE_COLUMN, column);
    where += ' and ';
    where += this.buildWhereWithFieldAndValue(TileColumn.COLUMN_TILE_ROW, row);
    const whereArgs = this.buildWhereArgs([zoomLevel, column, row]);
    return this.deleteWhere(where, whereArgs);
  }
  dropTable(): boolean {
    const tileMatrixDao = this.geoPackage.tileMatrixDao;
    const dropResult = UserDao.prototype.dropTable.call(this);
    const tileMatrixSetDao = this.geoPackage.tileMatrixSetDao;
    tileMatrixSetDao.delete(this.tileMatrixSet);
    for (let i = this.tileMatrices.length - 1; i >= 0; i--) {
      const tileMatrix = this.tileMatrices[i];
      tileMatrixDao.delete(tileMatrix);
    }
    const dao = this.geoPackage.contentsDao;
    dao.deleteById(this.gpkgTableName);
    return dropResult;
  }
  rename(newName: string): void {
    super.rename(newName);
    const oldName = this.tileMatrixSet.table_name;
    const values: Record<string, DBValue> = {};
    values[TileMatrixSetDao.COLUMN_TABLE_NAME] = newName;
    const where = this.buildWhereWithFieldAndValue(TileMatrixSetDao.COLUMN_TABLE_NAME, oldName);
    const whereArgs = this.buildWhereArgs([oldName]);
    const contentsDao = this.geoPackage.contentsDao;
    const contents = contentsDao.queryForId(oldName);
    contents.table_name = newName;
    contents.identifier = newName;
    contentsDao.create(contents);
    const tileMatrixSetDao = this.geoPackage.tileMatrixSetDao;
    tileMatrixSetDao.updateWithValues(values, where, whereArgs);
    const tileMatrixDao = this.geoPackage.tileMatrixDao;
    const tileMatrixUpdate: Record<string, DBValue> = {};
    tileMatrixUpdate[TileMatrixDao.COLUMN_TABLE_NAME] = newName;
    const tileMatrixWhere = this.buildWhereWithFieldAndValue(TileMatrixDao.COLUMN_TABLE_NAME, oldName);
    tileMatrixDao.updateWithValues(tileMatrixUpdate, tileMatrixWhere, whereArgs);
    contentsDao.deleteById(oldName);
  }
}
