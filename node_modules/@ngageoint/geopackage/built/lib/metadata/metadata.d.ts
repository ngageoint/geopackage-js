/**
 * Contains metadata in MIME encodings structured in accordance with any
 * authoritative metadata specification
 * @class Metadata
 */
export declare class Metadata {
    static readonly UNDEFINED: string;
    static readonly FIELD_SESSION: string;
    static readonly COLLECTION_SESSION: string;
    static readonly SERIES: string;
    static readonly DATASET: string;
    static readonly FEATURE_TYPE: string;
    static readonly FEATURE: string;
    static readonly ATTRIBUTE_TYPE: string;
    static readonly ATTRIBUTE: string;
    static readonly TILE: string;
    static readonly MODEL: string;
    static readonly CATALOG: string;
    static readonly SCHEMA: string;
    static readonly TAXONOMY: string;
    static readonly SOFTWARE: string;
    static readonly SERVICE: string;
    static readonly COLLECTION_HARDWARE: string;
    static readonly NON_GEOGRAPHIC_DATASET: string;
    static readonly DIMENSION_GROUP: string;
    /**
     * Metadata primary key
     * @member {Number}
     */
    id: number;
    /**
     * Case sensitive name of the data scope to which this metadata applies; see Metadata Scopes below
     * @member {string}
     */
    md_scope: string;
    /**
     * URI reference to the metadata structure definition authority
     * @member {string}
     */
    md_standard_uri: string;
    /**
     * MIME encoding of metadata
     * @member {string}
     */
    mime_type: string;
    /**
     * metadata
     * @member {string}
     */
    metadata: string;
    getScopeInformation(type: string): {
        name: string;
        code: string;
        definition: string;
    };
}
