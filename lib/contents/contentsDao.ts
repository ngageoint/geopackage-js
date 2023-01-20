import { Projection } from '@ngageoint/projections-js';
import { CreateOrUpdateStatus } from '../dao/dao';
import { GeoPackageDao } from '../db/geoPackageDao';
import { GeoPackageException } from '../geoPackageException';
import { BoundingBox } from '../boundingBox';
import { DBValue } from '../db/dbValue';
import { Contents } from './contents';
import { FieldValues } from '../dao/fieldValues';
import { GeometryColumns } from '../features/columns/geometryColumns';
import { TileMatrixSet } from '../tiles/matrixset/tileMatrixSet';
import { TileMatrix } from '../tiles/matrix/tileMatrix';
import { ContentsDataType } from './contentsDataType';
import { GeometryTransform } from '@ngageoint/simple-features-proj-js';
import type { GeoPackage } from '../geoPackage';

/**
 * Contents object. Provides identifying and descriptive information that an
 * application can display to a user in a menu of geospatial data that is
 * available for access and/or update.
 */
export class ContentsDao extends GeoPackageDao<Contents, string> {
  readonly gpkgTableName: string = Contents.TABLE_NAME;
  readonly idColumns: string[] = [Contents.COLUMN_ID];

  /**
   * Constructor
   * @param geoPackage GeoPackage object this dao belongs to
   */
  constructor(geoPackage: GeoPackage) {
    super(geoPackage, Contents.TABLE_NAME);
  }

  public static createDao(geoPackage: GeoPackage): ContentsDao {
    return new ContentsDao(geoPackage);
  }

  queryForIdWithKey(key: string): Contents {
    return this.queryForId(key);
  }

  /**
   * Creates a new Contents object
   * @return {Contents} new Contents object
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
      c.setSrsId(results.srs_id as number);
    }
    return c;
  }

  /**
   * Gets the Contents for a particular table type
   * @param tableType
   */
  getContents(tableType?: string | ContentsDataType): Contents[] {
    return this.getContentsForTypes([tableType]);
  }

