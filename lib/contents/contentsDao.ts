import { CreateOrUpdateStatus } from '../dao/dao';
import { TileMatrixDao } from '../tiles/matrix/tileMatrixDao';
import { TileMatrixSetDao } from '../tiles/matrixset/tileMatrixSetDao';
import { GeometryColumnsDao } from '../features/columns/geometryColumnsDao';
import { Contents } from './contents';
import { ColumnValues } from '../dao/columnValues';
import { GeometryColumns } from '../features/columns/geometryColumns';
import { TileMatrixSet } from '../tiles/matrixset/tileMatrixSet';
import { TileMatrix } from '../tiles/matrix/tileMatrix';
import { BoundingBox } from '../boundingBox';
import { DBValue } from '../db/dbAdapter';
import { ContentsDataType } from './contentsDataType';
import { Projection } from '@ngageoint/projections-js';
import { GeoPackageException } from '../geoPackageException';
import { GeoPackageDao } from '../db/geoPackageDao';
import { GeoPackageConnection } from '../db/geoPackageConnection';
import { SpatialReferenceSystemDao } from '../srs/spatialReferenceSystemDao';

/**
 * Contents object. Provides identifying and descriptive information that an
 * application can display to a user in a menu of geospatial data that is
 * available for access and/or update.
 * @class ContentsDao
 * @extends Dao
 */
export class ContentsDao extends GeoPackageDao<Contents, string> {
  /**
   * Geometry Columns DAO
   */
  private geometryColumnsDao: GeometryColumnsDao;

  /**
   * Tile Matrix Set DAO
   */
  private tileMatrixSetDao: TileMatrixSetDao;

  /**
   * Tile Matrix DAO
   */
  private tileMatrixDao: TileMatrixDao;

  /**
   * Constructor
   * @param geoPackageConnection GeoPackage object this dao belongs to
   */
  constructor(geoPackageConnection: GeoPackageConnection) {
    super(geoPackageConnection, Contents.TABLE_NAME);
    this.geometryColumnsDao = GeometryColumnsDao.createDao(geoPackageConnection);
    this.tileMatrixSetDao = TileMatrixSetDao.createDao(geoPackageConnection);
    this.tileMatrixDao = TileMatrixDao.createDao(geoPackageConnection);
  }

  public static createDao(geoPackageConnection: GeoPackageConnection): ContentsDao {
    return new ContentsDao(geoPackageConnection);
  }

  queryForIdWithKey(key: string): Contents {
    return this.queryForId(key);
  }

  /**
   * Creates a new Contents object
   * @return {module:core/contents~Contents} new Contents object
   */
  createObject(results?: Record<string, DBValue>): Contents {
    const c = new Contents();
    if (results) {
      c.setTableName(results.table_name as string);
      c.setDataTypeName(results.data_type as string);
      c.setIdentifier(results.identifier as string);
      c.setDescription(results.description as string);
      c.setLastChange(new Date(results.last_change as string));
      c.setMinY(results.min_y as number);
      c.setMaxY(results.max_y as number);
      c.setMinX(results.min_x as number);
      c.setMaxX(results.max_x as number);
      c.setSrs(SpatialReferenceSystemDao.createDao(this.db).getBySrsId(results.srs_id as number));
      this.getAndSetGeometryColumns(c);
      this.getAndSetTileMatrixSet(c);
      this.getAndSetTileMatrix(c);
    }
    return c;
  }

  /**
   * Gets the Contents for a particular table type
   * @param tableType
   */
  getContents(tableType?: string | ContentsDataType): Contents[] {
    return this.getContentsForTypes(tableType != null ? [tableType] : []);
  }

  /**
   * Gets the Contents matching any of the table types
   * @param tableTypes
   */
  getContentsForTypes(tableTypes?: string[] | ContentsDataType[]): Contents[] {
    const results: Contents[] = [];
    if (tableTypes && tableTypes.length > 0) {
      const fieldValues = new ColumnValues();
      tableTypes.forEach(type => {
        if (type != null) {
          fieldValues.addColumn(
            Contents.COLUMN_DATA_TYPE,
            typeof type === 'string' ? type : ContentsDataType.nameFromType(type),
          );
        }
      });
      const whereString = this.buildWhere(fieldValues, 'or');
      const whereArgs = this.buildWhereArgs(fieldValues);
      for (const row of this.queryWhere(whereString, whereArgs)) {
        const contents = this.createObject(row);
        results.push(contents);
      }
    }
    return results;
  }

