import { GeoPackageConnection } from "./db/geoPackageConnection";
import { GeoPackageTableCreator } from "./db/geoPackageTableCreator";
import { Projection } from "@ngageoint/projections-js";
import { BoundingBox } from "./boundingBox";
import { GeometryColumns } from "./features/columns/geometryColumns";
import { FeatureDao } from "./features/user/featureDao";
import { FeatureTableReader } from "./features/user/featureTableReader";
import { GeoPackageException } from "./geoPackageException";
import { Contents } from "./contents/contents";
import { GeometryColumnsDao } from "./features/columns/geometryColumnsDao";
import { ContentsDao } from "./contents/contentsDao";
import { SpatialReferenceSystemDao } from "./srs/spatialReferenceSystemDao";
import { TileMatrixSet } from "./tiles/matrixset/tileMatrixSet";
import { TileDao } from "./tiles/user/tileDao";
import { RTreeIndexExtension } from "./extension/rtree/rtreeIndexExtension";
import { ResultSet } from "./db/resultSet";
import { SQLUtils } from "./db/sqlUtils";
import { UserCustomDao } from "./user/custom/userCustomDao";
import { AttributesDao } from "./attributes/attributesDao";
import { ContentsDataType } from "./contents/contentsDataType";
import { AttributesTableReader } from "./attributes/attributesTableReader";
import { TileTableReader } from "./tiles/user/tileTableReader";
import { TileTable } from "./tiles/user/tileTable";
import { AttributesTable } from "./attributes/attributesTable";
import { UserCustomTableReader } from "./user/custom/userCustomTableReader";
import { UserCustomTable } from "./user/custom/userCustomTable";
import { CrsWktExtension } from "./extension/crsWktExtension";
import { FeatureTable } from "./features/user/featureTable";
import { TileMatrixSetDao } from "./tiles/matrixset/tileMatrixSetDao";
import { TileMatrixDao } from "./tiles/matrix/tileMatrixDao";
import { SpatialReferenceSystem } from "./srs/spatialReferenceSystem";
import { ExtensionsDao } from "./extension/extensionsDao";
import { AlterTable } from "./db/alterTable";
import { TileMatrix } from "./tiles/matrix/tileMatrix";
import { ExtensionManager } from "./extension/extensionManager";
import { UserTable } from "./user/userTable";
import { UserColumn } from "./user/userColumn";
import { AttributesTableMetadata } from "./attributes/attributesTableMetadata";

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
   * Constructor
   * @param name name
   * @param path path
   * @param database database
   * @param writable true if writable
   */
  protected constructor(name: string, path: string, database: GeoPackageConnection, writable: boolean = true) {
    this.name = name;
    this.path = path;
    this.database = database;
    this.tableCreator = new GeoPackageTableCreator(this);
    this.writable = writable;
  }

  /**
   * {@inheritDoc}
   */
  public getFeatureBoundingBox(projection: Projection, table: string, manual: boolean): BoundingBox {
    let boundingBox = null;

    const indexManager = new FeatureIndexManager(this, table);
    try {
      if (manual || indexManager.isIndexed()) {
        boundingBox = indexManager.getBoundingBox(projection);
      }
    } finally {
      indexManager.close();
    }

    return boundingBox;
  }

  /**
   * {@inheritDoc}
   */
  public getFeatureDaoForGeometryColumns(geometryColumns: GeometryColumns): FeatureDao {
    if (geometryColumns == null) {
      throw new GeoPackageException("Non null GeometryColumns is required to create FeatureDao");
    }

    // Read the existing table and create the dao
    const tableReader = new FeatureTableReader(geometryColumns);
    const featureTable = tableReader.readTable(this.database);
    featureTable.setContents(geometryColumns.getContents());
    const dao = new FeatureDao(this.getName(), this.database, geometryColumns, featureTable);

    // If the GeoPackage is writable and the feature table has a RTree Index
    // extension, create the SQL functions
    if (this.writable) {
      const rtree = new RTreeIndexExtension(this);
      if (rtree.has(featureTable.getTableName())) {
        rtree.createAllFunctions();
      }
    }
    return dao;
  }

  /**
   * {@inheritDoc}
   */
  public getFeatureDaoForContents(contents: Contents): FeatureDao {
    if (contents == null) {
      throw new GeoPackageException("Non null is: Contents required to create FeatureDao");
    }

    let geometryColumns = null;
    try {
      geometryColumns = this.getGeometryColumnsDao().queryForTableName(contents.getTableName());
    } catch (e) {
      throw new GeoPackageException("No GeometryColumns"
        + " could be retrieved for Contents " + contents.getId());
    }

    if (geometryColumns == null) {
      throw new GeoPackageException("No GeometryColumns exists for Contents " + contents.getId());
    }

    return this.getFeatureDao(geometryColumns);
  }

  /**
   * {@inheritDoc}
   */
  public getFeatureDao(tableName: string): FeatureDao {
    const dao = this.getGeometryColumnsDao();
    let geometryColumnsList;
    try {
      geometryColumnsList = dao.queryForEq(GeometryColumns.COLUMN_TABLE_NAME, tableName);
    } catch (e) {
      throw new GeoPackageException("Failed to retrieve "
        + "FeatureDao for table name: "
        + tableName + ". Exception retrieving "
        + "GeometryColumns.");
    }
    if (geometryColumnsList.length === 0) {
      throw new GeoPackageException("No Feature Table exists for table name: " + tableName);
    } else if (geometryColumnsList.length > 1) {
      // This shouldn't happen with the table name unique constraint on
      // geometry columns
      throw new GeoPackageException("Unexpected state. More than one GeometryColumns"
        + " matched for table name: " + tableName + ", count: "
        + geometryColumnsList.length);
    }
    return this.getFeatureDao(geometryColumnsList[0]);
  }

  /**
   * {@inheritDoc}
   */
  public getTileDaoForTileMatrixSet(tileMatrixSet: TileMatrixSet): TileDao {

    if (tileMatrixSet == null) {
      throw new GeoPackageException("Non null TileMatrixSet is required to create TileDao");
    }

    // Get the Tile Matrix collection, order by zoom level ascending & pixel
    // size descending per requirement 51
    const tableName = tileMatrixSet.getTableName();
    let tileMatrices;
    try {
      tileMatrices = this.getTileMatrixDao().queryForTableName(tableName);
    } catch (e) {
      throw new GeoPackageException(
        "Failed to retrieve TileDao"
        + " for table name: " + tableName
        + ". Exception retrieving TileMatrix collection.");
    }

    // Read the existing table and create the dao
    const tableReader = new TileTableReader(tableName);
    const tileTable = tableReader.readTable(this.database);
    tileTable.setContents(tileMatrixSet.getContents());
    const dao = new TileDao(this.getName(), this.database, tileMatrixSet, tileMatrices, tileTable);

    return dao;
  }

  /**
   * {@inheritDoc}
   */
  public getTileDaoForContents(contents: Contents): TileDao {

    if (contents == null) {
      throw new GeoPackageException("Non null Contents is required to create TileDao");
    }

    let tileMatrixSet = null;
    try {
      tileMatrixSet = this.getTileMatrixSetDao()
        .queryForId(contents.getTableName());
    } catch (e) {
      throw new GeoPackageException("No TileMatrixSet"
        + " could be retrieved for Contents"
        + " " + contents.getId());
    }

    if (tileMatrixSet == null) {
      throw new GeoPackageException("No TileMatrixSet"
        + " exists for Contents"
        + " " + contents.getId());
    }

    return this.getTileDao(tileMatrixSet);
  }

  /**
   * {@inheritDoc}
   */
  public getTileDaoForTileTable(table: TileTable): TileDao {
    return this.getTileDao(table.getTableName());
  }

  /**
   * {@inheritDoc}
   */
  public getTileDao(tableName: string): TileDao {
    const dao = this.getTileMatrixSetDao();
    let tileMatrixSetList;
    try {
      tileMatrixSetList = dao.queryForEq(TileMatrixSet.COLUMN_TABLE_NAME, tableName);
    } catch (e) {
      throw new GeoPackageException("Failed to retrieve TileDao"
        + " for table name: "
        + tableName + ". Exception retrieving TileMatrixSet.");
    }
    if (tileMatrixSetList.length === 0) {
      throw new GeoPackageException(
        "No Tile Table exists for table name: " + tableName
        + ", Tile Tables: " + this.getTileTables());
    } else if (tileMatrixSetList.length > 1) {
      // This shouldn't happen with the table name primary key on tile
      // matrix set table
      throw new GeoPackageException("Unexpected state. More than one TileMatrixSet"
        + " matched for table name: " + tableName + ", count: "
        + tileMatrixSetList.length);
    }
    return this.getTileDaoForTileMatrixSet(tileMatrixSetList[0]);
  }

  /**
   * {@inheritDoc}
   */
  public getAttributesDaoFromContents(contents: Contents): AttributesDao {
    if (contents == null) {
      throw new GeoPackageException("Non null Contents"
        +  " is required to create AttributesDao");
    }
    if (!contents.isAttributesTypeOrUnknown()) {
      throw new GeoPackageException(
        + "Contents is required to be of type "
        + ContentsDataType.ATTRIBUTES + ". Actual: "
        + contents.getDataTypeName());
    }

    // Read the existing table and create the dao
    const tableReader = new AttributesTableReader(
      contents.getTableName());
    const attributesTable = tableReader.readTable(this.database);
      attributesTable.setContents(contents);
    const dao = new AttributesDao(this.getName(), this.database, attributesTable);

    return dao;
  }

  /**
   * {@inheritDoc}
   */
  public getAttributesDaoFromAttributesTable(table: AttributesTable): AttributesDao {
    return this.getAttributesDao(table.getTableName());
  }

  /**
   * {@inheritDoc}
   */
  public getAttributesDao(tableName: string): AttributesDao {
    let dao = this.getContentsDao();
    let contents: Contents = null;
    try {
      contents = dao.queryForId(tableName);
    } catch (e) {
      throw new GeoPackageException(
        "Failed to retrieve Contents"
        + " for table name: " + tableName);
    }
    if (contents == null) {
      throw new GeoPackageException(
        "No Table: Contents exists for table name: " + tableName);
    }
    return this.getAttributesDaoFromContents(contents);
  }

  /**
   * {@inheritDoc}
   */
  public getUserCustomDao(tableName: string): UserCustomDao {
    const table = UserCustomTableReader.readUserCustomTable(this.database, tableName);
    return this.getUserCustomDaoFromUserCustomTable(table);
  }

  /**
   * {@inheritDoc}
   */
  public getUserCustomDaoFromUserCustomTable(table: UserCustomTable): UserCustomDao {
    return new UserCustomDao(this.getName(), this.database, table);
  }

  /**
   * {@inheritDoc}
   */
  public execSQL(sql: string): void {
    this.database.run(sql);
  }

  /**
   * {@inheritDoc}
   */
  public query(sql: string, args: any[]): ResultSet {
    return this.database.query(sql, args);
  }

  /**
   * {@inheritDoc}
   */
  public getConnection(): GeoPackageConnection {
    return this.database;
  }

  /**
   * {@inheritDoc}
   */
  public size(): number {
    return this.database.size();
  }

  /**
   * {@inheritDoc}
   */
  public readableSize(): string {
    return this.database.readableSize();
  }


  /**
   * Perform a foreign key check
   * @param tableName
   */
  public foreignKeyCheck(tableName: string = null): ResultSet {
    const resultSet = this.query(SQLUtils.foreignKeyCheckSQL(tableName), null);
    try {
      if (!resultSet.next()) {
      }
    } catch (e) {
      throw new GeoPackageException("Foreign key check failed on database: " + this.getName());
    }
    return resultSet;
  }

  /**
   * {@inheritDoc}
   */
  public integrityCheck(): ResultSet {
    return this.integrityCheckResultSet(this.query(SQLUtils.integrityCheckSQL(), null));
  }

  /**
   * {@inheritDoc}
   */
  public quickCheck(): ResultSet {
    return this.integrityCheckResultSet(this.query(SQLUtils.quickCheckSQL(), null));
  }

  /**
   * Check the result set returned from the integrity check to see if things
   * are "ok"
   *
   * @param resultSet
   * @return null if ok, else the open result set
   */
  private integrityCheckResultSet(resultSet: ResultSet): ResultSet {
    try {
      if (resultSet.next()) {
        const value = resultSet.getStringAtIndex(1);
        if (value === "ok") {
          resultSet = null;
        }
      }
    } catch (e) {
      throw new GeoPackageException("Integrity check failed on database: " + this.getName());
    }
    return resultSet;
  }

  /**
   * {@inheritDoc}
   */
  public close(): void {
    this.database.close();
  }

  /**
   * {@inheritDoc}
   */
  public getName(): string {
    return this.name;
  }

  /**
   * {@inheritDoc}
   */
  public getPath(): string {
    return this.path;
  }

  /**
   * {@inheritDoc}
   */
  public getDatabase(): GeoPackageConnection {
    return this.database;
  }

  /**
   * {@inheritDoc}
   */
  public getTableCreator(): GeoPackageTableCreator {
    return this.tableCreator;
  }

  /**
   * {@inheritDoc}
   */
  public isWritable(): boolean {
    return this.writable;
  }

  /**
   * {@inheritDoc}
   */
  public getApplicationId(): string {
    return this.database.getApplicationId();
  }

  // /**
  //  * {@inheritDoc}
  //  */
  // public getApplicationIdInteger(): number {
  //   return this.database.getApplicationIdInteger();
  // }
  //
  // /**
  //  * {@inheritDoc}
  //  */
  // public getApplicationIdHex(): string {
  //   return this.database.getApplicationIdHex();
  // }
  //
  // /**
  //  * {@inheritDoc}
  //  */
  // public getUserVersion(): number {
  //   return this.database.getUserVersion();
  // }
  //
  // /**
  //  * {@inheritDoc}
  //  */
  // public getUserVersionMajor(): number {
  //   return this.database.getUserVersionMajor();
  // }
  //
  // /**
  //  * {@inheritDoc}
  //  */
  // public getUserVersionMinor(): number {
  //   return this.database.getUserVersionMinor();
  // }
  //
  // /**
  //  * {@inheritDoc}
  //  */
  // public getUserVersionPatch(): number {
  //   return this.database.getUserVersionPatch();
  // }

  /**
   * {@inheritDoc}
   */
  public getFeatureTables(): string[] {
    return this.getTables(ContentsDataType.FEATURES);
  }

  /**
   * {@inheritDoc}
   */
  public getTileTables(): string[] {
    return this.getTables(ContentsDataType.TILES);
  }

  /**
   * {@inheritDoc}
   */
  public getAttributesTables(): string[] {
    return this.getTables(ContentsDataType.ATTRIBUTES);
  }

  /**
   * {@inheritDoc}
   */
  public getTables(type: ContentsDataType): string[] {
    let tableNames;
    try {
      tableNames = this.getContentsDao().getTables(type);
    } catch (e) {
      throw new GeoPackageException("Failed to retrieve " + type + " tables");
    }
    return tableNames;
  }

  /**
   * {@inheritDoc}
   */
  public getTablesForTypes(types: ContentsDataType[]): string[] {
    let tableNames;
    try {
      tableNames = this.getContentsDao().getTablesForTypes(types);
    } catch (e) {
      throw new GeoPackageException(
        "Failed to retrieve tables of types: " + types);
    }
    return tableNames;
  }

  /**
   * {@inheritDoc}
   */
  public getTypeContents(type: ContentsDataType): Contents[] {
    let contents;
    try {
      contents = this.getContentsDao().getContents(type);
    } catch (e) {
      throw new GeoPackageException(
        "Failed to retrieve " + type + " contents");
    }
    return contents;
  }

  /**
   * {@inheritDoc}
   */
  public getTypeContentsWithTypes(types: ContentsDataType[]): Contents[] {
    let contents;
    try {
      contents = this.getContentsDao().getContentsForTypes(types);
    } catch (e) {
      throw new GeoPackageException(
        "Failed to retrieve of: Contents types: " + types);
    }
    return contents;
  }

  /**
   * {@inheritDoc}
   */
  public getTypeContentsWithString(type: string): Contents[]  {
    let contents;
    try {
      contents = this.getContentsDao().getContents(type);
    } catch (e) {
      throw new GeoPackageException(
        "Failed to retrieve " + type + " contents");
    }
    return contents;
  }

  /**
   * {@inheritDoc}
   */
  public isFeatureTable(table: string): boolean {
    return this.isTableType(table, ContentsDataType.FEATURES);
  }

  /**
   * {@inheritDoc}
   */
  public isTileTable(table: string): boolean {
    return this.isTableType(table, ContentsDataType.TILES);
  }

  /**
   * {@inheritDoc}
   */
  public isAttributeTable(table: string): boolean {
    return this.isTableType(table, ContentsDataType.ATTRIBUTES);
  }

  /**
   * {@inheritDoc}
   */
  public isTableType(table: string, type: ContentsDataType): boolean {
    return this.isTableTypeWithTypes(table, [type]);
  }

  /**
   * {@inheritDoc}
   */
  public isTableTypeWithTypes(table: string, types: ContentsDataType[]): boolean {

    return types.indexOf(this.getTableDataType(table)) !== -1;
  }

  /**
   * {@inheritDoc}
   */
  public isTableTypeWithStringType(table: string, type: string): boolean {
    return this.isTableTypeWithStringTypes(table, [type]);
  }

  /**
   * {@inheritDoc}
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
   * {@inheritDoc}
   */
  public isContentsTable(table: string): boolean {
    return this.getTableContents(table) != null;
  }

  /**
   * {@inheritDoc}
   */
  public isTable(table: string): boolean {
    return this.database.tableExists(table);
  }

  /**
   * {@inheritDoc}
   */
  public isView(view: string): boolean {
    return this.database.viewExists(view);
  }

  /**
   * {@inheritDoc}
   */
  public isTableOrView(name: string): boolean {
    return this.database.tableOrViewExists(name);
  }

  /**
   * {@inheritDoc}
   */
  public getTableContents(table: string): Contents {
    const contentDao = this.getContentsDao();
    let contents = null;
    try {
      contents = contentDao.queryForId(table);
    } catch (e) {
      throw new GeoPackageException(
        "Failed to retrieve table contents: " + table);
    }
    return contents;
  }

  /**
   * {@inheritDoc}
   */
  public getTableType(table: string): string {
    let tableType = null;
    let contents = this.getTableContents(table);
    if (contents != null) {
      tableType = contents.getDataTypeName();
    }
    return tableType;
  }

  /**
   * {@inheritDoc}
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
   * {@inheritDoc}
   */
  public getContentsBoundingBox(projection: Projection): BoundingBox {
    return this.getContentsDao().getBoundingBoxInProjection(projection);
  }

  /**
   * {@inheritDoc}
   */
  public getContentsBoundingBoxWithProjection(table: string, projection: Projection = null): BoundingBox {
    const contentsDao = this.getContentsDao();
    return contentsDao.getBoundingBoxForTableInProjection(projection, table);
  }

  /**
   * {@inheritDoc}
   */
  public getBoundingBox(table: string, projection: Projection = null, manual = false): BoundingBox {
    let tableBoundingBox = this.getTableBoundingBox(table, projection, manual);

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
   * {@inheritDoc}
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
          throw new GeoPackageException(
            "Failed to retrieve tile matrix set for table: "
            + table);
        }
          boundingBox = tileMatrixSet.getBoundingBox(projection);
          break;
        default:
      }
    }
    return boundingBox;
  }

  /**
   * {@inheritDoc}
   */
  public getContentsProjection(table: string): Projection {
    let contents = this.getTableContents(table);
    if (contents == null) {
      throw new GeoPackageException("Failed to retrieve for: Contents table: " + table);
    }
    return contents.getProjection();
  }

  /**
   * {@inheritDoc}
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
          throw new GeoPackageException(
            "Failed to retrieve geometry columns for table: "
            + table);
        }
          projection = geometryColumns.getProjection();
          break;
        case ContentsDataType.TILES:
          let tileMatrixSet = null;
          try {
            tileMatrixSet = this.getTileMatrixSetDao().queryForId(table);
          } catch (e) {
          throw new GeoPackageException("Failed to retrieve tile matrix set for table: " + table);
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
   * {@inheritDoc}
   */
  public getSpatialReferenceSystemDao(): SpatialReferenceSystemDao {
    const dao = SpatialReferenceSystemDao.createDao(this.getConnection());
    dao.setCrsWktExtension(new CrsWktExtension(this));
    return dao;
  }

  /**
   * {@inheritDoc}
   */
  public getContentsDao(): ContentsDao {
    return ContentsDao.createDao(this.getConnection());
  }

  /**
   * {@inheritDoc}
   */
  public getGeometryColumnsDao(): GeometryColumnsDao {
    return GeometryColumnsDao.createDao(this.getConnection());
  }

  /**
   * {@inheritDoc}
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
      throw new GeoPackageException("Failed to check if GeometryColumns table exists and create it");
    }
    return created;
  }

  /**
   * {@inheritDoc}
   */
  public createFeatureTable(table: FeatureTable): void {
    this.createUserTable(table);
  }

  /**
   * {@inheritDoc}
   */
  public createFeatureTableWithFeatureTableMetadata(metadata: FeatureTableMetadata): FeatureTable {

    GeometryColumns geometryColumns = metadata.getGeometryColumns();
    if (geometryColumns == null) {
      throw new GeoPackageException(
        "Geometry Columns are required to create a feature table");
    }

    // Get the SRS
    SpatialReferenceSystem srs = geometryColumns.getSrs();
    if (srs == null) {
      srs = getSrs(geometryColumns.getSrsId());
      geometryColumns.setSrs(srs);
    }

    // Create the Geometry Columns table
    createGeometryColumnsTable();

    // Create the user feature table
    string tableName = metadata.getTableName();
    FeatureTable table = new FeatureTable(tableName,
      metadata.getColumnName(), metadata.buildColumns());
    createFeatureTable(table);

    try {
      // Create the contents
      contents: Contents = new Contents();
      contents.setTableName(tableName);
      contents.setDataTypeName(metadata.getDataType(),
        ContentsDataType.FEATURES);
      contents.setIdentifier(tableName);
      // contents.setLastChange(new Date());
      boundingBox: BoundingBox = metadata.getBoundingBox();
      if (boundingBox != null) {
        contents.setMinX(boundingBox.getMinLongitude());
        contents.setMinY(boundingBox.getMinLatitude());
        contents.setMaxX(boundingBox.getMaxLongitude());
        contents.setMaxY(boundingBox.getMaxLatitude());
      }
      contents.setSrs(srs);
      getContentsDao().create(contents);

      table.setContents(contents);

      // Create new geometry columns
      geometryColumns.setContents(contents);
      getGeometryColumnsDao().create(geometryColumns);

    } catch (RuntimeException e) {
      deleteTableQuietly(tableName);
      throw e;
    } catch (e) {
      deleteTableQuietly(tableName);
      throw new GeoPackageException(
        "Failed to create table and metadata: " + tableName);
    }

    return table;
  }

  /**
   * {@inheritDoc}
   */
  public getTileMatrixSetDao(): TileMatrixSetDao {
    return TileMatrixSetDao.createDao(this.getConnection());
  }

  /**
   * {@inheritDoc}
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
      throw new GeoPackageException(
        "Failed to check if TileMatrixSet table exists and create it");
    }
    return created;
  }

  /**
   * {@inheritDoc}
   */
  public getTileMatrixDao(): TileMatrixDao {
    return TileMatrixDao.createDao(this.getConnection());
  }

  /**
   * {@inheritDoc}
   */
  public createTileMatrixTable(): boolean {
    this.verifyWritable();

    let created: boolean = false;
    const dao = this.getTileMatrixDao();
    try {
      if (!dao.isTableExists()) {
        created = this.tableCreator.createTileMatrix();
      }
    } catch (e) {
      throw new GeoPackageException(
        "Failed to check if TileMatrix table exists and create it");
    }
    return created;
  }

  /**
   * {@inheritDoc}
   */
  public createTileTable(table: TileTable): void {
    this.createUserTable(table);
  }

  /**
   * {@inheritDoc}
   */
  public createTileTable(metadata: TileTableMetadata): TileTable {

    // Get the SRS
    SpatialReferenceSystem contentsSrs = getSrs(
      metadata.getContentsSrsId());
    SpatialReferenceSystem tileMatrixSetSrs = getSrs(
      metadata.getTileSrsId());

    // Create the Tile Matrix Set and Tile Matrix tables
    createTileMatrixSetTable();
    createTileMatrixTable();

    // Create the user tile table
    string tableName = metadata.getTableName();
    TileColumn[] columns = metadata.buildColumns();
    TileTable table = new TileTable(tableName, columns);
    createTileTable(table);

    try {
      // Create the contents
      contents: Contents = new Contents();
      contents.setTableName(tableName);
      contents.setDataTypeName(metadata.getDataType(),
        ContentsDataType.TILES);
      contents.setIdentifier(tableName);
      // contents.setLastChange(new Date());
      contentsBoundingBox: BoundingBox = metadata.getContentsBoundingBox();
      contents.setMinX(contentsBoundingBox.getMinLongitude());
      contents.setMinY(contentsBoundingBox.getMinLatitude());
      contents.setMaxX(contentsBoundingBox.getMaxLongitude());
      contents.setMaxY(contentsBoundingBox.getMaxLatitude());
      contents.setSrs(contentsSrs);
      getContentsDao().create(contents);

      table.setContents(contents);

      // Create new matrix tile set
      TileMatrixSet tileMatrixSet = new TileMatrixSet();
      tileMatrixSet.setContents(contents);
      tileMatrixSet.setSrs(tileMatrixSetSrs);
      tileMatrixSetBoundingBox: BoundingBox = metadata
        .getTileBoundingBox();
      tileMatrixSet.setMinX(tileMatrixSetBoundingBox.getMinLongitude());
      tileMatrixSet.setMinY(tileMatrixSetBoundingBox.getMinLatitude());
      tileMatrixSet.setMaxX(tileMatrixSetBoundingBox.getMaxLongitude());
      tileMatrixSet.setMaxY(tileMatrixSetBoundingBox.getMaxLatitude());
      getTileMatrixSetDao().create(tileMatrixSet);

    } catch (RuntimeException e) {
      deleteTableQuietly(tableName);
      throw e;
    } catch (e) {
      deleteTableQuietly(tableName);
      throw new GeoPackageException(
        "Failed to create table and metadata: " + tableName);
    }

    return table;
  }

  /**
   * Get the Spatial Reference System by id
   *
   * @param srsId
   *            srs id
   * @return srs
   */
  private getSrs(srsId: number): SpatialReferenceSystem {
    let srs;
    try {
      srs = this.getSpatialReferenceSystemDao().queryForId(srsId);
    } catch (e1) {
      throw new GeoPackageException("Failed to retrieve Spatial Reference System. SRS ID: " + srsId);
    }
    if (srs == null) {
      throw new GeoPackageException("Spatial Reference System could not be found. SRS ID: " + srsId);
    }
    return srs;
  }

  /**
   * {@inheritDoc}
   */
  public createAttributesTable(table: AttributesTable): void {
    this.createUserTable(table);
  }

  /**
   * {@inheritDoc}
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
      const contents = new Contents();
      contents.setTableName(tableName);
      contents.setDataTypeName(metadata.getDataType(), ContentsDataType.ATTRIBUTES);
      contents.setIdentifier(tableName);
      this.getContentsDao().create(contents);
      table.setContents(contents);

    } catch (e) {
      this.deleteTableQuietly(tableName);
      throw new GeoPackageException("Failed to create table and metadata: " + tableName);
    }

    return table;
  }

  /**
   * {@inheritDoc}
   */
  public getExtensionsDao(): ExtensionsDao {
    return ExtensionsDao.createDao(this.getConnection());
  }

  /**
   * {@inheritDoc}
   */
  public createExtensionsTable(): boolean {
    this.verifyWritable();

    let created = false;
    const dao = this.getExtensionsDao();
    try {
      if (!dao.isTableExists()) {
        created = this.tableCreator.createExtensions();
      }
    } catch (e) {
      throw new GeoPackageException(
        "Failed to check if Extensions table exists and create it");
    }
    return created;
  }

  /**
   * {@inheritDoc}
   */
  public deleteTable(table: string): void {
    this.verifyWritable();
    this.getExtensionManager().deleteTableExtensions(table);
    const contentsDao = this.getContentsDao();
    contentsDao.deleteTable(table);
  }

  /**
   * {@inheritDoc}
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
   * {@inheritDoc}
   */
  public enableForeignKeys(): boolean {
    return this.database.setForeignKeys(true);
  }

  /**
   * {@inheritDoc}
   */
  public foreignKeys(): boolean {
    return this.database.foreignKeys();
  }

  /**
   * {@inheritDoc}
   */
  public setForeignKeys(on: boolean): boolean {
    return this.database.setForeignKeys(on);
  }

  /**
   * {@inheritDoc}
   */
  public verifyWritable(): void {
    if (!this.writable) {
      throw new GeoPackageException("GeoPackage file is not writable. Name: " + this.getName() + (this.path != null ? ", Path: " + this.path : ""));
    }
  }

  /**
   * {@inheritDoc}
   */
  public dropTable(table: string): void {
    this.tableCreator.dropTable(table);
  }

  /**
   * {@inheritDoc}
   */
  public dropView(view: string): void {
    this.tableCreator.dropView(view);
  }

  /**
   * {@inheritDoc}
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
   * {@inheritDoc}
   */
  public copyTableNoExtensions(tableName: string, newTableName: string): void {
    this.copyTable(tableName, newTableName, true, false);
  }

  /**
   * {@inheritDoc}
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
  protected copyTable(tableName: string, newTableName: string, transferContent = true, extensions = true): void {
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
          throw new GeoPackageException("Unsupported data type: " + dataType);
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
      throw new GeoPackageException(
        "Failed to retrieve table geometry columns: " + tableName);
    }
    if (geometryColumns == null) {
      throw new GeoPackageException(
        "No geometry columns for table: " + tableName);
    }

    let contents = this.copyUserTable(tableName, newTableName, transferContent);
    geometryColumns.setContents(contents);
    try {
      geometryColumnsDao.create(geometryColumns);
    } catch (e) {
      throw new GeoPackageException(
        "Failed to create geometry columns for feature table: "
        + newTableName);
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
      throw new GeoPackageException(
        "Failed to retrieve table tile matrix set: " + tableName);
    }
    if (tileMatrixSet == null) {
      throw new GeoPackageException(
        "No tile matrix set for table: " + tableName);
    }

    const tileMatrixDao = this.getTileMatrixDao();
    let tileMatrices = null;
    try {
      tileMatrices = tileMatrixDao.queryForEq(TileMatrix.COLUMN_TABLE_NAME, tableName);
    } catch (e) {
      throw new GeoPackageException(
        "Failed to retrieve table tile matrixes: " + tableName);
    }

    let contents = this.copyUserTable(tableName, newTableName, transferContent);

    tileMatrixSet.setContents(contents);
    try {
      tileMatrixSetDao.create(tileMatrixSet);
    } catch (e) {
      throw new GeoPackageException("Failed to create tile matrix set for tile table: " + newTableName);
    }

    for (const tileMatrix of tileMatrices) {
      tileMatrix.setContents(contents);
      try {
        tileMatrixDao.create(tileMatrix);
      } catch (e) {
        throw new GeoPackageException("Failed to create tile matrix for tile table: " + newTableName);
      }
    }

  }

  /**
   * Copy the user table
   *
   * @param tableName table name
   * @param newTableName new table name
   * @param transferContent transfer user table content flag
   * @param validateContents true to validate a was: Contents copied
   * @return copied contents
   */
  protected copyUserTable(tableName: string, newTableName: string, transferContent: boolean, validateContents = true): Contents {
    AlterTable.copyTableWithName(this.database, tableName, newTableName, transferContent);
    let contents = this.copyContents(tableName, newTableName);
    if (contents == null && validateContents) {
      throw new GeoPackageException("No table found: Contents for table: " + tableName);
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
    let contents = this.getTableContents(tableName);
    if (contents != null) {
      contents.setTableName(newTableName);
      contents.setIdentifier(newTableName);
      try {
        this.getContentsDao().create(contents);
      } catch (e) {
        throw new GeoPackageException("Failed to create for: Contents table: " + newTableName + ", copied from table: " + tableName);
      }
    }

    return contents;
  }

  /**
   * {@inheritDoc}
   */
  public vacuum(): void {
    SQLUtils.vacuum(this.database);
  }

  /**
   * {@inheritDoc}
   */
  public getExtensionManager(): ExtensionManager {
    return new ExtensionManager(this);
  }

  /**
   * {@inheritDoc}
   */
  public createUserTable(table: UserTable<UserColumn>): void {
    this.verifyWritable();
    this.tableCreator.createUserTable(table);
  }
}
