/**
 * @memberOf module:extension/contents
 * @class ContentsId
 */
/**
 * Contents Id object, for maintaining a unique identifier for contents tables
 * @constructor
 */
class ContentsId {
  constructor() {
    /**
     * Id column, primary key
     * @member {Number}
     */
    this.id = undefined;
    /**
     * Table name column
     * @member {String}
     */
    this.table_name = undefined;
  }
}

module.exports = ContentsId;