  /**
   * Get the GeometryColumns for the Contents
   * @param  {module:core/contents~Contents} contents Contents
   * @return {module:features/columns~GeometryColumns}
   */
  private getAndSetGeometryColumns(contents: Contents): GeometryColumns {
    const dao: GeometryColumnsDao = this.getGeometryColumnsDao();
    const results = dao.queryForAllEq(GeometryColumns.COLUMN_TABLE_NAME, contents.getTableName());
    if (results?.length) {
      const gc: GeometryColumns = dao.createObject(results[0]);
      contents.setGeometryColumns(gc);
    }
    return undefined;
  }

  /**
   * Get the TileMatrixSet for the Contents
   * @param  {module:core/contents~Contents} contents Contents
   * @return {module:tiles/matrixset~TileMatrixSet}
   */
  private getAndSetTileMatrixSet(contents: Contents): TileMatrixSet {
    const dao = this.getTileMatrixSetDao();
    const results = dao.queryForAllEq(TileMatrixSetDao.COLUMN_TABLE_NAME, contents.getTableName());
    if (results?.length) {
      contents.setTileMatrixSet(dao.createObject(results[0]));
    }
    return undefined;
  }

  /**
   * Get the TileMatrix for the Contents
   * @param  {module:core/contents~Contents} contents Contents
   * @return {module:tiles/matrix~TileMatrix}
   */
  private getAndSetTileMatrix(contents: Contents): TileMatrix[] {
    const dao = this.getTileMatrixDao();
    const results = dao.queryForAllEq(TileMatrix.COLUMN_TABLE_NAME, contents.getTableName());
    if (!results || !results.length) return undefined;
    const tileMatrices = [];
    for (let i = 0; i < results.length; i++) {
      const gc = dao.createObject(results[i]);
      tileMatrices.push(gc);
    }
    contents.setTileMatrix(tileMatrices);
  }

  /**
   * Performs cascading delete of the contents provided
   * @param contents
   */
  deleteCascadeContents(contents: Contents): number {
    let count = 0;
    if (contents !== null && contents !== undefined) {
      const dataType = ContentsDataType.fromName(contents.getDataType());
      if (dataType !== null && dataType !== undefined) {
        switch (dataType) {
          case ContentsDataType.FEATURES:
            // Delete Geometry Columns
            const geometryColumnsDao = this.getGeometryColumnsDao();
            if (geometryColumnsDao.isTableExists()) {
              const geometryColumns = contents.getGeometryColumns();
              if (geometryColumns !== null && geometryColumns !== undefined) {
                geometryColumnsDao.deleteByMultiId([geometryColumns.getTableName(), geometryColumns.getColumnName()]);
              }
            }
            break;
          case ContentsDataType.TILES:
            // case GRIDDED_COVERAGE:
            // Delete Tile Matrix collection
            const tileMatrixDao = this.getTileMatrixDao();
            if (tileMatrixDao.isTableExists()) {
              const tileMatrixCollection = contents.getTileMatrix();
              if (
                tileMatrixCollection !== null &&
                tileMatrixCollection !== undefined &&
                tileMatrixCollection.length > 0
              ) {
                tileMatrixCollection.forEach(tileMatrix => {
                  tileMatrixDao.deleteByMultiId([tileMatrix.getTableName(), tileMatrix.getZoomLevel()]);
                });
              }
            }
            // Delete Tile Matrix Set
            const tileMatrixSetDao = this.getTileMatrixSetDao();
            if (tileMatrixSetDao.isTableExists()) {
              const tileMatrixSet = contents.getTileMatrixSet();
              if (tileMatrixSet !== null && tileMatrixSet !== undefined) {
                tileMatrixSetDao.deleteById(tileMatrixSet.table_name);
              }
            }
            break;
          case ContentsDataType.ATTRIBUTES:
            this.dropTableWithTableName(contents.getTableName());
            break;
        }
      } else {
        this.dropTableWithTableName(contents.getTableName());
      }

      count = this.delete(contents);
    }

    return count;
  }

