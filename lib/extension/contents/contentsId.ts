/**
 * @memberOf module:extension/contents
 * @class ContentsId
 */
/**
 * Contents Id object, for maintaining a unique identifier for contents tables
 * @constructor
 */
export class ContentsId {
  /**
   * Id column, primary key
   * @member {Number}
   */
  id: number;
  /**
   * Table name column
   * @member {String}
   */
  table_name: string;
}
