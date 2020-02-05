import { TileGrid } from './tileGrid';
import { BoundingBox } from '../boundingBox';
import proj4 from 'proj4';
import { TileMatrix } from './matrix/tileMatrix';

/**
 * This module exports utility functions for [slippy map (XYZ)](https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames)
 * tile calculations.
 *
 * @module tiles/tileBoundingBoxUtils
 */

export class TileBoundingBoxUtils {
  public static readonly WEB_MERCATOR_HALF_WORLD_WIDTH = proj4('EPSG:4326', 'EPSG:3857').forward([180, 0])[0];
  public static webMercatorProjection = proj4('EPSG:3857');
  /**
   * Calculate the bounds in tile coordinates that covers the given bounding box
   * at the given zoom level.  The result object contains the keys `minX`, `maxX`,
   * `minY`, and `maxY`, which are tile column and row values in the XYZ tile
   * scheme.
   *
   * @param {BoundingBox} webMercatorBoundingBox bounds in EPSG:3857 coordinates (meters)
   * @param {number} zoom the integral zoom level
   * @returns {{minX: number, maxX: number, minY: number, maxY: number}} bounds in tile column and row coordinates
   */
  static webMercatorTileBox(webMercatorBoundingBox: BoundingBox, zoom: number): BoundingBox {
    const tilesPerSide = TileBoundingBoxUtils.tilesPerSideWithZoom(zoom);
    const tileSize = TileBoundingBoxUtils.tileSizeWithTilesPerSide(tilesPerSide);

    const minLonClip = Math.max(
      -TileBoundingBoxUtils.WEB_MERCATOR_HALF_WORLD_WIDTH,
      webMercatorBoundingBox.minLongitude,
    );
    const maxLonClip = Math.min(
      TileBoundingBoxUtils.WEB_MERCATOR_HALF_WORLD_WIDTH,
      webMercatorBoundingBox.maxLongitude,
    );
    const minLatClip = Math.max(
      -TileBoundingBoxUtils.WEB_MERCATOR_HALF_WORLD_WIDTH,
      webMercatorBoundingBox.minLatitude,
    );
    const maxLatClip = Math.min(TileBoundingBoxUtils.WEB_MERCATOR_HALF_WORLD_WIDTH, webMercatorBoundingBox.maxLatitude);

    const minX = Math.floor((minLonClip + TileBoundingBoxUtils.WEB_MERCATOR_HALF_WORLD_WIDTH) / tileSize);
    const maxX = Math.max(
      0,
      Math.ceil((maxLonClip + TileBoundingBoxUtils.WEB_MERCATOR_HALF_WORLD_WIDTH) / tileSize) - 1,
    );
    const minY = Math.floor((TileBoundingBoxUtils.WEB_MERCATOR_HALF_WORLD_WIDTH - maxLatClip) / tileSize);
    const maxY = Math.max(
      0,
      Math.ceil((TileBoundingBoxUtils.WEB_MERCATOR_HALF_WORLD_WIDTH - minLatClip) / tileSize) - 1,
    );
    return new BoundingBox(minX, maxX, minY, maxY);
  }

