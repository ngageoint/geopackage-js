import { Projection, Projections, ProjectionTransform } from '@ngageoint/projections-js';
import { GeometryTransform } from '@ngageoint/simple-features-proj-js';
import { BoundingBox } from '../boundingBox';
import { Canvas } from '../canvas/canvas';
import { TileScaling } from '../extension/nga/scale/tileScaling';
import { GeoPackageException } from '../geoPackageException';
import { GeoPackageTile } from './geoPackageTile';
import { TileMatrix } from './matrix/tileMatrix';
import { TileMatrixSet } from './matrixset/tileMatrixSet';
import { TileDao } from './user/tileDao';
import { TileResultSet } from './user/tileResultSet';
import { TileBoundingBoxUtils } from './tileBoundingBoxUtils';
import { ImageUtils } from '../image/imageUtils';
import { GeoPackageImage } from '../image/geoPackageImage';
import { TileScalingType } from '../extension/nga/scale/tileScalingType';
import { ImageType } from '../image/imageType';

/**
 * Tile Creator, creates a tile from a tile matrix to the desired projection
 */
export class TileCreator {
  /**
   * Tile DAO
   */
  private readonly tileDao: TileDao;

  /**
   * Tile width
   */
  private readonly width: number;

  /**
   * Tile height
   */
  private readonly height: number;

  /**
   * Tile Matrix Set
   */
  private readonly tileMatrixSet: TileMatrixSet;

  /**
   * Projection of the requests
   */
  private requestProjection: Projection;

  /**
   * Projection of the tiles
   */
  private readonly tilesProjection: Projection;

  /**
   * Tile Set bounding box
   */
  private readonly tileSetBoundingBox: BoundingBox;

  /**
   * Flag indicating if the tile and request projections are the same
   */
  private sameProjection: boolean;

  /**
   * Flag indicating if the tile and request projection units are the same
   */
  private sameUnit: boolean;

  /**
   * Tile Scaling options
   */
  private scaling: TileScaling;

  /**
   * Image format
   */
  private readonly imageFormat: string;

  /**
   * Constructor
   *
   * @param tileDao tile dao
   * @param width request width
   * @param height request height
   * @param imageFormat image format
   */
  public constructor(tileDao: TileDao, width: number, height: number, imageFormat: string) {
    this.tileDao = tileDao;
    this.width = width;
    this.height = height;
    this.imageFormat = imageFormat;

    if (imageFormat == null && (this.width != null || this.height != null)) {
      throw new GeoPackageException(
        'The width and height request size can not be specified when requesting raw tiles (no image format specified)',
      );
    }

    this.requestProjection = this.tileDao.getProjection();
    this.tileMatrixSet = this.tileDao.getTileMatrixSet();
    this.tilesProjection = this.tileDao.getProjection();
    this.tileSetBoundingBox = this.tileMatrixSet.getBoundingBox();

    // Check if the projections are the same or have the same units
    this.sameProjection = this.requestProjection.equalsProjection(this.tilesProjection);
    this.sameUnit =
      Projections.getUnits(this.requestProjection.toString()) === Projections.getUnits(this.tilesProjection.toString());

    if (imageFormat == null && !this.sameProjection) {
      throw new GeoPackageException(
        'The requested projection must be the same as the stored tiles when requesting raw tiles (no image format specified)',
      );
    }
  }

  /**
   * Sets the request projection
   * @param requestProjection
   */
  public setRequestProjection(requestProjection: Projection): void {
    this.requestProjection = requestProjection;
    this.sameProjection = requestProjection.equalsProjection(this.tilesProjection);
    this.sameUnit =
      Projections.getUnits(requestProjection.toString()) === Projections.getUnits(this.tilesProjection.toString());
  }

  /**
   * Constructor, use the tile tables image width and height as request size
   * @param tileDao tile dao
   * @param imageFormat  image format
   * @param width
   * @param height
   */
  public static createTileCreator(
    tileDao: TileDao,
    imageFormat?: string,
    width?: number,
    height?: number,
  ): TileCreator {
    return new TileCreator(tileDao, width, height, imageFormat);
  }

  /**
   * Get the tile dao
   * @return tile dao
   */
  public getTileDao(): TileDao {
    return this.tileDao;
  }

  /**
   * Get the requested tile width
   * @return width
   */
  public getWidth(): number {
    return this.width;
  }

