import { TileMatrixSet } from './tileMatrixSet';
import { Contents } from '../../contents/contents';
import { SpatialReferenceSystem } from '../../srs/spatialReferenceSystem';
import { DBValue } from '../../db/dbValue';
import { GeoPackageDao } from '../../db/geoPackageDao';
import { GeoPackageConnection } from '../../db/geoPackageConnection';
import { SpatialReferenceSystemDao } from '../../srs/spatialReferenceSystemDao';
import { Projection } from '@ngageoint/projections-js';
import { ContentsDao } from '../../contents/contentsDao';

/**
 * Tile Matrix Set Data Access Object
 */
export class TileMatrixSetDao extends GeoPackageDao<TileMatrixSet, string> {
  readonly gpkgTableName: string = 'gpkg_tile_matrix_set';
  readonly idColumns: string[] = [TileMatrixSet.COLUMN_ID];

  constructor(geoPackageConnection: GeoPackageConnection) {
    super(geoPackageConnection, TileMatrixSet.TABLE_NAME);
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
      tms.setContents(this.getContents(results[TileMatrixSet.COLUMN_TABLE_NAME] as string));
      tms.setId(results[TileMatrixSet.COLUMN_ID] as string);
      tms.setSrs(this.getSrs(results[TileMatrixSet.COLUMN_SRS_ID] as number));
      tms.setMinX(results[TileMatrixSet.COLUMN_MIN_X] as number);
      tms.setMinY(results[TileMatrixSet.COLUMN_MIN_Y] as number);
      tms.setMaxX(results[TileMatrixSet.COLUMN_MAX_X] as number);
      tms.setMaxX(results[TileMatrixSet.COLUMN_MAX_Y] as number);
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
      'select ' + TileMatrixSet.COLUMN_TABLE_NAME + ' from ' + TileMatrixSet.TABLE_NAME,
    )) {
      tableNames.push(result[TileMatrixSet.COLUMN_TABLE_NAME]);
    }
    return tableNames;
  }

  getProjection(tileMatrixSet: TileMatrixSet): Projection {
    const srs = this.getSrs(tileMatrixSet.getSrsId());
    if (!srs) return;
    return SpatialReferenceSystemDao.createDao(this.db).getProjection(srs);
  }
  /**
   * Get the Spatial Reference System of the Tile Matrix set
   * @param  {number} srsId tile matrix set
   */
  getSrs(srsId: number): SpatialReferenceSystem {
    return SpatialReferenceSystemDao.createDao(this.db).queryForId(srsId);
  }
  /**
   * @param {string} tableName
   */
  getContents(tableName: string): Contents {
    return ContentsDao.createDao(this.db).queryForId(tableName);
  }
}
