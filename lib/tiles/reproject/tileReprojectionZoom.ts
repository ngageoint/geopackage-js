/**
 * Optional Tile Reprojection configuration for a zoom level
 */
export class TileReprojectionZoom {
  /**
   * Zoom level
   */
  private zoom: number;

  /**
   * Reprojected new zoom level
   */
  private toZoom: number;

  /**
   * Number of columns at the zoom level
   */
  private matrixWidth: number;

  /**
   * Number of rows at the zoom level
   */
  private matrixHeight: number;

  /**
   * Tile width in pixels
   */
  private tileWidth: number;

  /**
   * Tile height in pixels
   */
  private tileHeight: number;

  /**
   * Constructor
   *
   * @param zoom
   *            zoom level
   */
  public constructor(zoom: number) {
    this.zoom = zoom;
  }

  /**
   * Get the zoom level
   *
   * @return zoom level
   */
  public getZoom(): number {
    return this.zoom;
  }

  /**
   * Get the reprojected new zoom level
   *
   * @return to zoom
   */
  public getToZoom(): number {
    return this.toZoom;
  }

  /**
   * Has to zoom level value
   *
   * @return true if has value
   */
  public hasToZoom(): boolean {
    return this.toZoom != null;
  }

  /**
   * Set the reprojected new zoom level
   *
   * @param toZoom
   *            to zoom
   */
  public setToZoom(toZoom: number): void {
    this.toZoom = toZoom;
  }

  /**
   * Get the matrix width
   *
   * @return matrix width
   */
  public getMatrixWidth(): number {
    return this.matrixWidth;
  }

  /**
   * Has matrix width value
   *
   * @return true if has value
   */
  public hasMatrixWidth(): boolean {
    return this.matrixWidth != null;
  }

  /**
   * Set the matrix width
   *
   * @param matrixWidth
   *            matrix width
   */
  public setMatrixWidth(matrixWidth: number): void {
    this.matrixWidth = matrixWidth;
  }

  /**
   * Get the matrix height
   *
   * @return matrix height
   */
  public getMatrixHeight(): number {
    return this.matrixHeight;
  }

  /**
   * Has matrix height value
   *
   * @return true if has value
   */
  public hasMatrixHeight(): boolean {
    return this.matrixHeight != null;
  }

  /**
   * Set the matrix height
   *
   * @param matrixHeight
   *            matrix height
   */
  public setMatrixHeight(matrixHeight: number): void {
    this.matrixHeight = matrixHeight;
  }

  /**
   * Get the tile width
   *
   * @return tile width
   */
  public getTileWidth(): number {
    return this.tileWidth;
  }

  /**
   * Has tile width value
   *
   * @return true if has value
   */
  public hasTileWidth(): boolean {
    return this.tileWidth != null;
  }

  /**
   * Set the tile width
   *
   * @param tileWidth
   *            tile width
   */
  public setTileWidth(tileWidth: number): void {
    this.tileWidth = tileWidth;
  }

  /**
   * Get the tile height
   *
   * @return tile height
   */
  public getTileHeight(): number {
    return this.tileHeight;
  }

  /**
   * Has tile height value
   *
   * @return true if has value
   */
  public hasTileHeight(): boolean {
    return this.tileHeight != null;
  }

  /**
   * Set the tile height
   *
   * @param tileHeight
   *            tile height
   */
  public setTileHeight(tileHeight: number): void {
    this.tileHeight = tileHeight;
  }
}
