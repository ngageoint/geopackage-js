import sortedIndexOf from 'lodash/sortedIndexOf';
import sortedIndex from 'lodash/sortedIndex';
import { TileMatrix } from '../matrix/tileMatrix';
import { TileMatrixSet } from '../matrixset/tileMatrixSet';
import { ProjectionConstants, Projections } from '@ngageoint/projections-js';

export class TileDaoUtils {
  /**
   * Adjust the tile matrix lengths if needed. Check if the tile matrix width
   * and height need to expand to account for pixel * number of pixels fitting
   * into the tile matrix lengths
   * @param tileMatrixSet tile matrix set
   * @param tileMatrices tile matrices
   */
  public static adjustTileMatrixLengths(tileMatrixSet: TileMatrixSet, tileMatrices: TileMatrix[]): void {
    const tileMatrixWidth = tileMatrixSet.getMaxX() - tileMatrixSet.getMinX();
    const tileMatrixHeight = tileMatrixSet.getMaxY() - tileMatrixSet.getMinY();
    tileMatrices.forEach(tileMatrix => {
      const tempMatrixWidth = Math.floor(tileMatrixWidth / (tileMatrix.getPixelXSize() * tileMatrix.getTileWidth()));
      const tempMatrixHeight = Math.floor(tileMatrixHeight / (tileMatrix.getPixelYSize() * tileMatrix.getTileHeight()));
      if (tempMatrixWidth > tileMatrix.getMatrixWidth()) {
        tileMatrix.setMatrixWidth(tempMatrixWidth);
      }
      if (tempMatrixHeight > tileMatrix.getMatrixHeight()) {
        tileMatrix.setMatrixHeight(tempMatrixHeight);
      }
    });
  }

  /**
   * Get the zoom level for the provided width and height in the default units
   * @param widths sorted widths
   * @param heights sorted heights
   * @param tileMatrices tile matrices
   * @param length in default units
   * @return tile matrix zoom level
   */
  public static getZoomLevelForLength(
    widths: number[],
    heights: number[],
    tileMatrices: TileMatrix[],
    length: number,
  ): number {
    return TileDaoUtils._getZoomLevelForLength(widths, heights, tileMatrices, length, true);
  }

  /**
   * Get the zoom level for the provided width and height in the default units
   * @param widths sorted widths
   * @param heights sorted heights
   * @param tileMatrices tile matrices
   * @param width in default units
   * @param height in default units
   * @return tile matrix zoom level
   */
  public static getZoomLevelForWidthAndHeight(
    widths: number[],
    heights: number[],
    tileMatrices: TileMatrix[],
    width: number,
    height: number,
  ): number {
    return TileDaoUtils._getZoomLevelForWidthAndHeight(widths, heights, tileMatrices, width, height, true);
  }

  /**
   * Get the closest zoom level for the provided width and height in the
   * default units
   * @param widths sorted widths
   * @param heights sorted heights
   * @param tileMatrices tile matrices
   * @param length in default units
   * @return tile matrix zoom level
   */
  public static getClosestZoomLevelForLength(
    widths: number[],
    heights: number[],
    tileMatrices: TileMatrix[],
    length: number,
  ): number {
    return TileDaoUtils._getZoomLevelForLength(widths, heights, tileMatrices, length, false);
  }

  /**
   * Get the closest zoom level for the provided width and height in the
   * default units
   * @param widths sorted widths
   * @param heights sorted heights
   * @param tileMatrices tile matrices
   * @param width in default units
   * @param height in default units
   * @return tile matrix zoom level
   */
  public static getClosestZoomLevelForWidthAndHeight(
    widths: number[],
    heights: number[],
    tileMatrices: TileMatrix[],
    width: number,
    height: number,
  ): number {
    return TileDaoUtils._getZoomLevelForWidthAndHeight(widths, heights, tileMatrices, width, height, false);
  }

