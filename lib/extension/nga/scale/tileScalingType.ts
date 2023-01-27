export enum TileScalingType {
  /**
   * Search for tiles by zooming in
   */
  IN = 'in',

  /**
   * Search for tiles by zooming out
   */
  OUT = 'out',

  /**
   * Search for tiles by zooming in first, and then zooming out
   */
  IN_OUT = 'in_out',

  /**
   * Search for tiles by zooming out first, and then zooming in
   */
  OUT_IN = 'out_in',

  /**
   * Search for tiles in the closest zoom level order, zoom in levels before zoom
   * out
   */
  CLOSEST_IN_OUT = 'closest_in_out',

  /**
   * Search for tiles in the closest zoom level order, zoom out levels before zoom
   * in
   */
  CLOSEST_OUT_IN = 'closest_out_in',
}
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace TileScalingType {
  export function nameFromType(type: TileScalingType): string {
    return type.toLowerCase();
  }

  export function fromName(type: string): TileScalingType {
    switch (type.toLowerCase()) {
      case 'in':
        return TileScalingType.IN;
      case 'out':
        return TileScalingType.OUT;
      case 'in_out':
        return TileScalingType.IN_OUT;
      case 'out_in':
        return TileScalingType.OUT_IN;
      case 'closest_in_out':
        return TileScalingType.CLOSEST_IN_OUT;
      case 'closest_out_in':
        return TileScalingType.CLOSEST_OUT_IN;
    }
    return null;
  }
}
