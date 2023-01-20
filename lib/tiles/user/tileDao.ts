import { UserDao } from '../../user/userDao';
import { TileMatrixSet } from '../matrixset/tileMatrixSet';
import { TileColumn } from './tileColumn';
import { TileConnection } from './tileConnection';
import { TileResultSet } from './tileResultSet';
import { TileRow } from './tileRow';
import { TileTable } from './tileTable';
import { TileMatrix } from '../matrix/tileMatrix';
import { BoundingBox } from '../../boundingBox';
import { Projection, ProjectionConstants, Projections, ProjectionTransform } from '@ngageoint/projections-js';
import { GeoPackageException } from '../../geoPackageException';
import { TileBoundingBoxUtils } from '../tileBoundingBoxUtils';
import { GeometryTransform } from '@ngageoint/simple-features-proj-js';
import { TileGrid } from '../tileGrid';
import { TileDaoUtils } from './tileDaoUtils';
import { SpatialReferenceSystem } from '../../srs/spatialReferenceSystem';
import { FieldValues } from '../../dao/fieldValues';
import { TileMatrixSetDao } from '../matrixset/tileMatrixSetDao';
import { TileMatrixDao } from '../matrix/tileMatrixDao';
import type { GeoPackage } from '../../geoPackage';

/**
 * Tile DAO for reading tile user tables
 */
export class TileDao extends UserDao<TileColumn, TileTable, TileRow, TileResultSet> {
  /**
   * Tile connection
   */
  private readonly tileDb: TileConnection;

  /**
   * Tile Matrix Set
   */
  private readonly tileMatrixSet: TileMatrixSet;

  /**
   * Tile Matrices
   */
  private readonly tileMatrices: TileMatrix[];

  /**
   * Mapping between zoom levels and the tile matrix
   */
  private readonly zoomLevelToTileMatrix = {};

  /**
   * Min zoom
   */
  private readonly minZoom: number;

  /**
   * Max zoom
   */
  private readonly maxZoom: number;

  /**
   * Array of widths of the tiles at each zoom level in default units
   */
  private readonly widths: number[];

  /**
   * Array of heights of the tiles at each zoom level in default units
   */
  private readonly heights: number[];

  private readonly webZoomToGeoPackageZooms: Map<number, number>;

  /**
   * Constructor
   *
   * @param database database
   * @param geoPackage GeoPackage
   * @param tileMatrixSet tile matrix set
   * @param tileMatrices tile matrices
   * @param table tile table
   */
  public constructor(
    database: string,
    geoPackage: GeoPackage,
    tileMatrixSet: TileMatrixSet,
    tileMatrices: TileMatrix[],
    table: TileTable,
  ) {
    super(database, geoPackage, new TileConnection(geoPackage.getConnection()), table);
    this.tileDb = this.getUserDb() as TileConnection;
    this.tileMatrixSet = tileMatrixSet;
    this.tileMatrices = tileMatrices;
    this.widths = [];
    this.heights = [];

    this.projection = this.geoPackage.getTileMatrixSetDao().getProjection(tileMatrixSet);

    // Set the min and max zoom levels
    if (tileMatrices.length != 0) {
      this.minZoom = tileMatrices[0].getZoomLevel();
      this.maxZoom = tileMatrices[tileMatrices.length - 1].getZoomLevel();
    } else {
      this.minZoom = 0;
      this.maxZoom = 0;
    }

    // Populate the zoom level to tile matrix and the sorted tile widths and heights
    for (let i = 0; i < this.tileMatrices.length; i++) {
      const tileMatrix = tileMatrices[i];
      this.zoomLevelToTileMatrix[tileMatrix.getZoomLevel()] = tileMatrix;
      this.widths.push(tileMatrix.getPixelXSize() * tileMatrix.getTileWidth());
      this.heights.push(tileMatrix.getPixelYSize() * tileMatrix.getTileHeight());
    }

    this.widths = this.widths.sort((a, b) => a - b);
    this.heights = this.heights.sort((a, b) => a - b);

    if (this.geoPackage.getTileMatrixSetDao().getContents(tileMatrixSet) == null) {
      throw new GeoPackageException('TileMatrixSet ' + tileMatrixSet.getId() + ' has null Contents');
    }
    if (this.geoPackage.getTileMatrixSetDao().getSrs(tileMatrixSet.getSrsId()) == null) {
      throw new GeoPackageException('TileMa trixSet ' + tileMatrixSet.getId() + ' has null SpatialReferenceSystem');
    }
    this.webZoomToGeoPackageZooms = new Map<number, number>();
    this.setWebMapZoomLevels();
  }