  deleteCascade(contents: Contents, userTable = false): number {
    const count = this.deleteCascadeContents(contents);
    if (userTable) {
      this.dropTableWithTableName(contents.getTableName());
    }
    return count;
  }

  deleteByIdCascade(id: string, userTable: boolean): number {
    let count = 0;
    if (id !== null && id !== undefined) {
      const contents = this.queryForId(id);
      if (contents !== null && contents !== undefined) {
        count = this.deleteCascade(contents, userTable);
      } else if (userTable) {
        this.dropTableWithTableName(id);
      }
    }
    return count;
  }

  deleteTable(table: string): void {
    try {
      this.deleteByIdCascade(table, true);
    } catch (e) {
      throw new Error('Failed to delete table: ' + table);
    }
  }

  /**
   * {@inheritDoc}
   * <p>
   * Verify optional tables have been created
   */
  public createOrUpdate(contents: Contents): CreateOrUpdateStatus {
    this.verifyCreate(contents);
    return super.createOrUpdate(contents);
  }

  /**
   * Get table names by data type
   * @param dataType data type
   * @return table names
   */
  public getTables(dataType?: string | ContentsDataType): string[] {
    return this.getTablesForTypes(dataType != null ? [dataType] : []);
  }

  /**
   * Get table names for the provided data types
   *
   * @param dataTypes data type
   * @return table names
   */
  public getTablesForTypes(dataTypes?: string[] | ContentsDataType[]): string[] {
    let results;
    if (dataTypes != null && dataTypes.length > 0) {
      const fieldValues = new ColumnValues();
      dataTypes.forEach(type => {
        if (type != null) {
          fieldValues.addColumn(
            Contents.COLUMN_DATA_TYPE,
            typeof type === 'string' ? type : ContentsDataType.nameFromType(type),
          );
        }
      });
      const where = this.buildWhere(fieldValues, 'or');
      const whereArgs = this.buildWhereArgs(fieldValues);
      results = this.queryForColumnWhere('table_name', where, whereArgs);
    } else {
      results = this.queryForColumns('table_name');
    }
    const tableNames = [];
    for (let i = 0; i < results.length; i++) {
      tableNames.push(results[i].table_name as string);
    }
    return tableNames;
  }

  /**
   * Get the bounding box for all tables in the provided projection
   *
   * @param projection desired bounding box projection
   *
   * @return bounding box
   */
  public getBoundingBoxInProjection(projection: Projection): BoundingBox {
    let boundingBox = null;

    let tables = null;
    try {
      tables = this.getTables();
    } catch (e) {
      throw new GeoPackageException('Failed to query for contents tables');
    }

    for (const table of tables) {
      const tableBoundingBox = this.getBoundingBoxForTableInProjection(projection, this.gpkgTableName);
      if (tableBoundingBox != null) {
        if (boundingBox != null) {
          boundingBox = boundingBox.union(tableBoundingBox);
        } else {
          boundingBox = tableBoundingBox;
        }
      }
    }

    return boundingBox;
  }

  /**
   * Get the bounding box for the table in the table's projection
   *
   * @param table
   *            table name
   *
   * @return bounding box
   */
  public getBoundingBox(table: string): BoundingBox {
    return this.getBoundingBoxForTableInProjection(null, table);
  }

  /**
   * Get the bounding box for the table in the provided projection
   *
   * @param projection
   *            desired bounding box projection
   * @param table
   *            table name
   *
   * @return bounding box
   */
  public getBoundingBoxForTableInProjection(projection: Projection, table: string): BoundingBox {
    let boundingBox = null;

    let contents = null;
    try {
      contents = this.queryForId(table);
    } catch (e) {
      throw new GeoPackageException('Failed to query for contents of table: ' + table);
    }

    if (contents == null) {
      throw new GeoPackageException('No contents for table: ' + table);
    }

    boundingBox = contents.getBoundingBoxInProjection(projection);

    return boundingBox;
  }

