import { FeatureDao } from '../../features/user/featureDao';
import { FeatureResultSet } from '../../features/user/featureResultSet';
import { GeoPackageProgress } from '../../io/geoPackageProgress';
import { UserCustomDao } from '../../user/custom/userCustomDao';
import { Extensions } from '../extensions';
import { UserCustomResultSet } from '../../user/custom/userCustomResultSet';
import { FeatureRow } from '../../features/user/featureRow';
import { RTreeIndexTableRow } from './rTreeIndexTableRow';
import { UserCustomRow } from '../../user/custom/userCustomRow';
import { GeoPackageException } from '../../geoPackageException';
import { ColumnValues } from '../../dao/columnValues';
import { BoundingBox } from '../../boundingBox';
import { Projection } from '@ngageoint/projections-js';
import { GeometryEnvelope } from '@ngageoint/simple-features-js';
import { SQLUtils } from '../../db/sqlUtils';
import { GeometryTransform } from '@ngageoint/simple-features-proj-js';
import { RTreeIndexExtensionConstants } from './rTreeIndexExtensionConstants';
import type { RTreeIndexExtension } from './rTreeIndexExtension';

/**
 * RTree Index Table DAO for reading geometry index ranges
 */
export class RTreeIndexTableDao extends UserCustomDao {
  /**
   * RTree index extension
   */
  private readonly rTree: RTreeIndexExtension;

  /**
   * Feature DAO
   */
  private readonly featureDao: FeatureDao;

  /**
   * Progress
   */
  protected progress: GeoPackageProgress;

  /**
   * Query range tolerance
   */
  protected tolerance = 0.00000000000001;

  /**
   * Constructor
   *
   * @param rTree RTree extension
   * @param dao user custom data access object
   * @param featureDao feature DAO
   */
  constructor(rTree: RTreeIndexExtension, dao: UserCustomDao, featureDao: FeatureDao) {
    super(dao, dao.getTable());
    this.rTree = rTree;
    this.featureDao = featureDao;
    this.projection = featureDao.getProjection();
  }

  /**
   * Set the progress tracker
   *
   * @param progress progress tracker
   */
  public setProgress(progress: GeoPackageProgress): void {
    this.progress = progress;
  }

  /**
   * Get the query range tolerance
   *
   * @return query range tolerance
   */
  public getTolerance(): number {
    return this.tolerance;
  }

  /**
   * Set the query range tolerance
   *
   * @param tolerance query range tolerance
   */
  public setTolerance(tolerance: number): void {
    this.tolerance = tolerance;
  }

  /**
   * Determine if this feature table has the RTree extension
   *
   * @return true if has extension
   */
  public has(): boolean {
    return this.rTree.hasExtensionWithFeatureTable(this.featureDao.getTable());
  }

  /**
   * Create the RTree extension for the feature table
   * @return extension
   */
  public createExtension(): Extensions {
    let extension = null;
    if (!this.has()) {
      extension = this.rTree.createWithFeatureTable(this.featureDao.getTable());
      if (this.progress != null) {
        this.progress.addProgress(this.count());
      }
    }
    return extension;
  }

  /**
   * Delete the RTree extension for the feature table
   */
  public deleteExtension(): void {
    this.rTree.deleteWithFeatureTable(this.featureDao.getTable());
  }

  /**
   * Get the RTree index extension
   *
   * @return RTree index extension
   */
  public getRTreeIndexExtension(): RTreeIndexExtension {
    return this.rTree;
  }

  /**
   * Get the feature DAO
   *
   * @return feature DAO
   */
  public getFeatureDao(): FeatureDao {
    return this.featureDao;
  }

  /**
   * Query for rtree index records
   * @param where
   * @param whereArgs
   * @param join
   * @param groupBy
   * @param having
   * @param orderBy
   * @param limit
   * @param offset
   */
  public query(where?: string, whereArgs?: any[], join?: string, groupBy?: string, having?: string, orderBy?: string, limit?: number, offset?: number): UserCustomResultSet {
    return this.queryWithDistinctAndColumns(undefined, undefined, where, whereArgs, join, groupBy, having, orderBy, limit);
  }

  /**
   * Query for rtree index records
   * @param distinct
   * @param where
   * @param whereArgs
   * @param join
   * @param groupBy
   * @param having
   * @param orderBy
   * @param limit
   * @param offset
   */
  public queryWithDistinct(distinct: boolean, where?: string, whereArgs?: any[], join?: string, groupBy?: string, having?: string, orderBy?: string, limit?: number, offset?: number): UserCustomResultSet {
    return this.queryWithDistinctAndColumns(distinct, undefined, where, whereArgs, join, groupBy, having, orderBy, limit);
  }

  /**
   * Query for rtree index records
   * @param columns
   * @param where
   * @param whereArgs
   * @param join
   * @param groupBy
   * @param having
   * @param orderBy
   * @param limit
   * @param offset
   */
  public queryWithColumns(columns: string[], where?: string, whereArgs?: any[], join?: string, groupBy?: string, having?: string, orderBy?: string, limit?: number, offset?: number): UserCustomResultSet {
    return this.queryWithDistinctAndColumns(undefined, columns, where, whereArgs, join, groupBy, having, orderBy, limit);
  }

  /**
   * Query for rtree index records
   * @param distinct
   * @param columns
   * @param where
   * @param whereArgs
   * @param join
   * @param groupBy
   * @param having
   * @param orderBy
   * @param limit
   * @param offset
   */
  public queryWithDistinctAndColumns(distinct: boolean, columns: string[], where?: string, whereArgs?: any[], join?: string, groupBy?: string, having?: string, orderBy?: string, limit?: number, offset?: number): UserCustomResultSet {
    this.validateRTree();
    return super.queryWithDistinctAndColumns(distinct, columns, where, whereArgs, join, groupBy, having, orderBy, limit);
  }

  /**
   * Query for rows within the bounds
   * @param envelope geometry envelope
   * @return results
   */
  public queryWithGeometryEnvelope(envelope: GeometryEnvelope): UserCustomResultSet {
    return this.queryWithGeometryEnvelopeAndDistinctAndColumns(undefined, undefined, envelope);
  }

  /**
   * Query for rows within the bounds
   * @param distinct distinct rows
   * @param envelope geometry envelope
   * @return results
   */
  public queryWithGeometryEnvelopeAndDistinct(distinct: boolean, envelope: GeometryEnvelope): UserCustomResultSet {
    return this.queryWithGeometryEnvelopeAndDistinctAndColumns(undefined, undefined, envelope);
  }

  /**
   * Query for rows within the bounds
   * @param columns columns
   * @param envelope geometry envelope
   * @return results
   */
  public queryWithGeometryEnvelopeAndColumns(columns: string[], envelope: GeometryEnvelope): UserCustomResultSet {
    return this.queryWithGeometryEnvelopeAndDistinctAndColumns(undefined, undefined, envelope);
  }

  /**
   * Query for rows within the bounds
   * @param distinct distinct rows
   * @param columns columns
   * @param envelope geometry envelope
   * @return results
   */
  public queryWithGeometryEnvelopeAndDistinctAndColumns(distinct: boolean, columns: string[], envelope: GeometryEnvelope): UserCustomResultSet {
    return this.queryWithBoundsAndDistinctAndColumns(distinct, columns, envelope.minX, envelope.minY, envelope.maxX, envelope.maxY);
  }
  
