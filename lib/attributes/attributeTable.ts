/**
 * @module attributes/attributeTable
 */
import { ContentsDao } from '../core/contents/contentsDao';
import { UserTable } from '../user/userTable';
import { Contents } from '../core/contents/contents';

/**
 * Represents a user attribute table
 * @class AttributeTable
 * @extends UserTable
 * @constructor
 * @param  {string} tableName table name
 * @param  {module:user/userColumn~UserColumn[]} columns   attribute columns
 */
export class AttributeTable extends UserTable {
  contents: Contents;

  /**
   * Set the contents
   * @param  {module:core/contents~Contents} contents the contents
   */
  setContents(contents: Contents): boolean {
    this.contents = contents;
    if (contents.data_type !== ContentsDao.GPKG_CDT_ATTRIBUTES_NAME) {
      throw new Error(
        `The Contents of an Attributes Table must have a data type of ${ContentsDao.GPKG_CDT_ATTRIBUTES_NAME}`,
      );
    }
    return true;
  }
}
