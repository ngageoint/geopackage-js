import { TileDao } from '../user/tileDao';
import { TileReprojectionOptimize } from './tileReprojectionOptimize';
import { GeoPackage } from '../../geoPackage';
import { GeoPackageProgress } from '../../io/geoPackageProgress';
import { Projection } from '@ngageoint/projections-js';
import { TileReprojectionZoom } from './tileReprojectionZoom';
import { TileGrid } from '../tileGrid';
import { TileMatrixSet } from '../matrixset/tileMatrixSet';
import { TileMatrix } from '../matrix/tileMatrix';
import { GeoPackageException } from '../../geoPackageException';
import { BoundingBox } from '../../boundingBox';
import { TileBoundingBoxUtils } from '../tileBoundingBoxUtils';
import { TileCreator } from '../tileCreator';
import { SQLiteMaster } from '../../db/master/sqliteMaster';
import { SQLiteMasterQuery } from '../../db/master/sqliteMasterQuery';
import { SQLiteMasterColumn } from '../../db/master/sqliteMasterColumn';
import { TileTableMetadata } from '../user/tileTableMetadata';
import { ColumnValues } from '../../dao/columnValues';
import { TileColumns } from '../user/tileColumns';
import { GeometryTransform } from '@ngageoint/simple-features-proj-js';
import { ImageType } from '../../image/imageType';

/**
 * Tile Reprojection for reprojecting an existing tile table
 */
export class TileReprojection {
  /**
   * Delta for comparisons between same pixel sizes
   */
  private static readonly PIXEL_SIZE_DELTA = 0.00000000001;

  /**
   * Optional optimization
   */
  protected optimize: TileReprojectionOptimize;

  /**
   * Overwrite existing tiles at a zoom level when geographic calculations
   * differ
   */
  protected overwrite = false;

  /**
   * Tile width in pixels
   */
  protected tileWidth: number;

  /**
   * Tile height in pixels
   */
  protected tileHeight: number;

  /**
   * Progress callbacks
   */
  protected progress: GeoPackageProgress;

  /**
   * Tile DAO
   */
  protected tileDao: TileDao;

  /**
   * GeoPackage
   */
  protected geoPackage: GeoPackage;

  /**
   * Table name
   */
  protected table: string;

  /**
   * Projection
   */
  protected projection: Projection;

  /**
   * Tile DAO
   */
  protected reprojectTileDao: TileDao;

  /**
   * Replace flag
   */
  protected replace = false;

  /**
   * Zoom level configuration map
   */
  protected zoomConfigs: Map<number, TileReprojectionZoom> = new Map<number, TileReprojectionZoom>();

  /**
   * Optimization tile grid
   */
  protected optimizeTileGrid: TileGrid;

  /**
   * Optimization zoom
   */
  protected optimizeZoom: number;

  /**
   * Create a Reprojection from a GeoPackage tile table to a new tile table
   * @param tileDao tile DAO
   * @param reprojectTileDao reprojection tile DAO
   * @return tile reprojection
   */
  public static create(tileDao: TileDao, reprojectTileDao: TileDao): TileReprojection;

  /**
   * Create a Reprojection from a GeoPackage tile table, replacing the
   * existing tiles
   * @param geoPackage GeoPackage
   * @param table tile table
   * @param projection desired projection
   * @return tile reprojection
   */
  public static create(geoPackage: GeoPackage, table: string, projection: Projection): TileReprojection;

  /**
   * Create a Reprojection from a GeoPackage tile table to a new tile table
   * @param geoPackage GeoPackage
   * @param table tile table
   * @param reprojectTileDao reprojection tile DAO
   * @return tile reprojection
   */
  public static create(geoPackage: GeoPackage, table: string, reprojectTileDao: TileDao): TileReprojection;

  /**
   * Create a Reprojection from a GeoPackage tile table, replacing the
   * existing tiles
   * @param geoPackage GeoPackage
   * @param table tile table
   * @param optimize desired optimization
   * @return tile reprojection
   */
  public static create(geoPackage: GeoPackage, table: string, optimize: TileReprojectionOptimize): TileReprojection;

  /**
   * Create a Reprojection from a GeoPackage tile table to a new tile table
   * @param tileDao tile DAO
   * @param reprojectGeoPackage GeoPackage for reprojected tile table
   * @param reprojectTileDao reprojection tile DAO
   * @return tile reprojection
   */
  public static create(tileDao: TileDao, reprojectGeoPackage: GeoPackage, reprojectTileDao: TileDao): TileReprojection;

  /**
   * Create a Reprojection from a GeoPackage tile table to a new tile table
   * within the GeoPackage
   * @param geoPackage GeoPackage
   * @param table tile table
   * @param reprojectTable new reprojected tile table
   * @param projection desired projection
   * @return tile reprojection
   */
  public static create(
    geoPackage: GeoPackage,
    table: string,
    reprojectTable: string,
    projection: Projection,
  ): TileReprojection;

  /**
   * Create a Reprojection from a GeoPackage tile table to a new tile table
   * within the GeoPackage
   * @param geoPackage GeoPackage
   * @param table tile table
   * @param reprojectTable new reprojected tile table
   * @param optimize desired optimization
   * @return tile reprojection
   */
  public static create(
    geoPackage: GeoPackage,
    table: string,
    reprojectTable: string,
    optimize: TileReprojectionOptimize,
  ): TileReprojection;

  /**
   * Create a Reprojection from a GeoPackage tile table to a new tile table
   * @param geoPackage GeoPackage
   * @param table tile table
   * @param reprojectGeoPackage GeoPackage for reprojected tile table
   * @param reprojectTileDao reprojection tile DAO
   * @return tile reprojection
   */
  public static create(
    geoPackage: GeoPackage,
    table: string,
    reprojectGeoPackage: GeoPackage,
    reprojectTileDao: TileDao,
  ): TileReprojection;

