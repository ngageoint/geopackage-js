export enum GeometryType {
  GEOMETRY,
  POINT,
  LINESTRING,
  POLYGON,
  MULTIPOINT,
  MULTILINESTRING,
  MULTIPOLYGON,
  GEOMETRYCOLLECTION,
  CIRCULARSTRING,
  COMPOUNDCURVE,
  CURVEPOLYGON,
  MULTICURVE,
  MULTISURFACE,
  CURVE,
  SURFACE,
  POLYHEDRALSURFACE,
  TIN,
  TRIANGLE
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace GeometryType {
  export function nameFromType(type: GeometryType): string {
    return GeometryType[type];
  }

  export function fromName(type: string): GeometryType {
    return GeometryType[type as keyof typeof GeometryType] as GeometryType;
  }
}
