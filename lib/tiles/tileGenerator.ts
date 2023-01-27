import { Projection, ProjectionConstants, Projections } from '@ngageoint/projections-js';
import { BoundingBox } from '../boundingBox';
import { TileScaling } from '../extension/nga/scale/tileScaling';
import { GeoPackageException } from '../geoPackageException';
import { GeoPackageZoomLevelProgress } from '../io/geoPackageZoomLevelProgress';
import { TileGrid } from './tileGrid';
import { GeometryTransform } from '@ngageoint/simple-features-proj-js';
import { TileBoundingBoxUtils } from './tileBoundingBoxUtils';
import { TileTableMetadata } from './user/tileTableMetadata';
import { TileTableScaling } from '../extension/nga/scale/tileTableScaling';
import { TileMatrixSet } from './matrixset/tileMatrixSet';
import { TileMatrixDao } from './matrix/tileMatrixDao';
import { TileDao } from './user/tileDao';
import { Contents } from '../contents/contents';
import { TileMatrix } from './matrix/tileMatrix';
import { TileMatrixKey } from './matrix/tileMatrixKey';
import { TileTable } from './user/tileTable';
import { ImageUtils } from '../image/imageUtils';
import { ImageType } from '../image/imageType';
import type { GeoPackage } from '../geoPackage';

/**
 * Creates a set of tiles within a GeoPackage
 */
export abstract class TileGenerator {
  /**
   * GeoPackage
   */
  private readonly geoPackage: GeoPackage;

  /**
   * Table Name
   */
  private readonly tableName: string;

  /**
   * Sorted Zoom levels
   */
  private zoomLevels: number[] = [];

  /**
   * Tiles projection
   */
  protected projection: Projection;

  /**
   * Total tile count
   */
  private tileCount: number;

  /**
   * Tile grids by zoom level
   */
  private readonly tileGrids: Map<number, TileGrid> = new Map();

  /**
   * Tile bounding boxes by zoom level
   */
  private readonly tileBounds: Map<number, BoundingBox> = new Map();

  /**
   * Tile bounding box
   */
  protected boundingBox: BoundingBox;

  /**
   * Compress format
   */
  private compressFormat: ImageType;

  /**
   * Compress quality
   */
  private compressQuality: number = null;

  /**
   * GeoPackage zoom level progress
   */
  private progress: GeoPackageZoomLevelProgress;

  /**
   * True when generating tiles in XYZ tile format, false when generating
   * GeoPackage format where rows and columns do not match the XYZ row &
   * column coordinates
   */
  private xyzTiles = false;

  /**
   * Tile grid bounding box
   */
  private tileGridBoundingBox: BoundingBox;

  /**
   * Matrix height when GeoPackage tile format
   */
  private matrixHeight = 0;

  /**
   * Matrix width when GeoPackage tile format
   */
  private matrixWidth = 0;

  /**
   * Tile scaling settings
   */
  private scaling: TileScaling = null;

  /**
   * Skip existing tiles
   */
  private skipExisting = false;

  /**
   * Constructor
   *
   * @param geoPackage GeoPackage
   * @param tableName table name
   * @param boundingBox tiles bounding box
   * @param projection tiles projection
   * @param zoomLevels zoom levels
   */
  public constructor(
    geoPackage: GeoPackage,
    tableName: string,
    boundingBox: BoundingBox,
    projection: Projection,
    zoomLevels: number[],
  ) {
    geoPackage.verifyWritable();
    this.geoPackage = geoPackage;
    this.tableName = tableName;
    this.boundingBox = boundingBox;
    this.projection = projection;
    this.addZoomLevels(zoomLevels);
  }

  /**
   * Get the GeoPackage
   *
   * @return GeoPackage
   */
  public getGeoPackage(): GeoPackage {
    return this.geoPackage;
  }

  /**
   * Get the table name
   *
   * @return table name
   */
  public getTableName(): string {
    return this.tableName;
  }

  /**
   * Get the min zoom
   *
   * @return min zoom
   */
  public getMinZoom(): number {
    this.validateZoomLevels();
    return this.zoomLevels[0];
  }

