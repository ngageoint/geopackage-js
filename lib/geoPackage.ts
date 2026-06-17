import { GeoPackageConnection } from './db/geoPackageConnection';
import { GeoPackageTableCreator } from './db/geoPackageTableCreator';
import { Projection, ProjectionConstants, Projections, ProjectionTransform } from '@ngageoint/projections-js';
import { BoundingBox } from './boundingBox';
import { GeometryColumns } from './features/columns/geometryColumns';
import { FeatureDao } from './features/user/featureDao';
import { FeatureTableReader } from './features/user/featureTableReader';
import { GeoPackageException } from './geoPackageException';
import { Contents } from './contents/contents';
import { GeometryColumnsDao } from './features/columns/geometryColumnsDao';
import { ContentsDao } from './contents/contentsDao';
import { SpatialReferenceSystemDao } from './srs/spatialReferenceSystemDao';
import { TileMatrixSet } from './tiles/matrixset/tileMatrixSet';
import { TileDao } from './tiles/user/tileDao';
import { RTreeIndexExtension } from './extension/rtree/rTreeIndexExtension';
import { ResultSet } from './db/resultSet';
import { SQLUtils } from './db/sqlUtils';
import { UserCustomDao } from './user/custom/userCustomDao';
import { AttributesDao } from './attributes/attributesDao';
import { ContentsDataType } from './contents/contentsDataType';
import { AttributesTableReader } from './attributes/attributesTableReader';
import { TileTableReader } from './tiles/user/tileTableReader';
import { TileTable } from './tiles/user/tileTable';
import { AttributesTable } from './attributes/attributesTable';
import { UserCustomTableReader } from './user/custom/userCustomTableReader';
import { UserCustomTable } from './user/custom/userCustomTable';
import { CrsWktExtension } from './extension/crsWktExtension';
import { FeatureTable } from './features/user/featureTable';
import { TileMatrixSetDao } from './tiles/matrixset/tileMatrixSetDao';
import { TileMatrixDao } from './tiles/matrix/tileMatrixDao';
import { SpatialReferenceSystem } from './srs/spatialReferenceSystem';
import { ExtensionsDao } from './extension/extensionsDao';
import { AlterTable } from './db/alterTable';
import { TileMatrix } from './tiles/matrix/tileMatrix';
import { ExtensionManager } from './extension/extensionManager';
import { UserTable } from './user/userTable';
import { UserColumn } from './user/userColumn';
import { AttributesTableMetadata } from './attributes/attributesTableMetadata';
import { TableIndexDao } from './extension/nga/index/tableIndexDao';
import { TileScalingDao } from './extension/nga/scale/tileScalingDao';
import { GeoPackageDataType } from './db/geoPackageDataType';
import { DataColumns } from './extension/schema/columns/dataColumns';
import { DataColumnsDao } from './extension/schema/columns/dataColumnsDao';
import { FeatureIndexManager } from './features/index/featureIndexManager';
import { FeatureTableMetadata } from './features/user/featureTableMetadata';
import { TileTableMetadata } from './tiles/user/tileTableMetadata';
import { SchemaExtension } from './extension/schema/schemaExtension';
import { GeometryIndexDao } from './extension/nga/index/geometryIndexDao';
import { ExtendedRelationsDao } from './extension/related/extendedRelationsDao';
import { MetadataReferenceDao } from './extension/metadata/reference/metadataReferenceDao';
import { ContentsIdDao } from './extension/nga/contents/contentsIdDao';
import { GeoPackageValidate, GeoPackageValidationError } from './validate/geoPackageValidate';
import { DataColumnConstraintsDao } from './extension/schema/constraints/dataColumnConstraintsDao';
import { GeoPackageProgress } from './io/geoPackageProgress';
import { FeatureIndexType } from './features/index/featureIndexType';
import { FeatureIndexResults } from './features/index/featureIndexResults';
import { FeatureConverter } from '@ngageoint/simple-features-geojson-js';
import { Feature } from 'geojson';
import { FeatureRow } from './features/user/featureRow';
import { GeoJSONResultSet } from './features/geojson/geoJSONResultSet';
import { GeoPackageTileRetriever } from './tiles/geoPackageTileRetriever';
import { DBValue } from './db/dbValue';
import { RelationType } from './extension/related/relationType';
import { UserMappingTable } from './extension/related/userMappingTable';
import { RelatedTablesExtension } from './extension/related/relatedTablesExtension';
import { GeoPackageGeometryData } from './geom/geoPackageGeometryData';
import { GeometryTransform } from '@ngageoint/simple-features-proj-js';
import { AttributesRow } from './attributes/attributesRow';
import { MediaTable } from './extension/related/media/mediaTable';
import { MediaDao } from './extension/related/media/mediaDao';
import { MediaRow } from './extension/related/media/mediaRow';
import { MediaTableMetadata } from './extension/related/media/mediaTableMetadata';
import { UserCustomColumn } from './user/custom/userCustomColumn';
import { Geometry, GeometryType } from '@ngageoint/simple-features-js';
import { FeatureColumn } from './features/user/featureColumn';
import { SimpleAttributesTableMetadata } from './extension/related/simple/simpleAttributesTableMetadata';
import { SimpleAttributesTable } from './extension/related/simple/simpleAttributesTable';
import { GeoPackageTile } from './tiles/geoPackageTile';
import { TileScaling } from './extension/nga/scale/tileScaling';
import { TileTableScaling } from './extension/nga/scale/tileTableScaling';
import { TileScalingType } from './extension/nga/scale/tileScalingType';
import { TileBoundingBoxUtils } from './tiles/tileBoundingBoxUtils';
import { GeoJSONUtils } from './features/geojson/geoJSONUtils';
import { AttributesColumns } from './attributes/attributesColumns';
import { UserColumns } from './user/userColumns';
import { ExtendedRelation } from './extension/related/extendedRelation';
import { SimpleAttributesDao } from './extension/related/simple/simpleAttributesDao';
import { UserMappingRow } from './extension/related/userMappingRow';
import { UserRow } from './user/userRow';
import { SqliteQueryBuilder } from './db/sqliteQueryBuilder';
import { TileRow } from './tiles/user/tileRow';
import { TileColumn } from './tiles/user/tileColumn';
import { FeatureTiles } from './tiles/features/featureTiles';
import { TileUtils } from './tiles/tileUtils';
import { MetadataDao } from './extension/metadata/metadataDao';
import { SimpleAttributesRow } from './extension/related/simple/simpleAttributesRow';
import { FeatureTileLinkDao } from './extension/nga/link/featureTileLinkDao';

export interface ClosestFeature {
  feature_count: number;
  coverage: boolean;
  gp_table: string;
  gp_name: string;
  distance?: number;
}

/**
 *  A single GeoPackage database connection implementation
 */
export class GeoPackage {
  /**
   * GeoPackage name
   */
  private readonly name: string;

  /**
   * GeoPackage file path
   */
  private readonly path: string;

  /**
   * SQLite database
   */
  private readonly database: GeoPackageConnection;

  /**
   * Table creator
   */
  private readonly tableCreator: GeoPackageTableCreator;

  /**
   * Writable GeoPackage flag
   */
  protected readonly writable: boolean;

  /**
   * RelatedTables Extension
   * @private
   */
  private relatedTablesExtension: RelatedTablesExtension;

  /**
   * Extension Manager
   * @private
   */
  private extensionManager: ExtensionManager;

  /**
   * GeometryIndexDao
   */
  private geometryIndexDao: GeometryIndexDao;

  /**
   * DataColumns Dao
   * @private
   */
  private dataColumnsDao: DataColumnsDao;

  /**
   * DataColumnConstraints Dao
   * @private
   */
  private dataColumnConstraintsDao: DataColumnConstraintsDao;

  /**
   * Extended Relations Dao
   * @private
   */
  private extendedRelationsDao: ExtendedRelationsDao;

  /**
   * Metadata Relations Dao
   * @private
   */
  private metadataReferenceDao: MetadataReferenceDao;

  /**
   * Metadata Dao
   * @private
   */
  private metadataDao: MetadataDao;

  /**
   * Contents Id Dao
   * @private
   */
  private contentsIdDao: ContentsIdDao;

  /**
   * Contents Dao
   * @private
   */
  private contentsDao: ContentsDao;

  /**
   * Geometry Columns Dao
   * @private
   */
  private geometryColumnsDao: GeometryColumnsDao;

  /**
   * Spatial Reference System Dao
   * @private
   */
  private spatialReferenceSystemDao: SpatialReferenceSystemDao;

  /**
   * Tile Matrix Set Dao
   * @private
   */
  private tileMatrixSetDao: TileMatrixSetDao;

  /**
   * Tile Matrix Dao
   * @private
   */
  private tileMatrixDao: TileMatrixDao;

  /**
   * Extensions Dao
   * @private
   */
  private extensionsDao: ExtensionsDao;

  /**
   * Table Index Dao
   * @private
   */
  private tableIndexDao: TableIndexDao;

  /**
   * Tile Scaling Dao
   * @private
   */
  private tileScalingDao: TileScalingDao;

  /**
   * Constructor
   * @param {string} name name
   * @param {string} path path
   * @param {GeoPackageConnection} database database
   * @param {boolean} writable true if writable
   */
  public constructor(name: string, path: string, database: GeoPackageConnection, writable = true) {
    this.name = name;
    this.path = path;
    this.database = database;
    this.tableCreator = new GeoPackageTableCreator(this);
    this.writable = writable;
  }

  /**
   * Get the feature table bounding box
   * @param {Projection} projection
   * @param {string} table
   * @param {boolean} manual
   * @return {BoundingBox}
   */
  public getFeatureBoundingBox(projection: Projection, table: string, manual: boolean): BoundingBox {
    let boundingBox = null;

    const indexManager = new FeatureIndexManager(this, table);
    try {
      if (manual || indexManager.isIndexed()) {
        boundingBox = indexManager.getBoundingBoxWithProjection(projection);
      }
    } finally {
      indexManager.close();
    }

    return boundingBox;
  }

  /**
   * Get the feature dao
   * @param {GeometryColumns} geometryColumns
   */
  public getFeatureDaoWithGeometryColumns(geometryColumns: GeometryColumns): FeatureDao {
    if (geometryColumns == null) {
      throw new GeoPackageException('Non null GeometryColumns is required to create FeatureDao');
    }

    // Read the existing table and create the dao
    const tableReader = new FeatureTableReader(geometryColumns);
    const featureTable = tableReader.readTable(this.database);
    const contents = this.getContentsDao().queryForIdWithKey(geometryColumns.getTableName());
    featureTable.setContents(contents);
    const dao = new FeatureDao(this.getName(), this, geometryColumns, featureTable);

    // If the GeoPackage is writable and the feature table has a RTree Index
    // extension, create the SQL functions
    if (this.writable) {
      const rtree = new RTreeIndexExtension(this);
      if (rtree.hasExtensionWithTable(featureTable.getTableName())) {
        rtree.createAllFunctions();
      }
    }
    return dao;
  }

  /**
   * Get the feature dao
   * @param {Contents} contents
   */
  public getFeatureDaoWithContents(contents: Contents): FeatureDao {
    if (contents == null) {
      throw new GeoPackageException('Non null is: Contents required to create FeatureDao');
    }

    let geometryColumns = null;
    try {
      geometryColumns = this.getGeometryColumnsDao().queryForTableName(contents.getTableName());
    } catch (e) {
      throw new GeoPackageException('No GeometryColumns' + ' could be retrieved for Contents ' + contents.getId());
    }

    if (geometryColumns == null) {
      throw new GeoPackageException('No GeometryColumns exists for Contents ' + contents.getId());
    }

    return this.getFeatureDaoWithGeometryColumns(geometryColumns);
  }

  /**
   * Get the feature dao
   * @param {string} tableName
   */
  public getFeatureDao(tableName: string): FeatureDao {
    const dao = this.getGeometryColumnsDao();
    let geometryColumnsList;
    try {
      geometryColumnsList = dao.queryForEq(GeometryColumns.COLUMN_TABLE_NAME, tableName);
    } catch (e) {
      throw new GeoPackageException(
        'Failed to retrieve ' +
          'FeatureDao for table name: ' +
          tableName +
          '. Exception retrieving ' +
          'GeometryColumns.',
      );
    }
    if (geometryColumnsList.length === 0) {
      throw new GeoPackageException('No Feature Table exists for table name: ' + tableName);
    } else if (geometryColumnsList.length > 1) {
      // This shouldn't happen with the table name unique constraint on
      // geometry columns
      throw new GeoPackageException(
        'Unexpected state. More than one GeometryColumns' +
          ' matched for table name: ' +
          tableName +
          ', count: ' +
          geometryColumnsList.length,
      );
    }
    return this.getFeatureDaoWithGeometryColumns(geometryColumnsList[0]);
  }

  /**
   * Get the tile dao with the provided TileMatrixSet
   * @param tileMatrixSet
   */
  public getTileDaoWithTileMatrixSet(tileMatrixSet: TileMatrixSet): TileDao {
    if (tileMatrixSet == null) {
      throw new GeoPackageException('Non null TileMatrixSet is required to create TileDao');
    }

    // Get the Tile Matrix collection, order by zoom level ascending & pixel
    // size descending per requirement 51
    const tableName = tileMatrixSet.getTableName();
    let tileMatrices;
    try {
      tileMatrices = this.getTileMatrixDao().queryForTableName(tableName);
    } catch (e) {
      throw new GeoPackageException(
        'Failed to retrieve TileDao' +
          ' for table name: ' +
          tableName +
          '. Exception retrieving TileMatrix collection.',
      );
    }

    // Read the existing table and create the dao
    const tableReader = new TileTableReader(tableName);
    const tileTable = tableReader.readTable(this.database);
    tileTable.setContents(this.getContentsDao().queryForIdWithKey(tableName));
    return new TileDao(this.getName(), this, tileMatrixSet, tileMatrices, tileTable);
  }

  /**
   * Get the tile dao with the provided contents
   * @param contents
   */
  public getTileDaoWithContents(contents: Contents): TileDao {
    if (contents == null) {
      throw new GeoPackageException('Non null Contents is required to create TileDao');
    }

    let tileMatrixSet = null;
    try {
      tileMatrixSet = this.getTileMatrixSetDao().queryForId(contents.getTableName());
    } catch (e) {
      throw new GeoPackageException('No TileMatrixSet' + ' could be retrieved for Contents' + ' ' + contents.getId());
    }

    if (tileMatrixSet == null) {
      throw new GeoPackageException('No TileMatrixSet' + ' exists for Contents' + ' ' + contents.getId());
    }

    return this.getTileDaoWithTileMatrixSet(tileMatrixSet);
  }

  /**
   * Get the tile dao with the provided TileTable
   * @param table
   */
  public getTileDaoWithTileTable(table: TileTable): TileDao {
    return this.getTileDao(table.getTableName());
  }

  /**
   * Get the tile dao from the table name
   * @param tableName
   */
  public getTileDao(tableName: string): TileDao {
    const dao = this.getTileMatrixSetDao();
    let tileMatrixSetList;
    try {
      tileMatrixSetList = dao.queryForEq(TileMatrixSet.COLUMN_TABLE_NAME, tableName);
    } catch (e) {
      throw new GeoPackageException(
        'Failed to retrieve TileDao' + ' for table name: ' + tableName + '. Exception retrieving TileMatrixSet.',
      );
    }
    if (tileMatrixSetList.length === 0) {
      throw new GeoPackageException(
        'No Tile Table exists for table name: ' + tableName + ', Tile Tables: ' + this.getTileTables(),
      );
    } else if (tileMatrixSetList.length > 1) {
      // This shouldn't happen with the table name primary key on tile
      // matrix set table
      throw new GeoPackageException(
        'Unexpected state. More than one TileMatrixSet' +
          ' matched for table name: ' +
          tableName +
          ', count: ' +
          tileMatrixSetList.length,
      );
    }
    return this.getTileDaoWithTileMatrixSet(tileMatrixSetList[0]);
  }

