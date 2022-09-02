import { FeatureDao } from '../../features/user/featureDao';
import { GeoPackage } from '../../geoPackage';
import { FeatureTiles } from './featureTiles';
import { SQLUtils } from '../../db/sqlUtils';
import { GeoPackageException } from '../../geoPackageException';
import { GeoPackageImage } from '../../image/geoPackageImage';
import { Projections } from '@ngageoint/projections-js';
import { TileBoundingBoxUtils } from '../tileBoundingBoxUtils';
import { FeatureResultSet } from '../../features/user/featureResultSet';
import { EmulatedCanvas2D } from '../../../@types/canvaskit';

/**
 * Feature Preview for drawing a preview tile from a feature table
 */
export class FeaturePreview {
  /**
   * GeoPackage
   */
  private readonly geoPackage: GeoPackage;

  /**
   * Feature Tiles for drawing
   */
  private readonly featureTiles: FeatureTiles;

  /**
   * Manual bounding box query flag for non indexed and empty contents bounds
   * feature tables
   */
  private manual = false;

  /**
   * Buffer percentage for drawing empty non features edges (greater than or
   * equal to 0.0 and less than 0.5)
   */
  private bufferPercentage = 0.0;

  /**
   * Query columns
   */
  private columns: string[] = [];

  /**
   * Where clause
   */
  private where: string;

  /**
   * Where clause arguments
   */
  private whereArgs: any[] = null;

  /**
   * Query feature limit
   */
  private limit: number = null;

  /**
   * Constructor
   * @param geoPackage GeoPackage
   * @param featureTable feature table
   */
  public constructor(geoPackage: GeoPackage, featureTable: string);

  /**
   * Constructor
   * @param geoPackage GeoPackage
   * @param featureDao feature DAO
   */
  public constructor(geoPackage: GeoPackage, featureDao: FeatureDao);

  /**
   * Constructor
   * @param geoPackage GeoPackage
   * @param featureTiles feature tiles
   */
  public constructor(geoPackage: GeoPackage, featureTiles: FeatureTiles);

  public constructor(...args) {
    if (args.length === 2) {
      this.geoPackage = args[0] as GeoPackage;
      if (typeof args[1] === 'string') {
        this.featureTiles = new FeatureTiles(this.geoPackage, this.geoPackage.getFeatureDao(args[1]));
      } else if (args[1] instanceof FeatureDao) {
        this.featureTiles = new FeatureTiles(this.geoPackage, args[1]);
      } else {
        this.featureTiles = args[1];
      }
      const featureDao = this.featureTiles.getFeatureDao();
      this.columns.push(featureDao.getIdColumnName());
      this.columns.push(featureDao.getGeometryColumnName());
      this.where = SQLUtils.quoteWrap(featureDao.getGeometryColumnName()) + ' IS NOT NULL';
    }
  }

  /**
   * Get the GeoPackage
   * @return GeoPackage
   */
  public getGeoPackage(): GeoPackage {
    return this.geoPackage;
  }

  /**
   * Get the feature tiles
   * @return feature tiles
   */
  public getFeatureTiles(): FeatureTiles {
    return this.featureTiles;
  }

  /**
   * Is manual bounding box query enabled for non indexed and empty contents
   * bounds feature tables
   * @return manual flag
   */
  public isManual(): boolean {
    return this.manual;
  }

  /**
   * Set the manual bounding box query flag for non indexed and empty contents
   * bounds feature tables
   * @param manual manual flag
   */
  public setManual(manual: boolean): void {
    this.manual = manual;
  }

  /**
   * Get the buffer percentage for drawing empty non features edges (i.e. 0.1
   * equals 10% buffer edges)
   * @return buffer percentage (greater than or equal to 0.0 and less than 0.5)
   */
  public getBufferPercentage(): number {
    return this.bufferPercentage;
  }

  /**
   * Set the buffer percentage for drawing empty non features edges (i.e. 0.1
   * equals 10% buffer edges)
   * @param bufferPercentage buffer percentage (greater than or equal to 0.0 and less than 0.5)
   */
  public setBufferPercentage(bufferPercentage: number): void {
    if (bufferPercentage < 0.0 || bufferPercentage >= 0.5) {
      throw new GeoPackageException(
        'Buffer percentage must be in the range: 0.0 <= bufferPercentage < 0.5. invalid value: ' + bufferPercentage,
      );
    }
    this.bufferPercentage = bufferPercentage;
  }

  /**
   * Get the query columns
   * @return columns
   */
  public getColumns(): string[] {
    return this.columns.slice();
  }

  /**
   * Add query columns
   * @param columns columns
   */
  public addColumns(columns: string[]): void {
    this.columns.push(...columns);
  }

  /**
   * Add a query column
   * @param column column
   */
  public addColumn(column: string): void {
    this.columns.push(column);
  }

  /**
   * Get the where clause
   * @return where
   */
  public getWhere(): string {
    return this.where;
  }

  /**
   * Set the where clause
   * @param where where
   */
  public setWhere(where: string): void {
    this.where = where;
  }

  /**
   * Append to the where clause
   * @param where where
   */
  public appendWhere(where: string): void {
    this.where = (this.where != null ? this.where + ' AND ' : '') + where;
  }

  /**
   * Get the where arguments
   *
   * @return where args
   */
  public getWhereArgs(): any[] {
    return this.whereArgs;
  }

  /**
   * Set the where arguments
   * @param whereArgs where arguments
   */
  public setWhereArgs(whereArgs: any[]): void {
    this.whereArgs = whereArgs;
  }

  /**
   * Get the feature query limit
   *
   * @return limit
   */
  public getLimit(): number {
    return this.limit;
  }

  /**
   * Set the feature query limit
   *
   * @param limit
   *            limit
   */
  public setLimit(limit: number): void {
    this.limit = limit;
  }

  /**
   * Draw a preview image
   * @param canvas optional canvas to draw into
   * @return preview image
   */
  public draw(canvas?: HTMLCanvasElement | OffscreenCanvas | EmulatedCanvas2D): GeoPackageImage {
    let image = null;

    const featureDao = this.featureTiles.getFeatureDao();
    const table = featureDao.getTableName();

    const webMercator = Projections.getWebMercatorProjection();

    let boundingBox = this.geoPackage.getFeatureBoundingBox(webMercator, table, false);
    if (boundingBox == null) {
      boundingBox = this.geoPackage.getContentsBoundingBoxWithProjection(table, webMercator);
    }
    if (boundingBox == null && this.manual) {
      boundingBox = this.geoPackage.getFeatureBoundingBox(webMercator, table, this.manual);
    }
    if (boundingBox != null) {
      boundingBox = TileBoundingBoxUtils.boundWebMercatorBoundingBox(boundingBox);
      let expandedBoundingBox = boundingBox.squareExpand(this.bufferPercentage);
      expandedBoundingBox = TileBoundingBoxUtils.boundWebMercatorBoundingBox(expandedBoundingBox);
      const zoom = TileBoundingBoxUtils.getZoomLevel(expandedBoundingBox);

      const results: FeatureResultSet = featureDao.query(
        false,
        this.columns,
        this.where,
        this.whereArgs,
        null,
        null,
        null,
        null,
        this.limit,
      );
      image = this.featureTiles.drawTileWithFeatureResultSet(zoom, expandedBoundingBox, results, webMercator, canvas);
    }

    return image;
  }
}
