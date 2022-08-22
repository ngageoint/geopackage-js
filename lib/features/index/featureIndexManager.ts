import { FeatureDao } from '../user/featureDao';
import { FeatureTableIndex } from '../../extension/nga/index/featureTableIndex';
import { ManualFeatureQuery } from '../user/manualFeatureQuery';
import { RTreeIndexTableDao } from '../../extension/rtree/rTreeIndexTableDao';
import { FeatureIndexType } from './featureIndexType';
import { GeoPackage } from '../../geoPackage';
import { RTreeIndexExtension } from '../../extension/rtree/rTreeIndexExtension';
import { GeoPackageProgress } from '../../io/geoPackageProgress';
import { FeatureRow } from '../user/featureRow';
import { FeatureIndexLocation } from './featureIndexLocation';
import { FeatureIndexResults } from './featureIndexResults';
import { BoundingBox } from '../../boundingBox';
import { FeatureResultSet } from '../user/featureResultSet';
import { Projection } from '@ngageoint/projections-js';
import { GeometryEnvelope } from '@ngageoint/simple-features-js';
import { ColumnValues } from '../../dao/columnValues';
import { GeoPackageException } from '../../geoPackageException';
import { FeatureIndexFeatureResults } from './featureIndexFeatureResults';
import { FeaturePaginatedResults } from '../user/featurePaginatedResults';

/**
 * Feature Index Manager to manage indexing of feature geometries within a
 * GeoPackage using the Geometry Index Extension and the RTree extension
 */
export class FeatureIndexManager {
  /**
   * Feature DAO
   */
  private readonly featureDao: FeatureDao;

  /**
   * Feature Table Index, for indexing within a GeoPackage extension
   */
  private readonly featureTableIndex: FeatureTableIndex;

  /**
   * RTree Index Table DAO
   */
  private readonly rTreeIndexTableDao: RTreeIndexTableDao;

  /**
   * Manual Feature Queries
   */
  private readonly manualFeatureQuery: ManualFeatureQuery;

  /**
   * Ordered set of index locations to check in order when checking if
   * features are indexed and when querying for features
   */
  private indexLocationQueryOrder: FeatureIndexType[] = [];

  /**
   * Index location, when set index calls without specifying a location go to
   * this location
   */
  private indexLocation: FeatureIndexType;

  /**
   * When an exception occurs on a certain index, continue to other index
   * types to attempt to retrieve the value
   */
  private continueOnError = true;

  /**
   * Constructor
   * @param geoPackage GeoPackage
   * @param featureTableNameOrDao feature DAO
   */
  public constructor(geoPackage: GeoPackage, featureTableNameOrDao: string | FeatureDao) {
    const featureDao =
      featureTableNameOrDao instanceof FeatureDao
        ? featureTableNameOrDao
        : geoPackage.getFeatureDao(featureTableNameOrDao);
    this.featureDao = this.featureDao;
    this.featureTableIndex = new FeatureTableIndex(geoPackage, featureDao);
    const rTreeExtension = new RTreeIndexExtension(geoPackage);
    this.rTreeIndexTableDao = rTreeExtension.getTableDao(featureDao);
    this.manualFeatureQuery = new ManualFeatureQuery(featureDao);

    // Set the default indexed check and query order
    this.indexLocationQueryOrder.push(FeatureIndexType.RTREE);
    this.indexLocationQueryOrder.push(FeatureIndexType.GEOPACKAGE);
  }

  /**
   * Close the index connections
   */
  public close(): void {
    this.featureTableIndex.close();
  }

  /**
   * Get the feature DAO
   * @return feature DAO
   */
  public getFeatureDao(): FeatureDao {
    return this.featureDao;
  }

  /**
   * Get the feature table index, used to index inside the GeoPackage as an
   * extension
   * @return feature table index
   */
  public getFeatureTableIndex(): FeatureTableIndex {
    return this.featureTableIndex;
  }

  /**
   * Get the RTree Index Table DAO
   * @return RTree index table DAO
   */
  public getRTreeIndexTableDao(): RTreeIndexTableDao {
    return this.rTreeIndexTableDao;
  }

  /**
   * Get the ordered set of ordered index query locations
   * @return set of ordered index types
   */
  public getIndexLocationQueryOrder(): FeatureIndexType[] {
    return this.indexLocationQueryOrder.slice();
  }

  /**
   * Get the index location
   * @return index location or null if not set
   */
  public getIndexLocation(): FeatureIndexType {
    return this.indexLocation;
  }

  /**
   * Is the continue on error flag enabled
   *
   * @return continue on error
   */
  public isContinueOnError(): boolean {
    return this.continueOnError;
  }

  /**
   * Set the continue on error flag
   *
   * @param continueOnError continue on error
   */
  public setContinueOnError(continueOnError: boolean): void {
    this.continueOnError = continueOnError;
  }

  /**
   * Prioritize the query location order. All types are placed at the front of
   * the query order in the order they are given. Omitting a location leaves
   * it at it's current priority location.
   * @param types feature index types
   */
  public prioritizeQueryLocation(types: FeatureIndexType[]): void {
    // Create a new query order set
    const queryOrder = [];
    for (const type of types) {
      if (type != FeatureIndexType.NONE) {
        queryOrder.push(type);
      }
    }
    // Add any locations not provided to this method
    queryOrder.push(...this.indexLocationQueryOrder.filter(item => queryOrder.indexOf(item) === -1));
    // Update the query order set
    this.indexLocationQueryOrder = queryOrder;
  }

  /**
   * Set the index location order, overriding all previously set types
   * @param types feature index types
   */
  public setIndexLocationOrder(types: FeatureIndexType[]): void {
    // Create a new query order set
    const queryOrder = [];
    for (const type of types) {
      if (type != FeatureIndexType.NONE) {
        queryOrder.push(type);
      }
    }
    // Update the query order set
    this.indexLocationQueryOrder = queryOrder;
  }

