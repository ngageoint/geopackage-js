import { UserColumn } from '../../user/userColumn';
import { GeoPackageDataType } from '../../db/geoPackageDataType';
import { DBValue } from '../../db/dbValue';
import { UserTableDefaults } from '../../user/userTableDefaults';

/**
 * `TileColumn` models columns in [user tile pyramid tables]{@link TileTable}.
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
   * @param  {boolean} autoincrement Autoincrement
   */
  static createIdColumn(autoincrement: boolean = UserTableDefaults.DEFAULT_AUTOINCREMENT): TileColumn {
    return TileColumn.createIdColumnWithIndex(TileColumn.NO_INDEX, autoincrement)
  }

  /**
   * Create an id column with the specified column index
   * @param  {number} index Index
   * @param  {boolean} autoincrement Autoincrement
   */
  static createIdColumnWithIndex(index: number = TileColumn.NO_INDEX, autoincrement: boolean = UserTableDefaults.DEFAULT_AUTOINCREMENT): TileColumn {
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
  static createZoomLevelColumn(): TileColumn {
    return TileColumn.createZoomLevelColumnWithIndex(TileColumn.NO_INDEX);
  }

  /**
   * Create a zoom level column with a specified column index
   * @param  {number} index Index
   */
  static createZoomLevelColumnWithIndex(index: number = TileColumn.NO_INDEX): TileColumn {
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
   */
  static createTileColumnColumn(): TileColumn {
    return TileColumn.createTileColumnColumnWithIndex(TileColumn.NO_INDEX);
  }

  /**
   *  Create a tile column column with a specified column index
   *  @param {number} index column index
   */
  static createTileColumnColumnWithIndex(index: number = TileColumn.NO_INDEX): TileColumn {
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
   */
  static createTileRowColumn(): TileColumn {
    return TileColumn.createTileRowColumnWithIndex(TileColumn.NO_INDEX);
  }

  /**
   *  Create a tile row column with a specified column index
   *  @param {number} index column index
   */
  static createTileRowColumnWithIndex(index: number = TileColumn.NO_INDEX): TileColumn {
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
   */
  static createTileDataColumn(): TileColumn {
    return TileColumn.createTileDataColumnWithIndex(TileColumn.NO_INDEX);
  }

  /**
   *  Create a tile data column with a specified colum index
   *
   *  @param {number} index column index
   */
  static createTileDataColumnWithIndex(index: number = TileColumn.NO_INDEX): TileColumn {
    return new TileColumn(index, TileColumn.COLUMN_TILE_DATA, GeoPackageDataType.BLOB, null, true, null, false, false);
  }

  /**
   * Create a new column
   * @param name
   * @param type
   * @param notNull
   * @param defaultValue
   * @param max
   * @param autoincrement
   */
  static createColumn(
    name: string,
    type: GeoPackageDataType,
    notNull = false,
    defaultValue?: DBValue,
    max?: number,
    autoincrement?: boolean,
  ): TileColumn {
    return new TileColumn(TileColumn.NO_INDEX, name, type, max, notNull, defaultValue, false, autoincrement);
  }

  /**
   * Create a new column with the specified column index
   * @param index
   * @param name
   * @param type
   * @param notNull
   * @param defaultValue
   * @param max
   * @param autoincrement
   */
  static createColumnWithIndex(
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