  /**
   * Query for rows within the bounds
   * @param boundingBox BoundingBox
   * @param projection Projection
   * @return results
   */
  public queryWithBoundingBoxAndProjection(boundingBox: BoundingBox, projection?: Projection): UserCustomResultSet {
    return this.queryWithBoundingBoxAndProjectionAndDistinctAndColumns(undefined, undefined, boundingBox, projection);
  }

  /**
   * Query for rows within the bounds
   * @param distinct distinct rows
   * @param boundingBox BoundingBox
   * @param projection Projection
   * @return results
   */
  public queryWithBoundingBoxAndProjectionAndDistinct(distinct: boolean, boundingBox: BoundingBox, projection?: Projection): UserCustomResultSet {
    return this.queryWithBoundingBoxAndProjectionAndDistinctAndColumns(distinct, undefined, boundingBox, projection);
  }

  /**
   * Query for rows within the bounds
   * @param columns columns
   * @param boundingBox BoundingBox
   * @param projection Projection
   * @return results
   */
  public queryWithBoundingBoxAndProjectionAndColumns(columns: string[], boundingBox: BoundingBox, projection?: Projection): UserCustomResultSet {
    return this.queryWithBoundingBoxAndProjectionAndDistinctAndColumns(undefined, columns, boundingBox, projection);
  }

  /**
   * Query for rows within the bounds
   * @param distinct distinct rows
   * @param columns columns
   * @param boundingBox BoundingBox
   * @param projection Projection
   * @return results
   */
  public queryWithBoundingBoxAndProjectionAndDistinctAndColumns(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection?: Projection): UserCustomResultSet {
    const projectedBoundingBox = projection != null ? this.projectBoundingBox(boundingBox, projection) : boundingBox;
    return this.queryWithGeometryEnvelopeAndDistinctAndColumns(distinct, columns, projectedBoundingBox.buildEnvelope());
  }
  
  /**
   * Query for rows within the bounds
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @return results
   */
  public queryWithBounds(minX: number, minY: number, maxX: number, maxY: number): UserCustomResultSet {
    return this.queryWithBoundsAndDistinctAndColumns(undefined, undefined, minX, minY, maxX, maxY);
  }

  /**
   * Query for rows within the bounds
   * @param distinct distinct rows
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @return results
   */
  public queryWithBoundsAndDistinct(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number): UserCustomResultSet {
    return this.queryWithBoundsAndDistinctAndColumns(distinct, undefined, minX, minY, maxX, maxY);
  }

  /**
   * Query for rows within the bounds
   * @param columns columns
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @return results
   */
  public queryWithBoundsAndColumns(columns: string[], minX: number, minY: number, maxX: number, maxY: number): UserCustomResultSet {
    return this.queryWithBoundsAndDistinctAndColumns(undefined, columns, minX, minY, maxX, maxY);
  }

  /**
   * Query for rows within the bounds
   * @param distinct distinct rows
   * @param columns columns
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @return results
   */
  public queryWithBoundsAndDistinctAndColumns(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number): UserCustomResultSet {
    this.validateRTree();
    const where = this.buildWhereWithBounds(minX, minY, maxX, maxY);
    const whereArgs = this.buildWhereArgsWithBounds(minX, minY, maxX, maxY);
    return super.queryWithDistinctAndColumns(distinct, columns, where, whereArgs);
  }


  /**
   * Count of rtree index records
   * @param where
   * @param whereArgs
   */
  public count(where?: string, whereArgs?: any[]): number {
    return this.countWithDistinctAndColumns(undefined, undefined, where, whereArgs);
  }

  /**
   * Count of rtree index records
   * @param distinct
   * @param where
   * @param whereArgs
   */
  public countWithDistinct(distinct: boolean, where?: string, whereArgs?: any[]): number {
    return this.countWithDistinctAndColumns(distinct, undefined, where, whereArgs);
  }

  /**
   * Count of rtree index records
   * @param columns
   * @param where
   * @param whereArgs
   */
  public countWithColumns(columns: string[], where?: string, whereArgs?: any[]): number {
    return this.countWithDistinctAndColumns(undefined, columns, where, whereArgs);
  }

  /**
   * Count of rtree index records
   * @param distinct
   * @param columns
   * @param where
   * @param whereArgs
   */
  public countWithDistinctAndColumns(distinct: boolean, columns: string[], where?: string, whereArgs?: any[]): number {
    this.validateRTree();
    return super.countWithDistinctAndColumns(distinct, columns, where, whereArgs);
  }

  /**
   * Count of rows within the bounds
   * @param envelope geometry envelope
   * @return results
   */
  public countWithGeometryEnvelope(envelope: GeometryEnvelope): number {
    return this.countWithGeometryEnvelopeAndDistinctAndColumns(undefined, undefined, envelope);
  }

  /**
   * Count of rows within the bounds
   * @param distinct distinct rows
   * @param envelope geometry envelope
   * @return results
   */
  public countWithGeometryEnvelopeAndDistinct(distinct: boolean, envelope: GeometryEnvelope): number {
    return this.countWithGeometryEnvelopeAndDistinctAndColumns(distinct, undefined, envelope);
  }

  /**
   * Count of rows within the bounds
   * @param columns columns
   * @param envelope geometry envelope
   * @return results
   */
  public countWithGeometryEnvelopeAndColumns(columns: string[], envelope: GeometryEnvelope): number {
    return this.countWithGeometryEnvelopeAndDistinctAndColumns(undefined, columns, envelope);
  }

  /**
   * Count of rows within the bounds
   * @param distinct distinct rows
   * @param columns columns
   * @param envelope geometry envelope
   * @return results
   */
  public countWithGeometryEnvelopeAndDistinctAndColumns(distinct: boolean, columns: string[], envelope: GeometryEnvelope): number {
    return this.countWithBoundsAndDistinctAndColumns(distinct, columns, envelope.minX, envelope.minY, envelope.maxX, envelope.maxY);
  }

  /**
   * Count of rows within the bounds
   * @param boundingBox BoundingBox
   * @param projection Projection
   * @return results
   */
  public countWithBoundingBoxAndProjection(boundingBox: BoundingBox, projection?: Projection): number {
    return this.countWithBoundingBoxAndProjectionAndDistinctAndColumns(undefined, undefined, boundingBox, projection);
  }

  /**
   * Count of rows within the bounds
   * @param distinct distinct rows
   * @param boundingBox BoundingBox
   * @param projection Projection
   * @return results
   */
  public countWithBoundingBoxAndProjectionAndDistinct(distinct: boolean, boundingBox: BoundingBox, projection?: Projection): number {
    return this.countWithBoundingBoxAndProjectionAndDistinctAndColumns(distinct, undefined, boundingBox, projection);
  }

  /**
   * Count of rows within the bounds
   * @param columns columns
   * @param boundingBox BoundingBox
   * @param projection Projection
   * @return results
   */
  public countWithBoundingBoxAndProjectionAndColumns(columns: string[], boundingBox: BoundingBox, projection?: Projection): number {
    return this.countWithBoundingBoxAndProjectionAndDistinctAndColumns(undefined, columns, boundingBox, projection);
  }

  /**
   * Count of rows within the bounds
   * @param distinct distinct rows
   * @param columns columns
   * @param boundingBox BoundingBox
   * @param projection Projection
   * @return results
   */
  public countWithBoundingBoxAndProjectionAndDistinctAndColumns(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection?: Projection): number {
    const projectedBoundingBox = projection != null ? this.projectBoundingBox(boundingBox, projection) : boundingBox;
    return this.countWithGeometryEnvelopeAndDistinctAndColumns(distinct, columns, projectedBoundingBox.buildEnvelope());
  }