  /**
   * Get the max zoom
   * @return max zoom
   */
  public getMaxZoom(): number {
    this.validateZoomLevels();
    return this.zoomLevels[this.zoomLevels.length - 1];
  }

  /**
   * Get the zoom levels (read only)
   * @return zoom levels
   */
  public getZoomLevels(): number[] {
    return this.zoomLevels.slice();
  }

  /**
   * Add a zoom level
   * @param zoomLevel zoom level
   * @return true if zoom level added
   */
  public addZoomLevel(zoomLevel): boolean {
    let added = false;
    if (this.zoomLevels.indexOf(zoomLevel) === -1) {
      this.zoomLevels.push(zoomLevel);
      this.zoomLevels = this.zoomLevels.sort();
      added = true;
    }
    return added;
  }

  /**
   * Add a range of zoom levels
   * @param minZoom min zoom level
   * @param maxZoom max zoom level
   * @return true if at least one zoom level added
   */
  public addZoomLevelRange(minZoom: number, maxZoom: number): boolean {
    let added = false;
    for (let zoomLevel = minZoom; zoomLevel <= maxZoom; zoomLevel++) {
      added = this.addZoomLevel(zoomLevel) || added;
    }
    return added;
  }

  /**
   * Add zoom levels
   * @param zoomLevels zoom levels
   * @return true if at least one zoom level added
   */
  public addZoomLevels(zoomLevels: number[]): boolean {
    let added = false;
    for (const zoomLevel of zoomLevels) {
      added = this.addZoomLevel(zoomLevel) || added;
    }
    return added;
  }

  /**
   * Get bounding box
   * @return bounding box
   */
  public getBoundingBox(): BoundingBox {
    return this.boundingBox;
  }

  /**
   * Get the bounding box, possibly expanded for the zoom level
   * @param zoom zoom level
   * @return original or expanded bounding box
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getBoundingBoxWithZoom(zoom: number): BoundingBox {
    return this.boundingBox;
  }

  /**
   * Set the compress format
   * @param compressFormat compression format
   */
  public setCompressFormat(compressFormat: ImageType): void {
    this.compressFormat = compressFormat;
  }

  /**
   * Get the compress format
   * @return compress format
   */
  public getCompressFormat(): ImageType {
    return this.compressFormat;
  }

  /**
   * Set the compress quality (0.0 to 1.0). The Compress format must be set
   * for this to be used.
   * @param compressQuality compression quality
   */
  public setCompressQuality(compressQuality: number): void {
    if (compressQuality != null && (compressQuality < 0.0 || compressQuality > 1.0)) {
      throw new GeoPackageException('Compress quality must be between 0.0 and 1.0, not: ' + compressQuality);
    }
    this.compressQuality = compressQuality;
  }

  /**
   * Get the compress quality
   * @return compress quality or null
   */
  public getCompressQuality(): number {
    return this.compressQuality;
  }

  /**
   * Set the progress tracker
   * @param progress progress tracker
   */
  public setProgress(progress: GeoPackageZoomLevelProgress): void {
    this.progress = progress;
  }

  /**
   * Get the progress tracker
   * @return progress
   */
  public getProgress(): GeoPackageZoomLevelProgress {
    return this.progress;
  }

  /**
   * Set the XYZ Tiles flag to true to generate XYZ tile format tiles. Default
   * is false
   * @param xyzTiles XYZ Tiles flag
   */
  public setXYZTiles(xyzTiles: boolean): void {
    this.xyzTiles = xyzTiles;
  }

  /**
   * Is the XYZ Tiles flag set to generate XYZ tile format tiles.
   * @return true if XYZ Tiles format, false if GeoPackage
   */
  public isXYZTiles(): boolean {
    return this.xyzTiles;
  }

  /**
   * Get the tile scaling settings
   * @return tile scaling
   */
  public getScaling(): TileScaling {
    return this.scaling;
  }

