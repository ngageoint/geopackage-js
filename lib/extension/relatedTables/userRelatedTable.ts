/**
 * userRelatedTable module.
 * @module extension/relatedTables
 */

import UserTable from '../../user/userTable';
import UserColumn from '../../user/userColumn';

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
export default class UserRelatedTable extends UserTable {
  relation_name: any;
  data_type: any;
  contents: any;
  constructor(tableName: string, relationName: string, dataType: string, columns: UserColumn[], requiredColumns: string[]) {
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