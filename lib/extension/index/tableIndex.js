
/**
 * Table Index object, for indexing data within user tables
 * @class TableIndex
 */
class TableIndex {
  constructor() {
  /**
   * Name of the table
   * @member {String}
   */
    this.table_name = undefined;

    /**
   * Last indexed date
   * @member {String}
   */
    this.last_indexed = undefined;
  }
}

module.exports = TableIndex;