  /**
   * Set the index location
   * @param indexLocation feature index type
   */
  public setIndexLocation(indexLocation: FeatureIndexType): void {
    this.indexLocation = indexLocation;
  }

  /**
   * Set the GeoPackage Progress
   * @param progress GeoPackage progress
   */
  public setProgress(progress: GeoPackageProgress): void {
    this.featureTableIndex.setProgress(progress);
    this.rTreeIndexTableDao.setProgress(progress);
  }

  /**
   * Index the feature table if needed, using the set index location
   * @return this.count
   */
  public index(): number {
    return this.indexType();
  }

  /**
   * Index the feature table
   * @param type index location type
   * @param force true to force re-indexing
   * @return this.count
   */
  public indexType(type: FeatureIndexType = this.verifyIndexLocation(), force = false): number {
    if (type == null) {
      throw new GeoPackageException('FeatureIndexType is required to index');
    }
    let count = 0;
    switch (type) {
      case FeatureIndexType.GEOPACKAGE:
        count = this.featureTableIndex.index(force);
        break;
      case FeatureIndexType.RTREE:
        const rTreeIndexed = this.rTreeIndexTableDao.has();
        if (!rTreeIndexed || force) {
          if (rTreeIndexed) {
            this.rTreeIndexTableDao.delete();
          }
          this.rTreeIndexTableDao.createExtension();
          count = this.rTreeIndexTableDao.count();
        }
        break;
      default:
        throw new GeoPackageException('Unsupported FeatureIndexType: ' + type);
    }
    return count;
  }

  /**
   * Index the feature tables if needed for the index types
   * @param types feature index types
   * @param force true to force re-indexing
   * @return largest count of indexed features
   */
  public indexTypes(types: FeatureIndexType[], force = false): number {
    let count = 0;
    for (const type of types) {
      const typeCount = this.indexType(type, force);
      count = Math.max(count, typeCount);
    }
    return count;
  }

  /**
   * Index the feature row, using the set index location. This method assumes
   * that indexing has been completed and maintained as the last indexed time
   * is updated.
   * @param row feature row to index
   * @return true if indexed
   */
  public indexRow(row: FeatureRow): boolean {
    return this.indexRowWithType(row);
  }

  /**
   * Index the feature row. This method assumes that indexing has been
   * completed and maintained as the last indexed time is updated.
   * @param type index location type
   * @param row feature row to index
   * @return true if indexed
   */
  public indexRowWithType(row: FeatureRow, type: FeatureIndexType = this.verifyIndexLocation()): boolean {
    let indexed = false;
    if (type == null) {
      throw new GeoPackageException('FeatureIndexType is required to index');
    }
    switch (type) {
      case FeatureIndexType.GEOPACKAGE:
        indexed = this.featureTableIndex.indexFeatureRow(row);
        break;
      case FeatureIndexType.RTREE:
        // Updated by triggers, ignore for RTree
        indexed = true;
        break;
      default:
        throw new GeoPackageException('Unsupported FeatureIndexType: ' + type);
    }
    return indexed;
  }

  /**
   * Index the feature row for the index types. This method assumes that
   * indexing has been completed and maintained as the last indexed time is
   * updated.
   * @param row feature row to index
   * @param types feature index types
   * @return true if indexed from any type
   */
  public indexRowWithTypes(row: FeatureRow, types: FeatureIndexType[]): boolean {
    let indexed = false;
    for (const type of types) {
      if (this.indexRowWithType(row, type)) {
        indexed = true;
      }
    }
    return indexed;
  }

  /**
   * Delete the feature index from the index types
   * @param types feature index types
   * @return true if deleted from any type
   */
  public deleteIndexTypes(types: FeatureIndexType[] = this.indexLocationQueryOrder): boolean {
    let deleted = false;
    for (const type of types) {
      if (this.deleteIndexType(type)) {
        deleted = true;
      }
    }
    return deleted;
  }

  /**
   * Delete the feature index
   * @param type feature index type
   * @return true if deleted
   */
  public deleteIndexType(type: FeatureIndexType = this.verifyIndexLocation()): boolean {
    if (type == null) {
      throw new GeoPackageException('FeatureIndexType is required to delete index');
    }
    let deleted = false;
    switch (type) {
      case FeatureIndexType.GEOPACKAGE:
        deleted = this.featureTableIndex.deleteIndex();
        break;
      case FeatureIndexType.RTREE:
        this.rTreeIndexTableDao.delete();
        deleted = true;
        break;
      default:
        throw new GeoPackageException('Unsupported FeatureIndexType: ' + type);
    }
    return deleted;
  }

  /**
   * Delete the feature index for the feature row from the index types
   * @param row feature row
   * @param types feature index types
   * @return true if deleted from any type
   */
  public deleteIndexForRowWithTypes(row: FeatureRow, types: FeatureIndexType[]): boolean {
    let deleted = false;
    for (const type of types) {
      if (this.deleteIndexForRow(row, type)) {
        deleted = true;
      }
    }
    return deleted;
  }

  /**
   * Delete the feature index for the feature row
   * @param row feature row
   * @param type feature index type
   * @return true if deleted
   */
  public deleteIndexForRow(row: FeatureRow, type: FeatureIndexType = this.verifyIndexLocation()): boolean {
    return this.deleteIndexForGeometryId(row.getId(), type);
  }

  /**
   * Delete the feature index for the geometry id from the index types
   * @param geomId geometry id
   * @param types feature index types
   * @return true if deleted from any type
   */
  public deleteIndexForGeometryIdWithTypes(geomId: number, types: FeatureIndexType[]): boolean {
    let deleted = false;
    for (const type of types) {
      if (this.deleteIndexForGeometryId(geomId, type)) {
        deleted = true;
      }
    }
    return deleted;
  }

