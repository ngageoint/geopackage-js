/**
 * Feature Table Index
 * @module extension/index
 */
import { BaseExtension } from '../../baseExtension';
import { GeoPackage } from '../../../geoPackage';
import { Extensions } from '../../extensions';
import { TableIndex } from './tableIndex';
import { FeatureDao } from '../../../features/user/featureDao';
import { GeometryIndexDao } from './geometryIndexDao';
import { TableIndexDao } from './tableIndexDao';
import { FeatureRow } from '../../../features/user/featureRow';
import { BoundingBox } from '../../../boundingBox';
import { GeometryEnvelope } from '@ngageoint/simple-features-js';
import { Projection } from '@ngageoint/projections-js';
import { ExtensionScopeType } from '../../extensionScopeType';
import { GeometryTransform } from '@ngageoint/simple-features-proj-js';
import { GeometryIndex } from './geometryIndex';
import { NGAExtensions } from '../ngaExtensions';
import { GeoPackageException } from '../../../geoPackageException';
import { GeometryIndexTableCreator } from './geometryIndexTableCreator';
import { GeoPackageProgress } from '../../../io/geoPackageProgress';
import { GeoPackageGeometryData } from '../../../geom/geoPackageGeometryData';
import { FeatureResultSet } from '../../../features/user/featureResultSet';
import { GeometryIndexKey } from './geometryIndexKey';
import { ColumnValues } from '../../../dao/columnValues';

/**
 * Feature Table Index NGA Extension implementation. This extension is used to
 * index Geometries within a feature table by their minimum bounding box for
 * bounding box queries.
 */
export class FeatureTableIndex extends BaseExtension {
  /**
   * Extension author
   */
  public static readonly EXTENSION_AUTHOR = NGAExtensions.EXTENSION_AUTHOR;

  /**
   * Extension name without the author
   */
  public static readonly EXTENSION_NAME_NO_AUTHOR = 'geometry_index';

  /**
   * Extension, with author and name
   */
  public static readonly EXTENSION_NAME = Extensions.buildExtensionName(
    FeatureTableIndex.EXTENSION_AUTHOR,
    FeatureTableIndex.EXTENSION_NAME_NO_AUTHOR,
  );

  /**
   * Extension definition URL
   */
  public static readonly EXTENSION_DEFINITION =
    'http://ngageoint.github.io/GeoPackage/docs/extensions/geometry-index.html';

  /**
   * Column name
   */
  private readonly columnName;

  /**
   * Table Index DAO
   */
  private readonly tableIndexDao: TableIndexDao;

  /**
   * Geometry Index DAO
   */
  private readonly geometryIndexDao: GeometryIndexDao;

  /**
   * Progress
   */
  protected progress: GeoPackageProgress;

  /**
   * Query single chunk limit
   */
  protected chunkLimit = 1000;

  /**
   * Query range tolerance
   */
  protected tolerance = 0.00000000000001;

  /**
   * Feature DAO
   */
  private readonly featureDao: FeatureDao;

  /**
   * Constructor
   * @param this.geoPackage GeoPackage object
   * @param featureDao FeatureDao to index
   */
  constructor(geoPackage: GeoPackage, featureDao: FeatureDao) {
    super(geoPackage);
    this.featureDao = featureDao;
    this.tableName = featureDao.getTableName();
    this.columnName = featureDao.getGeometryColumnName();
    this.tableIndexDao = FeatureTableIndex.getTableIndexDao(geoPackage);
    this.geometryIndexDao = FeatureTableIndex.getGeometryIndexDao(geoPackage);
  }

  /**
   * Get the table name
   * @return table name
   */
  public getTableName(): string {
    return this.tableName;
  }

  /**
   * Get the column name
   * @return column name
   */
  public getColumnName(): string {
    return this.columnName;
  }

  /**
   * Set the progress tracker
   * @param progress progress tracker
   */
  public setProgress(progress: GeoPackageProgress): void {
    this.progress = progress;
  }

  /**
   * Get the SQL query chunk limit
   * @return chunk limit
   */
  public getChunkLimit(): number {
    return this.chunkLimit;
  }

  /**
   * Set the SQL query chunk limit
   * @param chunkLimit chunk limit
   */
  public setChunkLimit(chunkLimit: number): void {
    this.chunkLimit = chunkLimit;
  }

