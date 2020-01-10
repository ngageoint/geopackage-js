/**
 * @module tiles/user/tileColumn
 */

import UserColumn from '../../user/userColumn';
import DataTypes from '../../db/dataTypes';

/**
 * `TileColumn` models columns in [user tile pyramid tables]{@link module:tiles/user/tileTable~TileTable}.
 *
 * @class
 * @extends UserColumn
 */
export default class TileColumn extends UserColumn {
  public static readonly COLUMN_ID: string = "id";
  public static readonly COLUMN_ZOOM_LEVEL: string = "zoom_level";
  public static readonly COLUMN_TILE_COLUMN: string = "tile_column";
  public static readonly COLUMN_TILE_ROW: string = "tile_row";
  public static readonly COLUMN_TILE_DATA: string = "tile_data";

  constructor(index: number, name: string, dataType: any, max?: number, notNull?: boolean, defaultValue?: any, primaryKey?: boolean) {
    super(index, name, dataType, max, notNull, defaultValue, primaryKey);
    if (dataType === DataTypes.GPKGDataType.GPKG_DT_GEOMETRY) {
      throw new Error('Data Type is required to create column: ' + name);
    }
  }
  /**
   * Create an id column
   * @param  {number} index Index
   */
  static createIdColumn(index: number): TileColumn {
    return new TileColumn(index, TileColumn.COLUMN_ID, DataTypes.GPKGDataType.GPKG_DT_INTEGER, null, false, null, true);
  }
  /**
   * Create a zoom level column
   * @param  {number} index Index
   */
  static createZoomLevelColumn(index: number): TileColumn {
    return new TileColumn(index, TileColumn.COLUMN_ZOOM_LEVEL, DataTypes.GPKGDataType.GPKG_DT_INTEGER, null, true, null, false);
  }
  /**
   *  Create a tile column column
   *
   *  @param {number} index column index
   */
  static createTileColumnColumn(index: number): TileColumn {
    return new TileColumn(index, TileColumn.COLUMN_TILE_COLUMN, DataTypes.GPKGDataType.GPKG_DT_INTEGER, null, true, null, false);
  }
  /**
   *  Create a tile row column
   *
   *  @param {number} index column index
   *
   */
  static createTileRowColumn(index: number): TileColumn {
    return new TileColumn(index, TileColumn.COLUMN_TILE_ROW, DataTypes.GPKGDataType.GPKG_DT_INTEGER, null, true, null, false);
  }
  /**
   *  Create a tile data column
   *
   *  @param {number} index column index
   */
  static createTileDataColumn(index: number): TileColumn {
    return new TileColumn(index, TileColumn.COLUMN_TILE_DATA, DataTypes.GPKGDataType.GPKG_DT_BLOB, null, true, null, false);
  }
}

