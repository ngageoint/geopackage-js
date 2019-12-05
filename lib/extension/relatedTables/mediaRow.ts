import MediaTable from "./mediaTable";
import UserRow from '../../user/userRow';

/**
 * MediaRow module.
 * @module extension/relatedTables
 */

var ImageUtils = require('../../tiles/imageUtils');

/**
 * User Media Row containing the values from a single result set row
 * @class
 * @extends UserRow
 * @param  {module:extension/relatedTables~MediaTable} mediaTable  media table
 * @param  {module:db/dataTypes[]} columnTypes  column types
 * @param  {module:dao/columnValues~ColumnValues[]} values      values
 */
export default class MediaRow extends UserRow {
  mediaTable: MediaTable;
  constructor(mediaTable: MediaTable, columnTypes?: any[], values?: any[]) {
    super(mediaTable, columnTypes, values);
    this.mediaTable = mediaTable;
  }
  /**
   * Gets the id column
   * @return {module:user/userColumn~UserColumn}
   */
  getIdColumn() {
    return this.mediaTable.getIdColumn();
  }
  /**
   * Gets the id
   * @return {Number}
   */
  getId() {
    return this.getValueWithColumnName(this.getIdColumn().name);
  }
  /**
   * Get the data column
   * @return {module:user/userColumn~UserColumn}
   */
  getDataColumn() {
    return this.mediaTable.getDataColumn();
  }
  /**
   * Gets the data
   * @return {Buffer}
   */
  getData() {
    return this.getValueWithColumnName(this.getDataColumn().name);
  }
  /**
   * Get the data image
   *
   * @return {Promise<Image>}
   */
  getDataImage() {
    return ImageUtils.getImage(this.getData(), this.getContentType());
  }
  /**
   * Get the scaled data image
   * @param {Number} scale
   * @return {Promise<Image>}
   */
  getScaledDataImage(scale) {
    return ImageUtils.getScaledImage(this.getData(), scale);
  }
  /**
   * Sets the data for the row
   * @param  {Buffer} data data
   */
  setData(data) {
    this.setValueWithColumnName(this.getDataColumn().name, data);
  }
  /**
   * Get the content type column
   * @return {module:user/userColumn~UserColumn}
   */
  getContentTypeColumn() {
    return this.mediaTable.getContentTypeColumn();
  }
  /**
   * Gets the content type
   * @return {string}
   */
  getContentType() {
    return this.getValueWithColumnName(this.getContentTypeColumn().name);
  }
  /**
   * Sets the content type for the row
   * @param  {string} contentType contentType
   */
  setContentType(contentType) {
    this.setValueWithColumnName(this.getContentTypeColumn().name, contentType);
  }
}