  webZoomToGeoPackageZoom(webZoom: number): number {
    return this.determineGeoPackageZoomLevel(webZoom);
  }

  setWebMapZoomLevels(): void {
    const totalTileWidth = this.tileMatrixSet.getMaxX() - this.tileMatrixSet.getMinX();
    const totalTileHeight = this.tileMatrixSet.getMaxY() - this.tileMatrixSet.getMinY();

    let transform;
    try {
      transform = new ProjectionTransform(this.projection, Projections.getWGS84Projection());
    } catch (e) {
      console.error('Failed to create a projection transformation.');
      transform = null;
    }

    for (let i = 0; i < this.tileMatrices.length; i++) {
      const tileMatrix = this.tileMatrices[i];
      const singleTileWidth = totalTileWidth / tileMatrix.getMatrixWidth();
      const singleTileHeight = totalTileHeight / tileMatrix.getMatrixHeight();
      const tileBox = new BoundingBox(
        this.tileMatrixSet.getMinX(),
        this.tileMatrixSet.getMinY(),
        this.tileMatrixSet.getMinX() + singleTileWidth,
        this.tileMatrixSet.getMinY() + singleTileHeight,
      );
      if (transform != null) {
        const ne = transform.transform(tileBox.getMaxLongitude(), tileBox.getMaxLatitude());
        const sw = transform.transform(tileBox.getMinLongitude(), tileBox.getMinLatitude());
        const width = ne[0] - sw[0];
        const zoom = Math.ceil(Math.log2(360 / width));
        this.webZoomToGeoPackageZooms.set(zoom, tileMatrix.getZoomLevel());
      }

    }
  }

  determineGeoPackageZoomLevel(zoom: number): number {
    return this.webZoomToGeoPackageZooms.get(zoom);
  }

  /**
   * {@inheritDoc}
   */
  public getBoundingBox(): BoundingBox {
    return this.tileMatrixSet.getBoundingBox();
  }

  /**
   * {@inheritDoc}
   */
  public getBoundingBoxWithProjection(projection: Projection): BoundingBox {
    return this.geoPackage.getTileMatrixSetDao().getBoundingBoxWithProjection(this.tileMatrixSet, projection);
  }

  /**
   * Get the tile grid of the zoom level
   * @param  {Number} zoomLevel zoom level
   * @return {TileGrid}           tile grid at zoom level, null if no tile matrix at zoom level
   */
  getTileGridWithZoomLevel(zoomLevel: number): TileGrid {
    let tileGrid;
    const tileMatrix = this.getTileMatrix(zoomLevel);
    if (tileMatrix) {
      tileGrid = new TileGrid(0, 0, ~~tileMatrix.getMatrixWidth() - 1, ~~tileMatrix.getMatrixHeight() - 1);
    }
    return tileGrid;
  }

  /**
   * Get the bounding box of tiles
   * @param zoomLevel zoom level
   * @return bounding box of zoom level, or null if no tiles
   */
  public getBoundingBoxAtZoomLevel(zoomLevel): BoundingBox {
    let boundingBox = null;
    const tileMatrix = this.getTileMatrix(zoomLevel);
    if (tileMatrix != null) {
      const tileGrid = this.queryForTileGrid(zoomLevel);
      if (tileGrid != null) {
        const matrixSetBoundingBox = this.getBoundingBox();
        boundingBox = TileBoundingBoxUtils.getBoundingBoxWithTileMatrixAndTileGrid(
          matrixSetBoundingBox,
          tileMatrix,
          tileGrid,
        );
      }
    }
    return boundingBox;
  }

