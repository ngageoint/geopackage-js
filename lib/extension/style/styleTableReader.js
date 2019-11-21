/**
 * @memberOf module:extension/style
 * @class StyleTableReader
 */

var AttributeTableReader = require('../../attributes/attributeTableReader')
  , StyleTable = require('./styleTable');

/**
 * Reads the metadata from an existing attribute table
 * @extends {AttributeTableReader}
 * @constructor
*/
class StyleTableReader extends AttributeTableReader {
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

module.exports = StyleTableReader;