  /**
   * Get the attributes dao
   * @param contents
   */
  public getAttributesDaoWithContents(contents: Contents): AttributesDao {
    if (contents == null) {
      throw new GeoPackageException('Non null Contents' + ' is required to create AttributesDao');
    }
    if (!contents.isAttributesTypeOrUnknown()) {
      throw new GeoPackageException(
        +'Contents is required to be of type ' +
          ContentsDataType.ATTRIBUTES +
          '. Actual: ' +
          contents.getDataTypeName(),
      );
    }

    // Read the existing table and create the dao
    const tableReader = new AttributesTableReader(contents.getTableName());
    const attributesTable = tableReader.readTable(this.database);
    attributesTable.setContents(contents);
    return new AttributesDao(this.getName(), this, attributesTable);
  }

  /**
   * Get the attributes dao
   * @param {AttributesTable} table
   * @return {AttributesDao}
   */
  public getAttributesDaoWithAttributesTable(table: AttributesTable): AttributesDao {
    return this.getAttributesDao(table.getTableName());
  }

  /**
   * Get the attributes dao
   * @param {string} tableName
   * @return {AttributesDao}
   */
  public getAttributesDao(tableName: string): AttributesDao {
    const dao = this.getContentsDao();
    let contents: Contents = null;
    try {
      contents = dao.queryForId(tableName);
    } catch (e) {
      throw new GeoPackageException('Failed to retrieve Contents' + ' for table name: ' + tableName);
    }
    if (contents == null) {
      throw new GeoPackageException('No Table: Contents exists for table name: ' + tableName);
    }
    return this.getAttributesDaoWithContents(contents);
  }

  /**
   * Get the Simple Attributes DAO
   * @param {string} tableName
   * @return {SimpleAttributesDao}
   */
  public getSimpleAttributesDao(tableName: string): SimpleAttributesDao {
    const reader = new UserCustomTableReader(tableName);
    const userCustomTable = reader.readTable(this.getConnection());
    return new SimpleAttributesDao(new UserCustomDao(this.getName(), this, userCustomTable));
  }

  /**
   * Get the Media DAO
   * @param {string} tableName
   * @return {MediaDao}
   */
  public getMediaDao(tableName: string): MediaDao {
    const reader = new UserCustomTableReader(tableName);
    const userCustomTable = reader.readTable(this.getConnection());
    return new MediaDao(new UserCustomDao(this.getName(), this, userCustomTable));
  }

  /**
   * Get the UserCustomDao
   * @param {string} tableName
   * @return {UserCustomDao}
   */
  public getUserCustomDao(tableName: string): UserCustomDao {
    const table = UserCustomTableReader.readUserCustomTable(this.getDatabase(), tableName);
    return this.getUserCustomDaoWithUserCustomTable(table);
  }

  /**
   * Get the UserCustomDao
   * @param table
   * @return {UserCustomDao}
   */
  public getUserCustomDaoWithUserCustomTable(table: UserCustomTable): UserCustomDao {
    return new UserCustomDao(this.getName(), this, table);
  }

  /**
   * Execute sql against the database
   * @param {string} sql
   */
  public execSQL(sql: string): void {
    this.database.run(sql);
  }

  /**
   * Query the database
   * @param {string} sql
   * @param {any[]} args
   * @return {ResultSet}
   */
  public query(sql: string, args: any[]): ResultSet {
    return this.database.query(sql, args);
  }

  /**
   * Gets the connection
   * @return {GeoPackageConnection}
   */
  public getConnection(): GeoPackageConnection {
    return this.database;
  }

  /**
   * Returns the size of the database
   */
  public size(): number {
    return this.database.size();
  }

  /**
   * Returns the readable size of the database
   */
  public readableSize(): string {
    return this.database.readableSize();
  }

  /**
   * Query for the foreign keys value
   * @param db connection
   * @return true if enabled, false if disabled
   * @since 3.3.0
   */
  public static foreignKeys(db: GeoPackageConnection): boolean {
    const foreignKeys = db.querySingleResult('PRAGMA foreign_keys');
    return foreignKeys != null && foreignKeys;
  }

  /**
   * Change the foreign keys state
   * @param db connection
   * @param on true to turn on, false to turn off
   * @return previous foreign keys value
   * @since 3.3.0
   */
  public static enableForeignKeys(db: GeoPackageConnection, on: boolean): boolean {
    const foreignKeys = GeoPackage.foreignKeys(db);
    if (foreignKeys !== on) {
      const sql = GeoPackage.foreignKeysSQL(on);
      db.run(sql);
    }
    return foreignKeys;
  }

  /**
   * Create the foreign keys SQL
   * @param on true to turn on, false to turn off
   * @return foreign keys SQL
   * @since 3.3.0
   */
  public static foreignKeysSQL(on: boolean): string {
    return 'PRAGMA foreign_keys = ' + on;
  }

  /**
   * Perform a foreign key check
   *
   * @param db
   *            connection
   * @param tableName
   *            table name
   * @return empty list if valid or violation errors, 4 column values for each
   *         violation. see SQLite PRAGMA foreign_key_check
   * @since 3.3.0
   */
  public static foreignKeyCheck(db: GeoPackageConnection, tableName?: string): Array<Array<any>> {
    const sql = GeoPackage.foreignKeyCheckSQL(tableName);
    return db.queryResults(sql, null);
  }

  /**
   * Create the foreign key check SQL
   *
   * @param tableName
   *            table name
   * @return foreign key check SQL
   * @since 3.3.0
   */
  public static foreignKeyCheckSQL(tableName): string {
    return 'PRAGMA foreign_key_check' + (tableName != null ? '(' + SQLUtils.quoteWrap(tableName) + ')' : '');
  }

  /**
   * Create the integrity check SQL
   *
   * @return integrity check SQL
   * @since 3.3.0
   */
  public static integrityCheckSQL(): string {
    return 'PRAGMA integrity_check';
  }

  /**
   * Create the quick check SQL
   *
   * @return quick check SQL
   * @since 3.3.0
   */
  public static quickCheckSQL(): string {
    return 'PRAGMA quick_check';
  }

  /**
   * Foreign Key Check
   */
  public foreignKeyCheck(tableName?: string): ResultSet {
    let resultSet = this.query(SQLUtils.foreignKeyCheckSQL(tableName), null);
    try {
      if (!resultSet.next()) {
        resultSet.close();
        resultSet = null;
      }
    } catch (e) {
      throw new GeoPackageException('Foreign key check failed on database: ' + this.getName());
    }
    return resultSet;
  }

  /**
   * Integrity check
   */
  public integrityCheck(): ResultSet {
    return this.integrityCheckWithResultSet(this.query(SQLUtils.integrityCheckSQL(), null));
  }

  /**
   * Quick check
   */
  public quickCheck(): ResultSet {
    return this.integrityCheckWithResultSet(this.query(SQLUtils.quickCheckSQL(), null));
  }

  /**
   * Check the result set returned from the integrity check to see if things
   * are "ok"
   *
   * @param resultSet
   * @return null if ok, else the open result set
   */
  private integrityCheckWithResultSet(resultSet: ResultSet): ResultSet {
    try {
      if (resultSet.next()) {
        const value = resultSet.getStringAtIndex(0);
        if (value === 'ok') {
          resultSet.close();
          resultSet = null;
        }
      }
    } catch (e) {
      throw new GeoPackageException('Integrity check failed on database: ' + this.getName());
    }
    return resultSet;
  }

  /**
   * Close the GeoPackage connection
   */
  public close(): void {
    this.database.close();
  }

  /**
   * Exports the GeoPackage as a file
   */
  public async export(): Promise<Uint8Array> {
    return this.database.export();
  }

  /**
   * Validate the GeoPackage
   */
  public validate(): GeoPackageValidationError[] {
    return GeoPackageValidate.validateMinimumTables(this);
  }

  /**
   * Get the GeoPackage name
   * @return {string} name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Get the GeoPackage path
   * @return {string} path
   */
  public getPath(): string {
    return this.path;
  }

  /**
   * Get the SQLite database
   * @return {GeoPackageConnection} connection
   */
  public getDatabase(): GeoPackageConnection {
    return this.database;
  }

  /**
   * Get the Table Creator
   * @return {GeoPackageTableCreator} tableCreator
   */
  public getTableCreator(): GeoPackageTableCreator {
    return this.tableCreator;
  }

  /**
   * Returns whether the GeoPackage is writable
   */
  public isWritable(): boolean {
    return this.writable;
  }

  /**
   * Gets the application id
   */
  public getApplicationId(): string {
    return this.database.getApplicationId();
  }

  /**
   * Get all the feature table names in this GeoPackage
   */
  public getFeatureTables(): string[] {
    return this.getTables(ContentsDataType.FEATURES);
  }

  /**
   * Checks if this GeoPackage has the feature table
   * @param featureTableName
   */
  public hasFeatureTable(featureTableName: string): boolean {
    const tables = this.getFeatureTables();
    return tables && tables.indexOf(featureTableName) != -1;
  }

  /**
   * Get all the tile table names in this GeoPackage
   */
  public getTileTables(): string[] {
    return this.getTables(ContentsDataType.TILES);
  }

  /**
   * Checks if this GeoPackage has the tile table
   * @param tileTableName
   */
  public hasTileTable(tileTableName: string): boolean {
    const tables = this.getTileTables();
    return tables && tables.indexOf(tileTableName) != -1;
  }

  /**
   * Gets the attributes tables
   */
  public getAttributesTables(): string[] {
    return this.getTables(ContentsDataType.ATTRIBUTES);
  }

  /**
   * Checks if this GeoPackage has the attribute table
   * @param attributeTableName
   */
  public hasAttributeTable(attributeTableName: string): boolean {
    const tables = this.getAttributesTables();
    return tables && tables.indexOf(attributeTableName) != -1;
  }

  /**
   * Get the tables for the contents data type
   * @param {ContentsDataType} type
   * @return {string[]} tables
   */
  public getTables(type?: ContentsDataType): string[] {
    let tableNames;
    try {
      tableNames = this.getContentsDao().getTables(type);
    } catch (e) {
      throw new GeoPackageException('Failed to retrieve ' + type + ' tables');
    }
    return tableNames;
  }

  /**
   * Get the tables for the contents data types
   * @param {ContentsDataType[]} types
   * @return {string[]} tables
   */
  public getTablesForTypes(types: ContentsDataType[]): string[] {
    let tableNames;
    try {
      tableNames = this.getContentsDao().getTablesForTypes(types);
    } catch (e) {
      throw new GeoPackageException('Failed to retrieve tables of types: ' + types);
    }
    return tableNames;
  }

  /**
   * Get the contents for the data type
   * @param {ContentsDataType} type
   * @return {Contents[]} contents
   */
  public getTypeContents(type: ContentsDataType): Contents[] {
    let contents;
    try {
      contents = this.getContentsDao().getContents(type);
    } catch (e) {
      throw new GeoPackageException('Failed to retrieve ' + type + ' contents');
    }
    return contents;
  }

  /**
   * Get the contents for the data types
   * @param {ContentsDataType[]} types
   * @return {Contents[]} contents
   */
  public getTypeContentsWithTypes(types: ContentsDataType[]): Contents[] {
    let contents;
    try {
      contents = this.getContentsDao().getContentsForTypes(types);
    } catch (e) {
      throw new GeoPackageException('Failed to retrieve of: Contents types: ' + types);
    }
    return contents;
  }

  /**
   * Get the contents for the data type
   * @param {string} type
   * @return {Contents[]} contents
   */
  public getTypeContentsWithString(type: string): Contents[] {
    let contents;
    try {
      contents = this.getContentsDao().getContents(type);
    } catch (e) {
      throw new GeoPackageException('Failed to retrieve ' + type + ' contents');
    }
    return contents;
  }

  /**
   * Check if the table is a feature table
   * @param {string} table
   * @return {boolean} result
   */
  public isFeatureTable(table: string): boolean {
    return this.isTableType(table, ContentsDataType.FEATURES);
  }

  /**
   * Check if the table is a tile table
   * @param {string} table
   * @return {boolean} result
   */
  public isTileTable(table: string): boolean {
    return this.isTableType(table, ContentsDataType.TILES);
  }

  /**
   * Check if the table is an attribute table
   * @param {string} table
   * @return {boolean} result
   */
  public isAttributeTable(table: string): boolean {
    return this.isTableType(table, ContentsDataType.ATTRIBUTES);
  }

  /**
   * Check if the table is the provided type
   * @param {string} table
   * @param {ContentsDataType} type
   * @return {boolean} result
   */
  public isTableType(table: string, type: ContentsDataType): boolean {
    return this.isTableTypeWithTypes(table, [type]);
  }

  /**
   * Check if the table is one of the provided types
   * @param {string} table
   * @param {ContentsDataType[]} types
   * @return {boolean} result
   */
  public isTableTypeWithTypes(table: string, types: ContentsDataType[]): boolean {
    return types.indexOf(this.getTableDataType(table)) !== -1;
  }

  /**
   * Check if the table is one of the provided types
   * @param {string} table
   * @param {string} type
   * @return {boolean} result
   */
  public isTableTypeWithStringType(table: string, type: string): boolean {
    return this.isTableTypeWithStringTypes(table, [type]);
  }

  /**
   * Check if the table is one of the provided types
   * @param {string} table
   * @param {string[]} types
   * @return {boolean} result
   */
  public isTableTypeWithStringTypes(table: string, types: string[]): boolean {
    let isType = types.indexOf(this.getTableType(table)) !== -1;
    if (!isType) {
      const dataType = this.getTableDataType(table);
      if (dataType != null) {
        isType = types.indexOf(ContentsDataType.nameFromType(dataType)) !== -1;
      }
    }
    return isType;
  }

  /**
   * Check if the table exists as a user contents table
   * @param {string} table
   * @return {boolean} result
   */
  public isContentsTable(table: string): boolean {
    return this.getTableContents(table) != null;
  }

  /**
   * Check if the table exists
   * @param {string} table
   * @return {boolean} result
   */
  public isTable(table: string): boolean {
    return this.database.tableExists(table);
  }

  /**
   * Check if the view exists
   * @param {string} view
   * @return {boolean} result
   */
  public isView(view: string): boolean {
    return this.database.viewExists(view);
  }

  /**
   * Check if the table or view
   * @param {string} name
   * @return {boolean} result
   */
  public isTableOrView(name: string): boolean {
    return this.database.tableOrViewExists(name);
  }

  /**
   * Get the contents of the user table
   * @param {string} table
   * @return {Contents} contents
   */
  public getTableContents(table: string): Contents {
    const contentDao = this.getContentsDao();
    let contents = null;
    try {
      contents = contentDao.queryForId(table);
    } catch (e) {
      throw new GeoPackageException('Failed to retrieve table contents: ' + table);
    }
    return contents;
  }

  /**
   * Get the contents data type of the user table
   * @param {string} table
   * @return {string} contents data type
   */
  public getTableType(table: string): string {
    let tableType = null;
    const contents = this.getTableContents(table);
    if (contents != null) {
      tableType = contents.getDataTypeName();
    }
    return tableType;
  }

  /**
   * Get the contents data type of the user table
   * @param {string }table table name
   * @return {ContentsDataType} table type or null if not an enumerated type
   */
  public getTableDataType(table: string): ContentsDataType {
    let tableType = null;
    const contents = this.getTableContents(table);
    if (contents != null) {
      tableType = contents.getDataType();
    }
    return tableType;
  }

  /**
   * Get the bounding box for all table contents in the provided projection
   * @param {Projection} projection desired bounding box projection
   * @return {BoundingBox} bounding box
   */
  public getContentsBoundingBox(projection: Projection): BoundingBox {
    return this.getContentsDao().getBoundingBoxInProjection(projection);
  }