  /**
   * Get the query range tolerance
   * @return query range tolerance
   */
  public getTolerance(): number {
    return this.tolerance;
  }

  /**
   * Set the query range tolerance
   * @param tolerance query range tolerance
   */
  public setTolerance(tolerance: number): void {
    this.tolerance = tolerance;
  }

  /**
   * Index the feature table
   *
   * @param force true to force re-indexing
   * @return count
   */
  public index(force?: boolean): number {
    let count = 0;
    if (force || !this.isIndexed()) {
      this.getOrCreateExtension();
      const tableIndex = this.getOrCreateTableIndex();
      this.createOrClearGeometryIndices();
      this.unindexGeometryIndexTable();
      count = this.indexTable(tableIndex);
      this.indexGeometryIndexTable();
    }
    return count;
  }

  /**
   * Index the geometry id and geometry data
   *
   * @param tableIndex table index
   * @param geomId geometry id
   * @param geomData geometry data
   *
   * @return true if indexed
   */
  protected indexWithGeometryIdAndGeometryData(
    tableIndex: TableIndex,
    geomId: number,
    geomData: GeoPackageGeometryData,
  ): boolean {
    let indexed = false;
    if (geomData != null) {
      // Get or build the envelope
      const envelope = geomData.getOrBuildEnvelope();
      // Create the new index row
      if (envelope != null) {
        const geometryIndex = this.geometryIndexDao.populate(tableIndex, geomId, envelope);
        try {
          this.geometryIndexDao.createOrUpdate(geometryIndex);
          indexed = true;
        } catch (e) {
          throw new GeoPackageException(
            'Failed to create or update Geometry Index. GeoPackage: ' +
              this.geoPackage.getName() +
              ', Table Name: ' +
              this.tableName +
              ', Geom Id: ' +
              geomId,
          );
        }
      }
    }
    return indexed;
  }

  /**
   * Update the last indexed time
   */
  protected updateLastIndexed(): void {
    const tableIndex = new TableIndex();
    tableIndex.setTableName(this.tableName);
    tableIndex.setLastIndexed(new Date());

    try {
      this.tableIndexDao.createOrUpdate(tableIndex);
    } catch (e) {
      throw new GeoPackageException(
        'Failed to update last indexed date. GeoPackage: ' +
          this.geoPackage.getName() +
          ', Table Name: ' +
          this.tableName,
      );
    }
  }

  /**
   * Delete the feature table index
   *
   * @return true if index deleted
   */
  public deleteIndex(): boolean {
    let deleted = false;

    try {
      // Delete geometry indices and table index
      if (this.tableIndexDao.isTableExists()) {
        deleted = this.tableIndexDao.deleteByIdCascade(this.tableName) > 0;
      }
      // Delete the extensions entry
      if (this.extensionsDao.isTableExists()) {
        deleted =
          this.extensionsDao.deleteByExtensionAndTableName(FeatureTableIndex.EXTENSION_NAME, this.tableName) > 0 ||
          deleted;
      }
    } catch (e) {
      throw new GeoPackageException(
        'Failed to delete Table Index. GeoPackage: ' + this.geoPackage.getName() + ', Table: ' + this.tableName,
      );
    }

    return deleted;
  }

  /**
   * Delete the index for the geometry id
   * @param geomId geometry id
   * @return deleted rows, should be 0 or 1
   */
  public deleteIndexWithGeometryId(geomId: number): number {
    let deleted = 0;
    const key = new GeometryIndexKey(this.tableName, geomId);
    try {
      deleted = this.geometryIndexDao.deleteByIdWithKey(key);
    } catch (e) {
      throw new GeoPackageException(
        'Failed to delete index, GeoPackage: ' +
          this.geoPackage.getName() +
          ', Table Name: ' +
          this.tableName +
          ', Geometry Id: ' +
          geomId,
      );
    }
    return deleted;
  }