  /**
   * Count of rows within the bounds
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @return results
   */
  public countWithBounds(minX: number, minY: number, maxX: number, maxY: number): number {
    return this.countWithBoundsAndDistinctAndColumns(undefined, undefined, minX, minY, maxX, maxY);
  }

  /**
   * Count of rows within the bounds
   * @param distinct distinct rows
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @return results
   */
  public countWithBoundsAndDistinct(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number): number {
    return this.countWithBoundsAndDistinctAndColumns(distinct, undefined, minX, minY, maxX, maxY);
  }

  /**
   * Count of rows within the bounds
   * @param columns columns
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @return results
   */
  public countWithBoundsAndColumns(columns: string[], minX: number, minY: number, maxX: number, maxY: number): number {
    return this.countWithBoundsAndDistinctAndColumns(undefined, columns, minX, minY, maxX, maxY);
  }

  /**
   * Count of rows within the bounds
   * @param distinct distinct rows
   * @param columns columns
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @return results
   */
  public countWithBoundsAndDistinctAndColumns(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number): number {
    const where = this.buildWhereWithBounds(minX, minY, maxX, maxY);
    const whereArgs = this.buildWhereArgsWithBounds(minX, minY, maxX, maxY);
    return this.countWithDistinctAndColumns(distinct, columns, where, whereArgs);
  }


  /**
   * Get the RTree Index Table row from the current result set location
   *
   * @param resultSet result set
   * @return RTree Index Table row
   */
  public getRowWithUserCustomResultSet(resultSet: UserCustomResultSet): RTreeIndexTableRow {
    return this.getRow(resultSet.getRow());
  }

  /**
   * Get the RTree Index Table row from the user custom row
   *
   * @param row custom row
   * @return RTree Index Table row
   */
  public getRow(row: UserCustomRow): RTreeIndexTableRow {
    return new RTreeIndexTableRow(row);
  }

  /**
   * Get the feature row from the RTree Index Table row
   *
   * @param row RTree Index Table row
   * @return feature row
   */
  public getFeatureRow(row: RTreeIndexTableRow): FeatureRow {
    return this.featureDao.queryForIdRow(row.getId());
  }

  /**
   * Get the feature row from the RTree Index Table row
   *
   * @param resultSet result set
   * @return feature row
   */
  public getFeatureRowWithUserCustomResultSet(resultSet: UserCustomResultSet): FeatureRow {
    const row = this.getRowWithUserCustomResultSet(resultSet);
    return this.getFeatureRow(row);
  }

  /**
   * Get the feature row from the user custom row
   *
   * @param row custom row
   * @return feature row
   */
  public getFeatureRowWithUserCustomRow(row: UserCustomRow): FeatureRow {
    return this.getFeatureRow(this.getRow(row));
  }

  /**
   * Query for the bounds of the feature table index
   *
   * @return bounding box
   */
  public getBoundingBox(): BoundingBox {
    let boundingBox = null;
    let result = null;
    try {
      result = this.rawQueryWithArgs(
        'SELECT MIN(' +
          RTreeIndexExtensionConstants.COLUMN_MIN_X +
          '), MIN(' +
          RTreeIndexExtensionConstants.COLUMN_MIN_Y +
          '), MAX(' +
          RTreeIndexExtensionConstants.COLUMN_MAX_X +
          '), MAX(' +
          RTreeIndexExtensionConstants.COLUMN_MAX_Y +
          ') FROM ' +
          SQLUtils.quoteWrap(this.getTableName()),
        undefined,
      );
    } catch (e) {
      throw new GeoPackageException('Failed to query for indexed feature bounds: ' + this.getTableName());
    }
    if (result != null) {
      const keys = Object.keys(result);
      boundingBox = new BoundingBox(result[keys[0]], result[keys[1]], result[keys[2]], result[keys[3]]);
    }

    return boundingBox;
  }

  /**
   * Query for the feature index bounds and return in the provided projection
   *
   * @param projection desired projection
   * @return bounding box
   */
  public getBoundingBoxWithProjection(projection: Projection): BoundingBox {
    let boundingBox = this.getBoundingBox();
    if (boundingBox != null && projection != null) {
      const projectionTransform = GeometryTransform.create(this.getProjection(), projection);
      boundingBox = boundingBox.transform(projectionTransform);
    }
    return boundingBox;
  }

  /**
   * Query for features within the geometry envelope
   * @param envelope geometry envelope
   * @param where
   * @param whereArgs
   * @return feature results
   */
  public queryFeaturesWithGeometryEnvelope(envelope: GeometryEnvelope, where?: string, whereArgs?: any[]): FeatureResultSet {
    return this.queryFeaturesWithGeometryEnvelopeAndDistinctAndColumns(undefined, undefined, envelope, where, whereArgs);
  }

  /**
   * Query for features within the geometry envelope
   * @param distinct distinct rows
   * @param envelope geometry envelope
   * @param where
   * @param whereArgs
   * @return feature results
   */
  public queryFeaturesWithGeometryEnvelopeAndDistinct(distinct: boolean, envelope: GeometryEnvelope, where?: string, whereArgs?: any[]): FeatureResultSet {
    return this.queryFeaturesWithGeometryEnvelopeAndDistinctAndColumns(distinct, undefined, envelope, where, whereArgs);
  }

  /**
   * Query for features within the geometry envelope
   * @param columns columns
   * @param envelope geometry envelope
   * @param where
   * @param whereArgs
   * @return feature results
   */
  public queryFeaturesWithGeometryEnvelopeAndColumns(columns: string[], envelope: GeometryEnvelope, where?: string, whereArgs?: any[]): FeatureResultSet {
    return this.queryFeaturesWithGeometryEnvelopeAndDistinctAndColumns(undefined, columns, envelope, where, whereArgs);
  }

  /**
   * Query for features within the geometry envelope
   * @param distinct distinct rows
   * @param columns columns
   * @param envelope geometry envelope
   * @param where
   * @param whereArgs
   * @return feature results
   */
  public queryFeaturesWithGeometryEnvelopeAndDistinctAndColumns(distinct: boolean, columns: string[], envelope: GeometryEnvelope, where?: string, whereArgs?: any[]): FeatureResultSet {
    return this.queryFeaturesWithBoundsAndDistinctAndColumns(distinct, columns, envelope.minX, envelope.minY, envelope.maxX, envelope.maxY, where, whereArgs);
  }

  /**
   * Query for features within the bounds
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @param where
   * @param whereArgs
   * @return results
   */
  public queryFeaturesWithBounds(minX: number, minY: number, maxX: number, maxY: number, where?: string, whereArgs?: any[]): FeatureResultSet {
    return this.queryFeaturesWithBoundsAndDistinctAndColumns(undefined, undefined, minX, minY, maxX, maxY, where, whereArgs);
  }

  /**
   * Query for features within the bounds
   * @param distinct distinct rows
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @param where
   * @param whereArgs
   * @return results
   */
  public queryFeaturesWithBoundsAndDistinct(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, where?: string, whereArgs?: any[]): FeatureResultSet {
    return this.queryFeaturesWithBoundsAndDistinctAndColumns(distinct, undefined, minX, minY, maxX, maxY, where, whereArgs);
  }

  /**
   * Query for features within the bounds
   * @param columns columns
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @param where
   * @param whereArgs
   * @return results
   */
  public queryFeaturesWithBoundsAndColumns(columns: string[], minX: number, minY: number, maxX: number, maxY: number, where?: string, whereArgs?: any[]): FeatureResultSet {
    return this.queryFeaturesWithBoundsAndDistinctAndColumns(undefined, columns, minX, minY, maxX, maxY, where, whereArgs);
  }