  /**
   * Get the bounding box from the contents for the table in the provided
   * projection
   * @param {string} table
   * @param {Projection} projection
   * @return {BoundingBox} bounding box
   */
  public getContentsBoundingBoxWithProjection(table: string, projection: Projection = null): BoundingBox {
    const contentsDao = this.getContentsDao();
    return contentsDao.getBoundingBoxForTableInProjection(projection, table);
  }

  /**
   * Get the bounding box from the contents for the table in the provided
   * projection
   * @param {string} table
   * @param {Projection} projection
   * @param {boolean} manual query flag, true to determine missing bounds manually
   * @return {BoundingBox} bounding box
   */
  public getBoundingBox(table: string, projection: Projection = null, manual = false): BoundingBox {
    const tableBoundingBox = this.getTableBoundingBox(table, projection, manual);

    if (tableBoundingBox != null && projection == null) {
      projection = this.getProjection(table);
    }

    let boundingBox = this.getContentsBoundingBoxWithProjection(table, projection);

    if (tableBoundingBox != null) {
      if (boundingBox == null) {
        boundingBox = tableBoundingBox;
      } else {
        boundingBox = boundingBox.union(tableBoundingBox);
      }
    }

    return boundingBox;
  }

  /**
   * Get the bounding box for all tables in the provided projection, using
   * only table metadata
   *
   * @param {string} table
   * @param {Projection} projection desired bounding box projection
   * @param {boolean} manual query flag, true to determine missing bounds manually
   *
   * @return {BoundingBox} bounding box
   */
  public getTableBoundingBox(table: string, projection: Projection = null, manual = false): BoundingBox {
    let boundingBox = null;
    const tableType = this.getTableType(table);
    const dataType = ContentsDataType.fromName(tableType);
    if (dataType != null) {
      switch (dataType) {
        case ContentsDataType.FEATURES:
          boundingBox = this.getFeatureBoundingBox(projection, table, manual);
          break;
        case ContentsDataType.TILES:
          let tileMatrixSet = null;
          try {
            tileMatrixSet = this.getTileMatrixSetDao().queryForId(table);
          } catch (e) {
            throw new GeoPackageException('Failed to retrieve tile matrix set for table: ' + table);
          }
          boundingBox = tileMatrixSet.getBoundingBox(projection);
          break;
        default:
      }
    }
    return boundingBox;
  }

  /**
   * Get the projection of the table contents
   * @param {string} table
   * @return {Projection} projection
   */
  public getContentsProjection(table: string): Projection {
    const contents = this.getTableContents(table);
    if (contents == null) {
      throw new GeoPackageException('Failed to retrieve for: Contents table: ' + table);
    }
    return this.getContentsDao().getProjection(contents);
  }

  /**
   * Get the projection of the table
   * @param {string} table
   * @return {Projection} projection
   */
  public getProjection(table: string): Projection {
    let projection: Projection = null;
    const tableType = this.getTableType(table);
    const dataType = ContentsDataType.fromName(tableType);
    if (dataType != null) {
      switch (dataType) {
        case ContentsDataType.FEATURES:
          let geometryColumns = null;
          try {
            geometryColumns = this.getGeometryColumnsDao().queryForTableName(table);
          } catch (e) {
            throw new GeoPackageException('Failed to retrieve geometry columns for table: ' + table);
          }
          projection = geometryColumns.getProjection();
          break;
        case ContentsDataType.TILES:
          let tileMatrixSet = null;
          try {
            tileMatrixSet = this.getTileMatrixSetDao().queryForId(table);
          } catch (e) {
            throw new GeoPackageException('Failed to retrieve tile matrix set for table: ' + table);
          }
          projection = tileMatrixSet.getProjection();
          break;
        default:
      }
    }

    if (projection == null) {
      projection = this.getContentsProjection(table);
    }

    return projection;
  }

  /**
   * Create the Geometry Columns table if it does not already exist
   * @return {boolean} true if created
   */
  public createGeometryColumnsTable(): boolean {
    this.verifyWritable();

    let created = false;
    const dao = this.getGeometryColumnsDao();
    try {
      if (!dao.isTableExists()) {
        created = this.tableCreator.createGeometryColumns();
      }
    } catch (e) {
      throw new GeoPackageException('Failed to check if GeometryColumns table exists and create it');
    }
    return created;
  }

  /**
   * Create a new feature table
   * WARNING: only creates the feature table, call
   * {@link #createFeatureTableWithMetadata}) instead to create both
   * the table and required GeoPackage metadata
   *
   * @param {FeatureTable} table  feature table
   */
  public createFeatureTable(table: FeatureTable): void {
    this.createUserTable(table);
  }

  /**
   * Creates a FeatureTable with properties provided
   * @param {string} tableName
   * @param {{name: string; dataType: string }[]} properties
   * @return {FeatureTable} feature table
   */
  createFeatureTableWithProperties(tableName: string, properties: { name: string; dataType: string }[]): FeatureTable {
    const geometryColumn = new GeometryColumns();
    geometryColumn.setTableName(tableName);
    geometryColumn.setColumnName('geometry');
    geometryColumn.setGeometryType(GeometryType.GEOMETRY);
    geometryColumn.setZ(0);
    geometryColumn.setM(0);
    geometryColumn.setSrsId(4326);
    const columns: FeatureColumn[] = [];
    for (let i = 0; properties && i < properties.length; i++) {
      const property = properties[i] as { name: string; dataType: string };
      columns.push(FeatureColumn.createColumn(property.name, GeoPackageDataType.fromName(property.dataType)));
    }
    return this.createFeatureTableWithMetadata(
      FeatureTableMetadata.create(geometryColumn, columns, undefined, BoundingBox.worldWGS84()),
    );
  }

  /**
   * Creates a FeatureTable with FeatureTableMetadata
   * @param {FeatureTableMetadata} metadata
   * @return {FeatureTable} feature table
   */
  public createFeatureTableWithMetadata(metadata: FeatureTableMetadata): FeatureTable {
    const geometryColumns = metadata.getGeometryColumns();
    if (geometryColumns == null) {
      throw new GeoPackageException('Geometry Columns are required to create a feature table');
    }

    // Create the Geometry Columns table
    this.createGeometryColumnsTable();

    // Create the user feature table
    const tableName = metadata.getTableName();
    const table = new FeatureTable(tableName, metadata.getColumnName(), metadata.buildColumns());
    this.createFeatureTable(table);

    try {
      // Create the contents
      const contents = new Contents();
      contents.setTableName(tableName);
      contents.setDataTypeName(metadata.getDataType(), ContentsDataType.FEATURES);
      contents.setIdentifier(tableName);
      // contents.setLastChange(new Date());
      const boundingBox = metadata.getBoundingBox();
      if (boundingBox != null) {
        contents.setMinX(boundingBox.getMinLongitude());
        contents.setMinY(boundingBox.getMinLatitude());
        contents.setMaxX(boundingBox.getMaxLongitude());
        contents.setMaxY(boundingBox.getMaxLatitude());
      }
      contents.setSrsId(geometryColumns.getSrsId());
      this.getContentsDao().create(contents);

      table.setContents(contents);

      // Create new geometry columns
      geometryColumns.setTableName(contents.getId());
      this.getGeometryColumnsDao().create(geometryColumns);
    } catch (e) {
      this.deleteTableQuietly(tableName);
      throw new GeoPackageException('Failed to create table and metadata: ' + tableName);
    }

    return table;
  }

  /**
   * Get a Tile Matrix Set DAO
   * @return {TileMatrixSetDao} Tile Matrix Set DAO
   */
  public getTileMatrixSetDao(): TileMatrixSetDao {
    if (this.tileMatrixSetDao == null) {
      this.tileMatrixSetDao = TileMatrixSetDao.createDao(this);
    }
    return this.tileMatrixSetDao;
  }

  /**
   * Create the Tile Matrix Set table if it does not already exist
   * @return {boolean} true if created
   */
  public createTileMatrixSetTable(): boolean {
    this.verifyWritable();

    let created = false;
    const dao = this.getTileMatrixSetDao();
    try {
      if (!dao.isTableExists()) {
        created = this.tableCreator.createTileMatrixSet();
      }
    } catch (e) {
      throw new GeoPackageException('Failed to check if TileMatrixSet table exists and create it');
    }
    return created;
  }

  /**
   * Get a Tile Matrix DAO
   * @return {TileMatrixDao} Tile Matrix DAO
   */
  public getTileMatrixDao(): TileMatrixDao {
    if (this.tileMatrixDao == null) {
      this.tileMatrixDao = TileMatrixDao.createDao(this);
    }
    return this.tileMatrixDao;
  }

  /**
   * Create the Tile Matrix table if it does not already exist
   * @return {boolean} true if created
   */
  public createTileMatrixTable(): boolean {
    this.verifyWritable();

    let created = false;
    const dao = this.getTileMatrixDao();
    try {
      if (!dao.isTableExists()) {
        created = this.tableCreator.createTileMatrix();
      }
    } catch (e) {
      throw new GeoPackageException('Failed to check if TileMatrix table exists and create it');
    }
    return created;
  }

  /**
   * Create a new tile table
   * WARNING: only creates the tile table, call
   * {@link #createTileTableWithMetadata}) instead to create both the
   * table and required GeoPackage metadata
   * @param {TileTable} table tile table
   */
  public createTileTable(table: TileTable): void {
    this.createUserTable(table);
  }

  /**
   * Create a new tile table with GeoPackage metadata including: tile matrix
   * set table and row, tile matrix table, user tile table, and contents row.
   * @param {TileTableMetadata} metadata tile table metadata
   * @return {TileTable} tile table
   */
  public createTileTableWithMetadata(metadata: TileTableMetadata): TileTable {
    // Create the Tile Matrix Set and Tile Matrix tables
    this.createTileMatrixSetTable();
    this.createTileMatrixTable();

    // Create the user tile table
    const tableName = metadata.getTableName();
    const columns = metadata.buildColumns();
    const table = new TileTable(tableName, columns);
    this.createTileTable(table);

    try {
      // Create the contents
      const contents = new Contents();
      contents.setTableName(tableName);
      contents.setDataTypeName(metadata.getDataType(), ContentsDataType.TILES);
      contents.setIdentifier(tableName);
      const contentsBoundingBox = metadata.getContentsBoundingBox();
      contents.setMinX(contentsBoundingBox.getMinLongitude());
      contents.setMinY(contentsBoundingBox.getMinLatitude());
      contents.setMaxX(contentsBoundingBox.getMaxLongitude());
      contents.setMaxY(contentsBoundingBox.getMaxLatitude());
      contents.setSrsId(metadata.getContentsSrsId());
      this.getContentsDao().create(contents);

      table.setContents(contents);

      // Create new matrix tile set
      const tileMatrixSet = new TileMatrixSet();
      tileMatrixSet.setTableName(contents.getId());
      tileMatrixSet.setSrsId(metadata.getTileSrsId());
      tileMatrixSet.setBoundingBox(metadata.getTileBoundingBox());
      this.getTileMatrixSetDao().create(tileMatrixSet);
    } catch (e) {
      this.deleteTableQuietly(tableName);
      throw new GeoPackageException('Failed to create table and metadata: ' + tableName);
    }

    return table;
  }

  /**
   * Get the Spatial Reference System by id
   *
   * @param {number} srsId srs id
   * @return {SpatialReferenceSystem} srs
   */
  private getSrs(srsId: number): SpatialReferenceSystem {
    let srs;
    try {
      srs = this.getSpatialReferenceSystemDao().queryForId(srsId);
    } catch (e1) {
      throw new GeoPackageException('Failed to retrieve Spatial Reference System. SRS ID: ' + srsId);
    }
    if (srs == null) {
      throw new GeoPackageException('Spatial Reference System could not be found. SRS ID: ' + srsId);
    }
    return srs;
  }

  /**
   * Create a new attributes table
   * WARNING: only creates the attributes table, call
   * {@link #createAttributesTable(AttributesTableMetadata)}) instead to
   * create both the table and required GeoPackage metadata
   * @param table attributes table
   */
  public createAttributesTable(table: AttributesTable): void {
    this.createUserTable(table);
  }

  /**
   * Create a new attributes table with GeoPackage metadata including: user
   * attributes table and contents row.
   * @param metadata attributes table metadata
   * @return attributes table
   */
  public createAttributesTableWithMetadata(metadata: AttributesTableMetadata): AttributesTable {
    // Build the user attributes table
    const tableName = metadata.getTableName();
    const table = new AttributesTable(tableName, metadata.buildColumns());

    // Add unique constraints
    const constraints = metadata.getConstraints();
    if (constraints != null) {
      table.addConstraintsWithConstraints(constraints);
    }

    // Create the user attributes table
    this.createAttributesTable(table);

    try {
      // Create the contents
      let contents = new Contents();
      contents.setTableName(tableName);
      contents.setDataTypeName(metadata.getDataType(), ContentsDataType.ATTRIBUTES);
      contents.setIdentifier(tableName);

      this.getContentsDao().create(contents);
      contents = this.getContentsDao().refresh(contents);
      table.setContents(contents);
    } catch (e) {
      this.deleteTableQuietly(tableName);
      throw new GeoPackageException('Failed to create table and metadata: ' + tableName);
    }

    return table;
  }

  /**
   * Create the Extensions table if it does not already exist
   * @return true if created
   */
  public createExtensionsTable(): boolean {
    this.verifyWritable();

    let created = false;
    const dao = this.getExtensionsDao();
    try {
      if (!dao.isTableExists()) {
        created = this.getTableCreator().createExtensions();
      }
    } catch (e) {
      throw new GeoPackageException('Failed to check if Extensions table exists and create it');
    }
    return created;
  }

  /**
   * Delete the user table (a feature or tile table) and all GeoPackage
   * metadata
   * @param {string} table table name
   */
  public deleteTable(table: string): void {
    this.verifyWritable();
    this.getExtensionManager().deleteTableExtensions(table);
    const contentsDao = this.getContentsDao();
    contentsDao.deleteTable(table);
  }

  /**
   * Attempt to delete the user table (a feature or tile table) and all
   * GeoPackage metadata quietly
   * @param {string} tableName table name
   */
  public deleteTableQuietly(tableName: string): void {
    this.verifyWritable();

    try {
      this.deleteTable(tableName);
    } catch (e) {
      // eat
    }
  }

  /**
   * If foreign keys is disabled and there are no foreign key violations,
   * enables foreign key checks, else logs violations
   * @return {boolean} true if enabled or already enabled, false if foreign key
   * violations and not enabled
   */
  public enableForeignKeys(): boolean {
    return this.database.setForeignKeys(true);
  }

  /**
   * Query for the foreign keys value
   * @return {boolean} true if enabled, false if disabled
   */
  public foreignKeys(): boolean {
    return this.database.foreignKeys();
  }

  /**
   * Change the foreign keys state
   * @param {boolean} on true to turn on, false to turn off
   * @return {boolean} previous foreign keys value
   */
  public setForeignKeys(on: boolean): boolean {
    return this.database.setForeignKeys(on);
  }

  /**
   * Verify the GeoPackage is writable and throw an exception if it is not
   */
  public verifyWritable(): void {
    if (!this.writable) {
      throw new GeoPackageException(
        'GeoPackage file is not writable. Name: ' + this.getName() + (this.path != null ? ', Path: ' + this.path : ''),
      );
    }
  }

  /**
   * Drop the table if it exists. Drops the table with the table name, not
   * limited to GeoPackage specific tables.
   *
   * @param {string} table table name
   */
  public dropTable(table: string): void {
    this.tableCreator.dropTable(table);
  }

  /**
   * Drop the view if it exists. Drops the view with the view name, not
   * limited to GeoPackage specific tables.
   * @param {string} view view name
   */
  public dropView(view: string): void {
    this.tableCreator.dropView(view);
  }

