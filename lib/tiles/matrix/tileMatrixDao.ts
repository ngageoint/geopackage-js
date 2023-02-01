import { TileMatrix } from './tileMatrix';
import { DBValue } from '../../db/dbValue';
import { GeoPackageDao } from '../../db/geoPackageDao';
import { TileMatrixKey } from './tileMatrixKey';
import { FieldValues } from '../../dao/fieldValues';
import type { GeoPackage } from '../../geoPackage';
import { Contents } from '../../contents/contents';

/**
 * Tile Matrix Set Data Access Object
 * @class TileMatrixDao
 */
export class TileMatrixDao extends GeoPackageDao<TileMatrix, TileMatrixKey> {
  readonly gpkgTableName: string = 'gpkg_tile_matrix';
  readonly idColumns: string[] = [TileMatrix.COLUMN_ID_1, TileMatrix.COLUMN_ID_2];

  constructor(geoPackage: GeoPackage) {
    super(geoPackage, TileMatrix.TABLE_NAME);
  }

  public static createDao(geoPackage: GeoPackage): TileMatrixDao {
    return new TileMatrixDao(geoPackage);
  }

  queryForIdWithKey(key: TileMatrixKey): TileMatrix {
    return this.queryForMultiId([key.getTableName(), key.getZoomLevel()]);
  }

  createObject(results?: Record<string, DBValue>): TileMatrix {
    const tm = new TileMatrix();
    if (results) {
      tm.setTableName(results.table_name as string);
      tm.setZoomLevel(results.zoom_level as number);
      tm.setMatrixWidth(results.matrix_width as number);
      tm.setMatrixHeight(results.matrix_height as number);
      tm.setTileWidth(results.tile_width as number);
      tm.setTileHeight(results.tile_height as number);
      tm.setPixelXSize(results.pixel_x_size as number);
      tm.setPixelYSize(results.pixel_y_size as number);
    }
    return tm;
  }

  /**
   * Get the contents for this tile matrix
   * @param tileMatrix
   */
  public getContents(tileMatrix: TileMatrix): Contents {
    return this.geoPackage.getContentsDao().queryForIdWithKey(tileMatrix.getTableName());
  }

  /**
   * @inheritDoc
   */
  public extractId(data: TileMatrix): TileMatrixKey {
    return data.getId();
  }

  /**
   * @inheritDoc
   */
  public idExists(id: TileMatrixKey): boolean {
    return this.queryForIdWithKey(id) != null;
  }

  /**
   * @inheritDoc
   */
  public queryForSameId(data: TileMatrix): TileMatrix {
    return this.queryForIdWithKey(data.getId());
  }

  /**
   * Query tile matrices for a table name
   *
   * @param tableName table name
   * @return tile matrices
   */
  public queryForTableName(tableName: string): TileMatrix[] {
    const where = this.buildWhereWithFieldAndValue(TileMatrix.COLUMN_TABLE_NAME, tableName);
    const orderBy =
      TileMatrix.COLUMN_ZOOM_LEVEL +
      ', ' +
      TileMatrix.COLUMN_PIXEL_X_SIZE +
      ' DESC, ' +
      TileMatrix.COLUMN_PIXEL_Y_SIZE +
      ' DESC';
    const tileMatrices = [];
    for (const result of this.queryWhere(where, [tableName], undefined, undefined, orderBy)) {
      tileMatrices.push(this.createObject(result));
    }
    return tileMatrices;
  }

  /**
   * @inheritDoc
   */
  public updateId(data: TileMatrix, newId: TileMatrixKey): number {
    let count = 0;
    const readData = this.queryForIdWithKey(data.getId());
    if (readData != null && newId != null) {
      readData.setId(newId);
      count = this.update(readData).changes;
    }
    return count;
  }

  /**
   * @inheritDoc
   */
  public delete(data: TileMatrix): number {
    const columnValues = new FieldValues();
    columnValues.addFieldValue(TileMatrix.COLUMN_TABLE_NAME, data.getTableName());
    columnValues.addFieldValue(TileMatrix.COLUMN_ZOOM_LEVEL, data.getZoomLevel());
    const where = this.buildWhere(columnValues);
    const whereArgs = this.buildWhereArgs(columnValues);
    return this.deleteWhere(where, whereArgs);
  }

  /**
   * @inheritDoc
   */
  public deleteByIdWithKey(id: TileMatrixKey): number {
    let count = 0;
    if (id != null) {
      const tileMatrix = this.queryForIdWithKey(id);
      if (tileMatrix != null) {
        count = this.delete(tileMatrix);
      }
    }
    return count;
  }

  /**
   * @inheritDoc
   */
  public deleteIds(idCollection: TileMatrixKey[]): number {
    let count = 0;
    if (idCollection != null) {
      for (const id of idCollection) {
        count += this.deleteByIdWithKey(id);
      }
    }
    return count;
  }

  /**
   * Delete Tile Matrices for a table name
   * @param table table name
   * @return rows deleted
   */
  public deleteByTableName(table: string): number {
    const columnValues = new FieldValues();
    columnValues.addFieldValue(TileMatrix.COLUMN_TABLE_NAME, table);
    const where = this.buildWhere(columnValues);
    const whereArgs = this.buildWhereArgs(columnValues);
    return this.deleteWhere(where, whereArgs);
  }
}