  /**
   * Query for features within the bounds
   * @param distinct distinct rows
   * @param columns columns
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @param where
   * @param whereArgs
   * @return results
   */
  public queryFeaturesWithBoundsAndDistinctAndColumns(distinct, columns: string[], minX: number, minY: number, maxX: number, maxY: number, where?: string, whereArgs?: any[]): FeatureResultSet {
    this.validateRTree();
    const whereBounds = this.buildWhereWithBounds(minX, minY, maxX, maxY);
    const whereBoundsArgs = this.buildWhereArgsWithBounds(minX, minY, maxX, maxY);
    return this.featureDao.queryInWithDistinctAndColumns(distinct, columns, this.queryIdsSQL(false, whereBounds), whereBoundsArgs, where, whereArgs);
  }

  /**
   * Query for all features
   * @param where where
   * @param whereArgs where args
   * @return feature results
   */
  public queryFeatures(where?: string, whereArgs?: any[]): FeatureResultSet {
    return this.queryFeaturesWithDistinctAndColumns(undefined, undefined, where, whereArgs);
  }

  /**
   * Query for all features
   * @param distinct distinct column values
   * @param columns columns
   * @param where where
   * @param whereArgs where args
   * @return feature results
   */
  public queryFeaturesWithDistinct(distinct?: boolean, where?: string, whereArgs?: any[]): FeatureResultSet {
    return this.queryFeaturesWithDistinctAndColumns(distinct, undefined, where, whereArgs);
  }

  /**
   * Query for all features
   * @param distinct distinct column values
   * @param columns columns
   * @param where where
   * @param whereArgs where args
   * @return feature results
   */
  public queryFeaturesWithColumns(columns?: string[], where?: string, whereArgs?: any[]): FeatureResultSet {
    return this.queryFeaturesWithDistinctAndColumns(undefined, columns, where, whereArgs);
  }

  /**
   * Query for all features
   * @param distinct distinct column values
   * @param columns columns
   * @param where where
   * @param whereArgs where args
   * @return feature results
   */
  public queryFeaturesWithDistinctAndColumns(distinct?: boolean, columns?: string[], where?: string, whereArgs?: any[]): FeatureResultSet {
    this.validateRTree();
    return this.featureDao.queryInWithDistinctAndColumns(distinct, columns, this.queryIdsSQL(), undefined, where, whereArgs);
  }

  /**
   * Query for all features
   * @param where where
   * @param whereArgs where args
   * @return feature results
   */
  public countFeatures(where?: string, whereArgs?: any[]): number {
    this.validateRTree();
    return this.countFeaturesWithDistinctAndColumn(undefined, undefined, where, whereArgs);
  }

  /**
   * Query for all features
   * @param distinct distinct column values
   * @param where where
   * @param whereArgs where args
   * @return feature results
   */
  public countFeaturesWithDistinct(distinct?: boolean, where?: string, whereArgs?: any[]): number {
    this.validateRTree();
    return this.countFeaturesWithDistinctAndColumn(distinct, undefined, where, whereArgs);
  }

  /**
   * Query for all features
   * @param column column
   * @param where where
   * @param whereArgs where args
   * @return feature results
   */
  public countFeaturesWithColumn(column?: string, where?: string, whereArgs?: any[]): number {
    this.validateRTree();
    return this.countFeaturesWithDistinctAndColumn(undefined, column, where, whereArgs);
  }

  /**
   * Query for all features
   * @param distinct distinct column values
   * @param column column
   * @param where where
   * @param whereArgs where args
   * @return feature results
   */
  public countFeaturesWithDistinctAndColumn(distinct?: boolean, column?: string, where?: string, whereArgs?: any[]): number {
    this.validateRTree();
    return this.featureDao.countInWithDistinctAndColumn(distinct, column, this.queryIdsSQL(), undefined, where, whereArgs);
  }

  /**
   * Count features
   * @param column count column name
   * @return count
   */
  public countColumnFeatures(column: string): number {
    this.validateRTree();
    return this.featureDao.countColumnIn(column, this.queryIdsSQL());
  }

  /**
   * Count the Features within the Geometry Envelope
   * @param envelope geometry envelope
   * @param where where clause
   * @param whereArgs where arguments
   * @return count
   */
  public countFeaturesWithGeometryEnvelope(envelope: GeometryEnvelope, where: string, whereArgs: any[]): number {
    return this.countFeaturesWithGeometryEnvelopeAndDistinctAndColumn(undefined, undefined, envelope, where, whereArgs);
  }

  /**
   * Count the Features within the Geometry Envelope
   * @param distinct distinct column values
   * @param envelope geometry envelope
   * @param where where clause
   * @param whereArgs where arguments
   * @return count
   */
  public countFeaturesWithGeometryEnvelopeAndDistinct(distinct: boolean, envelope: GeometryEnvelope, where: string, whereArgs: any[]): number {
    return this.countFeaturesWithGeometryEnvelopeAndDistinctAndColumn(distinct, undefined, envelope, where, whereArgs);
  }

  /**
   * Count the Features within the Geometry Envelope
   * @param column count column name
   * @param envelope geometry envelope
   * @param where where clause
   * @param whereArgs where arguments
   * @return count
   */
  public countFeaturesWithGeometryEnvelopeAndColumn(column: string, envelope: GeometryEnvelope, where: string, whereArgs: any[]): number {
    return this.countFeaturesWithGeometryEnvelopeAndDistinctAndColumn(undefined, column, envelope, where, whereArgs);
  }

  /**
   * Count the Features within the Geometry Envelope
   * @param distinct distinct column values
   * @param column count column name
   * @param envelope geometry envelope
   * @param where where clause
   * @param whereArgs where arguments
   * @return count
   */
  public countFeaturesWithGeometryEnvelopeAndDistinctAndColumn(distinct: boolean, column: string, envelope: GeometryEnvelope, where: string, whereArgs: any[]): number {
    return this.countFeaturesWithBoundsAndDistinctAndColumn(distinct, column, envelope.minX, envelope.minY, envelope.maxX, envelope.maxY, where, whereArgs);
  }

  /**
   * Count the features within the bounds
   * @param distinct distinct column values
   * @param column count column name
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @param fieldValues field values
   * @return count
   */
  public countFeaturesWithFieldValues(distinct: boolean, column: string, minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues): number {
    this.validateRTree();
    const whereBounds: string = this.buildWhereWithBounds(minX, minY, maxX, maxY);
    const whereBoundsArgs: string[] = this.buildWhereArgsWithBounds(minX, minY, maxX, maxY);
    const fieldWhere = this.buildWhereWithFields(fieldValues);
    const fieldWhereArgs = this.buildWhereArgsWithValues(fieldValues);
    return this.featureDao.countInWithDistinctAndColumn(
      distinct,
      column,
      this.queryIdsSQL(false, whereBounds),
      whereBoundsArgs,
      fieldWhere,
      fieldWhereArgs,
    );
  }

  /**
   * Count the features within the bounds
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @param where where clause
   * @param whereArgs where arguments
   * @return count
   */
  public countFeaturesWithBounds(minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: any[]): number {
    return this.countFeaturesWithBoundsAndDistinctAndColumn(undefined, undefined, minX, minY, maxX, maxY, where, whereArgs);
  }

  /**
   * Count the features within the bounds
   * @param distinct distinct column values
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @param where where clause
   * @param whereArgs where arguments
   * @return count
   */
  public countFeaturesWithBoundsAndDistinct(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: any[]): number {
    return this.countFeaturesWithBoundsAndDistinctAndColumn(distinct, undefined, minX, minY, maxX, maxY, where, whereArgs);
  }

