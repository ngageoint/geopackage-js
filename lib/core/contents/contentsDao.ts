import { Dao } from '../../dao/dao';
import { TileMatrixDao } from '../../tiles/matrix/tileMatrixDao';
import { TileMatrixSetDao } from '../../tiles/matrixset/tileMatrixSetDao';
import { GeometryColumnsDao } from '../../features/columns/geometryColumnsDao';
import { Contents } from './contents';
import { ColumnValues } from '../../dao/columnValues';
import { GeometryColumns } from '../../features/columns/geometryColumns';
import { TileMatrixSet } from '../../tiles/matrixset/tileMatrixSet';
import { TileMatrix } from '../../tiles/matrix/tileMatrix';
import { SpatialReferenceSystem } from '../srs/spatialReferenceSystem';
import { BoundingBox } from '../../boundingBox';
import { DBValue } from '../../db/dbAdapter';
import { ContentsDataType } from './contentsDataType';

/**
 * Contents object. Provides identifying and descriptive information that an
 * application can display to a user in a menu of geospatial data that is
 * available for access and/or update.
 * @class ContentsDao
 * @extends Dao
 */
export class ContentsDao extends Dao<Contents> {
  public static readonly TABLE_NAME: string = 'gpkg_contents';

  public static readonly COLUMN_PK: string = 'table_name';

  public static readonly COLUMN_TABLE_NAME: string = 'table_name';

  public static readonly COLUMN_DATA_TYPE: string = 'data_type';

  public static readonly COLUMN_IDENTIFIER: string = 'identifier';

  public static readonly COLUMN_DESCRIPTION: string = 'description';

  public static readonly COLUMN_LAST_CHANGE: string = 'last_change';

  public static readonly COLUMN_MIN_X: string = 'min_x';

  public static readonly COLUMN_MIN_Y: string = 'min_y';

  public static readonly COLUMN_MAX_X: string = 'max_x';

  public static readonly COLUMN_MAX_Y: string = 'max_y';

  public static readonly COLUMN_SRS_ID: string = 'srs_id';

  readonly gpkgTableName: string = ContentsDao.TABLE_NAME;

  readonly idColumns: string[] = [ContentsDao.COLUMN_PK];

  /**
   * Creates a new Contents object
   * @return {module:core/contents~Contents} new Contents object
   */
  createObject(results?: Record<string, DBValue>): Contents {
    const c = new Contents();
    if (results) {
      c.table_name = results.table_name as string;
      c.data_type = results.data_type as string;
      c.identifier = results.identifier as string;
      c.description = results.description as string;
      c.last_change = results.last_change as string;
      c.min_y = results.min_y as number;
      c.max_y = results.max_y as number;
      c.min_x = results.min_x as number;
      c.max_x = results.max_x as number;
      c.srs_id = results.srs_id as number;
    }
    return c;
  }

  /**
   * Get table names by table type
   * @param  {string} [tableType] table type to query for
   * @return {string[]}           Array of table names
   */
  getTables(tableType?: string): string[] {
    let results = [];
    if (tableType) {
      const fieldValues = new ColumnValues();
      fieldValues.addColumn(ContentsDao.COLUMN_DATA_TYPE, tableType);
      results = this.queryForColumns('table_name', fieldValues);
    } else {
      results = this.queryForColumns('table_name');
    }
    const tableNames = [];
    for (let i = 0; i < results.length; i++) {
      tableNames.push(results[i].table_name as string);
    }
    return tableNames;
  }

  getContentsForTableType(tableType?: string, reprojectTo4326 = false): Contents[] {
    const results: Contents[] = [];
    if (tableType) {
      const fieldValues = new ColumnValues();
      fieldValues.addColumn(ContentsDao.COLUMN_DATA_TYPE, tableType);
      for (const row of this.queryForFieldValues(fieldValues)) {
        const contents = (row as unknown) as Contents;
        if (reprojectTo4326) {
          const bb = new BoundingBox(contents.min_x, contents.max_x, contents.min_y, contents.max_y).projectBoundingBox(
            this.getProjection(contents),
            'EPSG:4326',
          );
          contents.min_x = bb.minLongitude;
          contents.max_x = bb.maxLongitude;
          contents.min_y = bb.minLatitude;
          contents.max_y = bb.maxLatitude;
        }
        results.push(contents);
      }
    }
    return results;
  }

  /**
   * Returns the proj4 projection for the Contents
   * @param  {module:core/contents~Contents} contents Contents to get the projection from
   * @return {*}          proj4 projection
   */
  getProjection(contents: Contents): proj4.Converter {
    const srs = this.getSrs(contents);
    return this.geoPackage.spatialReferenceSystemDao.getProjection(srs);
  }