  /**
   * Get the zoom level for the provided width and height in the default units
   * @param widths sorted widths
   * @param heights sorted heights
   * @param tileMatrices tile matrices
   * @param length in default units
   * @param lengthChecks perform length checks for values too far away from the zoom level
   * @return tile matrix zoom level
   */
  private static _getZoomLevelForLength(
    widths: number[],
    heights: number[],
    tileMatrices: TileMatrix[],
    length: number,
    lengthChecks: boolean,
  ): number {
    return TileDaoUtils._getZoomLevelForWidthAndHeight(widths, heights, tileMatrices, length, length, lengthChecks);
  }

  /**
   * Get the zoom level for the provided width and height in the default units
   * @param widths sorted widths
   * @param heights sorted heights
   * @param tileMatrices tile matrices
   * @param width width in default units
   * @param height height in default units
   * @param lengthChecks perform length checks for values too far away from the zoom level
   * @return tile matrix zoom level
   */
  private static _getZoomLevelForWidthAndHeight(
    widths: number[],
    heights: number[],
    tileMatrices: TileMatrix[],
    width: number,
    height: number,
    lengthChecks: boolean,
  ): number {
    let zoomLevel = null;
    let widthIndex = sortedIndexOf(widths, width);
    if (widthIndex === -1) {
      widthIndex = sortedIndex(widths, width);
    }
    if (widthIndex < 0) {
      widthIndex = (widthIndex + 1) * -1;
    }

    let heightIndex = sortedIndexOf(heights, height);
    if (heightIndex === -1) {
      heightIndex = sortedIndex(heights, height);
    }

    if (heightIndex < 0) {
      heightIndex = (heightIndex + 1) * -1;
    }

    if (widthIndex == 0) {
      if (lengthChecks && width < TileDaoUtils.getMinLength(widths)) {
        widthIndex = -1;
      }
    } else if (widthIndex == widths.length) {
      if (lengthChecks && width >= TileDaoUtils.getMaxLength(widths)) {
        widthIndex = -1;
      } else {
        --widthIndex;
      }
    } else if (TileDaoUtils.closerToZoomIn(widths, width, widthIndex)) {
      --widthIndex;
    }

    if (heightIndex == 0) {
      if (lengthChecks && height < TileDaoUtils.getMinLength(heights)) {
        heightIndex = -1;
      }
    } else if (heightIndex == heights.length) {
      if (lengthChecks && height >= TileDaoUtils.getMaxLength(heights)) {
        heightIndex = -1;
      } else {
        --heightIndex;
      }
    } else if (TileDaoUtils.closerToZoomIn(heights, height, heightIndex)) {
      --heightIndex;
    }

    if (widthIndex >= 0 || heightIndex >= 0) {
      let index;
      if (widthIndex < 0) {
        index = heightIndex;
      } else if (heightIndex < 0) {
        index = widthIndex;
      } else {
        index = Math.min(widthIndex, heightIndex);
      }
      zoomLevel = TileDaoUtils.getTileMatrixAtLengthIndex(tileMatrices, index).getZoomLevel();
    }
    return zoomLevel;
  }

  /**
   * Determine if the length at the index is closer by a factor of two to the
   * next zoomed in level / lower index
   * @param lengths sorted lengths
   * @param length current length
   * @param lengthIndex length index
   * @return true if closer to zoomed in length
   */
  private static closerToZoomIn(lengths: number[], length: number, lengthIndex: number): boolean {
    // Zoom level distance to the zoomed in length
    const zoomInDistance = Math.log(length / lengths[lengthIndex - 1]) / Math.log(2);
    // Zoom level distance to the zoomed out length
    const zoomOutDistance = Math.log(length / lengths[lengthIndex]) / Math.log(0.5);
    return zoomInDistance < zoomOutDistance;
  }

  /**
   * Get the tile matrix represented by the current length index
   * @param tileMatrices tile matrices
   * @param index index location in sorted lengths
   * @return tile matrix
   */
  static getTileMatrixAtLengthIndex(tileMatrices: TileMatrix[], index: number): TileMatrix {
    return tileMatrices[tileMatrices.length - index - 1];
  }