  /**
   * Create a Reprojection from a tile table to a new tile table in a
   * specified GeoPackage
   * @param tileDao tile DAO
   * @param geoPackage GeoPackage for reprojected tile table
   * @param reprojectTable new reprojected tile table
   * @param projection desired projection
   * @return tile reprojection
   */
  public static create(
    tileDao: TileDao,
    geoPackage: GeoPackage,
    reprojectTable: string,
    projection: Projection,
  ): TileReprojection;

  /**
   * Create a Reprojection from a tile table to a new tile table in a
   * specified GeoPackage
   * @param tileDao tile DAO
   * @param reprojectGeoPackage GeoPackage for reprojected tile table
   * @param reprojectTable new reprojected tile table
   * @param optimize desired optimization
   * @return tile reprojection
   */
  public static create(
    tileDao: TileDao,
    reprojectGeoPackage: GeoPackage,
    reprojectTable: string,
    optimize: TileReprojectionOptimize,
  ): TileReprojection;

  /**
   * Create a Reprojection from a GeoPackage tile table to a new tile table in
   * a specified GeoPackage
   * @param geoPackage GeoPackage
   * @param table tile table
   * @param reprojectGeoPackage GeoPackage for reprojected tile table
   * @param reprojectTable new reprojected tile table
   * @param projection desired projection
   * @return tile reprojection
   */
  public static create(
    geoPackage: GeoPackage,
    table: string,
    reprojectGeoPackage: GeoPackage,
    reprojectTable: string,
    projection: Projection,
  ): TileReprojection;

  /**
   * Create a Reprojection from a GeoPackage tile table to a new tile table in
   * a specified GeoPackage
   *
   * @param geoPackage GeoPackage
   * @param table tile table
   * @param reprojectGeoPackage GeoPackage for reprojected tile table
   * @param reprojectTable new reprojected tile table
   * @param optimize desired optimization
   * @return tile reprojection
   */
  public static create(
    geoPackage: GeoPackage,
    table: string,
    reprojectGeoPackage: GeoPackage,
    reprojectTable: string,
    optimize: TileReprojectionOptimize,
  ): TileReprojection;

  /**
   * Creates the TileReprojection Object for the configuration provided
   * @param args
   */
  public static create(...args): TileReprojection {
    let tileReprojection = null;
    try {
      if (args.length === 2) {
        if (args[0] instanceof TileDao && args[1] instanceof TileDao) {
          tileReprojection = new TileReprojection(args[0], args[1]);
        }
      } else if (args.length === 3) {
        if (args[0] instanceof GeoPackage) {
          const geoPackage = args[0] as GeoPackage;
          const table = args[1] as string;
          if (args[2] instanceof Projection) {
            const projection = args[2];
            tileReprojection = new TileReprojection(geoPackage.getTileDao(table), geoPackage, table, projection);
          } else if (args[2] instanceof TileDao) {
            const reprojectTileDao = args[2] as TileDao;
            tileReprojection = new TileReprojection(geoPackage.getTileDao(table), reprojectTileDao);
          } else if (args[2] instanceof TileReprojectionOptimize) {
            const optimize = args[2] as TileReprojectionOptimize;
            tileReprojection = new TileReprojection(
              geoPackage.getTileDao(table),
              geoPackage,
              table,
              optimize.getProjection(),
            );
            tileReprojection.setOptimize(optimize);
          }
        } else if (args[0] instanceof TileDao) {
          const tileDao = args[0] as TileDao;
          const reprojectGeoPackage = args[1] as GeoPackage;
          const reprojectTileDao = args[2] as TileDao;
          tileReprojection = new TileReprojection(tileDao, reprojectGeoPackage, reprojectTileDao);
        }
      } else if (args.length === 4) {
        if (args[0] instanceof GeoPackage) {
          const geoPackage = args[0] as GeoPackage;
          const table = args[1] as string;
          if (typeof args[2] === 'string') {
            const reprojectTable = args[2] as string;
            if (args[3] instanceof Projection) {
              const projection = args[3] as Projection;
              tileReprojection = new TileReprojection(
                geoPackage.getTileDao(table),
                geoPackage,
                reprojectTable,
                projection,
              );
            } else if (args[3] instanceof TileReprojectionOptimize) {
              const optimize = args[3] as TileReprojectionOptimize;
              tileReprojection = new TileReprojection(
                geoPackage.getTileDao(table),
                geoPackage,
                reprojectTable,
                optimize.getProjection(),
              );
              tileReprojection.setOptimize(optimize);
            }
          } else if (args[2] instanceof GeoPackage && args[3] instanceof TileDao) {
            const reprojectGeoPackage = args[2] as GeoPackage;
            const reprojectTileDao = args[3] as TileDao;
            tileReprojection = new TileReprojection(
              geoPackage.getTileDao(table),
              reprojectGeoPackage,
              reprojectTileDao,
            );
          }
        } else if (args[0] instanceof TileDao) {
          const tileDao = args[0] as TileDao;
          const geoPackage = args[1] as GeoPackage;
          const reprojectTileDao = args[2] as string;
          if (args[3] instanceof Projection) {
            const projection = args[3] as Projection;
            tileReprojection = new TileReprojection(tileDao, geoPackage, reprojectTileDao, projection);
          } else if (args[3] instanceof TileReprojectionOptimize) {
            const optimize = args[3] as TileReprojectionOptimize;
            tileReprojection = new TileReprojection(tileDao, geoPackage, reprojectTileDao, optimize.getProjection());
            tileReprojection.setOptimize(optimize);
          }
        }
      } else if (args.length === 5) {
        if (args[4] instanceof Projection) {
          const geoPackage = args[0] as GeoPackage;
          const table = args[1] as string;
          const reprojectGeoPackage = args[2] as GeoPackage;
          const reprojectTable = args[3] as string;
          const projection = args[4] as Projection;
          tileReprojection = new TileReprojection(
            geoPackage.getTileDao(table),
            reprojectGeoPackage,
            reprojectTable,
            projection,
          );
        } else if (args[4] instanceof TileReprojectionOptimize) {
          const geoPackage = args[0] as GeoPackage;
          const table = args[1] as string;
          const reprojectGeoPackage = args[2] as GeoPackage;
          const reprojectTable = args[3] as string;
          const optimize = args[4] as TileReprojectionOptimize;
          tileReprojection = new TileReprojection(
            geoPackage.getTileDao(table),
            reprojectGeoPackage,
            reprojectTable,
            optimize.getProjection(),
          );
          tileReprojection.setOptimize(optimize);
        }
      }
    } catch (e) {}

    if (tileReprojection == null) {
      throw new GeoPackageException('Invalid arguments for static method TileReprojection -> create.');
    }

    return tileReprojection;
  }

