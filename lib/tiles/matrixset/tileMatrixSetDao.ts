import { TileMatrixSet } from './tileMatrixSet';
import { Contents } from '../../contents/contents';
import { SpatialReferenceSystem } from '../../srs/spatialReferenceSystem';
import { DBValue } from '../../db/dbValue';
import { GeoPackageDao } from '../../db/geoPackageDao';
import { Projection } from '@ngageoint/projections-js';
import type { GeoPackage } from '../../geoPackage';
import { BoundingBox } from '../../boundingBox';
import { GeometryTransform } from '@ngageoint/simple-features-proj-js';
import { TileMatrix } from '../matrix/tileMatrix';

/**
 * Tile Matrix Set Data Access Object
 */
export class TileMatrixSetDao extends GeoPackageDao<TileMatrixSet, string> {
  readonly gpkgTableName: string = 'gpkg_tile_matrix_set';
  readonly idColumns: string[] = [TileMatrixSet.COLUMN_ID];

  constructor(geoPackage: GeoPackage) {
    super(geoPackage, TileMatrixSet.TABLE_NAME);
  }

  public static createDao(geoPackage: GeoPackage): TileMatrixSetDao {
    return new TileMatrixSetDao(geoPackage);
  }

  queryForIdWithKey(key: string): TileMatrixSet {
    return this.queryForId(key);
  }

  createObject(results?: Record<string, DBValue>): TileMatrixSet {
    const tms = new TileMatrixSet();
    if (results) {
      tms.setId(results[TileMatrixSet.COLUMN_ID] as string);
      tms.setSrsId(results[TileMatrixSet.COLUMN_SRS_ID] as number);
      tms.setMinX(results[TileMatrixSet.COLUMN_MIN_X] as number);
      tms.setMinY(results[TileMatrixSet.COLUMN_MIN_Y] as number);
      tms.setMaxX(results[TileMatrixSet.COLUMN_MAX_X] as number);
      tms.setMaxY(results[TileMatrixSet.COLUMN_MAX_Y] as number);
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
    const srsId = this.getSrs(tileMatrixSet.getSrsId());
    return this.geoPackage.getSpatialReferenceSystemDao().getProjection(srsId);
  }

  /**
   * Get the Spatial Reference System of the Tile Matrix set
   * @param  {number} srsId tile matrix set
   */
  getSrs(srsId: number): SpatialReferenceSystem {
    return this.geoPackage.getSpatialReferenceSystemDao().queryForId(srsId);
  }

  /**
   * @param {string} tableName
   */
  getContentsWithTableName(tableName: string): Contents {
    return this.geoPackage.getContentsDao().queryForId(tableName);
  }

  /**
   * Get the contents for the tile matrix set
   * @param {TileMatrixSet} tileMatrixSet
   */
  getContents(tileMatrixSet: TileMatrixSet): Contents {
    return this.getContentsWithTableName(tileMatrixSet.getTableName());
  }

  /**
   * Get a bounding box in the provided projection
   * @param tileMatrixSet tileMatrixSet
   * @param projection desired projection
   * @return bounding box
   */
  public getBoundingBoxWithProjection(tileMatrixSet: TileMatrixSet, projection: Projection): BoundingBox {
    let boundingBox = tileMatrixSet.getBoundingBox();
    if (projection != null) {
      if (!this.getProjection(tileMatrixSet).equalsProjection(projection)) {
        const transform = GeometryTransform.create(this.getProjection(tileMatrixSet), projection);
        boundingBox = boundingBox.transform(transform);
      }
    }
    return boundingBox;
  }

  /**
   * Queries for a TileMatrixSet with a TileMatrix
   * @param tileMatrix
   */
  public queryWithTileMatrix(tileMatrix: TileMatrix): TileMatrixSet {
    return this.queryForIdWithKey(tileMatrix.getTableName());
  }
}