  /**
   * Get the requested tile height
   * @return height
   */
  public getHeight(): number {
    return this.height;
  }

  /**
   * Get the tile matrix set
   * @return tile matrix set
   */
  public getTileMatrixSet(): TileMatrixSet {
    return this.tileMatrixSet;
  }

  /**
   * Get the request projection
   * @return request projection
   */
  public getRequestProjection(): Projection {
    return this.requestProjection;
  }

  /**
   * Get the tiles projection
   * @return tiles projection
   */
  public getTilesProjection(): Projection {
    return this.tilesProjection;
  }

  /**
   * Get the tile set bounding box
   * @return tile set bounding box
   */
  public getTileSetBoundingBox(): BoundingBox {
    return this.tileSetBoundingBox;
  }

  /**
   * Is the request and tile projection the same
   * @return true if the same
   */
  public isSameProjection(): boolean {
    return this.sameProjection;
  }

  /**
   * Is the request and tile projection the same unit
   * @return true if the same
   */
  public isSameUnit(): boolean {
    return this.sameUnit;
  }

  /**
   * Get the tile scaling options
   * @return tile scaling options
   */
  public getScaling(): TileScaling {
    return this.scaling;
  }

  /**
   * Set the tile scaling options
   * @param scaling tile scaling options
   */
  public setScaling(scaling: TileScaling): void {
    this.scaling = scaling;
  }

  /**
   * Get the requested image format
   * @return image format
   */
  public getImageFormat(): string {
    return this.imageFormat;
  }

  /**
   * Check if the tile table contains a tile for the request bounding box
   *
   * @param requestBoundingBox
   *            request bounding box in the request projection
   * @return true if a tile exists
   */
  public hasTile(requestBoundingBox: BoundingBox): boolean {
    let hasTile = false;

    // Transform to the projection of the tiles
    const transformRequestToTiles = GeometryTransform.create(this.requestProjection, this.tilesProjection);
    const tilesBoundingBox = requestBoundingBox.transform(transformRequestToTiles);

    const tileMatrices = this.getTileMatrices(tilesBoundingBox);

    for (let i = 0; !hasTile && i < tileMatrices.length; i++) {
      const tileMatrix = tileMatrices[i];

      const tileResults = this.retrieveTileResults(tilesBoundingBox, tileMatrix);
      if (tileResults != null) {
        hasTile = tileResults.getCount() > 0;
      }
      tileResults.close();
    }

    return hasTile;
  }

  /**
   * Get the tile
   * @param requestBoundingBox
   */
  public async getTile(requestBoundingBox: BoundingBox): Promise<GeoPackageTile> {
    return this.getTileWithTileMatrices(requestBoundingBox, null);
  }

  /**
   * Get the tile from the request bounding box in the request projection
   * @param requestBoundingBox request bounding box in the request projection
   * @param zoomLevel zoom level
   * @return tile
   */
  public async getTileWithZoomLevel(requestBoundingBox: BoundingBox, zoomLevel?: number): Promise<GeoPackageTile> {
    let tile = null;
    const tileMatrix = this.tileDao.getTileMatrix(zoomLevel);
    if (tileMatrix != null) {
      const tileMatrices = [];
      tileMatrices.push(tileMatrix);
      tile = await this.getTileWithTileMatrices(requestBoundingBox, tileMatrices);
    }
    return tile;
  }