  /**
   * Rename the table
   * @param {string} tableName table name
   * @param {string} newTableName new table name
   */
  public renameTable(tableName: string, newTableName: string): void {
    if (this.getTableDataType(tableName) != null) {
      this.copyTable(tableName, newTableName);
      this.deleteTable(tableName);
    } else {
      AlterTable.renameTable(this.database, tableName, newTableName);
    }
  }

  /**
   * Copy the table with transferred contents but no extensions
   * @param tableName table name
   * @param newTableName new table name
   */
  public copyTableNoExtensions(tableName: string, newTableName: string): void {
    this.copyTable(tableName, newTableName, true, false);
  }

  /**
   * Copy the table with transferred contents and extensions
   * @param tableName table name
   * @param newTableName new table name
   * @since 3.3.0
   */
  public copyTableAsEmpty(tableName: string, newTableName: string): void {
    this.copyTable(tableName, newTableName, false, false);
  }

  /**
   * Copy the table
   * @param tableName table name
   * @param newTableName new table name
   * @param transferContent transfer content flag
   * @param extensions extensions copy flag
   */
  public copyTable(tableName: string, newTableName: string, transferContent = true, extensions = true): void {
    const dataType = this.getTableDataType(tableName);
    if (dataType != null) {
      switch (dataType) {
        case ContentsDataType.ATTRIBUTES:
          this.copyAttributeTable(tableName, newTableName, transferContent);
          break;
        case ContentsDataType.FEATURES:
          this.copyFeatureTable(tableName, newTableName, transferContent);
          break;
        case ContentsDataType.TILES:
          this.copyTileTable(tableName, newTableName, transferContent);
          break;
        default:
          throw new GeoPackageException('Unsupported data type: ' + dataType);
      }
    } else {
      this.copyUserTable(tableName, newTableName, transferContent, false);
    }

    // Copy extensions
    if (extensions) {
      this.getExtensionManager().copyTableExtensions(tableName, newTableName);
    }
  }

  /**
   * Copy the attribute table
   * @param tableName table name
   * @param newTableName new table name
   * @param transferContent transfer content flag
   */
  protected copyAttributeTable(tableName: string, newTableName: string, transferContent: boolean): void {
    this.copyUserTable(tableName, newTableName, transferContent);
  }

  /**
   * Copy the feature table
   *
   * @param tableName table name
   * @param newTableName new table name
   * @param transferContent transfer content flag
   */
  protected copyFeatureTable(tableName: string, newTableName: string, transferContent: boolean): void {
    const geometryColumnsDao = this.getGeometryColumnsDao();
    let geometryColumns = null;
    try {
      geometryColumns = geometryColumnsDao.queryForTableName(tableName);
    } catch (e) {
      throw new GeoPackageException('Failed to retrieve table geometry columns: ' + tableName);
    }
    if (geometryColumns == null) {
      throw new GeoPackageException('No geometry columns for table: ' + tableName);
    }

    const contents = this.copyUserTable(tableName, newTableName, transferContent);
    geometryColumns.setTableName(contents.getId());
    try {
      geometryColumnsDao.create(geometryColumns);
    } catch (e) {
      throw new GeoPackageException('Failed to create geometry columns for feature table: ' + newTableName);
    }
  }

  /**
   * Copy the tile table
   *
   * @param tableName table name
   * @param newTableName new table name
   * @param transferContent transfer content flag
   */
  protected copyTileTable(tableName: string, newTableName: string, transferContent: boolean): void {
    const tileMatrixSetDao = this.getTileMatrixSetDao();
    let tileMatrixSet = null;
    try {
      tileMatrixSet = tileMatrixSetDao.queryForId(tableName);
    } catch (e) {
      throw new GeoPackageException('Failed to retrieve table tile matrix set: ' + tableName);
    }
    if (tileMatrixSet == null) {
      throw new GeoPackageException('No tile matrix set for table: ' + tableName);
    }

    const tileMatrixDao = this.getTileMatrixDao();
    let tileMatrices = null;
    try {
      tileMatrices = tileMatrixDao.queryForEq(TileMatrix.COLUMN_TABLE_NAME, tableName);
    } catch (e) {
      throw new GeoPackageException('Failed to retrieve table tile matrices: ' + tableName);
    }

    const contents = this.copyUserTable(tableName, newTableName, transferContent);
    tileMatrixSet.setTableName(contents.getId());
    try {
      tileMatrixSetDao.create(tileMatrixSet);
    } catch (e) {
      throw new GeoPackageException('Failed to create tile matrix set for tile table: ' + newTableName);
    }

    for (const tileMatrix of tileMatrices) {
      tileMatrix.setTableName(contents.getId());
      try {
        tileMatrixDao.create(tileMatrix);
      } catch (e) {
        throw new GeoPackageException('Failed to create tile matrix for tile table: ' + newTableName);
      }
    }
  }

  /**
   * Copy the user table
   *
   * @param tableName table name
   * @param newTableName new table name
   * @param transferContent transfer user table content flag
   * @param validateContents true to validate
   * @return copied contents
   */
  protected copyUserTable(
    tableName: string,
    newTableName: string,
    transferContent: boolean,
    validateContents = true,
  ): Contents {
    AlterTable.copyTableWithName(this.database, tableName, newTableName, transferContent);
    const contents = this.copyContents(tableName, newTableName);
    if (contents == null && validateContents) {
      throw new GeoPackageException('No table found: Contents for table: ' + tableName);
    }
    return contents;
  }

  /**
   * Copy the contents
   * @param tableName table name
   * @param newTableName new table name
   * @return copied contents
   */
  protected copyContents(tableName: string, newTableName: string): Contents {
    const contents = this.getTableContents(tableName);
    if (contents != null) {
      contents.setTableName(newTableName);
      contents.setIdentifier(newTableName);
      try {
        this.getContentsDao().create(contents);
      } catch (e) {
        throw new GeoPackageException(
          'Failed to create for: Contents table: ' + newTableName + ', copied from table: ' + tableName,
        );
      }
    }

    return contents;
  }

  /**
   * Rebuild the GeoPackage, repacking it into a minimal amount of disk space
   */
  public vacuum(): void {
    SQLUtils.vacuum(this.database);
  }

  /**
   * Create a new user table
   * @param {UserTable<UserColumn>} table user table
   */
  public createUserTable(table: UserTable<UserColumn>): void {
    this.verifyWritable();
    this.tableCreator.createUserTable(table);
  }

  /**
   * Get table info using TileDao or FeatureDao
   * @param {TileDao | FeatureDao} tableDao
   */
  getInfoForTable(tableDao: TileDao | FeatureDao): any {
    const info = {
      tableName: tableDao.getTableName(),
      tableType: tableDao.getTable().getDataType(),
      count: tableDao.count(),
      geometryColumns: undefined as {
        tableName: string;
        geometryColumn: string;
        geometryTypeName: string;
        z?: number;
        m?: number;
      },
      minZoom: undefined as number,
      maxZoom: undefined as number,
      minWebMapZoom: undefined as number,
      maxWebMapZoom: undefined as number,
      zoomLevels: undefined as number,
      tileMatrixSet: undefined as {
        srsId: number;
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
      },
      contents: undefined as {
        tableName: string;
        dataType: string;
        identifier: string;
        description: string;
        lastChange: Date;
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
        srs: {
          name: string;
          id: number;
          organization: string;
          organization_coordsys_id: number;
          definition: string;
          description: string;
        };
      },
      srs: undefined as {
        name: string;
        id: number;
        organization: string;
        organization_coordsys_id: number;
        definition: string;
        description: string;
      },
      columns: undefined as {
        index: number;
        name: string;
        max?: number;
        min?: number;
        notNull?: boolean;
        primaryKey?: boolean;
        dataType?: GeoPackageDataType;
        displayName: string;
        dataColumn?: DataColumns;
      }[],
      columnMap: {},
    };
    if (tableDao instanceof FeatureDao) {
      info.geometryColumns = {
        tableName: tableDao.getGeometryColumns().getTableName(),
        geometryColumn: tableDao.getGeometryColumns().getColumnName(),
        geometryTypeName: tableDao.getGeometryColumns().getGeometryTypeName(),
        z: tableDao.getGeometryColumns().getZ(),
        m: tableDao.getGeometryColumns().getM(),
      };
    }
    if (tableDao instanceof TileDao) {
      info.minZoom = tableDao.getMinZoom();
      info.maxZoom = tableDao.getMaxZoom();
      info.minWebMapZoom = tableDao.getMapMinZoom();
      info.maxWebMapZoom = tableDao.getMapMaxZoom();
      info.zoomLevels = tableDao.getTileMatrices().length;
    }
    let contents: Contents;
    if (tableDao instanceof FeatureDao) {
      contents = this.getContentsDao().queryForIdWithKey(tableDao.getGeometryColumns().getTableName());
    } else if (tableDao instanceof TileDao) {
      contents = this.getContentsDao().queryForIdWithKey(tableDao.getTileMatrixSet().getTableName());
      info.tileMatrixSet = {
        srsId: tableDao.getTileMatrixSet().getSrsId(),
        minX: tableDao.getTileMatrixSet().getMinX(),
        maxX: tableDao.getTileMatrixSet().getMaxX(),
        minY: tableDao.getTileMatrixSet().getMinY(),
        maxY: tableDao.getTileMatrixSet().getMaxY(),
      };
    }

    const contentsSrs = this.getSpatialReferenceSystemDao().getBySrsId(contents.getSrsId());
    info.contents = {
      tableName: contents.getTableName(),
      dataType: contents.getDataTypeName(),
      identifier: contents.getIdentifier(),
      description: contents.getDescription(),
      lastChange: contents.getLastChange(),
      minX: contents.getMinX(),
      maxX: contents.getMaxX(),
      minY: contents.getMinY(),
      maxY: contents.getMaxY(),
      srs: {
        name: contentsSrs.getSrsName(),
        id: contentsSrs.getSrsId(),
        organization: contentsSrs.getOrganization(),
        organization_coordsys_id: contentsSrs.getOrganizationCoordsysId(),
        definition: contentsSrs.getDefinition(),
        description: contentsSrs.getDescription(),
      },
    };
    info.contents.srs = {
      name: contentsSrs.getSrsName(),
      id: contentsSrs.getSrsId(),
      organization: contentsSrs.getOrganization(),
      organization_coordsys_id: contentsSrs.getOrganizationCoordsysId(),
      definition: contentsSrs.getDefinition(),
      description: contentsSrs.getDescription(),
    };
    const srs = tableDao.getSrs();
    info.srs = {
      name: srs.getSrsName(),
      id: srs.getSrsId(),
      organization: srs.getOrganization(),
      organization_coordsys_id: srs.getOrganizationCoordsysId(),
      definition: srs.getDefinition(),
      description: srs.getDescription(),
    };
    info.columns = [];
    info.columnMap = {};
    const dcd = this.getDataColumnsDao();
    tableDao
      .getTable()
      .getUserColumns()
      .getColumns()
      .forEach(
        function (column: UserColumn): any {
          const dataColumn = dcd.getDataColumns(tableDao.getTable().getTableName(), column.getName());
          info.columns.push({
            index: column.getIndex(),
            name: column.getName(),
            max: column.getMax(),
            notNull: column.isNotNull(),
            primaryKey: column.isPrimaryKey(),
            dataType: column.getDataType(),
            displayName: dataColumn && dataColumn.getName() ? dataColumn.getName() : column.getName(),
            dataColumn: dataColumn,
          });
          info.columnMap[column.getName()] = info.columns[info.columns.length - 1];
        }.bind(this),
      );
    return info;
  }

  /**
   * Calls TableCreator's create required
   */
  public createRequiredTables(): void {
    this.tableCreator.createRequired();
  }

  /**
   * Creates supported extensions
   */
  public createSupportedExtensions(): void {
    const crs = new CrsWktExtension(this);
    crs.getOrCreateExtension();
    const schema = new SchemaExtension(this);
    schema.getOrCreateExtension();
  }

  /**
   * Gets the extension manager
   */
  public getExtensionManager(): ExtensionManager {
    if (this.extensionManager == null) {
      this.extensionManager = new ExtensionManager(this);
    }
    return this.extensionManager;
  }

  /**
   * Returns the ExtensionsDao
   */
  public getExtensionsDao(): ExtensionsDao {
    if (this.extensionsDao == null) {
      this.extensionsDao = ExtensionsDao.createDao(this);
    }
    return this.extensionsDao;
  }

  /**
   * Returns the TableIndexDao
   */
  public getTableIndexDao(): TableIndexDao {
    if (this.tableIndexDao == null) {
      this.tableIndexDao = TableIndexDao.createDao(this);
    }
    return this.tableIndexDao;
  }

  /**
   * Returns the TileScalingDao
   */
  public getTileScalingDao(): TileScalingDao {
    if (this.tileScalingDao == null) {
      this.tileScalingDao = TileScalingDao.createDao(this);
    }
    return this.tileScalingDao;
  }

  /**
   * Get the Geometry Index Dao
   */
  getGeometryIndexDao(): GeometryIndexDao {
    if (this.geometryIndexDao == null) {
      this.geometryIndexDao = GeometryIndexDao.createDao(this);
    }
    return this.geometryIndexDao;
  }

  /**
   * Get the data columns dao
   */
  getDataColumnsDao(): DataColumnsDao {
    if (this.dataColumnsDao == null) {
      this.dataColumnsDao = DataColumnsDao.createDao(this);
    }
    return this.dataColumnsDao;
  }

  /**
   * Get the data columns dao
   */
  getDataColumnConstraintsDao(): DataColumnConstraintsDao {
    if (this.dataColumnConstraintsDao == null) {
      this.dataColumnConstraintsDao = DataColumnConstraintsDao.createDao(this);
    }
    return this.dataColumnConstraintsDao;
  }

  /**
   * Get the extended relations dao
   */
  getExtendedRelationsDao(): ExtendedRelationsDao {
    if (this.extendedRelationsDao == null) {
      this.extendedRelationsDao = ExtendedRelationsDao.createDao(this);
    }
    return this.extendedRelationsDao;
  }

  /**
   * Get the metadata reference dao
   */
  getMetadataReferenceDao(): MetadataReferenceDao {
    if (this.metadataReferenceDao == null) {
      this.metadataReferenceDao = MetadataReferenceDao.createDao(this);
    }
    return this.metadataReferenceDao;
  }

  /**
   * Get the metadata reference dao
   */
  getMetadataDao(): MetadataDao {
    if (this.metadataDao == null) {
      this.metadataDao = MetadataDao.createDao(this);
    }
    return this.metadataDao;
  }

  /**
   * Get the contents id dao
   */
  getContentsIdDao(): ContentsIdDao {
    if (this.contentsIdDao == null) {
      this.contentsIdDao = ContentsIdDao.createDao(this);
    }
    return this.contentsIdDao;
  }

  /**
   * Get the SpatialReferenceSystemDao
   */
  public getSpatialReferenceSystemDao(): SpatialReferenceSystemDao {
    if (this.spatialReferenceSystemDao == null) {
      this.spatialReferenceSystemDao = SpatialReferenceSystemDao.createDao(this);
      this.spatialReferenceSystemDao.setCrsWktExtension(new CrsWktExtension(this));
    }
    return this.spatialReferenceSystemDao;
  }

  /**
   * Get the Contents Dao
   */
  public getContentsDao(): ContentsDao {
    if (this.contentsDao == null) {
      this.contentsDao = ContentsDao.createDao(this);
    }
    return this.contentsDao;
  }

  /**
   * Get the GeometryColumnsDao
   */
  public getGeometryColumnsDao(): GeometryColumnsDao {
    if (this.geometryColumnsDao == null) {
      this.geometryColumnsDao = GeometryColumnsDao.createDao(this);
    }
    return this.geometryColumnsDao;
  }

