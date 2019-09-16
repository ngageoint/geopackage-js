/**
 * @memberOf module:extension/style
 * @class StyleTableReader
 */

var AttributeTableReader = require('../../attributes/attributeTableReader')
  , StyleTable = require('./styleTable');

var util = require('util');

/**
 * Reads the metadata from an existing attribute table
 * @extends {module:attributes/attributeTableReader}
 * @constructor
*/
var StyleTableReader = function(tableName) {
  AttributeTableReader.call(this, tableName);
};

util.inherits(StyleTableReader, AttributeTableReader);

/**
 *
 * @param {String} tableName
 * @param columns
 * @returns {module:extension/style.StyleTable}
 */
StyleTableReader.prototype.createTable = function (tableName, columns) {
  return new StyleTable(tableName, columns);
};

module.exports = StyleTableReader;
