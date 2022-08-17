import { TileTable } from './tileTable';
import { UserRow } from '../../user/userRow';
import { TileColumn } from './tileColumn';
/**
 * tileRow module.
 * @module tiles/user/tileRow
 */

/**
 * Tile Row containing the values from a single result set row
 * @class
 * @extends UserRow
 * @param  {TileTable} tileTable tile table
 * @param  {Array} columnTypes  column types
 * @param  {Array} values       values
 */
export class TileRow extends UserRow<TileColumn, TileTable> {
  /**
   * Get the zoom level column index
   * @return {Number} zoom level column index
   */
  get zoomLevelColumnIndex(): number {
    return this.table.getZoomLevelColumnIndex();
  }
  /**
   * Get the zoom level column
   * @return {TileColumn} zoom level column
   */
  get zoomLevelColumn(): TileColumn {
    return this.table.getZoomLevelColumn();
  }
  /**
   * Get the zoom level
   * @return {Number} zoom level
   */
  get zoomLevel(): number {
    return this.getValueWithColumnName(this.zoomLevelColumn.getName());
  }
  /**
   * Set the zoom level
   * @param {Number} zoomLevel zoom level
   */
  set zoomLevel(zoomLevel: number) {
    this.setValueWithIndex(this.zoomLevelColumnIndex, zoomLevel);
  }
  /**
   * Get the tile column column Index
   * @return {number} tile column column index
   */
  get tileColumnColumnIndex(): number {
    return this.table.getTileColumnColumnIndex();
  }
  /**
   * Get the tile column column
   * @return {TileColumn} tile column column
   */
  get tileColumnColumn(): TileColumn {
    return this.table.getTileColumnColumn();
  }
  /**
   * Get the tile column
   * @return {Number} tile column
   */
  get tileColumn(): number {
    return this.getValueWithColumnName(this.tileColumnColumn.getName());
  }
  /**
   * Set the tile column
   * @param {number} tileColumn tile column
   */
  set tileColumn(tileColumn: number) {
    this.setValueWithColumnName(this.tileColumnColumn.getName(), tileColumn);
  }
  /**
   * Get the tile row column index
   * @return {Number} tile row column index
   */
  get rowColumnIndex(): number {
    return this.table.getTileRowColumnIndex();
  }
  /**
   * Get the tile row column
   * @return {TileColumn} tile row column
   */
  get rowColumn(): TileColumn {
    return this.table.getTileRowColumn();
  }
  /**
   * Get the tile row
   * @return {Number} tile row
   */
  get row(): number {
    return this.getValueWithColumnName(this.rowColumn.getName());
  }
  /**
   * Set the tile row
   * @param {Number} tileRow tile row
   */
  set tileRow(tileRow: number) {
    this.setValueWithColumnName(this.rowColumn.getName(), tileRow);
  }
  /**
   * Get the tile data column index
   * @return {Number} tile data column index
   */
  get tileDataColumnIndex(): number {
    return this.table.getTileDataColumnIndex();
  }
  /**
   * Get the tile data column
   * @return {TileColumn} tile data column
   */
  get tileDataColumn(): TileColumn {
    return this.table.getTileDataColumn();
  }
  /**
   * Get the tile data
   * @return {Buffer} tile data
   */
  get tileData(): Buffer {
    return this.getValueWithColumnName(this.tileDataColumn.getName());
  }
  /**
   * Set the tile data
   * @param {Buffer} tileData tile data
   */
  set tileData(tileData: Buffer) {
    this.setValueWithColumnName(this.tileDataColumn.getName(), tileData);
  }
  /**
   * Get the tile data as an image
   * @return {*} tile image
   */
  get tileDataImage(): void {
    return null;
  }
}