  /**
   * Get the tile from the request bounding box in the request projection
   * @param requestBoundingBox request bounding box in the request projection
   * @param tileMatrices tile matrices
   * @return tile
   */
  private async getTileWithTileMatrices(
    requestBoundingBox: BoundingBox,
    tileMatrices: TileMatrix[],
  ): Promise<GeoPackageTile> {
    let tile = null;

    // Transform to the projection of the tiles

    const transformRequestToTiles = GeometryTransform.create(this.requestProjection, this.tilesProjection);
    const tilesBoundingBox = requestBoundingBox.transform(transformRequestToTiles);

    if (tileMatrices == null) {
      tileMatrices = this.getTileMatrices(tilesBoundingBox);
    }

    for (let i = 0; tile == null && i < tileMatrices.length; i++) {
      const tileMatrix = tileMatrices[i];

      const tileResults = this.retrieveTileResults(tilesBoundingBox, tileMatrix);
      if (tileResults != null) {
        if (tileResults.getCount() > 0) {
          // Determine the tile dimensions
          const tileDimensions = this.tileDimensions(requestBoundingBox, tilesBoundingBox, tileMatrix);
          const requestedTileWidth = tileDimensions[0];
          const requestedTileHeight = tileDimensions[1];

          // Determine the size of the tile to initially draw
          let tileWidth = requestedTileWidth;
          let tileHeight = requestedTileHeight;
          if (!this.sameUnit) {
            tileWidth = Math.round(tilesBoundingBox.getLongitudeRange() / tileMatrix.getPixelXSize());
            tileHeight = Math.round(tilesBoundingBox.getLatitudeRange() / tileMatrix.getPixelYSize());
          }

          // Draw the resulting bitmap with the matching tiles
          let geoPackageTile = await this.drawTile(tileMatrix, tileResults, tilesBoundingBox, tileWidth, tileHeight);

          tileResults.close();

          // Create the tile
          if (geoPackageTile != null) {
            // Project the tile if needed
            if (!this.sameProjection && geoPackageTile.getData() != null) {
              geoPackageTile = await this.reprojectTile(
                geoPackageTile,
                requestedTileWidth,
                requestedTileHeight,
                requestBoundingBox,
                transformRequestToTiles,
                tilesBoundingBox,
              );
            }
            tile = geoPackageTile;
          }
        }
      }
    }

    return tile;
  }

  /**
   * Determine the tile dimensions. Specified width and/or height values are
   * used. When only one of width or height is specified, other is determined
   * as a request ratio. When neither width or height is specified, determine
   * from the tile matrix as a request ratio.
   *
   * @param requestBoundingBox
   *            request bounding box
   * @param tilesBoundingBox
   *            tiles bounding box
   * @param tileMatrix
   *            tile matrix
   * @return tile dimensions array of size 2 [width, height]
   */
  private tileDimensions(
    requestBoundingBox: BoundingBox,
    tilesBoundingBox: BoundingBox,
    tileMatrix: TileMatrix,
  ): number[] {
    // Determine the tile dimensions
    let requestedTileWidth;
    let requestedTileHeight;
    if (this.width != null && this.height != null) {
      // Requested dimensions
      requestedTileWidth = this.width;
      requestedTileHeight = this.height;
    } else if (this.width == null && this.height == null) {
      // Determine dimensions from a single tile matrix
      // tile as a ratio to the requested bounds
      const requestLonRange = requestBoundingBox.getLongitudeRange();
      const requestLatRange = requestBoundingBox.getLatitudeRange();
      const pixelXSize = tileMatrix.getPixelXSize();
      const pixelYSize = tileMatrix.getPixelYSize();
      if (
        Projections.getUnits(this.requestProjection.toString()) ===
        Projections.getUnits(this.tilesProjection.toString())
      ) {
        // Same unit, use the pixel x and y size
        requestedTileWidth = Math.round(requestLonRange / pixelXSize);
        requestedTileHeight = Math.round(requestLatRange / pixelYSize);
      } else {
        // Use the max tile pixel length and adjust to
        // the sides to the requested bounds ratio
        const tileWidth = tilesBoundingBox.getLongitudeRange() / pixelXSize;
        const tileHeight = tilesBoundingBox.getLatitudeRange() / pixelYSize;
        if (requestLonRange < requestLatRange) {
          requestedTileWidth = Math.round(tileHeight * (requestLonRange / requestLatRange));
          requestedTileHeight = Math.round(tileHeight);
        } else if (requestLatRange < requestLonRange) {
          requestedTileWidth = Math.round(tileWidth);
          requestedTileHeight = Math.round(tileWidth * (requestLatRange / requestLonRange));
        } else {
          requestedTileWidth = Math.round(Math.max(tileWidth, tileHeight));
          requestedTileHeight = requestedTileWidth;
        }
      }
    } else if (this.width == null) {
      // Requested height, determine width as a ratio from
      // the requested bounds
      requestedTileHeight = this.height;
      requestedTileWidth = Math.round(
        this.height * (requestBoundingBox.getLongitudeRange() / requestBoundingBox.getLatitudeRange()),
      );
    } else {
      // Requested width, determine height as a ratio from
      // the requested bounds
      requestedTileWidth = this.width;
      requestedTileHeight = Math.round(
        this.width * (requestBoundingBox.getLatitudeRange() / requestBoundingBox.getLongitudeRange()),
      );
    }

    return [requestedTileWidth, requestedTileHeight];
  }