  /**
   * Reproject a GeoPackage tile table, replacing the existing tiles
   * @param geoPackage GeoPackage
   * @param table tile table
   * @param projection desired projection
   * @return created tiles
   */
  public static reproject(geoPackage: GeoPackage, table: string, projection: Projection): number;

  /**
   * Reproject a GeoPackage tile table to a new tile table within the
   * GeoPackage
   * @param geoPackage GeoPackage
   * @param table tile table
   * @param reprojectTable new reprojected tile table
   * @param projection desired projection
   * @return created tiles
   */
  public static reproject(
    geoPackage: GeoPackage,
    table: string,
    reprojectTable: string,
    projection: Projection,
  ): number;

  /**
   * Reproject a GeoPackage tile table to a new tile table in a specified
   * GeoPackage
   * @param geoPackage GeoPackage
   * @param table tile table
   * @param reprojectGeoPackage GeoPackage for reprojected tile table
   * @param reprojectTable new reprojected tile table
   * @param projection desired projection
   * @return created tiles
   */
  public static reproject(
    geoPackage: GeoPackage,
    table: string,
    reprojectGeoPackage: GeoPackage,
    reprojectTable: string,
    projection: Projection,
  ): number;

  /**
   * Reproject a tile table to a new tile table in a specified GeoPackage
   * @param tileDao tile DAO
   * @param reprojectGeoPackage GeoPackage for reprojected tile table
   * @param reprojectTable new reprojected tile table
   * @param projection desired projection
   * @return created tiles
   */
  public static reproject(
    tileDao: TileDao,
    reprojectGeoPackage: GeoPackage,
    reprojectTable: string,
    projection: Projection,
  ): number;

  /**
   * Reproject a GeoPackage tile table to a new tile table
   * @param geoPackage GeoPackage
   * @param table tile table
   * @param reprojectTileDao reprojection tile DAO
   * @return created tiles
   */
  public static reproject(geoPackage: GeoPackage, table: string, reprojectTileDao: TileDao): number;

  /**
   * Reproject a GeoPackage tile table to a new tile table
   * @param tileDao tile DAO
   * @param reprojectTileDao reprojection tile DAO
   * @return created tiles
   */
  public static reproject(tileDao: TileDao, reprojectTileDao: TileDao): number;

  /**
   * Reproject a GeoPackage tile table to a new tile table
   * @param geoPackage GeoPackage
   * @param table tile table
   * @param reprojectGeoPackage GeoPackage for reprojected tile table
   * @param reprojectTileDao reprojection tile DAO
   * @return created tiles
   */
  public static reproject(
    geoPackage: GeoPackage,
    table: string,
    reprojectGeoPackage: GeoPackage,
    reprojectTileDao: TileDao,
  ): number;

  /**
   * Reproject a GeoPackage tile table to a new tile table
   *
   * @param tileDao tile DAO
   * @param reprojectGeoPackage GeoPackage for reprojected tile table
   * @param reprojectTileDao reprojection tile DAO
   * @return created tiles
   */
  public static reproject(tileDao: TileDao, reprojectGeoPackage: GeoPackage, reprojectTileDao: TileDao): number;

  /**
   * Reproject a GeoPackage tile table, replacing the existing tiles
   * @param geoPackage GeoPackage
   * @param table tile table
   * @param optimize desired optimization
   * @return created tiles
   */
  public static reproject(geoPackage: GeoPackage, table: string, optimize: TileReprojectionOptimize): number;

  /**
   * Reproject a GeoPackage tile table to a new tile table within the
   * GeoPackage
   * @param geoPackage GeoPackage
   * @param table tile table
   * @param reprojectTable new reprojected tile table
   * @param optimize desired optimization
   * @return created tiles
   */
  public static reproject(
    geoPackage: GeoPackage,
    table: string,
    reprojectTable: string,
    optimize: TileReprojectionOptimize,
  ): number;

  /**
   * Reproject a GeoPackage tile table to a new tile table in a specified
   * GeoPackage
   * @param geoPackage GeoPackage
   * @param table tile table
   * @param reprojectGeoPackage GeoPackage for reprojected tile table
   * @param reprojectTable new reprojected tile table
   * @param optimize desired optimization
   * @return created tiles
   */
  public static reproject(
    geoPackage: GeoPackage,
    table: string,
    reprojectGeoPackage: GeoPackage,
    reprojectTable: string,
    optimize: TileReprojectionOptimize,
  ): number;