  /**
   * Get the SpatialReferenceSystemDao for the Contents
   * @param  {module:core/contents~Contents} contents Contents to get the SpatialReferenceSystemDao from
   * @return {module:core/srs~SpatialReferenceSystemDao}
   */
  getSrs(contents: Contents): SpatialReferenceSystem {
    return this.geoPackage.spatialReferenceSystemDao.queryForId(contents.srs_id);
  }

  /**
   * Get the GeometryColumns for the Contents
   * @param  {module:core/contents~Contents} contents Contents
   * @return {module:features/columns~GeometryColumns}
   */
  getGeometryColumns(contents: Contents): GeometryColumns {
    const dao: GeometryColumnsDao = this.geoPackage.geometryColumnsDao;
    const results = dao.queryForAllEq(GeometryColumnsDao.COLUMN_TABLE_NAME, contents.table_name);
    if (results?.length) {
      const gc: GeometryColumns = dao.createObject(results[0]);
      return gc;
    }
    return undefined;
  }

  /**
   * Get the TileMatrixSet for the Contents
   * @param  {module:core/contents~Contents} contents Contents
   * @return {module:tiles/matrixset~TileMatrixSet}
   */
  getTileMatrixSet(contents: Contents): TileMatrixSet {
    const dao = this.geoPackage.tileMatrixSetDao;
    const results = dao.queryForAllEq(TileMatrixSetDao.COLUMN_TABLE_NAME, contents.table_name);
    if (results?.length) {
      return dao.createObject(results[0]);
    }
    return undefined;
  }

  /**
   * Get the TileMatrix for the Contents
   * @param  {module:core/contents~Contents} contents Contents
   * @return {module:tiles/matrix~TileMatrix}
   */
  getTileMatrix(contents: Contents): TileMatrix[] {
    const dao = this.geoPackage.tileMatrixDao;
    const results = dao.queryForAllEq(TileMatrixDao.COLUMN_TABLE_NAME, contents.table_name);
    if (!results || !results.length) return undefined;
    const tileMatricies = [];
    for (let i = 0; i < results.length; i++) {
      const gc = dao.createObject(results[i]);
      tileMatricies.push(gc);
    }
    return tileMatricies;
  }

  deleteCascadeContents(contents: Contents): number {
    let count = 0;
    if (contents !== null && contents !== undefined) {
      let dataType = ContentsDataType.fromName(contents.data_type);
      if (dataType !== null && dataType !== undefined) {
        switch (dataType) {
          case ContentsDataType.FEATURES:
            // Delete Geometry Columns
            let geometryColumnsDao = this.geoPackage.geometryColumnsDao;
            if (geometryColumnsDao.isTableExists()) {
              let geometryColumns = this.getGeometryColumns(contents);
              if (geometryColumns != null) {
                geometryColumnsDao.deleteByMultiId([geometryColumns.table_name, geometryColumns.column_name]);
              }
            }
            break;
          case ContentsDataType.TILES:
          // case GRIDDED_COVERAGE:
            // Delete Tile Matrix collection
            let tileMatrixDao = this.geoPackage.tileMatrixDao;
            if (tileMatrixDao.isTableExists()) {
              let tileMatrixCollection = this.getTileMatrix(contents);
              if (tileMatrixCollection.length > 0) {
                tileMatrixCollection.forEach(tileMatrix => {
                  tileMatrixDao.deleteByMultiId([tileMatrix.table_name, tileMatrix.zoom_level]);
                });
              }
            }
            // Delete Tile Matrix Set
            let tileMatrixSetDao = this.geoPackage.tileMatrixSetDao;
            if (tileMatrixSetDao.isTableExists()) {
              let tileMatrixSet = this.getTileMatrixSet(contents);
              if (tileMatrixSet != null) {
                tileMatrixSetDao.deleteById(tileMatrixSet.table_name);
              }
            }
            break;
          case ContentsDataType.ATTRIBUTES:
            this.dropTableWithTableName(contents.table_name);
            break;

        }

      } else {
        this.dropTableWithTableName(contents.table_name);
      }

      count = this.delete(contents);
    }

    return count;
  }

  deleteCascade(contents: Contents, userTable: boolean): number {
    let count = this.deleteCascadeContents(contents);
    if (userTable) {
      this.dropTableWithTableName(contents.table_name);
    }
    return count;
  }

  deleteByIdCascade(id: string, userTable: boolean): number {
    let count = 0;
    if (id !== null && id !== undefined) {
      let contents = this.queryForId(id);
      if (contents !== null && contents !== undefined) {
        count = this.deleteCascade(contents, userTable);
      } else if (userTable) {
        this.dropTableWithTableName(id);
      }
    }
    return count;
  }


deleteTable(table: string) {
    try {
      this.deleteByIdCascade(table, true);
    } catch (e) {
      throw new Error('Failed to delete table: ' + table);
    }
  }
}
