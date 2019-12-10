import Dao from '../../dao/dao';
import GeoPackage from '../../geoPackage';

import { TileMatrixSet } from './tileMatrixSet';
import Contents from '../../core/contents/contents';
import SpatialReferenceSystem from '../../core/srs/spatialReferenceSystem';

/**
 * Tile Matrix Set Data Access Object
 * @class TileMatrixSetDao
 * @extends Dao
 */
export default class TileMatrixSetDao extends Dao<TileMatrixSet> {
  public static readonly TABLE_NAME = "gpkg_tile_matrix_set";
  public static readonly COLUMN_PK = "table_name";
  public static readonly COLUMN_TABLE_NAME = "table_name";
  public static readonly COLUMN_SRS_ID = "srs_id";
  public static readonly COLUMN_MIN_X = "min_x";
  public static readonly COLUMN_MIN_Y = "min_y";
  public static readonly COLUMN_MAX_X = "max_x";
  public static readonly COLUMN_MAX_Y = "max_y";

  readonly gpkgTableName = 'gpkg_tile_matrix_set';
  readonly idColumns = [TileMatrixSetDao.COLUMN_PK];
  readonly columns = [TileMatrixSetDao.COLUMN_TABLE_NAME, TileMatrixSetDao.COLUMN_SRS_ID, TileMatrixSetDao.COLUMN_MIN_X, TileMatrixSetDao.COLUMN_MIN_Y, TileMatrixSetDao.COLUMN_MAX_X, TileMatrixSetDao.COLUMN_MAX_Y];

  columnToPropertyMap = {};

  constructor(geoPackage: GeoPackage) {
    super(geoPackage);
    this.columnToPropertyMap[TileMatrixSetDao.COLUMN_TABLE_NAME] = TileMatrixSet.TABLE_NAME;
    this.columnToPropertyMap[TileMatrixSetDao.COLUMN_SRS_ID] = TileMatrixSet.SRS_ID;
    this.columnToPropertyMap[TileMatrixSetDao.COLUMN_MIN_X] = TileMatrixSet.MIN_X;
    this.columnToPropertyMap[TileMatrixSetDao.COLUMN_MIN_Y] = TileMatrixSet.MIN_Y;
    this.columnToPropertyMap[TileMatrixSetDao.COLUMN_MAX_X] = TileMatrixSet.MAX_X;
    this.columnToPropertyMap[TileMatrixSetDao.COLUMN_MAX_Y] = TileMatrixSet.MAX_Y;
  }

  createObject(): TileMatrixSet {
    return new TileMatrixSet();
  }
  /**
   * Get the tile table names
   * @returns {string[]} tile table names
   */
  getTileTables(): string[] {
    var tableNames = [];
    for (var result of this.connection.each('select ' + TileMatrixSetDao.COLUMN_TABLE_NAME + ' from ' + TileMatrixSetDao.TABLE_NAME)) {
      tableNames.push(result[TileMatrixSetDao.COLUMN_TABLE_NAME]);
    }
    return tableNames;
  }
  getProjection(tileMatrixSet: TileMatrixSet): any {
    var srs = this.getSrs(tileMatrixSet);
    if (!srs)
      return;
    var srsDao = this.geoPackage.getSpatialReferenceSystemDao();
    return srsDao.getProjection(srs);
  }
  /**
   * Get the Spatial Reference System of the Tile Matrix set
   * @param  {TileMatrixSet}   tileMatrixSet tile matrix set
   */
  getSrs(tileMatrixSet: TileMatrixSet): SpatialReferenceSystem {
    var dao = this.geoPackage.getSpatialReferenceSystemDao();
    return dao.queryForId(tileMatrixSet.srs_id);
  }
  /**
   * @param {TileMatrixSet} tileMatrixSet
   */
  getContents(tileMatrixSet: TileMatrixSet): Contents {
    var dao = this.geoPackage.getContentsDao();
    return dao.queryForId(tileMatrixSet.table_name);
  }
}
