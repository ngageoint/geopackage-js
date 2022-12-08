import { TileRetriever } from './tileRetriever';
import { TileCreator } from './tileCreator';
import { TileDao } from './user/tileDao';
import { Projection, Projections } from '@ngageoint/projections-js';
import { TileBoundingBoxUtils } from './tileBoundingBoxUtils';
import { GeoPackageTile } from './geoPackageTile';
import { TileScaling } from '../extension/nga/scale/tileScaling';
import { BoundingBox } from '../boundingBox';

/**
 * GeoPackage Tile Retriever, retrieves a tile from a GeoPackage from XYZ
 * coordinates
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
   * @param targetProjection
   */
  public constructor(tileDao: TileDao, width: number, height: number, imageFormat: string = 'image/png', targetProjection: Projection = Projections.getWebMercatorProjection()) {
    tileDao.adjustTileMatrixLengths();
    this.tileCreator = new TileCreator(tileDao, width, height, targetProjection, imageFormat);
  }

  /**
   * Check if data exists for the web mercator tile specified
   * @param x
   * @param y
   * @param zoom
   */
  public hasTile(x: number, y: number, zoom: number): boolean {
    // Get the bounding box of the requested tile
    const webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBox(x, y, zoom);
    return this.tileCreator.hasTile(webMercatorBoundingBox);
  }

  /**
   * Get web mercator x,y,z tile
   * @param x
   * @param y
   * @param zoom
   */
  public async getTile(x: number, y: number, zoom: number): Promise<GeoPackageTile> {
    // Get the bounding box of the requested tile
    const webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBox(x, y, zoom);
    return this.tileCreator.getTile(webMercatorBoundingBox);
  }

  /**
   * Get the tile for the specified bounds
   * @param boundingBox
   */
  public async getTileWithBounds(boundingBox: BoundingBox): Promise<GeoPackageTile> {
    // Get the bounding box of the requested tile
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
}