  /**
   * Draw the tile from the tile results
   *
   * @param tileMatrix tile matrix
   * @param tileResults tile results
   * @param requestBoundingBox projected request bounding box
   * @param tileWidth tile width
   * @param tileHeight tile height
   * @return GeoPackage Tile
   */
  private async drawTile(
    tileMatrix: TileMatrix,
    tileResults: TileResultSet,
    requestBoundingBox: BoundingBox,
    tileWidth: number,
    tileHeight: number,
  ): Promise<GeoPackageTile> {
    // Draw the resulting bitmap with the matching tiles
    let geoPackageTile: GeoPackageTile = null;
    let canvas: HTMLCanvasElement = null;
    let context: CanvasRenderingContext2D = null;
    while (tileResults.moveToNext()) {
      // Get the next tile
      const tileRow = tileResults.getRow();
      let tileDataImage: GeoPackageImage;
      try {
        tileDataImage = await tileRow.getTileDataImage();
      } catch (e) {
        throw new GeoPackageException('Failed to read the tile row image data');
      }

      if (tileDataImage != null) {
        // Get the bounding box of the tile
        const tileBoundingBox = TileBoundingBoxUtils.getBoundingBoxWithTileMatrix(
          this.tileSetBoundingBox,
          tileMatrix,
          tileRow.getTileColumn(),
          tileRow.getTileRow(),
        );

        // Get the bounding box where the requested image and
        // tile overlap
        const overlap = requestBoundingBox.overlap(tileBoundingBox);
        // If the tile overlaps with the requested box
        if (overlap != null) {
          // Get the rectangle of the tile image to draw
          const src = TileBoundingBoxUtils.getRectangle(
            tileMatrix.getTileWidth(),
            tileMatrix.getTileHeight(),
            tileBoundingBox,
            overlap,
          );
          // Get the rectangle of where to draw the tile in the resulting image
          const dest = TileBoundingBoxUtils.getRectangle(tileWidth, tileHeight, requestBoundingBox, overlap);
          if (src.isValid() && dest.isValid()) {
            if (this.imageFormat != null) {
              // Create the bitmap first time through
              if (canvas == null) {
                canvas = Canvas.create(tileWidth, tileHeight);
                context = canvas.getContext('2d');
              }
              // Draw the tile to the image
              const image = tileDataImage.getImage();
              context.drawImage(
                image,
                src.getLeft(),
                src.getTop(),
                src.getRight() - src.getLeft(),
                src.getBottom() - src.getTop(),
                dest.getLeft(),
                dest.getTop(),
                dest.getRight() - dest.getLeft(),
                dest.getBottom() - dest.getTop(),
              );
            } else {
              if (geoPackageTile != null || !src.equals(dest)) {
                throw new GeoPackageException(
                  'Raw image only supported when the images are aligned with the tile format requiring no combining and cropping',
                );
              }
              geoPackageTile = new GeoPackageTile(tileWidth, tileHeight, tileRow.getTileData());
            }
          }
        }
      }
    }

    // check if tile parts were drawn into the canvas
    if (geoPackageTile == null && canvas != null) {
      const data = await Canvas.toBytes(canvas, ImageType.getTypeFromMimeType(this.imageFormat || 'image/png'), 1.0);
      geoPackageTile = new GeoPackageTile(tileWidth, tileHeight, data);
    }

    // Check if the entire image is transparent
    if (geoPackageTile != null && geoPackageTile.getData() != null) {
      const isFullyTransparent = await ImageUtils.isFullyTransparent(
        geoPackageTile.getData(),
        geoPackageTile.getWidth(),
        geoPackageTile.getHeight(),
      );
      if (isFullyTransparent) {
        geoPackageTile = null;
      }
    }

    if (canvas != null) {
      Canvas.disposeCanvas(canvas);
    }

    return geoPackageTile;
  }

