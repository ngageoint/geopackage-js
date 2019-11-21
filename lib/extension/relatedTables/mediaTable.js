/**
 * mediaTable module.
 * @module extension/relatedTables
 */

var UserRelatedTable = require('./userRelatedTable')
  , UserColumn = require('../../user/userColumn')
  , DataType = require('../../db/dataTypes')
  , RelationType = require('./relationType');

/**
 * Media Requirements Class User-Defined Related Data Table
 * @class
 * @extends UserRelatedTable
 * @param  {string} tableName table name
 * @param  {module:user/userColumn~UserColumn[]} columns   media columns
 * @param {string[]} requiredColumns required column names
 */
class MediaTable extends UserRelatedTable {
  constructor(tableName, columns, requiredColumns) {
    super(tableName, MediaTable.RELATION_TYPE.name, MediaTable.RELATION_TYPE.dataType, columns, requiredColumns);
  }
  /**
   * Get the primary key id column
   * @return {module:user/userColumn~UserColumn}
   */
  getIdColumn() {
    return this.getPkColumn();
  }
  /**
   * Get the data column
   * @return {module:user/userColumn~UserColumn}
   */
  getDataColumn() {
    return this.getColumnWithColumnName(MediaTable.COLUMN_DATA);
  }
  /**
   * Get the content type column
   * @return {module:user/userColumn~UserColumn}
   */
  getContentTypeColumn() {
    return this.getColumnWithColumnName(MediaTable.COLUMN_CONTENT_TYPE);
  }
  /**
   * Create a media table with a minimum required columns followed by the additional columns
   * @param  {string} tableName         name of the table
   * @param  {module:user/userColumn~UserColumn[]} additionalColumns additional columns
   * @return {module:extension/relatedTables~MediaTable}
   */
  static create(tableName, additionalColumns) {
    var columns = MediaTable.createRequiredColumns();
    if (additionalColumns) {
      columns = columns.concat(additionalColumns);
    }
    return new MediaTable(tableName, columns, MediaTable.requiredColumns());
  }
  /**
   * Get the required columns
   * @param  {string} [idColumnName=id] id column name
   * @return {string[]}
   */
  static requiredColumns(idColumnName) {
    var requiredColumns = [];
    requiredColumns.push(idColumnName || MediaTable.COLUMN_ID);
    requiredColumns.push(MediaTable.COLUMN_DATA);
    requiredColumns.push(MediaTable.COLUMN_CONTENT_TYPE);
    return requiredColumns;
  }
  /**
   * Get the number of required columns
   * @return {Number}
   */
  static numRequiredColumns() {
    return MediaTable.requiredColumns().length;
  }
  /**
   * Create the required columns
   * @param  {Number} [startingIndex=0] starting index of the required columns
   * @param  {string} [idColumnName=id]  id column name
   * @return {module:user/userColumn~UserColumn[]}
   */
  static createRequiredColumns(startingIndex, idColumnName) {
    startingIndex = startingIndex || 0;
    return [
      MediaTable.createIdColumn(startingIndex++, idColumnName || MediaTable.COLUMN_ID),
      MediaTable.createDataColumn(startingIndex++),
      MediaTable.createContentTypeColumn(startingIndex++)
    ];
  }
  /**
   * Create the primary key id column
   * @param  {Number} index        index of the column
   * @param  {string} idColumnName name of the id column
   * @return {module:user/userColumn~UserColumn}
   */
  static createIdColumn(index, idColumnName) {
    return UserColumn.createPrimaryKeyColumnWithIndexAndName(index, idColumnName);
  }
  /**
   * Create the data column
   * @param  {Number} index        index of the column
   * @return {module:user/userColumn~UserColumn}
   */
  static createDataColumn(index) {
    return UserColumn.createColumnWithIndex(index, MediaTable.COLUMN_DATA, DataType.GPKGDataType.GPKG_DT_BLOB, true);
  }
  /**
   * Create the content type column
   * @param  {Number} index        index of the column
   * @return {module:user/userColumn~UserColumn}
   */
  static createContentTypeColumn(index) {
    return UserColumn.createColumnWithIndex(index, MediaTable.COLUMN_CONTENT_TYPE, DataType.GPKGDataType.GPKG_DT_TEXT, true);
  }
}

MediaTable.RELATION_TYPE = RelationType.MEDIA;
MediaTable.COLUMN_ID = 'id';
MediaTable.COLUMN_DATA = 'data';
MediaTable.COLUMN_CONTENT_TYPE = 'content_type';

MediaTable.prototype.TABLE_TYPE = 'media';

module.exports = MediaTable;
