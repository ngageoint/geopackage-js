/**
 * @module geoPackage
 */
import { GeoPackageConnection } from './db/geoPackageConnection';
import { CrsWktExtension } from './extension/crsWkt';
import { RelatedTablesExtension } from './extension/relatedTables';
import { FeatureStyleExtension } from './extension/style/.';
import { ContentsIdExtension } from './extension/contents/.';
import { SpatialReferenceSystemDao } from './core/srs/spatialReferenceSystemDao';
import { GeometryColumnsDao } from './features/columns/geometryColumnsDao';
import { FeatureDao } from './features/user/featureDao';
import { FeatureTableReader } from './features/user/featureTableReader';
import { ContentsDao } from './core/contents/contentsDao';
import { TileMatrixSetDao } from './tiles/matrixset/tileMatrixSetDao';
import { TileMatrixDao } from './tiles/matrix/tileMatrixDao';
import { DataColumnsDao } from './dataColumns/dataColumnsDao';
import { DataColumnConstraintsDao } from './dataColumnConstraints/dataColumnConstraintsDao';
import { MetadataDao } from './metadata/metadataDao';
import { MetadataReferenceDao } from './metadata/reference/metadataReferenceDao';
import { ExtensionDao } from './extension/extensionDao';
import { TableIndexDao } from './extension/index/tableIndexDao';
import { GeometryIndexDao } from './extension/index/geometryIndexDao';
import { ExtendedRelationDao } from './extension/relatedTables/extendedRelationDao';
import { AttributeDao } from './attributes/attributeDao';
import { TileDao } from './tiles/user/tileDao';
import { ContentsIdDao } from './extension/contents/contentsIdDao';
import { AttributeTable } from './attributes/attributeTable';
import { TileTableReader } from './tiles/user/tileTableReader';
import { AttributeTableReader } from './attributes/attributeTableReader';
import { FeatureTable } from './features/user/featureTable';
import { StyleMappingTable } from './extension/style/styleMappingTable';
import { TileTable } from './tiles/user/tileTable';
import { Contents } from './core/contents/contents';
import { DataTypes } from './db/dataTypes';
import { SchemaExtension } from './extension/schema';
import { GeometryColumns } from './features/columns/geometryColumns';
import { TableCreator } from './db/tableCreator';
import { TileMatrix } from './tiles/matrix/tileMatrix';
import { TileBoundingBoxUtils } from './tiles/tileBoundingBoxUtils';
import { BoundingBox } from './boundingBox';
import { TileMatrixSet } from './tiles/matrixset/tileMatrixSet';

import proj4 from 'proj4';
import { UserColumn } from './user/userColumn';
import { DataColumns } from './dataColumns/dataColumns';
import { AttributeRow } from './attributes/attributeRow';
import { SpatialReferenceSystem } from './core/srs/spatialReferenceSystem';
import * as defs from './proj4Defs';
import { Feature } from 'geojson';
import { FeatureRow } from './features/user/featureRow';
for (const def in defs) {
  if (defs[def]) {
    proj4.defs(def, defs[def]);
  }
}

/**
 * A `GeoPackage` instance is the interface to a physical GeoPackage SQLite
 * database.
 */
export class GeoPackage {
  /** name of the GeoPackage */
  name: string;
  /** path to the GeoPackage */
  path: string;
  connection: GeoPackageConnection;
  tableCreator: TableCreator;
  private _spatialReferenceSystemDao: SpatialReferenceSystemDao;
  private _contentsDao: ContentsDao;
  private _tileMatrixSetDao: TileMatrixSetDao;
  private _tileMatrixDao: TileMatrixDao;
  private _dataColumnsDao: DataColumnsDao;
  private _extensionDao: ExtensionDao;
  private _tableIndexDao: TableIndexDao;
  private _geometryColumnsDao: GeometryColumnsDao;
  private _dataColumnConstraintsDao: DataColumnConstraintsDao;
  private _metadataReferenceDao: MetadataReferenceDao;
  private _metadataDao: MetadataDao;
  private _extendedRelationDao: ExtendedRelationDao;
  private _contentsIdDao: ContentsIdDao;
  private _contentsIdExtension: ContentsIdExtension;
  private _featureStyleExtension: FeatureStyleExtension;
  private _relatedTablesExtension: RelatedTablesExtension;

