import {TileTable} from "./tileTable";
import {UserRow} from '../../user/userRow';
import {TileColumn} from "./tileColumn";
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
  constructor(tileTable: TileTable, columnTypes?: any[], values?: any[]) {
    super(tileTable, columnTypes, values);
    this.tileTable = tileTable;
  }
  toObjectValue(value: any) {
    return value;
  }
  toDatabaseValue(columnName: string): any {
    return this.getValueWithColumnName(columnName);
  }
  /**
   * Get the zoom level column index
   * @return {Number} zoom level column index
   */
  getZoomLevelColumnIndex(): number {
    return this.tileTable.zoomLevelIndex;
  }
  /**
   * Get the zoom level column
   * @return {TileColumn} zoom level column
   */
  getZoomLevelColumn(): TileColumn {
    return this.tileTable.getZoomLevelColumn();
  }
  /**
   * Get the zoom level
   * @return {Number} zoom level
   */
  getZoomLevel(): number {
    return this.getValueWithColumnName(this.getZoomLevelColumn().name);
  }
  /**
   * Set the zoom level
   * @param {Number} zoomLevel zoom level
   */
  setZoomLevel(zoomLevel: number) {
    this.setValueWithIndex(this.getZoomLevelColumnIndex(), zoomLevel);
  }
  /**
   * Get the tile column column Index
   * @return {number} tile column column index
   */
  getTileColumnColumnIndex(): number {
    return this.tileTable.tileColumnIndex;
  }
  /**
   * Get the tile column column
   * @return {TileColumn} tile column column
   */
  getTileColumnColumn(): TileColumn {
    return this.tileTable.getTileColumnColumn();
  }
  /**
   * Get the tile column
   * @return {Number} tile column
   */
  getTileColumn(): number {
    return this.getValueWithColumnName(this.getTileColumnColumn().name);
  }
  /**
   * Set the tile column
   * @param {number} tileColumn tile column
   */
  setTileColumn(tileColumn: number) {
    this.setValueWithColumnName(this.getTileColumnColumn().name, tileColumn);
  }
  /**
   * Get the tile row column index
   * @return {Number} tile row column index
   */
  getRowColumnIndex(): number {
    return this.tileTable.tileRowIndex;
  }
  /**
   * Get the tile row column
   * @return {TileColumn} tile row column
   */
  getRowColumn(): TileColumn {
    return this.tileTable.getRowColumn();
  }
  /**
   * Get the tile row
   * @return {Number} tile row
   */
  getRow(): number {
    return this.getValueWithColumnName(this.getRowColumn().name);
  }
  /**
   * Set the tile row
   * @param {Number} tileRow tile row
   */
  setTileRow(tileRow: number) {
    this.setValueWithColumnName(this.getRowColumn().name, tileRow);
  }
  /**
   * Get the tile data column index
   * @return {Number} tile data column index
   */
  getTileDataColumnIndex(): number {
    return this.tileTable.tileDataIndex;
  }
  /**
   * Get the tile data column
   * @return {TileColumn} tile data column
   */
  getTileDataColumn(): TileColumn {
    return this.tileTable.getTileDataColumn();
  }
  /**
   * Get the tile data
   * @return {Buffer} tile data
   */
  getTileData(): Buffer {
    return this.getValueWithColumnName(this.getTileDataColumn().name);
  }
  /**
   * Set the tile data
   * @param {Buffer} tileData tile data
   */
  setTileData(tileData: Buffer) {
    this.setValueWithColumnName(this.getTileDataColumn().name, tileData);
  }
  /**
   * Get the tile data as an image
   * @return {*} tile image
   */
  getTileDataImage() {
    // TODO
  }
}
