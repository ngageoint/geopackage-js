/**
 * @memberOf module:extension/style
 * @class StyleMappingTable
 */
import { UserMappingTable } from '../relatedTables/userMappingTable';
import { UserColumn } from '../../user/userColumn';
/**
 * Contains style mapping table factory and utility methods
 * @extends UserMappingTable
 * @param  {string} tableName table name
 * @param  {module:user/userColumn~UserColumn[]} columns   style mapping columns
 * @constructor
 */
export declare class StyleMappingTable extends UserMappingTable {
    static readonly COLUMN_GEOMETRY_TYPE_NAME = "geometry_type_name";
    /**
     * Get the geometry type name column index
     * @return int
     */
    getGeometryTypeNameColumnIndex(): number;
    /**
     * Get the geometry type name column
     * @return {module:user/userColumn~UserColumn}
     */
    getGeometryTypeNameColumn(): UserColumn;
    /**
     * Creates a user mapping table with the minimum required columns followed by the additional columns
     * @param  {string} tableName name of the table
     * @return {module:extension/relatedTables~UserMappingTable}
     */
    static create(tableName: string): StyleMappingTable;
    /**
     * Create the columns
     * @return {module:user/userColumn~UserColumn[]}
     */
    static createColumns(): UserColumn[];
}
