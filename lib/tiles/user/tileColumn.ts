import { UserColumn } from '../../user/userColumn';
import { GeoPackageDataType } from '../../db/geoPackageDataType';
import { DBValue } from '../../db/dbAdapter';
import { UserTableDefaults } from '../../user/userTableDefaults';

/**
 * `TileColumn` models columns in [user tile pyramid tables]{@link module:tiles/user/tileTable~TileTable}.
 */
export class TileColumn extends UserColumn {
  public static readonly COLUMN_ID: string = 'id';
  public static readonly COLUMN_ZOOM_LEVEL: string = 'zoom_level';
  public static readonly COLUMN_TILE_COLUMN: string = 'tile_column';
  public static readonly COLUMN_TILE_ROW: string = 'tile_row';
  public static readonly COLUMN_TILE_DATA: string = 'tile_data';

  constructor(
    index: number = UserColumn.NO_INDEX,
    name: string,
    dataType: GeoPackageDataType,
    max?: number,
    notNull?: boolean,
    defaultValue?: DBValue,
    primaryKey?: boolean,
    autoincrement?: boolean,
  ) {
    super(index, name, dataType, max, notNull, defaultValue, primaryKey, autoincrement);
  }
  /**
   * Create an id column
   * @param  {number} index Index
   * @param  {boolean} autoincrement Autoincrement
   */
  static createIdColumn(autoincrement: boolean = UserTableDefaults.DEFAULT_AUTOINCREMENT, index?: number): TileColumn {
    return new TileColumn(
      index,
      TileColumn.COLUMN_ID,
      GeoPackageDataType.INTEGER,
      null,
      false,
      null,
      true,
      autoincrement,
    );
  }
  /**
   * Create a zoom level column
   * @param  {number} index Index
   */
  static createZoomLevelColumn(index?: number): TileColumn {
    return new TileColumn(
      index,
      TileColumn.COLUMN_ZOOM_LEVEL,
      GeoPackageDataType.INTEGER,
      null,
      true,
      null,
      false,
      false,
    );
  }
  /**
   *  Create a tile column column
   *
   *  @param {number} index column index
   */
  static createTileColumnColumn(index?: number): TileColumn {
    return new TileColumn(
      index,
      TileColumn.COLUMN_TILE_COLUMN,
      GeoPackageDataType.INTEGER,
      null,
      true,
      null,
      false,
      false,
    );
  }
  /**
   *  Create a tile row column
   *
   *  @param {number} index column index
   *
   */
  static createTileRowColumn(index?: number): TileColumn {
    return new TileColumn(
      index,
      TileColumn.COLUMN_TILE_ROW,
      GeoPackageDataType.INTEGER,
      null,
      true,
      null,
      false,
      false,
    );
  }
  /**
   *  Create a tile data column
   *
   *  @param {number} index column index
   */
  static createTileDataColumn(index?: number): TileColumn {
    return new TileColumn(index, TileColumn.COLUMN_TILE_DATA, GeoPackageDataType.BLOB, null, true, null, false, false);
  }

  /**
   * Create a new column
   * @param index
   * @param name
   * @param type
   * @param notNull
   * @param defaultValue
   * @param max
   * @param autoincrement
   */
  static createColumn(
    index: number,
    name: string,
    type: GeoPackageDataType,
    notNull = false,
    defaultValue?: DBValue,
    max?: number,
    autoincrement?: boolean,
  ): TileColumn {
    return new TileColumn(index, name, type, max, notNull, defaultValue, false, autoincrement);
  }

  public copy(): TileColumn {
    return new TileColumn(
      this.getIndex(),
      this.getName(),
      this.getDataType(),
      this.getMax(),
      this.isNotNull(),
      this.getDefaultValue(),
      this.isPrimaryKey(),
      this.isAutoincrement(),
    );
  }
}