  /**
   * Reproject a tile table to a new tile table in a specified GeoPackage
   * @param tileDao tile DAO
   * @param reprojectGeoPackage GeoPackage for reprojected tile table
   * @param reprojectTable new reprojected tile table
   * @param optimize desired optimization
   * @return created tiles
   */
  public static reproject(
    tileDao: TileDao,
    reprojectGeoPackage: GeoPackage,
    reprojectTable: string,
    optimize: TileReprojectionOptimize,
  ): number;

  /**
   * Reproject a tile table to a target projection
   * @param args
   */
  public static reproject(...args): number {
    let result = null;
    let tileReprojection = null;
    if (args.length === 2) {
      tileReprojection = TileReprojection.create(args[0], args[1]);
    } else if (args.length === 3) {
      tileReprojection = TileReprojection.create(args[0], args[1], args[2]);
    } else if (args.length === 4) {
      tileReprojection = TileReprojection.create(args[0], args[1], args[2], args[3]);
    } else if (args.length === 5) {
      tileReprojection = TileReprojection.create(args[0], args[1], args[2], args[3], args[4]);
    }
    if (tileReprojection == null) {
      throw new GeoPackageException('Invalid arguments for static method: TileReprojection -> reproject.');
    } else {
      result = tileReprojection.reproject();
    }

    return result;
  }

  /**
   * Constructor, reproject a tile table to a new tile table in a specified
   * GeoPackage
   * @param tileDao tile DAO
   * @param geoPackage GeoPackage for reprojected tile table
   * @param table new reprojected tile table
   * @param projection desired projection
   */
  public constructor(tileDao: TileDao, geoPackage: GeoPackage, table: string, projection: Projection);

  /**
   * Constructor, reproject a GeoPackage tile table to a new tile table
   * @param tileDao tile DAO
   * @param reprojectTileDao reprojection tile DAO
   */
  public constructor(tileDao: TileDao, reprojectTileDao: TileDao);

  /**
   * Constructor, reproject a GeoPackage tile table to a new tile table
   * @param tileDao tile DAO
   * @param geoPackage GeoPackage for reprojected tile table
   * @param reprojectTileDao reprojection tile DAO
   */
  public constructor(tileDao: TileDao, geoPackage: GeoPackage, reprojectTileDao: TileDao);