  /**
   * Delete the feature index for the geometry id
   * @param type feature index type
   * @param geomId geometry id
   * @return true if deleted
   */
  public deleteIndexForGeometryId(geomId: number, type: FeatureIndexType = this.verifyIndexLocation()): boolean {
    if (type == null) {
      throw new GeoPackageException('FeatureIndexType is required to delete index');
    }
    let deleted = false;
    switch (type) {
      case FeatureIndexType.GEOPACKAGE:
        deleted = this.featureTableIndex.deleteIndexWithGeometryId(geomId) > 0;
        break;
      case FeatureIndexType.RTREE:
        // Updated by triggers, ignore for RTree
        deleted = true;
        break;
      default:
        throw new GeoPackageException('Unsupported FeatureIndexType: ' + type);
    }
    return deleted;
  }

  /**
   * Retain the feature index from the index types and delete the others
   * @param type feature index type to retain
   * @return true if deleted from any type
   */
  public retainIndex(type: FeatureIndexType): boolean {
    const retain = [];
    retain.push(type);
    return this.retainIndexTypes(retain);
  }

  /**
   * Retain the feature index from the index types and delete the others
   * @param types feature index types to retain
   * @return true if deleted from any type
   */
  public retainIndexTypes(types: FeatureIndexType[]): boolean {
    const typesToDelete = this.indexLocationQueryOrder.slice().filter(type => types.indexOf(type) === -1);
    return this.deleteIndexTypes(typesToDelete);
  }

  /**
   * Determine if the feature table is indexed
   * @return true if indexed
   */
  public isIndexed(): boolean {
    let indexed = false;
    for (const type of this.indexLocationQueryOrder) {
      indexed = this.isIndexedForType(type);
      if (indexed) {
        break;
      }
    }
    return indexed;
  }

  /**
   * Is the feature table indexed in the provided type location
   * @param type index location type
   * @return true if indexed
   */
  public isIndexedForType(type: FeatureIndexType): boolean {
    let indexed = false;
    if (type == null) {
      indexed = this.isIndexed();
    } else {
      switch (type) {
        case FeatureIndexType.GEOPACKAGE:
          indexed = this.featureTableIndex.isIndexed();
          break;
        case FeatureIndexType.RTREE:
          indexed = this.rTreeIndexTableDao.has();
          break;
        default:
          throw new GeoPackageException('Unsupported FeatureIndexType: ' + type);
      }
    }
    return indexed;
  }

  /**
   * Get the indexed types that are currently indexed
   * @return indexed types
   */
  public getIndexedTypes(): FeatureIndexType[] {
    const indexed = [];
    for (const type of this.indexLocationQueryOrder) {
      if (this.isIndexedForType(type)) {
        indexed.push(type);
      }
    }
    return indexed;
  }

  /**
   * Get the date last indexed
   * @return last indexed date or null
   */
  public getLastIndexed(): Date {
    let lastIndexed = null;
    for (const type of this.indexLocationQueryOrder) {
      lastIndexed = this.getLastIndexedForType(type);
      if (lastIndexed != null) {
        break;
      }
    }
    return lastIndexed;
  }

  /**
   * Get the date last indexed
   * @param type feature index type
   * @return last indexed date or null
   */
  public getLastIndexedForType(type: FeatureIndexType): Date {
    let lastIndexed = null;
    if (type == null) {
      lastIndexed = this.getLastIndexed();
    } else {
      switch (type) {
        case FeatureIndexType.GEOPACKAGE:
          lastIndexed = this.featureTableIndex.getLastIndexed();
          break;
        case FeatureIndexType.RTREE:
          if (this.rTreeIndexTableDao.has()) {
            // Updated by triggers, assume up to date
            lastIndexed = new Date();
          }
          break;
        default:
          throw new GeoPackageException('Unsupported FeatureIndexType: ' + type);
      }
    }
    return lastIndexed;
  }

  /**
   * Get a feature index location to iterate over indexed types
   * @return feature index location
   */
  public getLocation(): FeatureIndexLocation {
    return new FeatureIndexLocation(this);
  }

  /**
   * Get the first ordered indexed type
   * @return feature index type
   */
  public getIndexedType(): FeatureIndexType {
    let indexType = FeatureIndexType.NONE;

    // Check for an indexed type
    for (const type of this.indexLocationQueryOrder) {
      if (this.isIndexedForType(type)) {
        indexType = type;
        break;
      }
    }

    return indexType;
  }

  /**
   * Get the feature table id column name, the default column ordering
   *
   * @return feature table id column name
   */
  public getIdColumn(): string {
    return this.featureDao.getPkColumnName();
  }

  /**
   * Query for all feature index results
   * @param distinct distinct rows
   * @param columns columns
   * @return feature index results, close when done
   */
  public queryAll(distinct: boolean, columns: string[]): FeatureIndexResults {
    let results = null;
    for (const type of this.getLocation()) {
      try {
        switch (type) {
          case FeatureIndexType.GEOPACKAGE:
            const geoPackageResultSet = this.featureTableIndex.queryFeatures(distinct, columns);
            results = new FeatureIndexFeatureResults(geoPackageResultSet);
            break;
          case FeatureIndexType.RTREE:
            const rTreeResultSet = this.rTreeIndexTableDao.queryFeatures(distinct, columns);
            results = new FeatureIndexFeatureResults(rTreeResultSet);
            break;
          default:
            throw new GeoPackageException('Unsupported feature index type: ' + type);
        }
        break;
      } catch (e) {
        if (this.continueOnError) {
          console.error('Failed to query from feature index: ' + type, e);
        } else {
          throw e;
        }
      }
    }
    if (results == null) {
      const featureResultSet = this.manualFeatureQuery.query(distinct, columns);
      results = new FeatureIndexFeatureResults(featureResultSet);
    }
    return results;
  }