  /**
   * Construct a new GeoPackage object
   * @param name name to give to this GeoPackage
   * @param path path to the GeoPackage
   * @param connection database connection to the GeoPackage
   */
  constructor(name: string, path: string, connection: GeoPackageConnection) {
    this.name = name;
    this.path = path;
    this.connection = connection;
    this.tableCreator = new TableCreator(this);
  }
  close(): void {
    this.connection.close();
  }
  get database(): GeoPackageConnection {
    return this.connection;
  }
  async export(): Promise<any> {
    return this.connection.export();
  }
  /**
   * @returns {module:core/srs~SpatialReferenceSystemDao} the DAO to access the [SRS table]{@link module:core/srs~SpatialReferenceSystem} in this `GeoPackage`
   */
  get spatialReferenceSystemDao(): SpatialReferenceSystemDao {
    return this._spatialReferenceSystemDao || (this._spatialReferenceSystemDao = new SpatialReferenceSystemDao(this));
  }
  /**
   * @returns {module:core/contents~ContentsDao} the DAO to access the [contents table]{@link module:core/contents~Contents} in this `GeoPackage`
   */
  get contentsDao(): ContentsDao {
    return this._contentsDao || (this._contentsDao = new ContentsDao(this));
  }
  /**
   * @returns {module:tiles/matrixset~TileMatrixSetDao} the DAO to access the [tile matrix set]{@link module:tiles/matrixset~TileMatrixSet} in this `GeoPackage`
   */
  get tileMatrixSetDao(): TileMatrixSetDao {
    return this._tileMatrixSetDao || (this._tileMatrixSetDao = new TileMatrixSetDao(this));
  }
  /**
   * @returns {module:tiles/matrixset~TileMatrixDao} the DAO to access the [tile matrix]{@link module:tiles/matrixset~TileMatrix} in this `GeoPackage`
   */
  get tileMatrixDao(): TileMatrixDao {
    return this._tileMatrixDao || (this._tileMatrixDao = new TileMatrixDao(this));
  }
  get dataColumnsDao(): DataColumnsDao {
    return this._dataColumnsDao || (this._dataColumnsDao = new DataColumnsDao(this));
  }
  get extensionDao(): ExtensionDao {
    return this._extensionDao || (this._extensionDao = new ExtensionDao(this));
  }
  get tableIndexDao(): TableIndexDao {
    return this._tableIndexDao || (this._tableIndexDao = new TableIndexDao(this));
  }
  get geometryColumnsDao(): GeometryColumnsDao {
    return this._geometryColumnsDao || (this._geometryColumnsDao = new GeometryColumnsDao(this));
  }
  get dataColumnConstraintsDao(): DataColumnConstraintsDao {
    return this._dataColumnConstraintsDao || (this._dataColumnConstraintsDao = new DataColumnConstraintsDao(this));
  }
  get metadataReferenceDao(): MetadataReferenceDao {
    return this._metadataReferenceDao || (this._metadataReferenceDao = new MetadataReferenceDao(this));
  }
  get metadataDao(): MetadataDao {
    return this._metadataDao || (this._metadataDao = new MetadataDao(this));
  }
  get extendedRelationDao(): ExtendedRelationDao {
    return this._extendedRelationDao || (this._extendedRelationDao = new ExtendedRelationDao(this));
  }
  get contentsIdDao(): ContentsIdDao {
    return this._contentsIdDao || (this._contentsIdDao = new ContentsIdDao(this));
  }
  get contentsIdExtension(): ContentsIdExtension {
    return this._contentsIdExtension || (this._contentsIdExtension = new ContentsIdExtension(this));
  }
  get featureStyleExtension(): FeatureStyleExtension {
    return this._featureStyleExtension || (this._featureStyleExtension = new FeatureStyleExtension(this));
  }
  getGeometryIndexDao(featureDao: FeatureDao<FeatureRow>): GeometryIndexDao {
    return new GeometryIndexDao(this, featureDao);
  }
  get relatedTablesExtension(): RelatedTablesExtension {
    return this._relatedTablesExtension || (this._relatedTablesExtension = new RelatedTablesExtension(this));
  }
  getSrs(srsId: number): SpatialReferenceSystem {
    const dao = this.spatialReferenceSystemDao;
    return dao.queryForId(srsId);
  }
  async createRequiredTables(): Promise<GeoPackage> {
    await this.tableCreator.createRequired();
    return this;
  }
  createSupportedExtensions(): GeoPackage {
    const crs = new CrsWktExtension(this);
    crs.getOrCreateExtension();
    const schema = new SchemaExtension(this);
    schema.getOrCreateExtension();
    return this;
  }
  /**
   * @returns {module:tiles/user/tileDao~TileDao} the `TileDao` to access [tiles]{@link module:tiles/user/tileTable}
   */
  getTileDaoWithTileMatrixSet(tileMatrixSet: TileMatrixSet): TileDao {
    const tileMatrices = [];
    const tileMatrixDao = this.tileMatrixDao;
    const results = tileMatrixDao.queryForAllEq(
      TileMatrixDao.COLUMN_TABLE_NAME,
      tileMatrixSet.table_name,
      null,
      null,
      TileMatrixDao.COLUMN_ZOOM_LEVEL +
        ' ASC, ' +
        TileMatrixDao.COLUMN_PIXEL_X_SIZE +
        ' DESC, ' +
        TileMatrixDao.COLUMN_PIXEL_Y_SIZE +
        ' DESC',
    );
    results.forEach(function(result) {
      const tm = new TileMatrix();
      tileMatrixDao.populateObjectFromResult(tm, result);
      tileMatrices.push(tm);
    });
    const tableReader = new TileTableReader(tileMatrixSet);
    const tileTable = tableReader.readTileTable(this);
    return new TileDao(this, tileTable, tileMatrixSet, tileMatrices);
  }
  getTileDaoWithContents(contents: Contents): TileDao {
    const tileMatrixSet = this.contentsDao.getTileMatrixSet(contents);
    return this.getTileDaoWithTileMatrixSet(tileMatrixSet);
  }
  getTileDao(tableName: string): TileDao {
    const tms = this.tileMatrixSetDao;
    const results = tms.queryForAllEq(TileMatrixSetDao.COLUMN_TABLE_NAME, tableName);
    if (results.length > 1) {
      throw new Error(
        'Unexpected state. More than one Tile Matrix Set matched for table name: ' +
          tableName +
          ', count: ' +
          results.length,
      );
    } else if (results.length === 0) {
      throw new Error('No Tile Matrix found for table name: ' + tableName);
    }
    const tileMatrixSet = new TileMatrixSet();
    tms.populateObjectFromResult(tileMatrixSet, results[0]);
    return this.getTileDaoWithTileMatrixSet(tileMatrixSet);
  }
  /**
   * Return a hash containing arrays of table names grouped under keys `features`,
   * `tiles`, and `attributes`.
   * @return {{features: string[], tiles: string[], attributes: string[]}}
   */
  getTables(): { features: string[]; tiles: string[]; attributes: string[] } {
    const tables = {
      features: this.getFeatureTables(),
      tiles: this.getTileTables(),
      attributes: this.getAttributesTables(),
    };
    return tables;
  }
  getAttributesTables(): string[] {
    return this.contentsDao.getTables(ContentsDao.GPKG_CDT_ATTRIBUTES_NAME);
  }
  hasAttributeTable(attributeTableName: string): boolean {
    const tables = this.getAttributesTables();
    return tables && tables.indexOf(attributeTableName) != -1;
  }
  /**
   *  Get the tile tables
   *  @returns {String[]} tile table names
   */
  getTileTables(): string[] {
    const cd = this.contentsDao;
    if (!cd.isTableExists()) {
      return [];
    }
    return cd.getTables(ContentsDao.GPKG_CDT_TILES_NAME);
  }
  /**
   * Checks if the tile table exists in the GeoPackage
   * @param  {String} tileTableName name of the table to query for
   * @returns {Boolean} indicates the existence of the tile table
   */
  hasTileTable(tileTableName: string): boolean {
    const tables = this.getTileTables();
    return tables && tables.indexOf(tileTableName) !== -1;
  }
  /**
   * Checks if the feature table exists in the GeoPackage
   * @param  {String} featureTableName name of the table to query for
   * @returns {Boolean} indicates the existence of the feature table
   */
  hasFeatureTable(featureTableName: string): boolean {
    const tables = this.getFeatureTables();
    return tables && tables.indexOf(featureTableName) != -1;
  }
  /**
   *  Get the feature tables
   *  @returns {String[]} feature table names
   */
  getFeatureTables(): string[] {
    const cd = this.contentsDao;
    if (!cd.isTableExists()) {
      return [];
    }
    return cd.getTables(ContentsDao.GPKG_CDT_FEATURES_NAME);
  }
  isTable(tableName: string): boolean {
    return !!this.connection.tableExists(tableName);
  }
  isTableType(type: string, tableName: string): boolean {
    return type === this.getTableType(tableName);
  }
  getTableType(tableName: string): string {
    const contents = this.getTableContents(tableName);
    if (contents) {
      return contents.data_type;
    }
  }
  getTableContents(tableName: string): Contents {
    return this.contentsDao.queryForId(tableName);
  }
  deleteTable(tableName: string): boolean {
    return this.connection.dropTable(tableName);
  }
  getTableCreator(): TableCreator {
    return this.tableCreator;
  }
  async index(): Promise<boolean> {
    const tables = this.getFeatureTables();
    for (let i = 0; i < tables.length; i++) {
      if (!(await this.indexFeatureTable(tables[i]))) {
        throw new Error('Unable to index table ' + tables[i]);
      }
    }
    return true;
  }
  async indexFeatureTable(table: string, progress?: Function): Promise<boolean> {
    const featureDao = this.getFeatureDao(table);
    const fti = featureDao.featureTableIndex;
    const tableIndex = fti.getTableIndex();
    if (tableIndex) {
      return true;
    }
    return await fti.index(progress);
  }
  /**
   *  Get a Feature DAO from Geometry Columns
   *
   *  @param {GeometryColumns} geometryColumns Geometry Columns
   *  @returns {FeatureDao}
   */
  getFeatureDaoWithGeometryColumns(geometryColumns: GeometryColumns): FeatureDao<FeatureRow> {
    if (!geometryColumns) {
      throw new Error('Non null Geometry Columns is required to create Feature DAO');
    }
    const tableReader = new FeatureTableReader(geometryColumns);
    const featureTable = tableReader.readFeatureTable(this);
    const dao = new FeatureDao(this, featureTable, geometryColumns, this.metadataDao);
    return dao;
  }
  /**
   * Get a Feature DAO from Contents
   * @param  {Contents}   contents Contents
   *  @returns {FeatureDao}
   */
  getFeatureDaoWithContents(contents: Contents): FeatureDao<FeatureRow> {
    const columns = this.contentsDao.getGeometryColumns(contents);
    return this.getFeatureDaoWithGeometryColumns(columns);
  }
  /**
   * Get a Feature DAO from Contents
   * @param  {string}   tableName table name
   *  @returns {FeatureDao}
   */
  getFeatureDao(tableName: string): FeatureDao<FeatureRow> {
    const geometryColumns = this.geometryColumnsDao.queryForTableName(tableName);
    if (!geometryColumns) {
      throw new Error('No Feature Table exists for table name: ' + tableName);
    }
    return this.getFeatureDaoWithGeometryColumns(geometryColumns);
  }
  /**
   * Queries for GeoJSON features in a feature table
   * @param  {String}   tableName   Table name to query
   * @param  {BoundingBox}   boundingBox BoundingBox to query
   * @returns {Object[]} array of GeoJSON features
   */
  queryForGeoJSONFeaturesInTable(tableName: string, boundingBox: BoundingBox): Feature[] {
    const featureDao = this.getFeatureDao(tableName);
    const features = [];
    const iterator = featureDao.queryForGeoJSONIndexedFeaturesWithBoundingBox(boundingBox);
    for (const feature of iterator) {
      features.push(feature);
    }
    return features;
  }
  /**
   * iterates GeoJSON features in a feature table within a bounding box
   * @param  {String}   tableName   Table name to query
   * @param  {BoundingBox}   boundingBox BoundingBox to query
   * @returns {Iterable<Object>} iterable of GeoJSON features
   */
  iterateGeoJSONFeaturesInTableWithinBoundingBox(
    tableName: string,
    boundingBox: BoundingBox,
  ): IterableIterator<Feature> {
    const featureDao = this.getFeatureDao(tableName);
    return featureDao.queryForGeoJSONIndexedFeaturesWithBoundingBox(boundingBox);
  }
  /**
   * Create the Geometry Columns table if it does not already exist
   * @returns {Promise}
   */
  async createGeometryColumnsTable(): Promise<boolean> {
    if (this.geometryColumnsDao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createGeometryColumns();
  }
  /**
   * Get a Attribute DAO
   * @param  {string}   tableName table name
   * @returns {AttributeDao}
   */
  getAttributeDaoWithTableName(tableName: string): AttributeDao<AttributeRow> {
    const contents = this.contentsDao.queryForId(tableName);
    return this.getAttributeDaoWithContents(contents);
  }
  /**
   * Get a Attribute DAO
   * @param  {Contents}   contents Contents
   * @returns {AttributeDao}
   */
  getAttributeDaoWithContents(contents: Contents): AttributeDao<AttributeRow> {
    if (!contents) {
      throw new Error('Non null Contents is required to create an Attributes DAO');
    }
    const reader = new AttributeTableReader(contents.table_name);
    const table: AttributeTable = reader.readTable(this.connection) as AttributeTable;
    table.setContents(contents);
    return new AttributeDao(this, table);
  }
  async createAttributeTable(tableName: string, columns: UserColumn[], dataColumns?: DataColumns[]): Promise<boolean> {
    const attributeTable = new AttributeTable(tableName, columns);
    this.tableCreator.createUserTable(attributeTable);
    const contents = new Contents();
    contents.table_name = tableName;
    contents.data_type = ContentsDao.GPKG_CDT_ATTRIBUTES_NAME;
    contents.identifier = tableName;
    contents.last_change = new Date().toISOString();
    this.contentsDao.create(contents);
    if (dataColumns && dataColumns.length) {
      await this.createDataColumns();
      const dataColumnsDao = this.dataColumnsDao;
      dataColumns.forEach(function(dataColumn) {
        dataColumnsDao.create(dataColumn);
      });
    }
    return true;
  }
  /**
   * Create the given {@link module:features/user/featureTable~FeatureTable}
   * @param  {FeatureTable}   featureTable    feature table
   */
  createFeatureTable(featureTable: FeatureTable): { lastInsertRowid: number; changes: number } {
    return this.tableCreator.createUserTable(featureTable);
  }
  createFeatureTableWithGeometryColumns(
    geometryColumns: GeometryColumns,
    boundingBox: BoundingBox,
    srsId: number,
    columns?: UserColumn[],
  ): Promise<boolean> {
    return this.createFeatureTableWithGeometryColumnsAndDataColumns(
      geometryColumns,
      boundingBox,
      srsId,
      columns,
      undefined,
    );
  }
  async createFeatureTableWithGeometryColumnsAndDataColumns(
    geometryColumns: GeometryColumns,
    boundingBox: BoundingBox,
    srsId: number,
    columns?: UserColumn[],
    dataColumns?: DataColumns[],
  ): Promise<boolean> {
    await this.createGeometryColumnsTable();
    const featureTable = new FeatureTable(geometryColumns.table_name, columns);
    this.createFeatureTable(featureTable);
    const contents = new Contents();
    contents.table_name = geometryColumns.table_name;
    contents.data_type = ContentsDao.GPKG_CDT_FEATURES_NAME;
    contents.identifier = geometryColumns.table_name;
    contents.last_change = new Date().toISOString();
    contents.min_x = boundingBox.minLongitude;
    contents.min_y = boundingBox.minLatitude;
    contents.max_x = boundingBox.maxLongitude;
    contents.max_y = boundingBox.maxLatitude;
    contents.srs_id = srsId;
    this.contentsDao.create(contents);
    geometryColumns.srs_id = srsId;
    this.geometryColumnsDao.create(geometryColumns);
    if (dataColumns) {
      await this.createDataColumns();
      const dataColumnsDao = this.dataColumnsDao;
      dataColumns.forEach(function(dataColumn) {
        dataColumnsDao.create(dataColumn);
      });
    }
    return true;
  }
  /**
   * Create the Tile Matrix Set table if it does not already exist
   * @returns {Promise} resolves when the table is created
   */
  async createTileMatrixSetTable(): Promise<boolean> {
    if (this.tileMatrixSetDao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createTileMatrixSet();
  }
  /**
   * Create the Tile Matrix table if it does not already exist
   * @returns {Promise} resolves when the table is created
   */
  async createTileMatrixTable(): Promise<boolean> {
    if (this.tileMatrixDao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createTileMatrix();
  }
  /**
   * Create the given tile table in this GeoPackage.
   *
   * @param  {module:tiles/user/tileTable~TileTable} tileTable
   * @return {object} the result of {@link module:db/geoPackageConnection~GeoPackageConnection#run}
   */
  createTileTable(tileTable: TileTable): { lastInsertRowid: number; changes: number } {
    return this.tableCreator.createUserTable(tileTable);
  }
  /**
   * Create a new [tile table]{@link module:tiles/user/tileTable~TileTable} in this GeoPackage.
   *
   * @param {String} tableName tile table name
   * @param {BoundingBox} contentsBoundingBox bounding box of the contents table
   * @param {Number} contentsSrsId srs id of the contents table
   * @param {BoundingBox} tileMatrixSetBoundingBox bounding box of the matrix set
   * @param {Number} tileMatrixSetSrsId srs id of the matrix set
   * @returns {Promise<TileMatrixSet>} `Promise` of the created {@link module:tiles/matrixset~TileMatrixSet}
   */
  async createTileTableWithTableName(
    tableName: string,
    contentsBoundingBox: BoundingBox,
    contentsSrsId: number,
    tileMatrixSetBoundingBox: BoundingBox,
    tileMatrixSetSrsId: number,
  ): Promise<TileMatrixSet> {
    const columns = TileTable.createRequiredColumns();
    const tileTable = new TileTable(tableName, columns);
    const contents = new Contents();
    contents.table_name = tableName;
    contents.data_type = ContentsDao.GPKG_CDT_TILES_NAME;
    contents.identifier = tableName;
    contents.last_change = new Date().toISOString();
    contents.min_x = contentsBoundingBox.minLongitude;
    contents.min_y = contentsBoundingBox.minLatitude;
    contents.max_x = contentsBoundingBox.maxLongitude;
    contents.max_y = contentsBoundingBox.maxLatitude;
    contents.srs_id = contentsSrsId;
    const tileMatrixSet = new TileMatrixSet();
    tileMatrixSet.contents = contents;
    tileMatrixSet.srs_id = tileMatrixSetSrsId;
    tileMatrixSet.min_x = tileMatrixSetBoundingBox.minLongitude;
    tileMatrixSet.min_y = tileMatrixSetBoundingBox.minLatitude;
    tileMatrixSet.max_x = tileMatrixSetBoundingBox.maxLongitude;
    tileMatrixSet.max_y = tileMatrixSetBoundingBox.maxLatitude;
    await this.createTileMatrixSetTable();
    await this.createTileMatrixTable();
    this.createTileTable(tileTable);
    this.contentsDao.create(contents);
    this.tileMatrixSetDao.create(tileMatrixSet);
    return tileMatrixSet;
  }
  /**
   * Create the tables and rows necessary to store tiles in a {@link module:tiles/matrixset~TileMatrixSet}.
   * This will create a [tile matrix row]{@link module:tiles/matrix~TileMatrix}
   * for every integral zoom level in the range `[minZoom..maxZoom]`.
   *
   * @param {BoundingBox} epsg3857TileBoundingBox
   * @param {TileMatrixSet} tileMatrixSet
   * @param {number} minZoom
   * @param {number} maxZoom
   * @param {number} [tileSize=256] optional tile size in pixels
   * @returns {module:geoPackage~GeoPackage} `this` `GeoPackage`
   */
  createStandardWebMercatorTileMatrix(
    epsg3857TileBoundingBox: BoundingBox,
    tileMatrixSet: TileMatrixSet,
    minZoom: number,
    maxZoom: number,
    tileSize = 256,
  ): GeoPackage {
    tileSize = tileSize || 256;
    const tileMatrixDao = this.tileMatrixDao;
    for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
      const box = TileBoundingBoxUtils.webMercatorTileBox(epsg3857TileBoundingBox, zoom);
      const matrixWidth = box.maxLongitude - box.minLongitude + 1;
      const matrixHeight = box.maxLatitude - box.minLatitude + 1;
      const pixelXSize =
        (epsg3857TileBoundingBox.maxLongitude - epsg3857TileBoundingBox.minLongitude) / matrixWidth / tileSize;
      const pixelYSize =
        (epsg3857TileBoundingBox.maxLatitude - epsg3857TileBoundingBox.minLatitude) / matrixHeight / tileSize;
      const tileMatrix = new TileMatrix();
      tileMatrix.table_name = tileMatrixSet.table_name;
      tileMatrix.zoom_level = zoom;
      tileMatrix.matrix_width = matrixWidth;
      tileMatrix.matrix_height = matrixHeight;
      tileMatrix.tile_width = tileSize;
      tileMatrix.tile_height = tileSize;
      tileMatrix.pixel_x_size = pixelXSize;
      tileMatrix.pixel_y_size = pixelYSize;
      tileMatrixDao.create(tileMatrix);
    }
    return this;
  }
  /**
   * Adds a tile to the GeoPackage
   * @param  {object}   tileStream       Byte array or Buffer containing the tile bytes
   * @param  {String}   tableName  Table name to add the tile to
   * @param  {Number}   zoom       zoom level of this tile
   * @param  {Number}   tileRow    row of this tile
   * @param  {Number}   tileColumn column of this tile
   */
  addTile(tileStream: any, tableName: string, zoom: number, tileRow: number, tileColumn: number): number {
    const tileDao = this.getTileDao(tableName);
    const newRow = tileDao.newRow();
    newRow.zoomLevel = zoom;
    newRow.tileColumn = tileColumn;
    newRow.tileRow = tileRow;
    newRow.tileData = tileStream;
    return tileDao.create(newRow);
  }
  /**
   * Create the Data Columns table if it does not already exist
   */
  async createDataColumns(): Promise<boolean> {
    if (this.dataColumnsDao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createDataColumns();
  }
  /**
   * Create the Data Column Constraints table if it does not already exist
   */
  async createDataColumnConstraintsTable(): Promise<boolean> {
    if (this.dataColumnConstraintsDao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createDataColumnConstraints();
  }
  async createMetadataTable(): Promise<boolean> {
    if (this.metadataDao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createMetadata();
  }
  async createMetadataReferenceTable(): Promise<boolean> {
    if (this.metadataReferenceDao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createMetadataReference();
  }
  async createExtensionTable(): Promise<boolean> {
    if (this.extensionDao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createExtensions();
  }
  async createTableIndexTable(): Promise<boolean> {
    if (this.tableIndexDao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createTableIndex();
  }
  async createGeometryIndexTable(featureDao: FeatureDao<FeatureRow>): Promise<boolean> {
    const dao = this.getGeometryIndexDao(featureDao);
    if (dao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createGeometryIndex();
  }
  async createStyleMappingTable(
    tableName: string,
    columns?: UserColumn[],
    dataColumns?: DataColumns[],
  ): Promise<boolean> {
    const attributeTable = new StyleMappingTable(tableName, columns);
    this.tableCreator.createUserTable(attributeTable);
    const contents = new Contents();
    contents.table_name = tableName;
    contents.data_type = ContentsDao.GPKG_CDT_ATTRIBUTES_NAME;
    contents.identifier = tableName;
    contents.last_change = new Date().toISOString();
    this.contentsDao.create(contents);
    if (dataColumns) {
      await this.createDataColumns();
      const dataColumnsDao = this.dataColumnsDao;
      dataColumns.forEach(function(dataColumn) {
        dataColumnsDao.create(dataColumn);
      });
    }
    return true;
  }
  /**
   * Get the application id of the GeoPackage
   * @returns {string} application id
   */
  getApplicationId(): string {
    return this.database.getApplicationId();
  }
  getInfoForTable(tableDao: TileDao | FeatureDao<FeatureRow>): any {
    const info = {
      tableName: tableDao.table_name,
      tableType: tableDao.table.getTableType(),
      count: tableDao.getCount(),
      geometryColumns: undefined,
      minZoom: undefined as number,
      maxZoom: undefined as number,
      minWebMapZoom: undefined as number,
      maxWebMapZoom: undefined as number,
      zoomLevels: undefined as number,
      tileMatrixSet: undefined,
      contents: undefined,
      srs: undefined,
      columns: undefined,
      columnMap: undefined,
    };
    if (tableDao instanceof FeatureDao) {
      info.geometryColumns = {};
      info.geometryColumns.tableName = tableDao.geometryColumns.table_name;
      info.geometryColumns.geometryColumn = tableDao.geometryColumns.column_name;
      info.geometryColumns.geometryTypeName = tableDao.geometryColumns.geometry_type_name;
      info.geometryColumns.z = tableDao.geometryColumns.z;
      info.geometryColumns.m = tableDao.geometryColumns.m;
    }
    if (tableDao instanceof TileDao) {
      info.minZoom = tableDao.minZoom;
      info.maxZoom = tableDao.maxZoom;
      info.minWebMapZoom = tableDao.minWebMapZoom;
      info.maxWebMapZoom = tableDao.maxWebMapZoom;
      info.zoomLevels = tableDao.tileMatrices.length;
    }
    let dao;
    let contentsRetriever;
    if (tableDao instanceof FeatureDao) {
      dao = this.geometryColumnsDao;
      contentsRetriever = tableDao.geometryColumns;
    } else if (tableDao instanceof TileDao) {
      dao = this.tileMatrixSetDao;
      contentsRetriever = tableDao.tileMatrixSet;
      info.tileMatrixSet = {};
      info.tileMatrixSet.srsId = tableDao.tileMatrixSet.srs_id;
      info.tileMatrixSet.minX = tableDao.tileMatrixSet.min_x;
      info.tileMatrixSet.maxX = tableDao.tileMatrixSet.max_x;
      info.tileMatrixSet.minY = tableDao.tileMatrixSet.min_y;
      info.tileMatrixSet.maxY = tableDao.tileMatrixSet.max_y;
    }
    const contents = dao.getContents(contentsRetriever);
    info.contents = {};
    info.contents.tableName = contents.table_name;
    info.contents.dataType = contents.data_type;
    info.contents.identifier = contents.identifier;
    info.contents.description = contents.description;
    info.contents.lastChange = contents.last_change;
    info.contents.minX = contents.min_x;
    info.contents.maxX = contents.max_x;
    info.contents.minY = contents.min_y;
    info.contents.maxY = contents.max_y;
    const contentsSrs = this.contentsDao.getSrs(contents);
    info.contents.srs = {
      name: contentsSrs.srs_name,
      id: contentsSrs.srs_id,
      organization: contentsSrs.organization,
      organization_coordsys_id: contentsSrs.organization_coordsys_id,
      definition: contentsSrs.definition,
      description: contentsSrs.description,
    };
    const srs = tableDao.getSrs();
    info.srs = {
      name: srs.srs_name,
      id: srs.srs_id,
      organization: srs.organization,
      organization_coordsys_id: srs.organization_coordsys_id,
      definition: srs.definition,
      description: srs.description,
    };
    info.columns = [];
    info.columnMap = {};
    const dcd = this.dataColumnsDao;
    tableDao.table.columns.forEach(
      function(column: UserColumn): any {
        const dataColumn = dcd.getDataColumns(tableDao.table.table_name, column.name);
        info.columns.push({
          index: column.index,
          name: column.name,
          max: column.max,
          min: column.min,
          notNull: column.notNull,
          primaryKey: column.primaryKey,
          dataType: column.dataType ? DataTypes.nameFromType(column.dataType) : '',
          displayName: dataColumn && dataColumn.name ? dataColumn.name : column.name,
          dataColumn: dataColumn,
        });
        info.columnMap[column.name] = info.columns[info.columns.length - 1];
      }.bind(this),
    );
    return info;
  }
  static loadProjections(items: string[]): void {
    if (!items) throw new Error('Invalid array of projections');
    for (let i = 0; i < items.length; i++) {
      if (!defs[items[i]]) throw new Error('Projection not found');
      this.addProjection(items[i], defs[items[i]]);
    }
  }
  static addProjection(name: string, definition: string): void {
    if (!name || !definition) throw new Error('Invalid projection name/definition');
    proj4.defs('' + name, '' + definition);
  }
  static hasProjection(name: string): proj4.ProjectionDefinition {
    return proj4.defs('' + name);
  }
}
