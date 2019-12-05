/**
 * attributeTableReader module.
 * @module attributes/attributeTableReader
 */

import UserTableReader from '../user/userTableReader';
import AttributeTable from './attributeTable';

/**
* Reads the metadata from an existing attribute table
* @class AttributeTableReader
* @extends UserTableReader
* @classdesc Reads the metadata from an existing attributes table
*/
export default class AttributeTableReader extends UserTableReader {
  /**
   * @inheritdoc
   */
  createTable(tableName, columns) {
    return new AttributeTable(tableName, columns);
  }
}