  /**
   * Query for all feature index count
   * @param column count column name
   * @return this.count
   */
  public countColumn(column: string): number {
    return this.countAll(false, column);
  }

  /**
   * Query for all feature index count
   * @param distinct distinct column values
   * @param column count column name
   * @return this.count
   */
  public countAll(distinct: boolean, column: string): number {
    let count = null;
    for (const type of this.getLocation()) {
      try {
        switch (type) {
          case FeatureIndexType.GEOPACKAGE:
            count = this.featureTableIndex.countFeatures(distinct, column);
            break;
          case FeatureIndexType.RTREE:
            count = this.rTreeIndexTableDao.countFeatures(distinct, column);
            break;
          default:
            throw new GeoPackageException('Unsupported feature index type: ' + type);
        }
        break;
      } catch (e) {
        if (this.continueOnError) {
          console.error('Failed to count from feature index: ' + type, e);
        } else {
          throw e;
        }
      }
    }
    if (count == null) {
      count = this.manualFeatureQuery.countColumn(distinct, column);
    }
    return count;
  }

  /**
   * Query for feature index results
   *
   * @param distinct distinct rows
   * @param columns columns
   * @param fieldValues field values
   * @return feature index results, close when done
   */
  public queryWithFieldValues(distinct: boolean, columns: string[], fieldValues: ColumnValues): FeatureIndexResults {
    const where = this.featureDao.buildWhereWithFields(fieldValues);
    const whereArgs = this.featureDao.buildWhereArgsWithValues(fieldValues);
    return this.query(distinct, columns, where, whereArgs);
  }

  /**
   * Query for feature index count
   *
   * @param distinct distinct column values
   * @param column count column name
   * @param fieldValues field values
   * @return feature index results, close when done
   */
  public countWithFieldValues(distinct: boolean, column: string, fieldValues: ColumnValues): number {
    const where = this.featureDao.buildWhereWithFields(fieldValues);
    const whereArgs = this.featureDao.buildWhereArgsWithValues(fieldValues);
    return this.count(distinct, column, where, whereArgs);
  }

  /**
   * Query for feature index results
   *
   * @param distinct distinct rows
   * @param columns columns
   * @param where where clause
   * @param whereArgs where arguments
   * @return feature index results, close when done
   */
  public query(distinct: boolean, columns: string[], where: string, whereArgs: any[]): FeatureIndexResults {
    let results = null;
    for (const type of this.getLocation()) {
      try {
        switch (type) {
          case FeatureIndexType.GEOPACKAGE:
            const geoPackageResultSet = this.featureTableIndex.queryFeatures(distinct, columns, where, whereArgs);
            results = new FeatureIndexFeatureResults(geoPackageResultSet);
            break;
          case FeatureIndexType.RTREE:
            const rTreeResultSet = this.rTreeIndexTableDao.queryFeatures(distinct, columns, where, whereArgs);
            results = new FeatureIndexFeatureResults(rTreeResultSet);
            break;
          default:
            throw new GeoPackageException('Unsupported feature index type: ' + type);
        }
        break;
      } catch (e) {
        if (this.continueOnError) {
          console.error('Failed to query from feature index: ' + type, e);
        } else {
          throw e;
        }
      }
    }
    if (results == null) {
      const featureResultSet = this.manualFeatureQuery.query(distinct, columns, where, whereArgs);
      results = new FeatureIndexFeatureResults(featureResultSet);
    }
    return results;
  }

  /**
   * Query for feature index count
   *
   * @param distinct distinct column values
   * @param column count column name
   * @param where where clause
   * @param whereArgs where arguments
   * @return this.count
   */
  public count(distinct: boolean, column: string, where: string, whereArgs: any[]): number {
    let count = null;
    for (const type of this.getLocation()) {
      try {
        switch (type) {
          case FeatureIndexType.GEOPACKAGE:
            count = this.featureTableIndex.countFeatures(distinct, column, where, whereArgs);
            break;
          case FeatureIndexType.RTREE:
            count = this.rTreeIndexTableDao.countFeatures(distinct, column, where, whereArgs);
            break;
          default:
            throw new GeoPackageException('Unsupported feature index type: ' + type);
        }
        break;
      } catch (e) {
        if (this.continueOnError) {
          console.error('Failed to count from feature index: ' + type, e);
        } else {
          throw e;
        }
      }
    }
    if (count == null) {
      count = this.manualFeatureQuery.count(distinct, [column], where, whereArgs);
    }
    return count;
  }

  /**
   * Query for the feature index bounds
   *
   * @return bounding box
   */
  public getBoundingBox(): BoundingBox {
    let bounds = null;
    let success = false;
    for (const type of this.getLocation()) {
      try {
        switch (type) {
          case FeatureIndexType.GEOPACKAGE:
            bounds = this.featureTableIndex.getBoundingBox();
            break;
          case FeatureIndexType.RTREE:
            bounds = this.rTreeIndexTableDao.getBoundingBox();
            break;
          default:
            throw new GeoPackageException('Unsupported feature index type: ' + type);
        }
        success = true;
        break;
      } catch (e) {
        if (this.continueOnError) {
          console.error('Failed to get bounding box from feature index: ' + type, e);
        } else {
          throw e;
        }
      }
    }
    if (!success) {
      bounds = this.manualFeatureQuery.getBoundingBox();
    }
    return bounds;
  }