  /**
   * Get the approximate zoom level for the provided length in the default
   * units. Tiles may or may not exist for the returned zoom level. The
   * approximate zoom level is determined using a factor of 2 from the zoom
   * levels with tiles.
   *
   * @param widths sorted widths
   * @param heights sorted heights
   * @param tileMatrices tile matrices
   * @param length length in default units
   * @return actual or approximate tile matrix zoom level
   */
  static getApproximateZoomLevelForLength(
    widths: number[],
    heights: number[],
    tileMatrices: TileMatrix[],
    length: number,
  ): number {
    return TileDaoUtils.getApproximateZoomLevelForWidthAndHeight(widths, heights, tileMatrices, length, length);
  }

  /**
   * Get the approximate zoom level for the provided width and height in the
   * default units. Tiles may or may not exist for the returned zoom level.
   * The approximate zoom level is determined using a factor of 2 from the
   * zoom levels with tiles.
   *
   * @param widths sorted widths
   * @param heights sorted heights
   * @param tileMatrices tile matrices
   * @param width width in default units
   * @param height height in default units
   * @return actual or approximate tile matrix zoom level
   */
  static getApproximateZoomLevelForWidthAndHeight(
    widths: number[],
    heights: number[],
    tileMatrices: TileMatrix[],
    width: number,
    height: number,
  ): number {
    const widthZoomLevel = TileDaoUtils.getApproximateZoomLevel(widths, tileMatrices, width);
    const heightZoomLevel = TileDaoUtils.getApproximateZoomLevel(heights, tileMatrices, height);

    let expectedZoomLevel;
    if (widthZoomLevel == null) {
      expectedZoomLevel = heightZoomLevel;
    } else if (heightZoomLevel == null) {
      expectedZoomLevel = widthZoomLevel;
    } else {
      expectedZoomLevel = Math.max(widthZoomLevel, heightZoomLevel);
    }

    return expectedZoomLevel;
  }

  /**
   * Get the approximate zoom level for length using the factor of 2 rule
   * between zoom levels
   * @param lengths sorted lengths
   * @param tileMatrices tile matrices
   * @param length length in default units
   * @return approximate zoom level
   */
  static getApproximateZoomLevel(lengths: number[], tileMatrices: TileMatrix[], length: number): number {
    let lengthZoomLevel;

    const minLength = lengths[0];
    const maxLength = lengths[lengths.length - 1];

    // Length is zoomed in further than available tiles
    if (length < minLength) {
      const levelsIn = Math.log(length / minLength) / Math.log(0.5);
      const zoomAbove = Math.floor(levelsIn);
      const zoomBelow = Math.ceil(levelsIn);
      const lengthAbove = minLength * Math.pow(0.5, zoomAbove);
      const lengthBelow = minLength * Math.pow(0.5, zoomBelow);
      lengthZoomLevel = tileMatrices[tileMatrices.length - 1].getZoomLevel();
      if (lengthAbove - length <= length - lengthBelow) {
        lengthZoomLevel += zoomAbove;
      } else {
        lengthZoomLevel += zoomBelow;
      }
    }
    // Length is zoomed out further than available tiles
    else if (length > maxLength) {
      const levelsOut = Math.log(length / maxLength) / Math.log(2);
      const zoomAbove = Math.ceil(levelsOut);
      const zoomBelow = Math.floor(levelsOut);
      const lengthAbove = maxLength * Math.pow(2, zoomAbove);
      const lengthBelow = maxLength * Math.pow(2, zoomBelow);
      lengthZoomLevel = tileMatrices[0].getZoomLevel();
      if (length - lengthBelow <= lengthAbove - length) {
        lengthZoomLevel -= zoomBelow;
      } else {
        lengthZoomLevel -= zoomAbove;
      }
    }
    // Length is between the available tiles
    else {
      let lengthIndex = sortedIndexOf(lengths, length);
      if (lengthIndex < 0) {
        lengthIndex = (lengthIndex + 1) * -1;
      }
      const zoomDistance = Math.log(length / lengths[lengthIndex]) / Math.log(0.5);
      let zoomLevelAbove = TileDaoUtils.getTileMatrixAtLengthIndex(tileMatrices, lengthIndex).getZoomLevel();
      zoomLevelAbove += Math.round(zoomDistance);
      lengthZoomLevel = zoomLevelAbove;
    }

    return lengthZoomLevel;
  }

