/**
 * Contains metadata in MIME encodings structured in accordance with any
 * authoritative metadata specification
 * @class Metadata
 */
export class Metadata {
  public static readonly UNDEFINED: string = 'undefined';
  public static readonly FIELD_SESSION: string = 'fieldSession';
  public static readonly COLLECTION_SESSION: string = 'collectionSession';
  public static readonly SERIES: string = 'series';
  public static readonly DATASET: string = 'dataset';
  public static readonly FEATURE_TYPE: string = 'featureType';
  public static readonly FEATURE: string = 'feature';
  public static readonly ATTRIBUTE_TYPE: string = 'attributeType';
  public static readonly ATTRIBUTE: string = 'attribute';
  public static readonly TILE: string = 'tile';
  public static readonly MODEL: string = 'model';
  public static readonly CATALOG: string = 'catalog';
  public static readonly SCHEMA: string = 'schema';
  public static readonly TAXONOMY: string = 'taxonomy';
  public static readonly SOFTWARE: string = 'software';
  public static readonly SERVICE: string = 'service';
  public static readonly COLLECTION_HARDWARE: string = 'collectionHardware';
  public static readonly NON_GEOGRAPHIC_DATASET: string = 'nonGeographicDataset';
  public static readonly DIMENSION_GROUP: string = 'dimensionGroup';

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

  // eslint-disable-next-line complexity
  getScopeInformation(type: string): { name: string; code: string; definition: string } {
    switch (type) {
      case Metadata.UNDEFINED:
        return {
          name: Metadata.UNDEFINED,
          code: 'NA',
          definition: 'Metadata information scope is undefined',
        };
      case Metadata.FIELD_SESSION:
        return {
          name: Metadata.FIELD_SESSION,
          code: '012',
          definition: 'Information applies to the field session',
        };
      case Metadata.COLLECTION_SESSION:
        return {
          name: Metadata.COLLECTION_SESSION,
          code: '004',
          definition: 'Information applies to the collection session',
        };
      case Metadata.SERIES:
        return {
          name: Metadata.SERIES,
          code: '006',
          definition: 'Information applies to the (dataset) series',
        };
      case Metadata.DATASET:
        return {
          name: Metadata.DATASET,
          code: '005',
          definition: 'Information applies to the (geographic feature) dataset',
        };
      case Metadata.FEATURE_TYPE:
        return {
          name: Metadata.FEATURE_TYPE,
          code: '010',
          definition: 'Information applies to a feature type (class)',
        };
      case Metadata.FEATURE:
        return {
          name: Metadata.FEATURE,
          code: '009',
          definition: 'Information applies to a feature (instance)',
        };
      case Metadata.ATTRIBUTE_TYPE:
        return {
          name: Metadata.ATTRIBUTE_TYPE,
          code: '002',
          definition: 'Information applies to the attribute class',
        };
      case Metadata.ATTRIBUTE:
        return {
          name: Metadata.ATTRIBUTE,
          code: '001',
          definition: 'Information applies to the characteristic of a feature (instance)',
        };
      case Metadata.TILE:
        return {
          name: Metadata.TILE,
          code: '016',
          definition: 'Information applies to a tile, a spatial subset of geographic data',
        };
      case Metadata.MODEL:
        return {
          name: Metadata.MODEL,
          code: '015',
          definition: 'Information applies to a copy or imitation of an existing or hypothetical object',
        };
      case Metadata.CATALOG:
        return {
          name: Metadata.CATALOG,
          code: 'NA',
          definition: 'Metadata applies to a feature catalog',
        };
      case Metadata.SCHEMA:
        return {
          name: Metadata.SCHEMA,
          code: 'NA',
          definition: 'Metadata applies to an application schema',
        };
      case Metadata.TAXONOMY:
        return {
          name: Metadata.TAXONOMY,
          code: 'NA',
          definition: 'Metadata applies to a taxonomy or knowledge system',
        };
      case Metadata.SOFTWARE:
        return {
          name: Metadata.SOFTWARE,
          code: '013',
          definition: 'Information applies to a computer program or routine',
        };
      case Metadata.SERVICE:
        return {
          name: Metadata.SERVICE,
          code: '014',
          definition:
            'Information applies to a capability which a service provider entity makes available to a service user entity through a set of interfaces that define a behaviour, such as a use case',
        };
      case Metadata.COLLECTION_HARDWARE:
        return {
          name: Metadata.COLLECTION_HARDWARE,
          code: '003',
          definition: 'Information applies to the collection hardware class',
        };
      case Metadata.NON_GEOGRAPHIC_DATASET:
        return {
          name: Metadata.NON_GEOGRAPHIC_DATASET,
          code: '007',
          definition: 'Information applies to non-geographic data',
        };
      case Metadata.DIMENSION_GROUP:
        return {
          name: Metadata.DIMENSION_GROUP,
          code: '008',
          definition: 'Information applies to a dimension group',
        };
    }
  }
}
