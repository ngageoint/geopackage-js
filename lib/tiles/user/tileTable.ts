/**
 * @module tiles/user/tileTable
 */

import { UserTable } from '../../user/userTable';
import { TileColumn } from './tileColumn';
import { TileColumns } from './tileColumns';
import { UniqueConstraint } from '../../db/table/uniqueConstraint';
import { ContentsDataType } from '../../contents/contentsDataType';
import { Contents } from '../../contents/contents';

/**
 * `TileTable` models [tile pyramid user tables](https://www.geopackage.org/spec121/index.html#tiles_user_tables).
 *
 * @class
 * @param {string} tableName
 * @param {module:tiles/user/tileColumn~TileColumn[]} columns
 */
export class TileTable extends UserTable<TileColumn> {
  /**
   * Id column name, Requirement 52
   */
  static COLUMN_ID = TileColumns.ID;

  /**
   * Zoom level column name, Requirement 53
   */
  static COLUMN_ZOOM_LEVEL = TileColumns.ZOOM_LEVEL;

  /**
   * Tile column column name, Requirement 54
   */
  static COLUMN_TILE_COLUMN = TileColumns.TILE_COLUMN;

  /**
   * Tile row column name, Requirement 55
   */
  static COLUMN_TILE_ROW = TileColumns.TILE_ROW;

  /**
   * Tile ID column name, implied requirement
   */
  static COLUMN_TILE_DATA = TileColumns.TILE_DATA;

  /**
   * Constructor
   * @param tableName  table name
   * @param columns columns
   */
  constructor(tableName: string, columns: TileColumn[]) {
    super(new TileColumns(tableName, columns, false));

    // Build a unique constraint on zoom level, tile column, and tile data
    const uniqueConstraint = new UniqueConstraint();
    uniqueConstraint.add(this.getUserColumns().getZoomLevelColumn());
    uniqueConstraint.add(this.getUserColumns().getTileColumnColumn());
    uniqueConstraint.add(this.getUserColumns().getTileRowColumn());

    // Add the unique constraint
    this.addConstraint(uniqueConstraint);
  }

  /**
   * {@inheritDoc}
   */
  copy(): TileTable {
    return new TileTable(this.getTableName(), this.columns.getColumns());
  }

  /**
   * {@inheritDoc}
   */
  getDataType(): string {
    return ContentsDataType.TILES;
  }

  /**
   * {@inheritDoc}
   */
  getUserColumns(): TileColumns {
    return super.getUserColumns() as TileColumns;
  }

  /**
   * {@inheritDoc}
   */
  createUserColumns(columns: TileColumn[]): TileColumns {
    return new TileColumns(this.getTableName(), columns, true);
  }

  /**
   * Get the zoom level column index
   * @return zoom level index
   */
  getZoomLevelColumnIndex(): number {
    return this.getUserColumns().getZoomLevelIndex();
  }

  /**
   * Get the zoom level column
   * @return tile column
   */
  getZoomLevelColumn(): TileColumn {
    return this.getUserColumns().getZoomLevelColumn();
  }

  /**
   * Get the tile column column index
   * @return tile column index
   */
  getTileColumnColumnIndex(): number {
    return this.getUserColumns().getTileColumnIndex();
  }

  /**
   * Get the tile column column
   * @return tile column
   */
  getTileColumnColumn(): TileColumn {
    return this.getUserColumns().getTileColumnColumn();
  }

  /**
   * Get the tile row column index
   * @return tile row index
   */
  getTileRowColumnIndex(): number {
    return this.getUserColumns().getTileRowIndex();
  }

  /**
   * Get the tile row column
   * @return tile column
   */
  getTileRowColumn(): TileColumn {
    return this.getUserColumns().getTileRowColumn();
  }

  /**
   * Get the tile data column index
   * @return tile data index
   */
  getTileDataColumnIndex(): number {
    return this.getUserColumns().getTileDataIndex();
  }

  /**
   * Get the tile data column
   * @return tile column
   */
  getTileDataColumn(): TileColumn {
    return this.getUserColumns().getTileDataColumn();
  }

  /**
   * Create the required table columns, starting at the provided index
   * @param startingIndex starting index
   * @param autoincrement defaults to false
   * @return tile columns
   */
  static createRequiredColumns(autoincrement = false): TileColumn[] {
    const columns: TileColumn[] = [];
    columns.push(TileColumn.createIdColumn(autoincrement));
    columns.push(TileColumn.createZoomLevelColumn());
    columns.push(TileColumn.createTileColumnColumn());
    columns.push(TileColumn.createTileRowColumn());
    columns.push(TileColumn.createTileDataColumn());
    return columns;
  }

  /**
   * {@inheritDoc}
   */
  validateContents(contents: Contents): void {
    // Verify the Contents have a tiles data type
    const dataType = contents.getDataType();
    if (dataType === null || dataType === undefined || dataType !== ContentsDataType.TILES) {
      throw new Error('The Contents of a TileTable must have a data type of tiles');
    }
  }
}