  /**
   * Gets the Contents matching any of the table types
   * @param tableTypes
   */
  getContentsForTypes(tableTypes?: (string | ContentsDataType)[]): Contents[] {
    const results: Contents[] = [];
    if (tableTypes && tableTypes.length > 0) {
      const fieldValues = new FieldValues();
      tableTypes.forEach(type => {
        if (type != null) {
          fieldValues.addFieldValue(
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
   * @param  {Contents} contents Contents
   * @return {GeometryColumns}
   */
  public getGeometryColumns(contents: Contents): GeometryColumns {
    const geometryColumnsDao = this.geoPackage.getGeometryColumnsDao();
    const results = geometryColumnsDao.queryForAllEq(GeometryColumns.COLUMN_TABLE_NAME, contents.getTableName());
    let result = null;
    if (results?.length) {
      result = geometryColumnsDao.createObject(results[0]);
    }
    return result;
  }

  /**
   * Get the TileMatrixSet for the Contents
   * @param  {Contents} contents Contents
   * @return {TileMatrixSet}
   */
  public getTileMatrixSet(contents: Contents): TileMatrixSet {
    const tileMatrixSetDao = this.geoPackage.getTileMatrixSetDao();
    const results = tileMatrixSetDao.queryForAllEq(TileMatrixSet.COLUMN_TABLE_NAME, contents.getTableName());
    let result = null;
    if (results?.length) {
      result = tileMatrixSetDao.createObject(results[0]);
    }
    return result;
  }

  /**
   * Get the tile matrix for the provided contents
   * @param contents
   */
  public getTileMatrix(contents: Contents): TileMatrix[] {
    const tileMatrixDao = this.geoPackage.getTileMatrixDao();
    const results = tileMatrixDao.queryForAllEq(TileMatrix.COLUMN_TABLE_NAME, contents.getTableName());
    if (!results || !results.length) return undefined;
    const tileMatrices = [];
    for (let i = 0; i < results.length; i++) {
      const gc = tileMatrixDao.createObject(results[i]);
      tileMatrices.push(gc);
    }
    return tileMatrices;
  }

  /**
   * Performs cascading delete of the contents provided
   * @param contents
   */
  deleteCascadeContents(contents: Contents): number {
    let count = 0;
    if (contents !== null && contents !== undefined) {
      const dataType = ContentsDataType.fromName(contents.getDataTypeName());
      if (dataType !== null && dataType !== undefined) {
        switch (dataType) {
          case ContentsDataType.FEATURES:
            // Delete Geometry Columns
            const geometryColumnsDao = this.geoPackage.getGeometryColumnsDao();
            if (geometryColumnsDao.isTableExists()) {
              const geometryColumns = this.getGeometryColumns(contents);
              if (geometryColumns !== null && geometryColumns !== undefined) {
                geometryColumnsDao.deleteByMultiId([geometryColumns.getTableName(), geometryColumns.getColumnName()]);
              }
            }
            break;
          case ContentsDataType.TILES:
            // case GRIDDED_COVERAGE:
            // Delete Tile Matrix collection
            const tileMatrixDao = this.geoPackage.getTileMatrixDao();
            if (tileMatrixDao.isTableExists()) {
              const tileMatrixCollection = this.getTileMatrix(contents);
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
            const tileMatrixSetDao = this.geoPackage.getTileMatrixSetDao();
            if (tileMatrixSetDao.isTableExists()) {
              const tileMatrixSet = this.getTileMatrixSet(contents);
              if (tileMatrixSet !== null && tileMatrixSet !== undefined) {
                tileMatrixSetDao.deleteById(tileMatrixSet.getTableName());
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

  /**
   * Delete cascade for contents and specify if it is a user table
   * @param contents
   * @param userTable
   */
  deleteCascade(contents: Contents, userTable = false): number {
    const count = this.deleteCascadeContents(contents);
    if (userTable) {
      this.dropTableWithTableName(contents.getTableName());
    }
    return count;
  }

  /**
   * Delete cascade using contents id
   * @param id
   * @param userTable
   */
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
      throw new GeoPackageException('Failed to delete table: ' + table);
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
  public getTables(dataType?: ContentsDataType): string[] {
    return this.getTablesForTypes(dataType != null ? [dataType] : [ContentsDataType.FEATURES, ContentsDataType.TILES, ContentsDataType.ATTRIBUTES]);
  }

  /**
   * Get table names for the provided data types
   *
   * @param dataTypes data type
   * @return table names
   */
  public getTablesForTypes(dataTypes?: ContentsDataType[]): string[] {
    let results;
    if (dataTypes != null && dataTypes.length > 0) {
      const fieldValues = new FieldValues();
      dataTypes.forEach(type => {
        fieldValues.addFieldValue(Contents.COLUMN_DATA_TYPE, ContentsDataType.nameFromType(type));
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

    boundingBox = this.getBoundingBoxWithContentsAndProjection(contents, projection);

    return boundingBox;
  }

  /**
   * Get the data type names from the data types
   *
   * @param dataTypes
   *            data types
   * @return data type names
   */
  private getDataTypeNames(dataTypes: ContentsDataType[]): string[] {
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
  private getTableNames(contents: Contents[]): string[] {
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
          if (!this.geoPackage.getGeometryColumnsDao().isTableExists()) {
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
   * @param dataType data type
   */
  private verifyTiles(dataType: ContentsDataType): void {
    // Tiles require Tile Matrix Set table (Spec Requirement 37)
    if (!this.geoPackage.getTileMatrixSetDao().isTableExists()) {
      throw new GeoPackageException(
        'A data type of ' +
          ContentsDataType.nameFromType(dataType) +
          ' requires the TileMatrixSet' +
          ' table to first be created using the GeoPackage.',
      );
    }

    // Tiles require Tile Matrix table (Spec Requirement 41)
    if (!this.geoPackage.getTileMatrixDao().isTableExists()) {
      throw new GeoPackageException(
        'A data type of ' +
          ContentsDataType.nameFromType(dataType) +
          ' requires the TileMatrixSet' +
          ' table to first be created using the GeoPackage.',
      );
    }
  }

  /**
   * Gets the contents of the GeometryColumns
   * @param geometryColumns
   * @return contents
   */
  getContentsWithGeometryColumns(geometryColumns: GeometryColumns): Contents {
    return this.queryForId(geometryColumns.getTableName());
  }

  /**
   * Get a bounding box in the provided projection
   * @param contents desired projection
   * @param projection desired projection
   * @return bounding box
   */
  public getBoundingBoxWithContentsAndProjection(contents: Contents, projection: Projection): BoundingBox {
    let boundingBox = contents.getBoundingBox();
    if (boundingBox != null && projection != null) {
      const transform = GeometryTransform.create(this.getProjection(contents), projection);
      if (!transform.getToProjection().equalsProjection(transform.getFromProjection())) {
        boundingBox = boundingBox.transform(transform);
      }
    }
    return boundingBox;
  }

  /**
   * Get the projection for the contents
   * @return projection
   */
  public getProjection(contents: Contents): Projection {
    let projection = null;
    const srs = this.geoPackage.getSpatialReferenceSystemDao().queryForId(contents.getSrsId());
    if (srs != null) {
      projection = srs.getProjection();
    }
    return projection;
  }
}
