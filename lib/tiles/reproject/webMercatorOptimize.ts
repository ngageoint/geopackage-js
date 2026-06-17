import { TileReprojectionOptimize } from './tileReprojectionOptimize';
import { Projection, Projections } from '@ngageoint/projections-js';
import { BoundingBox } from '../../boundingBox';
import { TileGrid } from '../tileGrid';
import { TileBoundingBoxUtils } from '../tileBoundingBoxUtils';

/**
 * Web Mercator XYZ tiling optimizations
 */
export class WebMercatorOptimize extends TileReprojectionOptimize {
  /**
   * Create with minimal bounds
   *
   * @return web mercator optimize
   */
  public static create(): WebMercatorOptimize {
    return new WebMercatorOptimize();
  }

  /**
   * Create with world bounds
   *
   * @return web mercator optimize
   */
  public static createWorld(): WebMercatorOptimize {
    return new WebMercatorOptimize(true);
  }

  /**
   * @inheritDoc
   */
  public getProjection(): Projection {
    return Projections.getWebMercatorProjection();
  }

  /**
   * @inheritDoc
   */
  public getTileGrid(): TileGrid {
    return new TileGrid(0, 0, 0, 0);
  }

  /**
   * @inheritDoc
   */
  public getBoundingBox(): BoundingBox {
    return BoundingBox.worldWebMercator();
  }

  /**
   * @inheritDoc
   */
  public getTileGridFromBoundingBox(boundingBox: BoundingBox, zoom: number): TileGrid {
    return TileBoundingBoxUtils.getTileGridFromBoundingBox(boundingBox, zoom);
  }

  /**
   * @inheritDoc
   */
  public getBoundingBoxFromTileGrid(tileGrid: TileGrid, zoom: number): BoundingBox {
    return TileBoundingBoxUtils.getWebMercatorBoundingBoxWithTileGrid(tileGrid, zoom);
  }
}
