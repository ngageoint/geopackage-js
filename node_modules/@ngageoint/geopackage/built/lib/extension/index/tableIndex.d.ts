/**
 * Table Index object, for indexing data within user tables
 */
export declare class TableIndex {
    /**
     * Name of the table
     * @member {String}
     */
    table_name: string;
    /**
     * Last indexed date
     * @member {String}
     */
    last_indexed: string | Date;
}
