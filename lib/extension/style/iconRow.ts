import { IconTable } from './iconTable';
import { MediaRow } from '../relatedTables/mediaRow';
import { ImageUtils } from '../../tiles/imageUtils';
import { UserColumn } from '../../user/userColumn';
import { DataTypes } from '../../..';
import { DBValue } from '../../db/dbAdapter';

/**
 * @memberOf module:extension/style
 * @class IconRow
 */

/**
 * Icon Row
 * @extends MediaRow
 * @param  {module:extension/style.IconTable} iconTable  icon table
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 * @constructor
 */
export class IconRow extends MediaRow {
  iconTable: IconTable;
  constructor(iconTable: IconTable, columnTypes?: { [key: string]: DataTypes }, values?: Record<string, DBValue>) {
    super(iconTable, columnTypes, values);
    this.iconTable = iconTable;
  }
  /**
   * Get the name column
   * @return {module:user/userColumn~UserColumn}
   */
  getNameColumn(): UserColumn {
    return this.iconTable.getNameColumn();
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
    return this.iconTable.getDescriptionColumn();
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
   * @param {string} description description
   */
  setDescription(description: string): void {
    this.setValueWithColumnName(this.getDescriptionColumn().name, description);
  }
  /**
   * Get the width column
   * @return {module:user/userColumn~UserColumn}
   */
  getWidthColumn(): UserColumn {
    return this.iconTable.getWidthColumn();
  }
  /**
   * Gets the width
   * @return {Number}
   */
  getWidth(): number {
    return this.getValueWithColumnName(this.getWidthColumn().name);
  }
  /**
   * Sets the width for the row
   * @param {Number} width width
   */
  setWidth(width: number): void {
    this.setValueWithColumnName(this.getWidthColumn().name, width);
  }
  /**
   * Get the width or derived width from the icon data and scaled as needed
   * for the height
   *
   * @return {Number}  derived width
   */
  getDerivedWidth(): number {
    let width = this.getWidth();
    if (width === undefined || width === null) {
      width = this.getDerivedDimensions()[0];
    }
    return width;
  }
  /**
   * Get the height column
   * @return {module:user/userColumn~UserColumn}
   */
  getHeightColumn(): UserColumn {
    return this.iconTable.getHeightColumn();
  }
  /**
   * Gets the height
   * @return {Number}
   */
  getHeight(): number {
    return this.getValueWithColumnName(this.getHeightColumn().name);
  }
  /**
   * Sets the height for the row
   * @param {Number} height height
   */
  setHeight(height: number): void {
    this.setValueWithColumnName(this.getHeightColumn().name, height);
  }
  /**
   * Get the height or derived height from the icon data and scaled as needed
   * for the width
   *
   * @return {Number} derived height
   */
  getDerivedHeight(): number {
    let height = this.getHeight();
    if (height === undefined || height === null) {
      height = this.getDerivedDimensions()[1];
    }
    return height;
  }
  /**
   * Get the derived width and height from the values and icon data, scaled as needed
   * @return {Number[]} derived dimensions array with two values, width at index 0, height at index 1
   */
  getDerivedDimensions(): number[] {
    let width = this.getWidth();
    let height = this.getHeight();
    if (width === undefined || width === null || height === undefined || height === null) {
      const imageSize = ImageUtils.getImageSize(this.getData());
      const dataWidth = imageSize.width;
      const dataHeight = imageSize.height;
      if (width === undefined || width === null) {
        width = dataWidth;
        if (height !== undefined && height !== null) {
          width *= height / dataHeight;
        }
      }
      if (height === undefined || height === null) {
        height = dataHeight;
        if (width !== undefined && width !== null) {
          height *= width / dataWidth;
        }
      }
    }
    return [width, height];
  }
  /**
   * Get the anchor_u column
   * @return {module:user/userColumn~UserColumn}
   */
  getAnchorUColumn(): UserColumn {
    return this.iconTable.getAnchorUColumn();
  }
  /**
   * Gets the anchor_u
   * @return {Number}
   */
  getAnchorU(): number {
    return this.getValueWithColumnName(this.getAnchorUColumn().name);
  }
  /**
   * Sets the anchor_u for the row
   * @param {Number} anchor_u anchor_u
   */
  setAnchorU(anchorU: number): void {
    this.validateAnchor(anchorU);
    this.setValueWithColumnName(this.getAnchorUColumn().name, anchorU);
  }
  /**
   * Get the anchor u value or the default value of 0.5
   * @return {Number} anchor u value
   */
  getAnchorUOrDefault(): number {
    let anchorU = this.getAnchorU();
    if (anchorU == null) {
      anchorU = 0.5;
    }
    return anchorU;
  }
  /**
   * Get the anchor_v column
   * @return {module:user/userColumn~UserColumn}
   */
  getAnchorVColumn(): UserColumn {
    return this.iconTable.getAnchorVColumn();
  }
  /**
   * Gets the anchor_v
   * @return {Number}
   */
  getAnchorV(): number {
    return this.getValueWithColumnName(this.getAnchorVColumn().name);
  }
  /**
   * Sets the anchor_v for the row
   * @param {Number} anchor_v anchor_v
   */
  setAnchorV(anchorV: number): void {
    this.validateAnchor(anchorV);
    this.setValueWithColumnName(this.getAnchorVColumn().name, anchorV);
  }
  /**
   * Get the anchor v value or the default value of 1.0
   * @return {Number} anchor v value
   */
  getAnchorVOrDefault(): number {
    let anchorV = this.getAnchorV();
    if (anchorV == null) {
      anchorV = 1.0;
    }
    return anchorV;
  }
  /**
   * Validate the anchor value
   * @param {Number} anchor anchor
   */
  validateAnchor(anchor: number): boolean {
    if (anchor != null && (anchor < 0.0 || anchor > 1.0)) {
      throw new Error('Anchor must be set inclusively between 0.0 and 1.0, invalid value: ' + anchor);
    }
    return true;
  }
}