  /**
   * Count the features within the bounds
   * @param column count column name
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @param where where clause
   * @param whereArgs where arguments
   * @return count
   */
  public countFeaturesWithBoundsAndColumn(column: string, minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: any[]): number {
    return this.countFeaturesWithBoundsAndDistinctAndColumn(undefined, column, minX, minY, maxX, maxY, where, whereArgs);
  }

  /**
   * Count the features within the bounds
   * @param distinct distinct column values
   * @param column count column name
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @param where where clause
   * @param whereArgs where arguments
   * @return count
   */
  public countFeaturesWithBoundsAndDistinctAndColumn(distinct: boolean, column: string, minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: any[]): number {
    this.validateRTree();
    const whereBounds: string = this.buildWhereWithBounds(minX, minY, maxX, maxY);
    const whereBoundsArgs: string[] = this.buildWhereArgsWithBounds(minX, minY, maxX, maxY);
    return this.featureDao.countInWithDistinctAndColumn(distinct, column, this.queryIdsSQL(false, whereBounds), whereBoundsArgs, where, whereArgs);
  }

  /**
   * Query for rows within the bounding box, starting at the offset and
   * returning no more than the limit
   * @param boundingBox bounding box
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryForChunkWithBoundingBox(boundingBox: BoundingBox, orderBy: string, limit: number, offset: number): UserCustomResultSet {
    return this.queryForChunkWithBoundingBoxAndDistinctAndColumns(undefined, undefined, boundingBox, orderBy, limit, offset);
  }

  /**
   * Query for rows within the bounding box, starting at the offset and
   * returning no more than the limit
   * @param distinct distinct rows
   * @param boundingBox bounding box
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryForChunkWithBoundingBoxAndDistinct(distinct: boolean, boundingBox: BoundingBox, orderBy: string, limit: number, offset: number): UserCustomResultSet {
    return this.queryForChunkWithBoundingBoxAndDistinctAndColumns(distinct, undefined, boundingBox, orderBy, limit, offset);
  }

  /**
   * Query for rows within the bounding box, starting at the offset and
   * returning no more than the limit
   * @param columns columns
   * @param boundingBox bounding box
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryForChunkWithBoundingBoxAndColumns(columns: string[], boundingBox: BoundingBox, orderBy: string, limit: number, offset: number): UserCustomResultSet {
    return this.queryForChunkWithBoundingBoxAndDistinctAndColumns(undefined, columns, boundingBox, orderBy, limit, offset);
  }

  /**
   * Query for rows within the bounding box, starting at the offset and
   * returning no more than the limit
   * @param distinct distinct rows
   * @param columns columns
   * @param boundingBox bounding box
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryForChunkWithBoundingBoxAndDistinctAndColumns(distinct: boolean, columns: string[], boundingBox: BoundingBox, orderBy: string, limit: number, offset: number): UserCustomResultSet {
    return this.queryForChunkWithGeometryEnvelopeAndDistinctAndColumns(distinct, columns, boundingBox.buildEnvelope(), orderBy, limit, offset);
  }

  /**
   * Query for rows within the bounding box, starting at the offset and
   * returning no more than the limit
   * @param envelope geometry envelope
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryForChunkWithGeometryEnvelope(envelope: GeometryEnvelope, orderBy: string, limit: number, offset: number): UserCustomResultSet {
    return this.queryForChunkWithGeometryEnvelopeAndDistinctAndColumns(undefined, undefined, envelope, orderBy, limit, offset);
  }

  /**
   * Query for rows within the bounding box, starting at the offset and
   * returning no more than the limit
   * @param distinct distinct rows
   * @param envelope geometry envelope
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryForChunkWithGeometryEnvelopeAndDistinct(distinct: boolean, envelope: GeometryEnvelope, orderBy: string, limit: number, offset: number): UserCustomResultSet {
    return this.queryForChunkWithGeometryEnvelopeAndDistinctAndColumns(distinct, undefined, envelope, orderBy, limit, offset);
  }

  /**
   * Query for rows within the bounding box, starting at the offset and
   * returning no more than the limit
   * @param columns columns
   * @param envelope geometry envelope
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryForChunkWithGeometryEnvelopeAndColumns(columns: string[], envelope: GeometryEnvelope, orderBy: string, limit: number, offset: number): UserCustomResultSet {
    return this.queryForChunkWithGeometryEnvelopeAndDistinctAndColumns(undefined, columns, envelope, orderBy, limit, offset);
  }

  /**
   * Query for rows within the bounding box, starting at the offset and
   * returning no more than the limit
   * @param distinct distinct rows
   * @param columns columns
   * @param envelope geometry envelope
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryForChunkWithGeometryEnvelopeAndDistinctAndColumns(distinct: boolean, columns: string[], envelope: GeometryEnvelope, orderBy: string, limit: number, offset: number): UserCustomResultSet {
    return this.queryForChunkWithBoundsAndDistinctAndColumns(distinct, columns, envelope.minX, envelope.minY, envelope.maxX, envelope.maxY, orderBy, limit, offset);
  }

  /**
   * Query for features within the bounding box, starting at the offset and
   * returning no more than the limit
   * @param boundingBox bounding box
   * @param fieldValues field values
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkWithBoundingBoxAndFieldValues(boundingBox: BoundingBox, fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkWithBoundingBoxAndFieldValuesAndDistinctAndColumns(undefined, undefined, boundingBox, fieldValues, orderBy, limit, offset);
  }

  /**
   * Query for features within the bounding box, starting at the offset and
   * returning no more than the limit
   * @param distinct distinct rows
   * @param boundingBox bounding box
   * @param fieldValues field values
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkWithBoundingBoxAndFieldValuesAndDistinct(distinct: boolean, boundingBox: BoundingBox, fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkWithBoundingBoxAndFieldValuesAndDistinctAndColumns(distinct, undefined, boundingBox, fieldValues, orderBy, limit, offset);
  }

  /**
   * Query for features within the bounding box, starting at the offset and
   * returning no more than the limit
   * @param columns columns
   * @param boundingBox bounding box
   * @param fieldValues field values
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkWithBoundingBoxAndFieldValuesAndColumns(columns: string[], boundingBox: BoundingBox, fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkWithBoundingBoxAndFieldValuesAndDistinctAndColumns(undefined, columns, boundingBox, fieldValues, orderBy, limit, offset);
  }

  /**
   * Query for features within the bounding box, starting at the offset and
   * returning no more than the limit
   * @param distinct distinct rows
   * @param columns columns
   * @param boundingBox bounding box
   * @param fieldValues field values
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkWithBoundingBoxAndFieldValuesAndDistinctAndColumns(distinct: boolean, columns: string[], boundingBox: BoundingBox, fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
    const fieldWhere = this.buildWhereWithFields(fieldValues);
    const fieldWhereArgs = this.buildWhereArgsWithValues(fieldValues);
    return this.queryFeaturesForChunkWithGeometryEnvelopeAndDistinctAndColumns(distinct, columns, boundingBox.buildEnvelope(), fieldWhere, fieldWhereArgs, orderBy, limit, offset);
  }

  /**
   * Query for features within the bounding box ordered by id, starting at the
   * offset and returning no more than the limit
   * @param boundingBox bounding box
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkIdOrderWithBoundingBox(boundingBox: BoundingBox, where: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkIdOrderWithBoundingBoxAndDistinctAndColumns(undefined, undefined, boundingBox, where, limit, offset);
  }

  /**
   * Query for features within the bounding box ordered by id, starting at the
   * offset and returning no more than the limit
   * @param distinct distinct rows
   * @param boundingBox bounding box
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkIdOrderWithBoundingBoxAndDistinct(distinct: boolean, boundingBox: BoundingBox, where: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkIdOrderWithBoundingBoxAndDistinctAndColumns(distinct, undefined, boundingBox, where, limit, offset);
  }

  /**
   * Query for features within the bounding box ordered by id, starting at the
   * offset and returning no more than the limit
   * @param columns columns
   * @param boundingBox bounding box
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkIdOrderWithBoundingBoxAndColumns(columns: string[], boundingBox: BoundingBox, where: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkIdOrderWithBoundingBoxAndDistinctAndColumns(undefined, columns, boundingBox, where, limit, offset);
  }

  /**
   * Query for features within the bounding box ordered by id, starting at the
   * offset and returning no more than the limit
   * @param distinct distinct rows
   * @param columns columns
   * @param boundingBox bounding box
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkIdOrderWithBoundingBoxAndDistinctAndColumns(distinct: boolean, columns: string[], boundingBox: BoundingBox, where: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkIdOrderWithGeometryEnvelopeAndDistinctAndColumns(distinct, columns, boundingBox.buildEnvelope(), where, limit, offset);
  }

  /**
   * Query for features within the bounding box, starting at the offset and
   * returning no more than the limit
   * @param boundingBox bounding box
   * @param where where clause
   * @param whereArgs where arguments
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkWithBoundingBox(boundingBox: BoundingBox, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkWithBoundingBoxAndDistinctAndColumns(undefined, undefined, boundingBox, where, whereArgs, orderBy, limit, offset);
  }

  /**
   * Query for features within the bounding box, starting at the offset and
   * returning no more than the limit
   * @param distinct distinct rows
   * @param boundingBox bounding box
   * @param where where clause
   * @param whereArgs where arguments
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkWithBoundingBoxAndDistinc(distinct: boolean, boundingBox: BoundingBox, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkWithBoundingBoxAndDistinctAndColumns(distinct, undefined, boundingBox, where, whereArgs, orderBy, limit, offset);
  }

  /**
   * Query for features within the bounding box, starting at the offset and
   * returning no more than the limit
   * @param columns columns
   * @param boundingBox bounding box
   * @param where where clause
   * @param whereArgs where arguments
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkWithBoundingBoxAndColumns(columns: string[], boundingBox: BoundingBox, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkWithBoundingBoxAndDistinctAndColumns(undefined, columns, boundingBox, where, whereArgs, orderBy, limit, offset);
  }

  /**
   * Query for features within the bounding box, starting at the offset and
   * returning no more than the limit
   * @param distinct distinct rows
   * @param columns columns
   * @param boundingBox bounding box
   * @param where where clause
   * @param whereArgs where arguments
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkWithBoundingBoxAndDistinctAndColumns(distinct: boolean, columns: string[], boundingBox: BoundingBox, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkWithGeometryEnvelopeAndDistinctAndColumns(distinct, columns, boundingBox.buildEnvelope(), where, whereArgs, orderBy, limit, offset);
  }

  /**
   * Query for features within the bounding box in the provided projection
   * ordered by id, starting at the offset and returning no more than the
   * limit
   * @param boundingBox bounding box
   * @param projection: Projection
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkIdOrderWithBoundingBoxAndProjection(boundingBox: BoundingBox, projection: Projection, where: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkIdOrderWithBoundingBoxAndProjectionAndDistinctAndColumn(undefined, undefined, boundingBox, projection, where, limit, offset);
  }

  /**
   * Query for features within the bounding box in the provided projection
   * ordered by id, starting at the offset and returning no more than the
   * limit
   * @param distinct distinct rows
   * @param boundingBox bounding box
   * @param projection: Projection
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkIdOrderWithBoundingBoxAndProjectionAndDistinct(distinct: boolean, boundingBox: BoundingBox, projection: Projection, where: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkIdOrderWithBoundingBoxAndProjectionAndDistinctAndColumn(distinct, undefined, boundingBox, projection, where, limit, offset);
  }

  /**
   * Query for features within the bounding box in the provided projection
   * ordered by id, starting at the offset and returning no more than the
   * limit
   * @param columns columns
   * @param boundingBox bounding box
   * @param projection: Projection
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkIdOrderWithBoundingBoxAndProjectionAndColumn(columns: string[], boundingBox: BoundingBox, projection: Projection, where: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkIdOrderWithBoundingBoxAndProjectionAndDistinctAndColumn(undefined, columns, boundingBox, projection, where, limit, offset);
  }

  /**
   * Query for features within the bounding box in the provided projection
   * ordered by id, starting at the offset and returning no more than the
   * limit
   * @param distinct distinct rows
   * @param columns columns
   * @param boundingBox bounding box
   * @param projection: Projection
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkIdOrderWithBoundingBoxAndProjectionAndDistinctAndColumn(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, where: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkWithBoundingBoxAndProjectionAndDistinctAndColumns(distinct, columns, boundingBox, projection, where, undefined, this.getPkColumnName(), limit, offset);
  }

  /**
   * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
   * @param boundingBox bounding box
   * @param projection: Projection
   * @param where where clause
   * @param whereArgs where arguments
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkWithBoundingBoxAndProjection(boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkWithBoundingBoxAndProjectionAndDistinctAndColumns(undefined, undefined, boundingBox, projection, where, whereArgs, orderBy, limit, offset);
  }

  /**
   * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
   * @param distinct distinct rows
   * @param boundingBox bounding box
   * @param projection: Projection
   * @param where where clause
   * @param whereArgs where arguments
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkWithBoundingBoxAndProjectionAndDistinct(distinct: boolean, boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkWithBoundingBoxAndProjectionAndDistinctAndColumns(distinct, undefined, boundingBox, projection, where, whereArgs, orderBy, limit, offset);
  }

  /**
   * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
   * @param columns columns
   * @param boundingBox bounding box
   * @param projection: Projection
   * @param where where clause
   * @param whereArgs where arguments
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkWithBoundingBoxAndProjectionAndColumns(columns: string[], boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkWithBoundingBoxAndProjectionAndDistinctAndColumns(undefined, columns, boundingBox, projection, where, whereArgs, orderBy, limit, offset);
  }

  /**
   * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
   * @param distinct distinct rows
   * @param columns columns
   * @param boundingBox bounding box
   * @param projection: Projection
   * @param where where clause
   * @param whereArgs where arguments
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkWithBoundingBoxAndProjectionAndDistinctAndColumns(distinct: boolean, columns: string[], boundingBox: BoundingBox, projection: Projection, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): FeatureResultSet {
    const featureBoundingBox = this.projectBoundingBox(boundingBox, projection);
    return this.queryFeaturesForChunkWithBoundingBoxAndDistinctAndColumns(distinct, columns, featureBoundingBox, where, whereArgs, orderBy, limit, offset);
  }

  /**
   * Query for features within the geometry envelope ordered by id, starting
   * at the offset and returning no more than the limit
   * @param envelope geometry envelope
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkIdOrderWithGeometryEnvelope(envelope: GeometryEnvelope, where: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkIdOrderWithGeometryEnvelopeAndDistinctAndColumns(undefined, undefined, envelope, where, limit, offset);
  }

  /**
   * Query for features within the geometry envelope ordered by id, starting
   * at the offset and returning no more than the limit
   * @param distinct distinct rows
   * @param envelope geometry envelope
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkIdOrderWithGeometryEnvelopeAndDistinct(distinct: boolean, envelope: GeometryEnvelope, where: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkIdOrderWithGeometryEnvelopeAndDistinctAndColumns(distinct, undefined, envelope, where, limit, offset);
  }

  /**
   * Query for features within the geometry envelope ordered by id, starting
   * at the offset and returning no more than the limit
   * @param columns columns
   * @param envelope geometry envelope
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkIdOrderWithGeometryEnvelopeAndColumns(columns: string[], envelope: GeometryEnvelope, where: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkIdOrderWithGeometryEnvelopeAndDistinctAndColumns(undefined, columns, envelope, where, limit, offset);
  }

  /**
   * Query for features within the geometry envelope ordered by id, starting
   * at the offset and returning no more than the limit
   * @param distinct distinct rows
   * @param columns columns
   * @param envelope geometry envelope
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkIdOrderWithGeometryEnvelopeAndDistinctAndColumns(distinct: boolean, columns: string[], envelope: GeometryEnvelope, where: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkWithGeometryEnvelopeAndDistinctAndColumns(distinct, columns, envelope, where, undefined, this.getPkColumnName(), limit, offset);
  }

  /**
   * Query for features within the geometry envelope, starting at the offset
   * and returning no more than the limit
   * @param envelope geometry envelope
   * @param where where clause
   * @param whereArgs where arguments
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkWithGeometryEnvelope(envelope: GeometryEnvelope, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkWithGeometryEnvelopeAndDistinctAndColumns(undefined, undefined, envelope, where, whereArgs, orderBy, limit, offset);
  }

  /**
   * Query for features within the geometry envelope, starting at the offset
   * and returning no more than the limit
   * @param distinct distinct rows
   * @param envelope geometry envelope
   * @param where where clause
   * @param whereArgs where arguments
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkWithGeometryEnvelopeAndDistinct(distinct: boolean, envelope: GeometryEnvelope, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkWithGeometryEnvelopeAndDistinctAndColumns(distinct, undefined, envelope, where, whereArgs, orderBy, limit, offset);
  }

  /**
   * Query for features within the geometry envelope, starting at the offset
   * and returning no more than the limit
   * @param columns columns
   * @param envelope geometry envelope
   * @param where where clause
   * @param whereArgs where arguments
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkWithGeometryEnvelopeAndColumns(columns: string[], envelope: GeometryEnvelope, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkWithGeometryEnvelopeAndDistinctAndColumns(undefined, columns, envelope, where, whereArgs, orderBy, limit, offset);
  }

  /**
   * Query for features within the geometry envelope, starting at the offset
   * and returning no more than the limit
   * @param distinct distinct rows
   * @param columns columns
   * @param envelope geometry envelope
   * @param where where clause
   * @param whereArgs where arguments
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkWithGeometryEnvelopeAndDistinctAndColumns(distinct: boolean, columns: string[], envelope: GeometryEnvelope, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkWithBoundsAndDistinctAndColumns(distinct, columns, envelope.minX, envelope.minY, envelope.maxX, envelope.maxY, where, whereArgs, orderBy, limit, offset);
  }

  /**
   * Query for rows within the bounds, starting at the offset and returning no
   * more than the limit
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryForChunkWithBounds(minX: number, minY: number, maxX: number, maxY: number, orderBy: string, limit: number, offset: number): UserCustomResultSet {
    return this.queryForChunkWithBoundsAndDistinctAndColumns(undefined, undefined, minX, minY, maxX, maxY, orderBy, limit, offset);
  }

  /**
   * Query for rows within the bounds, starting at the offset and returning no
   * more than the limit
   * @param distinct distinct rows
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryForChunkWithBoundsAndDistinct(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, orderBy: string, limit: number, offset: number): UserCustomResultSet {
    return this.queryForChunkWithBoundsAndDistinctAndColumns(distinct, undefined, minX, minY, maxX, maxY, orderBy, limit, offset);
  }

  /**
   * Query for rows within the bounds, starting at the offset and returning no
   * more than the limit
   * @param columns columns
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryForChunkWithBoundsAndColumns(columns: string[], minX: number, minY: number, maxX: number, maxY: number, orderBy: string, limit: number, offset: number): UserCustomResultSet {
    return this.queryForChunkWithBoundsAndDistinctAndColumns(undefined, columns, minX, minY, maxX, maxY, orderBy, limit, offset);
  }

  /**
   * Query for rows within the bounds, starting at the offset and returning no
   * more than the limit
   *
   * @param distinct distinct rows
   * @param columns columns
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryForChunkWithBoundsAndDistinctAndColumns(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, orderBy: string, limit: number, offset: number): UserCustomResultSet {
    this.validateRTree();
    const where: string = this.buildWhereWithBounds(minX, minY, maxX, maxY);
    const whereArgs: any[] = this.buildWhereArgsWithBounds(minX, minY, maxX, maxY);
    return this.queryForChunkWithDistinctAndColumns(distinct, columns, where, whereArgs, undefined, undefined, orderBy, limit, offset);
  }

  /**
   * Query for features within the bounds, starting at the offset and
   * returning no more than the limit
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @param fieldValues field values
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryFeaturesForChunkWithFieldValues(minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkWithFieldValuesAndDistinctAndColumns(undefined, undefined, minX, minY, maxX, maxY, fieldValues, orderBy, limit, offset);
  }

  /**
   * Query for features within the bounds, starting at the offset and
   * returning no more than the limit
   * @param distinct distinct rows
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @param fieldValues field values
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryFeaturesForChunkWithFieldValuesAndDistinct(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkWithFieldValuesAndDistinctAndColumns(distinct, undefined, minX, minY, maxX, maxY, fieldValues, orderBy, limit, offset);
  }

  /**
   * Query for features within the bounds, starting at the offset and
   * returning no more than the limit
   * @param columns columns
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @param fieldValues field values
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryFeaturesForChunkWithFieldValuesAndColumns(columns: string[], minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkWithFieldValuesAndDistinctAndColumns(undefined, columns, minX, minY, maxX, maxY, fieldValues, orderBy, limit, offset);
  }

  /**
   * Query for features within the bounds, starting at the offset and
   * returning no more than the limit
   *
   * @param distinct distinct rows
   * @param columns columns
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @param fieldValues field values
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryFeaturesForChunkWithFieldValuesAndDistinctAndColumns(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, fieldValues: ColumnValues, orderBy: string, limit: number, offset: number): FeatureResultSet {
    this.validateRTree();
    const where = this.buildWhereWithBounds(minX, minY, maxX, maxY);
    const whereArgs = this.buildWhereArgsWithBounds(minX, minY, maxX, maxY);
    const fieldWhere = this.buildWhereWithFields(fieldValues);
    const fieldWhereArgs = this.buildWhereArgsWithValues(fieldValues);
    return this.featureDao.queryInForChunkWithDistinctAndColumns(distinct, columns, this.queryIdsSQL(false, where), whereArgs, fieldWhere, fieldWhereArgs, undefined, undefined, orderBy, limit, offset);
  }

  /**
   * Query for features within the bounds ordered by id, starting at the
   * offset and returning no more than the limit
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryFeaturesForChunkIdOrderWithBounds(minX: number, minY: number, maxX: number, maxY: number, where: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkIdOrderWithBoundsAndDistinctAndColumns(undefined, undefined, minX, minY, maxX, maxY, where, limit, offset);
  }

  /**
   * Query for features within the bounds ordered by id, starting at the
   * offset and returning no more than the limit
   * @param distinct distinct rows
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryFeaturesForChunkIdOrderWithBoundsAndDistinct(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, where: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkIdOrderWithBoundsAndDistinctAndColumns(distinct, undefined, minX, minY, maxX, maxY, where, limit, offset);
  }

  /**
   * Query for features within the bounds ordered by id, starting at the
   * offset and returning no more than the limit
   * @param columns columns
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryFeaturesForChunkIdOrderWithBoundsAndColumns(columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkIdOrderWithBoundsAndDistinctAndColumns(undefined, columns, minX, minY, maxX, maxY, where, limit, offset);
  }

  /**
   * Query for features within the bounds ordered by id, starting at the
   * offset and returning no more than the limit
   * @param distinct distinct rows
   * @param columns columns
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryFeaturesForChunkIdOrderWithBoundsAndDistinctAndColumns(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkWithBoundsAndDistinctAndColumns(distinct, columns, minX, minY, maxX, maxY, where, undefined, this.getPkColumnName(), limit, offset);
  }

  /**
   * Query for features within the bounds, starting at the offset and
   * returning no more than the limit
   *
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @param where where clause
   * @param whereArgs where arguments
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryFeaturesForChunkWithBounds(minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkWithBoundsAndDistinctAndColumns(undefined, undefined, minX, minY, maxX, maxY, where, whereArgs, orderBy, limit, offset);
  }

  /**
   * Query for features within the bounds, starting at the offset and
   * returning no more than the limit
   *
   * @param distinct distinct rows
   * @param columns columns
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @param where where clause
   * @param whereArgs where arguments
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryFeaturesForChunkWithBoundsAndDistinct(distinct: boolean, minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkWithBoundsAndDistinctAndColumns(distinct, undefined, minX, minY, maxX, maxY, where, whereArgs, orderBy, limit, offset);
  }

  /**
   * Query for features within the bounds, starting at the offset and
   * returning no more than the limit
   *
   * @param distinct distinct rows
   * @param columns columns
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @param where where clause
   * @param whereArgs where arguments
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryFeaturesForChunkWithBoundsAndColumns(columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkWithBoundsAndDistinctAndColumns(undefined, columns, minX, minY, maxX, maxY, where, whereArgs, orderBy, limit, offset);
  }

  /**
   * Query for features within the bounds, starting at the offset and
   * returning no more than the limit
   *
   * @param distinct distinct rows
   * @param columns columns
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @param where where clause
   * @param whereArgs where arguments
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryFeaturesForChunkWithBoundsAndDistinctAndColumns(distinct: boolean, columns: string[], minX: number, minY: number, maxX: number, maxY: number, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): FeatureResultSet {
    this.validateRTree();
    const whereBounds: string = this.buildWhereWithBounds(minX, minY, maxX, maxY);
    const whereBoundsArgs: string[] = this.buildWhereArgsWithBounds(minX, minY, maxX, maxY);
    return this.featureDao.queryInForChunkWithDistinctAndColumns(distinct, columns, this.queryIdsSQL(false, whereBounds), whereBoundsArgs, where, whereArgs, undefined, undefined, orderBy, limit, offset);
  }

  /**
   * Query for features within the bounds ordered by id, starting at the
   * offset and returning no more than the limit
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryFeaturesForChunkId(where: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkIdWithDistinctAndColumns(undefined, undefined, where, limit, offset);
  }

  /**
   * Query for features within the bounds ordered by id, starting at the
   * offset and returning no more than the limit
   * @param distinct distinct rows
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryFeaturesForChunkIdWithDistinct(distinct: boolean, where: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkIdWithDistinctAndColumns(distinct, undefined, where, limit, offset);
  }

  /**
   * Query for features within the bounds ordered by id, starting at the
   * offset and returning no more than the limit
   * @param columns columns
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryFeaturesForChunkIdWithColumns(columns: string[], where: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkIdWithDistinctAndColumns(undefined, columns, where, limit, offset);
  }

  /**
   * Query for features within the bounds ordered by id, starting at the
   * offset and returning no more than the limit
   * @param distinct distinct rows
   * @param columns columns
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryFeaturesForChunkIdWithDistinctAndColumns(distinct: boolean, columns: string[], where: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkWithDistinctAndColumns(distinct, columns, where, undefined, this.getPkColumnName(), limit, offset);
  }

  /**
   * Query for features within the bounds, starting at the offset and
   * returning no more than the limit
   * @param where where clause
   * @param whereArgs where arguments
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryFeaturesForChunk(where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkWithDistinctAndColumns(undefined, undefined, where, whereArgs, orderBy, limit, offset);
  }

  /**
   * Query for features within the bounds, starting at the offset and
   * returning no more than the limit
   * @param distinct distinct rows
   * @param where where clause
   * @param whereArgs where arguments
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryFeaturesForChunkWithDistinct(distinct: boolean, where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkWithDistinctAndColumns(distinct, undefined, where, whereArgs, orderBy, limit, offset);
  }

  /**
   * Query for features within the bounds, starting at the offset and
   * returning no more than the limit
   * @param columns columns
   * @param where where clause
   * @param whereArgs where arguments
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryFeaturesForChunkWithColumns(columns: string[], where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): FeatureResultSet {
    return this.queryFeaturesForChunkWithDistinctAndColumns(undefined, columns, where, whereArgs, orderBy, limit, offset);
  }

  /**
   * Query for features within the bounds, starting at the offset and
   * returning no more than the limit
   * @param distinct distinct rows
   * @param columns columns
   * @param where where clause
   * @param whereArgs where arguments
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryFeaturesForChunkWithDistinctAndColumns(distinct: boolean, columns: string[], where: string, whereArgs: any[], orderBy: string, limit: number, offset: number): FeatureResultSet {
    this.validateRTree();
    return this.featureDao.queryForChunkWithDistinctAndColumns(distinct, columns, where, whereArgs, undefined, undefined, orderBy, limit, offset);
  }

  /**
   * Validate that the RTree extension exists for the table and column
   */
  private validateRTree(): void {
    if (!this.has()) {
      throw new GeoPackageException('RTree Extension not found for feature table: ' + this.featureDao.getTableName());
    }
  }

