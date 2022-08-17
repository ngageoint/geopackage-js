/**
 * Metadata Scope type enumeration from spec Table 15
 */
export enum MetadataScopeType {
  /**
   * Metadata information scope is undefined
   */
  UNDEFINED = 'undefined',

  /**
   * Information applies to the field session
   */
  FIELD_SESSION = 'fieldSession',

  /**
   * Information applies to the collection session
   */
  COLLECTION_SESSION = 'collectionSession',

  /**
   * Information applies to the (dataset) series
   */
  SERIES = 'series',

  /**
   * Information applies to the (geographic feature) dataset
   */
  DATASET = 'dataset',

  /**
   * Information applies to a feature type (class)
   */
  FEATURE_TYPE = 'featureType',

  /**
   * Information applies to a feature (instance)
   */
  FEATURE = 'feature',

  /**
   * Information applies to the attribute class
   */
  ATTRIBUTE_TYPE = 'attributeType',

  /**
   * Information applies to the characteristic of a feature (instance)
   */
  ATTRIBUTE = 'attribute',

  /**
   * Information applies to a tile, a spatial subset of geographic data
   */
  TILE = 'tile',

  /**
   * Information applies to a copy or imitation of an existing or hypothetical
   * object
   */
  MODEL = 'model',

  /**
   * Metadata applies to a feature catalog
   */
  CATALOG = 'catalog',

  /**
   * Metadata applies to an application schema
   */
  SCHEMA = 'schema',

  /**
   * Metadata applies to a taxonomy or knowledge system
   */
  TAXONOMY = 'taxonomy',

  /**
   * Information applies to a computer program or routine
   */
  SOFTWARE = 'software',

  /**
   * Information applies to a capability which a service provider entity makes
   * available to a service user entity through a set of interfaces that
   * define a behavior, such as a use case
   */
  SERVICE = 'service',
  /**
   * Information applies to the collection hardware class
   */
  COLLECTION_HARDWARE = 'collectionHardware',

  /**
   * Information applies to non-geographic data
   */
  NON_GEOGRAPHIC_DATASET = 'nonGeographicDataset',

  /**
   * Information applies to a dimension group
   */
  DIMENSION_GROUP = 'dimensionGroup',

  /**
   * Information applies to a specific style
   */
  STYLE = 'style',
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace MetadataScopeType {
  /**
   * Get MetadataScopeType from type string
   * @param type
   */
  export function fromName(type: string): MetadataScopeType {
    return MetadataScopeType[type as keyof typeof MetadataScopeType] as MetadataScopeType;
  }

  /**
   * Get the name
   *
   * @return name
   */
  export function getName(metadataScopeType: MetadataScopeType): string {
    return this.getScopeInformation(metadataScopeType).name;
  }

  /**
   * Get the code
   *
   * @return code
   */
  export function getCode(metadataScopeType: MetadataScopeType): string {
    return this.getScopeInformation(metadataScopeType).code;
  }

  /**
   * Get the definition
   *
   * @return definition
   */
  export function getDefinition(metadataScopeType: MetadataScopeType): string {
    return this.getScopeInformation(metadataScopeType).definition;
  }

  // eslint-disable-next-line complexity
  export function getScopeInformation(type: string): { name: string; code: string; definition: string } {
    switch (type) {
      case MetadataScopeType.UNDEFINED:
        return {
          name: MetadataScopeType.UNDEFINED,
          code: 'NA',
          definition: 'Metadata information scope is undefined',
        };
      case MetadataScopeType.FIELD_SESSION:
        return {
          name: MetadataScopeType.FIELD_SESSION,
          code: '012',
          definition: 'Information applies to the field session',
        };
      case MetadataScopeType.COLLECTION_SESSION:
        return {
          name: MetadataScopeType.COLLECTION_SESSION,
          code: '004',
          definition: 'Information applies to the collection session',
        };
      case MetadataScopeType.SERIES:
        return {
          name: MetadataScopeType.SERIES,
          code: '006',
          definition: 'Information applies to the (dataset) series',
        };
      case MetadataScopeType.DATASET:
        return {
          name: MetadataScopeType.DATASET,
          code: '005',
          definition: 'Information applies to the (geographic feature) dataset',
        };
      case MetadataScopeType.FEATURE_TYPE:
        return {
          name: MetadataScopeType.FEATURE_TYPE,
          code: '010',
          definition: 'Information applies to a feature type (class)',
        };
      case MetadataScopeType.FEATURE:
        return {
          name: MetadataScopeType.FEATURE,
          code: '009',
          definition: 'Information applies to a feature (instance)',
        };
      case MetadataScopeType.ATTRIBUTE_TYPE:
        return {
          name: MetadataScopeType.ATTRIBUTE_TYPE,
          code: '002',
          definition: 'Information applies to the attribute class',
        };
      case MetadataScopeType.ATTRIBUTE:
        return {
          name: MetadataScopeType.ATTRIBUTE,
          code: '001',
          definition: 'Information applies to the characteristic of a feature (instance)',
        };
      case MetadataScopeType.TILE:
        return {
          name: MetadataScopeType.TILE,
          code: '016',
          definition: 'Information applies to a tile, a spatial subset of geographic data',
        };
      case MetadataScopeType.MODEL:
        return {
          name: MetadataScopeType.MODEL,
          code: '015',
          definition: 'Information applies to a copy or imitation of an existing or hypothetical object',
        };
      case MetadataScopeType.CATALOG:
        return {
          name: MetadataScopeType.CATALOG,
          code: 'NA',
          definition: 'Metadata applies to a feature catalog',
        };
      case MetadataScopeType.SCHEMA:
        return {
          name: MetadataScopeType.SCHEMA,
          code: 'NA',
          definition: 'Metadata applies to an application schema',
        };
      case MetadataScopeType.TAXONOMY:
        return {
          name: MetadataScopeType.TAXONOMY,
          code: 'NA',
          definition: 'Metadata applies to a taxonomy or knowledge system',
        };
      case MetadataScopeType.SOFTWARE:
        return {
          name: MetadataScopeType.SOFTWARE,
          code: '013',
          definition: 'Information applies to a computer program or routine',
        };
      case MetadataScopeType.SERVICE:
        return {
          name: MetadataScopeType.SERVICE,
          code: '014',
          definition:
            'Information applies to a capability which a service provider entity makes available to a service user entity through a set of interfaces that define a behaviour, such as a use case',
        };
      case MetadataScopeType.COLLECTION_HARDWARE:
        return {
          name: MetadataScopeType.COLLECTION_HARDWARE,
          code: '003',
          definition: 'Information applies to the collection hardware class',
        };
      case MetadataScopeType.NON_GEOGRAPHIC_DATASET:
        return {
          name: MetadataScopeType.NON_GEOGRAPHIC_DATASET,
          code: '007',
          definition: 'Information applies to non-geographic data',
        };
      case MetadataScopeType.DIMENSION_GROUP:
        return {
          name: MetadataScopeType.DIMENSION_GROUP,
          code: '008',
          definition: 'Information applies to a dimension group',
        };
    }
  }
}
