/**
 * @memberOf module:extension/nga/style
 * @class IconRow
 */

import { IconTable } from './iconTable';
import { MediaRow } from '../../related/media/mediaRow';
import { ImageUtils } from '../../../image/imageUtils';
import { UserColumn } from '../../../user/userColumn';
import { StyleTable } from './styleTable';
import { UserCustomRow } from '../../../user/custom/userCustomRow';

/**
 * Icon Row
 */
export class IconRow extends MediaRow {
  private tableIcon = false;

  /**
   * Constructor to create an empty row
   */
  public constructor();

  /**
   * Constructor to create an empty row
   * @param table icon table
   */
  public constructor(table: IconTable);

  /**
   * Constructor
   * @param userCustomRow user custom row
   */
  public constructor(userCustomRow: UserCustomRow);

  /**
   * Copy Constructor
   * @param iconRow icon row to copy
   */
  public constructor(iconRow: IconRow);

  /**
   * Constructor
   * @param args
   */
  public constructor(...args) {
    super(args.length === 0 ? new StyleTable() : args[0]);
  }

  /**
   * Get the icon table
   */
  public getTable(): IconTable {
    return super.getTable() as IconTable;
  }

  /**
   * Get the name column
   * @return {module:user/userColumn~UserColumn}
   */
  getNameColumn(): UserColumn {
    return this.table.getColumn(IconTable.COLUMN_NAME);
  }
  /**
   * Gets the name
   * @return {String}
   */
  getName(): string {
    return this.getValueWithColumnName(this.getNameColumn().getName());
  }
  /**
   * Sets the name for the row
   * @param {String} name name
   */
  setName(name: string): void {
    this.setValueWithColumnName(this.getNameColumn().getName(), name);
  }
  /**
   * Get the description column
   * @return {module:user/userColumn~UserColumn}
   */
  getDescriptionColumn(): UserColumn {
    return this.getTable().getDescriptionColumn();
  }
  /**
   * Gets the description
   * @return {String}
   */
  getDescription(): string {
    return this.getValueWithColumnName(this.getDescriptionColumn().getName());
  }
  /**
   * Sets the description for the row
   * @param {string} description description
   */
  setDescription(description: string): void {
    this.setValueWithColumnName(this.getDescriptionColumn().getName(), description);
  }
  /**
   * Get the width column
   * @return {module:user/userColumn~UserColumn}
   */
  getWidthColumn(): UserColumn {
    return this.getTable().getWidthColumn();
  }
  /**
   * Gets the width
   * @return {Number}
   */
  getWidth(): number {
    return this.getValueWithColumnName(this.getWidthColumn().getName());
  }
  /**
   * Sets the width for the row
   * @param {Number} width width
   */
  setWidth(width: number): void {
    this.setValueWithColumnName(this.getWidthColumn().getName(), width);
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
    return this.getTable().getHeightColumn();
  }
  /**
   * Gets the height
   * @return {Number}
   */
  getHeight(): number {
    return this.getValueWithColumnName(this.getHeightColumn().getName());
  }
  /**
   * Sets the height for the row
   * @param {Number} height height
   */
  setHeight(height: number): void {
    this.setValueWithColumnName(this.getHeightColumn().getName(), height);
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
    return this.getTable().getAnchorUColumn();
  }
  /**
   * Gets the anchor_u
   * @return {Number}
   */
  getAnchorU(): number {
    return this.getValueWithColumnName(this.getAnchorUColumn().getName());
  }
  /**
   * Sets the anchor_u for the row
   * @param anchorU
   */
  setAnchorU(anchorU: number): void {
    this.validateAnchor(anchorU);
    this.setValueWithColumnName(this.getAnchorUColumn().getName(), anchorU);
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
    return this.getTable().getAnchorVColumn();
  }
  /**
   * Gets the anchor_v
   * @return {Number}
   */
  getAnchorV(): number {
    return this.getValueWithColumnName(this.getAnchorVColumn().getName());
  }
  /**
   * Sets the anchor_v for the row
   * @param anchorV
   */
  setAnchorV(anchorV: number): void {
    this.validateAnchor(anchorV);
    this.setValueWithColumnName(this.getAnchorVColumn().getName(), anchorV);
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

  /**
   * Is a table icon
   * @return table icon flag
   */
  isTableIcon(): boolean {
    return this.tableIcon;
  }

  /**
   * Set table icon flag
   * @param tableIcon table icon flag
   */
  setTableIcon(tableIcon: boolean): void {
    this.tableIcon = tableIcon;
  }
}