  /**
   * Get the bounding box of tiles at the zoom level
   * @param zoomLevel zoom level
   * @param projection desired projection
   * @return bounding box of zoom level, or nil if no tiles
   */
  public getBoundingBoxAtZoomLevelWithProjection(zoomLevel: number, projection: Projection): BoundingBox {
    let boundingBox = this.getBoundingBoxAtZoomLevel(zoomLevel);
    if (boundingBox != null) {
      const transform = GeometryTransform.create(this.projection, projection);
      boundingBox = boundingBox.transform(transform);
    }
    return boundingBox;
  }

  /**
   * Get the tile grid of the zoom level
   *
   * @param zoomLevel
   *            zoom level
   * @return tile grid at zoom level, null if not tile matrix at zoom level
   */
  public getTileGrid(zoomLevel: number): TileGrid {
    let tileGrid = null;
    const tileMatrix = this.getTileMatrix(zoomLevel);
    if (tileMatrix != null) {
      tileGrid = new TileGrid(0, 0, tileMatrix.getMatrixWidth() - 1, tileMatrix.getMatrixHeight() - 1);
    }
    return tileGrid;
  }

  /**
   * Adjust the tile matrix lengths if needed. Check if the tile matrix width
   * and height need to expand to account for pixel * number of pixels fitting
   * into the tile matrix lengths
   */
  public adjustTileMatrixLengths(): void {
    TileDaoUtils.adjustTileMatrixLengths(this.tileMatrixSet, this.tileMatrices);
  }

  /**
   * {@inheritDoc}
   */
  public newRow(): TileRow {
    return new TileRow(this.getTable());
  }

  /**
   * Get the Tile connection
   * @return tile connection
   */
  public getTileDb(): TileConnection {
    return this.tileDb;
  }

  /**
   * Get the tile matrix set
   *
   * @return tile matrix set
   */
  public getTileMatrixSet(): TileMatrixSet {
    return this.tileMatrixSet;
  }

  /**
   * Get the tile matrices
   *
   * @return tile matrices
   */
  public getTileMatrices(): TileMatrix[] {
    return this.tileMatrices;
  }

  /**
   * Get the zoom levels
   * @return zoom level set
   */
  public getZoomLevels(): number[] {
    return Object.keys(this.zoomLevelToTileMatrix).map(key => Number.parseInt(key));
  }

  /**
   * Get the tile matrix at the zoom level
   * @param zoomLevel zoom level
   * @return tile matrix
   */
  public getTileMatrix(zoomLevel: number): TileMatrix {
    let tileMatrix = null;
    if (zoomLevel != null) {
      tileMatrix = this.zoomLevelToTileMatrix[zoomLevel];
    }
    return tileMatrix;
  }

  /**
   * Get the tile matrix at the min (first) zoom
   * @return tile matrix
   */
  public getTileMatrixAtMinZoom(): TileMatrix {
    const minZoom = Math.min(...Object.keys(this.zoomLevelToTileMatrix).map(key => Number.parseInt(key)));
    return this.zoomLevelToTileMatrix[minZoom];
  }

  /**
   * Get the Spatial Reference System
   * @return srs
   */
  public getSrs(): SpatialReferenceSystem {
    return this.geoPackage.getSpatialReferenceSystemDao().queryForIdWithKey(this.tileMatrixSet.getSrsId());
  }

  /**
   * Get the Spatial Reference System id
   * @return srs id
   */
  public getSrsId(): number {
    return this.tileMatrixSet.getSrsId();
  }

  /**
   * Get the min zoom
   * @return min zoom
   */
  public getMinZoom(): number {
    return this.minZoom;
  }

  /**
   * Get the max zoom
   * @return max zoom
   */
  public getMaxZoom(): number {
    return this.maxZoom;
  }