  static determinePositionAndScale(
    geoPackageTileBoundingBox: BoundingBox,
    tileHeight: number,
    tileWidth: number,
    totalBoundingBox: BoundingBox,
    totalHeight: number,
    totalWidth: number,
  ): {
    yPositionInFinalTileStart: number;
    xPositionInFinalTileStart: number;
    dx: number;
    dy: number;
    sx: number;
    sy: number;
    dWidth: number;
    dHeight: number;
    sWidth: number;
    sHeight: number;
  } {
    const p = {} as {
      yPositionInFinalTileStart: number;
      xPositionInFinalTileStart: number;
      dx: number;
      dy: number;
      sx: number;
      sy: number;
      dWidth: number;
      dHeight: number;
      sWidth: number;
      sHeight: number;
    };

    const finalTileWidth = totalBoundingBox.maxLongitude - totalBoundingBox.minLongitude;
    const xoffsetMin = geoPackageTileBoundingBox.minLongitude - totalBoundingBox.minLongitude;
    const xpercentageMin = xoffsetMin / finalTileWidth;

    const finalTileHeight = totalBoundingBox.maxLatitude - totalBoundingBox.minLatitude;
    const yoffsetMax = totalBoundingBox.maxLatitude - geoPackageTileBoundingBox.maxLatitude;
    const ypercentageMax = yoffsetMax / finalTileHeight;

    const finalTilePixelsPerUnitWidth = totalWidth / finalTileWidth;
    const widthInFinalTileUnits = Math.round(
      (geoPackageTileBoundingBox.maxLongitude - geoPackageTileBoundingBox.minLongitude) * finalTilePixelsPerUnitWidth,
    );
    const finalTilePixelsPerUnitHeight = totalHeight / finalTileHeight;
    const heightInFinalTileUnits = Math.round(
      (geoPackageTileBoundingBox.maxLatitude - geoPackageTileBoundingBox.minLatitude) * finalTilePixelsPerUnitHeight,
    );

    p.yPositionInFinalTileStart = Math.round(ypercentageMax * totalHeight);
    p.xPositionInFinalTileStart = Math.round(xpercentageMin * totalWidth);
    p.dx = p.xPositionInFinalTileStart;
    p.dy = p.yPositionInFinalTileStart;
    p.sx = 0;
    p.sy = 0;
    p.dWidth = widthInFinalTileUnits;
    p.dHeight = heightInFinalTileUnits;
    p.sWidth = tileWidth;
    p.sHeight = tileHeight;

    return p;
  }

  /**
   * Calculate the bounds in EPSG:3857 coordinates of the tile at the given XYZ
   * coordinates coordinates and zoom level.
   *
   *  @param {number} x tile column
   *  @param {number} y tile row
   *  @param {number} zoom zoom level
   *  @param {*} [options] options object
   *  @return {BoundingBox} a bounding box in EPSG:3857 meters
   */
  static getWebMercatorBoundingBoxFromXYZ(
    x: number,
    y: number,
    zoom: number,
    options?: { tileSize?: number; buffer?: number },
  ): BoundingBox {
    const tilesPerSide = TileBoundingBoxUtils.tilesPerSideWithZoom(zoom);
    const tileSize = TileBoundingBoxUtils.tileSizeWithTilesPerSide(tilesPerSide);

    let meterBuffer = 0;
    if (options && options.buffer && options.tileSize) {
      const pixelBuffer = options.buffer;
      const metersPerPixel = tileSize / options.tileSize;
      meterBuffer = metersPerPixel * pixelBuffer;
    }

    let minLon = -1 * TileBoundingBoxUtils.WEB_MERCATOR_HALF_WORLD_WIDTH + x * tileSize - meterBuffer;
    let maxLon = -1 * TileBoundingBoxUtils.WEB_MERCATOR_HALF_WORLD_WIDTH + (x + 1) * tileSize + meterBuffer;
    let minLat = TileBoundingBoxUtils.WEB_MERCATOR_HALF_WORLD_WIDTH - (y + 1) * tileSize - meterBuffer;
    let maxLat = TileBoundingBoxUtils.WEB_MERCATOR_HALF_WORLD_WIDTH - y * tileSize + meterBuffer;

    minLon = Math.max(-1 * TileBoundingBoxUtils.WEB_MERCATOR_HALF_WORLD_WIDTH, minLon);
    maxLon = Math.min(TileBoundingBoxUtils.WEB_MERCATOR_HALF_WORLD_WIDTH, maxLon);
    minLat = Math.max(-1 * TileBoundingBoxUtils.WEB_MERCATOR_HALF_WORLD_WIDTH, minLat);
    maxLat = Math.min(TileBoundingBoxUtils.WEB_MERCATOR_HALF_WORLD_WIDTH, maxLat);

    const box = new BoundingBox(minLon, maxLon, minLat, maxLat);

    return box;
  }

