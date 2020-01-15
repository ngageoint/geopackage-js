/**
 * Feature Table Index
 * @module extension/index
 */
import { RTreeIndex } from '../rtree/rtreeIndex';
import { BaseExtension } from '../baseExtension';
import { GeoPackage } from '../../geoPackage';
import { Extension } from '../extension';
import { TableIndex } from './tableIndex';
import { FeatureDao } from '../../features/user/featureDao';
import { GeometryIndexDao } from './geometryIndexDao';
import { RTreeIndexDao } from '../rtree/rtreeIndexDao';
import { EnvelopeBuilder } from '../../geom/envelopeBuilder';
import { TableIndexDao } from './tableIndexDao';
import { GeometryData, BoundingBox } from '../../..';
import { Envelope } from '../../geom/envelope';
import { FeatureRow } from '../../features/user/featureRow';

/**
 * This class will either use the RTree index if it exists, or the
 * Feature Table Index NGA Extension implementation. This extension is used to
 * index Geometries within a feature table by their minimum bounding box for
 * bounding box queries.
 * @class
 * @extends BaseExtension
 */
export class FeatureTableIndex extends BaseExtension {
  public static readonly EXTENSION_GEOMETRY_INDEX_AUTHOR: string = 'nga';
  public static readonly EXTENSION_GEOMETRY_INDEX_NAME_NO_AUTHOR: string = 'geometry_index';
  public static readonly EXTENSION_GEOMETRY_INDEX_DEFINITION: string =
    'http://ngageoint.github.io/GeoPackage/docs/extensions/geometry-index.html';
  progress: Function;
  featureDao: FeatureDao<FeatureRow>;
  tableName: string;
  columnName: string;
  tableIndexDao: TableIndexDao;
  geometryIndexDao: GeometryIndexDao;
  rtreeIndexDao: RTreeIndexDao;
  rtreeIndex: RTreeIndex;
  rtreeIndexed: boolean;
  constructor(geoPackage: GeoPackage, featureDao: FeatureDao<FeatureRow>) {
    super(geoPackage);
    this.progress;
    /**
     * Feature Dao to index
     * @type {module:features/user/featureDao~FeatureDao}
     */
    this.featureDao = featureDao;
    this.extensionName = Extension.buildExtensionName(
      FeatureTableIndex.EXTENSION_GEOMETRY_INDEX_AUTHOR,
      FeatureTableIndex.EXTENSION_GEOMETRY_INDEX_NAME_NO_AUTHOR,
    );
    this.extensionDefinition = FeatureTableIndex.EXTENSION_GEOMETRY_INDEX_DEFINITION;
    this.tableName = featureDao.table_name;
    this.columnName = featureDao.getGeometryColumnName();
    this.tableIndexDao = geoPackage.getTableIndexDao();
    this.geometryIndexDao = geoPackage.getGeometryIndexDao(featureDao);
    this.rtreeIndexDao = new RTreeIndexDao(geoPackage, featureDao);
    this.rtreeIndexDao.gpkgTableName = 'rtree_' + this.tableName + '_' + this.columnName;
    this.rtreeIndex = new RTreeIndex(geoPackage, featureDao);
    /**
     * true if the table is indexed with an RTree
     * @type {Boolean}
     */
    this.rtreeIndexed = this.hasExtension('gpkg_rtree_index', this.tableName, this.columnName);
  }
  /**
   * Index the table if not already indexed
   * @param  {Function} progress function which is called with progress while indexing
   * @return {Promise<Boolean>} promise resolved when the indexing is complete
   */
  async index(progress?: Function): Promise<boolean> {
    return this.indexWithForce(false, progress);
  }
  /**
   * Index the table if not already indexed or force is true
   * @param  {Boolean} force force index even if the table is already indexed
   * @param  {Function} progress function which is called with progress while indexing
   * @return {Promise<Boolean>} promise resolved when the indexing is complete
   */
  async indexWithForce(force?: false, progress?: Function): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    progress = progress || function(): void {};
    this.progress = function(message: any): void {
      setTimeout(progress, 0, message);
    };
    const indexed = this.isIndexed();
    if (force || !indexed) {
      await this.getOrCreateExtension();
      const tableIndex = await this.getOrCreateTableIndex();
      await this.createOrClearGeometryIndicies();
      return this.indexTable(tableIndex);
    } else {
      return indexed;
    }
  }
  /**
   * Check if the table is indexed either with an RTree or the NGA Feature Table Index
   * @return {Boolean}
   */
  isIndexed(): boolean {
    if (this.rtreeIndexed) return true;
    try {
      const result = this.getFeatureTableIndexExtension();
      if (result) {
        const contentsDao = this.geoPackage.getContentsDao();
        const contents = contentsDao.queryForId(this.tableName);
        if (!contents) return false;
        const lastChange = new Date(contents.last_change);
        const tableIndex: TableIndex = this.tableIndexDao.queryForId(this.tableName);
        if (!tableIndex || !tableIndex.last_indexed) {
          return false;
        }
        const lastIndexed = new Date(tableIndex.last_indexed);
        return lastIndexed >= lastChange;
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  }

  /**
   * Returns the feature table index extension for this table and column name if exists
   * @return {module:extension~Extension}
   */
  getFeatureTableIndexExtension(): Extension {
    return this.getExtension(this.extensionName, this.tableName, this.columnName)[0];
  }
  /**
   * Get or create the extension for this table name and column name
   * @return {module:extension~Extension}
   */
  async getOrCreateExtension(): Promise<Extension> {
    return this.getOrCreate(
      this.extensionName,
      this.tableName,
      this.columnName,
      this.extensionDefinition,
      Extension.READ_WRITE,
    );
  }
  /**
   * Get or create if needed the table index
   * @return {Promise<TableIndex>}
   */
  async getOrCreateTableIndex(): Promise<TableIndex> {
    const tableIndex = this.getTableIndex();
    if (tableIndex) return tableIndex;
    await this.tableIndexDao.createTable();
    this.createTableIndex();
    return this.getTableIndex();
  }
  /**
   * Create the table index
   * @return {module:extension/index~TableIndex}
   */
  createTableIndex(): number {
    const ti = new TableIndex();
    ti.table_name = this.tableName;
    ti.last_indexed = new Date();
    return this.tableIndexDao.create(ti);
  }
  /**
   * Get the table index
   * @return {module:extension/index~TableIndex}
   */
  getTableIndex(): TableIndex {
    if (this.tableIndexDao.isTableExists()) {
      return this.tableIndexDao.queryForId(this.tableName);
    } else {
      return;
    }
  }
  /**
   * Clear the geometry indices or create the table if needed
   * @return {Promise} resolved when complete
   */
  async createOrClearGeometryIndicies(): Promise<number> {
    await this.geometryIndexDao.createTable();
    return this.clearGeometryIndicies();
  }
  /**
   * Clears the geometry indices
   * @return {Number} number of rows deleted
   */
  clearGeometryIndicies(): number {
    const where = this.geometryIndexDao.buildWhereWithFieldAndValue(GeometryIndexDao.COLUMN_TABLE_NAME, this.tableName);
    const whereArgs = this.geometryIndexDao.buildWhereArgs(this.tableName);
    return this.geometryIndexDao.deleteWhere(where, whereArgs);
  }
  /**
   * Indexes the table
   * @param  {module:extension/index~TableIndex} tableIndex TableIndex
   * @return {Promise} resolved when complete
   */
  async indexTable(tableIndex: TableIndex): Promise<boolean> {
    return new Promise((resolve: Function, reject: Function) => {
      setTimeout(() => {
        this.indexChunk(0, tableIndex, resolve, reject);
      });
    }).then(() => {
      return this.updateLastIndexed(tableIndex).changes === 1;
    });
  }
  /**
   * Indexes a chunk of 100 rows
   * @param  {Number} page       page to start on
   * @param  {module:extension/index~TableIndex} tableIndex TableIndex
   * @param  {Function} resolve    function to call when all chunks are indexed
   * @param  {Function} reject     called if there is an error
   */
  indexChunk(page: number, tableIndex: TableIndex, resolve: Function, reject: Function): void {
    const rows = this.featureDao.queryForChunk(100, page);
    if (rows.length) {
      this.progress('Indexing ' + page * 100 + ' to ' + (page + 1) * 100);
      console.log('Indexing ' + page * 100 + ' to ' + (page + 1) * 100);
      rows.forEach(row => {
        const fr = this.featureDao.getRow(row) as FeatureRow;
        this.indexRow(tableIndex, fr.getId(), fr.getGeometry());
      });
      setTimeout(() => {
        this.indexChunk(++page, tableIndex, resolve, reject);
      });
    } else {
      resolve();
    }
  }
  /**
   * Indexes a row
   * @param  {ableIndex} tableIndex TableIndex`
   * @param  {Number} geomId     id of the row
   * @param  {GeometryData} geomData   GeometryData to index
   * @return {Boolean} success
   */
  indexRow(tableIndex: TableIndex, geomId: number, geomData: GeometryData): boolean {
    if (!geomData) return false;
    let envelope = geomData.envelope;
    if (!envelope) {
      const geometry = geomData.geometry;
      if (geometry) {
        envelope = EnvelopeBuilder.buildEnvelopeWithGeometry(geometry);
      }
    }
    if (envelope) {
      const geometryIndex = this.geometryIndexDao.populate(tableIndex, geomId, envelope);
      return this.geometryIndexDao.createOrUpdate(geometryIndex);
    } else {
      return false;
    }
  }
  /**
   * Update the last time this feature table was indexed
   * @param  {module:extension/index~TableIndex} tableIndex TableIndex
   * @return {Object} update status
   */
  updateLastIndexed(tableIndex: TableIndex): any {
    if (!tableIndex) {
      tableIndex = new TableIndex();
      tableIndex.table_name = this.tableName;
    }
    tableIndex.last_indexed = new Date().toISOString();
    const updateIndex = this.tableIndexDao.createOrUpdate(tableIndex);
    return updateIndex;
  }
  /**
   * Query the index with the specified bounding box and projection
   * @param  {module:boundingBox~BoundingBox} boundingBox bounding box to query for
   * @param  {string} projection  projection the boundingBox is in
   * @return {IterableIterator}
   */
  queryWithBoundingBox(boundingBox: BoundingBox, projection: string): IterableIterator<any> {
    const projectedBoundingBox = boundingBox.projectBoundingBox(projection, this.featureDao.projection);
    const envelope = projectedBoundingBox.buildEnvelope();
    return this.queryWithGeometryEnvelope(envelope);
  }
  /**
   * Query witha geometry envelope
   * @param  {any} envelope envelope
   * @return {IterableIterator<any>}
   */
  queryWithGeometryEnvelope(envelope: Envelope): IterableIterator<any> {
    if (this.rtreeIndexed) {
      return this.rtreeIndexDao.queryWithGeometryEnvelope(envelope);
    } else {
      return this.geometryIndexDao.queryWithGeometryEnvelope(envelope);
    }
  }
  /**
   * Count the index with the specified bounding box and projection
   * @param  {module:boundingBox~BoundingBox} boundingBox bounding box to query for
   * @param  {string} projection  projection the boundingBox is in
   * @return {Number}
   */
  countWithBoundingBox(boundingBox: BoundingBox, projection: string): number {
    const projectedBoundingBox = boundingBox.projectBoundingBox(projection, this.featureDao.projection);
    const envelope = projectedBoundingBox.buildEnvelope();
    return this.countWithGeometryEnvelope(envelope);
  }
  /**
   * Count with a geometry envelope
   * @param  {any} envelope envelope
   * @return {Number}
   */
  countWithGeometryEnvelope(envelope: Envelope): number {
    if (this.rtreeIndexed) {
      return this.rtreeIndexDao.countWithGeometryEnvelope(envelope);
    } else {
      return this.geometryIndexDao.countWithGeometryEnvelope(envelope);
    }
  }
}
