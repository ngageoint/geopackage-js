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
        this.progress.addProgress(this.count(false, undefined));
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
   * @param distinct distinct rows
   * @param columns columns
   * @param envelope geometry envelope
   * @param where
   * @param whereArgs
   * @return feature results
   */
  public queryFeaturesWithGeometryEnvelope(
    distinct: boolean,
    columns: string[],
    envelope: GeometryEnvelope,
    where?: string,
    whereArgs?: any[],
  ): FeatureResultSet {
    return this.queryFeaturesWithBounds(
      distinct,
      columns,
      envelope.minX,
      envelope.minY,
      envelope.maxX,
      envelope.maxY,
      where,
      whereArgs,
    );
  }

  /**
   * Query for features within the bounds
   *
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
  public queryFeaturesWithBounds(
    distinct,
    columns: string[],
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    where?: string,
    whereArgs?: any[],
  ): FeatureResultSet {
    this.validateRTree();
    const whereBounds = this.buildWhereForBounds(minX, minY, maxX, maxY);
    const whereBoundsArgs = this.buildWhereArgsForBounds(minX, minY, maxX, maxY);
    return this.featureDao.queryIn(
      distinct,
      columns,
      this.queryIdsSQL(false, whereBounds),
      whereBoundsArgs,
      where,
      whereArgs,
    );
  }

  /**
   * Query for all features
   * @param distinct distinct column values
   * @param columns columns
   * @param where where
   * @param whereArgs where args
   * @return feature results
   */
  public queryFeatures(distinct?: boolean, columns?: string[], where?: string, whereArgs?: any[]): FeatureResultSet {
    this.validateRTree();
    return this.featureDao.queryIn(distinct, columns, this.queryIdsSQL(), undefined, where, whereArgs);
  }

  /**
   * Query for all features
   * @param distinct distinct column values
   * @param column column
   * @param where where
   * @param whereArgs where args
   * @return feature results
   */
  public countFeatures(distinct?: boolean, column?: string, where?: string, whereArgs?: any[]): number {
    this.validateRTree();
    return this.featureDao.countIn(distinct, column, this.queryIdsSQL(), undefined, where, whereArgs);
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
   *
   * @param distinct distinct column values
   * @param column count column name
   * @param envelope geometry envelope
   * @param where where clause
   * @param whereArgs where arguments
   * @return count
   */
  public countFeaturesWithGeometryEnvelope(
    distinct: boolean,
    column: string,
    envelope: GeometryEnvelope,
    where: string,
    whereArgs: any[],
  ): number {
    return this.countFeaturesWithBounds(
      distinct,
      column,
      envelope.minX,
      envelope.minY,
      envelope.maxX,
      envelope.maxY,
      where,
      whereArgs,
    );
  }

  /**
   * Count the features within the bounds
   *
   * @param distinct distinct column values
   * @param column count column name
   * @param minX min x
   * @param minY min y
   * @param maxX max x
   * @param maxY max y
   * @param fieldValues field values
   * @return count
   */
  public countFeaturesWithFieldValues(
    distinct: boolean,
    column: string,
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    fieldValues: ColumnValues,
  ): number {
    this.validateRTree();
    const whereBounds: string = this.buildWhereForBounds(minX, minY, maxX, maxY);
    const whereBoundsArgs: string[] = this.buildWhereArgsForBounds(minX, minY, maxX, maxY);
    const fieldWhere = this.buildWhereWithFields(fieldValues);
    const fieldWhereArgs = this.buildWhereArgsWithValues(fieldValues);
    return this.featureDao.countIn(
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
   *
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
  public countFeaturesWithBounds(
    distinct: boolean,
    column: string,
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    where: string,
    whereArgs: any[],
  ): number {
    this.validateRTree();
    const whereBounds: string = this.buildWhereForBounds(minX, minY, maxX, maxY);
    const whereBoundsArgs: string[] = this.buildWhereArgsForBounds(minX, minY, maxX, maxY);
    return this.featureDao.countIn(
      distinct,
      column,
      this.queryIdsSQL(false, whereBounds),
      whereBoundsArgs,
      where,
      whereArgs,
    );
  }

  /**
   * Query for rows within the bounding box, starting at the offset and
   * returning no more than the limit
   *
   * @param distinct distinct rows
   * @param columns columns
   * @param boundingBox bounding box
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryForChunkWithBoundingBox(
    distinct: boolean,
    columns: string[],
    boundingBox: BoundingBox,
    orderBy: string,
    limit: number,
    offset: number,
  ): UserCustomResultSet {
    return this.queryForChunkWithGeometryEnvelope(
      distinct,
      columns,
      boundingBox.buildEnvelope(),
      orderBy,
      limit,
      offset,
    );
  }

  /**
   * Query for rows within the bounding box, starting at the offset and
   * returning no more than the limit
   *
   * @param distinct distinct rows
   * @param columns columns
   * @param envelope geometry envelope
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryForChunkWithGeometryEnvelope(
    distinct: boolean,
    columns: string[],
    envelope: GeometryEnvelope,
    orderBy: string,
    limit: number,
    offset: number,
  ): UserCustomResultSet {
    return this.queryForChunkWithBounds(
      distinct,
      columns,
      envelope.minX,
      envelope.minY,
      envelope.maxX,
      envelope.maxY,
      orderBy,
      limit,
      offset,
    );
  }

  /**
   * Query for features within the bounding box, starting at the offset and
   * returning no more than the limit
   *
   * @param distinct distinct rows
   * @param columns columns
   * @param boundingBox bounding box
   * @param fieldValues field values
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkWithBoundingBoxAndFieldValues(
    distinct: boolean,
    columns: string[],
    boundingBox: BoundingBox,
    fieldValues: ColumnValues,
    orderBy: string,
    limit: number,
    offset: number,
  ): FeatureResultSet {
    const fieldWhere = this.buildWhereWithFields(fieldValues);
    const fieldWhereArgs = this.buildWhereArgsWithValues(fieldValues);
    return this.queryFeaturesForChunkWithGeometryEnvelope(
      distinct,
      columns,
      boundingBox.buildEnvelope(),
      fieldWhere,
      fieldWhereArgs,
      orderBy,
      limit,
      offset,
    );
  }

  /**
   * Query for features within the bounding box ordered by id, starting at the
   * offset and returning no more than the limit
   *
   * @param distinct distinct rows
   * @param columns columns
   * @param boundingBox bounding box
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkIdOrderWithBoundingBox(
    distinct: boolean,
    columns: string[],
    boundingBox: BoundingBox,
    where: string,
    limit: number,
    offset: number,
  ): FeatureResultSet {
    return this.queryFeaturesForChunkIdOrderWithGeometryEnvelope(
      distinct,
      columns,
      boundingBox.buildEnvelope(),
      where,
      limit,
      offset,
    );
  }

  /**
   * Query for features within the bounding box, starting at the offset and
   * returning no more than the limit
   *
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
  public queryFeaturesForChunkWithBoundingBox(
    distinct: boolean,
    columns: string[],
    boundingBox: BoundingBox,
    where: string,
    whereArgs: any[],
    orderBy: string,
    limit: number,
    offset: number,
  ): FeatureResultSet {
    return this.queryFeaturesForChunkWithGeometryEnvelope(
      distinct,
      columns,
      boundingBox.buildEnvelope(),
      where,
      whereArgs,
      orderBy,
      limit,
      offset,
    );
  }

  /**
   * Query for features within the bounding box in the provided projection
   * ordered by id, starting at the offset and returning no more than the
   * limit
   *
   * @param distinct distinct rows
   * @param columns columns
   * @param boundingBox bounding box
   * @param projection: Projection
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkIdOrderWithBoundingBoxAndProjection(
    distinct: boolean,
    columns: string[],
    boundingBox: BoundingBox,
    projection: Projection,
    where: string,
    limit: number,
    offset: number,
  ): FeatureResultSet {
    return this.queryFeaturesForChunkWithBoundingBoxAndProjection(
      distinct,
      columns,
      boundingBox,
      projection,
      where,
      undefined,
      this.getPkColumnName(),
      limit,
      offset,
    );
  }

  /**
   * Query for features within the bounding box in the provided projection, starting at the offset and returning no more than the limit
   *
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
  public queryFeaturesForChunkWithBoundingBoxAndProjection(
    distinct: boolean,
    columns: string[],
    boundingBox: BoundingBox,
    projection: Projection,
    where: string,
    whereArgs: any[],
    orderBy: string,
    limit: number,
    offset: number,
  ): FeatureResultSet {
    const featureBoundingBox = this.projectBoundingBox(boundingBox, projection);
    return this.queryFeaturesForChunkWithBoundingBox(
      distinct,
      columns,
      featureBoundingBox,
      where,
      whereArgs,
      orderBy,
      limit,
      offset,
    );
  }

  /**
   * Query for features within the geometry envelope ordered by id, starting
   * at the offset and returning no more than the limit
   *
   * @param distinct distinct rows
   * @param columns columns
   * @param envelope geometry envelope
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkIdOrderWithGeometryEnvelope(
    distinct: boolean,
    columns: string[],
    envelope: GeometryEnvelope,
    where: string,
    limit: number,
    offset: number,
  ): FeatureResultSet {
    return this.queryFeaturesForChunkWithGeometryEnvelope(
      distinct,
      columns,
      envelope,
      where,
      undefined,
      this.getPkColumnName(),
      limit,
      offset,
    );
  }

  /**
   * Query for features within the geometry envelope, starting at the offset
   * and returning no more than the limit
   *
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
  public queryFeaturesForChunkWithGeometryEnvelope(
    distinct: boolean,
    columns: string[],
    envelope: GeometryEnvelope,
    where: string,
    whereArgs: any[],
    orderBy: string,
    limit: number,
    offset: number,
  ): FeatureResultSet {
    return this.queryFeaturesForChunkWithBounds(
      distinct,
      columns,
      envelope.minX,
      envelope.minY,
      envelope.maxX,
      envelope.maxY,
      where,
      whereArgs,
      orderBy,
      limit,
      offset,
    );
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
  public queryForChunkWithBounds(
    distinct: boolean,
    columns: string[],
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    orderBy: string,
    limit: number,
    offset: number,
  ): UserCustomResultSet {
    this.validateRTree();
    const where: string = this.buildWhereForBounds(minX, minY, maxX, maxY);
    const whereArgs: any[] = this.buildWhereArgsForBounds(minX, minY, maxX, maxY);
    return this.queryForChunk(distinct, columns, where, whereArgs, undefined, undefined, orderBy, limit, offset);
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
  public queryFeaturesForChunkWithFieldValues(
    distinct: boolean,
    columns: string[],
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    fieldValues: ColumnValues,
    orderBy: string,
    limit: number,
    offset: number,
  ): FeatureResultSet {
    this.validateRTree();
    const where = this.buildWhereForBounds(minX, minY, maxX, maxY);
    const whereArgs = this.buildWhereArgsForBounds(minX, minY, maxX, maxY);
    const fieldWhere = this.buildWhereWithFields(fieldValues);
    const fieldWhereArgs = this.buildWhereArgsWithValues(fieldValues);
    return this.featureDao.queryInForChunk(
      distinct,
      columns,
      this.queryIdsSQL(false, where),
      whereArgs,
      fieldWhere,
      fieldWhereArgs,
      undefined,
      undefined,
      orderBy,
      limit,
      offset,
    );
  }

  /**
   * Query for features within the bounds ordered by id, starting at the
   * offset and returning no more than the limit
   *
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
  public queryFeaturesForChunkIdOrderWithBounds(
    distinct: boolean,
    columns: string[],
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    where: string,
    limit: number,
    offset: number,
  ): FeatureResultSet {
    return this.queryFeaturesForChunkWithBounds(
      distinct,
      columns,
      minX,
      minY,
      maxX,
      maxY,
      where,
      undefined,
      this.getPkColumnName(),
      limit,
      offset,
    );
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
  public queryFeaturesForChunkWithBounds(
    distinct: boolean,
    columns: string[],
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    where: string,
    whereArgs: any[],
    orderBy: string,
    limit: number,
    offset: number,
  ): FeatureResultSet {
    this.validateRTree();
    const whereBounds: string = this.buildWhereForBounds(minX, minY, maxX, maxY);
    const whereBoundsArgs: string[] = this.buildWhereArgsForBounds(minX, minY, maxX, maxY);
    return this.featureDao.queryInForChunk(
      distinct,
      columns,
      this.queryIdsSQL(false, whereBounds),
      whereBoundsArgs,
      where,
      whereArgs,
      undefined,
      undefined,
      orderBy,
      limit,
      offset,
    );
  }

  /**
   * Query for features within the bounds ordered by id, starting at the
   * offset and returning no more than the limit
   *
   * @param distinct distinct rows
   * @param columns columns
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryFeaturesForChunkId(
    distinct: boolean,
    columns: string[],
    where: string,
    limit: number,
    offset: number,
  ): FeatureResultSet {
    return this.queryFeaturesForChunk(distinct, columns, where, undefined, this.getPkColumnName(), limit, offset);
  }

  /**
   * Query for features within the bounds, starting at the offset and
   * returning no more than the limit
   *
   * @param distinct distinct rows
   * @param columns columns
   * @param where where clause
   * @param whereArgs where arguments
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return results
   */
  public queryFeaturesForChunk(
    distinct: boolean,
    columns: string[],
    where: string,
    whereArgs: any[],
    orderBy: string,
    limit: number,
    offset: number,
  ): FeatureResultSet {
    this.validateRTree();
    return this.featureDao.queryForChunk(
      distinct,
      columns,
      where,
      whereArgs,
      undefined,
      undefined,
      orderBy,
      limit,
      offset,
    );
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
  private buildWhereForBounds(minX: number, minY: number, maxX: number, maxY: number): string {
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
  private buildWhereArgsForBounds(minX: number, minY: number, maxX: number, maxY: number): string[] {
    minX -= this.tolerance;
    maxX += this.tolerance;
    minY -= this.tolerance;
    maxY += this.tolerance;
    return super.buildWhereArgs([maxX, maxY, minX, minY]);
  }
}
