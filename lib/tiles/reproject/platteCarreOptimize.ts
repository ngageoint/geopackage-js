import { TileGrid } from '../tileGrid';
import { TileReprojectionOptimize } from './tileReprojectionOptimize';
import { Projection, Projections } from '@ngageoint/projections-js';
import { BoundingBox } from '../../boundingBox';
import { TileBoundingBoxUtils } from '../tileBoundingBoxUtils';

/**
 * Platte Carre (WGS84) XYZ tiling optimizations
 *
 * @author osbornb
 */
export class PlatteCarreOptimize extends TileReprojectionOptimize {
  /**
   * Create with minimal bounds
   *
   * @return platte carre optimize
   */
  public static create(): PlatteCarreOptimize {
    return new PlatteCarreOptimize();
  }

  /**
   * Create with world bounds
   *
   * @return platte carre optimize
   */
  public static createWorld(): PlatteCarreOptimize {
    return new PlatteCarreOptimize(true);
  }

  /**
   * {@inheritDoc}
   */
  public getProjection(): Projection {
    return Projections.getWGS84Projection();
  }

  /**
   * {@inheritDoc}
   */
  public getTileGrid(): TileGrid {
    return new TileGrid(0, 0, 1, 0);
  }

  /**
   * {@inheritDoc}
   */
  public getBoundingBox(): BoundingBox {
    return BoundingBox.worldWGS84();
  }

  /**
   * {@inheritDoc}
   */
  public getTileGridFromBoundingBox(boundingBox: BoundingBox, zoom: number): TileGrid {
    return TileBoundingBoxUtils.getTileGridWGS84(boundingBox, zoom);
  }

  /**
   * {@inheritDoc}
   */
  public getBoundingBoxFromTileGrid(tileGrid: TileGrid, zoom: number): BoundingBox {
    return TileBoundingBoxUtils.getBoundingBoxWGS84(tileGrid, zoom);
  }
}
