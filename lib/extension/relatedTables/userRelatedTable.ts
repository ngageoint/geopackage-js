/**
 * userRelatedTable module.
 * @module extension/relatedTables
 */
import { UserColumn } from '../../user/userColumn';
import { Contents } from '../../core/contents/contents';
import { UserCustomTable } from '../../user/custom/userCustomTable';

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
export class UserRelatedTable extends UserCustomTable {
  contents: Contents;
  constructor(
    tableName: string,
    public relation_name: string,
    public data_type: string,
    columns: UserColumn[],
    requiredColumns: string[],
  ) {
    super(tableName, columns, requiredColumns);
  }

  get tableType(): string {
    return 'userRelatedTable';
  }
  /**
   * Sets the contents
   * @param  {module:core/contents~Contents} contents contents
   * @throw Error if the contents data type does not match this data type
   */
  setContents(contents: Contents): boolean {
    // verify the contents have a relation name data type
    if (!contents.data_type || contents.data_type !== this.data_type) {
      throw new Error('The contents of this related table must have a data type of ' + this.data_type);
    }
    this.contents = contents;
    return true;
  }
}