  /**
   * Query for a Tile
   * @param column column
   * @param row row
   * @param zoomLevel zoom level
   * @return tile row
   */
  public queryForTile(column: number, row: number, zoomLevel: number): TileRow {
    const fieldValues = new FieldValues();
    fieldValues.addFieldValue(TileTable.COLUMN_TILE_COLUMN, column);
    fieldValues.addFieldValue(TileTable.COLUMN_TILE_ROW, row);
    fieldValues.addFieldValue(TileTable.COLUMN_ZOOM_LEVEL, zoomLevel);
    const resultSet = this.queryForFieldValues(fieldValues);
    let tileRow = null;
    if (resultSet.moveToNext()) {
      tileRow = resultSet.getRow();
    }
    resultSet.close();
    return tileRow;
  }

  /**
   * Query for Tiles at a zoom level
   * @param zoomLevel zoom level
   * @return tile result set, should be closed
   */
  public queryForTiles(zoomLevel: number): TileResultSet {
    return this.queryForEq(TileTable.COLUMN_ZOOM_LEVEL, zoomLevel);
  }

  /**
   * Query for Tiles at a zoom level in descending row and column order
   * @param zoomLevel zoom level
   * @return tile result set, should be closed
   */
  public queryForTilesDescending(zoomLevel: number): TileResultSet {
    return this.queryForEq(
      TileTable.COLUMN_ZOOM_LEVEL,
      zoomLevel,
      null,
      null,
      TileTable.COLUMN_TILE_ROW + ' DESC, ' + TileTable.COLUMN_TILE_COLUMN + ' DESC',
    );
  }

  /**
   * Query for Tiles at a zoom level and column
   * @param column column
   * @param zoomLevel zoom level
   * @return tile result set
   */
  public queryForTilesInColumn(column: number, zoomLevel: number): TileResultSet {
    const fieldValues = new FieldValues();
    fieldValues.addFieldValue(TileTable.COLUMN_TILE_COLUMN, column);
    fieldValues.addFieldValue(TileTable.COLUMN_ZOOM_LEVEL, zoomLevel);
    return this.queryForFieldValues(fieldValues);
  }

  /**
   * Query for Tiles at a zoom level and row
   *
   * @param row row
   * @param zoomLevel zoom level
   * @return tile result set
   */
  public queryForTilesInRow(row: number, zoomLevel: number): TileResultSet {
    const fieldValues = new FieldValues();
    fieldValues.addFieldValue(TileTable.COLUMN_TILE_ROW, row);
    fieldValues.addFieldValue(TileTable.COLUMN_ZOOM_LEVEL, zoomLevel);
    return this.queryForFieldValues(fieldValues);
  }

  /**
   * Get the zoom level for the provided width and height in the default units
   * @param length in default units
   * @return zoom level
   */
  public getZoomLevel(length: number): number {
    return TileDaoUtils.getZoomLevelForLength(this.widths, this.heights, this.tileMatrices, length);
  }

  /**
   * Get the zoom level for the provided width and height in the default units
   *
   * @param width in default units
   * @param height in default units
   * @return zoom level
   */
  public getZoomLevelForWidthAndHeight(width: number, height: number): number {
    return TileDaoUtils.getZoomLevelForWidthAndHeight(this.widths, this.heights, this.tileMatrices, width, height);
  }

  /**
   * Get the closest zoom level for the provided width and height in the
   * default units
   * @param length in default units
   * @return zoom level
   */
  public getClosestZoomLevel(length: number): number {
    return TileDaoUtils.getClosestZoomLevelForLength(this.widths, this.heights, this.tileMatrices, length);
  }

  /**
   * Get the closest zoom level for the provided width and height in the
   * default units
   *
   * @param width in default units
   * @param height in default units
   * @return zoom level
   */
  public getClosestZoomLevelForWidthAndHeight(width: number, height: number): number {
    return TileDaoUtils.getClosestZoomLevelForWidthAndHeight(
      this.widths,
      this.heights,
      this.tileMatrices,
      width,
      height,
    );
  }

  /**
   * Get the approximate zoom level for the provided length in the default
   * units. Tiles may or may not exist for the returned zoom level. The
   * approximate zoom level is determined using a factor of 2 from the zoom
   * levels with tiles.
   * @param length length in default units
   * @return approximate zoom level
   */
  public getApproximateZoomLevel(length: number): number {
    return TileDaoUtils.getApproximateZoomLevelForLength(this.widths, this.heights, this.tileMatrices, length);
  }