  /**
   * Get the max distance length that matches the tile widths and heights
   * @param widths sorted tile matrix widths
   * @param heights sorted tile matrix heights
   * @return max length
   */
  static getMaxLengthForTileWidthsAndHeights(widths: number[], heights: number[]): number {
    const maxWidth = TileDaoUtils.getMaxLength(widths);
    const maxHeight = TileDaoUtils.getMaxLength(heights);
    return Math.min(maxWidth, maxHeight);
  }
  /**
   * Get the min distance length that matches the tile widths and heights
   * @param widths sorted tile matrix widths
   * @param heights sorted tile matrix heights
   * @return min length
   */
  static getMinLengthForTileWidthsAndHeights(widths: number[], heights: number[]): number {
    const maxWidth = TileDaoUtils.getMinLength(widths);
    const maxHeight = TileDaoUtils.getMinLength(heights);
    return Math.max(maxWidth, maxHeight);
  }
  /**
   * Get the max length distance value from the sorted array of lengths
   * @param lengths sorted tile matrix lengths
   * @return max length
   */
  static getMaxLength(lengths: number[]): number {
    return lengths[lengths.length - 1] / 0.51;
  }
  /**
   * Get the min length distance value from the sorted array of lengths
   * @param lengths sorted tile matrix lengths
   * @return min length
   */
  static getMinLength(lengths: number[]): number {
    return lengths[0] * 0.51;
  }

  /**
   * Get the map zoom level range
   * @param tileMatrixSet tile matrix set
   * @param tileMatrices tile matrices
   * @return map zoom level range, min at index 0, max at index 1
   */
  public static getMapZoomRange(tileMatrixSet: TileMatrixSet, tileMatrices: TileMatrix[]): number[] {
    const min = TileDaoUtils.getMapMinZoom(tileMatrixSet, tileMatrices);
    const max = TileDaoUtils.getMapMaxZoom(tileMatrixSet, tileMatrices);
    return [min, max];
  }

  /**
   * Get the map min zoom level
   * @param tileMatrixSet tile matrix set
   * @param tileMatrices tile matrices
   * @return map min zoom level
   */
  public static getMapMinZoom(tileMatrixSet: TileMatrixSet, tileMatrices: TileMatrix[]): number {
    return TileDaoUtils.getMapZoomWithTileMatrixSetAndTileMatrix(tileMatrixSet, tileMatrices[0]);
  }

  /**
   * Get the map max zoom level
   * @param tileMatrixSet tile matrix set
   * @param tileMatrices tile matrices
   * @return map max zoom level
   */
  public static getMapMaxZoom(tileMatrixSet: TileMatrixSet, tileMatrices: TileMatrix[]): number {
    return TileDaoUtils.getMapZoomWithTileMatrixSetAndTileMatrix(tileMatrixSet, tileMatrices[tileMatrices.length - 1]);
  }

  /**
   * Get the map zoom level
   * @param tileMatrixSet tile matrix set
   * @param tileMatrix tile matrix
   * @return map zoom level
   */
  public static getMapZoomWithTileMatrixSetAndTileMatrix(tileMatrixSet: TileMatrixSet, tileMatrix: TileMatrix): number {
    const boundingBox = tileMatrixSet.getBoundingBoxWithProjection(Projections.getWebMercatorProjection());
    let zoom = TileDaoUtils.getMapZoom(
      boundingBox.getMinLongitude(),
      boundingBox.getMaxLongitude(),
      tileMatrix.getMatrixWidth(),
    );
    if (Projections.getUnits(tileMatrixSet.getProjection().toString()) !== 'degrees') {
      zoom = Math.min(
        zoom,
        TileDaoUtils.getMapZoom(
          boundingBox.getMinLatitude(),
          boundingBox.getMaxLatitude(),
          tileMatrix.getMatrixHeight(),
        ),
      );
    }
    return zoom;
  }

  /**
   * Get the map zoom level
   * @param min min bounds
   * @param max max bounds
   * @param matrixLength matrix length
   * @return zoom level
   */
  private static getMapZoom(min: number, max: number, matrixLength: number): number {
    return Math.round(
      Math.log((2 * ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH) / ((max - min) / matrixLength)) / Math.log(2),
    );
  }
}
