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

  public static readonly GPKG_CDT_FEATURES_NAME: string = 'features';

  public static readonly GPKG_CDT_TILES_NAME: string = 'tiles';

  public static readonly GPKG_CDT_ATTRIBUTES_NAME: string = 'attributes';

  readonly gpkgTableName: string = ContentsDao.TABLE_NAME;

  readonly idColumns: string[] = [ContentsDao.COLUMN_PK];

  /**
   * Creates a new Contents object
   * @return {module:core/contents~Contents} new Contents object
   */
  createObject(): Contents {
    return new Contents();
  }

  /**
   * Get table names by table type
   * @param  {string} [tableType] table type to query for
   * @return {string[]}           Array of table names
   */
  getTables(tableType?: string): string[] {
    let results: any[];
    if (tableType) {
      const fieldValues = new ColumnValues();
      fieldValues.addColumn(ContentsDao.COLUMN_DATA_TYPE, tableType);
      results = this.queryForColumns('table_name', fieldValues);
    } else {
      results = this.queryForColumns('table_name');
    }
    const tableNames = [];
    for (let i = 0; i < results.length; i++) {
      tableNames.push(results[i].table_name);
    }
    return tableNames;
  }

  /**
   * Returns the proj4 projection for the Contents
   * @param  {module:core/contents~Contents} contents Contents to get the projection from
   * @return {*}          proj4 projection
   */
  getProjection(contents: Contents): proj4.Converter {
    const srs = this.getSrs(contents);
    const srsDao = this.geoPackage.getSpatialReferenceSystemDao();
    return srsDao.getProjection(srs);
  }

  /**
   * Get the SpatialReferenceSystemDao for the Contents
   * @param  {module:core/contents~Contents} contents Contents to get the SpatialReferenceSystemDao from
   * @return {module:core/srs~SpatialReferenceSystemDao}
   */
  getSrs(contents: Contents): SpatialReferenceSystem {
    const dao = this.geoPackage.getSpatialReferenceSystemDao();
    return dao.queryForId(contents.srs_id);
  }

  /**
   * Get the GeometryColumns for the Contents
   * @param  {module:core/contents~Contents} contents Contents
   * @return {module:features/columns~GeometryColumns}
   */
  getGeometryColumns(contents: Contents): GeometryColumns {
    const dao: GeometryColumnsDao = this.geoPackage.getGeometryColumnsDao();
    const results: any[] = dao.queryForAllEq(GeometryColumnsDao.COLUMN_TABLE_NAME, contents.table_name);
    if (results?.length) {
      const gc: GeometryColumns = dao.createObject();
      dao.populateObjectFromResult(gc, results[0]);
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
    const dao = this.geoPackage.getTileMatrixSetDao();
    const results = dao.queryForAllEq(TileMatrixSetDao.COLUMN_TABLE_NAME, contents.table_name);
    if (results?.length) {
      const tms = dao.createObject();
      dao.populateObjectFromResult(tms, results[0]);
      return tms;
    }
    return undefined;
  }

  /**
   * Get the TileMatrix for the Contents
   * @param  {module:core/contents~Contents} contents Contents
   * @return {module:tiles/matrix~TileMatrix}
   */
  getTileMatrix(contents: Contents): TileMatrix[] {
    const dao = this.geoPackage.getTileMatrixDao();
    const results = dao.queryForAllEq(TileMatrixDao.COLUMN_TABLE_NAME, contents.table_name);
    if (!results || !results.length) return undefined;
    const tileMatricies = [];
    for (let i = 0; i < results.length; i++) {
      const gc = dao.createObject();
      dao.populateObjectFromResult(gc, results[i]);
      tileMatricies.push(gc);
    }
    return tileMatricies;
  }
}