  /**
   * Index all feature tables
   * @param featureIndexType
   * @param force
   * @param progress
   */
  public index(featureIndexType: FeatureIndexType, force?: boolean, progress?: GeoPackageProgress): boolean {
    const tables = this.getFeatureTables();
    for (let i = 0; i < tables.length; i++) {
      if (!this.indexFeatureTable(tables[i], featureIndexType, force, progress)) {
        throw new GeoPackageException('Unable to index table ' + tables[i]);
      }
    }
    return true;
  }

  /**
   * Index feature table
   * @param table
   * @param featureIndexType
   * @param force
   * @param progress
   */
  public indexFeatureTable(
    table: string,
    featureIndexType: FeatureIndexType,
    force?: boolean,
    progress?: GeoPackageProgress,
  ): boolean {
    const indexManager = new FeatureIndexManager(this, table);
    const indexed = indexManager.isIndexedForType(featureIndexType);
    if (!indexed) {
      indexManager.setProgress(progress);
      indexManager.indexType(featureIndexType, force);
    }
    return indexed;
  }

  /**
   * Get the feature index manager for the provided feature table name or feature dao
   * @param featureTableNameOrDao
   */
  public getFeatureIndexManager(featureTableNameOrDao: string | FeatureDao): FeatureIndexManager {
    return new FeatureIndexManager(this, featureTableNameOrDao);
  }

  /**
   * Queries for features in a feature table
   * @param  {String}   tableName   Table name to query
   * @param  {BoundingBox}  boundingBox BoundingBox to query
   * @returns {FeatureIndexResults} Feature Index Results
   */
  queryForFeatures(tableName: string, boundingBox?: BoundingBox): FeatureIndexResults {
    const featureIndexManager = this.getFeatureIndexManager(tableName);
    return boundingBox != null ? featureIndexManager.queryWithBoundingBox(boundingBox) : featureIndexManager.query();
  }

  /**
   * Query feature table and convert results to GeoJSON Features
   *  Note - unsupported geometry types will be omitted from the results.
   * @param tableName
   * @param boundingBox - must be in same projection as the feature table
   */
  queryForGeoJSONFeatures(tableName: string, boundingBox?: BoundingBox): GeoJSONResultSet {
    const featureIndexManager = this.getFeatureIndexManager(tableName);
    return featureIndexManager.queryForGeoJSONFeatures(boundingBox);
  }

  /**
   * Create a media table
   * @param mediaTableName
   * @param additionalColumns
   */
  createMediaTable(mediaTableName: string, additionalColumns: UserCustomColumn[]): boolean {
    return this.createMediaTableWithMetadata(MediaTableMetadata.create(mediaTableName, additionalColumns));
  }

  /**
   * Create a media table with media table metadata
   * @param mediaTableMetadata
   */
  createMediaTableWithMetadata(mediaTableMetadata: MediaTableMetadata): boolean {
    let created = false;
    if (!this.isTable(mediaTableMetadata.getTableName())) {
      const rte = this.getRelatedTablesExtension();
      created = rte.createRelatedTable(MediaTable.create(mediaTableMetadata));
    }
    return created;
  }

  /**
   * Create a media table with a media table
   * @param mediaTable
   */
  createMediaTableWithTable(mediaTable: MediaTable): boolean {
    let created = false;
    if (!this.isTable(mediaTable.getTableName())) {
      const rte = this.getRelatedTablesExtension();
      created = rte.createRelatedTable(mediaTable);
    }
    return created;
  }

  /**
   * Create a simple attributes table
   * @param simpleAttributesTableName
   * @param additionalColumns
   */
  createSimpleAttributesTable(simpleAttributesTableName: string, additionalColumns: UserCustomColumn[]): boolean {
    return this.createSimpleAttributesWithMetadata(
      SimpleAttributesTableMetadata.create(simpleAttributesTableName, additionalColumns),
    );
  }

  /**
   * Create a simple attributes table with media table metadata
   * @param simpleAttributesTableMetadata
   */
  createSimpleAttributesWithMetadata(simpleAttributesTableMetadata: SimpleAttributesTableMetadata): boolean {
    let created = false;
    if (!this.isTable(simpleAttributesTableMetadata.getTableName())) {
      try {
        const rte = this.getRelatedTablesExtension();
        created = rte.createRelatedTable(SimpleAttributesTable.createWithMetadata(simpleAttributesTableMetadata));
      } catch (e) {
        // failed to create, or columns were invalid the simple attributes table
        created = false;
      }
    }
    return created;
  }

  /**
   * Create a simple attributes table with a simple attributes table
   * @param simpleAttributesTable
   */
  createSimpleAttributesTableWithTable(simpleAttributesTable: SimpleAttributesTable): boolean {
    let created = false;
    if (!this.isTable(simpleAttributesTable.getTableName())) {
      try {
        const rte = this.getRelatedTablesExtension();
        created = rte.createRelatedTable(simpleAttributesTable);
      } catch (e) {
        // failed to create, or columns were invalid the simple attributes table
        created = false;
      }
    }
    return created;
  }

  /**
   * Link media to another table
   * @param baseTableName
   * @param baseId
   * @param mediaTableName
   * @param mediaRowId
   */
  linkMedia(baseTableName: string, baseId: number, mediaTableName: string, mediaRowId: number): number {
    return this.linkRelatedRows(baseTableName, baseId, mediaTableName, mediaRowId, RelationType.MEDIA);
  }

  /**
   * Link simple attribute to another table
   * @param baseTableName
   * @param baseId
   * @param simpleAttributesTableName
   * @param simpleAttributesRowId
   */
  linkSimpleAttributes(
    baseTableName: string,
    baseId: number,
    simpleAttributesTableName: string,
    simpleAttributesRowId: number,
  ): number {
    return this.linkRelatedRows(
      baseTableName,
      baseId,
      simpleAttributesTableName,
      simpleAttributesRowId,
      RelationType.SIMPLE_ATTRIBUTES,
    );
  }

  /**
   * Link attribute to another table
   * @param baseTableName
   * @param baseId
   * @param attributesTableName
   * @param attributesRowId
   */
  linkAttributes(baseTableName: string, baseId: number, attributesTableName: string, attributesRowId: number): number {
    return this.linkRelatedRows(baseTableName, baseId, attributesTableName, attributesRowId, RelationType.ATTRIBUTES);
  }

  /**
   * Link feature to another table
   * @param baseTableName
   * @param baseId
   * @param featureTableName
   * @param featureRowId
   */
  linkFeature(baseTableName: string, baseId: number, featureTableName: string, featureRowId: number): number {
    return this.linkRelatedRows(baseTableName, baseId, featureTableName, featureRowId, RelationType.FEATURES);
  }

  /**
   * Link tile to another table
   * @param baseTableName
   * @param baseId
   * @param tileTableName
   * @param tileRowId
   */
  linkTile(baseTableName: string, baseId: number, tileTableName: string, tileRowId: number): number {
    return this.linkRelatedRows(baseTableName, baseId, tileTableName, tileRowId, RelationType.TILES);
  }

  /**
   * Links related rows together
   * @param baseId
   * @param baseTableName
   * @param relatedId
   * @param relatedTableName
   * @param  {string} relationType        relation type
   * @param  {string|UserMappingTable} [mappingTable]        mapping table
   * @param  {ColumnValues} [mappingColumnValues] column values
   * @return {number}
   */
  linkRelatedRows(
    baseTableName: string,
    baseId: number,
    relatedTableName: string,
    relatedId: number,
    relationType: RelationType,
    mappingTable?: string | UserMappingTable,
    mappingColumnValues?: Record<string, any>,
  ): number {
    const rte = this.getRelatedTablesExtension();
    let mappingTableName: string;
    if (mappingTable instanceof UserMappingTable) {
      mappingTableName = mappingTable.getTableName();
      rte.addRelationshipWithMappingTableAndRelationName(
        baseTableName,
        relatedTableName,
        mappingTable,
        relationType.getName(),
      );
    } else {
      const extension = new ExtendedRelation();
      extension.setBaseTableName(baseTableName);
      extension.setRelatedTableName(relatedTableName);
      extension.setRelationName(relationType.getName());
      mappingTable = mappingTable || baseTableName + '_' + relatedTableName;
      mappingTableName = mappingTable as string;
      extension.setMappingTableName(mappingTableName);
      rte.addRelationshipWithExtendedRelation(extension);
    }
    const userMappingDao = rte.getUserMappingDao(mappingTableName);
    const userMappingRow = userMappingDao.newRow();
    userMappingRow.setBaseId(baseId);
    userMappingRow.setRelatedId(relatedId);
    for (const column in mappingColumnValues) {
      userMappingRow.setValue(column, mappingColumnValues[column]);
    }
    return userMappingDao.create(userMappingRow);
  }

  /**
   * Get Media associated with a particular row.
   * @param baseTableName
   * @param baseId
   */
  getLinkedMedia(baseTableName: string, baseId: number): MediaRow[] {
    const extendedRelationsMap = this.getRelatedRows(baseTableName, baseId, [RelationType.MEDIA]);
    const rows = [];
    for (const extendedRelation of extendedRelationsMap.keys()) {
      const mappingRowMap = extendedRelationsMap.get(extendedRelation);
      for (const mappingRow of mappingRowMap.keys()) {
        const row = mappingRowMap.get(mappingRow);
        rows.push(row as MediaRow);
      }
    }
    return rows;
  }

  /**
   * Get Simple Attributes associated with a particular row.
   * @param baseTableName
   * @param baseId
   */
  getLinkedSimpleAttributes(baseTableName: string, baseId: number): SimpleAttributesRow[] {
    const extendedRelationsMap = this.getRelatedRows(baseTableName, baseId, [RelationType.SIMPLE_ATTRIBUTES]);
    const rows = [];
    for (const extendedRelation of extendedRelationsMap.keys()) {
      const mappingRowMap = extendedRelationsMap.get(extendedRelation);
      for (const mappingRow of mappingRowMap.keys()) {
        const row = mappingRowMap.get(mappingRow);
        rows.push(row as SimpleAttributesRow);
      }
    }
    return rows;
  }

  /**
   * Get Attributes associated with a particular row.
   * @param baseTableName
   * @param baseId
   */
  getLinkedAttributes(baseTableName: string, baseId: number): AttributesRow[] {
    const extendedRelationsMap = this.getRelatedRows(baseTableName, baseId, [RelationType.ATTRIBUTES]);
    const rows = [];
    for (const extendedRelation of extendedRelationsMap.keys()) {
      const mappingRowMap = extendedRelationsMap.get(extendedRelation);
      for (const mappingRow of mappingRowMap.keys()) {
        const row = mappingRowMap.get(mappingRow);
        rows.push(row as AttributesRow);
      }
    }
    return rows;
  }

  /**
   * Get Features associated with a particular row.
   * @param baseTableName
   * @param baseId
   */
  getLinkedFeatures(baseTableName: string, baseId: number): FeatureRow[] {
    const extendedRelationsMap = this.getRelatedRows(baseTableName, baseId, [RelationType.FEATURES]);
    const rows = [];
    for (const extendedRelation of extendedRelationsMap.keys()) {
      const mappingRowMap = extendedRelationsMap.get(extendedRelation);
      for (const mappingRow of mappingRowMap.keys()) {
        const row = mappingRowMap.get(mappingRow);
        rows.push(row as FeatureRow);
      }
    }
    return rows;
  }

  /**
   * Get Tiles associated with a particular row.
   * @param baseTableName
   * @param baseId
   */
  getLinkedTiles(baseTableName: string, baseId: number): TileRow[] {
    const extendedRelationsMap = this.getRelatedRows(baseTableName, baseId, [RelationType.TILES]);
    const rows = [];
    for (const extendedRelation of extendedRelationsMap.keys()) {
      const mappingRowMap = extendedRelationsMap.get(extendedRelation);
      for (const mappingRow of mappingRowMap.keys()) {
        const row = mappingRowMap.get(mappingRow);
        rows.push(row as TileRow);
      }
    }
    return rows;
  }

  /**
   * Adds a list of features to a FeatureTable, inserting them in batches and providing progress updates
   * after each batch completes.
   * @param  {object}   features    GeoJSON features to add
   * @param  {string}   tableName  name of the table that will store the feature
   * @param {boolean} index updates the FeatureTableIndex extension if it exists
   * @param {number} batchSize how many features are inserted in a single transaction,
   * progress is published after each batch is inserted. 1000 is recommended, 100 is about 25% slower,
   * but provides more updates and keeps the thread open.
   * @param  {function}  progress  optional progress function that is called after a batch of features has been
   * processed. The number of features added is sent as an argument to that function.
   * @return {Promise<number>} number of features inserted
   */
  async addGeoJSONFeaturesToGeoPackage(
    features: Feature[],
    tableName: string,
    index = false,
    batchSize = 1000,
    progress?: GeoPackageProgress,
  ): Promise<number> {
    let inserted = 0;
    const featureDao = this.getFeatureDao(tableName);
    const connectionSource = featureDao.getFeatureDb().getConnection().getConnectionSource();
    const srs = featureDao.getSrs();
    let reprojectFunction = (geometry): Geometry => geometry;
    if (!srs.getProjection().equalsProjection(Projections.getWGS84Projection())) {
      const geometryTransform = new GeometryTransform(Projections.getWGS84Projection(), srs.getProjection());
      reprojectFunction = (geometry): Geometry => geometryTransform.transformGeometry(geometry);
    }
    let geometryData;
    let featureRow = featureDao.newRow();
    if (progress != null) {
      progress.setMax(features.length);
    }

    const insertSql = SqliteQueryBuilder.buildInsert(SQLUtils.quoteWrap(featureDao.getTableName()), featureRow);

    const stepFunction = async (start: number, end: number, resolve: Function): Promise<void> => {
      // execute step if there are still features
      if (start < end) {
        connectionSource.transaction(() => {
          // builds the insert sql statement
          const insertStatement = connectionSource.prepareStatement(insertSql);

          // determine if indexing is needed
          let tableIndex;
          const featureIndexManager = new FeatureIndexManager(this, featureDao);
          let fti;
          if (index && featureIndexManager.isIndexedForType(FeatureIndexType.GEOPACKAGE)) {
            fti = new FeatureIndexManager(this, featureDao).getFeatureTableIndex();
            tableIndex = fti.getTableIndex();
          } else if (index && !featureIndexManager.isIndexedForType(FeatureIndexType.RTREE)) {
            featureIndexManager.indexType(FeatureIndexType.RTREE);
          }

          for (let i = start; i < end; i++) {
            const feature = features[i];
            featureRow = featureDao.newRow();
            // convert GeoJSON to Simple Features
            let geometry = FeatureConverter.toSimpleFeaturesGeometry(feature);
            // reproject to target projection
            geometry = reprojectFunction(geometry);
            // setup geometry data
            geometryData = new GeoPackageGeometryData(srs.getSrsId(), geometry, false);
            featureRow.setGeometry(geometryData);
            for (const propertyKey in feature.properties) {
              if (Object.prototype.hasOwnProperty.call(feature.properties, propertyKey)) {
                featureRow.setValue(propertyKey, feature.properties[propertyKey]);
              }
            }
            // bind this feature's data to the insert statement and insert into the table
            const contentValues = featureRow.toContentValues(true);
            const insertOrUpdate: { [key: string]: DBValue } = {};
            insertOrUpdate[featureRow.getColumns().getPkColumnName()] = undefined;
            for (const key of contentValues.keySet()) {
              insertOrUpdate[key] = contentValues.get(key);
            }
            const id = connectionSource.bindAndInsert(insertStatement, insertOrUpdate);
            inserted++;
            // if table index exists, be sure to index the row (note, rtree will run using a trigger)
            if (tableIndex != null) {
              fti.indexWithGeometryIdAndGeometryData(tableIndex, id, geometryData);
            }
          }
          if (tableIndex != null) {
            fti.updateLastIndexedWithTableIndex(tableIndex);
          }
          // close the prepared statement
          connectionSource.closeStatement(insertStatement);
        });
        if (progress != null) {
          progress.addProgress(end - start);
        }
        setTimeout(() => {
          stepFunction(end, Math.min(end + batchSize, features.length), resolve);
        });
      } else {
        resolve(inserted);
      }
    };

    return new Promise((resolve) => {
      setTimeout(() => {
        stepFunction(0, Math.min(batchSize, features.length), resolve);
      });
    });
  }

