/**
 * @module tiles/user/tileTable
 */

import {UserTable} from '../../user/userTable';
import {TileColumn} from './tileColumn';

/**
 * `TileTable` models [tile pyramid user tables](https://www.geopackage.org/spec121/index.html#tiles_user_tables).
 *
 * @class
 * @param {string} tableName
 * @param {module:tiles/user/tileColumn~TileColumn[]} columns
 */
export class TileTable extends UserTable {
  zoomLevelIndex: number;
  tileColumnIndex: number;
  tileRowIndex: number;
  tileDataIndex: number;
  constructor(tableName: string, columns: TileColumn[]) {
    super(tableName, columns);
    var uniqueColumns = [];
    for (var i = 0; i < columns.length; i++) {
      var column = columns[i];
      var columnName = column.name;
      var columnIndex = column.index;
      switch (columnName) {
      case TileColumn.COLUMN_ZOOM_LEVEL:
        this.duplicateCheck(columnIndex, this.zoomLevelIndex, TileColumn.COLUMN_ZOOM_LEVEL);
        this.zoomLevelIndex = columnIndex;
        uniqueColumns.push(column);
        break;
      case TileColumn.COLUMN_TILE_COLUMN:
        this.duplicateCheck(columnIndex, this.tileColumnIndex, TileColumn.COLUMN_TILE_COLUMN);
        this.tileColumnIndex = columnIndex;
        uniqueColumns.push(column);
        break;
      case TileColumn.COLUMN_TILE_ROW:
        this.duplicateCheck(columnIndex, this.tileRowIndex, TileColumn.COLUMN_TILE_ROW);
        this.tileRowIndex = columnIndex;
        uniqueColumns.push(column);
        break;
      case TileColumn.COLUMN_TILE_DATA:
        this.duplicateCheck(columnIndex, this.tileDataIndex, TileColumn.COLUMN_TILE_DATA);
        this.tileDataIndex = columnIndex;
        break;
      }
    }
    this.uniqueConstraints = [{ columns: uniqueColumns }];
    this.missingCheck(this.zoomLevelIndex, TileColumn.COLUMN_ZOOM_LEVEL);
    this.zoomLevelIndex = this.zoomLevelIndex;
    this.missingCheck(this.tileColumnIndex, TileColumn.COLUMN_TILE_COLUMN);
    this.tileColumnIndex = this.tileColumnIndex;
    this.missingCheck(this.tileRowIndex, TileColumn.COLUMN_TILE_ROW);
    this.tileRowIndex = this.tileRowIndex;
    this.missingCheck(this.tileDataIndex, TileColumn.COLUMN_TILE_DATA);
    this.tileDataIndex = this.tileDataIndex;
  }
  getZoomLevelColumn(): TileColumn {
    return this.getColumnWithIndex(this.zoomLevelIndex);
  }
  getTileColumnColumn(): TileColumn {
    return this.getColumnWithIndex(this.tileColumnIndex);
  }
  getRowColumn(): TileColumn {
    return this.getColumnWithIndex(this.tileRowIndex);
  }
  getTileDataColumn(): TileColumn {
    return this.getColumnWithIndex(this.tileDataIndex);
  }
  getTableType(): string {
    return UserTable.TILE_TABLE;
  }
  static createRequiredColumns(): TileColumn[] {
    return TileTable.createRequiredColumnsWithStartingIndex(0);
  }
  static createRequiredColumnsWithStartingIndex(startingIndex: number): TileColumn[] {
    var columns = [];
    columns.push(TileColumn.createIdColumn(startingIndex++));
    columns.push(TileColumn.createZoomLevelColumn(startingIndex++));
    columns.push(TileColumn.createTileColumnColumn(startingIndex++));
    columns.push(TileColumn.createTileRowColumn(startingIndex++));
    columns.push(TileColumn.createTileDataColumn(startingIndex++));
    return columns;
  }
}
