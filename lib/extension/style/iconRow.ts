import IconTable from "./iconTable";
import MediaRow from '../relatedTables/mediaRow';
import { ImageUtils } from '../../tiles/imageUtils';

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
export default class IconRow extends MediaRow {
  iconTable: IconTable;
  constructor(iconTable: IconTable, columnTypes?: any[], values?: any[]) {
    super(iconTable, columnTypes, values);
    this.iconTable = iconTable;
  }
  /**
   * Get the name column
   * @return {module:user/userColumn~UserColumn}
   */
  getNameColumn() {
    return this.iconTable.getNameColumn();
  }
  /**
   * Gets the name
   * @return {String}
   */
  getName() {
    return this.getValueWithColumnName(this.getNameColumn().name);
  }
  /**
   * Sets the name for the row
   * @param {String} name name
   */
  setName(name) {
    this.setValueWithColumnName(this.getNameColumn().name, name);
  }
  /**
   * Get the description column
   * @return {module:user/userColumn~UserColumn}
   */
  getDescriptionColumn() {
    return this.iconTable.getDescriptionColumn();
  }
  /**
   * Gets the description
   * @return {String}
   */
  getDescription() {
    return this.getValueWithColumnName(this.getDescriptionColumn().name);
  }
  /**
   * Sets the description for the row
   * @param {string} description description
   */
  setDescription(description) {
    this.setValueWithColumnName(this.getDescriptionColumn().name, description);
  }
  /**
   * Get the width column
   * @return {module:user/userColumn~UserColumn}
   */
  getWidthColumn() {
    return this.iconTable.getWidthColumn();
  }
  /**
   * Gets the width
   * @return {Number}
   */
  getWidth() {
    return this.getValueWithColumnName(this.getWidthColumn().name);
  }
  /**
   * Sets the width for the row
   * @param {Number} width width
   */
  setWidth(width) {
    this.setValueWithColumnName(this.getWidthColumn().name, width);
  }
  /**
   * Get the width or derived width from the icon data and scaled as needed
   * for the height
   *
   * @return {Number}  derived width
   */
  getDerivedWidth() {
    var width = this.getWidth();
    if (width === undefined || width === null) {
      width = this.getDerivedDimensions()[0];
    }
    return width;
  }
  /**
   * Get the height column
   * @return {module:user/userColumn~UserColumn}
   */
  getHeightColumn() {
    return this.iconTable.getHeightColumn();
  }
  /**
   * Gets the height
   * @return {Number}
   */
  getHeight() {
    return this.getValueWithColumnName(this.getHeightColumn().name);
  }
  /**
   * Sets the height for the row
   * @param {Number} height height
   */
  setHeight(height) {
    this.setValueWithColumnName(this.getHeightColumn().name, height);
  }
  /**
   * Get the height or derived height from the icon data and scaled as needed
   * for the width
   *
   * @return {Number} derived height
   */
  getDerivedHeight() {
    var height = this.getHeight();
    if (height === undefined || height === null) {
      height = this.getDerivedDimensions()[1];
    }
    return height;
  }
  /**
   * Get the derived width and height from the values and icon data, scaled as needed
   * @return {Number[]} derived dimensions array with two values, width at index 0, height at index 1
   */
  getDerivedDimensions() {
    var width = this.getWidth();
    var height = this.getHeight();
    if (width === undefined || width === null || height === undefined || height === null) {
      var dataWidth;
      var dataHeight;
      var imageSize = ImageUtils.getImageSize(this.getData());
      dataWidth = imageSize.width;
      dataHeight = imageSize.height;
      if (width === undefined || width === null) {
        width = dataWidth;
        if (height !== undefined && height !== null) {
          width *= (height / dataHeight);
        }
      }
      if (height === undefined || height === null) {
        height = dataHeight;
        if (width !== undefined && width !== null) {
          height *= (width / dataWidth);
        }
      }
    }
    return [width, height];
  }
  /**
   * Get the anchor_u column
   * @return {module:user/userColumn~UserColumn}
   */
  getAnchorUColumn() {
    return this.iconTable.getAnchorUColumn();
  }
  /**
   * Gets the anchor_u
   * @return {Number}
   */
  getAnchorU() {
    return this.getValueWithColumnName(this.getAnchorUColumn().name);
  }
  /**
   * Sets the anchor_u for the row
   * @param {Number} anchor_u anchor_u
   */
  setAnchorU(anchor_u) {
    this.validateAnchor(anchor_u);
    this.setValueWithColumnName(this.getAnchorUColumn().name, anchor_u);
  }
  /**
   * Get the anchor u value or the default value of 0.5
   * @return {Number} anchor u value
   */
  getAnchorUOrDefault() {
    var anchorU = this.getAnchorU();
    if (anchorU == null) {
      anchorU = 0.5;
    }
    return anchorU;
  }
  /**
   * Get the anchor_v column
   * @return {module:user/userColumn~UserColumn}
   */
  getAnchorVColumn() {
    return this.iconTable.getAnchorVColumn();
  }
  /**
   * Gets the anchor_v
   * @return {Number}
   */
  getAnchorV() {
    return this.getValueWithColumnName(this.getAnchorVColumn().name);
  }
  /**
   * Sets the anchor_v for the row
   * @param {Number} anchor_v anchor_v
   */
  setAnchorV(anchor_v) {
    this.validateAnchor(anchor_v);
    this.setValueWithColumnName(this.getAnchorVColumn().name, anchor_v);
  }
  /**
   * Get the anchor v value or the default value of 1.0
   * @return {Number} anchor v value
   */
  getAnchorVOrDefault() {
    var anchorV = this.getAnchorV();
    if (anchorV == null) {
      anchorV = 1.0;
    }
    return anchorV;
  }
  /**
   * Validate the anchor value
   * @param {Number} anchor anchor
   */
  validateAnchor(anchor) {
    if (anchor != null && (anchor < 0.0 || anchor > 1.0)) {
      throw new Error("Anchor must be set inclusively between 0.0 and 1.0, invalid value: " + anchor);
    }
  }
}
