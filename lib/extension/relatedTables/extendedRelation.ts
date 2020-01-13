/**
 * @module extension/relatedTables
 */

/**
 * Describes the relationships between a base table, a related data table, and a
 * mapping table
 * @class ExtendedRelation
 */
export class ExtendedRelation {
  /**
   * Autoincrement primary key
   * @member {Number}
   */
  id: number;

  /**
 * Name of the table containing the base data (e.g., features) to relate
 * @member {String}
 */
  base_table_name: string;

  /**
 * Name of the primary key column in base_table_name
 * @member {String}
 */
  base_primary_column: string;

  /**
 * Name of the table containing the related content
 * @member {String}
 */
  related_table_name: string;

  /**
 * Name of the primary key column in related_table_name
 * @member {String}
 */
  related_primary_column: string;

  /**
 * Name (profile) of the relationship
 * @member {String}
 */
  relation_name: string;

  /**
 * Name of a mapping table
 * @member {String}
 */
  mapping_table_name: string;

  mappingRows: any;
}