  /**
   *  Get the tile size in meters
   *
   *  @param tilesPerSide tiles per side
   *
   *  @return meters
   */
  static tileSizeWithTilesPerSide(tilesPerSide: number): number {
    return (2 * TileBoundingBoxUtils.WEB_MERCATOR_HALF_WORLD_WIDTH) / tilesPerSide;
  }

  /**
   *  Get the tiles per side, width and height, at the zoom level
   *
   *  @param zoom zoom level
   *
   *  @return tiles per side
   */
  static tilesPerSideWithZoom(zoom: number): number {
    return 1 << zoom;
  }

  /**
   *  Get the tile grid
   *  @param {BoundingBox} totalBoundingBox    web mercator total bounding box
   *  @param {Number} matrixWidth            matrix width
   *  @param {Number} matrixHeight           matrix height
   *  @param {BoundingBox} boundingBox            bounding box
   *
   *  @return tile grid
   */
  static getTileGridWithTotalBoundingBox(
    totalBoundingBox: BoundingBox,
    matrixWidth: number,
    matrixHeight: number,
    boundingBox: BoundingBox,
  ): TileGrid {
    let minColumn = TileBoundingBoxUtils.getTileColumnWithTotalBoundingBox(
      totalBoundingBox,
      matrixWidth,
      boundingBox.minLongitude,
    );
    let maxColumn = TileBoundingBoxUtils.getTileColumnWithTotalBoundingBox(
      totalBoundingBox,
      matrixWidth,
      boundingBox.maxLongitude,
      true,
    );
    if (minColumn < matrixWidth && maxColumn >= 0) {
      if (minColumn < 0) {
        minColumn = 0;
      }
      if (maxColumn >= matrixWidth) {
        maxColumn = matrixWidth - 1;
      }
    }

    let maxRow = TileBoundingBoxUtils.getRowWithTotalBoundingBox(
      totalBoundingBox,
      matrixHeight,
      boundingBox.minLatitude,
      true,
    );
    let minRow = TileBoundingBoxUtils.getRowWithTotalBoundingBox(
      totalBoundingBox,
      matrixHeight,
      boundingBox.maxLatitude,
    );

    if (minRow < matrixHeight && maxRow >= 0) {
      if (minRow < 0) {
        minRow = 0;
      }
      if (maxRow >= matrixHeight) {
        maxRow = matrixHeight - 1;
      }
    }

    return new TileGrid(minColumn, maxColumn, minRow, maxRow);
  }

  /**
   *  Get the tile column of the longitude in degrees
   *
   *  @param {BoundingBox} webMercatorTotalBox web mercator total bounding box
   *  @param {Number} matrixWidth         matrix width
   *  @param {Number} longitude           longitude
   *  @param {Boolean} [max]
   *
   *  @return tile column
   */
  static getTileColumnWithTotalBoundingBox(
    webMercatorTotalBox: BoundingBox,
    matrixWidth: number,
    longitude: number,
    max?: boolean,
  ): number {
    const minX = webMercatorTotalBox.minLongitude;
    const maxX = webMercatorTotalBox.maxLongitude;
    let tileId;
    if (longitude < minX) {
      tileId = -1;
    } else if (longitude >= maxX) {
      tileId = matrixWidth;
    } else {
      const matrixWidthMeters = maxX - minX;
      const tileWidth = matrixWidthMeters / matrixWidth;
      const tileIdDouble = (longitude - minX) / tileWidth;
      tileId = ~~tileIdDouble;
      if (max) {
        // if the edge lands right on the calculated edge, subtract one
        if (tileIdDouble === tileId) {
          tileId--;
        }
      }
    }
    return tileId;
  }