  /**
   * Add a GeoJSON feature to an existing GeoPackage feature table.
   * @param feature
   * @param tableName
   * @param {FeatureIndexType} index
   */
  addGeoJSONFeatureToGeoPackage(
    feature: Feature,
    tableName: string,
    index: FeatureIndexType = FeatureIndexType.GEOPACKAGE,
  ): number {
    const featureDao = this.getFeatureDao(tableName);
    return this.addGeoJSONFeatureToGeoPackageWithFeatureDaoAndSrs(feature, featureDao, featureDao.getSrs(), index);
  }

  /**
   * Adds a GeoJSON feature to an existing feature table
   * @param feature
   * @param featureDao
   * @param srs
   * @param index
   */
  addGeoJSONFeatureToGeoPackageWithFeatureDaoAndSrs(
    feature: Feature,
    featureDao: FeatureDao,
    srs: SpatialReferenceSystem,
    index: FeatureIndexType = FeatureIndexType.GEOPACKAGE,
  ): number {
    const featureRow = featureDao.newRow();
    const geometryData = new GeoPackageGeometryData();
    geometryData.setSrsId(srs.getSrsId());
    // convert GeoJSON to Simple Features
    let geometry = feature.geometry != null ? FeatureConverter.toSimpleFeaturesGeometry(feature) : null;
    // reproject to target projection
    if (!srs.getProjection().equalsProjection(Projections.getWGS84Projection())) {
      geometry = new GeometryTransform(Projections.getWGS84Projection(), srs.getProjection()).transformGeometry(
        geometry,
      );
    }
    geometryData.setGeometry(geometry);
    featureRow.setGeometry(geometryData);
    for (const propertyKey in feature.properties) {
      if (Object.prototype.hasOwnProperty.call(feature.properties, propertyKey)) {
        featureRow.setValue(propertyKey, feature.properties[propertyKey]);
      }
    }
    const id = featureDao.create(featureRow);
    if (index != null && index != FeatureIndexType.NONE) {
      const featureIndexManager = new FeatureIndexManager(this, featureDao);
      if (featureIndexManager.isIndexed()) {
        featureIndexManager.indexRowWithType(featureRow, index);
      }
    }
    return id;
  }

  /**
   * Gets the column and values for a record
   * @param columns
   * @param row
   * @private
   */
  private getColumnAndValuesForRecord(
    columns: UserColumns<any>,
    row: Record<string, DBValue>,
  ): { columnTypes: number[]; values: DBValue[] } {
    const columnTypes = [];
    const values = [];
    try {
      for (let index = 0; index < columns.columnCount(); index++) {
        const column = columns.getColumnForIndex(index);
        values.push(row[column.getName()]);
        columnTypes.push(column.getDataType());
      }
    } catch (e) {
      throw new GeoPackageException('Failed to retrieve the row');
    }
    return {
      columnTypes,
      values,
    };
  }

  /**
   * Add a row
   * @param tableName
   * @param row
   */
  addAttributesRow(tableName: string, row: Record<string, DBValue>): number {
    const attributesDao = this.getAttributesDao(tableName);
    const attributesTable = attributesDao.getTable();
    const attributesColumns = new AttributesColumns(tableName, attributesTable.getColumns(), true);
    const { columnTypes, values } = this.getColumnAndValuesForRecord(attributesColumns, row);
    const attributeRow = new AttributesRow(attributesTable, attributesColumns, columnTypes, values);
    return attributesDao.create(attributeRow);
  }

  /**
   * Add media to a GeoPackage
   * @param tableName
   * @param dataBuffer
   * @param contentType
   * @param additionalProperties
   */
  addMedia(
    tableName: string,
    dataBuffer: Buffer,
    contentType: string,
    additionalProperties?: Record<string, DBValue>,
  ): number {
    const userCustomDao = this.getUserCustomDao(tableName);
    const mediaDao = new MediaDao(userCustomDao);
    const row = mediaDao.newRow();
    row.setContentType(contentType);
    row.setData(dataBuffer);
    for (const key in additionalProperties) {
      row.setValue(key, additionalProperties[key]);
    }
    return mediaDao.create(row);
  }

  /**
   * Get related rows
   * @param baseTableName
   * @param baseId
   * @param typeFilter
   */
  getRelatedRows(
    baseTableName: string,
    baseId: number,
    typeFilter?: RelationType[],
  ): Map<ExtendedRelation, Map<UserMappingRow, UserRow<any, any>>> {
    return this.getRelatedTablesExtension().getRelatedRows(baseTableName, baseId, typeFilter);
  }

  /**
   * Adds a spatial reference system to the gpkg_spatial_ref_sys table to be used by feature and tile tables.
   * @param spatialReferenceSystem
   */
  createSpatialReferenceSystem(spatialReferenceSystem: SpatialReferenceSystem): void {
    Projections.setProjection(
      spatialReferenceSystem.getOrganization().toUpperCase(),
      spatialReferenceSystem.getOrganizationCoordsysId(),
      spatialReferenceSystem.getDefinition(),
    );
    this.getSpatialReferenceSystemDao().create(spatialReferenceSystem);
  }

  /**
   * Create a new [tile table]{@link TileTable} in this GeoPackage.
   *
   * @param {String} tableName tile table name
   * @param {BoundingBox} contentsBoundingBox bounding box of the contents table
   * @param {Number} contentsSrsId srs id of the contents table
   * @param {BoundingBox} tileMatrixSetBoundingBox bounding box of the matrix set
   * @param {Number} tileMatrixSetSrsId srs id of the matrix set
   * @returns {TileMatrixSet} `Promise` of the created {@link TileMatrixSet}
   */
  createTileTableWithTableName(
    tableName: string,
    contentsBoundingBox: BoundingBox,
    contentsSrsId: number,
    tileMatrixSetBoundingBox: BoundingBox,
    tileMatrixSetSrsId: number,
  ): TileMatrixSet {
    let srs = this.getSpatialReferenceSystemDao().getBySrsId(contentsSrsId);
    if (!srs) {
      throw new GeoPackageException('Spatial reference system (' + contentsSrsId + ') is not defined.');
    }
    srs = this.getSpatialReferenceSystemDao().getBySrsId(tileMatrixSetSrsId);
    if (!srs) {
      throw new GeoPackageException('Spatial reference system (' + tileMatrixSetSrsId + ') is not defined.');
    }
    const columns = TileTable.createRequiredColumns();
    const tileTable = new TileTable(tableName, columns);
    const contents = new Contents();
    contents.setTableName(tableName);
    contents.setDataType(ContentsDataType.TILES);
    contents.setIdentifier(tableName);
    // contents.setLastChange(new Date());
    contents.setMinX(contentsBoundingBox.getMinLongitude());
    contents.setMinY(contentsBoundingBox.getMinLatitude());
    contents.setMaxX(contentsBoundingBox.getMaxLongitude());
    contents.setMaxY(contentsBoundingBox.getMaxLatitude());
    contents.setSrsId(contentsSrsId);
    const tileMatrixSet = new TileMatrixSet();
    tileMatrixSet.setTableName(tableName);
    tileMatrixSet.setSrsId(tileMatrixSetSrsId);
    tileMatrixSet.setMinX(tileMatrixSetBoundingBox.getMinLongitude());
    tileMatrixSet.setMinY(tileMatrixSetBoundingBox.getMinLatitude());
    tileMatrixSet.setMaxX(tileMatrixSetBoundingBox.getMaxLongitude());
    tileMatrixSet.setMaxY(tileMatrixSetBoundingBox.getMaxLatitude());
    this.createTileMatrixSetTable();
    this.createTileMatrixTable();
    this.createTileTable(tileTable);
    this.getContentsDao().create(contents);
    this.getTileMatrixSetDao().create(tileMatrixSet);
    return tileMatrixSet;
  }

