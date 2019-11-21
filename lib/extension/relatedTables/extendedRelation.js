/**
 * @module extension/relatedTables
 */

/**
 * Describes the relationships between a base table, a related data table, and a
 * mapping table
 * @class ExtendedRelation
 */
class ExtendedRelation {

  constructor() {

    /**
   * Autoincrement primary key
   * @member {Number}
   */
    this.id = undefined;

    /**
   * Name of the table containing the base data (e.g., features) to relate
   * @member {String}
   */
    this.base_table_name = undefined;

    /**
   * Name of the primary key column in base_table_name
   * @member {String}
   */
    this.base_primary_column = undefined;

    /**
   * Name of the table containing the related content
   * @member {String}
   */
    this.related_table_name = undefined;

    /**
   * Name of the primary key column in related_table_name
   * @member {String}
   */
    this.related_primary_column = undefined;

    /**
   * Name (profile) of the relationship
   * @member {String}
   */
    this.relation_name = undefined;

    /**
   * Name of a mapping table
   * @member {String}
   */
    this.mapping_table_name = undefined;
  }
}

module.exports = ExtendedRelation;