  /**
   * Reproject the tile to the requested projection
   * @param tile tile in the tile matrix projection
   * @param requestedTileWidth requested tile width
   * @param requestedTileHeight requested tile height
   * @param requestBoundingBox request bounding box in the request projection
   * @param transformRequestToTiles transformation from request to tiles
   * @param tilesBoundingBox request bounding box in the tile matrix projection
   * @return projected tile
   */
  private async reprojectTile(
    tile: GeoPackageTile,
    requestedTileWidth: number,
    requestedTileHeight: number,
    requestBoundingBox: BoundingBox,
    transformRequestToTiles: ProjectionTransform,
    tilesBoundingBox: BoundingBox,
  ): Promise<GeoPackageTile> {
    const requestedWidthUnitsPerPixel = requestBoundingBox.getLongitudeRange() / requestedTileWidth;
    const requestedHeightUnitsPerPixel = requestBoundingBox.getLatitudeRange() / requestedTileHeight;

    const tilesDistanceWidth = tilesBoundingBox.getLongitudeRange();
    const tilesDistanceHeight = tilesBoundingBox.getLatitudeRange();

    const width = tile.getWidth();
    const height = tile.getHeight();
    const image = await tile.getGeoPackageImage();
    const pixels = image.getImageData().data;
    const imageFormat = image.getFormat();
    Canvas.disposeImage(image);

    // Projected tile pixels to draw the reprojected tile
    const imageData = Canvas.createImageData(requestedTileWidth, requestedTileHeight);
    const projectedPixels = imageData.data;

    // Retrieve each pixel in the target tile from the source tile
    for (let y = 0; y < requestedTileHeight; y++) {
      for (let x = 0; x < requestedTileWidth; x++) {
        const longitude = requestBoundingBox.getMinLongitude() + x * requestedWidthUnitsPerPixel;
        const latitude = requestBoundingBox.getMaxLatitude() - y * requestedHeightUnitsPerPixel;
        const toCoord = transformRequestToTiles.transform(longitude, latitude);
        const projectedLongitude = toCoord[0];
        const projectedLatitude = toCoord[1];
        let xPixel = Math.round(
          ((projectedLongitude - tilesBoundingBox.getMinLongitude()) / tilesDistanceWidth) * width,
        );
        let yPixel = Math.round(
          ((tilesBoundingBox.getMaxLatitude() - projectedLatitude) / tilesDistanceHeight) * height,
        );
        xPixel = Math.max(0, xPixel);
        xPixel = Math.min(width - 1, xPixel);
        yPixel = Math.max(0, yPixel);
        yPixel = Math.min(height - 1, yPixel);
        const sliceStart = (yPixel * width + xPixel) * 4;
        const color = pixels.slice(sliceStart, sliceStart + 4);
        projectedPixels.set(color, (y * requestedTileWidth + x) * 4);
      }
    }
    // Draw the new image
    const canvas = Canvas.create(requestedTileWidth, requestedTileHeight);
    const context = canvas.getContext('2d');
    context.putImageData(imageData, 0, 0);
    const data = await Canvas.toBytes(canvas, ImageType.getTypeFromMimeType(imageFormat), 1.0);
    return new GeoPackageTile(requestedTileWidth, requestedTileHeight, data);
  }