  /**
   * Create the [tables and rows](https://www.geopackage.org/spec121/index.html#tiles)
   * necessary to store tiles according to the ubiquitous [XYZ web/slippy-map tiles](https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames) scheme.
   * The extent for the [contents table]{@link Contents} row,
   * `contentsBoundingBox`, is [informational only](https://www.geopackage.org/spec121/index.html#gpkg_contents_cols),
   * and need not match the [tile matrix set]{@link TileMatrixSet}
   * extent, `tileMatrixSetBoundingBox`, which should be the precise bounding box
   * used to calculate the tile row and column coordinates of all tiles in the
   * tile set.  The two SRS ID parameters, `contentsSrsId` and `tileMatrixSetSrsId`,
   * must match, however.  See {@link TileMatrixSet} for
   * more information about how GeoPackage consumers use the bounding boxes for a
   * tile set.
   *
   * @param {string} tableName the name of the table that will store the tiles
   * @param {BoundingBox} contentsBoundingBox the bounds stored in the [`gpkg_contents`]{@link Contents} table row for the tile matrix set
   * @param {number} contentsSrsId the ID of a [spatial reference system]{@link SpatialReferenceSystem}; must match `tileMatrixSetSrsId`
   * @param {BoundingBox} tileMatrixSetBoundingBox the bounds stored in the [`gpkg_tile_matrix_set`]{@link TileMatrixSet} table row
   * @param {number} tileMatrixSetSrsId the ID of a [spatial reference system]{@link SpatialReferenceSystem}
   *   for the [tile matrix set](https://www.geopackage.org/spec121/index.html#_tile_matrix_set) table; must match `contentsSrsId`
   * @param {number} minZoom the zoom level of the lowest resolution [tile matrix]{@link TileMatrix} in the tile matrix set
   * @param {number} maxZoom the zoom level of the highest resolution [tile matrix]{@link TileMatrix} in the tile matrix set
   * @param tileSize the width and height in pixels of the tile images; defaults to 256
   * @returns {TileMatrixSet} the created {@link TileMatrixSet} object, or rejects with an `Error`
   *
   */
  createStandardWGS84TileTable(
    tableName: string,
    contentsBoundingBox: BoundingBox,
    contentsSrsId: number,
    tileMatrixSetBoundingBox: BoundingBox,
    tileMatrixSetSrsId: number,
    minZoom: number,
    maxZoom: number,
    tileSize = TileUtils.TILE_PIXELS_DEFAULT,
  ): TileMatrixSet {
    const srsDao = this.getSpatialReferenceSystemDao();
    let wgs84 = srsDao.getByOrganizationAndCoordSysId(
      ProjectionConstants.AUTHORITY_EPSG,
      ProjectionConstants.EPSG_WORLD_GEODETIC_SYSTEM,
    );
    if (!wgs84) {
      srsDao.createWebMercator();
      wgs84 = this.getSpatialReferenceSystemDao().getByOrganizationAndCoordSysId(
        ProjectionConstants.AUTHORITY_EPSG,
        ProjectionConstants.EPSG_WORLD_GEODETIC_SYSTEM,
      );
    }
    const wgs84SrsId = wgs84.getSrsId();

    const contentsSrs = srsDao.getBySrsId(contentsSrsId);
    if (!contentsSrs) {
      throw new GeoPackageException('Spatial reference system (' + contentsSrsId + ') is not defined.');
    }
    const tileMatrixSrs = srsDao.getBySrsId(tileMatrixSetSrsId);
    if (!tileMatrixSrs) {
      throw new GeoPackageException('Spatial reference system (' + tileMatrixSetSrsId + ') is not defined.');
    }

    if (contentsSrsId !== wgs84SrsId) {
      const from = contentsSrs.projection;
      contentsBoundingBox = contentsBoundingBox.transform(
        new ProjectionTransform(from, Projections.getWGS84Projection()),
      );
    }
    if (tileMatrixSetSrsId !== wgs84SrsId) {
      const from = tileMatrixSrs.projection;
      tileMatrixSetBoundingBox = tileMatrixSetBoundingBox.transform(
        new ProjectionTransform(from, Projections.getWGS84Projection()),
      );
    }
    const tileMatrixSet = this.createTileTableWithTableName(
      tableName,
      contentsBoundingBox,
      wgs84SrsId,
      tileMatrixSetBoundingBox,
      wgs84SrsId,
    );
    this.createStandardWGS84TileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, minZoom, maxZoom, tileSize);
    return tileMatrixSet;
  }
  /**
   * Create the tables and rows necessary to store tiles in a {@link TileMatrixSet}.
   * This will create a [tile matrix row]{@link TileMatrix}
   * for every integral zoom level in the range `[minZoom..maxZoom]`.
   *
   * @param {BoundingBox} wgs84BoundingBox
   * @param {TileMatrixSet} tileMatrixSet
   * @param {number} minZoom
   * @param {number} maxZoom
   * @param {number} [tileSize=256] optional tile size in pixels
   * @returns {GeoPackage} `this` `GeoPackage`
   */
  createStandardWGS84TileMatrix(
    wgs84BoundingBox: BoundingBox,
    tileMatrixSet: TileMatrixSet,
    minZoom: number,
    maxZoom: number,
    tileSize = TileUtils.TILE_PIXELS_DEFAULT,
  ): GeoPackage {
    tileSize = tileSize || TileUtils.TILE_PIXELS_DEFAULT;
    const tileMatrixDao = this.getTileMatrixDao();
    for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
      this.createWGS84TileMatrixRow(wgs84BoundingBox, tileMatrixSet, tileMatrixDao, zoom, tileSize);
    }
    return this;
  }
  /**
   * Create the [tables and rows](https://www.geopackage.org/spec121/index.html#tiles)
   * necessary to store tiles according to the ubiquitous [XYZ web/slippy-map tiles](https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames) scheme.
   * The extent for the [contents table]{@link Contents} row,
   * `contentsBoundingBox`, is [informational only](https://www.geopackage.org/spec121/index.html#gpkg_contents_cols),
   * and need not match the [tile matrix set]{@link TileMatrixSet}
   * extent, `tileMatrixSetBoundingBox`, which should be the precise bounding box
   * used to calculate the tile row and column coordinates of all tiles in the
   * tile set.  The two SRS ID parameters, `contentsSrsId` and `tileMatrixSetSrsId`,
   * must match, however.  See {@link TileMatrixSet} for
   * more information about how GeoPackage consumers use the bounding boxes for a
   * tile set.
   *
   * @param {string} tableName the name of the table that will store the tiles
   * @param {BoundingBox} contentsBoundingBox the bounds stored in the [`gpkg_contents`]{@link Contents} table row for the tile matrix set
   * @param {number} contentsSrsId the ID of a [spatial reference system]{@link SpatialReferenceSystem}; must match `tileMatrixSetSrsId`
   * @param {BoundingBox} tileMatrixSetBoundingBox the bounds stored in the [`gpkg_tile_matrix_set`]{@link TileMatrixSet} table row
   * @param {number} tileMatrixSetSrsId the ID of a [spatial reference system]{@link SpatialReferenceSystem}
   *   for the [tile matrix set](https://www.geopackage.org/spec121/index.html#_tile_matrix_set) table; must match `contentsSrsId`
   * @param {number} minZoom the zoom level of the lowest resolution [tile matrix]{@link TileMatrix} in the tile matrix set
   * @param {number} maxZoom the zoom level of the highest resolution [tile matrix]{@link TileMatrix} in the tile matrix set
   * @param tileSize the width and height in pixels of the tile images; defaults to 256
   * @returns {TileMatrixSet} the created {@link TileMatrixSet} object, or rejects with an `Error`
   *
   * @todo make `tileMatrixSetSrsId` optional because it always has to be the same anyway
   */
  createStandardWebMercatorTileTable(
    tableName: string,
    contentsBoundingBox: BoundingBox,
    contentsSrsId: number,
    tileMatrixSetBoundingBox: BoundingBox,
    tileMatrixSetSrsId: number,
    minZoom: number,
    maxZoom: number,
    tileSize = TileUtils.TILE_PIXELS_DEFAULT,
  ): TileMatrixSet {
    let webMercator = this.getSpatialReferenceSystemDao().getByOrganizationAndCoordSysId(
      ProjectionConstants.AUTHORITY_EPSG,
      ProjectionConstants.EPSG_WEB_MERCATOR,
    );
    if (!webMercator) {
      this.getSpatialReferenceSystemDao().createWebMercator();
      webMercator = this.getSpatialReferenceSystemDao().getByOrganizationAndCoordSysId(
        ProjectionConstants.AUTHORITY_EPSG,
        ProjectionConstants.EPSG_WEB_MERCATOR,
      );
    }
    const webMercatorSrsId = webMercator.getSrsId();
    const srsDao = this.getSpatialReferenceSystemDao();

    const contentsSrs = srsDao.getBySrsId(contentsSrsId);
    if (!contentsSrs) {
      throw new GeoPackageException('Spatial reference system (' + contentsSrsId + ') is not defined.');
    }
    const tileMatrixSrs = srsDao.getBySrsId(tileMatrixSetSrsId);
    if (!tileMatrixSrs) {
      throw new GeoPackageException('Spatial reference system (' + tileMatrixSetSrsId + ') is not defined.');
    }

    if (contentsSrsId !== webMercatorSrsId) {
      const from = contentsSrs.projection;
      contentsBoundingBox = contentsBoundingBox.transform(
        new ProjectionTransform(from, Projections.getWebMercatorProjection()),
      );
    }
    if (tileMatrixSetSrsId !== webMercatorSrsId) {
      const from = tileMatrixSrs.projection;
      tileMatrixSetBoundingBox = tileMatrixSetBoundingBox.transform(
        new ProjectionTransform(from, Projections.getWebMercatorProjection()),
      );
    }
    const tileMatrixSet = this.createTileTableWithTableName(
      tableName,
      contentsBoundingBox,
      webMercatorSrsId,
      tileMatrixSetBoundingBox,
      webMercatorSrsId,
    );
    this.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, minZoom, maxZoom, tileSize);
    return tileMatrixSet;
  }
  /**
   * Create the [tables and rows](https://www.geopackage.org/spec121/index.html#tiles)
   * necessary to store tiles according to the ubiquitous [XYZ web/slippy-map tiles](https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames) scheme.
   * The extent for the [contents table]{@link Contents} row,
   * `contentsBoundingBox`, is [informational only](https://www.geopackage.org/spec121/index.html#gpkg_contents_cols),
   * and need not match the [tile matrix set]{@link TileMatrixSet}
   * extent, `tileMatrixSetBoundingBox`, which should be the precise bounding box
   * used to calculate the tile row and column coordinates of all tiles in the
   * tile set.
   *
   * @param {string} tableName the name of the table that will store the tiles
   * @param {BoundingBox} contentsBoundingBox the bounds stored in the [`gpkg_contents`]{@link Contents} table row for the tile matrix set. MUST BE EPSG:3857
   * @param {BoundingBox} tileMatrixSetBoundingBox the bounds stored in the [`gpkg_tile_matrix_set`]{@link TileMatrixSet} table row. MUST BE EPSG:3857
   * @param {Set<number>} zoomLevels create tile of all resolutions in the set.
   * @param tileSize the width and height in pixels of the tile images; defaults to 256
   * @returns {Promise} a `Promise` that resolves with the created {@link TileMatrixSet} object, or rejects with an `Error`
   */
  public(
    tableName: string,
    contentsBoundingBox: BoundingBox,
    tileMatrixSetBoundingBox: BoundingBox,
    zoomLevels: Set<number>,
    tileSize = TileUtils.TILE_PIXELS_DEFAULT,
  ): TileMatrixSet {
    let webMercator = this.getSpatialReferenceSystemDao().getByOrganizationAndCoordSysId(
      ProjectionConstants.AUTHORITY_EPSG,
      ProjectionConstants.EPSG_WEB_MERCATOR,
    );
    if (!webMercator) {
      this.getSpatialReferenceSystemDao().createWebMercator();
      webMercator = this.getSpatialReferenceSystemDao().getByOrganizationAndCoordSysId(
        ProjectionConstants.AUTHORITY_EPSG,
        ProjectionConstants.EPSG_WEB_MERCATOR,
      );
    }
    const webMercatorSrsId = webMercator.getSrsId();
    const tileMatrixSet = this.createTileTableWithTableName(
      tableName,
      contentsBoundingBox,
      webMercatorSrsId,
      tileMatrixSetBoundingBox,
      webMercatorSrsId,
    );
    this.createStandardWebMercatorTileMatrixWithZoomLevels(
      tileMatrixSetBoundingBox,
      tileMatrixSet,
      zoomLevels,
      tileSize,
    );
    return tileMatrixSet;
  }

  /**
   * Create the tables and rows necessary to store tiles in a {@link TileMatrixSet}.
   * This will create a [tile matrix row]{@link TileMatrix}
   * for every integral zoom level in the range `[minZoom..maxZoom]`.
   * @param epsg3857TileBoundingBox
   * @param tileMatrixSet
   * @param minZoom
   * @param maxZoom
   * @param tileSize
   */
  createStandardWebMercatorTileMatrix(
    epsg3857TileBoundingBox: BoundingBox,
    tileMatrixSet: TileMatrixSet,
    minZoom: number,
    maxZoom: number,
    tileSize = TileUtils.TILE_PIXELS_DEFAULT,
  ): GeoPackage {
    tileSize = tileSize || TileUtils.TILE_PIXELS_DEFAULT;
    const tileMatrixDao = this.getTileMatrixDao();
    for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
      this.createTileMatrixRow(epsg3857TileBoundingBox, tileMatrixSet, tileMatrixDao, zoom, tileSize);
    }
    return this;
  }

  /**
   * Create the tables and rows necessary to store tiles in a {@link TileMatrixSet}.
   * This will create a [tile matrix row]{@link TileMatrix}
   * for every item in the set zoomLevels.
   * @param epsg3857TileBoundingBox
   * @param tileMatrixSet
   * @param zoomLevels
   * @param tileSize
   */
  createStandardWebMercatorTileMatrixWithZoomLevels(
    epsg3857TileBoundingBox: BoundingBox,
    tileMatrixSet: TileMatrixSet,
    zoomLevels: Set<number>,
    tileSize = TileUtils.TILE_PIXELS_DEFAULT,
  ): GeoPackage {
    tileSize = tileSize || TileUtils.TILE_PIXELS_DEFAULT;
    const tileMatrixDao = this.getTileMatrixDao();
    zoomLevels.forEach((zoomLevel) => {
      this.createTileMatrixRow(epsg3857TileBoundingBox, tileMatrixSet, tileMatrixDao, zoomLevel, tileSize);
    });
    return this;
  }

  /**
   * Adds row to tileMatrixDao
   *
   * @param {BoundingBox} epsg4326TileBoundingBox
   * @param {TileMatrixSet} tileMatrixSet
   * @param {TileMatrixDao} tileMatrixDao
   * @param {number} zoomLevel
   * @param {number} [tileSize=256]
   * @returns {number}
   * @memberof GeoPackage
   */
  createWGS84TileMatrixRow(
    epsg4326TileBoundingBox: BoundingBox,
    tileMatrixSet: TileMatrixSet,
    tileMatrixDao: TileMatrixDao,
    zoomLevel: number,
    tileSize = TileUtils.TILE_PIXELS_DEFAULT,
  ): number {
    const tileGrid = TileBoundingBoxUtils.getTileGridWGS84(epsg4326TileBoundingBox, zoomLevel);
    const matrixWidth = tileGrid.getWidth();
    const matrixHeight = tileGrid.getHeight();
    const pixelXSize =
      (epsg4326TileBoundingBox.getMaxLongitude() - epsg4326TileBoundingBox.getMinLongitude()) / matrixWidth / tileSize;
    const pixelYSize =
      (epsg4326TileBoundingBox.getMaxLatitude() - epsg4326TileBoundingBox.getMinLatitude()) / matrixHeight / tileSize;
    const tileMatrix = new TileMatrix();
    tileMatrix.setTableName(tileMatrixSet.getTableName());
    tileMatrix.setZoomLevel(zoomLevel);
    tileMatrix.setMatrixWidth(matrixWidth);
    tileMatrix.setMatrixHeight(matrixHeight);
    tileMatrix.setTileWidth(tileSize);
    tileMatrix.setTileHeight(tileSize);
    tileMatrix.setPixelXSize(pixelXSize);
    tileMatrix.setPixelYSize(pixelYSize);
    return tileMatrixDao.create(tileMatrix);
  }

  /**
   * Adds row to tileMatrixDao
   *
   * @param {BoundingBox} epsg3857TileBoundingBox
   * @param {TileMatrixSet} tileMatrixSet
   * @param {TileMatrixDao} tileMatrixDao
   * @param {number} zoomLevel
   * @param {number} [tileSize=256]
   * @returns {number}
   * @memberof GeoPackage
   */
  createTileMatrixRow(
    epsg3857TileBoundingBox: BoundingBox,
    tileMatrixSet: TileMatrixSet,
    tileMatrixDao: TileMatrixDao,
    zoomLevel: number,
    tileSize = TileUtils.TILE_PIXELS_DEFAULT,
  ): number {
    const tileGrid = TileBoundingBoxUtils.getTileGridWithBoundingBoxAndZoom(epsg3857TileBoundingBox, zoomLevel);
    const matrixWidth = tileGrid.getWidth();
    const matrixHeight = tileGrid.getHeight();
    const pixelXSize =
      (epsg3857TileBoundingBox.getMaxLongitude() - epsg3857TileBoundingBox.getMinLongitude()) / matrixWidth / tileSize;
    const pixelYSize =
      (epsg3857TileBoundingBox.getMaxLatitude() - epsg3857TileBoundingBox.getMinLatitude()) / matrixHeight / tileSize;
    const tileMatrix = new TileMatrix();
    tileMatrix.setTableName(tileMatrixSet.getTableName());
    tileMatrix.setZoomLevel(zoomLevel);
    tileMatrix.setMatrixWidth(matrixWidth);
    tileMatrix.setMatrixHeight(matrixHeight);
    tileMatrix.setTileWidth(tileSize);
    tileMatrix.setTileHeight(tileSize);
    tileMatrix.setPixelXSize(pixelXSize);
    tileMatrix.setPixelYSize(pixelYSize);
    return tileMatrixDao.create(tileMatrix);
  }
  /**
   * Adds a tile to the GeoPackage
   * @param  {object}   tileStream       Byte array or Buffer containing the tile bytes
   * @param  {String}   tableName  Table name to add the tile to
   * @param  {Number}   zoom       zoom level of this tile
   * @param  {Number}   tileRow    row of this tile
   * @param  {Number}   tileColumn column of this tile
   */
  addTile(
    tileStream: Uint8Array | Buffer,
    tableName: string,
    zoom: number,
    tileRow: number,
    tileColumn: number,
  ): number {
    const tileDao = this.getTileDao(tableName);
    const newRow = tileDao.newRow();
    newRow.setZoomLevel(zoom);
    newRow.setTileColumn(tileColumn);
    newRow.setTileRow(tileRow);
    newRow.setTileData(tileStream);
    return tileDao.create(newRow);
  }

  /**
   * Gets a tile from the specified table
   * @param  {string}   table      name of the table to get the tile from
   * @param  {Number}   zoom       zoom level of the tile
   * @param  {Number}   tileRow    row of the tile
   * @param  {Number}   tileColumn column of the tile
   * @return {TileRow}  tile row
   */
  getTileFromTable(table: string, zoom: number, tileRow: number, tileColumn: number): TileRow {
    const tileDao = this.getTileDao(table);
    return tileDao.queryForTile(tileColumn, tileRow, zoom);
  }

  /**
   * Gets the tiles in the EPSG:4326 bounding box
   * @param  {string}   table      name of the tile table
   * @param  {Number}   zoom       Zoom of the tiles to query for
   * @param  {Number}   west       EPSG:4326 western boundary
   * @param  {Number}   east       EPSG:4326 eastern boundary
   * @param  {Number}   south      EPSG:4326 southern boundary
   * @param  {Number}   north      EPSG:4326 northern boundary
   */
  getTilesInBoundingBox(
    table: string,
    zoom: number,
    west: number,
    east: number,
    south: number,
    north: number,
  ): {
    columns: TileColumn[];
    srs: SpatialReferenceSystem;
    tiles: {
      tableName: string;
      id: number;
      minLongitude: number;
      maxLongitude: number;
      minLatitude: number;
      maxLatitude: number;
      projection: string;
      values: string[];
    }[];
    west?: string;
    east?: string;
    south?: string;
    north?: string;
    zoom?: number;
  } {
    const tiles = {
      columns: [],
      srs: undefined,
      tiles: [],
      west: undefined,
      east: undefined,
      south: undefined,
      north: undefined,
      zoom: undefined,
    } as {
      columns: TileColumn[];
      srs: SpatialReferenceSystem;
      tiles: {
        tableName: string;
        id: number;
        minLongitude: number;
        maxLongitude: number;
        minLatitude: number;
        maxLatitude: number;
        projection: string;
        values: string[];
      }[];
      west?: string;
      east?: string;
      south?: string;
      north?: string;
      zoom?: number;
    };

    const tileDao = this.getTileDao(table);
    if (zoom < tileDao.getMinZoom() || zoom > tileDao.getMaxZoom()) {
      return;
    }
    tiles.columns = tileDao.getTable().getUserColumns().getColumns();
    tiles.srs = tileDao.getSrs();
    tiles.tiles = [];
    const tms = tileDao.getTileMatrixSet();
    const tm = tileDao.getTileMatrix(zoom);
    if (!tm) {
      return tiles;
    }
    let mapBoundingBox = new BoundingBox(
      Math.max(-ProjectionConstants.WGS84_HALF_WORLD_LON_WIDTH, west),
      south,
      Math.min(east, ProjectionConstants.WGS84_HALF_WORLD_LON_WIDTH),
      north,
    );
    tiles.west = Math.max(-ProjectionConstants.WGS84_HALF_WORLD_LON_WIDTH, west).toFixed(2);
    tiles.east = Math.min(east, ProjectionConstants.WGS84_HALF_WORLD_LON_WIDTH).toFixed(2);
    tiles.south = south.toFixed(2);
    tiles.north = north.toFixed(2);
    tiles.zoom = zoom;
    mapBoundingBox = mapBoundingBox.projectBoundingBox(Projections.getWGS84Projection(), tileDao.getProjection());
    const grid = TileBoundingBoxUtils.getTileGrid(
      tms.getBoundingBox(),
      tm.getMatrixWidth(),
      tm.getMatrixHeight(),
      mapBoundingBox,
    );
    const iterator = tileDao.queryByTileGrid(grid, zoom);
    for (const row of iterator) {
      const tile = {} as {
        tableName: string;
        id: number;
        minLongitude: number;
        maxLongitude: number;
        minLatitude: number;
        maxLatitude: number;
        projection: string;
        values: string[];
      } & Record<string, any>;
      tile.tableName = table;
      tile.id = row.getId();

      const tileBB = TileBoundingBoxUtils.getBoundingBoxWithTileMatrix(
        tms.getBoundingBox(),
        tm,
        row.getTileColumn(),
        row.getTileRow(),
      );
      tile.minLongitude = tileBB.getMinLongitude();
      tile.maxLongitude = tileBB.getMaxLongitude();
      tile.minLatitude = tileBB.getMinLatitude();
      tile.maxLatitude = tileBB.getMaxLatitude();
      tile.values = [];
      for (let i = 0; i < tiles.columns.length; i++) {
        const column = tiles.columns[i];
        const value = row.getValue(column.getName());
        if (column.getName() === 'tile_data') {
          tile.values.push('data');
        } else if (value === null || value === 'null') {
          tile.values.push('');
        } else {
          tile.values.push(value.toString());
          tile[column.getName()] = value;
        }
      }
      tiles.tiles.push(tile);
    }
    iterator.close();
    return tiles;
  }

  /**
   * Gets the tiles in the EPSG:4326 bounding box
   * @param  {string}   table      name of the tile table
   * @param  {Number}   webZoom       Zoom of the tiles to query for
   * @param  {Number}   west       EPSG:4326 western boundary
   * @param  {Number}   east       EPSG:4326 eastern boundary
   * @param  {Number}   south      EPSG:4326 southern boundary
   * @param  {Number}   north      EPSG:4326 northern boundary
   */
  getTilesInBoundingBoxWebZoom(
    table: string,
    webZoom: number,
    west: number,
    east: number,
    south: number,
    north: number,
  ): {
    columns: TileColumn[];
    srs: SpatialReferenceSystem;
    tiles: {
      tableName: string;
      id: number;
      minLongitude: number;
      maxLongitude: number;
      minLatitude: number;
      maxLatitude: number;
      projection: string;
      values: string[];
    }[];
    west?: string;
    east?: string;
    south?: string;
    north?: string;
    zoom?: number;
  } {
    const tiles = {
      columns: [],
      srs: undefined,
      tiles: [],
      west: undefined,
      east: undefined,
      south: undefined,
      north: undefined,
      zoom: undefined,
    } as {
      columns: TileColumn[];
      srs: SpatialReferenceSystem;
      tiles: {
        tableName: string;
        id: number;
        minLongitude: number;
        maxLongitude: number;
        minLatitude: number;
        maxLatitude: number;
        projection: string;
        values: string[];
      }[];
      west?: string;
      east?: string;
      south?: string;
      north?: string;
      zoom?: number;
    };

    const tileDao = this.getTileDao(table);
    if (webZoom < tileDao.getMapMinZoom() || webZoom > tileDao.getMapMaxZoom()) {
      return;
    }
    tiles.columns = tileDao.getTable().getUserColumns().getColumns();
    tiles.srs = tileDao.getSrs();
    tiles.tiles = [];

    const zoom = tileDao.webZoomToGeoPackageZoom(webZoom);
    const tms = tileDao.getTileMatrixSet();
    const tm = tileDao.getTileMatrix(zoom);
    if (!tm) {
      return tiles;
    }

    let mapBoundingBox = new BoundingBox(
      Math.max(-ProjectionConstants.WGS84_HALF_WORLD_LON_WIDTH, west),
      Math.min(east, ProjectionConstants.WGS84_HALF_WORLD_LON_WIDTH),
      south,
      north,
    );
    tiles.west = Math.max(-ProjectionConstants.WGS84_HALF_WORLD_LON_WIDTH, west).toFixed(2);
    tiles.east = Math.min(east, ProjectionConstants.WGS84_HALF_WORLD_LON_WIDTH).toFixed(2);
    tiles.south = south.toFixed(2);
    tiles.north = north.toFixed(2);
    tiles.zoom = zoom;
    mapBoundingBox = mapBoundingBox.projectBoundingBox(Projections.getWGS84Projection(), tileDao.getProjection());
    const grid = TileBoundingBoxUtils.getTileGrid(
      tms.getBoundingBox(),
      tm.getMatrixWidth(),
      tm.getMatrixHeight(),
      mapBoundingBox,
    );
    const iterator = tileDao.queryByTileGrid(grid, zoom);
    for (const row of iterator) {
      const tile = {} as {
        tableName: string;
        id: number;
        minLongitude: number;
        maxLongitude: number;
        minLatitude: number;
        maxLatitude: number;
        projection: string;
        values: string[];
      } & Record<string, any>;
      tile.tableName = table;
      tile.id = row.getId();

      const tileBB = TileBoundingBoxUtils.getBoundingBoxWithTileMatrix(
        tms.getBoundingBox(),
        tm,
        row.getTileColumn(),
        row.getTileRow(),
      );
      tile.minLongitude = tileBB.getMinLongitude();
      tile.maxLongitude = tileBB.getMaxLongitude();
      tile.minLatitude = tileBB.getMinLatitude();
      tile.maxLatitude = tileBB.getMaxLatitude();
      tile.values = [];
      for (let i = 0; i < tiles.columns.length; i++) {
        const column = tiles.columns[i];
        const value = row.getValue(column.getName());
        if (column.getName() === 'tile_data') {
          tile.values.push('data');
        } else if (value === null || value === 'null') {
          tile.values.push('');
        } else {
          tile.values.push(value.toString());
          tile[column.getName()] = value;
        }
      }
      tiles.tiles.push(tile);
    }
    return tiles;
  }

  /**
   * Returns a feature tile
   * @param table
   * @param x
   * @param y
   * @param z
   * @param width
   * @param height
   */
  async getFeatureTileFromXYZ(
    table: string,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
  ): Promise<GeoPackageTile> {
    x = Number(x);
    y = Number(y);
    z = Number(z);
    width = Number(width);
    height = Number(height);
    const featureDao = this.getFeatureDao(table);
    if (!featureDao) return;
    const ft = new FeatureTiles(this, featureDao, width, height, TileUtils.tileScale(width, height));
    return ft.drawTile(x, y, z);
  }

  /**
   * Create the Data Columns table if it does not already exist
   */
  createDataColumns(): boolean {
    return new SchemaExtension(this).createDataColumnsTable();
  }

  /**
   * Create the Data Column Constraints table if it does not already exist
   */
  createDataColumnConstraintsTable(): boolean {
    if (this.getDataColumnConstraintsDao().isTableExists()) {
      return true;
    }
    return this.tableCreator.createDataColumnConstraints();
  }

  /**
   * Create metadata table
   */
  createMetadataTable(): boolean {
    if (this.getMetadataDao().isTableExists()) {
      return true;
    }
    return this.tableCreator.createMetadata();
  }

  /**
   * Create metadata reference table
   */
  createMetadataReferenceTable(): boolean {
    if (this.getMetadataReferenceDao().isTableExists()) {
      return true;
    }
    return this.tableCreator.createMetadataReference();
  }

  /**
   * Create table index table
   */
  createTableIndexTable(): boolean {
    if (this.getTableIndexDao().isTableExists()) {
      return true;
    }
    return this.tableCreator.createTableIndex();
  }

  /**
   * Create geometry index table
   */
  createGeometryIndexTable(): boolean {
    const dao = this.getGeometryIndexDao();
    if (dao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createGeometryIndex();
  }

  /**
   * Create the feature tile link table
   */
  createFeatureTileLinkTable(): boolean {
    const dao = new FeatureTileLinkDao(this);
    if (dao.isTableExists()) {
      return true;
    }
    return this.tableCreator.createFeatureTileLink();
  }

  /**
   * Gets the column name mapping
   * @param featureDao
   * @param dataColumnsDao
   * @private
   */
  getColumnToDataColumnMap(featureDao: FeatureDao, dataColumnsDao: DataColumnsDao): Map<string, string> {
    const columnMap = new Map();
    if (dataColumnsDao.isTableExists()) {
      const dataColumns = dataColumnsDao.queryByTable(featureDao.getTableName());
      featureDao.getColumnNames().forEach((columnName) => {
        const dataColumn = dataColumns.find((dc) => dc.getColumnName() === columnName);
        columnMap.set(columnName, dataColumn != null ? dataColumn.getName() : columnName);
      });
    }
    return columnMap;
  }

  /**
   * Queries the table for a specific feature id
   * @param table
   * @param featureId
   * @return {FeatureRow}
   */
  getFeature(table: string, featureId: any): FeatureRow {
    let featureRow;
    const featureDao = this.getFeatureDao(table);
    featureRow = featureDao.queryForIdRow(featureId);
    if (featureRow == null) {
      const resultSet = featureDao.queryForEq('_feature_id', featureId);
      resultSet.moveToNext();
      featureRow = resultSet.getRow();
      resultSet.close();
      if (featureRow == null) {
        const resultSet = featureDao.queryForEq('_properties_id', featureId);
        resultSet.moveToNext();
        featureRow = resultSet.getRow();
        resultSet.close();
      }
    }
    return featureRow;
  }

  /**
   * Queries the table for a specific feature id
   * @param table
   * @param featureId
   */
  getFeatureAsGeoJSON(table: string, featureId: any): Feature {
    let feature = null;
    const featureDao = this.getFeatureDao(table);
    const srs = featureDao.getSrs();
    let featureRow = featureDao.queryForIdRow(featureId);
    if (featureRow == null) {
      const resultSet = featureDao.queryForEq('_feature_id', featureId);
      resultSet.moveToNext();
      featureRow = resultSet.getRow();
      if (featureRow == null) {
        const resultSet = featureDao.queryForEq('_properties_id', featureId);
        resultSet.moveToNext();
        featureRow = resultSet.getRow();
      }
    }
    if (featureRow != null) {
      feature = GeoPackage.parseFeatureRowIntoGeoJSON(
        featureRow,
        srs,
        this.getColumnToDataColumnMap(featureDao, this.getDataColumnsDao()),
      );
    }
    return feature;
  }

  // eslint-disable-next-line complexity
  static parseFeatureRowIntoGeoJSON(
    featureRow: FeatureRow,
    srs: SpatialReferenceSystem,
    dataColumnsMap?: Map<string, string>,
  ): Feature {
    let geometryTransform = null;
    if (!srs.getProjection().equalsProjection(Projections.getWGS84Projection())) {
      geometryTransform = new GeometryTransform(srs.getProjection(), Projections.getWGS84Projection());
    }
    return GeoJSONUtils.convertFeatureRowIntoGeoJSONFeature(featureRow, geometryTransform, dataColumnsMap);
  }

  /**
   * Gets the features in the EPSG:3857 tile
   * @param  {string}   table      name of the feature table
   * @param  {Number}   x       x tile number
   * @param  {Number}   y       y tile number
   * @param  {Number}   z      z tile number
   */
  public getGeoJSONFeaturesInTile(table: string, x: number, y: number, z: number): GeoJSONResultSet {
    const webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBox(x, y, z);
    const featureIndexManager = this.getFeatureIndexManager(table);
    const featureProjection = featureIndexManager.getFeatureDao().getSrs().getProjection();
    const webMercatorProjection = Projections.getWebMercatorProjection();
    let boundingBox = webMercatorBoundingBox;
    if (!featureProjection.equalsProjection(webMercatorProjection)) {
      boundingBox = boundingBox.transform(new ProjectionTransform(webMercatorProjection, featureProjection));
    }
    return featureIndexManager.queryForGeoJSONFeatures(boundingBox);
  }

  /**
   * Gets the features in the EPSG:4326 bounding box
   * @param  {string}   table      name of the feature table
   * @param  {Number}   west       EPSG:4326 western boundary
   * @param  {Number}   east       EPSG:4326 eastern boundary
   * @param  {Number}   south      EPSG:4326 southern boundary
   * @param  {Number}   north      EPSG:4326 northern boundary
   */
  public getFeaturesInBoundingBox(
    table: string,
    west: number,
    east: number,
    south: number,
    north: number,
  ): FeatureIndexResults {
    const featureIndexManager = this.getFeatureIndexManager(table);
    if (featureIndexManager.getFeatureDao() == null) {
      throw new GeoPackageException('Unable to find table ' + table);
    }
    return featureIndexManager.queryWithBoundingBox(new BoundingBox(west, east, south, north));
  }

  /**
   * Get the standard 3857 XYZ tile from the GeoPackage.
   * @param  {string}   table      name of the table containing the tiles
   * @param  {Number}   x          x index of the tile
   * @param  {Number}   y          y index of the tile
   * @param  {Number}   z          zoom level of the tile
   * @param  {Number}   width      width of the resulting tile
   * @param  {Number}   height     height of the resulting tile
   */
  async xyzTile(
    table: string,
    x: number,
    y: number,
    z: number,
    width = TileUtils.TILE_PIXELS_DEFAULT,
    height = TileUtils.TILE_PIXELS_DEFAULT,
  ): Promise<GeoPackageTile> {
    width = Number(width);
    height = Number(height);
    const tileDao = this.getTileDao(table);
    const retriever = new GeoPackageTileRetriever(tileDao, width, height);
    const tileTableScaling = this.getTileScalingExtension(table);
    if (tileTableScaling.has()) {
      const tileScaling = tileTableScaling.getTileScalingDao().queryForTableName(table);
      if (tileScaling) {
        retriever.setScaling(tileScaling);
      }
    }
    return retriever.getTile(x, y, z);
  }

  /**
   * Get the standard 3857 XYZ tile from the GeoPackage.
   * @param  {string}   table      name of the table containing the tiles
   * @param  {Number}   x          x index of the tile
   * @param  {Number}   y          y index of the tile
   * @param  {Number}   z          zoom level of the tile
   * @param  {Number}   width      width of the resulting tile
   * @param  {Number}   height     height of the resulting tile
   * @param zoomIn
   * @param zoomOut
   */
  async xyzTileScaled(
    table: string,
    x: number,
    y: number,
    z: number,
    width = TileUtils.TILE_PIXELS_DEFAULT,
    height = TileUtils.TILE_PIXELS_DEFAULT,
    zoomIn?: 2,
    zoomOut?: 2,
  ): Promise<any> {
    width = Number(width);
    height = Number(height);
    const tileDao = this.getTileDao(table);
    const retriever = new GeoPackageTileRetriever(tileDao, width, height);
    const tileTableScaling = this.getTileScalingExtension(table);
    if (!tileTableScaling.has()) {
      tileTableScaling.getOrCreateExtension();
    }
    const tileScaling = tileTableScaling.getTileScalingDao().queryForTableName(table);
    if (tileScaling != null) {
      retriever.setScaling(tileScaling);
    } else {
      const tileScaling = new TileScaling(table, TileScalingType.CLOSEST_IN_OUT, zoomIn, zoomOut);
      if (tileTableScaling.createOrUpdate(tileScaling)) {
        retriever.setScaling(tileScaling);
      }
    }
    return retriever.getTile(x, y, z);
  }

  /**
   * Draws a tile projected into the specified projection, bounded by the EPSG:4326 bounds into the canvas or the image is returned if no canvas is passed in.
   * @param  {string}   table      name of the table containing the tiles
   * @param  {Number}   minLat     minimum latitude bounds of tile
   * @param  {Number}   minLon     minimum longitude bounds of tile
   * @param  {Number}   maxLat     maximum latitude bounds of tile
   * @param  {Number}   maxLon     maximum longitude bounds of tile
   * @param  {Number}   z          zoom level of the tile
   * @param  {string}   projection project from tile's projection to this one.
   * @param  {Number}   width      width of the resulting tile
   * @param  {Number}   height     height of the resulting tile
   */
  async projectedTile(
    table: string,
    minLat: number,
    minLon: number,
    maxLat: number,
    maxLon: number,
    z: number,
    projection: Projection = Projections.getWGS84Projection(),
    width = TileUtils.TILE_PIXELS_DEFAULT,
    height = TileUtils.TILE_PIXELS_DEFAULT,
  ): Promise<GeoPackageTile> {
    const tileDao = this.getTileDao(table);
    const retriever = new GeoPackageTileRetriever(tileDao, width, height, 'image/png');
    const bounds = new BoundingBox(minLon, minLat, maxLon, maxLat);
    return retriever.getTileWithBounds(bounds, projection);
  }

  /**
   * Get the tile scaling extension for a given table
   * @param table
   */
  public getTileScalingExtension(table: string): TileTableScaling {
    return new TileTableScaling(this, table);
  }

  /**
   * Gets the related table extension
   */
  public getRelatedTablesExtension(): RelatedTablesExtension {
    if (this.relatedTablesExtension == null) {
      this.relatedTablesExtension = new RelatedTablesExtension(this);
    }
    return this.relatedTablesExtension;
  }
}