  /**
   * Set the tile scaling settings
   * @param scaling tile scaling
   */
  public setScaling(scaling: TileScaling): void {
    this.scaling = scaling;
  }

  /**
   * Is skip existing tiles on
   * @return true if skipping existing tiles
   */
  public isSkipExisting(): boolean {
    return this.skipExisting;
  }

  /**
   * Set the skip existing tiles flag
   * @param skipExisting true to skip existing tiles
   */
  public setSkipExisting(skipExisting: boolean): void {
    this.skipExisting = skipExisting;
  }

  /**
   * Get the tile count of tiles to be generated
   * @return tile count
   */
  public getTileCount(): number {
    if (this.tileCount == null) {
      this.validateZoomLevels();
      let count = 0;
      const degrees = Projections.getUnits(this.projection.toString()) === 'degrees';
      let transformToWebMercator = null;
      if (!degrees) {
        transformToWebMercator = GeometryTransform.create(this.projection, ProjectionConstants.EPSG_WEB_MERCATOR);
      }
      for (const zoom of this.zoomLevels) {
        const expandedBoundingBox = this.getBoundingBoxWithZoom(zoom);
        // Get the tile grid that includes the entire bounding box
        let tileGrid = null;
        if (degrees) {
          tileGrid = TileBoundingBoxUtils.getTileGridWGS84(expandedBoundingBox, zoom);
        } else {
          tileGrid = TileBoundingBoxUtils.getTileGridWithBoundingBoxAndZoom(
            expandedBoundingBox.transform(transformToWebMercator),
            zoom,
          );
        }
        count += tileGrid.count();
        this.tileGrids.set(zoom, tileGrid);
        this.tileBounds.set(zoom, expandedBoundingBox);
      }
      this.tileCount = count;
    }
    return this.tileCount;
  }

  /**
   * Generate the tiles
   *
   * @return tiles created
   */
  public async generateTiles(): Promise<number> {
    this.validateZoomLevels();
    const totalCount = this.getTileCount();
    // Set the max progress count
    if (this.progress != null) {
      this.progress.setMax(totalCount);
      for (const zoomGrid of Object.values(this.tileGrids)) {
        this.progress.setZoomLevelMax(zoomGrid.getKey(), zoomGrid.getValue().count());
      }
    }
    let count = 0;
    let update = false;

    // Adjust the tile matrix set and bounds
    const minZoom = this.getMinZoom();
    const maxZoom = this.getMaxZoom();
    const minZoomBoundingBox = this.tileBounds.get(minZoom);
    this.adjustBounds(minZoomBoundingBox, minZoom);
    // Create a new tile matrix or update an existing
    const tileMatrixSetDao = this.geoPackage.getTileMatrixSetDao();
    let tileMatrixSet = null;
    if (!tileMatrixSetDao.isTableExists() || !tileMatrixSetDao.idExists(this.tableName)) {
      // Create the srs if needed
      const srsDao = this.geoPackage.getSpatialReferenceSystemDao();
      const srs = srsDao.getOrCreate(this.projection);
      // Create the tile table
      this.geoPackage.createTileTableWithMetadata(
        TileTableMetadata.create(
          this.tableName,
          this.boundingBox,
          srs.getSrsId(),
          this.tileGridBoundingBox,
          srs.getSrsId(),
        ),
      );
      tileMatrixSet = tileMatrixSetDao.queryForIdWithKey(this.tableName);
    } else {
      update = true;
      // Query to get the Tile Matrix Set
      tileMatrixSet = tileMatrixSetDao.queryForIdWithKey(this.tableName);

      // Update the tile bounds between the existing and this request
      this.updateTileBounds(tileMatrixSet);
    }

    this.preTileGeneration();

    // If tile scaling is set, create the tile scaling extension entry
    if (this.scaling != null) {
      const tileTableScaling = new TileTableScaling(this.geoPackage, tileMatrixSet);
      tileTableScaling.createOrUpdate(this.scaling);
    }

    // Create the tiles
    try {
      const contents = tileMatrixSet.getContents();
      const tileMatrixDao = this.geoPackage.getTileMatrixDao();
      const tileDao = this.geoPackage.getTileDao(tileMatrixSet);

      // Create the new matrix tiles
      for (let zoom = minZoom; zoom <= maxZoom && (this.progress == null || this.progress.isActive()); zoom++) {
        if (this.zoomLevels.indexOf(zoom) !== -1) {
          let localTileGrid = null;

          // Determine the matrix width and height for XYZ format
          if (this.xyzTiles) {
            this.matrixWidth = TileBoundingBoxUtils.tilesPerSide(zoom);
            this.matrixHeight = this.matrixWidth;
          }
          // Get the local tile grid for GeoPackage format of where
          // the tiles belong
          else {
            const zoomBoundingBox = this.tileBounds.get(zoom);
            localTileGrid = TileBoundingBoxUtils.getTileGrid(
              this.tileGridBoundingBox,
              this.matrixWidth,
              this.matrixHeight,
              zoomBoundingBox,
            );
          }

          // Generate the tiles for the zoom level
          const tileGrid = this.tileGrids.get(zoom);
          count += await this.generateTilesWithZoom(
            tileMatrixDao,
            tileDao,
            contents,
            zoom,
            tileGrid,
            localTileGrid,
            this.matrixWidth,
            this.matrixHeight,
            update,
          );
        }

        if (!this.xyzTiles) {
          // Double the matrix width and height for the next level
          this.matrixWidth *= 2;
          this.matrixHeight *= 2;
        }
      }

      // Delete the table if canceled
      if (this.progress != null && !this.progress.isActive() && this.progress.cleanupOnCancel()) {
        this.geoPackage.deleteTableQuietly(this.tableName);
        count = 0;
      } else {
        // Update the contents last modified date
        contents.setLastChange(new Date());
        const contentsDao = this.geoPackage.getContentsDao();
        contentsDao.update(contents);
      }
    } catch (e) {
      this.geoPackage.deleteTableQuietly(this.tableName);
      throw e;
    }
    return count;
  }

