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
import { GeometryIndexTableCreator } from "./geometryIndexTableCreator";

/**
 * This class will either use the RTree index if it exists, or the
 * Feature Table Index NGA Extension implementation. This extension is used to
 * index Geometries within a feature table by their minimum bounding box for
 * bounding box queries.
 * @class
 * @extends BaseExtension
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
  public static readonly EXTENSION_DEFINITION = 'http://ngageoint.github.io/GeoPackage/docs/extensions/geometry-index.html';


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
  protected progress: Function;

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
   * @param geoPackage GeoPackage object
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
   * Get the feature row for the Geometry Index
   * @param geometryIndex geometry index
   * @return feature row
   */
  public getFeatureRow(geometryIndex: GeometryIndex): FeatureRow {
    const geomId = geometryIndex.getGeomId();
    return this.featureDao.queryForIdRow(geomId);
  }

  // /**
  //  * Index the table if not already indexed
  //  * @param  {Function} progress function which is called with progress while indexing
  //  * @return {Promise<Boolean>} promise resolved when the indexing is complete
  //  */
  // async index(progress?: Function): Promise<boolean> {
  //   return this.indexWithForce(false, progress);
  // }
  //
  // /**
  //  * Index the table if not already indexed or force is true
  //  * @param  {Boolean} force force index even if the table is already indexed
  //  * @param  {Function} progress function which is called with progress while indexing
  //  * @return {Promise<Boolean>} promise resolved when the indexing is complete
  //  */
  // async indexWithForce(force?: false, progress?: Function): Promise<number> {
  //   let count = 0;
  //   // eslint-disable-next-line @typescript-eslint/no-empty-function
  //   progress = progress || function(): void {};
  //   this.progress = function(message: any): void {
  //     setTimeout(progress, 0, message);
  //   };
  //   if (!this.isIndexed() || force) {
  //     const tableIndex = getOrCreateTableIndex();
  //     this.createOrClearGeometryIndices();
  //     this.unindexGeometryIndexTable();
  //     count = this.indexTable(tableIndex);
  //     indexGeometryIndexTable();
  //   }
  //   return count;
  // }

  // /**
  //  * Indexes the table
  //  * @param  {module:extension/index~TableIndex} tableIndex TableIndex
  //  * @return {Promise} resolved when complete
  //  */
  // async indexTable(tableIndex: TableIndex): Promise<boolean> {
  //   return new Promise((resolve: Function, reject: Function) => {
  //     setTimeout(() => {
  //       this.indexChunk(0, tableIndex, resolve, reject);
  //     });
  //   }).then(() => {
  //     const status = this.updateLastIndexed(tableIndex);
  //     return status.isCreated() || status.isUpdated();
  //   });
  // }
  // /**
  //  * Indexes a chunk of 100 rows
  //  * @param  {Number} page       page to start on
  //  * @param  {module:extension/index~TableIndex} tableIndex TableIndex
  //  * @param  {Function} resolve    function to call when all chunks are indexed
  //  * @param  {Function} reject     called if there is an error
  //  */
  // indexChunk(page: number, tableIndex: TableIndex, resolve: Function, reject: Function): void {
  //   const rows = this.featureDao.queryForChunk(100, page);
  //   if (rows.length) {
  //     this.progress('Indexing ' + page * 100 + ' to ' + (page + 1) * 100);
  //     rows.forEach(row => {
  //       const fr = this.featureDao.getRow(row) as FeatureRow;
  //       this.indexRow(tableIndex, fr.id, fr.geometry);
  //     });
  //     setTimeout(() => {
  //       this.indexChunk(++page, tableIndex, resolve, reject);
  //     });
  //   } else {
  //     resolve();
  //   }
  // }
  // /**
  //  * Indexes a row
  //  * @param  {ableIndex} tableIndex TableIndex`
  //  * @param  {Number} geomId     id of the row
  //  * @param  {GeoPackageGeometryData} geomData   GeoPackageGeometryData to index
  //  * @return {Boolean} success
  //  */
  // indexRow(tableIndex: TableIndex, geomId: number, geomData: GeoPackageGeometryData): boolean {
  //   if (!geomData) return false;
  //   const envelope = geomData.getOrBuildEnvelope();
  //   if (envelope) {
  //     const geometryIndex = this.geometryIndexDao.populate(tableIndex, geomId, envelope);
  //     const status = this.geometryIndexDao.createOrUpdate(geometryIndex);
  //     return status.isCreated() || status.isUpdated();
  //   } else {
  //     return false;
  //   }
  // }
  // /**
  //  * Update the last time this feature table was indexed
  //  * @param  {module:extension/index~TableIndex} tableIndex TableIndex
  //  * @return {Object} update status
  //  */
  // updateLastIndexed(tableIndex: TableIndex): CreateOrUpdateStatus {
  //   if (!tableIndex) {
  //     tableIndex = new TableIndex();
  //     tableIndex.table_name = this.tableName;
  //   }
  //   tableIndex.last_indexed = new Date().toISOString();
  //   const updateStatus = this.tableIndexDao.createOrUpdate(tableIndex);
  //   return updateStatus;
  // }
  // /**
  //  * Query the index with the specified bounding box and projection
  //  * @param  {module:boundingBox~BoundingBox} boundingBox bounding box to query for
  //  * @param  {string} projection  projection the boundingBox is in
  //  * @return {IterableIterator}
  //  */
  // queryWithBoundingBox(boundingBox: BoundingBox, projection: Projection): IterableIterator<any> {
  //   const projectedBoundingBox = boundingBox.transform(new GeometryTransform(projection, this.featureDao.projection));
  //   const envelope = projectedBoundingBox.buildEnvelope();
  //   return this.queryWithGeometryEnvelope(envelope);
  // }
  // /**
  //  * Query witha geometry envelope
  //  * @param  {any} envelope envelope
  //  * @return {IterableIterator<any>}
  //  */
  // queryWithGeometryEnvelope(envelope: GeometryEnvelope): IterableIterator<any> {
  //   if (this.rtreeIndexed) {
  //     return this.rtreeIndexDao.queryWithGeometryEnvelope(envelope);
  //   } else {
  //     return this.geometryIndexDao.queryWithGeometryEnvelope(envelope);
  //   }
  // }
  // /**
  //  * Count the index with the specified bounding box and projection
  //  * @param  {module:boundingBox~BoundingBox} boundingBox bounding box to query for
  //  * @param  {string} projection  projection the boundingBox is in
  //  * @return {Number}
  //  */
  // countWithBoundingBox(boundingBox: BoundingBox, projection: Projection): number {
  //   const projectedBoundingBox = boundingBox.transform(new GeometryTransform(projection, this.featureDao.projection));
  //   const envelope = projectedBoundingBox.buildEnvelope();
  //   return this.countWithGeometryEnvelope(envelope);
  // }
  // /**
  //  * Count with a geometry envelope
  //  * @param  {any} envelope envelope
  //  * @return {Number}
  //  */
  // countWithGeometryEnvelope(envelope: GeometryEnvelope): number {
  //   if (this.rtreeIndexed) {
  //     return this.rtreeIndexDao.countWithGeometryEnvelope(envelope);
  //   } else {
  //     return this.geometryIndexDao.countWithGeometryEnvelope(envelope);
  //   }
  // }

  /**
   * Check if indexed
   */
  isIndexed(): boolean {
    let indexed = false;
    const extension = this.getExtension(FeatureTableIndex.EXTENSION_NAME, this.tableName, this.columnName);
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
          this.getTableName(),
        );
      }
    }
    return indexed;
  }

  /**
   * Get a Table Index DAO
   * @param geoPackage GeoPackage
   * @return table index dao
   */
  public static getTableIndexDao(geoPackage: GeoPackage): TableIndexDao {
    return TableIndexDao.create(geoPackage);
  }

  /**
   * Get a Geometry Index DAO
   * @param geoPackage GeoPackage
   * @return geometry index dao
   */
  public static getGeometryIndexDao(geoPackage: GeoPackage): GeometryIndexDao {
    return GeometryIndexDao.create(geoPackage);
  }

  /**
   * Create the Table Index Table if it does not exist
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
   * Create Geometry Index Table if it does not exist and index it
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
   * Index the feature table
   *
   * @param force
   *            true to force re-indexing
   * @return count
   */
  public index(force = false): number {
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
   * Index the feature table
   *
   * @param tableIndex
   *            table index
   * @return count
   */
  protected indexTable(tableIndex: TableIndex) {
      let count = 0;

      let offset = 0;
      let chunkCount = 0;

      const columns = this.featureDao.getIdAndGeometryColumnNames();

      while (chunkCount >= 0) {

      final long chunkOffset = offset;

      try {
      // Iterate through each row and index as a single transaction
      ConnectionSource connectionSource = getGeoPackage()
        .getDatabase().getConnectionSource();
      chunkCount = TransactionManager.callInTransaction(
        connectionSource, new Callable<Integer>() {
      public Integer call() throws Exception {

      FeatureResultSet resultSet = featureDao
        .queryForChunk(columns, chunkLimit,
          chunkOffset);
      int count = indexRows(tableIndex, resultSet);

      return count;
    }
    });
    if (chunkCount > 0) {
      count += chunkCount;
    }
    } catch (SQLException e) {
      throw new GeoPackageException(
        "Failed to Index Table. GeoPackage: "
        + getGeoPackage().getName() + ", Table: "
        + getTableName(),
        e);
    }

    offset += chunkLimit;
    }

    // Update the last indexed time
    if (progress == null || progress.isActive()) {
      updateLastIndexed();
    }

    return count;
  }

  /**
   * Index the geometry id and geometry data
   *
   * @param tableIndex
   *            table index
   * @param geomId
   *            geometry id
   * @param geomData
   *            geometry data
   *
   * @return true if indexed
   */
  protected boolean index(TableIndex tableIndex, long geomId,
    GeoPackageGeometryData geomData) {

    boolean indexed = false;

    if (geomData != null) {

      // Get or build the envelope
      GeometryEnvelope envelope = geomData.getOrBuildEnvelope();

      // Create the new index row
      if (envelope != null) {
        GeometryIndex geometryIndex = geometryIndexDao
          .populate(tableIndex, geomId, envelope);
        try {
          geometryIndexDao.createOrUpdate(geometryIndex);
          indexed = true;
        } catch (SQLException e) {
          throw new GeoPackageException(
            "Failed to create or update Geometry Index. GeoPackage: "
            + geoPackage.getName() + ", Table Name: "
            + tableName + ", Geom Id: " + geomId,
            e);
        }
      }
    }

    return indexed;
  }

  /**
   * Update the last indexed time
   */
  protected void updateLastIndexed() {

    TableIndex tableIndex = new TableIndex();
    tableIndex.setTableName(tableName);
    tableIndex.setLastIndexed(new Date());

    try {
      tableIndexDao.createOrUpdate(tableIndex);
    } catch (SQLException e) {
      throw new GeoPackageException(
        "Failed to update last indexed date. GeoPackage: "
        + geoPackage.getName() + ", Table Name: "
        + tableName,
        e);
    }
  }

  /**
   * Delete the feature table index
   *
   * @return true if index deleted
   */
  public boolean deleteIndex() {

    boolean deleted = false;

    try {
      // Delete geometry indices and table index
      if (tableIndexDao.isTableExists()) {
        deleted = tableIndexDao.deleteByIdCascade(tableName) > 0;
      }
      // Delete the extensions entry
      if (extensionsDao.isTableExists()) {
        deleted = extensionsDao.deleteByExtension(EXTENSION_NAME,
          tableName) > 0 || deleted;
      }
    } catch (SQLException e) {
      throw new GeoPackageException(
        "Failed to delete Table Index. GeoPackage: "
        + geoPackage.getName() + ", Table: " + tableName,
        e);
    }

    return deleted;
  }

  /**
   * Delete the index for the geometry id
   *
   * @param geomId
   *            geometry id
   *
   * @return deleted rows, should be 0 or 1
   */
  public int deleteIndex(long geomId) {
    int deleted = 0;
    GeometryIndexKey key = new GeometryIndexKey(tableName, geomId);
    try {
      deleted = geometryIndexDao.deleteById(key);
    } catch (SQLException e) {
      throw new GeoPackageException("Failed to delete index, GeoPackage: "
        + geoPackage.getName() + ", Table Name: " + tableName
        + ", Geometry Id: " + geomId, e);
    }
    return deleted;
  }

  /**
   * Determine if the feature table is indexed
   *
   * @return true if indexed
   */
  public boolean isIndexed() {
    boolean indexed = false;
    Extensions extension = getExtension();
    if (extension != null) {

      ContentsDao contentsDao = geoPackage.getContentsDao();
      try {
        Contents contents = contentsDao.queryForId(tableName);
        if (contents != null) {
          Date lastChange = contents.getLastChange();

          TableIndex tableIndex = tableIndexDao.queryForId(tableName);

          if (tableIndex != null) {
            Date lastIndexed = tableIndex.getLastIndexed();
            indexed = lastIndexed != null && lastIndexed
              .getTime() >= lastChange.getTime();
          }
        }
      } catch (SQLException e) {
        throw new GeoPackageException(
          "Failed to check if table is indexed, GeoPackage: "
          + geoPackage.getName() + ", Table Name: "
          + tableName,
          e);
      }
    }
    return indexed;
  }

  /**
   * Get or create if needed the table index
   *
   * @return table index
   */
  private TableIndex getOrCreateTableIndex() {
    TableIndex tableIndex = getTableIndex();

    if (tableIndex == null) {
      try {
        if (!tableIndexDao.isTableExists()) {
          createTableIndexTable();
        }

        tableIndex = new TableIndex();
        tableIndex.setTableName(tableName);
        tableIndex.setLastIndexed(null);

        tableIndexDao.create(tableIndex);
      } catch (SQLException e) {
        throw new GeoPackageException(
          "Failed to create Table Index for GeoPackage: "
          + geoPackage.getName() + ", Table Name: "
          + tableName + ", Column Name: " + columnName,
          e);
      }
    }

    return tableIndex;
  }

  /**
   * Get the table index
   *
   * @return table index
   */
  public TableIndex getTableIndex() {

    TableIndex tableIndex = null;
    try {
      if (tableIndexDao.isTableExists()) {
        tableIndex = tableIndexDao.queryForId(tableName);
      }
    } catch (SQLException e) {
      throw new GeoPackageException(
        "Failed to query for Table Index for GeoPackage: "
        + geoPackage.getName() + ", Table Name: "
        + tableName + ", Column Name: " + columnName,
        e);
    }
    return tableIndex;
  }

  /**
   * Get the date last indexed
   *
   * @return last indexed date or null
   */
  public Date getLastIndexed() {
    Date lastIndexed = null;
    TableIndex tableIndex = getTableIndex();
    if (tableIndex != null) {
      lastIndexed = tableIndex.getLastIndexed();
    }
    return lastIndexed;
  }

  /**
   * Clear the Geometry Indices, or create the table if needed
   */
  private void createOrClearGeometryIndices() {

    if (!createGeometryIndexTable()) {
      clearGeometryIndices();
    }

  }

  /**
   * Clear the Geometry Indices for the table name
   *
   * @return number of rows deleted
   */
  private int clearGeometryIndices() {
    int deleted = 0;
    DeleteBuilder<GeometryIndex, GeometryIndexKey> db = geometryIndexDao
      .deleteBuilder();
    try {
      db.where().eq(GeometryIndex.COLUMN_TABLE_NAME, tableName);
      PreparedDelete<GeometryIndex> deleteQuery = db.prepare();
      deleted = geometryIndexDao.delete(deleteQuery);
    } catch (SQLException e) {
      throw new GeoPackageException(
        "Failed to clear Geometry Index rows for GeoPackage: "
        + geoPackage.getName() + ", Table Name: "
        + tableName + ", Column Name: " + columnName,
        e);
    }

    return deleted;
  }

  /**
   * Get or create if needed the extension
   *
   * @return extensions object
   */
  private Extensions getOrCreateExtension() {
    return getOrCreate(EXTENSION_NAME, tableName, columnName,
      EXTENSION_DEFINITION, ExtensionScopeType.READ_WRITE);
  }

  /**
   * Get the extension
   *
   * @return extensions object or null if one does not exist
   */
  public Extensions getExtension() {
    return get(EXTENSION_NAME, tableName, columnName);
  }

  /**
   * Get a Table Index DAO
   *
   * @return table index dao
   * @since 4.0.0
   */
  public TableIndexDao getTableIndexDao() {
    return getTableIndexDao(geoPackage);
  }

  /**
   * Get a Table Index DAO
   *
   * @param geoPackage
   *            GeoPackage
   * @return table index dao
   * @since 4.0.0
   */
  public static TableIndexDao getTableIndexDao(GeoPackageCore geoPackage) {
    return TableIndexDao.create(geoPackage);
  }

  /**
   * Get a Table Index DAO
   *
   * @param db
   *            database connection
   * @return table index dao
   * @since 4.0.0
   */
  public static TableIndexDao getTableIndexDao(GeoPackageCoreConnection db) {
    return TableIndexDao.create(db);
  }

  /**
   * Create the Table Index Table if it does not exist
   *
   * @return true if created
   * @since 4.0.0
   */
  public boolean createTableIndexTable() {
    verifyWritable();

    boolean created = false;

    try {
      if (!tableIndexDao.isTableExists()) {
        GeometryIndexTableCreator tableCreator = new GeometryIndexTableCreator(
          geoPackage);
        created = tableCreator.createTableIndex() > 0;
      }
    } catch (SQLException e) {
      throw new GeoPackageException(
        "Failed to check if " + TableIndex.class.getSimpleName()
        + " table exists and create it",
        e);
    }
    return created;
  }

  /**
   * Get a Geometry Index DAO
   *
   * @return geometry index dao
   * @since 4.0.0
   */
  public GeometryIndexDao getGeometryIndexDao() {
    return getGeometryIndexDao(geoPackage);
  }

  /**
   * Get a Geometry Index DAO
   *
   * @param geoPackage
   *            GeoPackage
   * @return geometry index dao
   * @since 4.0.0
   */
  public static GeometryIndexDao getGeometryIndexDao(
    GeoPackageCore geoPackage) {
    return GeometryIndexDao.create(geoPackage);
  }

  /**
   * Get a Geometry Index DAO
   *
   * @param db
   *            database connection
   * @return geometry index dao
   * @since 4.0.0
   */
  public static GeometryIndexDao getGeometryIndexDao(
    GeoPackageCoreConnection db) {
    return GeometryIndexDao.create(db);
  }

  /**
   * Create Geometry Index Table if it does not exist and index it
   *
   * @return true if created
   * @since 4.0.0
   */
  public boolean createGeometryIndexTable() {
    verifyWritable();

    boolean created = false;

    try {
      if (!geometryIndexDao.isTableExists()) {
        GeometryIndexTableCreator tableCreator = new GeometryIndexTableCreator(
          geoPackage);
        created = tableCreator.createGeometryIndex() > 0;
      }
    } catch (SQLException e) {
      throw new GeoPackageException(
        "Failed to check if " + GeometryIndex.class.getSimpleName()
        + " table exists and create it",
        e);
    }
    return created;
  }

  /**
   * Index the Geometry Index Table if needed
   *
   * @return true if indexed
   * @since 4.0.0
   */
  public boolean indexGeometryIndexTable() {
    verifyWritable();

    boolean indexed = false;

    try {
      if (geometryIndexDao.isTableExists()) {
        GeometryIndexTableCreator tableCreator = new GeometryIndexTableCreator(
          geoPackage);
        indexed = tableCreator.indexGeometryIndex() > 0;
      }
    } catch (SQLException e) {
      throw new GeoPackageException(
        "Failed to check if " + GeometryIndex.class.getSimpleName()
        + " table exists to index",
        e);
    }
    return indexed;
  }

  /**
   * Un-index the Geometry Index Table if needed
   *
   * @return true if unindexed
   * @since 4.0.0
   */
  public boolean unindexGeometryIndexTable() {
    verifyWritable();

    boolean unindexed = false;

    try {
      if (geometryIndexDao.isTableExists()) {
        GeometryIndexTableCreator tableCreator = new GeometryIndexTableCreator(
          geoPackage);
        unindexed = tableCreator.unindexGeometryIndex() > 0;
      }
    } catch (SQLException e) {
      throw new GeoPackageException(
        "Failed to check if " + GeometryIndex.class.getSimpleName()
        + " table exists to unindex",
        e);
    }
    return unindexed;
  }

  /**
   * Query for all Geometry Index objects
   *
   * @return geometry indices iterator
   */
  public CloseableIterator<GeometryIndex> query() {

    CloseableIterator<GeometryIndex> geometryIndices = null;

    QueryBuilder<GeometryIndex, GeometryIndexKey> qb = queryBuilder();

    try {
      geometryIndices = qb.iterator();
    } catch (SQLException e) {
      throw new GeoPackageException(
        "Failed to query for all Geometry Indices. GeoPackage: "
        + geoPackage.getName() + ", Table Name: "
        + tableName + ", Column Name: " + columnName,
        e);
    }

    return geometryIndices;
  }

  /**
   * Query SQL for all row ids
   *
   * @return SQL
   * @since 3.4.0
   */
  public String queryIdsSQL() {
    return queryIdsSQL(queryBuilder());
  }

  /**
   * Query for all Geometry Index count
   *
   * @return count
   */
  public long count() {
    long count = 0;

    QueryBuilder<GeometryIndex, GeometryIndexKey> qb = queryBuilder();
    try {
      count = qb.countOf();
    } catch (SQLException e) {
      throw new GeoPackageException(
        "Failed to query for Geometry Index count. GeoPackage: "
        + geoPackage.getName() + ", Table Name: "
        + tableName + ", Column Name: " + columnName,
        e);
    }

    return count;
  }

  /**
   * Query for the bounds of the feature table index
   *
   * @return bounding box
   * @since 3.1.0
   */
  public BoundingBox getBoundingBox() {

    GenericRawResults<Object[]> results = null;
    Object[] values = null;
    try {
      results = geometryIndexDao.queryRaw(
        "SELECT MIN(" + GeometryIndex.COLUMN_MIN_X + "), MIN("
        + GeometryIndex.COLUMN_MIN_Y + "), MAX("
        + GeometryIndex.COLUMN_MAX_X + "), MAX("
        + GeometryIndex.COLUMN_MAX_Y + ") FROM "
        + GeometryIndex.TABLE_NAME + " WHERE "
        + GeometryIndex.COLUMN_TABLE_NAME + " = ?",
        new DataType[] { DataType.DOUBLE, DataType.DOUBLE,
        DataType.DOUBLE, DataType.DOUBLE },
      tableName);
      values = results.getFirstResult();
    } catch (SQLException e) {
      throw new GeoPackageException(
        "Failed to query for indexed feature bounds: " + tableName,
        e);
    } finally {
      if (results != null) {
        try {
          results.close();
        } catch (Exception e) {
          logger.log(Level.WARNING,
            "Failed to close bounds query results", e);
        }
      }
    }

    BoundingBox boundingBox = new BoundingBox((double) values[0],
      (double) values[1], (double) values[2], (double) values[3]);

    return boundingBox;
  }

  /**
   * Query for the feature index bounds and return in the provided projection
   *
   * @param projection
   *            desired projection
   * @return bounding box
   * @since 3.1.0
   */
  public BoundingBox getBoundingBox(Projection projection) {
    BoundingBox boundingBox = getBoundingBox();
    if (boundingBox != null && projection != null) {
      GeometryTransform projectionTransform = GeometryTransform
        .create(getProjection(), projection);
      boundingBox = boundingBox.transform(projectionTransform);
    }
    return boundingBox;
  }

  /**
   * Build a query builder to query for all Geometry Index objects
   *
   * @return query builder
   */
  public QueryBuilder<GeometryIndex, GeometryIndexKey> queryBuilder() {

    QueryBuilder<GeometryIndex, GeometryIndexKey> qb = geometryIndexDao
      .queryBuilder();

    try {
      qb.where().eq(GeometryIndex.COLUMN_TABLE_NAME, tableName);
    } catch (SQLException e) {
      throw new GeoPackageException(
        "Failed to build query for all Geometry Indices. GeoPackage: "
        + geoPackage.getName() + ", Table Name: "
        + tableName + ", Column Name: " + columnName,
        e);
    }

    return qb;
  }

  /**
   * Query for Geometry Index objects within the bounding box, projected
   * correctly
   *
   * @param boundingBox
   *            bounding box
   * @return geometry indices iterator
   */
  public CloseableIterator<GeometryIndex> query(BoundingBox boundingBox) {
    GeometryEnvelope envelope = boundingBox.buildEnvelope();
    CloseableIterator<GeometryIndex> geometryIndices = query(envelope);
    return geometryIndices;
  }

  /**
   * Query for Geometry Index objects within the bounding box, projected
   * correctly
   *
   * @param boundingBox
   *            bounding box
   * @param projection
   *            projection of the provided bounding box
   * @return geometry indices iterator
   */
  public CloseableIterator<GeometryIndex> query(BoundingBox boundingBox,
    Projection projection) {

    BoundingBox featureBoundingBox = projectBoundingBox(boundingBox,
      projection);

    CloseableIterator<GeometryIndex> geometryIndices = query(
      featureBoundingBox);

    return geometryIndices;
  }

  /**
   * Query for Geometry Index count within the bounding box, projected
   * correctly
   *
   * @param boundingBox
   *            bounding box
   * @return count
   */
  public long count(BoundingBox boundingBox) {
    GeometryEnvelope envelope = boundingBox.buildEnvelope();
    long count = count(envelope);
    return count;
  }

  /**
   * Query for Geometry Index count within the bounding box, projected
   * correctly
   *
   * @param boundingBox
   *            bounding box
   * @param projection
   *            projection of the provided bounding box
   * @return count
   */
  public long count(BoundingBox boundingBox, Projection projection) {

    BoundingBox featureBoundingBox = projectBoundingBox(boundingBox,
      projection);

    long count = count(featureBoundingBox);

    return count;
  }

  /**
   * Query for Geometry Index objects within the Geometry Envelope
   *
   * @param envelope
   *            geometry envelope
   * @return geometry indices iterator
   */
  public CloseableIterator<GeometryIndex> query(GeometryEnvelope envelope) {

    CloseableIterator<GeometryIndex> geometryIndices = null;

    QueryBuilder<GeometryIndex, GeometryIndexKey> qb = queryBuilder(
      envelope);
    try {
      geometryIndices = qb.iterator();
    } catch (SQLException e) {
      throw new GeoPackageException(
        "Failed to query for Geometry Indices. GeoPackage: "
        + geoPackage.getName() + ", Table Name: "
        + tableName + ", Column Name: " + columnName,
        e);
    }

    return geometryIndices;
  }

  /**
   * Query SQL for all row ids
   *
   * @param envelope
   *            geometry envelope
   * @return SQL
   * @since 3.4.0
   */
  public String queryIdsSQL(GeometryEnvelope envelope) {
    return queryIdsSQL(queryBuilder(envelope));
  }

  /**
   * Query for Geometry Index count within the Geometry Envelope
   *
   * @param envelope
   *            geometry envelope
   * @return count
   */
  public long count(GeometryEnvelope envelope) {
    long count = 0;

    QueryBuilder<GeometryIndex, GeometryIndexKey> qb = queryBuilder(
      envelope);
    try {
      count = qb.countOf();
    } catch (SQLException e) {
      throw new GeoPackageException(
        "Failed to query for Geometry Index count. GeoPackage: "
        + geoPackage.getName() + ", Table Name: "
        + tableName + ", Column Name: " + columnName,
        e);
    }

    return count;
  }

  /**
   * Build a query builder to query for Geometry Index objects within the
   * Geometry Envelope
   *
   * @param envelope
   *            geometry envelope
   * @return query builder
   */
  public QueryBuilder<GeometryIndex, GeometryIndexKey> queryBuilder(
    GeometryEnvelope envelope) {

    QueryBuilder<GeometryIndex, GeometryIndexKey> qb = geometryIndexDao
      .queryBuilder();
    try {

      double minX = envelope.getMinX() - tolerance;
      double maxX = envelope.getMaxX() + tolerance;
      double minY = envelope.getMinY() - tolerance;
      double maxY = envelope.getMaxY() + tolerance;

      Where<GeometryIndex, GeometryIndexKey> where = qb.where();
      where.eq(GeometryIndex.COLUMN_TABLE_NAME, tableName).and()
        .le(GeometryIndex.COLUMN_MIN_X, maxX).and()
        .ge(GeometryIndex.COLUMN_MAX_X, minX).and()
        .le(GeometryIndex.COLUMN_MIN_Y, maxY).and()
        .ge(GeometryIndex.COLUMN_MAX_Y, minY);

      if (envelope.hasZ()) {
        double minZ = envelope.getMinZ() - tolerance;
        double maxZ = envelope.getMaxZ() + tolerance;
        where.and().le(GeometryIndex.COLUMN_MIN_Z, maxZ).and()
          .ge(GeometryIndex.COLUMN_MAX_Z, minZ);
      }

      if (envelope.hasM()) {
        double minM = envelope.getMinM() - tolerance;
        double maxM = envelope.getMaxM() + tolerance;
        where.and().le(GeometryIndex.COLUMN_MIN_M, maxM).and()
          .ge(GeometryIndex.COLUMN_MAX_M, minM);
      }

    } catch (SQLException e) {
      throw new GeoPackageException(
        "Failed to build query for Geometry Indices. GeoPackage: "
        + geoPackage.getName() + ", Table Name: "
        + tableName + ", Column Name: " + columnName,
        e);
    }

    return qb;
  }

  /**
   * Project the provided bounding box in the declared projection to the user
   * DAO projection
   *
   * @param boundingBox
   *            bounding box
   * @param projection
   *            projection
   * @return projected bounding box
   * @since 6.2.0
   */
  public BoundingBox projectBoundingBox(BoundingBox boundingBox,
    Projection projection) {
    GeometryTransform projectionTransform = GeometryTransform
      .create(projection, getProjection());
    BoundingBox projectedBoundingBox = boundingBox
      .transform(projectionTransform);
    return projectedBoundingBox;
  }

  /**
   * Build SQL for selecting ids from the query builder
   *
   * @param qb
   *            query builder
   * @return SQL
   */
  private String queryIdsSQL(
    QueryBuilder<GeometryIndex, GeometryIndexKey> qb) {
    qb.selectRaw(GeometryIndex.COLUMN_GEOM_ID);
    return prepareStatementString(qb);
  }

  /**
   * Prepare a statement string from a query builder
   *
   * @param qb
   *            query builder
   * @return statement
   */
  private String prepareStatementString(
    QueryBuilder<GeometryIndex, GeometryIndexKey> qb) {
    String sql = null;
    try {
      sql = qb.prepareStatementString();
    } catch (SQLException e) {
      throw new GeoPackageException(
        "Failed to prepare statement from query builder", e);
    }
    return sql;
  }
}
