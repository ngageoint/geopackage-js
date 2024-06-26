import { AttributesRow } from '../../../attributes/attributesRow';
import { StyleTable } from './styleTable';
import { UserColumn } from '../../../user/userColumn';
import { GeoPackageException } from '../../../geoPackageException';

/**
 * Style Row
 */
export class StyleRow extends AttributesRow {
  /**
   * Color hex pattern
   */
  private static readonly colorPattern = /^#([0-9a-fA-F]{3}){1,2}$/;
  private tableStyle = false;

  /**
   * Constructor to create an empty row
   */
  public constructor();

  /**
   * Constructor to create an empty row
   * @param table style table
   */
  public constructor(table: StyleTable);

  /**
   * Constructor
   * @param attributesRow attributes row
   */
  public constructor(attributesRow: AttributesRow);

  /**
   * Copy Constructor
   * @param styleRow style row to copy
   */
  public constructor(styleRow: StyleRow);

  /**
   * Constructor
   * @param args
   */
  public constructor(...args) {
    super(args.length === 0 ? new StyleTable() : args[0]);
  }

  /**
   * @inheritDoc
   */
  public getTable(): StyleTable {
    return super.getTable() as StyleTable;
  }

  /**
   * Get the name column
   * @return {UserColumn}
   */
  getNameColumn(): UserColumn {
    return this.getTable().getNameColumn();
  }
  /**
   * Gets the name
   * @return {String}
   */
  getName(): string {
    return this.getValue(this.getNameColumn().getName());
  }
  /**
   * Sets the name for the row
   * @param {String} name name
   */
  setName(name: string): void {
    this.setValue(this.getNameColumn().getName(), name);
  }
  /**
   * Get the description column
   * @return {UserColumn}
   */
  getDescriptionColumn(): UserColumn {
    return this.getTable().getDescriptionColumn();
  }
  /**
   * Gets the description
   * @return {String}
   */
  getDescription(): string {
    return this.getValue(this.getDescriptionColumn().getName());
  }
  /**
   * Sets the description for the row
   * @param {String} description description
   */
  setDescription(description: string): void {
    this.setValue(this.getDescriptionColumn().getName(), description);
  }
  /**
   * Get the color column
   * @return {UserColumn}
   */
  getColorColumn(): UserColumn {
    return this.getTable().getColorColumn();
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
    return this.getValue(this.getColorColumn().getName());
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
    this.setValue(this.getColorColumn().getName(), validatedColor);
  }
  /**
   * Get the opacity column
   * @return {UserColumn}
   */
  getOpacityColumn(): UserColumn {
    return this.getTable().getOpacityColumn();
  }
  /**
   * Gets the opacity
   * @return {Number}
   */
  getOpacity(): number {
    return this.getValue(this.getOpacityColumn().getName());
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
    this.setValue(this.getOpacityColumn().getName(), opacity);
  }
  /**
   * Get the width column
   * @return {UserColumn}
   */
  getWidthColumn(): UserColumn {
    return this.getTable().getWidthColumn();
  }
  /**
   * Gets the width
   * @return {number}
   */
  getWidth(): number {
    return this.getValue(this.getWidthColumn().getName());
  }
  /**
   * Sets the width for the row
   * @param {Number} width width
   */
  setWidth(width: number): void {
    if (width !== null && width < 0.0) {
      throw new GeoPackageException('Width must be greater than or equal to 0.0, invalid value: ' + width);
    }
    this.setValue(this.getWidthColumn().getName(), width);
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
   * @return {UserColumn}
   */
  getFillColorColumn(): UserColumn {
    return this.getTable().getFillColorColumn();
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
    return this.getValue(this.getFillColorColumn().getName());
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
    this.setValue(this.getFillColorColumn().getName(), validatedColor);
  }
  /**
   * Get the fill opacity column
   * @return {UserColumn}
   */
  getFillOpacityColumn(): UserColumn {
    return this.getTable().getFillOpacityColumn();
  }
  /**
   * Gets the fill opacity
   * @return {Number}
   */
  getFillOpacity(): number {
    return this.getValue(this.getFillOpacityColumn().getName());
  }
  /**
   * Sets the fill opacity for the row
   * @param {Number} fillOpacity fillOpacity
   */
  setFillOpacity(fillOpacity: number): void {
    this.validateOpacity(fillOpacity);
    this.setValue(this.getFillOpacityColumn().getName(), fillOpacity);
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
        throw new GeoPackageException('Color must be in hex format #RRGGBB or #RGB, invalid value: ' + color);
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
      throw new GeoPackageException('Opacity must be set inclusively between 0.0 and 1.0, invalid value: ' + opacity);
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

  /**
   * Is a table style
   * @return table style flag
   */
  isTableStyle(): boolean {
    return this.tableStyle;
  }

  /**
   * Set table style flag
   * @param tableStyle table style flag
   */
  setTableStyle(tableStyle: boolean): void {
    this.tableStyle = tableStyle;
  }
}
