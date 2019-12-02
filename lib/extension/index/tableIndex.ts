
/**
 * Table Index object, for indexing data within user tables
 * @class TableIndex
 */
export default class TableIndex {
  /**
   * Name of the table
   * @member {String}
   */
  table_name: String;
  /**
   * Last indexed date
   * @member {String}
   */
  last_indexed: String | Date;
}