  /**
   * Get the data type names from the data types
   *
   * @param dataTypes
   *            data types
   * @return data type names
   */
  private dataTypeNames(dataTypes: ContentsDataType[]): string[] {
    const types = [];
    if (dataTypes != null) {
      for (let i = 0; i < dataTypes.length; i++) {
        types.push(ContentsDataType.nameFromType(dataTypes[i]));
      }
    }
    return types;
  }

  /**
   * Get the tables names from the contents
   *
   * @param contents contents
   * @return table names
   */
  private tableNames(contents: Contents[]): string[] {
    const tableNames = [];
    if (contents != null) {
      for (const content of contents) {
        tableNames.push(content.getTableName());
      }
    }
    return tableNames;
  }

  /**
   * Verify the tables are in the expected state for the Contents create
   *
   * @param contents
   *            contents
   */
  private verifyCreate(contents: Contents): void {
    const dataType = contents.getDataType();
    if (dataType != null) {
      switch (dataType) {
        case ContentsDataType.FEATURES:
          // Features require Geometry Columns table (Spec Requirement 21)
          const geometryColumnsDao = this.getGeometryColumnsDao();
          if (!geometryColumnsDao.isTableExists()) {
            throw new GeoPackageException(
              'A data type of ' +
                ContentsDataType.nameFromType(dataType) +
                ' requires the GeometryColumns' +
                ' table to first be created using the GeoPackage.',
            );
          }

          break;
        case ContentsDataType.TILES:
          this.verifyTiles(dataType);
          break;
        case ContentsDataType.ATTRIBUTES:
          break;
        default:
          throw new GeoPackageException('Unsupported data type: ' + dataType);
      }
    }

    // Verify the feature or tile table exists
    if (!this.tableOrViewExists(contents.getTableName())) {
      throw new GeoPackageException(
        'No table or view exists for Content Table Name: ' + contents.getTableName() + '. Table must first be created.',
      );
    }
  }

  /**
   * Verify the required tile tables exist
   *
   * @param dataType
   *            data type
   * @throws SQLException
   *             upon tiles verification error
   */
  private verifyTiles(dataType: ContentsDataType): void {
    // Tiles require Tile Matrix Set table (Spec Requirement 37)
    const tileMatrixSetDao = this.getTileMatrixSetDao();
    if (!tileMatrixSetDao.isTableExists()) {
      throw new GeoPackageException(
        'A data type of ' +
          ContentsDataType.nameFromType(dataType) +
          ' requires the TileMatrixSet' +
          ' table to first be created using the GeoPackage.',
      );
    }

    // Tiles require Tile Matrix table (Spec Requirement 41)
    const tileMatrixDao = this.getTileMatrixDao();
    if (!tileMatrixDao.isTableExists()) {
      throw new GeoPackageException(
        'A data type of ' +
          ContentsDataType.nameFromType(dataType) +
          ' requires the TileMatrixSet' +
          ' table to first be created using the GeoPackage.',
      );
    }
  }

  /**
   * Get or create a Geometry Columns DAO
   *
   * @return geometry columns dao
   */
  private getGeometryColumnsDao(): GeometryColumnsDao {
    if (this.geometryColumnsDao == null) {
      this.geometryColumnsDao = GeometryColumnsDao.createDao(this.db);
    }
    return this.geometryColumnsDao;
  }

  /**
   * Get or create a Tile Matrix Set DAO
   *
   * @return tile matrix set dao
   */
  private getTileMatrixSetDao(): TileMatrixSetDao {
    if (this.tileMatrixSetDao == null) {
      this.tileMatrixSetDao = TileMatrixSetDao.createDao(this.db);
    }
    return this.tileMatrixSetDao;
  }

  /**
   * Get or create a Tile Matrix DAO
   *
   * @return tile matrix dao
   */
  private getTileMatrixDao(): TileMatrixDao {
    if (this.tileMatrixDao == null) {
      this.tileMatrixDao = TileMatrixDao.createDao(this.db);
    }
    return this.tileMatrixDao;
  }
}