  /**
   * Validate that at least one zoom level was specified
   */
  private validateZoomLevels(): void {
    if (this.zoomLevels.length === 0) {
      throw new GeoPackageException('At least one zoom level must be specified');
    }
  }

  /**
   * Adjust the tile matrix set and bounds
   * @param boundingBox bounding box
   * @param zoom zoom
   */
  private adjustBounds(boundingBox: BoundingBox, zoom: number): void {
    // XYZ Tile Format
    if (this.xyzTiles) {
      this.adjustXYZBounds();
    } else if (Projections.getUnits(this.projection.toString()) === 'degrees') {
      this.adjustGeoPackageBoundsWGS84(boundingBox, zoom);
    } else {
      this.adjustGeoPackageBounds(boundingBox, zoom);
    }
  }

  /**
   * Adjust the tile matrix set and web mercator bounds for XYZ tile format
   */
  private adjustXYZBounds(): void {
    // Set the tile matrix set bounding box to be the world
    const standardWgs84Box = new BoundingBox(
      -ProjectionConstants.WGS84_HALF_WORLD_LON_WIDTH,
      ProjectionConstants.WEB_MERCATOR_MIN_LAT_RANGE,
      ProjectionConstants.WGS84_HALF_WORLD_LON_WIDTH,
      ProjectionConstants.WEB_MERCATOR_MAX_LAT_RANGE,
    );
    const wgs84ToWebMercatorTransform = GeometryTransform.create(
      ProjectionConstants.EPSG_WORLD_GEODETIC_SYSTEM,
      ProjectionConstants.EPSG_WEB_MERCATOR,
    );
    this.tileGridBoundingBox = standardWgs84Box.transform(wgs84ToWebMercatorTransform);
  }

