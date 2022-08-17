import { TileMatrixSet } from './tileMatrixSet';
import { Contents } from '../../contents/contents';
import { SpatialReferenceSystem } from '../../srs/spatialReferenceSystem';
import { DBValue } from '../../db/dbAdapter';
import { GeoPackageDao } from '../../db/geoPackageDao';
import { GeoPackageConnection } from '../../db/geoPackageConnection';
import { SpatialReferenceSystemDao } from "../../srs/spatialReferenceSystemDao";
import { Projection } from "@ngageoint/projections-js";
import { ContentsDao } from "../../contents/contentsDao";

/**
 * Tile Matrix Set Data Access Object
 * @class TileMatrixSetDao
 * @extends Dao
 */
export class TileMatrixSetDao extends GeoPackageDao<TileMatrixSet, string> {
  public static readonly TABLE_NAME: string = 'gpkg_tile_matrix_set';
  public static readonly COLUMN_PK: string = 'table_name';
  public static readonly COLUMN_TABLE_NAME: string = 'table_name';
  public static readonly COLUMN_SRS_ID: string = 'srs_id';
  public static readonly COLUMN_MIN_X: string = 'min_x';
  public static readonly COLUMN_MIN_Y: string = 'min_y';
  public static readonly COLUMN_MAX_X: string = 'max_x';
  public static readonly COLUMN_MAX_Y: string = 'max_y';

  readonly gpkgTableName: string = 'gpkg_tile_matrix_set';
  readonly idColumns: string[] = [TileMatrixSetDao.COLUMN_PK];
  readonly columns: string[] = [
    TileMatrixSetDao.COLUMN_TABLE_NAME,
    TileMatrixSetDao.COLUMN_SRS_ID,
    TileMatrixSetDao.COLUMN_MIN_X,
    TileMatrixSetDao.COLUMN_MIN_Y,
    TileMatrixSetDao.COLUMN_MAX_X,
    TileMatrixSetDao.COLUMN_MAX_Y,
  ];

  columnToPropertyMap: { [key: string]: string } = {};

  constructor(geoPackageConnection: GeoPackageConnection) {
    super(geoPackageConnection, TileMatrixSet.TABLE_NAME);
    this.columnToPropertyMap[TileMatrixSetDao.COLUMN_TABLE_NAME] = TileMatrixSet.TABLE_NAME;
    this.columnToPropertyMap[TileMatrixSetDao.COLUMN_SRS_ID] = TileMatrixSet.SRS_ID;
    this.columnToPropertyMap[TileMatrixSetDao.COLUMN_MIN_X] = TileMatrixSet.MIN_X;
    this.columnToPropertyMap[TileMatrixSetDao.COLUMN_MIN_Y] = TileMatrixSet.MIN_Y;
    this.columnToPropertyMap[TileMatrixSetDao.COLUMN_MAX_X] = TileMatrixSet.MAX_X;
    this.columnToPropertyMap[TileMatrixSetDao.COLUMN_MAX_Y] = TileMatrixSet.MAX_Y;
  }

  public static createDao(geoPackageConnection: GeoPackageConnection): TileMatrixSetDao {
    return new TileMatrixSetDao(geoPackageConnection);
  }

  queryForIdWithKey(key: string): TileMatrixSet {
    return this.queryForId(key);
  }

  createObject(results?: Record<string, DBValue>): TileMatrixSet {
    const tms = new TileMatrixSet();
    if (results) {
      tms.table_name = results.table_name as string;
      tms.srs_id = results.srs_id as number;
      tms.min_y = results.min_y as number;
      tms.min_x = results.min_x as number;
      tms.max_y = results.max_y as number;
      tms.max_x = results.max_x as number;
    }
    return tms;
  }
  /**
   * Get the tile table names
   * @returns {string[]} tile table names
   */
  getTileTables(): string[] {
    const tableNames = [];
    for (const result of this.db.each(
      'select ' + TileMatrixSetDao.COLUMN_TABLE_NAME + ' from ' + TileMatrixSetDao.TABLE_NAME,
    )) {
      tableNames.push(result[TileMatrixSetDao.COLUMN_TABLE_NAME]);
    }
    return tableNames;
  }

  getProjection(tileMatrixSet: TileMatrixSet): Projection {
    const srs = this.getSrs(tileMatrixSet);
    if (!srs) return;
    return SpatialReferenceSystemDao.createDao(this.db).getProjection(srs);
  }
  /**
   * Get the Spatial Reference System of the Tile Matrix set
   * @param  {TileMatrixSet}   tileMatrixSet tile matrix set
   */
  getSrs(tileMatrixSet: TileMatrixSet): SpatialReferenceSystem {
    return SpatialReferenceSystemDao.createDao(this.db).queryForId(tileMatrixSet.srs_id);
  }
  /**
   * @param {TileMatrixSet} tileMatrixSet
   */
  getContents(tileMatrixSet: TileMatrixSet): Contents {
    return ContentsDao.createDao(this.db).queryForId(tileMatrixSet.table_name);
  }
}
