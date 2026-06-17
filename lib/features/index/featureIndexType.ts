/**
 * Feature Index type enumeration of index location
 */
export enum FeatureIndexType {
  /**
   * GeoPackage extension tables
   */
  GEOPACKAGE,

  /**
   * RTree Index extension
   */
  RTREE,

  /**
   * No index
   */
  NONE,
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace FeatureIndexType {
  export function nameFromType(type: FeatureIndexType): string {
    return FeatureIndexType[type];
  }

  export function fromName(type: string): FeatureIndexType {
    return FeatureIndexType[type as keyof typeof FeatureIndexType] as FeatureIndexType;
  }
}