  /**
   * Determine if the feature table is indexed
   *
   * @return true if indexed
   */
  public isIndexed(): boolean {
    let indexed = false;
    const extension = this.getExtension();
    if (extension != null) {
      const contentsDao = this.geoPackage.getContentsDao();
      try {
        const contents = contentsDao.queryForId(this.tableName);
        if (contents != null) {
          const lastChange = contents.getLastChange();

          const tableIndex = this.tableIndexDao.queryForId(this.tableName);

          if (tableIndex != null) {
            const lastIndexed = tableIndex.getLastIndexed();
            indexed = lastIndexed != null && lastIndexed.getTime() >= lastChange.getTime();
          }
        }
      } catch (e) {
        throw new GeoPackageException(
          'Failed to check if table is indexed, GeoPackage: ' +
            this.geoPackage.getName() +
            ', Table Name: ' +
            this.tableName,
        );
      }
    }
    return indexed;
  }

  /**
   * Get or create if needed the table index
   *
   * @return table index
   */
  private getOrCreateTableIndex(): TableIndex {
    let tableIndex = this.getTableIndex();

    if (tableIndex == null) {
      try {
        if (!this.tableIndexDao.isTableExists()) {
          this.createTableIndexTable();
        }

        tableIndex = new TableIndex();
        tableIndex.setTableName(this.tableName);
        tableIndex.setLastIndexed(null);

        this.tableIndexDao.create(tableIndex);
      } catch (e) {
        throw new GeoPackageException(
          'Failed to create Table Index for GeoPackage: ' +
            this.geoPackage.getName() +
            ', Table Name: ' +
            this.tableName +
            ', Column Name: ' +
            this.columnName,
        );
      }
    }

    return tableIndex;
  }

  /**
   * Get the table index
   *
   * @return table index
   */
  public getTableIndex(): TableIndex {
    let tableIndex = null;
    try {
      if (this.tableIndexDao.isTableExists()) {
        tableIndex = this.tableIndexDao.queryForId(this.tableName);
      }
    } catch (e) {
      throw new GeoPackageException(
        'Failed to query for Table Index for GeoPackage: ' +
          this.geoPackage.getName() +
          ', Table Name: ' +
          this.tableName +
          ', Column Name: ' +
          this.columnName,
      );
    }
    return tableIndex;
  }

  /**
   * Get the date last indexed
   *
   * @return last indexed date or null
   */
  public getLastIndexed(): Date {
    let lastIndexed = null;
    const tableIndex = this.getTableIndex();
    if (tableIndex != null) {
      lastIndexed = tableIndex.getLastIndexed();
    }
    return lastIndexed;
  }

  /**
   * Clear the Geometry Indices, or create the table if needed
   */
  private createOrClearGeometryIndices(): void {
    if (!this.createGeometryIndexTable()) {
      this.clearGeometryIndices();
    }
  }

  /**
   * Clear the Geometry Indices for the table name
   *
   * @return number of rows deleted
   */
  private clearGeometryIndices(): number {
    let deleted = 0;
    try {
      const fieldValues = new ColumnValues();
      fieldValues.addColumn(GeometryIndex.COLUMN_TABLE_NAME, this.tableName);
      deleted = this.geometryIndexDao.deleteWhere(
        this.geometryIndexDao.buildWhere(fieldValues),
        this.geometryIndexDao.buildWhereArgs(fieldValues),
      );
    } catch (e) {
      throw new GeoPackageException(
        'Failed to clear Geometry Index rows for GeoPackage: ' +
          this.geoPackage.getName() +
          ', Table Name: ' +
          this.tableName +
          ', Column Name: ' +
          this.columnName,
      );
    }
    return deleted;
  }

  /**
   * Get or create if needed the extension
   *
   * @return extensions object
   */
  private getOrCreateExtension(): Extensions {
    return this.getOrCreate(
      FeatureTableIndex.EXTENSION_NAME,
      this.tableName,
      this.columnName,
      FeatureTableIndex.EXTENSION_DEFINITION,
      ExtensionScopeType.READ_WRITE,
    );
  }

  /**
   * Get the extension
   *
   * @return extensions object or null if one does not exist
   */
  public getExtension(): Extensions[] {
    return [this.get(FeatureTableIndex.EXTENSION_NAME, this.tableName, this.columnName)];
  }

  /**
   * Get a Table Index DAO
   *
   * @return table index dao
   */
  public getTableIndexDao(): TableIndexDao {
    return FeatureTableIndex.getTableIndexDao(this.geoPackage);
  }

