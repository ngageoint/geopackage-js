/**
 * Tile Format Type specifying the z/x/y folder structure of tiles
 */
export enum TileFormatType {
  /**
   * x and y coordinates created using tile matrix width and height
   */
  GEOPACKAGE,

  /**
   * origin is upper left
   *
   */
  XYZ,

  /**
   * Tile Map Service specification, origin is lower left
   */
  TMS,
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace TileFormatType {
  export function nameFromType(type: TileFormatType): string {
    return TileFormatType[type];
  }
  export function fromName(type: string): TileFormatType {
    switch (type) {
      case 'GEOPACKAGE':
        return TileFormatType.GEOPACKAGE;
      case 'XYZ':
        return TileFormatType.XYZ;
      case 'TMS':
        return TileFormatType.TMS;
    }
  }
}
