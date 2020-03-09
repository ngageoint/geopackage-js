import { IconTable } from './iconTable';
import { MediaRow } from '../relatedTables/mediaRow';
import { ImageUtils } from '../../tiles/imageUtils';
import { UserColumn } from '../../user/userColumn';
import { DBValue } from '../../db/dbAdapter';
import { DataTypes } from '../../db/dataTypes';

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
  get nameColumn(): UserColumn {
    return this.iconTable.getNameColumn();
  }
  /**
   * Gets the name
   * @return {String}
   */
  get name(): string {
    return this.getValueWithColumnName(this.nameColumn.name);
  }
  /**
   * Sets the name for the row
   * @param {String} name name
   */
  set name(name: string) {
    this.setValueWithColumnName(this.nameColumn.name, name);
  }
  /**
   * Get the description column
   * @return {module:user/userColumn~UserColumn}
   */
  get descriptionColumn(): UserColumn {
    return this.iconTable.getDescriptionColumn();
  }
  /**
   * Gets the description
   * @return {String}
   */
  get description(): string {
    return this.getValueWithColumnName(this.descriptionColumn.name);
  }
  /**
   * Sets the description for the row
   * @param {string} description description
   */
  set description(description: string) {
    this.setValueWithColumnName(this.descriptionColumn.name, description);
  }
  /**
   * Get the width column
   * @return {module:user/userColumn~UserColumn}
   */
  get widthColumn(): UserColumn {
    return this.iconTable.getWidthColumn();
  }
  /**
   * Gets the width
   * @return {Number}
   */
  get width(): number {
    return this.getValueWithColumnName(this.widthColumn.name);
  }
  /**
   * Sets the width for the row
   * @param {Number} width width
   */
  set width(width: number) {
    this.setValueWithColumnName(this.widthColumn.name, width);
  }
  /**
   * Get the width or derived width from the icon data and scaled as needed
   * for the height
   *
   * @return {Number}  derived width
   */
  get derivedWidth(): number {
    let width = this.width;
    if (width === undefined || width === null) {
      width = this.derivedDimensions[0];
    }
    return width;
  }
  /**
   * Get the height column
   * @return {module:user/userColumn~UserColumn}
   */
  get heightColumn(): UserColumn {
    return this.iconTable.getHeightColumn();
  }
  /**
   * Gets the height
   * @return {Number}
   */
  get height(): number {
    return this.getValueWithColumnName(this.heightColumn.name);
  }
  /**
   * Sets the height for the row
   * @param {Number} height height
   */
  set height(height: number) {
    this.setValueWithColumnName(this.heightColumn.name, height);
  }
  /**
   * Get the height or derived height from the icon data and scaled as needed
   * for the width
   *
   * @return {Number} derived height
   */
  get derivedHeight(): number {
    let height = this.height;
    if (height === undefined || height === null) {
      height = this.derivedDimensions[1];
    }
    return height;
  }
  /**
   * Get the derived width and height from the values and icon data, scaled as needed
   * @return {Number[]} derived dimensions array with two values, width at index 0, height at index 1
   */
  get derivedDimensions(): number[] {
    let width = this.width;
    let height = this.height;
    if (width === undefined || width === null || height === undefined || height === null) {
      const imageSize = ImageUtils.getImageSize(this.data);
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
  get anchorUColumn(): UserColumn {
    return this.iconTable.getAnchorUColumn();
  }
  /**
   * Gets the anchor_u
   * @return {Number}
   */
  get anchorU(): number {
    return this.getValueWithColumnName(this.anchorUColumn.name);
  }
  /**
   * Sets the anchor_u for the row
   * @param {Number} anchor_u anchor_u
   */
  set anchorU(anchorU: number) {
    this.validateAnchor(anchorU);
    this.setValueWithColumnName(this.anchorUColumn.name, anchorU);
  }
  /**
   * Get the anchor u value or the default value of 0.5
   * @return {Number} anchor u value
   */
  get anchorUOrDefault(): number {
    let anchorU = this.anchorU;
    if (anchorU == null) {
      anchorU = 0.5;
    }
    return anchorU;
  }
  /**
   * Get the anchor_v column
   * @return {module:user/userColumn~UserColumn}
   */
  get anchorVColumn(): UserColumn {
    return this.iconTable.getAnchorVColumn();
  }
  /**
   * Gets the anchor_v
   * @return {Number}
   */
  get anchorV(): number {
    return this.getValueWithColumnName(this.anchorVColumn.name);
  }
  /**
   * Sets the anchor_v for the row
   * @param {Number} anchor_v anchor_v
   */
  set anchorV(anchorV: number) {
    this.validateAnchor(anchorV);
    this.setValueWithColumnName(this.anchorVColumn.name, anchorV);
  }
  /**
   * Get the anchor v value or the default value of 1.0
   * @return {Number} anchor v value
   */
  get anchorVOrDefault(): number {
    let anchorV = this.anchorV;
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