  /**
   * Get a Table Index DAO
   *
   * @param this.geoPackage GeoPackage
   * @return table index dao
   */
  public static getTableIndexDao(geoPackage: GeoPackage): TableIndexDao {
    return TableIndexDao.createDao(geoPackage);
  }

  /**
   * Create the Table Index Table if it does not exist
   *
   * @return true if created
   */
  public createTableIndexTable(): boolean {
    this.verifyWritable();
    let created = false;
    try {
      if (!this.tableIndexDao.isTableExists()) {
        const tableCreator = new GeometryIndexTableCreator(this.geoPackage);
        created = tableCreator.createTableIndex();
      }
    } catch (e) {
      throw new GeoPackageException('Failed to check if TableIndex table exists and create it');
    }
    return created;
  }

  /**
   * Get a Geometry Index DAO
   *
   * @return geometry index dao
   */
  public getGeometryIndexDao(): GeometryIndexDao {
    return FeatureTableIndex.getGeometryIndexDao(this.geoPackage);
  }

  /**
   * Get a Geometry Index DAO
   *
   * @param this.geoPackage GeoPackage
   * @return geometry index dao
   */
  public static getGeometryIndexDao(geoPackage: GeoPackage): GeometryIndexDao {
    return GeometryIndexDao.create(geoPackage);
  }

  /**
   * Create Geometry Index Table if it does not exist and index it
   *
   * @return true if created
   */
  public createGeometryIndexTable(): boolean {
    this.verifyWritable();

    let created = false;

    try {
      if (!this.geometryIndexDao.isTableExists()) {
        const tableCreator = new GeometryIndexTableCreator(this.geoPackage);
        created = tableCreator.createGeometryIndex();
      }
    } catch (e) {
      throw new GeoPackageException('Failed to check if GeometryIndex table exists and create it');
    }
    return created;
  }

  /**
   * Index the Geometry Index Table if needed
   *
   * @return true if indexed
   */
  public indexGeometryIndexTable(): boolean {
    this.verifyWritable();
    let indexed = false;
    try {
      if (this.geometryIndexDao.isTableExists()) {
        const tableCreator = new GeometryIndexTableCreator(this.geoPackage);
        indexed = tableCreator.indexGeometryIndex();
      }
    } catch (e) {
      throw new GeoPackageException('Failed to check if GeometryIndex table exists to index');
    }
    return indexed;
  }

  /**
   * Un-index the Geometry Index Table if needed
   *
   * @return true if unindexed
   */
  public unindexGeometryIndexTable(): boolean {
    this.verifyWritable();
    let unindexed = false;
    try {
      if (this.geometryIndexDao.isTableExists()) {
        const tableCreator = new GeometryIndexTableCreator(this.geoPackage);
        unindexed = tableCreator.unindexGeometryIndex();
      }
    } catch (e) {
      throw new GeoPackageException('Failed to check if GeometryIndex table exists to unindex');
    }
    return unindexed;
  }

  /**
   * Query for all Geometry Index objects
   *
   * @return geometry indices iterator
   */
  public query(): IterableIterator<GeometryIndex> {
    const geometryIndices = null;

    try {
      const fieldValues = new ColumnValues();
      fieldValues.addColumn(GeometryIndex.COLUMN_TABLE_NAME, this.tableName);
      this.geometryIndexDao.queryWhere(
        this.geometryIndexDao.buildWhere(fieldValues),
        this.geometryIndexDao.buildWhereArgs(fieldValues),
      );
    } catch (e) {
      throw new GeoPackageException(
        'Failed to query for all Geometry Indices. GeoPackage: ' +
          this.geoPackage.getName() +
          ', Table Name: ' +
          this.tableName +
          ', Column Name: ' +
          this.columnName,
      );
    }

    return geometryIndices;
  }

