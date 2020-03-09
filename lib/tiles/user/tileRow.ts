import { TileTable } from './tileTable';
import { UserRow } from '../../user/userRow';
import { TileColumn } from './tileColumn';
import { DBValue } from '../../db/dbAdapter';
import { DataTypes } from '../../db/dataTypes';
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
export class TileRow extends UserRow {
  tileTable: TileTable;
  constructor(tileTable: TileTable, columnTypes?: { [key: string]: DataTypes }, values?: Record<string, DBValue>) {
    super(tileTable, columnTypes, values);
    this.tileTable = tileTable;
  }
  /**
   * Get the zoom level column index
   * @return {Number} zoom level column index
   */
  get zoomLevelColumnIndex(): number {
    return this.tileTable.zoomLevelIndex;
  }
  /**
   * Get the zoom level column
   * @return {TileColumn} zoom level column
   */
  get zoomLevelColumn(): TileColumn {
    return this.tileTable.zoomLevelColumn;
  }
  /**
   * Get the zoom level
   * @return {Number} zoom level
   */
  get zoomLevel(): number {
    return this.getValueWithColumnName(this.zoomLevelColumn.name);
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
    return this.tileTable.tileColumnIndex;
  }
  /**
   * Get the tile column column
   * @return {TileColumn} tile column column
   */
  get tileColumnColumn(): TileColumn {
    return this.tileTable.tileColumnColumn;
  }
  /**
   * Get the tile column
   * @return {Number} tile column
   */
  get tileColumn(): number {
    return this.getValueWithColumnName(this.tileColumnColumn.name);
  }
  /**
   * Set the tile column
   * @param {number} tileColumn tile column
   */
  set tileColumn(tileColumn: number) {
    this.setValueWithColumnName(this.tileColumnColumn.name, tileColumn);
  }
  /**
   * Get the tile row column index
   * @return {Number} tile row column index
   */
  get rowColumnIndex(): number {
    return this.tileTable.tileRowIndex;
  }
  /**
   * Get the tile row column
   * @return {TileColumn} tile row column
   */
  get rowColumn(): TileColumn {
    return this.tileTable.rowColumn;
  }
  /**
   * Get the tile row
   * @return {Number} tile row
   */
  get row(): number {
    return this.getValueWithColumnName(this.rowColumn.name);
  }
  /**
   * Set the tile row
   * @param {Number} tileRow tile row
   */
  set tileRow(tileRow: number) {
    this.setValueWithColumnName(this.rowColumn.name, tileRow);
  }
  /**
   * Get the tile data column index
   * @return {Number} tile data column index
   */
  get tileDataColumnIndex(): number {
    return this.tileTable.tileDataIndex;
  }
  /**
   * Get the tile data column
   * @return {TileColumn} tile data column
   */
  get tileDataColumn(): TileColumn {
    return this.tileTable.tileDataColumn;
  }
  /**
   * Get the tile data
   * @return {Buffer} tile data
   */
  get tileData(): Buffer {
    return this.getValueWithColumnName(this.tileDataColumn.name);
  }
  /**
   * Set the tile data
   * @param {Buffer} tileData tile data
   */
  set tileData(tileData: Buffer) {
    this.setValueWithColumnName(this.tileDataColumn.name, tileData);
  }
  /**
   * Get the tile data as an image
   * @return {*} tile image
   */
  get tileDataImage(): void {
    return null;
  }
}