  /**
   * Get the approximate zoom level for the provided width and height in the
   * default units. Tiles may or may not exist for the returned zoom level.
   * The approximate zoom level is determined using a factor of 2 from the
   * zoom levels with tiles.
   * @param width width in default units
   * @param height height in default units
   * @return approximate zoom level
   */
  public getApproximateZoomLevelForWidthAndHeight(width: number, height: number): number {
    return TileDaoUtils.getApproximateZoomLevelForWidthAndHeight(
      this.widths,
      this.heights,
      this.tileMatrices,
      width,
      height,
    );
  }

  /**
   * Get the max length in default units that contains tiles
   * @return max distance length with tiles
   */
  public getMaxLength(): number {
    return TileDaoUtils.getMaxLengthForTileWidthsAndHeights(this.widths, this.heights);
  }

  /**
   * Get the min length in default units that contains tiles
   * @return min distance length with tiles
   */
  public getMinLength(): number {
    return TileDaoUtils.getMinLengthForTileWidthsAndHeights(this.widths, this.heights);
  }

  /**
   * Query by tile grid and zoom level
   * @param tileGrid tile grid
   * @param zoomLevel zoom level
   * @param orderBy order by
   * @return result set from query or null if the zoom level tile ranges do not overlap the bounding box
   */
  public queryByTileGrid(tileGrid: TileGrid, zoomLevel: number, orderBy?: string): TileResultSet {
    let tileResultSet = null;
    if (tileGrid != null) {
      const where = [];
      where.push(this.buildWhere(TileTable.COLUMN_ZOOM_LEVEL, zoomLevel));
      where.push(' AND ');
      where.push(this.buildWhereWithOp(TileTable.COLUMN_TILE_COLUMN, tileGrid.getMinX(), '>='));
      where.push(' AND ');
      where.push(this.buildWhereWithOp(TileTable.COLUMN_TILE_COLUMN, tileGrid.getMaxX(), '<='));
      where.push(' AND ');
      where.push(this.buildWhereWithOp(TileTable.COLUMN_TILE_ROW, tileGrid.getMinY(), '>='));
      where.push(' AND ');
      where.push(this.buildWhereWithOp(TileTable.COLUMN_TILE_ROW, tileGrid.getMaxY(), '<='));
      const whereArgs = [zoomLevel, tileGrid.getMinX(), tileGrid.getMaxX(), tileGrid.getMinY(), tileGrid.getMaxY()];
      tileResultSet = this.query(where.join(''), whereArgs, null, null, orderBy);
    }

    return tileResultSet;
  }

  /**
   * Query for the bounding
   * @param zoomLevel zoom level
   * @return tile grid of tiles at the zoom level
   */
  public queryForTileGrid(zoomLevel: number): TileGrid {
    const where = this.buildWhere(TileTable.COLUMN_ZOOM_LEVEL, zoomLevel);
    const whereArgs = [zoomLevel];

    const minX = this.min(TileTable.COLUMN_TILE_COLUMN, where, whereArgs);
    const maxX = this.max(TileTable.COLUMN_TILE_COLUMN, where, whereArgs);
    const minY = this.min(TileTable.COLUMN_TILE_ROW, where, whereArgs);
    const maxY = this.max(TileTable.COLUMN_TILE_ROW, where, whereArgs);

    let tileGrid = null;
    if (minX != null && maxX != null && minY != null && maxY != null) {
      tileGrid = new TileGrid(minX, minY, maxX, maxY);
    }

    return tileGrid;
  }

  /**
   * Delete a Tile
   * @param column column
   * @param row row
   * @param zoomLevel zoom level
   * @return number deleted, should be 0 or 1
   */
  public deleteTile(column: number, row: number, zoomLevel: number): number {
    const where = [];
    where.push(this.buildWhere(TileTable.COLUMN_ZOOM_LEVEL, zoomLevel));
    where.push(' AND ');
    where.push(this.buildWhere(TileTable.COLUMN_TILE_COLUMN, column));
    where.push(' AND ');
    where.push(this.buildWhere(TileTable.COLUMN_TILE_ROW, row));
    const whereArgs = [zoomLevel, column, row];
    return this.delete(where.join(''), whereArgs);
  }

