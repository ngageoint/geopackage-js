/**
 * @module user/custom
 */

var UserColumn = require('../userColumn');

/**
 * Create a new user custom columnd
 *  @param {Number} index        column index
 *  @param {string} name         column name
 *  @param {module:db/dataTypes~GPKGDataType} dataType  data type
 *  @param {Number} max max value
 *  @param {Boolean} notNull      not null
 *  @param {Object} defaultValue default value or nil
 *  @param {Boolean} primaryKey primary key
 */
class UserCustomColumn extends UserColumn {
  constructor(index, name, dataType, max, notNull, defaultValue, primaryKey) {
    super(index, name, dataType, max, notNull, defaultValue, primaryKey);
    // eslint-disable-next-line eqeqeq
    if (dataType == null) {
      throw new Error('Data type is required to create column: ' + name);
    }
  }
  /**
   *  Create a new column
   *
   *  @param {Number} index        column index
   *  @param {string} name         column name
   *  @param {module:db/dataTypes~GPKGDataType} dataType         data type
   *  @param {Number} [max] max value
   *  @param {Boolean} [notNull]      not null
   *  @param {Object} [defaultValue] default value or nil
   *
   *  @return {module:user/custom~UserCustomColumn} created column
   */
  static createColumn(index, name, dataType, max, notNull, defaultValue) {
    return new UserCustomColumn(index, name, dataType, max, notNull, defaultValue, false);
  }
}

module.exports = UserCustomColumn;