  /**
   *  Get the tile row of the latitude in degrees
   *
   *  @param {BoundingBox} webMercatorTotalBox web mercator total bounding box
   *  @param {Number} matrixHeight        matrix height
   *  @param {Number} latitude            latitude
   *  @param {Boolean} [max]
   *  @return tile row
   */
  static getRowWithTotalBoundingBox(
    webMercatorTotalBox: BoundingBox,
    matrixHeight: number,
    latitude: number,
    max?: boolean,
  ): number {
    const minY = webMercatorTotalBox.minLatitude;
    const maxY = webMercatorTotalBox.maxLatitude;

    let tileId;
    if (latitude < minY) {
      tileId = matrixHeight;
    } else if (latitude >= maxY) {
      tileId = -1;
    } else {
      const matrixHeightMeters = maxY - minY;
      const tileHeight = matrixHeightMeters / matrixHeight;
      const tileIdDouble = (maxY - latitude) / tileHeight;
      tileId = ~~tileIdDouble;
      if (max) {
        // if the edge lands right on the calculated edge, add one
        if (tileIdDouble === tileId) {
          tileId--;
        }
      }
    }
    return tileId;
  }

  /**
   *  Get the web mercator bounding box of the tile column and row in the tile
   *  matrix using the total bounding box
   *
   *  @param {BoundingBox} box web mercator total bounding box
   *  @param {TileMatrix} tileMatrix          tile matrix
   *  @param {Number} tileColumn          tile column
   *  @param {Number} tileRow             tile row
   *
   *  @return web mercator bounding box
   */
  static getTileBoundingBox(
    box: BoundingBox,
    tileMatrix: TileMatrix,
    tileColumn: number,
    tileRow: number,
  ): BoundingBox {
    const tileMatrixWidth = tileMatrix.matrix_width;
    const tileMatrixHeight = tileMatrix.matrix_height;
    const tileGrid = new TileGrid(tileColumn, tileColumn, tileRow, tileRow);
    const matrixMinX = box.minLongitude;
    const matrixMaxX = box.maxLongitude;
    const matrixWidth = matrixMaxX - matrixMinX;
    const tileWidth = matrixWidth / tileMatrixWidth;

    // Find the longitude range
    const minLon = matrixMinX + tileWidth * tileGrid.min_x;
    const maxLon = minLon + tileWidth * (tileGrid.max_x + 1 - tileGrid.min_x);

    // Get the tile height
    const matrixMinY = box.minLatitude;
    const matrixMaxY = box.maxLatitude;
    const matrixHeight = matrixMaxY - matrixMinY;
    const tileHeight = matrixHeight / tileMatrixHeight;

    // Find the latitude range
    const maxLat = matrixMaxY - tileHeight * tileGrid.min_y;
    const minLat = maxLat - tileHeight * (tileGrid.max_y + 1 - tileGrid.min_y);

    return new BoundingBox(minLon, maxLon, minLat, maxLat);
  }

  static getTileGridBoundingBox(
    matrixSetBoundingBox: BoundingBox,
    tileMatrixWidth: number,
    tileMatrixHeight: number,
    tileGrid: TileGrid,
  ): BoundingBox {
    // Get the tile width
    const matrixMinX = matrixSetBoundingBox.minLongitude;
    const matrixMaxX = matrixSetBoundingBox.maxLongitude;
    const matrixWidth = matrixMaxX - matrixMinX;
    const tileWidth = matrixWidth / tileMatrixWidth;

    // Find the longitude range
    const minLon = matrixMinX + tileWidth * tileGrid.min_x;
    const maxLon = minLon + tileWidth * (tileGrid.max_x + 1 - tileGrid.min_x);

    // Get the tile height
    const matrixMinY = matrixSetBoundingBox.minLatitude;
    const matrixMaxY = matrixSetBoundingBox.maxLatitude;
    const matrixHeight = matrixMaxY - matrixMinY;
    const tileHeight = matrixHeight / tileMatrixHeight;

    // Find the latitude range
    const maxLat = matrixMaxY - tileHeight * tileGrid.min_y;
    const minLat = maxLat - tileHeight * (tileGrid.max_y + 1 - tileGrid.min_y);

    return new BoundingBox(minLon, maxLon, minLat, maxLat);
  }