  /**
   * Constructor
   * @param args
   */
  public constructor(...args) {
    if (args.length === 2) {
      this.tileDao = args[0] as TileDao;
      this.reprojectTileDao = args[1] as TileDao;
    } else if (args.length === 3) {
      this.tileDao = args[0] as TileDao;
      this.reprojectTileDao = args[2] as TileDao;
      this.geoPackage = args[1] as GeoPackage;
    } else if (args.length === 4) {
      this.tileDao = args[0] as TileDao;
      this.geoPackage = args[1] as GeoPackage;
      this.table = args[2] as string;
      this.projection = args[3] as Projection;
    }
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
   * Get the reprojection tile DAO
   *
   * @return reprojection tile DAO
   */
  public getReprojectTileDao(): TileDao {
    return this.reprojectTileDao;
  }

  /**
   * {@inheritDoc}
   */
  protected getOptimizeZoom(): number {
    const tileDao = this.getTileDao();
    return tileDao.getMapZoomWithTileMatrix(tileDao.getTileMatrixAtMinZoom());
  }

  /**
   * {@inheritDoc}
   */
  protected createReprojectTileDao(table: string): TileDao {
    return this.getGeoPackage().getTileDao(table);
  }

  /**
   * Get the corresponding tile dao
   *
   * @param reproject true for reprojection
   * @return tile dao
   */
  public getTileDao(reproject = false): TileDao {
    let tileDao = null;
    if (reproject) {
      tileDao = this.getReprojectTileDao();
    } else {
      tileDao = this.getTileDao();
    }
    return tileDao;
  }

  /**
   * {@inheritDoc}
   */
  protected getTileMatrixSet(reproject: boolean): TileMatrixSet {
    return this.getTileDao(reproject).getTileMatrixSet();
  }

  /**
   * {@inheritDoc}
   */
  protected getTileMatrices(reproject: boolean): TileMatrix[] {
    return this.getTileDao(reproject).getTileMatrices();
  }

  /**
   * {@inheritDoc}
   */
  protected getTileMatrix(reproject: boolean, zoom: number): TileMatrix {
    return this.getTileDao(reproject).getTileMatrix(zoom);
  }

  /**
   * {@inheritDoc}
   */
  protected deleteTileMatrices(reproject: boolean, table: string): void {
    try {
      this.getTileDao(reproject)
        .getTileMatrixDao()
        .deleteByTableName(table);
    } catch (e) {
      throw new GeoPackageException(
        'Failed to delete tile matrices for tile table. GeoPackage: ' +
          this.reprojectTileDao.getDatabase() +
          ', Tile Table: ' +
          table,
      );
    }
  }

  /**
   * {@inheritDoc}
   */
  protected getMapZoom(reproject: boolean, tileMatrix: TileMatrix): number {
    return this.getTileDao(reproject).getMapZoomWithTileMatrix(tileMatrix);
  }

  /**
   * {@inheritDoc}
   */
  protected createTileMatrix(tileMatrix: TileMatrix): void {
    try {
      this.getReprojectTileDao()
        .getTileMatrixDao()
        .createOrUpdate(tileMatrix);
    } catch (e) {
      throw new GeoPackageException(
        'Failed to create tile matrix. GeoPackage: ' +
          this.reprojectTileDao.getDatabase() +
          ', Tile Table: ' +
          tileMatrix.getTableName(),
      );
    }
  }

  /**
   * {@inheritDoc}
   */
  protected async _reproject(
    zoom: number,
    toZoom: number,
    boundingBox: BoundingBox,
    matrixWidth: number,
    matrixHeight: number,
    tileWidth: number,
    tileHeight: number,
  ): Promise<number> {
    let tiles = 0;

    const tileDao = this.getTileDao();
    const reprojectTileDao = this.getReprojectTileDao();

    const minLongitude = boundingBox.getMinLongitude();
    const maxLatitude = boundingBox.getMaxLatitude();

    const longitudeRange = boundingBox.getLongitudeRange();
    const latitudeRange = boundingBox.getLatitudeRange();

    const zoomBounds = tileDao.getBoundingBoxAtZoomLevelWithProjection(zoom, reprojectTileDao.getProjection());
    const tileGrid = TileBoundingBoxUtils.getTileGrid(boundingBox, matrixWidth, matrixHeight, zoomBounds);

    const tileCreator = new TileCreator(
      tileDao,
      tileWidth,
      tileHeight,
      reprojectTileDao.getProjection(),
      ImageType.PNG,
    );

    for (let tileRow = tileGrid.getMinY(); tileRow <= tileGrid.getMaxY(); tileRow++) {
      const tileMaxLatitude = maxLatitude - (tileRow / matrixHeight) * latitudeRange;
      const tileMinLatitude = maxLatitude - ((tileRow + 1) / matrixHeight) * latitudeRange;

      for (let tileColumn = tileGrid.getMinX(); this.isActive() && tileColumn <= tileGrid.getMaxX(); tileColumn++) {
        const tileMinLongitude = minLongitude + (tileColumn / matrixWidth) * longitudeRange;
        const tileMaxLongitude = minLongitude + ((tileColumn + 1) / matrixWidth) * longitudeRange;

        const tileBounds = new BoundingBox(tileMinLongitude, tileMinLatitude, tileMaxLongitude, tileMaxLatitude);

        const tile = tileCreator.getTile(tileBounds, zoom);

        if (tile != null) {
          let row = reprojectTileDao.queryForTile(tileColumn, tileRow, toZoom);

          const insert = row == null;
          if (insert) {
            row = reprojectTileDao.newRow();
            row.setTileColumn(tileColumn);
            row.setTileRow(tileRow);
            row.setZoomLevel(toZoom);
          }

          try {
            await row.setTileDataWithGeoPackageImage(tile.getImage(), ImageType.PNG);
          } catch (e) {
            throw new GeoPackageException(
              'Failed to set tile data from image. GeoPackage: ' +
                reprojectTileDao.getDatabase() +
                ', Tile Table: ' +
                reprojectTileDao.getTableName(),
            );
          }

          if (insert) {
            reprojectTileDao.insert(row);
          } else {
            reprojectTileDao.update(row);
          }
          tiles++;

          if (this.progress != null) {
            this.progress.addProgress(1);
          }
        }
      }
    }

    return tiles;
  }

  /**
   * Get the optimization
   *
   * @return optimization
   */
  public getOptimize(): TileReprojectionOptimize {
    return this.optimize;
  }

  /**
   * Set the optimization
   *
   * @param optimize optimization
   */
  public setOptimize(optimize: TileReprojectionOptimize): void {
    this.optimize = optimize;
  }

  /**
   * Is overwrite enabled
   *
   * @return overwrite flag
   */
  public isOverwrite(): boolean {
    return this.overwrite;
  }

  /**
   * Set the overwrite flag
   *
   * @param overwrite overwrite flag
   */
  public setOverwrite(overwrite: boolean): void {
    this.overwrite = overwrite;
  }

  /**
   * Get the tile width
   *
   * @return tile width
   */
  public getTileWidth(): number {
    return this.tileWidth;
  }

  /**
   * Set the tile width
   *
   * @param tileWidth tile width
   */
  public setTileWidth(tileWidth: number): void {
    this.tileWidth = tileWidth;
  }

  /**
   * Get the tile height
   *
   * @return tile height
   */
  public getTileHeight(): number {
    return this.tileHeight;
  }

  /**
   * Set the tile height
   *
   * @param tileHeight tile height
   */
  public setTileHeight(tileHeight: number): void {
    this.tileHeight = tileHeight;
  }

  /**
   * Get the progress callbacks
   *
   * @return progress
   */
  public getProgress(): GeoPackageProgress {
    return this.progress;
  }

  /**
   * Set the progress callbacks
   * @param progress progress callbacks
   */
  public setProgress(progress: GeoPackageProgress): void {
    this.progress = progress;
  }

  /**
   * Get the zoom level configurations
   *
   * @return zoom configs
   */
  public getZoomConfigs(): Map<number, TileReprojectionZoom> {
    return this.zoomConfigs;
  }

  /**
   * Get the zoom level configuration for a zoom level
   *
   * @param zoom from zoom level
   * @return zoom config
   */
  public getConfig(zoom: number): TileReprojectionZoom {
    return this.zoomConfigs.get(zoom);
  }

  /**
   * Get the zoom level configuration or create new configuration for a zoom
   * level
   *
   * @param zoom from zoom level
   * @return zoom config
   */
  public getConfigOrCreate(zoom: number): TileReprojectionZoom {
    let config = this.getConfig(zoom);
    if (config == null) {
      config = new TileReprojectionZoom(zoom);
      this.setConfig(config);
    }
    return config;
  }

  /**
   * Set a zoom level configuration for a zoom level
   * @param config zoom configuration
   */
  public setConfig(config: TileReprojectionZoom): void {
    this.zoomConfigs.set(config.getZoom(), config);
  }

  /**
   * Set a reprojected to zoom level for a zoom level
   *
   * @param zoom zoom level
   * @param toZoom reprojected zoom level
   */
  public setToZoom(zoom: number, toZoom: number): void {
    this.getConfigOrCreate(zoom).setToZoom(toZoom);
  }

  /**
   * Get a reprojected to zoom level from a zoom level, defaults as the zoom
   * level if not set
   *
   * @param zoom zoom level
   * @return reprojected to zoom level
   */
  public getToZoom(zoom: number): number {
    let toZoom = zoom;
    const config = this.getConfig(zoom);
    if (config != null && config.hasToZoom()) {
      toZoom = config.getToZoom();
    }
    return toZoom;
  }

  /**
   * Set a reprojected tile width for a zoom level
   *
   * @param tileWidth reprojected tile width
   * @param zoom zoom level
   */
  public setTileWidthWithZoom(zoom: number, tileWidth: number): void {
    this.getConfigOrCreate(zoom).setTileWidth(tileWidth);
  }

  /**
   * Get a reprojected tile width from a zoom level
   *
   * @param zoom zoom level
   * @return reprojected tile width
   */
  public getTileWidthWithZoom(zoom: number): number {
    let tileWidth = this.tileWidth;
    const config = this.getConfig(zoom);
    if (config != null && config.hasTileWidth()) {
      tileWidth = config.getTileWidth();
    }
    return tileWidth;
  }

  /**
   * Set a reprojected tile height for a zoom level
   * @param zoom zoom level
   * @param tileHeight reprojected tile height
   */
  public setTileHeightWithZoom(zoom: number, tileHeight: number): void {
    this.getConfigOrCreate(zoom).setTileHeight(tileHeight);
  }

  /**
   * Get a reprojected tile height from a zoom level
   * @param zoom zoom level
   * @return reprojected tile height
   */
  public getTileHeightWithZoom(zoom: number): number {
    let tileHeight = this.tileHeight;
    const config = this.getConfig(zoom);
    if (config != null && config.hasTileHeight()) {
      tileHeight = config.getTileHeight();
    }
    return tileHeight;
  }

  /**
   * Set a reprojected matrix width for a zoom level
   *
   * @param matrixWidth reprojected matrix width
   * @param zoom zoom level
   */
  public setMatrixWidthWithZoom(zoom: number, matrixWidth: number): void {
    this.getConfigOrCreate(zoom).setMatrixWidth(matrixWidth);
  }

  /**
   * Get a reprojected matrix width from a zoom level
   *
   * @param zoom zoom level
   * @return reprojected matrix width
   */
  public getMatrixWidthWithZoom(zoom: number): number {
    let matrixWidth = null;
    const config = this.getConfig(zoom);
    if (config != null && config.hasMatrixWidth()) {
      matrixWidth = config.getMatrixWidth();
    }
    return matrixWidth;
  }

  /**
   * Set a reprojected matrix height for a zoom level
   *
   * @param matrixHeight reprojected matrix height
   * @param zoom zoom level
   */
  public setMatrixHeight(zoom: number, matrixHeight: number): void {
    this.getConfigOrCreate(zoom).setMatrixHeight(matrixHeight);
  }

  /**
   * Get a reprojected matrix height from a zoom level
   *
   * @param zoom zoom level
   * @return reprojected matrix height
   */
  public getMatrixHeight(zoom: number): number {
    let matrixHeight = null;
    const config = this.getConfig(zoom);
    if (config != null && config.hasMatrixHeight()) {
      matrixHeight = config.getMatrixHeight();
    }
    return matrixHeight;
  }

  /**
   * Initialize the reprojection
   */
  protected initialize(): void {
    if (this.reprojectTileDao == null) {
      let boundingBox = this.tileDao.getBoundingBoxWithProjection(this.projection);
      const contentsBoundingBox = boundingBox;
      let srs;
      try {
        srs = this.geoPackage.getSpatialReferenceSystemDao().getOrCreate(this.projection);
      } catch (e) {
        throw new GeoPackageException(
          'Failed to create Spatial Reference System for projection. Authority: ' +
            this.projection.getAuthority() +
            ', Code: ' +
            this.projection.getCode(),
        );
      }

      if (
        this.tileDao.getDatabase() === this.geoPackage.getName() &&
        this.tileDao.getTableName().toLowerCase() === this.table.toLowerCase()
      ) {
        // Replacing source table, find a temp table name for the
        // reprojections
        let count = 1;
        let tempTable = this.table + '_' + ++count;
        while (
          SQLiteMaster.count(
            this.tileDao.getDb(),
            [],
            SQLiteMasterQuery.createForColumnValue(SQLiteMasterColumn.NAME, tempTable),
          ) > 0
        ) {
          tempTable = this.table + '_' + ++count;
        }
        this.table = tempTable;
        this.replace = true;
      }

      if (this.optimize != null) {
        boundingBox = this.optimizeWithBoundingBox(boundingBox);
      }

      let tileTable = null;
      if (this.geoPackage.isTable(this.table)) {
        if (!this.geoPackage.isTileTable(this.table)) {
          throw new GeoPackageException('Table exists and is not a tile table: ' + this.table);
        }

        this.reprojectTileDao = this.createReprojectTileDao(this.table);

        if (!this.reprojectTileDao.getProjection().equalsProjection(this.projection)) {
          throw new GeoPackageException(
            'Existing tile table projection differs from the reprojection. Table: ' +
              this.table +
              ', Projection: ' +
              this.projection +
              ', Reprojection: ' +
              this.reprojectTileDao.getProjection(),
          );
        }

        const tileMatrixSet = this.getTileMatrixSet(true);
        const tileMatrices = this.getTileMatrices(true);

        if (tileMatrices.length > 0) {
          const tileMatrix = tileMatrices[0];
          if (
            Math.abs(tileMatrixSet.getMinX() - boundingBox.getMinLongitude()) > tileMatrix.getPixelXSize() ||
            Math.abs(tileMatrixSet.getMinY() - boundingBox.getMinLatitude()) > tileMatrix.getPixelYSize() ||
            Math.abs(tileMatrixSet.getMaxX() - boundingBox.getMaxLongitude()) > tileMatrix.getPixelXSize() ||
            Math.abs(tileMatrixSet.getMaxY() - boundingBox.getMaxLatitude()) > tileMatrix.getPixelYSize()
          ) {
            if (!this.overwrite) {
              throw new GeoPackageException(
                "Existing Tile Matrix Set Geographic Properties differ. Enable 'overwrite' to replace all tiles. GeoPackage: " +
                  this.reprojectTileDao.getDatabase() +
                  ', Tile Table: ' +
                  this.reprojectTileDao.getTableName(),
              );
            }

            this.deleteTileMatrices(true, this.table);
            this.reprojectTileDao.deleteAll();
          }
        }

        const contents = this.reprojectTileDao.getContents();
        contents.setSrsId(srs.getSrsId());
        contents.setMinX(contentsBoundingBox.getMinLongitude());
        contents.setMinY(contentsBoundingBox.getMinLatitude());
        contents.setMaxX(contentsBoundingBox.getMaxLongitude());
        contents.setMaxY(contentsBoundingBox.getMaxLatitude());
        try {
          this.geoPackage.getContentsDao().update(contents);
        } catch (e) {
          throw new GeoPackageException(
            'Failed to update reprojection tile table contents. GeoPackage: ' +
              this.reprojectTileDao.getDatabase() +
              ', Table: ' +
              this.reprojectTileDao.getTableName(),
          );
        }

        tileMatrixSet.setSrsId(srs.getSrsId());
        tileMatrixSet.setMinX(boundingBox.getMinLongitude());
        tileMatrixSet.setMinY(boundingBox.getMinLatitude());
        tileMatrixSet.setMaxX(boundingBox.getMaxLongitude());
        tileMatrixSet.setMaxY(boundingBox.getMaxLatitude());
        try {
          this.geoPackage.getTileMatrixSetDao().update(tileMatrixSet);
        } catch (e) {
          throw new GeoPackageException(
            'Failed to update reprojection tile matrix set. GeoPackage: ' +
              this.reprojectTileDao.getDatabase() +
              ', Table: ' +
              this.reprojectTileDao.getTableName(),
          );
        }
      } else {
        tileTable = this.geoPackage.createTileTableWithMetadata(
          TileTableMetadata.create(this.table, contentsBoundingBox, undefined, boundingBox, srs.getSrsId()),
        );
        this.reprojectTileDao = this.createReprojectTileDao(tileTable.getTableName());
      }
    }
  }

  /**
   * Finish the reprojection
   */
  protected finish(): void {
    const active = this.isActive();
    if (this.replace) {
      if (active) {
        this.geoPackage.deleteTable(this.tileDao.getTableName());
        this.geoPackage.copyTable(this.reprojectTileDao.getTableName(), this.tileDao.getTableName());
        this.geoPackage.deleteTable(this.reprojectTileDao.getTableName());
        this.reprojectTileDao = null;
      }
      this.table = this.tileDao.getTableName();
      this.replace = false;
    }
    if (this.progress != null && !active && this.progress.cleanupOnCancel()) {
      if (this.geoPackage == null) {
        throw new GeoPackageException(
          'Reprojeciton cleanup not supported when constructed without the GeoPackage. GeoPackage:' +
            this.reprojectTileDao.getDatabase() +
            ', Tile Table: ' +
            this.reprojectTileDao.getTableName(),
        );
      }
      this.geoPackage.deleteTable(this.reprojectTileDao.getTableName());
    }
  }

  /**
   * Reproject the tile table
   * @return created tiles
   */
  public async reproject(): Promise<number> {
    this.initialize();
    let tiles = 0;
    for (const tileMatrix of this.getTileMatrices(false)) {
      if (!this.isActive()) {
        break;
      }
      tiles += await this.reprojectIfExists(tileMatrix.getZoomLevel());
    }
    this.finish();
    return tiles;
  }

  /**
   * Reproject the tile table within the zoom range
   *
   * @param minZoom min zoom
   * @param maxZoom max zoom
   * @return created tiles
   */
  public async reprojectWithZoomRange(minZoom: number, maxZoom: number): Promise<number> {
    this.initialize();
    let tiles = 0;
    for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
      if (!this.isActive()) {
        break;
      }
      tiles += await this.reprojectIfExists(zoom);
    }
    this.finish();
    return tiles;
  }