  /**
   * Build a where clause from the bounds for overlapping ranges
   *
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @return where clause
   */
  private buildWhereWithBounds(minX: number, minY: number, maxX: number, maxY: number): string {
    const where = [];
    where.push(super.buildWhereWithOp(RTreeIndexExtensionConstants.COLUMN_MIN_X, maxX, '<='));
    where.push(' AND ');
    where.push(super.buildWhereWithOp(RTreeIndexExtensionConstants.COLUMN_MIN_Y, maxY, '<='));
    where.push(' AND ');
    where.push(super.buildWhereWithOp(RTreeIndexExtensionConstants.COLUMN_MAX_X, minX, '>='));
    where.push(' AND ');
    where.push(super.buildWhereWithOp(RTreeIndexExtensionConstants.COLUMN_MAX_Y, minY, '>='));

    return where.join('');
  }

  /**
   * Build where arguments from the bounds to match the order in
   * {@link #buildWhereArgs(double, double, double, double)}
   *
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @return where clause args
   */
  private buildWhereArgsWithBounds(minX: number, minY: number, maxX: number, maxY: number): any[] {
    minX -= this.tolerance;
    maxX += this.tolerance;
    minY -= this.tolerance;
    maxY += this.tolerance;
    return [maxX, maxY, minX, minY];
  }
}
