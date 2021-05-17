/**
 * @module attributes/attributesTable
 */
import { UserTable } from '../user/userTable';
import { Contents } from '../core/contents/contents';
import { AttributesColumn } from './attributesColumn';
import { AttributesColumns } from './attributesColumns';
import { ContentsDataType } from '../core/contents/contentsDataType';

/**
 * Represents a user attribute table
 * @class AttributesTable
 * @extends UserTable
 * @constructor
 * @param  {string} tableName table name
 * @param  {module:user/userColumn~UserColumn[]} columns   attribute columns
 */
export class AttributesTable extends UserTable<AttributesColumn> {
  contents: Contents;

  constructor(tableName: string, columns: AttributesColumn[]) {
    super(new AttributesColumns(tableName, columns, false));
  }

  /**
   * Set the contents
   * @param  {module:core/contents~Contents} contents the contents
   */
  setContents(contents: Contents): boolean {
    this.contents = contents;
    if (contents.data_type !== ContentsDataType.ATTRIBUTES) {
      throw new Error(
        `The Contents of an Attributes Table must have a data type of ${ContentsDataType.ATTRIBUTES}`,
      );
    }
    return true;
  }
}