  /**
   * Count of Tiles at a zoom level
   *
   * @param zoomLevel
   *            zoom level
   * @return count
   */
  public countAtZoomLevel(zoomLevel: number): number {
    const where = this.buildWhere(TileTable.COLUMN_ZOOM_LEVEL, zoomLevel);
    const whereArgs = [zoomLevel];
    return super.count(where, whereArgs);
  }

  /**
   * Determine if the tiles are in the XYZ tile coordinate format
   *
   * @return true if XYZ tile format
   */
  public isXYZTiles(): boolean {
    // Convert the bounding box to wgs84
    const boundingBox = this.tileMatrixSet.getBoundingBox();
    const wgs84BoundingBox = boundingBox.transform(
      GeometryTransform.create(this.projection, ProjectionConstants.EPSG_WORLD_GEODETIC_SYSTEM),
    );

    let xyzTiles = false;

    // Verify the bounds are the entire world
    if (
      wgs84BoundingBox.getMinLatitude() <= ProjectionConstants.WEB_MERCATOR_MIN_LAT_RANGE &&
      wgs84BoundingBox.getMaxLatitude() >= ProjectionConstants.WEB_MERCATOR_MAX_LAT_RANGE &&
      wgs84BoundingBox.getMinLongitude() <= -ProjectionConstants.WGS84_HALF_WORLD_LON_WIDTH &&
      wgs84BoundingBox.getMaxLongitude() >= ProjectionConstants.WGS84_HALF_WORLD_LON_WIDTH
    ) {
      xyzTiles = true;

      // Verify each tile matrix is the correct width and height
      for (const tileMatrix of this.tileMatrices) {
        const zoomLevel = tileMatrix.getZoomLevel();
        const tilesPerSide = TileBoundingBoxUtils.tilesPerSide(zoomLevel);
        if (tileMatrix.getMatrixWidth() != tilesPerSide || tileMatrix.getMatrixHeight() != tilesPerSide) {
          xyzTiles = false;
          break;
        }
      }
    }

    return xyzTiles;
  }

  /**
   * Get the map zoom level range
   * @return map zoom level range, min at index 0, max at index 1
   */
  public getMapZoomRange(): number[] {
    return TileDaoUtils.getMapZoomRange(this, this.tileMatrixSet, this.tileMatrices);
  }

  /**
   * Get the map min zoom level
   *
   * @return map min zoom level
   */
  public getMapMinZoom(): number {
    return TileDaoUtils.getMapMinZoom(this, this.tileMatrixSet, this.tileMatrices);
  }

  /**
   * Get the map max zoom level
   *
   * @return map max zoom level
   */
  public getMapMaxZoom(): number {
    return TileDaoUtils.getMapMaxZoom(this, this.tileMatrixSet, this.tileMatrices);
  }

  /**
   * Get the map zoom level from the tile matrix
   *
   * @param tileMatrix tile matrix
   * @return map zoom level
   */
  public getMapZoomWithTileMatrix(tileMatrix: TileMatrix): number {
    return TileDaoUtils.getMapZoomWithTileMatrixSetAndTileMatrix(this, this.tileMatrixSet, tileMatrix);
  }

  /**
   * Get the map zoom level from the tile matrix zoom level
   *
   * @param zoomLevel tile matrix zoom level
   * @return map zoom level
   */
  public getMapZoom(zoomLevel: number): number {
    return this.getMapZoomWithTileMatrix(this.getTileMatrix(zoomLevel));
  }

  /**
   * Get a tile matrix set DAO
   * @return tile matrix set DAO
   */
  public getTileMatrixSetDao(): TileMatrixSetDao {
    return this.geoPackage.getTileMatrixSetDao();
  }

  /**
   * Get a tile matrix DAO
   *
   * @return tile matrix DAO
   */
  public getTileMatrixDao(): TileMatrixDao {
    return this.geoPackage.getTileMatrixDao();
  }
}