  /**
   * Query for all Geometry Index count
   *
   * @return count
   */
  public count(): number {
    let count = 0;
    const { where, whereArgs } = this.queryBuilder();
    try {
      count = this.geometryIndexDao.countWhere(where, whereArgs);
    } catch (e) {
      throw new GeoPackageException(
        'Failed to query for Geometry Index count. GeoPackage: ' +
          this.geoPackage.getName() +
          ', Table Name: ' +
          this.tableName +
          ', Column Name: ' +
          this.columnName,
      );
    }

    return count;
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
      result = this.geometryIndexDao.queryRaw(
        'SELECT MIN(' +
          GeometryIndex.COLUMN_MIN_X +
          '), MIN(' +
          GeometryIndex.COLUMN_MIN_Y +
          '), MAX(' +
          GeometryIndex.COLUMN_MAX_X +
          '), MAX(' +
          GeometryIndex.COLUMN_MAX_Y +
          ') FROM ' +
          GeometryIndex.TABLE_NAME +
          ' WHERE ' +
          GeometryIndex.COLUMN_TABLE_NAME +
          ' = ?',
        [this.tableName],
      );
    } catch (e) {
      throw new GeoPackageException('Failed to query for indexed feature bounds: ' + this.tableName);
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
   * Build a query builder to query for all Geometry Index objects
   *
   * @return query builder
   */
  public queryBuilder(): { where: string; whereArgs: any[] } {
    const fieldValues = new ColumnValues();
    fieldValues.addColumn(GeometryIndex.COLUMN_TABLE_NAME, this.tableName);
    const where = this.geometryIndexDao.buildWhere(fieldValues);
    const whereArgs = this.geometryIndexDao.buildWhereArgs(fieldValues);
    return { where, whereArgs };
  }

  /**
   * Query for Geometry Index objects within the bounding box, projected
   * correctly
   *
   * @param boundingBox bounding box
   * @return geometry indices iterator
   */
  public queryWithBoundingBox(boundingBox: BoundingBox): IterableIterator<GeometryIndex> {
    const envelope = boundingBox.buildEnvelope();
    return this.queryWithGeometryEnvelope(envelope);
  }

  /**
   * Query for Geometry Index objects within the bounding box, projected
   * correctly
   *
   * @param boundingBox bounding box
   * @param projection: Projection of the provided bounding box
   * @return geometry indices iterator
   */
  public queryWithBoundingBoxAndProjection(
    boundingBox: BoundingBox,
    projection: Projection,
  ): IterableIterator<GeometryIndex> {
    const featureBoundingBox = this.projectBoundingBox(boundingBox, projection);
    return this.queryWithBoundingBox(featureBoundingBox);
  }

  /**
   * Query for Geometry Index count within the bounding box, projected
   * correctly
   *
   * @param boundingBox bounding box
   * @return count
   */
  public countWithBoundingBox(boundingBox: BoundingBox): number {
    const envelope = boundingBox.buildEnvelope();
    return this.countWithGeometryEnvelope(envelope);
  }

  /**
   * Query for Geometry Index count within the bounding box, projected
   * correctly
   *
   * @param boundingBox bounding box
   * @param projection: Projection of the provided bounding box
   * @return count
   */
  public countWithBoundingBoxAndProjection(boundingBox: BoundingBox, projection: Projection): number {
    const featureBoundingBox = this.projectBoundingBox(boundingBox, projection);
    return this.countWithBoundingBox(featureBoundingBox);
  }

  /**
   * Query for Geometry Index objects within the Geometry Envelope
   *
   * @param envelope geometry envelope
   * @return geometry indices iterator
   */
  public queryWithGeometryEnvelope(envelope: GeometryEnvelope): IterableIterator<GeometryIndex> {
    let geometryIndices = null;

    const qb = this.queryBuilderWithGeometryEnvelope(envelope);
    try {
      geometryIndices = this.geometryIndexDao.queryWhere(qb.where, qb.whereArgs);
    } catch (e) {
      throw new GeoPackageException(
        'Failed to query for Geometry Indices. GeoPackage: ' +
          this.geoPackage.getName() +
          ', Table Name: ' +
          this.tableName +
          ', Column Name: ' +
          this.columnName,
      );
    }

    return geometryIndices;
  }

  /**
   * Query for Geometry Index count within the Geometry Envelope
   *
   * @param envelope geometry envelope
   * @return count
   */
  public countWithGeometryEnvelope(envelope: GeometryEnvelope): number {
    let count = 0;
    const { where, whereArgs } = this.queryBuilderWithGeometryEnvelope(envelope);
    try {
      count = this.geometryIndexDao.countWhere(where, whereArgs);
    } catch (e) {
      throw new GeoPackageException(
        'Failed to query for Geometry Index count. GeoPackage: ' +
          this.geoPackage.getName() +
          ', Table Name: ' +
          this.tableName +
          ', Column Name: ' +
          this.columnName,
      );
    }
    return count;
  }

  /**
   * Build a query builder to query for Geometry Index objects within the
   * Geometry Envelope
   *
   * @param envelope geometry envelope
   * @return query builder
   */
  public queryBuilderWithGeometryEnvelope(envelope: GeometryEnvelope): { where: string; whereArgs: any[] } {
    let where = '';
    const whereArgs = [];

    const minX = envelope.minX - this.tolerance;
    const maxX = envelope.maxX + this.tolerance;
    const minY = envelope.minY - this.tolerance;
    const maxY = envelope.maxY + this.tolerance;

    where += this.geometryIndexDao.buildWhereWithFieldAndValue(GeometryIndex.COLUMN_TABLE_NAME, this.tableName, '=');
    where += ' and ';
    where += this.geometryIndexDao.buildWhereWithFieldAndValue(GeometryIndex.COLUMN_MIN_X, maxX, '<=');
    where += ' and ';
    where += this.geometryIndexDao.buildWhereWithFieldAndValue(GeometryIndex.COLUMN_MAX_X, minX, '>=');
    where += ' and ';
    where += this.geometryIndexDao.buildWhereWithFieldAndValue(GeometryIndex.COLUMN_MIN_Y, maxY, '<=');
    where += ' and ';
    where += this.geometryIndexDao.buildWhereWithFieldAndValue(GeometryIndex.COLUMN_MAX_Y, minY, '>=');

    whereArgs.push(this.tableName);
    whereArgs.push(maxX);
    whereArgs.push(minX);
    whereArgs.push(maxY);
    whereArgs.push(minY);

    if (envelope.hasZ) {
      const minZ = envelope.minZ - this.tolerance;
      const maxZ = envelope.maxZ + this.tolerance;
      where += ' and ';
      where += this.geometryIndexDao.buildWhereWithFieldAndValue(GeometryIndex.COLUMN_MIN_Z, maxZ, '<=');
      where += ' and ';
      where += this.geometryIndexDao.buildWhereWithFieldAndValue(GeometryIndex.COLUMN_MAX_Z, minZ, '>=');
      whereArgs.push(maxZ);
      whereArgs.push(minZ);
    }

    if (envelope.hasM) {
      const minM = envelope.minM - this.tolerance;
      const maxM = envelope.maxM + this.tolerance;
      where += ' and ';
      where += this.geometryIndexDao.buildWhereWithFieldAndValue(GeometryIndex.COLUMN_MIN_M, maxM, '<=');
      where += ' and ';
      where += this.geometryIndexDao.buildWhereWithFieldAndValue(GeometryIndex.COLUMN_MAX_M, minM, '>=');
      whereArgs.push(maxM);
      whereArgs.push(minM);
    }

    return { where, whereArgs };
  }

  /**
   * Project the provided bounding box in the declared projection to the user
   * DAO projection
   *
   * @param boundingBox bounding box
   * @param projection: Projection
   * @return projected bounding box
   */
  public projectBoundingBox(boundingBox: BoundingBox, projection: Projection): BoundingBox {
    const projectionTransform = GeometryTransform.create(projection, this.getProjection());
    const projectedBoundingBox = boundingBox.transform(projectionTransform);
    return projectedBoundingBox;
  }

  /**
   * {@inheritDoc}
   */
  public getProjection(): Projection {
    return this.featureDao.getProjection();
  }

  /**
   * Get the primary key column name
   *
   * @return primary key column name
   */
  public getPkColumnName(): string {
    return this.featureDao.getPkColumnName();
  }

  /**
   * Close the table index
   */
  public close(): void {
    // Don't close anything, leave the GeoPackage connection open
  }

  /**
   * Index the feature row. This method assumes that indexing has been
   * completed and maintained as the last indexed time is updated.
   *
   * @param row feature row
   * @return true if indexed
   */
  public indexFeatureRow(row: FeatureRow): boolean {
    const tableIndex = this.getTableIndex();
    if (tableIndex == null) {
      throw new GeoPackageException(
        'GeoPackage table is not indexed. GeoPackage: ' + this.geoPackage.getName() + ', Table: ' + this.getTableName(),
      );
    }
    const indexed = this.indexWithGeometryIdAndGeometryData(tableIndex, row.getId(), row.getGeometry());

    // Update the last indexed time
    this.updateLastIndexed();

    return indexed;
  }

  /**
   * Indexes a chunk of feature rows
   * @param tableIndex
   * @param columns
   * @param chunkOffset
   * @protected
   */
  private indexChunk(tableIndex, columns, chunkOffset): number {
    const resultSet = this.featureDao.queryForChunk(
      false,
      columns,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      this.chunkLimit,
      chunkOffset,
    );
    return this.indexRows(tableIndex, resultSet);
  }

  /**
   * Indexes the table
   * @param tableIndex
   * @protected
   */
  public indexTable(tableIndex: TableIndex): number {
    let count = 0;
    let offset = 0;
    let chunkCount = 0;

    const columns: string[] = this.featureDao.getIdAndGeometryColumnNames();

    while (chunkCount >= 0) {
      const chunkOffset = offset;

      try {
        chunkCount = this.indexChunk(tableIndex, columns, chunkOffset);
        if (chunkCount > 0) {
          count += chunkCount;
        }
      } catch (e) {
        throw new GeoPackageException(
          'Failed to Index Table. GeoPackage: ' + this.geoPackage.getName() + ', Table: ' + this.getTableName(),
        );
      }

      offset += this.chunkLimit;
    }

    // Update the last indexed time
    if (this.progress == null || this.progress.isActive()) {
      this.updateLastIndexed();
    }

    return count;
  }

  /**
   * Index the feature rows in the result set
   * @param tableIndex table index
   * @param resultSet feature result
   * @return count, -1 if no results or canceled
   */
  private indexRows(tableIndex: TableIndex, resultSet: FeatureResultSet): number {
    let count = -1;
    while ((this.progress == null || this.progress.isActive()) && resultSet.moveToNext()) {
      if (count < 0) {
        count++;
      }
      try {
        const row = resultSet.getRow();
        const indexed = this.indexWithGeometryIdAndGeometryData(tableIndex, row.getId(), row.getGeometry());
        if (indexed) {
          count++;
        }
        if (this.progress != null) {
          this.progress.addProgress(1);
        }
      } catch (e) {
        console.error('Failed to index feature. Table: ' + tableIndex.getTableName());
      }
    }
    return count;
  }

  /**
   * Delete the index for the feature row
   *
   * @param row feature row
   * @return deleted rows, should be 0 or 1
   */
  public deleteIndexWithFeatureRow(row: FeatureRow): number {
    return this.deleteIndexWithGeometryId(row.getId());
  }

  /**
   * Get the feature row for the Geometry Index
   *
   * @param geometryIndex geometry index
   * @return feature row
   */
  public getFeatureRow(geometryIndex: GeometryIndex): FeatureRow {
    const geomId = geometryIndex.getGeomId();
    return this.featureDao.queryForIdRow(geomId);
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
    const nestedQuery = this.queryBuilderWithGeometryEnvelope(envelope);
    return this.featureDao.queryIn(distinct, columns, nestedQuery.where, nestedQuery.whereArgs, where, whereArgs);
  }

  /**
   * Query for all Features
   * @param distinct distinct rows
   * @param columns columns
   * @param where where
   * @param whereArgs where args
   * @return feature results
   */
  public queryFeatures(distinct?: boolean, columns?: string[], where?: string, whereArgs?: any[]): FeatureResultSet {
    const nestedQuery = this.queryBuilder();
    return this.featureDao.queryIn(distinct, columns, nestedQuery.where, nestedQuery.whereArgs, where, whereArgs);
  }

  /**
   * Count features
   * @param distinct distinct rows
   * @param column column
   * @param where where
   * @param whereArgs where args
   * @return count
   */
  public countFeatures(distinct?: boolean, column?: string, where?: string, whereArgs?: any[]): number {
    const nestedQuery = this.queryBuilder();
    return this.featureDao.countIn(distinct, column, nestedQuery.where, nestedQuery.whereArgs, where, whereArgs);
  }

  /**
   * Count features
   *
   * @param column count column name
   * @return count
   */
  public countColumnFeatures(column: string): number {
    const nestedQuery = this.queryBuilder();
    return this.featureDao.countIn(false, column, nestedQuery.where, nestedQuery.whereArgs);
  }

  /**
   * Count the Features within the bounding box in the provided projection
   *
   * @param distinct distinct column values
   * @param column count column name
   * @param boundingBox bounding box
   * @param projection: Projection of the provided bounding box
   * @param where where clause
   * @param whereArgs where arguments
   * @return count
   */
  public countFeaturesWithBoundingBox(
    distinct: boolean,
    column: string,
    boundingBox: BoundingBox,
    where: string,
    whereArgs: any[],
  ): number {
    return this.countFeaturesWithGeometryEnvelope(distinct, column, boundingBox.buildEnvelope(), where, whereArgs);
  }

  /**
   * Count the Features within the bounding box in the provided projection
   *
   * @param distinct distinct column values
   * @param column count column name
   * @param boundingBox bounding box
   * @param projection: Projection of the provided bounding box
   * @param where where clause
   * @param whereArgs where arguments
   * @return count
   */
  public countFeaturesWithBoundingBoxAndProjection(
    distinct: boolean,
    column: string,
    boundingBox: BoundingBox,
    projection: Projection,
    where: string,
    whereArgs: any[],
  ): number {
    const featureBoundingBox = this.projectBoundingBox(boundingBox, projection);
    return this.countFeaturesWithBoundingBox(distinct, column, featureBoundingBox, where, whereArgs);
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
    const nestedQuery = this.queryBuilderWithGeometryEnvelope(envelope);
    return this.featureDao.countIn(distinct, column, nestedQuery.where, nestedQuery.whereArgs, where, whereArgs);
  }

  /**
   * Query for features within the bounding box, starting at the offset and returning no more than the limit
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
   * Query for features within the geometry envelope, starting at the offset
   * and returning no more than the limit
   *
   * @param distinct distinct rows
   * @param columns columns
   * @param envelope geometry envelope
   * @param fieldValues field values
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkWithFieldValues(
    distinct: boolean,
    columns: string[],
    envelope: GeometryEnvelope,
    fieldValues: ColumnValues,
    orderBy: string,
    limit: number,
    offset: number,
  ): FeatureResultSet {
    const nestedQuery = this.queryBuilderWithGeometryEnvelope(envelope);
    const where = this.featureDao.buildWhereWithFields(fieldValues);
    const whereArgs = this.featureDao.buildWhereArgsWithValues(fieldValues);
    return this.featureDao.queryInForChunk(
      distinct,
      columns,
      nestedQuery.where,
      nestedQuery.whereArgs,
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
   * Query for features within the geometry envelope ordered by id, starting
   * at the offset and returning no more than the limit
   *
   * @param distinct distinct rows
   * @param columns columns
   * @param envelope geometry envelope
   * @param where where clause
   * @param whereArgs where arguments
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkIdOrderWithGeometryEnvelope(
    distinct: boolean,
    columns: string[],
    envelope: GeometryEnvelope,
    where: string,
    whereArgs: any[],
    limit: number,
    offset: number,
  ): FeatureResultSet {
    return this.queryFeaturesForChunkWithGeometryEnvelope(
      distinct,
      columns,
      envelope,
      where,
      whereArgs,
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
    const nestedQuery = this.queryBuilderWithGeometryEnvelope(envelope);
    return this.featureDao.queryInForChunk(
      distinct,
      columns,
      nestedQuery.where,
      nestedQuery.whereArgs,
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
   * Query for features within the geometry envelope ordered by id, starting
   * at the offset and returning no more than the limit
   *
   * @param distinct distinct rows
   * @param columns columns
   * @param where where clause
   * @param whereArgs where arguments
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
   */
  public queryFeaturesForChunkIdOrder(
    distinct: boolean,
    columns: string[],
    where: string,
    whereArgs: any[],
    limit: number,
    offset: number,
  ): FeatureResultSet {
    return this.queryFeaturesForChunk(distinct, columns, where, whereArgs, this.getPkColumnName(), limit, offset);
  }

  /**
   * Query for features
   * @param distinct distinct rows
   * @param columns columns
   * @param where where clause
   * @param whereArgs where arguments
   * @param orderBy order by
   * @param limit chunk limit
   * @param offset chunk query offset
   * @return feature results
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
}