  /**
   * Query for the feature index bounds and return in the provided projection
   *
   * @param projection desired projection
   * @return bounding box
   */
  public getBoundingBoxWithProjection(projection: Projection): BoundingBox {
    let bounds = null;
    let success = false;
    for (const type of this.getLocation()) {
      try {
        switch (type) {
          case FeatureIndexType.GEOPACKAGE:
            bounds = this.featureTableIndex.getBoundingBoxWithProjection(projection);
            break;
          case FeatureIndexType.RTREE:
            bounds = this.rTreeIndexTableDao.getBoundingBoxWithProjection(projection);
            break;
          default:
            throw new GeoPackageException('Unsupported feature index type: ' + type);
        }
        success = true;
        break;
      } catch (e) {
        if (this.continueOnError) {
          console.error('Failed to get bounding box from feature index: ' + type, e);
        } else {
          throw e;
        }
      }
    }
    if (!success) {
      bounds = this.manualFeatureQuery.getBoundingBoxWithProjection(projection);
    }
    return bounds;
  }

  /**
   * Query for feature index results within the bounding box, projected
   * correctly
   * @param distinct distinct rows
   * @param columns columns
   * @param boundingBox bounding box
   * @param fieldValues field values
   * @return feature index results, close when done
   */
  public queryWithBoundingBoxAndFieldValues(
    distinct: boolean,
    columns: string[],
    boundingBox: BoundingBox,
    fieldValues: ColumnValues,
  ): FeatureIndexResults {
    return this.queryWithGeometryEnvelopeAndFieldValues(distinct, columns, boundingBox.buildEnvelope(), fieldValues);
  }

  /**
   * Query for feature index count within the bounding box, projected
   * correctly
   * @param distinct distinct column values
   * @param column column name
   * @param boundingBox bounding box
   * @param fieldValues field values
   * @return this.count
   */
  public countWithBoundingBoxAndFieldValues(
    distinct: boolean,
    column: string,
    boundingBox: BoundingBox,
    fieldValues: ColumnValues,
  ): number {
    return this.countWithGeometryEnvelopeAndFieldValues(distinct, column, boundingBox.buildEnvelope(), fieldValues);
  }

  /**
   * Query for feature index results within the bounding box, projected
   * correctly
   * @param distinct distinct rows
   * @param columns columns
   * @param boundingBox bounding box
   * @param where where clause
   * @param whereArgs where arguments
   * @return feature index results, close when done
   */
  public queryWithBoundingBox(
    distinct: boolean,
    columns: string[],
    boundingBox: BoundingBox,
    where: string,
    whereArgs: any[],
  ): FeatureIndexResults {
    return this.queryWithGeometryEnvelope(distinct, columns, boundingBox.buildEnvelope(), where, whereArgs);
  }

  /**
   * Query for feature index count within the bounding box, projected
   * correctly
   * @param distinct distinct column values
   * @param column count column value
   * @param boundingBox bounding box
   * @param where where clause
   * @param whereArgs where arguments
   * @return this.count
   */
  public countWithBoundingBox(
    distinct: boolean,
    column: string,
    boundingBox: BoundingBox,
    where: string,
    whereArgs: any[],
  ): number {
    return this.countWithGeometryEnvelope(distinct, column, boundingBox.buildEnvelope(), where, whereArgs);
  }

  /**
   * Query for feature index results within the Geometry Envelope
   * @param distinct distinct rows
   * @param columns columns
   * @param envelope geometry envelope
   * @param fieldValues field values
   * @return feature index results, close when done
   */
  public queryWithGeometryEnvelopeAndFieldValues(
    distinct: boolean,
    columns: string[],
    envelope: GeometryEnvelope,
    fieldValues: ColumnValues,
  ): FeatureIndexResults {
    const where = this.featureDao.buildWhereWithFields(fieldValues);
    const whereArgs = this.featureDao.buildWhereArgsWithValues(fieldValues);
    return this.queryWithGeometryEnvelope(distinct, columns, envelope, where, whereArgs);
  }

  /**
   * Query for feature index count within the Geometry Envelope
   * @param distinct distinct column values
   * @param column count column name
   * @param envelope geometry envelope
   * @param fieldValues field values
   * @return this.count
   */
  public countWithGeometryEnvelopeAndFieldValues(
    distinct: boolean,
    column: string,
    envelope: GeometryEnvelope,
    fieldValues: ColumnValues,
  ): number {
    const where = this.featureDao.buildWhereWithFields(fieldValues);
    const whereArgs = this.featureDao.buildWhereArgsWithValues(fieldValues);
    return this.countWithGeometryEnvelope(distinct, column, envelope, where, whereArgs);
  }

  /**
   * Query for feature index results within the Geometry Envelope
   *
   * @param distinct distinct rows
   * @param columns columns
   * @param envelope geometry envelope
   * @param where where clause
   * @param whereArgs where arguments
   * @return feature index results, close when done
   */
  public queryWithGeometryEnvelope(
    distinct: boolean,
    columns: string[],
    envelope: GeometryEnvelope,
    where?: string,
    whereArgs?: string[],
  ): FeatureIndexResults {
    let results = null;
    for (const type of this.getLocation()) {
      try {
        switch (type) {
          case FeatureIndexType.GEOPACKAGE:
            const geoPackageResultSet = this.featureTableIndex.queryFeaturesWithGeometryEnvelope(
              distinct,
              columns,
              envelope,
              where,
              whereArgs,
            );
            results = new FeatureIndexFeatureResults(geoPackageResultSet);
            break;
          case FeatureIndexType.RTREE:
            const rTreeResultSet = this.rTreeIndexTableDao.queryFeaturesWithGeometryEnvelope(
              distinct,
              columns,
              envelope,
              where,
              whereArgs,
            );
            results = new FeatureIndexFeatureResults(rTreeResultSet);
            break;
          default:
            throw new GeoPackageException('Unsupported feature index type: ' + type);
        }
        break;
      } catch (e) {
        if (this.continueOnError) {
          console.error('Failed to query from feature index: ' + type, e);
        } else {
          throw e;
        }
      }
    }
    if (results == null) {
      results = this.manualFeatureQuery.queryWhereWithGeometryEnvelope(distinct, columns, envelope, where, whereArgs);
    }
    return results;
  }