  /**
   * Reproject the tile table for the zoom levels, ordered numerically lowest
   * to highest
   *
   * @param zooms zoom levels, ordered lowest to highest
   * @return created tiles
   */
  public async reprojectZoomLevels(zooms: number[]): Promise<number> {
    this.initialize();
    let tiles = 0;
    for (const zoom of zooms) {
      if (!this.isActive()) {
        break;
      }
      tiles += await this.reprojectIfExists(zoom);
    }
    this.finish();
    return tiles;
  }

  /**
   * Reproject the tile table for the zoom level
   *
   * @param zoom zoom level
   * @return created tiles
   */
  public async reprojectZoomLevel(zoom: number): Promise<number> {
    this.initialize();
    const tiles = await this.reprojectIfExists(zoom);
    this.finish();
    return tiles;
  }

  /**
   * Reproject the zoom level if it exists
   *
   * @param zoom zoom level
   * @return created tiles
   */
  private async reprojectIfExists(zoom: number): Promise<number> {
    let tiles = 0;
    const tileMatrix = this.getTileMatrix(false, zoom);
    if (tileMatrix != null) {
      tiles = await this.reprojectWithTileMatrix(tileMatrix);
    }
    return tiles;
  }

  /**
   * Rerpoject the tile matrix
   *
   * @param tileMatrix tile matrix
   * @return created tiles
   */
  private async reprojectWithTileMatrix(tileMatrix: TileMatrix): Promise<number> {
    const zoom = tileMatrix.getZoomLevel();
    let toZoom = this.getToZoom(zoom);

    let tileWidth = this.getTileWidthWithZoom(zoom);
    if (tileWidth == null) {
      tileWidth = tileMatrix.getTileWidth();
    }

    let tileHeight = this.getTileHeightWithZoom(zoom);
    if (tileHeight == null) {
      tileHeight = tileMatrix.getTileHeight();
    }

    let matrixWidth = this.getMatrixWidthWithZoom(zoom);
    if (matrixWidth == null) {
      matrixWidth = tileMatrix.getMatrixWidth();
    }

    let matrixHeight = this.getMatrixWidthWithZoom(zoom);
    if (matrixHeight == null) {
      matrixHeight = tileMatrix.getMatrixHeight();
    }

    const boundingBox = this.reprojectTileDao.getBoundingBox();

    if (this.optimizeTileGrid != null) {
      toZoom = this.getMapZoom(false, tileMatrix);

      const tileGrid = TileBoundingBoxUtils.tileGridZoom(this.optimizeTileGrid, this.optimizeZoom, toZoom);
      matrixWidth = tileGrid.getWidth();
      matrixHeight = tileGrid.getHeight();
    }

    const pixelXSize = boundingBox.getLongitudeRange() / matrixWidth / tileWidth;
    const pixelYSize = boundingBox.getLatitudeRange() / matrixHeight / tileHeight;

    let saveTileMatrix = true;

    let toTileMatrix = this.getTileMatrix(true, toZoom);
    if (toTileMatrix == null) {
      toTileMatrix = new TileMatrix();
      toTileMatrix.setTableName(this.reprojectTileDao.getContents().getId());
      toTileMatrix.setZoomLevel(toZoom);
    } else if (
      toTileMatrix.getMatrixHeight() != matrixHeight ||
      toTileMatrix.getMatrixWidth() != matrixWidth ||
      toTileMatrix.getTileHeight() != tileHeight ||
      toTileMatrix.getTileWidth() != tileWidth ||
      Math.abs(toTileMatrix.getPixelXSize() - pixelXSize) > TileReprojection.PIXEL_SIZE_DELTA ||
      Math.abs(toTileMatrix.getPixelYSize() - pixelYSize) > TileReprojection.PIXEL_SIZE_DELTA
    ) {
      if (!this.overwrite) {
        throw new GeoPackageException(
          "Existing Tile Matrix Geographic Properties differ. Enable 'overwrite' to replace existing tiles at zoom level " +
            toZoom +
            '. GeoPackage: ' +
            this.reprojectTileDao.getDatabase() +
            ', Tile Table: ' +
            this.reprojectTileDao.getTableName(),
        );
      }

      // Delete the existing tiles at the zoom level
      const fieldValues = new ColumnValues();
      fieldValues.addColumn(TileColumns.ZOOM_LEVEL, toTileMatrix.getZoomLevel());
      this.reprojectTileDao.deleteWithFieldValues(fieldValues);
    } else {
      saveTileMatrix = false;
    }

    if (saveTileMatrix) {
      // Create or update the tile matrix
      toTileMatrix.setMatrixHeight(matrixHeight);
      toTileMatrix.setMatrixWidth(matrixWidth);
      toTileMatrix.setTileHeight(tileHeight);
      toTileMatrix.setTileWidth(tileWidth);
      toTileMatrix.setPixelXSize(pixelXSize);
      toTileMatrix.setPixelYSize(pixelYSize);
      this.createTileMatrix(toTileMatrix);
    }
    return this._reproject(zoom, toZoom, boundingBox, matrixWidth, matrixHeight, tileWidth, tileHeight);
  }

