/**
 * @module tiles/user/tileColumn
 */

import { GeoPackageDataType } from '../../db/geoPackageDataType';
import { TileColumn } from './tileColumn';
import { UserColumns } from '../../user/userColumns';

/**
 * `TileColumn` models columns in [user tile pyramid tables]{@link module:tiles/user/tileTable~TileTable}.
 */
export class TileColumns extends UserColumns<TileColumn> {
  /**
   * Id column name, Requirement 52
   */
  public static readonly ID = 'id';

  /**
   * Zoom level column name, Requirement 53
   */
  public static readonly ZOOM_LEVEL = 'zoom_level';

  /**
   * Tile column column name, Requirement 54
   */
  public static readonly TILE_COLUMN = 'tile_column';

  /**
   * Tile row column name, Requirement 55
   */
  public static readonly TILE_ROW = 'tile_row';

  /**
   * Tile ID column name, implied requirement
   */
  public static readonly TILE_DATA = 'tile_data';

  /**
   * Zoom level column index
   */
  public zoomLevelIndex = -1;

  /**
   * Tile column column index
   */
  public tileColumnIndex = -1;

  /**
   * Tile row column index
   */
  public tileRowIndex = -1;

  /**
   * Tile data column index
   */
  public tileDataIndex = -1;

  /**
   * Constructor
   * @param tableName table name
   * @param columns columns
   * @param custom custom column specification
   */
  constructor(tableName: string, columns: TileColumn[], custom: boolean) {
    super(tableName, columns, custom);
    this.updateColumns();
  }

  /**
   * {@inheritDoc}
   */
  copy(): TileColumns {
    const tileColumns = new TileColumns(this.getTableName(), this.getColumns(), this.isCustom());
    tileColumns.zoomLevelIndex = this.zoomLevelIndex;
    tileColumns.tileColumnIndex = this.tileColumnIndex;
    tileColumns.tileRowIndex = this.tileRowIndex;
    tileColumns.tileDataIndex = this.tileDataIndex;
    return tileColumns;
  }

  /**
   * {@inheritDoc}
   */
  updateColumns(): void {
    super.updateColumns();

    // Find the required columns
    const zoomLevel = this.getColumnIndex(TileColumns.ZOOM_LEVEL, false);
    if (!this.isCustom()) {
      this.missingCheck(zoomLevel, TileColumns.ZOOM_LEVEL);
    }
    if (zoomLevel !== null) {
      this.typeCheck(GeoPackageDataType.INTEGER, this.getColumnForIndex(zoomLevel));
      this.zoomLevelIndex = zoomLevel;
    }

    const tileColumn = this.getColumnIndex(TileColumns.TILE_COLUMN, false);
    if (!this.isCustom()) {
      this.missingCheck(tileColumn, TileColumns.TILE_COLUMN);
    }
    if (tileColumn != null) {
      this.typeCheck(GeoPackageDataType.INTEGER, this.getColumnForIndex(tileColumn));
      this.tileColumnIndex = tileColumn;
    }

    const tileRow = this.getColumnIndex(TileColumns.TILE_ROW, false);
    if (!this.isCustom()) {
      this.missingCheck(tileRow, TileColumns.TILE_ROW);
    }
    if (tileRow != null) {
      this.typeCheck(GeoPackageDataType.INTEGER, this.getColumnForIndex(tileRow));
      this.tileRowIndex = tileRow;
    }

    const tileData = this.getColumnIndex(TileColumns.TILE_DATA, false);
    if (!this.isCustom()) {
      this.missingCheck(tileData, TileColumns.TILE_DATA);
    }
    if (tileData != null) {
      this.typeCheck(GeoPackageDataType.BLOB, this.getColumnForIndex(tileData));
      this.tileDataIndex = tileData;
    }
  }

  /**
   * Get the zoom level index
   * @return zoom level index
   */
  getZoomLevelIndex(): number {
    return this.zoomLevelIndex;
  }

  /**
   * Set the zoom level index
   * @param zoomLevelIndex zoom level index
   */
  setZoomLevelIndex(zoomLevelIndex: number): void {
    this.zoomLevelIndex = zoomLevelIndex;
  }

  /**
   * Check if has a zoom level column
   * @return true if has a zoom level column
   */
  hasZoomLevelColumn(): boolean {
    return this.zoomLevelIndex >= 0;
  }

  /**
   * Get the zoom level column
   * @return zoom level column
   */
  getZoomLevelColumn(): TileColumn {
    let column = null;
    if (this.hasZoomLevelColumn()) {
      column = this.getColumnForIndex(this.zoomLevelIndex);
    }
    return column;
  }

  /**
   * Get the tile column index
   * @return tile column index
   */
  getTileColumnIndex(): number {
    return this.tileColumnIndex;
  }

  /**
   * Set the tile column index
   *
   * @param tileColumnIndex
   *            tile column index
   */
  setTileColumnIndex(tileColumnIndex: number): void {
    this.tileColumnIndex = tileColumnIndex;
  }

  /**
   * Check if has a tile column column
   * @return true if has a tile column column
   */
  hasTileColumnColumn(): boolean {
    return this.tileColumnIndex >= 0;
  }

  /**
   * Get the tile column column
   * @return tile column column
   */
  getTileColumnColumn(): TileColumn {
    let column = null;
    if (this.hasTileColumnColumn()) {
      column = this.getColumnForIndex(this.tileColumnIndex);
    }
    return column;
  }

  /**
   * Get the tile row index
   * @return tile row index
   */
  getTileRowIndex(): number {
    return this.tileRowIndex;
  }

  /**
   * Set the tile row index
   * @param tileRowIndex tile row index
   */
  setTileRowIndex(tileRowIndex: number): void {
    this.tileRowIndex = tileRowIndex;
  }

  /**
   * Check if has a tile row column
   * @return true if has a tile row column
   */
  hasTileRowColumn(): boolean {
    return this.tileRowIndex >= 0;
  }

  /**
   * Get the tile row column
   * @return tile row column
   */
  getTileRowColumn(): TileColumn {
    let column = null;
    if (this.hasTileRowColumn()) {
      column = this.getColumnForIndex(this.tileRowIndex);
    }
    return column;
  }

  /**
   * Get the tile data index
   * @return tile data index
   */
  getTileDataIndex(): number {
    return this.tileDataIndex;
  }

  /**
   * Set the tile data index
   * @param tileDataIndex tile data index
   */
  setTileDataIndex(tileDataIndex: number): void {
    this.tileDataIndex = tileDataIndex;
  }

  /**
   * Check if has a tile data column
   * @return true if has a tile data column
   */
  hasTileDataColumn(): boolean {
    return this.tileDataIndex >= 0;
  }

  /**
   * Get the tile data column
   *
   * @return tile data column
   */
  getTileDataColumn(): TileColumn {
    let column = null;
    if (this.hasTileDataColumn()) {
      column = this.getColumnForIndex(this.tileDataIndex);
    }
    return column;
  }
}