  /**
   * Adjust the tile matrix set and WGS84 bounds for GeoPackage format.
   * Determine the tile grid width and height
   *
   * @param boundingBox
   * @param zoom
   */
  private adjustGeoPackageBoundsWGS84(boundingBox: BoundingBox, zoom: number): void {
    // Get the fitting tile grid and determine the bounding box that fits it
    const tileGrid = TileBoundingBoxUtils.getTileGridWGS84(boundingBox, zoom);
    this.tileGridBoundingBox = TileBoundingBoxUtils.getWGS84BoundingBoxWithTileGridAndZoom(tileGrid, zoom);
    this.matrixWidth = tileGrid.getWidth();
    this.matrixHeight = tileGrid.getHeight();
  }

  /**
   * Adjust the tile matrix set and web mercator bounds for GeoPackage format.
   * Determine the tile grid width and height
   *
   * @param requestWebMercatorBoundingBox
   * @param zoom
   */
  private adjustGeoPackageBounds(requestWebMercatorBoundingBox: BoundingBox, zoom: number): void {
    // Get the fitting tile grid and determine the bounding box that
    // fits it
    const tileGrid = TileBoundingBoxUtils.getTileGridWithBoundingBoxAndZoom(requestWebMercatorBoundingBox, zoom);
    this.tileGridBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxWithTileGrid(tileGrid, zoom);
    this.matrixWidth = tileGrid.getWidth();
    this.matrixHeight = tileGrid.getHeight();
  }

