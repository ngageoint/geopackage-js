import { TileRetriever } from './tileRetriever';
import { TileCreator } from './tileCreator';
import { TileDao } from './user/tileDao';
import { Projection, Projections } from '@ngageoint/projections-js';
import { TileBoundingBoxUtils } from './tileBoundingBoxUtils';
import { GeoPackageTile } from './geoPackageTile';
import { TileScaling } from '../extension/nga/scale/tileScaling';
import { BoundingBox } from '../boundingBox';

/**
 * GeoPackage Tile Retriever, retrieves a tile from a GeoPackage from XYZ coordinates
 */
export class GeoPackageTileRetriever implements TileRetriever {
  /**
   * Tile Creator
   */
  private readonly tileCreator: TileCreator;

  /**
   * Constructor with specified tile size
   * @param tileDao tile dao
   * @param width width
   * @param height height
   * @param imageFormat image format
   */
  public constructor(tileDao: TileDao, width?: number, height?: number, imageFormat = 'image/png') {
    tileDao.adjustTileMatrixLengths();
    this.tileCreator = new TileCreator(tileDao, width, height, imageFormat);
  }

  /**
   * Check if data exists for the web mercator tile specified
   * @param x
   * @param y
   * @param zoom
   */
  public hasTile(x: number, y: number, zoom: number): boolean {
    // Get the bounding box of the requested tile
    const boundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBox(x, y, zoom);
    this.tileCreator.setRequestProjection(Projections.getWebMercatorProjection());
    return this.tileCreator.hasTile(boundingBox);
  }

  /**
   * Get web mercator x,y,z tile
   * @param x
   * @param y
   * @param zoom
   */
  public async getTile(x: number, y: number, zoom: number): Promise<GeoPackageTile> {
    // Get the bounding box of the requested tile
    const boundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBox(x, y, zoom);
    this.tileCreator.setRequestProjection(Projections.getWebMercatorProjection());
    return this.tileCreator.getTile(boundingBox);
  }

  /**
   * Check if data exists for the wgs84 tile specified
   * @param x
   * @param y
   * @param zoom
   */
  public hasTileWGS84(x: number, y: number, zoom: number): boolean {
    // Get the bounding box of the requested tile
    const boundingBox = TileBoundingBoxUtils.getWGS84BoundingBox(x, y, zoom);
    this.tileCreator.setRequestProjection(Projections.getWGS84Projection());
    return this.tileCreator.hasTile(boundingBox);
  }

  /**
   * Get wgs84 x,y,z tile
   * @param x
   * @param y
   * @param zoom
   */
  public async getTileWGS84(x: number, y: number, zoom: number): Promise<GeoPackageTile> {
    // Get the bounding box of the requested tile
    const boundingBox = TileBoundingBoxUtils.getWGS84BoundingBox(x, y, zoom);
    this.tileCreator.setRequestProjection(Projections.getWGS84Projection());
    return this.tileCreator.getTile(boundingBox);
  }

  /**
   * Get the tile for the specified bounds
   * @param boundingBox
   * @param projection
   */
  public async getTileWithBounds(boundingBox: BoundingBox, projection: Projection): Promise<GeoPackageTile> {
    // Get the bounding box of the requested tile
    this.tileCreator.setRequestProjection(projection);
    return this.tileCreator.getTile(boundingBox);
  }

  /**
   * Get the Tile Scaling options
   * @return tile scaling options
   */
  public getScaling(): TileScaling {
    return this.tileCreator.getScaling();
  }

  /**
   * Set the Tile Scaling options
   * @param scaling tile scaling options
   */
  public setScaling(scaling: TileScaling): void {
    this.tileCreator.setScaling(scaling);
  }

  /**
   * Returns the bounding box for the tile matrix set in EPSG:3857 (Web Mercator)
   * @return {BoundingBox} bounding bxo
   */
  getWebMercatorBoundingBox(): BoundingBox {
    return this.tileCreator
      .getTileDao()
      .getTileMatrixSet()
      .getBoundingBox()
      .projectBoundingBox(this.tileCreator.getTileDao().getProjection(), Projections.getWebMercatorProjection());
  }
}