  /**
   * Get the tile matrices that may contain the tiles for the bounding box,
   * matches against the bounding box and zoom level options
   *
   * @param projectedRequestBoundingBox
   *            bounding box projected to the tiles
   * @return tile matrices
   */
  private getTileMatrices(projectedRequestBoundingBox: BoundingBox): TileMatrix[] {
    const tileMatrices = [];

    // Check if the request overlaps the tile matrix set
    if (this.tileDao.getTileMatrices().length > 0 && projectedRequestBoundingBox.intersects(this.tileSetBoundingBox)) {
      // Get the tile distance
      const distanceWidth = projectedRequestBoundingBox.getLongitudeRange();
      const distanceHeight = projectedRequestBoundingBox.getLatitudeRange();

      // Get the zoom level to request based upon the tile size
      let requestZoomLevel;
      if (this.scaling != null) {
        // When options are provided, get the approximate zoom level
        // regardless of whether a tile level exists
        requestZoomLevel = this.tileDao.getApproximateZoomLevelForWidthAndHeight(distanceWidth, distanceHeight);
      } else {
        // Get the closest existing zoom level
        requestZoomLevel = this.tileDao.getZoomLevelForWidthAndHeight(distanceWidth, distanceHeight);
      }

      // If there is a matching zoom level
      if (requestZoomLevel != null) {
        let zoomLevels: number[] = null;
        // If options are configured, build the possible zoom levels in
        // order to request
        if (this.scaling != null && this.scaling.getScalingType() != null) {
          // Find zoom in levels
          const zoomInLevels = [];
          if (this.scaling.isZoomIn()) {
            const zoomIn =
              this.scaling.getZoomIn() != null
                ? requestZoomLevel + this.scaling.getZoomIn()
                : this.tileDao.getMaxZoom();
            for (let zoomLevel = requestZoomLevel + 1; zoomLevel <= zoomIn; zoomLevel++) {
              zoomInLevels.push(zoomLevel);
            }
          }

          // Find zoom out levels
          const zoomOutLevels = [];
          if (this.scaling.isZoomOut()) {
            const zoomOut =
              this.scaling.getZoomOut() != null
                ? requestZoomLevel - this.scaling.getZoomOut()
                : this.tileDao.getMinZoom();
            for (let zoomLevel = requestZoomLevel - 1; zoomLevel >= zoomOut; zoomLevel--) {
              zoomOutLevels.push(zoomLevel);
            }
          }

          if (zoomInLevels.length === 0) {
            // Only zooming out
            zoomLevels = zoomOutLevels;
          } else if (zoomOutLevels.length === 0) {
            // Only zooming in
            zoomLevels = zoomInLevels;
          } else {
            // Determine how to order the zoom in and zoom out
            // levels
            const type = this.scaling.getScalingType();
            switch (type) {
              case TileScalingType.IN:
              case TileScalingType.IN_OUT:
                // Order zoom in levels before zoom out levels
                zoomLevels = zoomInLevels;
                zoomLevels.push(...zoomOutLevels);
                break;
              case TileScalingType.OUT:
              case TileScalingType.OUT_IN:
                // Order zoom out levels before zoom in levels
                zoomLevels = zoomOutLevels;
                zoomLevels.push(...zoomInLevels);
                break;
              case TileScalingType.CLOSEST_IN_OUT:
              case TileScalingType.CLOSEST_OUT_IN:
                // Alternate the zoom in and out levels
                let firstLevels;
                let secondLevels;
                if (type == TileScalingType.CLOSEST_IN_OUT) {
                  // Alternate starting with zoom in
                  firstLevels = zoomInLevels;
                  secondLevels = zoomOutLevels;
                } else {
                  // Alternate starting with zoom out
                  firstLevels = zoomOutLevels;
                  secondLevels = zoomInLevels;
                }

                zoomLevels = [];
                const maxLevels = Math.max(firstLevels.length, secondLevels.length);
                for (let i = 0; i < maxLevels; i++) {
                  if (i < firstLevels.length) {
                    zoomLevels.push(firstLevels[i]);
                  }
                  if (i < secondLevels.length) {
                    zoomLevels.push(secondLevels[i]);
                  }
                }
                break;
              default:
                throw new GeoPackageException('Unsupported TileScalingType: ' + type);
            }
          }
        } else {
          zoomLevels = [];
        }

        // Always check the request zoom level first
        zoomLevels.unshift(requestZoomLevel);

        // Build a list of tile matrices that exist for the zoom levels
        for (const zoomLevel of zoomLevels) {
          const tileMatrix = this.tileDao.getTileMatrix(zoomLevel);
          if (tileMatrix != null) {
            tileMatrices.push(tileMatrix);
          }
        }
      }
    }
    return tileMatrices;
  }

  /**
   * Get the tile row results of tiles needed to draw the requested bounding
   * box tile
   * @param projectedRequestBoundingBox bounding box projected to the tiles
   * @param tileMatrix
   * @return tile result set or null
   */
  private retrieveTileResults(projectedRequestBoundingBox: BoundingBox, tileMatrix: TileMatrix): TileResultSet {
    let tileResults = null;
    if (tileMatrix != null) {
      // Get the tile grid
      const tileGrid = TileBoundingBoxUtils.getTileGrid(
        this.tileSetBoundingBox,
        tileMatrix.getMatrixWidth(),
        tileMatrix.getMatrixHeight(),
        projectedRequestBoundingBox,
      );

      // Query for matching tiles in the tile grid
      tileResults = this.tileDao.queryByTileGrid(tileGrid, tileMatrix.getZoomLevel());
    }

    return tileResults;
  }
}
