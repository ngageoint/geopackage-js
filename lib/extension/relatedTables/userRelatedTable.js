/**
 * userRelatedTable module.
 * @module extension/relatedTables
 */

var UserTable = require('../../user/userTable');

/**
 * User Defined Related Table
 * @param  {string} tableName table name
 * @param  {array} columns   attribute columns
 */
/**
 * User Defined Related Table
 * @param  {string} tableName       table name
 * @param  {string} relationName    relation name
 * @param  {string} dataType        Contents data type
 * @param  {module:user/userColumn~UserColumn} columns         columns
 * @param  {string[]} [requiredColumns] required columns
 * @return {module:extension/relatedTables~UserRelatedTable}
 */
class UserRelatedTable extends UserTable {
  constructor(tableName, relationName, dataType, columns, requiredColumns) {
    super(tableName, columns, requiredColumns);
    // eslint-disable-next-line camelcase
    this.relation_name = relationName;
    this.data_type = dataType;
  }
  /**
   * Sets the contents
   * @param  {module:core/contents~Contents} contents contents
   * @throw Error if the contents data type does not match this data type
   */
  setContents(contents) {
    this.contents = contents;
    // verify the contents have a relation name data type
    if (!contents.data_type || contents.data_type !== this.data_type) {
      throw new Error('The contents of this related table must have a data type of ' + this.data_type);
    }
  }
}

module.exports = UserRelatedTable;