  static getXPixel(width: number, boundingBox: BoundingBox, longitude: number): number {
    const boxWidth = boundingBox.maxLongitude - boundingBox.minLongitude;
    const offset = longitude - boundingBox.minLongitude;
    const percentage = offset / boxWidth;
    return percentage * width;
  }

  static getLongitudeFromPixel(
    width: number,
    boundingBox: BoundingBox,
    tileBoundingBox: BoundingBox,
    pixel: number,
  ): number {
    const boxWidth = tileBoundingBox.maxLongitude - tileBoundingBox.minLongitude;
    const percentage = pixel / width;
    const offset = percentage * boxWidth;
    return offset + boundingBox.minLongitude;
  }

  static getYPixel(height: number, boundingBox: BoundingBox, latitude: number): number {
    const boxHeight = boundingBox.maxLatitude - boundingBox.minLatitude;
    const offset = boundingBox.maxLatitude - latitude;
    const percentage = offset / boxHeight;
    return percentage * height;
  }

  static getLatitudeFromPixel(
    height: number,
    boundingBox: BoundingBox,
    tileBoundingBox: BoundingBox,
    pixel: number,
  ): number {
    const boxHeight = tileBoundingBox.maxLatitude - tileBoundingBox.minLatitude;
    const percentage = pixel / height;
    const offset = percentage * boxHeight;
    return boundingBox.maxLatitude - offset;
  }

  /**
   * Get the tile size in meters
   * @param tilesPerSide tiles per side
   * @return {Number} tile size
   */
  static tileSize(tilesPerSide: number): number {
    return (2 * TileBoundingBoxUtils.WEB_MERCATOR_HALF_WORLD_WIDTH) / tilesPerSide;
  }

  /**
   * Get the zoom level from the tile size in meters
   * @param tileSize tile size in meters
   * @return {Number} zoom level
   * @since 1.2.0
   */
  static zoomLevelOfTileSize(tileSize: number): number {
    const tilesPerSide = (2 * TileBoundingBoxUtils.WEB_MERCATOR_HALF_WORLD_WIDTH) / tileSize;
    return Math.log(tilesPerSide) / Math.log(2);
  }

  /**
   * Get the tile width in degrees
   * @param tilesPerSide tiles per side
   * @return {Number} tile width degrees
   */
  static tileWidthDegrees(tilesPerSide: number): number {
    return 360.0 / tilesPerSide;
  }

  /**
   * Get the tile height in degrees
   * @param tilesPerSide tiles per side
   * @return {Number} tile height degrees
   */
  statictileHeightDegrees(tilesPerSide: number): number {
    return 180.0 / tilesPerSide;
  }

  /**
   * Get the tiles per side, width and height, at the zoom level
   * @param zoom zoom level
   * @return {Number} tiles per side
   */
  static tilesPerSide(zoom: number): number {
    return Math.pow(2, zoom);
  }

  /**
   * Get the tile size in meters at the zoom level
   * @param zoom zoom level
   * @return {Number} tile size in meters
   * @since 2.0.0
   */
  static tileSizeWithZoom(zoom: number): number {
    const tilesPerSide = this.tilesPerSide(zoom);
    return this.tileSize(tilesPerSide);
  }

  /**
   * Get the tolerance distance in meters for the zoom level and pixels length
   * @param zoom zoom level
   * @param pixels pixel length
   * @return {Number} tolerance distance in meters
   * @since 2.0.0
   */
  static toleranceDistance(zoom: number, pixels: number): number {
    const tileSize = this.tileSizeWithZoom(zoom);
    return tileSize / pixels;
  }

  /**
   * Get the tolerance distance in meters for the zoom level and pixels length
   * @param zoom zoom level
   * @param pixelWidth pixel width
   * @param pixelHeight pixel height
   * @return {Number} tolerance distance in meters
   * @since 2.0.0
   */
  static toleranceDistanceWidthAndHeight(zoom: number, pixelWidth: number, pixelHeight: number): number {
    return this.toleranceDistance(zoom, Math.max(pixelWidth, pixelHeight));
  }
}
