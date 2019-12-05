/**
 * @memberOf module:extension/style
 * @class StyleTableReader
 */
import AttributeTableReader from '../../attributes/attributeTableReader';
import StyleTable from './styleTable';

/**
 * Reads the metadata from an existing attribute table
 * @extends {AttributeTableReader}
 * @constructor
*/
export default class StyleTableReader extends AttributeTableReader {
  /**
   *
   * @param {String} tableName
   * @param columns
   * @returns {module:extension/style.StyleTable}
   */
  createTable(tableName, columns) {
    return new StyleTable(tableName, columns);
  }
}