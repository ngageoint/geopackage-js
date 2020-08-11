/**
 * @memberOf module:extension/style
 * @class StyleRow
 */

import { AttributesRow } from '../../attributes/attributesRow';
import { StyleTable } from './styleTable';
import { UserColumn } from '../../user/userColumn';
import { DBValue } from '../../db/dbAdapter';
import { GeoPackageDataType } from '../../db/geoPackageDataType';

/**
 * Style Row
 * @extends AttributesRow
 * @param  {module:extension/style.StyleTable} styleTable  style table
 * @param  {module:db/geoPackageDataType[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 * @constructor
 */
export class StyleRow extends AttributesRow {
  /**
   * Color hex pattern
   */
  private static readonly colorPattern = /^#([0-9a-fA-F]{3}){1,2}$/;
  styleTable: StyleTable;
  constructor(styleTable: StyleTable, columnTypes?: { [key: string]: GeoPackageDataType }, values?: Record<string, DBValue>) {
    super(styleTable, columnTypes, values);
    this.styleTable = styleTable;
  }
  /**
   * Get the name column
   * @return {module:user/userColumn~UserColumn}
   */
  getNameColumn(): UserColumn {
    return this.styleTable.getNameColumn();
  }
  /**
   * Gets the name
   * @return {String}
   */
  getName(): string {
    return this.getValueWithColumnName(this.getNameColumn().name);
  }
  /**
   * Sets the name for the row
   * @param {String} name name
   */
  setName(name: string): void {
    this.setValueWithColumnName(this.getNameColumn().name, name);
  }
  /**
   * Get the description column
   * @return {module:user/userColumn~UserColumn}
   */
  getDescriptionColumn(): UserColumn {
    return this.styleTable.getDescriptionColumn();
  }
  /**
   * Gets the description
   * @return {String}
   */
  getDescription(): string {
    return this.getValueWithColumnName(this.getDescriptionColumn().name);
  }
  /**
   * Sets the description for the row
   * @param {String} description description
   */
  setDescription(description: string): void {
    this.setValueWithColumnName(this.getDescriptionColumn().name, description);
  }
  /**
   * Get the color column
   * @return {module:user/userColumn~UserColumn}
   */
  getColorColumn(): UserColumn {
    return this.styleTable.getColorColumn();
  }
  /**
   * Get the style color
   * @return {String} color
   */
  getColor(): string {
    return this.createColor(this.getHexColor(), this.getOpacity());
  }
  /**
   * Check if the style has a color
   * @return true if has a color
   */
  hasColor(): boolean {
    return this._hasColor(this.getHexColor(), this.getOpacity());
  }
  /**
   * Get the color
   * @return {String} color
   */
  getHexColor(): string {
    return this.getValueWithColumnName(this.getColorColumn().name);
  }
  /**
   * Set the color
   * @param {String} color color
   * @param {Number} opacity opacity
   */
  setColor(color: string, opacity: number): void {
    this.setHexColor(color);
    this.setOpacity(opacity);
  }
  /**
   * Sets the color for the row
   * @param {String} color color
   */
  setHexColor(color: string): void {
    const validatedColor = this.validateColor(color);
    this.setValueWithColumnName(this.getColorColumn().name, validatedColor);
  }
  /**
   * Get the opacity column
   * @return {module:user/userColumn~UserColumn}
   */
  getOpacityColumn(): UserColumn {
    return this.styleTable.getOpacityColumn();
  }
  /**
   * Gets the opacity
   * @return {Number}
   */
  getOpacity(): number {
    return this.getValueWithColumnName(this.getOpacityColumn().name);
  }
  /**
   * Get the opacity or default value
   * @return {Number} opacity
   */
  getOpacityOrDefault(): number {
    let opacity = this.getOpacity();
    if (opacity === null) {
      opacity = 1.0;
    }
    return opacity;
  }
  /**
   * Sets the opacity for the row
   * @param {Number} opacity opacity
   */
  setOpacity(opacity: number): void {
    this.validateOpacity(opacity);
    this.setValueWithColumnName(this.getOpacityColumn().name, opacity);
  }
  /**
   * Get the width column
   * @return {module:user/userColumn~UserColumn}
   */
  getWidthColumn(): UserColumn {
    return this.styleTable.getWidthColumn();
  }
  /**
   * Gets the width
   * @return {number}
   */
  getWidth(): number {
    return this.getValueWithColumnName(this.getWidthColumn().name);
  }
  /**
   * Sets the width for the row
   * @param {Number} width width
   */
  setWidth(width: number): void {
    if (width !== null && width < 0.0) {
      throw new Error('Width must be greater than or equal to 0.0, invalid value: ' + width);
    }
    this.setValueWithColumnName(this.getWidthColumn().name, width);
  }
  /**
   * Get the width value or default width
   * @return width
   */
  getWidthOrDefault(): number {
    let width = this.getWidth();
    if (width === null) {
      width = 1.0;
    }
    return width;
  }
  /**
   * Get the fill color column
   * @return {module:user/userColumn~UserColumn}
   */
  getFillColorColumn(): UserColumn {
    return this.styleTable.getFillColorColumn();
  }
  /**
   * Get the style fill color
   * @return {String} color
   */
  getFillColor(): string {
    return this.createColor(this.getFillHexColor(), this.getFillOpacity());
  }
  /**
   * Check if the style has a fill color
   * @return true if has a color
   */
  hasFillColor(): boolean {
    return this._hasColor(this.getFillHexColor(), this.getFillOpacity());
  }
  /**
   * Get the fill color
   * @return {String} color
   */
  getFillHexColor(): string {
    return this.getValueWithColumnName(this.getFillColorColumn().name);
  }
  /**
   * Set the fill color
   * @param {String} color color
   * @param {Number} opacity opacity
   */
  setFillColor(color: string, opacity: number): void {
    this.setFillHexColor(color);
    this.setFillOpacity(opacity);
  }
  /**
   * Sets the fill color for the row
   * @param {String} color color
   */
  setFillHexColor(color: string): void {
    const validatedColor = this.validateColor(color);
    this.setValueWithColumnName(this.getFillColorColumn().name, validatedColor);
  }
  /**
   * Get the fill opacity column
   * @return {module:user/userColumn~UserColumn}
   */
  getFillOpacityColumn(): UserColumn {
    return this.styleTable.getFillOpacityColumn();
  }
  /**
   * Gets the fill opacity
   * @return {Number}
   */
  getFillOpacity(): number {
    return this.getValueWithColumnName(this.getFillOpacityColumn().name);
  }
  /**
   * Sets the fill opacity for the row
   * @param {Number} fillOpacity fillOpacity
   */
  setFillOpacity(fillOpacity: number): void {
    this.validateOpacity(fillOpacity);
    this.setValueWithColumnName(this.getFillOpacityColumn().name, fillOpacity);
  }
  /**
   * Get the fill opacity or default value
   * @return {Number} fill opacity
   */
  getFillOpacityOrDefault(): number {
    let fillOpacity = this.getFillOpacity();
    if (fillOpacity == null) {
      fillOpacity = 1.0;
    }
    return fillOpacity;
  }
  /**
   * Validate and adjust the color value
   * @param {String} color color
   */
  validateColor(color: string): string {
    let validated = color;
    if (color != null) {
      if (!color.startsWith('#')) {
        validated = '#' + color;
      }
      if (!StyleRow.colorPattern.test(validated)) {
        throw new Error('Color must be in hex format #RRGGBB or #RGB, invalid value: ' + color);
      }
      validated = validated.toUpperCase();
    }
    return validated;
  }
  /**
   * Validate the opacity value
   * @param {Number} opacity opacity
   */
  validateOpacity(opacity: number): boolean {
    if (opacity != null && (opacity < 0.0 || opacity > 1.0)) {
      throw new Error('Opacity must be set inclusively between 0.0 and 1.0, invalid value: ' + opacity);
    }
    return true;
  }
  /**
   * Create a color from the hex color and opacity
   * @param {String} hexColor hex color
   * @param {Number} opacity opacity
   * @return {String} rgba color
   */
  createColor(hexColor: string, opacity: number): string {
    let color = '#000000';
    if (hexColor !== null) {
      color = hexColor;
    }
    if (opacity !== null) {
      let a = Math.round(opacity * 255).toString(16);
      if (a.length === 1) {
        a = '0' + a;
      }
      color += a;
    }
    return color.toUpperCase();
  }
  /**
   * Determine if a color exists from the hex color and opacity
   * @param {String} hexColor hex color
   * @param {Number} opacity opacity
   * @return true if has a color
   */
  _hasColor(hexColor: string, opacity: number): boolean {
    return hexColor !== null || opacity !== null;
  }
}