  /**
   * Update the Content and Tile Matrix Set bounds
   *
   * @param tileMatrixSet
   * @throws java.sql.SQLException
   */
  private updateTileBounds(tileMatrixSet: TileMatrixSet): void {
    const tileDao = this.geoPackage.getTileDaoWithTileMatrixSet(tileMatrixSet);

    if (tileDao.isXYZTiles()) {
      if (!this.xyzTiles) {
        // If adding GeoPackage tiles to a XYZ Tile format, add them
        // as XYZ tiles
        this.xyzTiles = true;
        this.adjustXYZBounds();
      }
    } else if (this.xyzTiles) {
      // Can't add XYZ formatted tiles to GeoPackage tiles
      throw new GeoPackageException(
        'Can not add XYZ formatted tiles to ' + this.tableName + ' which already contains GeoPackage formatted tiles',
      );
    }

    const tileMatrixProjection = this.geoPackage.getTileMatrixSetDao().getProjection(tileMatrixSet);
    if (!tileMatrixProjection.equalsProjection(this.projection)) {
      throw new GeoPackageException(
        'Can not update tiles projected at ' +
          tileMatrixProjection.getCode() +
          ' with tiles projected at ' +
          this.projection.getCode(),
      );
    }

    const contents = this.geoPackage.getTileMatrixSetDao().getContents(tileMatrixSet);
    const contentsProjection = this.geoPackage.getContentsDao().getProjection(contents);

    // Combine the existing content and request bounding boxes
    const previousContentsBoundingBox = contents.getBoundingBox();
    if (previousContentsBoundingBox != null) {
      const transformProjectionToContents = GeometryTransform.create(this.projection, contentsProjection);
      let contentsBoundingBox = this.boundingBox;
      if (!this.projection.equalsProjection(contentsProjection)) {
        contentsBoundingBox = contentsBoundingBox.transform(transformProjectionToContents);
      }
      contentsBoundingBox = contentsBoundingBox.union(previousContentsBoundingBox);

      // Update the contents if modified
      if (!contentsBoundingBox.equals(previousContentsBoundingBox)) {
        contents.setBoundingBox(contentsBoundingBox);
        const contentsDao = this.geoPackage.getContentsDao();
        contentsDao.update(contents);
      }
    }

    // If updating GeoPackage format tiles, all existing metadata and tile
    // rows needs to be adjusted
    if (!this.xyzTiles) {
      const previousTileMatrixSetBoundingBox = tileMatrixSet.getBoundingBox();

      // Adjust the bounds to include the request and existing bounds
      const transformProjectionToTileMatrixSet = GeometryTransform.create(this.projection, tileMatrixProjection);
      const sameProjection = this.projection.equalsProjection(tileMatrixProjection);
      const minZoom = this.getMinZoom();
      let updateBoundingBox = this.tileBounds.get(minZoom);
      if (!sameProjection) {
        updateBoundingBox = updateBoundingBox.transform(transformProjectionToTileMatrixSet);
      }
      const minNewOrUpdateZoom = Math.min(minZoom, tileDao.getMinZoom());
      this.adjustBounds(updateBoundingBox, minNewOrUpdateZoom);

      // Update the tile matrix set if modified
      let updateTileGridBoundingBox = this.tileGridBoundingBox;
      if (!sameProjection) {
        updateTileGridBoundingBox = updateTileGridBoundingBox.transform(transformProjectionToTileMatrixSet);
      }
      if (!previousTileMatrixSetBoundingBox.equals(updateTileGridBoundingBox)) {
        updateTileGridBoundingBox = updateTileGridBoundingBox.union(previousTileMatrixSetBoundingBox);
        this.adjustBounds(updateTileGridBoundingBox, minNewOrUpdateZoom);
        updateTileGridBoundingBox = this.tileGridBoundingBox;
        if (!sameProjection) {
          updateTileGridBoundingBox = updateTileGridBoundingBox.transform(transformProjectionToTileMatrixSet);
        }
        tileMatrixSet.setBoundingBox(updateTileGridBoundingBox);
        const tileMatrixSetDao = this.geoPackage.getTileMatrixSetDao();
        tileMatrixSetDao.update(tileMatrixSet);
      }

      const tileMatrixDao = this.geoPackage.getTileMatrixDao();

      // Adjust the tile matrix metadata and tile rows at each existing
      // zoom level
      for (let zoom = tileDao.getMinZoom(); zoom <= tileDao.getMaxZoom(); zoom++) {
        const tileMatrix = tileDao.getTileMatrix(zoom);
        if (tileMatrix != null) {
          // Determine the new width and height at this level
          const adjustment = Math.pow(2, zoom - minNewOrUpdateZoom);
          const zoomMatrixWidth = this.matrixWidth * adjustment;
          const zoomMatrixHeight = this.matrixHeight * adjustment;

          // Get the zoom level tile rows, starting with highest rows
          // and columns so when updating we avoid constraint
          // violations
          const tileResultSet = tileDao.queryForTilesDescending(zoom);
          // Update each tile row at this zoom level
          while (tileResultSet.moveToNext()) {
            const tileRow = tileResultSet.getRow();

            // Get the bounding box of the existing tile
            const tileBoundingBox = TileBoundingBoxUtils.getBoundingBoxWithTileMatrix(
              previousTileMatrixSetBoundingBox,
              tileMatrix,
              tileRow.getTileColumn(),
              tileRow.getTileRow(),
            );

            // Get the mid lat and lon to find the new tile row
            // and column
            const midLatitude =
              tileBoundingBox.getMinLatitude() +
              (tileBoundingBox.getMaxLatitude() - tileBoundingBox.getMinLatitude()) / 2.0;
            const midLongitude =
              tileBoundingBox.getMinLongitude() +
              (tileBoundingBox.getMaxLongitude() - tileBoundingBox.getMinLongitude()) / 2.0;

            // Get the new tile row and column with regards to
            // the new bounding box
            const newTileRow = TileBoundingBoxUtils.getTileRow(this.tileGridBoundingBox, zoomMatrixHeight, midLatitude);
            const newTileColumn = TileBoundingBoxUtils.getTileColumn(
              this.tileGridBoundingBox,
              zoomMatrixWidth,
              midLongitude,
            );

            // Update the tile row
            if (tileRow.getTileRow() != newTileRow || tileRow.getTileColumn() != newTileColumn) {
              tileRow.setTileRow(newTileRow);
              tileRow.setTileColumn(newTileColumn);
              tileDao.update(tileRow);
            }
          }

          // Calculate the pixel size
          const pixelXSize =
            (this.tileGridBoundingBox.getMaxLongitude() - this.tileGridBoundingBox.getMinLongitude()) /
            zoomMatrixWidth /
            tileMatrix.getTileWidth();
          const pixelYSize =
            (this.tileGridBoundingBox.getMaxLatitude() - this.tileGridBoundingBox.getMinLatitude()) /
            zoomMatrixHeight /
            tileMatrix.getTileHeight();

          // Update the tile matrix
          tileMatrix.setMatrixWidth(zoomMatrixWidth);
          tileMatrix.setMatrixHeight(zoomMatrixHeight);
          tileMatrix.setPixelXSize(pixelXSize);
          tileMatrix.setPixelYSize(pixelYSize);

          tileMatrixDao.update(tileMatrix);
        }
      }

      // Adjust the width and height to the min zoom level of the request
      if (minNewOrUpdateZoom < minZoom) {
        const adjustment = Math.pow(2, minZoom - minNewOrUpdateZoom);
        this.matrixWidth *= adjustment;
        this.matrixHeight *= adjustment;
      }
    }
  }