  /**
   * Query for feature index count within the Geometry Envelope
   * @param distinct distinct column values
   * @param column count column name
   * @param envelope geometry envelope
   * @param where where clause
   * @param whereArgs where arguments
   * @return this.count
   */
  public countWithGeometryEnvelope(
    distinct: boolean,
    column: string,
    envelope: GeometryEnvelope,
    where: string,
    whereArgs: any[],
  ): number {
    let count = null;
    for (const type of this.getLocation()) {
      try {
        switch (type) {
          case FeatureIndexType.GEOPACKAGE:
            count = this.featureTableIndex.countFeaturesWithGeometryEnvelope(
              distinct,
              column,
              envelope,
              where,
              whereArgs,
            );
            break;
          case FeatureIndexType.RTREE:
            count = this.rTreeIndexTableDao.countFeaturesWithGeometryEnvelope(
              distinct,
              column,
              envelope,
              where,
              whereArgs,
            );
            break;
          default:
            throw new GeoPackageException('Unsupported feature index type: ' + type);
        }
        break;
      } catch (e) {
        if (this.continueOnError) {
          console.error('Failed to count from feature index: ' + type, e);
        } else {
          throw e;
        }
      }
    }
    if (count == null) {
      if (column != null) {
        throw new GeoPackageException(
          'Count by column and envelope is unsupported as a manual feature query. column: ' + column,
        );
      } else {
        count = this.manualFeatureQuery.countWithGeometryEnvelope(envelope, where, whereArgs);
      }
    }
    return count;
  }

  /**
   * Query for feature index results within the bounding box in the provided
   * projection
   * @param distinct distinct rows
   * @param columns columns
   * @param boundingBox bounding box
   * @param projection projection
   * @param fieldValues field values
   * @return feature index results, close when done
   */
  public queryWithBoundingBoxAndProjectionAndFieldValues(
    distinct: boolean,
    columns: string[],
    boundingBox: BoundingBox,
    projection: Projection,
    fieldValues: ColumnValues,
  ): FeatureIndexResults {
    const featureBoundingBox = this.featureDao.projectBoundingBox(boundingBox, projection);
    return this.queryWithBoundingBoxAndFieldValues(distinct, columns, featureBoundingBox, fieldValues);
  }

  /**
   * Query for feature index count within the bounding box in the provided
   * projection
   * @param distinct distinct column values
   * @param column count column value
   * @param boundingBox bounding box
   * @param projection projection
   * @param fieldValues field values
   * @return this.count
   */
  public countWithBoundingBoxAndProjectionAndFieldValues(
    distinct: boolean,
    column: string,
    boundingBox: BoundingBox,
    projection: Projection,
    fieldValues: ColumnValues,
  ): number {
    const featureBoundingBox = this.featureDao.projectBoundingBox(boundingBox, projection);
    return this.countWithBoundingBoxAndFieldValues(distinct, column, featureBoundingBox, fieldValues);
  }

  /**
   * Query for feature index results within the bounding box in the provided
   * projection
   * @param distinct distinct rows
   * @param columns columns
   * @param boundingBox bounding box
   * @param projection projection
   * @param where where clause
   * @param whereArgs where arguments
   * @return feature index results, close when done
   */
  public queryWithBoundingBoxAndProjection(
    distinct: boolean,
    columns: string[],
    boundingBox: BoundingBox,
    projection: Projection,
    where: string,
    whereArgs: any[],
  ): FeatureIndexResults {
    const featureBoundingBox = this.featureDao.projectBoundingBox(boundingBox, projection);
    return this.queryWithBoundingBox(distinct, columns, featureBoundingBox, where, whereArgs);
  }

  /**
   * Query for feature index count within the bounding box in the provided
   * projection
   * @param distinct distinct column values
   * @param column count column name
   * @param boundingBox bounding box
   * @param projection projection
   * @param where where clause
   * @param whereArgs where arguments
   * @return this.count
   */
  public countWithBoundingBoxAndProjection(
    distinct: boolean,
    column: string,
    boundingBox: BoundingBox,
    projection: Projection,
    where: string,
    whereArgs: any[],
  ): number {
    const featureBoundingBox = this.featureDao.projectBoundingBox(boundingBox, projection);
    return this.countWithBoundingBox(distinct, column, featureBoundingBox, where, whereArgs);
  }

  /**
   * Determine if the results are paginated
   *
   * @param results query results
   * @return true if paginated
   */
  public static isPaginated(results: FeatureIndexResults): boolean {
    let paginated = false;
    if (results instanceof FeatureIndexFeatureResults) {
      paginated = this.isPaginatedWithFeatureIndexFeatureResults(results as FeatureIndexFeatureResults);
    }
    return paginated;
  }

  /**
   * Determine if the results are paginated
   *
   * @param results query results
   * @return true if paginated
   */
  public static isPaginatedWithFeatureIndexFeatureResults(results: FeatureIndexFeatureResults): boolean {
    return FeaturePaginatedResults.isPaginated(results.getResultSet());
  }

  /**
   * Paginate the results
   *
   * @param results feature index results
   * @return feature paginated results
   */
  public paginate(results: FeatureIndexResults): FeaturePaginatedResults {
    return FeatureIndexManager.paginateWithFeatureDao(this.getFeatureDao(), results);
  }

  /**
   * Paginate the results
   *
   * @param featureDao feature dao
   * @param results feature index results
   * @return feature paginated results
   */
  public static paginateWithFeatureDao(featureDao: FeatureDao, results: FeatureIndexResults): FeaturePaginatedResults {
    if (!(results instanceof FeatureIndexFeatureResults)) {
      throw new GeoPackageException(
        'Results do not contain a feature result set. Expected: FeatureIndexFeatureResults',
      );
    }
    return FeaturePaginatedResults.create(featureDao, results.getResultSet());
  }

