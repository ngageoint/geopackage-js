import { TileRetriever } from './tileRetriever';
import { TileCreator } from './tileCreator';
import { TileDao } from './user/tileDao';
import { Projections } from '@ngageoint/projections-js';
import { TileBoundingBoxUtils } from './tileBoundingBoxUtils';
import { GeoPackageTile } from './geoPackageTile';
import { TileScaling } from '../extension/nga/scale/tileScaling';

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
   */
  public constructor(tileDao: TileDao, width: number, height: number, imageFormat: string) {
    tileDao.adjustTileMatrixLengths();
    const webMercator = Projections.getWebMercatorProjection();
    this.tileCreator = new TileCreator(tileDao, width, height, webMercator, imageFormat);
  }

  /**
   * {@inheritDoc}
   */
  public hasTile(x: number, y: number, zoom: number): boolean {
    // Get the bounding box of the requested tile
    const webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBox(x, y, zoom);
    return this.tileCreator.hasTile(webMercatorBoundingBox);
  }

  /**
   * {@inheritDoc}
   */
  public getTile(x: number, y: number, zoom: number): GeoPackageTile {
    // Get the bounding box of the requested tile
    const webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBox(x, y, zoom);
    return this.tileCreator.getTile(webMercatorBoundingBox);
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
