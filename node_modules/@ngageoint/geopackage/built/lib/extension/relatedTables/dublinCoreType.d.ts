/**
 * @module  extension/relatedTables
 */
/**
 * Dublin Core Metadata Initiative term types
 * @class
 */
export declare class DublinCoreType {
    name: string;
    synonyms?: string[];
    /**
     * A point or period of time associated with an event in the lifecycle of
     * the resource.
     * @type {Object}
     */
    static readonly DATE: DublinCoreType;
    /**
     * An account of the resource.
     * @type {Object}
     */
    static readonly DESCRIPTION: DublinCoreType;
    /**
     * The file format, physical medium, or dimensions of the resource.
     * @type {Object}
     */
    static readonly FORMAT: DublinCoreType;
    /**
     * An unambiguous reference to the resource within a given context.
     * @type {Object}
     */
    static readonly IDENTIFIER: DublinCoreType;
    /**
     * A related resource from which the described resource is derived.
     * @type {Object}
     */
    static readonly SOURCE: DublinCoreType;
    /**
     * A name given to the resource.
     * @type {Object}
     */
    static readonly TITLE: DublinCoreType;
    constructor(name: string, synonyms?: string[]);
    /**
     * Get the Dublin Core Type from the name
     * @param  {string} name name
     * @return {module:extension/relatedTables~DublinCoreType}
     */
    static fromName(name: string): DublinCoreType;
}
