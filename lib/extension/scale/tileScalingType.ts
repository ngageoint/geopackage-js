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
   * Search for tiles in closest zoom level order, zoom in levels before zoom
   * out
   */
  CLOSEST_IN_OUT = 'closest_in_out',

  /**
   * Search for tiles in closest zoom level order, zoom out levels before zoom
   * in
   */
  CLOSEST_OUT_IN = 'closest_out_in'
}