  /**
   * Close the GeoPackage
   */
  public close(): void {
    if (this.geoPackage != null) {
      this.geoPackage.close();
    }
  }

  /**
   * Generate the tiles for the zoom level
   *
   * @param tileMatrixDao
   * @param tileDao
   * @param contents
   * @param zoomLevel
   * @param tileGrid
   * @param localTileGrid
   * @param matrixWidth
   * @param matrixHeight
   * @param update
   * @return tile count
   * @throws java.sql.SQLException
   * @throws java.io.IOException
   */
  private async generateTilesWithZoom(
    tileMatrixDao: TileMatrixDao,
    tileDao: TileDao,
    contents: Contents,
    zoomLevel: number,
    tileGrid: TileGrid,
    localTileGrid: TileGrid,
    matrixWidth: number,
    matrixHeight: number,
    update: boolean,
  ): Promise<number> {
    let count = 0;
    let tileWidth = null;
    let tileHeight = null;
    let existingTiles: Map<number, number[]> = null;
    if (update && this.skipExisting) {
      existingTiles = new Map();
      const tileResultSet = tileDao.queryForTiles(zoomLevel);
      while (tileResultSet.moveToNext()) {
        const column = tileResultSet.getValue(TileTable.COLUMN_TILE_COLUMN) as number;
        const row = tileResultSet.getValue(TileTable.COLUMN_TILE_ROW) as number;
        let columnRows = existingTiles.get(column);
        if (columnRows == null) {
          columnRows = [];
          existingTiles.set(column, columnRows);
        }
        columnRows.push(row);
      }
      if (Object.keys(existingTiles).length === 0) {
        existingTiles = null;
      }
    }

    // Download and create the tile and each coordinate
    for (let x = tileGrid.getMinX(); x <= tileGrid.getMaxX(); x++) {
      // Check if the progress has been canceled
      if (this.progress != null && !this.progress.isActive()) {
        break;
      }

      let tileColumn = x;
      // Update the column to the local tile grid location
      if (localTileGrid != null) {
        tileColumn = x - tileGrid.getMinX() + localTileGrid.getMinX();
      }

      let existingColumnRows = null;
      if (existingTiles != null) {
        existingColumnRows = existingTiles.get(tileColumn);
      }

      for (let y = tileGrid.getMinY(); y <= tileGrid.getMaxY(); y++) {
        // Check if the progress has been canceled
        if (this.progress != null && !this.progress.isActive()) {
          break;
        }

        let tileRow = y;
        // Update the row to the local tile grid location
        if (localTileGrid != null) {
          tileRow = y - tileGrid.getMinY() + localTileGrid.getMinY();
        }

        let createTile = true;
        if (existingColumnRows != null) {
          createTile = !existingColumnRows.contains(tileRow);
        }

        if (createTile) {
          try {
            // Create the tile
            let tileBytes = this.createTile(zoomLevel, x, y);

            if (tileBytes != null && tileBytes.length > 0) {
              let image = null;

              // Compress the image
              if (this.compressFormat != null) {
                image = ImageUtils.getImage(tileBytes);
                if (image != null) {
                  tileBytes = await ImageUtils.writeImageToBytes(image, this.compressFormat, this.compressQuality);
                }
              }

              // Create a new tile row
              const newRow = tileDao.newRow();
              newRow.setZoomLevel(zoomLevel);

              // If an update, delete an existing row
              if (update) {
                tileDao.deleteTile(tileColumn, tileRow, zoomLevel);
              }

              newRow.setTileColumn(tileColumn);
              newRow.setTileRow(tileRow);
              newRow.setTileData(tileBytes);
              tileDao.create(newRow);

              count++;

              // Determine the tile width and height
              if (tileWidth == null) {
                if (image == null) {
                  image = ImageUtils.getImage(tileBytes);
                }
                if (image != null) {
                  tileWidth = image.getWidth();
                  tileHeight = image.getHeight();
                }
              }
            }
          } catch (e) {
            console.warn('Failed to create tile. Zoom: ' + zoomLevel + ', x: ' + x + ', y: ' + y);
            // Skip this tile, don't increase count
          }
        }

        // Update the progress count, even on failures
        if (this.progress != null) {
          this.progress.addZoomLevelProgress(zoomLevel, 1);
          this.progress.addProgress(1);
        }
      }
    }

    // If none of the tiles were translated into a bitmap with dimensions delete them
    if ((tileWidth == null || tileHeight == null) && existingTiles == null) {
      count = 0;
      const where = [];
      where.push(tileDao.buildWhere(TileTable.COLUMN_ZOOM_LEVEL, zoomLevel));
      where.push(' AND ');
      where.push(tileDao.buildWhereWithOp(TileTable.COLUMN_TILE_COLUMN, tileGrid.getMinX(), '>='));
      where.push(' AND ');
      where.push(tileDao.buildWhereWithOp(TileTable.COLUMN_TILE_COLUMN, tileGrid.getMaxX(), '<='));
      where.push(' AND ');
      where.push(tileDao.buildWhereWithOp(TileTable.COLUMN_TILE_ROW, tileGrid.getMinY(), '>='));
      where.push(' AND ');
      where.push(tileDao.buildWhereWithOp(TileTable.COLUMN_TILE_ROW, tileGrid.getMaxY(), '<='));
      const whereArgs = tileDao.buildWhereArgs([
        zoomLevel,
        tileGrid.getMinX(),
        tileGrid.getMaxX(),
        tileGrid.getMinY(),
        tileGrid.getMaxY(),
      ]);
      tileDao.delete(where.join(''), whereArgs);
    } else {
      // Check if the tile matrix already exists
      let create = true;
      if (update) {
        create = !tileMatrixDao.idExists(new TileMatrixKey(this.tableName, zoomLevel));
      }
      // Create the tile matrix
      if (create) {
        // Calculate meters per pixel
        const pixelXSize =
          (this.tileGridBoundingBox.getMaxLongitude() - this.tileGridBoundingBox.getMinLongitude()) /
          matrixWidth /
          tileWidth;
        const pixelYSize =
          (this.tileGridBoundingBox.getMaxLatitude() - this.tileGridBoundingBox.getMinLatitude()) /
          matrixHeight /
          tileHeight;
        // Create the tile matrix for this zoom level
        const tileMatrix = new TileMatrix();
        tileMatrix.setTableName(contents.getId());
        tileMatrix.setZoomLevel(zoomLevel);
        tileMatrix.setMatrixWidth(matrixWidth);
        tileMatrix.setMatrixHeight(matrixHeight);
        tileMatrix.setTileWidth(tileWidth);
        tileMatrix.setTileHeight(tileHeight);
        tileMatrix.setPixelXSize(pixelXSize);
        tileMatrix.setPixelYSize(pixelYSize);
        tileMatrixDao.create(tileMatrix);
      }
    }

    return count;
  }

  /**
   * Called after set up and right before tile generation starts for the first
   * zoom level
   */
  protected abstract preTileGeneration(): void;

  /**
   * Create the tile
   *
   * @param z zoom level
   * @param x x coordinate
   * @param y  y coordinate
   * @return tile bytes
   */
  protected abstract createTile(z: number, x: number, y: number): Buffer | Uint8Array;
}