  /**
   * Query for all feature index results ordered by id, starting at the offset
   * and returning no more than the limit
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature index results, close when done
   */
  public queryForAllChunk(limit: number, offset: number): FeatureIndexResults {
    return this.queryForChunk(false, undefined, undefined, undefined, this.getIdColumn(), limit, offset);
  }

  /**
   * Query for feature index results, starting at the offset and returning no
   * more than the limit
   *
   * @param distinct distinct rows
   * @param columns columns
   * @param fieldValues field values
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature index results, close when done
   */
  public queryForChunkWithFieldValues(
    distinct: boolean,
    columns: string[],
    fieldValues: ColumnValues,
    orderBy: string,
    limit: number,
    offset: number,
  ): FeatureIndexResults {
    const where = this.featureDao.buildWhereWithFields(fieldValues);
    const whereArgs = this.featureDao.buildWhereArgsWithValues(fieldValues);
    return this.queryForChunk(distinct, columns, where, whereArgs, orderBy, limit, offset);
  }

  /**
   * Query for feature index results ordered by id, starting at the offset and
   * returning no more than the limit
   *
   * @param distinct distinct rows
   * @param columns columns
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature index results, close when done
   */
  public queryForChunkIdOrder(
    distinct: boolean,
    columns: string[],
    where: string,
    limit: number,
    offset: number,
  ): FeatureIndexResults {
    return this.queryForChunk(distinct, columns, where, undefined, this.getIdColumn(), limit, offset);
  }

  /**
   * Query for feature index results, starting at the offset and returning no
   * more than the limit
   *
   * @param distinct distinct rows
   * @param columns columns
   * @param where where clause
   * @param whereArgs where arguments
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature index results, close when done
   */
  public queryForChunk(
    distinct: boolean,
    columns: string[],
    where: string,
    whereArgs: any[],
    orderBy: string,
    limit: number,
    offset: number,
  ): FeatureIndexResults {
    let results = null;
    for (const type of this.getLocation()) {
      try {
        switch (type) {
          case FeatureIndexType.GEOPACKAGE:
            const geoPackageResultSet = this.featureTableIndex.queryFeaturesForChunk(
              distinct,
              columns,
              where,
              whereArgs,
              orderBy,
              limit,
              offset,
            );
            results = new FeatureIndexFeatureResults(geoPackageResultSet);
            break;
          case FeatureIndexType.RTREE:
            const rTreeResultSet = this.rTreeIndexTableDao.queryFeaturesForChunk(
              distinct,
              columns,
              where,
              whereArgs,
              orderBy,
              limit,
              offset,
            );
            results = new FeatureIndexFeatureResults(rTreeResultSet);
            break;
          default:
            throw new GeoPackageException('Unsupported feature index type: ' + type);
        }
        break;
      } catch (e) {
        if (this.continueOnError) {
          console.error('Failed to query from feature index: ' + type, e);
        } else {
          throw e;
        }
      }
    }
    if (results == null) {
      const featureResultSet = this.manualFeatureQuery.queryForChunk(
        distinct,
        columns,
        where,
        whereArgs,
        orderBy,
        limit,
        offset,
      );
      results = new FeatureIndexFeatureResults(featureResultSet);
    }
    return results;
  }

  /**
   * Query for feature index results within the bounding box, projected
   * correctly, starting at the offset and returning no more than the limit
   * @param distinct distinct rows
   * @param columns columns
   * @param boundingBox bounding box
   * @param fieldValues field values
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature index results, close when done
   */
  public queryForChunkWithBoundingBoxAndFieldValues(
    distinct: boolean,
    columns: string[],
    boundingBox: BoundingBox,
    fieldValues: ColumnValues,
    orderBy: string,
    limit: number,
    offset: number,
  ): FeatureIndexResults {
    return this.queryForChunkWithEnvelopeAndFieldValues(
      distinct,
      columns,
      boundingBox.buildEnvelope(),
      fieldValues,
      orderBy,
      limit,
      offset,
    );
  }

  /**
   * Query for feature index results ordered by id within the bounding box, correctly: projected, starting at the offset and returning no more than
   * the limit
   * @param distinct distinct rows
   * @param columns columns
   * @param boundingBox bounding box
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature index results, close when done
   */
  public queryForChunkIdOrderWithBoundingBox(
    distinct: boolean,
    columns: string[],
    boundingBox: BoundingBox,
    where: string,
    limit: number,
    offset: number,
  ): FeatureIndexResults {
    return this.queryForChunkWithBoundingBox(
      distinct,
      columns,
      boundingBox,
      where,
      undefined,
      this.getIdColumn(),
      limit,
      offset,
    );
  }

