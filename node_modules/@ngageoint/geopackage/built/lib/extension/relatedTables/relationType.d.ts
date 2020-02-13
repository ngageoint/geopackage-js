/**
 * @module extension/relatedTables
 */
/**
 * Spec supported User-Defined Related Data Tables
 * @class
 */
export declare class RelationType {
    name: string;
    dataType: string;
    /**
     * Link features with other features
     * @type {Object}
     */
    static readonly FEATURES: RelationType;
    /**
     * Relate sets of tabular text or numeric data
     * @type {Object}
     */
    static readonly SIMPLE_ATTRIBUTES: RelationType;
    /**
     * Relate features or attributes to multimedia files such as pictures and videos
     * @type {Object}
     */
    static readonly MEDIA: RelationType;
    /**
     * Attribute type relation
     * @type {Object}
     */
    static readonly ATTRIBUTES: RelationType;
    /**
     * Tile type relation
     * @type {Object}
     */
    static readonly TILES: RelationType;
    constructor(name: string, dataType: string);
    /**
     * Get the relation type from the name
     * @param  {string} name name
     * @return {module:extension/relatedTables~RelationType}
     */
    static fromName(name: string): RelationType;
}