  /**
   * Optimize the bounding box
   * @param boundingBox bounding box
   * @return optimized bounding box
   */
  protected optimizeWithBoundingBox(boundingBox: BoundingBox): BoundingBox {
    if (this.optimize.isWorld()) {
      this.optimizeZoom = 0;
      this.optimizeTileGrid = this.optimize.getTileGrid();
      boundingBox = this.optimize.getBoundingBox();
      const transform = GeometryTransform.create(this.optimize.getProjection(), this.projection);
      if (!this.optimize.getProjection().equalsProjection(this.projection)) {
        boundingBox = boundingBox.transform(transform);
      }
    } else {
      this.optimizeZoom = this.getOptimizeZoom();
      const transform = GeometryTransform.create(this.projection, this.optimize.getProjection());
      if (!this.optimize.getProjection().equalsProjection(this.projection)) {
        boundingBox = boundingBox.transform(transform);
      }
      this.optimizeTileGrid = this.optimize.getTileGridFromBoundingBox(boundingBox, this.optimizeZoom);
      boundingBox = this.optimize.getBoundingBoxFromTileGrid(this.optimizeTileGrid, this.optimizeZoom);
      if (!this.optimize.getProjection().equalsProjection(this.projection)) {
        boundingBox = boundingBox.transform(transform.getInverseTransformation());
      }
    }
    return boundingBox;
  }

  /**
   * Check if currently active
   *
   * @return true if active
   */
  protected isActive(): boolean {
    return this.progress == null || this.progress.isActive();
  }
}