  /**
   * Query for feature index results within the bounding box, projected
   * correctly, starting at the offset and returning no more than the limit
   * @param distinct distinct rows
   * @param columns columns
   * @param boundingBox bounding box
   * @param where where clause
   * @param whereArgs where arguments
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature index results, close when done
   */
  public queryForChunkWithBoundingBox(
    distinct: boolean,
    columns: string[],
    boundingBox: BoundingBox,
    where?: string,
    whereArgs?: string[],
    orderBy?: string,
    limit?: number,
    offset?: number,
  ): FeatureIndexResults {
    return this.queryForChunkWithEnvelope(
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
   * Query for feature index results within the Geometry Envelope, starting at
   * the offset and returning no more than the limit
   * @param distinct distinct rows
   * @param columns columns
   * @param envelope geometry envelope
   * @param fieldValues field values
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature index results, close when done
   */
  public queryForChunkWithEnvelopeAndFieldValues(
    distinct: boolean,
    columns: string[],
    envelope: GeometryEnvelope,
    fieldValues: ColumnValues,
    orderBy: string,
    limit: number,
    offset: number,
  ): FeatureIndexResults {
    const where = this.featureDao.buildWhereWithFields(fieldValues);
    const whereArgs = this.featureDao.buildWhereArgsWithValues(fieldValues);
    return this.queryForChunkWithEnvelope(distinct, columns, envelope, where, whereArgs, orderBy, limit, offset);
  }

  /**
   * Query for feature index results ordered by id within the Geometry
   * Envelope, starting at the offset and returning no more than the limit
   * @param distinct distinct rows
   * @param columns columns
   * @param envelope geometry envelope
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature index results, close when done
   */
  public queryForChunkIdOrderWithEnvelope(
    distinct: boolean,
    columns: string[],
    envelope: GeometryEnvelope,
    where: string,
    limit: number,
    offset: number,
  ): FeatureIndexResults {
    return this.queryForChunkWithEnvelope(
      distinct,
      columns,
      envelope,
      where,
      undefined,
      this.getIdColumn(),
      limit,
      offset,
    );
  }

  /**
   * Query for feature index results within the Geometry Envelope, starting at
   * the offset and returning no more than the limit
   *
   * @param distinct distinct rows
   * @param columns columns
   * @param envelope geometry envelope
   * @param where where clause
   * @param whereArgs where arguments
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature index results, close when done
   */
  public queryForChunkWithEnvelope(
    distinct: boolean,
    columns: string[],
    envelope: GeometryEnvelope,
    where: string,
    whereArgs: any[],
    orderBy: string,
    limit: number,
    offset: number,
  ): FeatureIndexResults {
    let results = null;
    for (const type of this.getLocation()) {
      try {
        switch (type) {
          case FeatureIndexType.GEOPACKAGE:
            const geoPackageResultSet = this.featureTableIndex.queryFeaturesForChunkWithGeometryEnvelope(
              distinct,
              columns,
              envelope,
              where,
              whereArgs,
              orderBy,
              limit,
              offset,
            );
            results = new FeatureIndexFeatureResults(geoPackageResultSet);
            break;
          case FeatureIndexType.RTREE:
            const rTreeResultSet = this.rTreeIndexTableDao.queryFeaturesForChunkWithGeometryEnvelope(
              distinct,
              columns,
              envelope,
              where,
              whereArgs,
              orderBy,
              limit,
              offset,
            );
            results = new FeatureIndexFeatureResults(rTreeResultSet);
            break;
          default:
            throw new GeoPackageException('Unsupported feature index type: ' + type);
        }
        break;
      } catch (e) {
        if (this.continueOnError) {
          console.error('Failed to query from feature index: ' + type, e);
        } else {
          throw e;
        }
      }
    }
    if (results == null) {
      results = this.manualFeatureQuery.queryForChunkWithGeometryEnvelope(
        distinct,
        columns,
        envelope,
        where,
        whereArgs,
        orderBy,
        limit,
        offset,
      );
    }
    return results;
  }

  /**
   * Query for feature index results within the bounding box in the provided
   * projection, starting at the offset and returning no more than the limit
   * @param distinct distinct rows
   * @param columns columns
   * @param boundingBox bounding box
   * @param projection projection
   * @param fieldValues field values
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature index results, close when done
   */
  public queryForChunkWithBoundingBoxAndProjectionAndFieldValues(
    distinct: boolean,
    columns: string[],
    boundingBox: BoundingBox,
    projection: Projection,
    fieldValues: ColumnValues,
    orderBy: string,
    limit: number,
    offset: number,
  ): FeatureIndexResults {
    const featureBoundingBox = this.featureDao.projectBoundingBox(boundingBox, projection);
    return this.queryForChunkWithBoundingBoxAndFieldValues(
      distinct,
      columns,
      featureBoundingBox,
      fieldValues,
      orderBy,
      limit,
      offset,
    );
  }

  /**
   * Query for feature index results ordered by id within the bounding box in
   * the provided projection, starting at the offset and returning no more
   * than the limit
   * @param distinct distinct rows
   * @param columns columns
   * @param boundingBox bounding box
   * @param projection projection
   * @param where where clause
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature index results, close when done
   */
  public queryForChunkIdOrderWithBoundingBoxAndProjection(
    distinct: boolean,
    columns: string[],
    boundingBox: BoundingBox,
    projection: Projection,
    where: string,
    limit: number,
    offset: number,
  ): FeatureIndexResults {
    return this.queryForChunkWithBoundingBoxAndProjection(
      distinct,
      columns,
      boundingBox,
      projection,
      where,
      undefined,
      this.getIdColumn(),
      limit,
      offset,
    );
  }

  /**
   * Query for feature index results within the bounding box in the provided
   * projection, starting at the offset and returning no more than the limit
   * @param distinct distinct rows
   * @param columns columns
   * @param boundingBox bounding box
   * @param projection projection
   * @param where where clause
   * @param whereArgs where arguments
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature index results, close when done
   */
  public queryForChunkWithBoundingBoxAndProjection(
    distinct: boolean,
    columns: string[],
    boundingBox: BoundingBox,
    projection: Projection,
    where: string,
    whereArgs: any[],
    orderBy: string,
    limit: number,
    offset: number,
  ): FeatureIndexResults {
    const featureBoundingBox = this.featureDao.projectBoundingBox(boundingBox, projection);
    return this.queryForChunkWithBoundingBox(
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
   * Verify the index location is set
   * @return feature index type
   */
  private verifyIndexLocation(): FeatureIndexType {
    if (this.indexLocation == null) {
      throw new GeoPackageException(
        'Index Location is not set, set the location or call an index method specifying the location',
      );
    }
    return this.indexLocation;
  }
}
