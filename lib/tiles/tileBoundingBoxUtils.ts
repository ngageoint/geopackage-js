import { Projection, ProjectionConstants, Projections } from '@ngageoint/projections-js';
import { TileGrid } from './tileGrid';
import { BoundingBox } from '../boundingBox';
import { TileMatrix } from './matrix/tileMatrix';
import { Point } from '@ngageoint/simple-features-js';
import { GeometryTransform } from '@ngageoint/simple-features-proj-js/dist/lib/GeometryTransform';
import { ImageRectangle } from './imageRectangle';

/**
 * This module exports utility functions for [slippy map (XYZ)](https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames)
 * tile calculations.
 */
export class TileBoundingBoxUtils {
  /**
   * Web mercator projection
   */
  private static readonly webMercator: Projection = Projections.getWebMercatorProjection();

  /**
   * WGS84 projection
   */
  private static readonly wgs84: Projection = Projections.getWGS84Projection();

  /**
   * Get the overlapping bounding box between the two bounding boxes adjusting
   * the second box to an Anti-Meridian complementary version based upon the
   * max longitude
   *
   * @param boundingBox bounding box
   * @param boundingBox2 bounding box 2
   * @param allowEmpty allow empty latitude and/or longitude ranges when determining
   * @param maxLongitude max longitude of the world for the current bounding box units overlap
   *
   * @return bounding box
   */
  public static overlap(
    boundingBox: BoundingBox,
    boundingBox2: BoundingBox,
    allowEmpty = false,
    maxLongitude: number,
  ): BoundingBox {
    let bbox2 = boundingBox2;
    let adjustment = 0.0;
    if (maxLongitude > 0) {
      if (boundingBox.getMinLongitude() > boundingBox2.getMaxLongitude()) {
        adjustment = maxLongitude * 2.0;
      } else if (boundingBox.getMaxLongitude() < boundingBox2.getMinLongitude()) {
        adjustment = maxLongitude * -2.0;
      }
    }
    if (adjustment !== 0.0) {
      bbox2 = boundingBox2.copy();
      bbox2.setMinLongitude(bbox2.getMinLongitude() + adjustment);
      bbox2.setMaxLongitude(bbox2.getMaxLongitude() + adjustment);
    }

    return boundingBox.overlap(bbox2, allowEmpty);
  }

  /**
   * Determine if the point is within the bounding box
   *
   * @param point bounding box
   * @param boundingBox bounding box
   * @param maxLongitude max longitude of the world for the current bounding box units
   *
   * @return true if within the bounding box
   */
  public static isPointInBoundingBox(point: Point, boundingBox: BoundingBox, maxLongitude: number = null): boolean {
    const pointBoundingbox = new BoundingBox(point.x, point.y, point.x, point.y);
    const overlap = TileBoundingBoxUtils.overlap(boundingBox, pointBoundingbox, true, maxLongitude);
    return overlap != null;
  }

  /**
   * Get the union bounding box combining the two bounding boxes
   *
   * @param boundingBox bounding box 1
   * @param boundingBox2
   *            bounding box 2
   * @return bounding box
   */
  public static union(boundingBox: BoundingBox, boundingBox2: BoundingBox): BoundingBox {
    return boundingBox.union(boundingBox2);
  }

  /**
   * Get the X pixel for where the longitude fits into the bounding box
   *
   * @param width width
   * @param boundingBox bounding box
   * @param longitude longitude
   * @return x pixel
   */
  public static getXPixel(width: number, boundingBox: BoundingBox, longitude: number): number {
    const boxWidth = boundingBox.getMaxLongitude() - boundingBox.getMinLongitude();
    const offset = longitude - boundingBox.getMinLongitude();
    const percentage = offset / boxWidth;
    return percentage * width;
  }

  /**
   * Get the longitude from the pixel location, bounding box, and image width
   *
   * @param width width
   * @param boundingBox bounding box
   * @param pixel pixel
   * @return longitude
   */
  public static getLongitudeFromPixel(width: number, boundingBox: BoundingBox, pixel: number): number {
    return TileBoundingBoxUtils.getLongitudeFromPixelWithTileBoundingBox(width, boundingBox, boundingBox, pixel);
  }

  /**
   * Get the longitude from the pixel location, bounding box, tile bounding
   * box (when different from bounding box), and image width
   *
   * @param width width
   * @param boundingBox bounding box
   * @param tileBoundingBox tile bounding box
   * @param pixel pixel
   * @return longitude
   */
  public static getLongitudeFromPixelWithTileBoundingBox(
    width: number,
    boundingBox: BoundingBox,
    tileBoundingBox: BoundingBox,
    pixel: number,
  ): number {
    const boxWidth = tileBoundingBox.getMaxLongitude() - tileBoundingBox.getMinLongitude();
    const percentage = pixel / width;
    const offset = percentage * boxWidth;
    return offset + boundingBox.getMinLongitude();
  }

  /**
   * Get the Y pixel for where the latitude fits into the bounding box
   *
   * @param height height
   * @param boundingBox bounding box
   * @param latitude latitude
   * @return y pixel
   */
  public static getYPixel(height: number, boundingBox: BoundingBox, latitude: number): number {
    const boxHeight = boundingBox.getMaxLatitude() - boundingBox.getMinLatitude();
    const offset = boundingBox.getMaxLatitude() - latitude;
    const percentage = offset / boxHeight;
    return percentage * height;
  }

  /**
   * Get the latitude from the pixel location, bounding box, and image height
   *
   * @param height height
   * @param boundingBox bounding box
   * @param pixel pixel
   * @return latitude
   */
  public static getLatitudeFromPixel(height: number, boundingBox: BoundingBox, pixel: number): number {
    return TileBoundingBoxUtils.getLatitudeFromPixelWithTileBoundingBox(height, boundingBox, boundingBox, pixel);
  }

  /**
   * Get the latitude from the pixel location, bounding box, tile bounding box
   * (when different from bounding box), and image height
   *
   * @param height height
   * @param boundingBox bounding box
   * @param tileBoundingBox tile bounding box
   * @param pixel pixel
   * @return latitude
   */
  public static getLatitudeFromPixelWithTileBoundingBox(
    height: number,
    boundingBox: BoundingBox,
    tileBoundingBox: BoundingBox,
    pixel: number,
  ): number {
    const boxHeight = tileBoundingBox.getMaxLatitude() - tileBoundingBox.getMinLatitude();
    const percentage = pixel / height;
    const offset = percentage * boxHeight;
    return boundingBox.getMaxLatitude() - offset;
  }

  /**
   * Get the tile bounding box from the XYZ tile coordinates and zoom level
   *
   * @param x x coordinate
   * @param y y coordinate
   * @param zoom zoom level
   * @return bounding box
   */
  public static getBoundingBox(x: number, y: number, zoom: number): BoundingBox {
    const tilesPerSide = TileBoundingBoxUtils.tilesPerSide(zoom);
    const tileWidthDegrees = TileBoundingBoxUtils.tileWidthDegrees(tilesPerSide);
    const tileHeightDegrees = TileBoundingBoxUtils.tileHeightDegrees(tilesPerSide);

    const minLon = -180.0 + x * tileWidthDegrees;
    const maxLon = minLon + tileWidthDegrees;

    const maxLat = 90.0 - y * tileHeightDegrees;
    const minLat = maxLat - tileHeightDegrees;

    return new BoundingBox(minLon, minLat, maxLon, maxLat);
  }

  /**
   * Get the Web Mercator tile bounding box from the XYZ tile coordinates and
   * zoom level
   *
   * @param x x coordinate
   * @param y y coordinate
   * @param zoom zoom level
   * @return bounding box
   */
  public static getWebMercatorBoundingBox(x: number, y: number, zoom: number): BoundingBox {
    return TileBoundingBoxUtils.getWebMercatorBoundingBoxWithTileGrid(new TileGrid(x, y, x, y), zoom);
  }

  /**
   * Get the Web Mercator tile bounding box from the XYZ tile grid and zoom
   * level
   *
   * @param tileGrid tile grid
   * @param zoom zoom level
   * @return bounding box
   */
  public static getWebMercatorBoundingBoxWithTileGrid(tileGrid: TileGrid, zoom: number): BoundingBox {
    const tileSize = TileBoundingBoxUtils.tileSizeWithZoom(zoom);
    const minLon = (-1 * ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH) + (tileGrid.getMinX() * tileSize);
    const maxLon = (-1 * ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH) + ((tileGrid.getMaxX() + 1) * tileSize);
    const minLat = ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH - ((tileGrid.getMaxY() + 1) * tileSize);
    const maxLat = ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH - (tileGrid.getMinY() * tileSize);
    return new BoundingBox(minLon, minLat, maxLon, maxLat);
  }

  /**
   * Get the Projected tile bounding box from the XYZ tile coordinates and
   * zoom level
   *
   * @param authority projection authority
   * @param code projection code
   * @param x x coordinate
   * @param y y coordinate
   * @param zoom zoom level
   * @return bounding box
   */
  public static getProjectedBoundingBox(
    authority: string = ProjectionConstants.AUTHORITY_EPSG,
    code: number,
    x: number,
    y: number,
    zoom: number,
  ): BoundingBox {
    let boundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBox(x, y, zoom);
    if (code != null) {
      const transform = GeometryTransform.create(TileBoundingBoxUtils.webMercator, authority, code);
      boundingBox = boundingBox.transform(transform);
    }

    return boundingBox;
  }

  /**
   * Get the Projected tile bounding box from the XYZ tile coordinates and
   * zoom level
   *
   * @param projection projection
   * @param x x coordinate
   * @param y y coordinate
   * @param zoom zoom level
   * @return bounding box
   */
  public static getProjectedBoundingBoxWithProjection(
    projection: Projection,
    x: number,
    y: number,
    zoom: number,
  ): BoundingBox {
    let boundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBox(x, y, zoom);
    if (projection != null) {
      const transform = GeometryTransform.create(TileBoundingBoxUtils.webMercator, projection);
      boundingBox = boundingBox.transform(transform);
    }
    return boundingBox;
  }

  /**
   * Get the Projected tile bounding box from the XYZ tile tileGrid and zoom
   * level
   *
   * @param authority projection authority
   * @param code projection code
   * @param tileGrid tile grid
   * @param zoom zoom level
   * @return bounding box
   */
  public static getProjectedBoundingBoxFromTileGrid(
    authority: string = ProjectionConstants.AUTHORITY_EPSG,
    code: number,
    tileGrid: TileGrid,
    zoom: number,
  ): BoundingBox {
    let boundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxWithTileGrid(tileGrid, zoom);
    if (code != null) {
      const transform = GeometryTransform.create(TileBoundingBoxUtils.webMercator, authority, code);
      boundingBox = boundingBox.transform(transform);
    }

    return boundingBox;
  }

  /**
   * Get the Projected tile bounding box from the XYZ tile grid and zoom level
   *
   * @param projection projection
   * @param tileGrid tile grid
   * @param zoom zoom level
   * @return bounding box
   */
  public static getProjectedBoundingBoxWithProjectionFromTileGrid(
    projection: Projection,
    tileGrid: TileGrid,
    zoom: number,
  ): BoundingBox {
    let boundingBox: BoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxWithTileGrid(tileGrid, zoom);
    if (projection != null) {
      const transform = GeometryTransform.create(TileBoundingBoxUtils.webMercator, projection);
      boundingBox = boundingBox.transform(transform);
    }
    return boundingBox;
  }

  /**
   * Get the WGS84 tile bounding box from the XYZ tile tileGrid and zoom level
   *
   * @param tileGrid tile grid
   * @param zoom zoom level
   * @return bounding box
   */
  public static getBoundingBoxWGS84(tileGrid: TileGrid, zoom: number): BoundingBox {
    return TileBoundingBoxUtils.getProjectedBoundingBoxFromTileGrid(
      ProjectionConstants.AUTHORITY_EPSG,
      ProjectionConstants.EPSG_WORLD_GEODETIC_SYSTEM,
      tileGrid,
      zoom,
    );
  }

  /**
   * Get the Projected tile bounding box from the WGS84 XYZ tile coordinates
   * and zoom level
   *
   * @param authority projection authority (default is EPSG)
   * @param code projection code
   * @param x x coordinate
   * @param y y coordinate
   * @param zoom zoom level
   * @return bounding box
   */
  public static getProjectedBoundingBoxFromWGS84(
    authority: string = ProjectionConstants.AUTHORITY_EPSG,
    code: number,
    x: number,
    y: number,
    zoom: number,
  ): BoundingBox {
    let boundingBox: BoundingBox = TileBoundingBoxUtils.getWGS84BoundingBox(x, y, zoom);

    if (code != null) {
      const transform = GeometryTransform.create(TileBoundingBoxUtils.wgs84, authority, code);
      boundingBox = boundingBox.transform(transform);
    }

    return boundingBox;
  }

  /**
   * Get the Projected tile bounding box from the WGS84 XYZ tile coordinates
   * and zoom level
   *
   * @param projection projection
   * @param x x coordinate
   * @param y y coordinate
   * @param zoom zoom level
   * @return bounding box
   */
  public static getProjectedBoundingBoxFromWGS84WithProjection(
    projection: Projection,
    x: number,
    y: number,
    zoom: number,
  ): BoundingBox {
    let boundingBox: BoundingBox = TileBoundingBoxUtils.getWGS84BoundingBox(x, y, zoom);

    if (projection != null) {
      const transform = GeometryTransform.create(TileBoundingBoxUtils.wgs84, projection);
      boundingBox = boundingBox.transform(transform);
    }

    return boundingBox;
  }

  /**
   * Get the Projected tile bounding box from the WGS84 XYZ tile tileGrid and
   * zoom level
   *
   * @param authority projection authority (default is EPSG)
   * @param code projection code
   * @param tileGrid tile grid
   * @param zoom zoom level
   * @return bounding box
   */
  public static getProjectedBoundingBoxFromWGS84FromTileGrid(
    authority: string = ProjectionConstants.AUTHORITY_EPSG,
    code: number,
    tileGrid: TileGrid,
    zoom: number,
  ): BoundingBox {
    let boundingBox: BoundingBox = TileBoundingBoxUtils.getWGS84BoundingBoxWithTileGridAndZoom(tileGrid, zoom);
    if (code != null) {
      const transform = GeometryTransform.create(TileBoundingBoxUtils.wgs84, authority, code);
      boundingBox = boundingBox.transform(transform);
    }
    return boundingBox;
  }

  /**
   * Get the Projected tile bounding box from the WGS84 XYZ tile grid and zoom
   * level
   *
   * @param projection projection
   * @param tileGrid tile grid
   * @param zoom zoom level
   * @return bounding box
   */
  public static getProjectedBoundingBoxFromWGS84WithProjectionFromTileGrid(
    projection: Projection,
    tileGrid: TileGrid,
    zoom: number,
  ): BoundingBox {
    let boundingBox: BoundingBox = TileBoundingBoxUtils.getWGS84BoundingBoxWithTileGridAndZoom(tileGrid, zoom);

    if (projection != null) {
      const transform = GeometryTransform.create(TileBoundingBoxUtils.wgs84, projection);
      boundingBox = boundingBox.transform(transform);
    }

    return boundingBox;
  }

  /**
   * Get the tile grid for the location specified as WGS84
   *
   * @param point point
   * @param zoom zoom level
   * @return tile grid
   */
  public static getTileGridFromWGS84(point: Point, zoom: number): TileGrid {
    const projection: Projection = Projections.getWGS84Projection();
    return TileBoundingBoxUtils.getTileGridWithPoint(point, zoom, projection);
  }

  /**
   * Get the tile grid for the location specified as the projection
   *
   * @param point point
   * @param zoom zoom level
   * @param projection projection
   * @return tile grid
   */
  public static getTileGridWithPoint(point: Point, zoom: number, projection: Projection): TileGrid {
    const toWebMercator = GeometryTransform.create(projection, Projections.getWebMercatorProjection());
    const webMercatorPoint = toWebMercator.transformPoint(point);
    return TileBoundingBoxUtils.getTileGridFromWebMercator(webMercatorPoint, zoom);
  }

  /**
   * Get the tile grid for the location specified as web mercator
   *
   * @param point point
   * @param zoom zoom level
   * @return tile grid
   */
  public static getTileGridFromWebMercator(point: Point, zoom: number): TileGrid {
    const boundingBox: BoundingBox = new BoundingBox(point.x, point.y, point.x, point.y);
    return TileBoundingBoxUtils.getTileGridFromBoundingBox(boundingBox, zoom);
  }

  /**
   * Get the tile grid that includes the entire tile bounding box
   *
   * @param webMercatorBoundingBox web mercator bounding box
   * @param zoom zoom level
   * @return tile grid
   */
  public static getTileGridFromBoundingBox(webMercatorBoundingBox: BoundingBox, zoom: number): TileGrid {
    const tilesPerSide = TileBoundingBoxUtils.tilesPerSide(zoom);
    const tileSize = TileBoundingBoxUtils.tileSize(tilesPerSide);
    const minX = Math.round(
      (webMercatorBoundingBox.getMinLongitude() + ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH) / tileSize,
    );
    const tempMaxX =
      (webMercatorBoundingBox.getMaxLongitude() + ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH) / tileSize;
    let maxX = Math.round(tempMaxX - ProjectionConstants.WEB_MERCATOR_PRECISION);
    maxX = Math.min(maxX, tilesPerSide - 1);

    const minY = Math.round(
      ((webMercatorBoundingBox.getMaxLatitude() - ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH) * -1) / tileSize,
    );
    const tempMaxY =
      ((webMercatorBoundingBox.getMinLatitude() - ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH) * -1) / tileSize;
    let maxY = Math.round(tempMaxY - ProjectionConstants.WEB_MERCATOR_PRECISION);
    maxY = Math.min(maxY, tilesPerSide - 1);

    return new TileGrid(minX, minY, maxX, maxY);
  }

  /**
   * Get the bounds of the XYZ tile at the point and zoom level
   *
   * @param projection point and bounding box projection
   * @param point point location
   * @param zoom zoom level
   * @return bounding box
   */
  public static getTileBounds(projection: Projection, point: Point, zoom: number): BoundingBox {
    const tileGrid: TileGrid = TileBoundingBoxUtils.getTileGridWithPoint(point, zoom, projection);
    return TileBoundingBoxUtils.getProjectedBoundingBoxWithProjectionFromTileGrid(projection, tileGrid, zoom);
  }

  /**
   * Get the WGS84 bounds of the XYZ tile at the WGS84 point and zoom level
   *
   * @param point WGS84 point
   * @param zoom zoom level
   * @return WGS84 bounding box
   */
  public static getTileBoundsWithWGS84(point: Point, zoom: number): BoundingBox {
    const projection: Projection = Projections.getWGS84Projection();
    return TileBoundingBoxUtils.getTileBounds(projection, point, zoom);
  }

  /**
   * Get the web mercator bounds of the XYZ tile at the web mercator point and
   * zoom level
   *
   * @param point web mercator point
   * @param zoom zoom level
   * @return web mercator bounding box
   */
  public static getTileBoundsWithWebMercator(point: Point, zoom: number): BoundingBox {
    const projection: Projection = Projections.getWebMercatorProjection();
    return TileBoundingBoxUtils.getTileBounds(projection, point, zoom);
  }

  /**
   * Get the bounds of the WGS84 tile at the point and zoom level
   *
   * @param projection point and bounding box projection
   * @param point point location
   * @param zoom zoom level
   * @return bounding box
   */
  public static getWGS84TileBounds(projection: Projection, point: Point, zoom: number): BoundingBox {
    const tileGrid: TileGrid = TileBoundingBoxUtils.getTileGridWGS84WithPoint(point, zoom, projection);
    return TileBoundingBoxUtils.getProjectedBoundingBoxFromWGS84WithProjectionFromTileGrid(projection, tileGrid, zoom);
  }

  /**
   * Get the WGS84 bounds of the WGS84 tile at the WGS84 point and zoom level
   *
   * @param point WGS84 point
   * @param zoom zoom level
   * @return WGS84 bounding box
   */
  public static getWGS84TileBoundsWithWGS84(point: Point, zoom: number): BoundingBox {
    const projection: Projection = Projections.getWGS84Projection();
    return TileBoundingBoxUtils.getWGS84TileBounds(projection, point, zoom);
  }

  /**
   * Get the web mercator bounds of the WGS84 tile at the web mercator point
   * and zoom level
   *
   * @param point web mercator point
   * @param zoom zoom level
   * @return web mercator bounding box
   */
  public static getWGS84TileBoundsWithWebMercator(point: Point, zoom: number): BoundingBox {
    const projection = Projections.getWebMercatorProjection();
    return TileBoundingBoxUtils.getWGS84TileBounds(projection, point, zoom);
  }

  /**
   * Convert the bounding box coordinates to a new web mercator bounding box
   *
   * @param boundingBox bounding box
   * @return bounding box
   */
  public static toWebMercator(boundingBox: BoundingBox): BoundingBox {
    const minLatitude = Math.max(boundingBox.getMinLatitude(), ProjectionConstants.WEB_MERCATOR_MIN_LAT_RANGE);
    const maxLatitude = Math.min(boundingBox.getMaxLatitude(), ProjectionConstants.WEB_MERCATOR_MAX_LAT_RANGE);
    let lowerLeftPoint = new Point(false, false, boundingBox.getMinLongitude(), minLatitude);
    let upperRightPoint = new Point(false, false, boundingBox.getMaxLongitude(), maxLatitude);
    const toWebMercator = GeometryTransform.create(
      ProjectionConstants.EPSG_WORLD_GEODETIC_SYSTEM,
      ProjectionConstants.EPSG_WEB_MERCATOR,
    );
    lowerLeftPoint = toWebMercator.transformPoint(lowerLeftPoint);
    upperRightPoint = toWebMercator.transformPoint(upperRightPoint);
    return new BoundingBox(lowerLeftPoint.x, lowerLeftPoint.y, upperRightPoint.x, upperRightPoint.y);
  }

  /**
   * Get the tile size in length units (meters by default)
   * @param tilesPerSide  tiles per side total length
   * @param totalLength  total length
   * @return tile size
   */
  public static tileSize(
    tilesPerSide: number,
    totalLength: number = 2 * ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH,
  ): number {
    return totalLength / tilesPerSide;
  }

  /**
   * Get the zoom level from the tile size in length units (default is meters)
   * @param tileSize tile size in units total length
   * @param totalLength
   * @return zoom level
   */
  public static zoomLevelOfTileSize(
    tileSize: number,
    totalLength: number = 2 * ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH,
  ): number {
    const tilesPerSide = totalLength / tileSize;
    return Math.log(tilesPerSide) / Math.log(2);
  }

  /**
   * Get the tile size in length units at the zoom level
   *
   * @param zoom zoom level
   * @param totalLength total length
   * @return tile size in units
   */
  public static tileSizeWithZoom(zoom: number, totalLength?: number): number {
    const tilesPerSide = TileBoundingBoxUtils.tilesPerSide(zoom);
    return TileBoundingBoxUtils.tileSize(tilesPerSide, totalLength);
  }

  /**
   * Get the tile width in degrees
   *
   * @param tilesPerSide tiles per side
   * @return tile width degrees
   */
  public static tileWidthDegrees(tilesPerSide: number): number {
    return 360.0 / tilesPerSide;
  }

  /**
   * Get the tile height in degrees
   * @param tilesPerSide tiles per side
   * @return tile height degrees
   */
  public static tileHeightDegrees(tilesPerSide: number): number {
    return 180.0 / tilesPerSide;
  }

  /**
   * Get the tiles per side, width and height, at the zoom level
   *
   * @param zoom zoom level
   * @return tiles per side
   */
  public static tilesPerSide(zoom: number): number {
    return Math.round(Math.pow(2, zoom));
  }

  /**
   * Get the tolerance distance in meters for the zoom level and pixels length
   *
   * @param zoom zoom level
   * @param pixels pixel length
   *
   * @return tolerance distance in meters
   */
  public static toleranceDistanceWithLength(zoom: number, pixels: number): number {
    const tileSize = TileBoundingBoxUtils.tileSizeWithZoom(zoom);
    return tileSize / pixels;
  }

  /**
   * Get the tolerance distance in meters for the zoom level and pixels length
   *
   * @param zoom zoom level
   * @param pixelWidth pixel width
   * @param pixelHeight pixel height
   *
   * @return tolerance distance in meters
   */
  public static toleranceDistance(zoom: number, pixelWidth, pixelHeight): number {
    return TileBoundingBoxUtils.toleranceDistanceWithLength(zoom, Math.max(pixelWidth, pixelHeight));
  }

  /**
   * Get the standard y tile location as TMS or a TMS y location as standard
   *
   * @param zoom zoom level
   * @param y y coordinate
   * @return opposite tile format y
   */
  public static getYAsOppositeTileFormat(zoom: number, y: number): number {
    const tilesPerSide = TileBoundingBoxUtils.tilesPerSide(zoom);
    return tilesPerSide - y - 1;
  }

  /**
   * Get the zoom level from the tiles per side
   *
   * @param tilesPerSide tiles per side
   * @return zoom level
   */
  public static zoomFromTilesPerSide(tilesPerSide: number): number {
    return Math.round(Math.log(tilesPerSide) / Math.log(2));
  }

  /**
   * Get the tile grid
   *
   * @param totalBox total bounding box
   * @param matrixWidth matrix width
   * @param matrixHeight matrix height
   * @param boundingBox bounding box
   * @return tile grid
   */
  public static getTileGrid(
    totalBox: BoundingBox,
    matrixWidth: number,
    matrixHeight: number,
    boundingBox: BoundingBox,
  ): TileGrid {
    let minColumn = TileBoundingBoxUtils.getTileColumn(totalBox, matrixWidth, boundingBox.getMinLongitude());
    let maxColumn = TileBoundingBoxUtils.getTileColumn(totalBox, matrixWidth, boundingBox.getMaxLongitude());

    if (minColumn < matrixWidth && maxColumn >= 0) {
      if (minColumn < 0) {
        minColumn = 0;
      }
      if (maxColumn >= matrixWidth) {
        maxColumn = matrixWidth - 1;
      }
    }

    let maxRow = TileBoundingBoxUtils.getTileRow(totalBox, matrixHeight, boundingBox.getMinLatitude());
    let minRow = TileBoundingBoxUtils.getTileRow(totalBox, matrixHeight, boundingBox.getMaxLatitude());

    if (minRow < matrixHeight && maxRow >= 0) {
      if (minRow < 0) {
        minRow = 0;
      }
      if (maxRow >= matrixHeight) {
        maxRow = matrixHeight - 1;
      }
    }

    return new TileGrid(minColumn, minRow, maxColumn, maxRow);
  }

  /**
   * Get the tile column of the longitude in constant units
   *
   * @param totalBox total bounding box
   * @param matrixWidth matrix width
   * @param longitude in constant units
   * @return tile column if in the range, -1 if before,
   *         {@link TileMatrix#getMatrixWidth()} if after
   */
  public static getTileColumn(totalBox: BoundingBox, matrixWidth: number, longitude: number): number {
    const minX = totalBox.getMinLongitude();
    const maxX = totalBox.getMaxLongitude();
    let tileId;
    if (longitude < minX) {
      tileId = -1;
    } else if (longitude >= maxX) {
      tileId = matrixWidth;
    } else {
      const matrixWidthMeters = totalBox.getMaxLongitude() - totalBox.getMinLongitude();
      const tileWidth = matrixWidthMeters / matrixWidth;
      tileId = Math.round((longitude - minX) / tileWidth);
    }
    return tileId;
  }

  /**
   * Get the tile row of the latitude in constant units
   *
   * @param totalBox total bounding box
   * @param matrixHeight matrix height
   * @param latitude in constant units
   * @return tile row if in the range, -1 if before,
   *         {@link TileMatrix#getMatrixHeight()} if after
   */
  public static getTileRow(totalBox: BoundingBox, matrixHeight: number, latitude: number): number {
    const minY = totalBox.getMinLatitude();
    const maxY = totalBox.getMaxLatitude();

    let tileId;
    if (latitude <= minY) {
      tileId = matrixHeight;
    } else if (latitude > maxY) {
      tileId = -1;
    } else {
      const matrixHeightMeters = totalBox.getMaxLatitude() - totalBox.getMinLatitude();
      const tileHeight = matrixHeightMeters / matrixHeight;
      tileId = Math.round((maxY - latitude) / tileHeight);
    }

    return tileId;
  }

  /**
   * Get the bounding box of the tile column and row in the tile matrix using
   * the total bounding box with constant units
   *
   * @param totalBox total bounding box
   * @param tileMatrix tile matrix
   * @param tileColumn tile column
   * @param tileRow tile row
   * @return bounding box
   */
  public static getBoundingBoxWithTileMatrix(
    totalBox: BoundingBox,
    tileMatrix: TileMatrix,
    tileColumn: number,
    tileRow: number,
  ): BoundingBox {
    return TileBoundingBoxUtils.getBoundingBoxWithTotalBoundingBox(
      totalBox,
      tileMatrix.getMatrixWidth(),
      tileMatrix.getMatrixHeight(),
      tileColumn,
      tileRow,
    );
  }

  /**
   * Get the bounding box of the tile column and row in the tile width and
   * height bounds using the total bounding box with constant units
   *
   * @param totalBox total bounding box
   * @param tileMatrixWidth matrix width
   * @param tileMatrixHeight matrix height
   * @param tileColumn tile column
   * @param tileRow tile row
   * @return bounding box
   */
  public static getBoundingBoxWithTotalBoundingBox(
    totalBox: BoundingBox,
    tileMatrixWidth: number,
    tileMatrixHeight: number,
    tileColumn: number,
    tileRow: number,
  ): BoundingBox {
    const tileGrid: TileGrid = new TileGrid(tileColumn, tileRow, tileColumn, tileRow);
    return TileBoundingBoxUtils.getBoundingBoxWithTileGrid(totalBox, tileMatrixWidth, tileMatrixHeight, tileGrid);
  }

  /**
   * Get the bounding box of the tile grid in the tile matrix using the total
   * bounding box with constant units
   *
   * @param totalBox total bounding box
   * @param tileMatrix tile matrix
   * @param tileGrid tile grid
   * @return bounding box
   */
  public static getBoundingBoxWithTileMatrixAndTileGrid(
    totalBox: BoundingBox,
    tileMatrix: TileMatrix,
    tileGrid: TileGrid,
  ): BoundingBox {
    return TileBoundingBoxUtils.getBoundingBoxWithTileGrid(
      totalBox,
      tileMatrix.getMatrixWidth(),
      tileMatrix.getMatrixHeight(),
      tileGrid,
    );
  }

  /**
   * Get the bounding box of the tile grid in the tile width and height bounds
   * using the total bounding box with constant units
   *
   * @param totalBox total bounding box
   * @param tileMatrixWidth matrix width
   * @param tileMatrixHeight matrix height
   * @param tileGrid tile grid
   * @return bounding box
   */
  public static getBoundingBoxWithTileGrid(
    totalBox: BoundingBox,
    tileMatrixWidth: number,
    tileMatrixHeight: number,
    tileGrid: TileGrid,
  ): BoundingBox {
    // Get the tile width
    const matrixMinX = totalBox.getMinLongitude();
    const matrixMaxX = totalBox.getMaxLongitude();
    const matrixWidth = matrixMaxX - matrixMinX;
    const tileWidth = matrixWidth / tileMatrixWidth;

    // Find the longitude range
    const minLon = matrixMinX + tileWidth * tileGrid.getMinX();
    const maxLon = matrixMinX + tileWidth * (tileGrid.getMaxX() + 1);

    // Get the tile height
    const matrixMinY = totalBox.getMinLatitude();
    const matrixMaxY = totalBox.getMaxLatitude();
    const matrixHeight = matrixMaxY - matrixMinY;
    const tileHeight = matrixHeight / tileMatrixHeight;

    // Find the latitude range
    const maxLat = matrixMaxY - tileHeight * tileGrid.getMinY();
    const minLat = matrixMaxY - tileHeight * (tileGrid.getMaxY() + 1);

    return new BoundingBox(minLon, minLat, maxLon, maxLat);
  }

  /**
   * Get the zoom level of where the web mercator bounding box fits into the
   * complete world
   *
   * @param webMercatorBoundingBox web mercator bounding box
   * @return zoom level
   */
  public static getZoomLevel(webMercatorBoundingBox: BoundingBox): number {
    const worldLength = ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH * 2;

    let longitudeDistance = webMercatorBoundingBox.getMaxLongitude() - webMercatorBoundingBox.getMinLongitude();
    let latitudeDistance = webMercatorBoundingBox.getMaxLatitude() - webMercatorBoundingBox.getMinLatitude();

    if (longitudeDistance <= 0) {
      longitudeDistance = Number.MIN_VALUE;
    }
    if (latitudeDistance <= 0) {
      latitudeDistance = Number.MIN_VALUE;
    }

    const widthTiles = Math.round(worldLength / longitudeDistance);
    const heightTiles = Math.round(worldLength / latitudeDistance);

    let tilesPerSide = Math.min(widthTiles, heightTiles);
    tilesPerSide = Math.max(tilesPerSide, 1);

    return TileBoundingBoxUtils.zoomFromTilesPerSide(tilesPerSide);
  }

  /**
   * Get the pixel x size for the bounding box with matrix width and tile
   * width
   *
   * @param webMercatorBoundingBox web mercator bounding box
   * @param matrixWidth matrix width
   * @param tileWidth tile width
   * @return pixel x size
   */
  public static getPixelXSize(webMercatorBoundingBox: BoundingBox, matrixWidth: number, tileWidth: number): number {
    return (
      (webMercatorBoundingBox.getMaxLongitude() - webMercatorBoundingBox.getMinLongitude()) / matrixWidth / tileWidth
    );
  }

  /**
   * Get the pixel y size for the bounding box with matrix height and tile
   * height
   *
   * @param webMercatorBoundingBox web mercator bounding box
   * @param matrixHeight matrix height
   * @param tileHeight tile height
   * @return pixel y size
   */
  public static getPixelYSize(webMercatorBoundingBox: BoundingBox, matrixHeight: number, tileHeight: number): number {
    return (
      (webMercatorBoundingBox.getMaxLatitude() - webMercatorBoundingBox.getMinLatitude()) / matrixHeight / tileHeight
    );
  }

  /**
   * Bound the web mercator bounding box within the limits
   *
   * @param boundingBox web mercator bounding box
   * @return bounding box
   */
  public static boundWebMercatorBoundingBox(boundingBox: BoundingBox): BoundingBox {
    const bounded = boundingBox.copy();
    bounded.setMinLongitude(
      Math.max(bounded.getMinLongitude(), -1 * ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH),
    );
    bounded.setMaxLongitude(Math.min(bounded.getMaxLongitude(), ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH));
    bounded.setMinLatitude(Math.max(bounded.getMinLatitude(), -1 * ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH));
    bounded.setMaxLatitude(Math.min(bounded.getMaxLatitude(), ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH));
    return bounded;
  }

  /**
   * Bound the upper and lower bounds of the WGS84 bounding box with web
   * mercator limits
   *
   * @param boundingBox wgs84 bounding box
   * @return bounding box
   */
  public static boundWgs84BoundingBoxWithWebMercatorLimits(boundingBox: BoundingBox): BoundingBox {
    return BoundingBox.boundDegreesBoundingBoxWithWebMercatorLimits(boundingBox);
  }

  /**
   * Get the WGS84 tile grid for the point specified as WGS84
   *
   * @param point point
   * @param zoom zoom level
   * @return tile grid
   */
  public static getTileGridWGS84WithWGS84Point(point: Point, zoom: number): TileGrid {
    const boundingBox: BoundingBox = new BoundingBox(point.x, point.y, point.x, point.y);
    return TileBoundingBoxUtils.getTileGridWGS84(boundingBox, zoom);
  }

  /**
   * Get the WGS84 tile grid for the point specified as the projection
   *
   * @param point point
   * @param zoom zoom level
   * @param projection projection
   * @return tile grid
   */
  public static getTileGridWGS84WithPoint(point: Point, zoom: number, projection: Projection): TileGrid {
    const toWGS84 = GeometryTransform.create(projection, ProjectionConstants.EPSG_WORLD_GEODETIC_SYSTEM);
    const wgs84Point = toWGS84.transformPoint(point);
    return TileBoundingBoxUtils.getTileGridWGS84WithWGS84Point(wgs84Point, zoom);
  }

  /**
   * Get the WGS84 tile grid for the point specified as web mercator
   *
   * @param point point
   * @param zoom zoom level
   * @return tile grid
   */
  public static getTileGridWGS84FromWebMercator(point: Point, zoom: number): TileGrid {
    const projection = Projections.getWebMercatorProjection();
    return TileBoundingBoxUtils.getTileGridWGS84WithPoint(point, zoom, projection);
  }

  /**
   * Get the WGS84 tile grid that includes the entire tile bounding box
   *
   * @param boundingBox wgs84 bounding box
   * @param zoom zoom level
   *
   * @return tile grid
   */
  public static getTileGridWGS84(boundingBox: BoundingBox, zoom: number): TileGrid {
    const tilesPerLat = TileBoundingBoxUtils.tilesPerWGS84LatSide(zoom);
    const tilesPerLon = TileBoundingBoxUtils.tilesPerWGS84LonSide(zoom);
    const tileSizeLat = TileBoundingBoxUtils.tileSizeLatPerWGS84Side(tilesPerLat);
    const tileSizeLon = TileBoundingBoxUtils.tileSizeLonPerWGS84Side(tilesPerLon);
    const minX = Math.round(
      (boundingBox.getMinLongitude() + ProjectionConstants.WGS84_HALF_WORLD_LON_WIDTH) / tileSizeLon,
    );
    const tempMaxX = (boundingBox.getMaxLongitude() + ProjectionConstants.WGS84_HALF_WORLD_LON_WIDTH) / tileSizeLon;
    let maxX = Math.round(tempMaxX);
    if (tempMaxX % 1 === 0) {
      maxX--;
    }
    maxX = Math.min(maxX, tilesPerLon - 1);
    const minY = Math.round(
      ((boundingBox.getMaxLatitude() - ProjectionConstants.WGS84_HALF_WORLD_LAT_HEIGHT) * -1) / tileSizeLat,
    );
    const tempMaxY =
      ((boundingBox.getMinLatitude() - ProjectionConstants.WGS84_HALF_WORLD_LAT_HEIGHT) * -1) / tileSizeLat;
    let maxY = Math.round(tempMaxY);
    if (tempMaxY % 1 === 0) {
      maxY--;
    }
    maxY = Math.min(maxY, tilesPerLat - 1);
    return new TileGrid(minX, minY, maxX, maxY);
  }

  /**
   * Get the web mercator tile grid that includes the entire tile bounding box
   *
   * @param webMercatorBoundingBox wgs84 bounding box
   * @param zoom zoom level
   * @return tile grid
   */
  public static getTileGridWithBoundingBoxAndZoom(webMercatorBoundingBox: BoundingBox, zoom: number): TileGrid {
    const tilesPerSide = this.tilesPerSide(zoom);
    const tileSize = this.tileSize(tilesPerSide);

    const minX = Math.round(
      (webMercatorBoundingBox.getMinLongitude() + ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH) / tileSize,
    );
    const tempMaxX =
      (webMercatorBoundingBox.getMaxLongitude() + ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH) / tileSize;
    let maxX = Math.round(tempMaxX - ProjectionConstants.WEB_MERCATOR_PRECISION);
    maxX = Math.min(maxX, tilesPerSide - 1);

    const minY = Math.round(
      ((webMercatorBoundingBox.getMaxLatitude() - ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH) * -1) / tileSize,
    );
    const tempMaxY =
      ((webMercatorBoundingBox.getMinLatitude() - ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH) * -1) / tileSize;
    let maxY = Math.round(tempMaxY - ProjectionConstants.WEB_MERCATOR_PRECISION);
    maxY = Math.min(maxY, tilesPerSide - 1);

    return new TileGrid(minX, minY, maxX, maxY);
  }

  /**
   * Get the WGS84 tile bounding box from the WGS84 XYZ tile coordinates and
   * zoom level
   *
   * @param x x coordinate
   * @param y y coordinate
   * @param zoom zoom level
   * @return bounding box
   */
  public static getWGS84BoundingBox(x: number, y: number, zoom: number): BoundingBox {
    return TileBoundingBoxUtils.getWGS84BoundingBoxWithTileGridAndZoom(new TileGrid(x, y, x, y), zoom);
  }

  /**
   * Get the WGS84 tile bounding box from the WGS84 tile grid and zoom level
   *
   * @param tileGrid tile grid
   * @param zoom zoom
   *
   * @return wgs84 bounding box
   */
  public static getWGS84BoundingBoxWithTileGridAndZoom(tileGrid: TileGrid, zoom: number): BoundingBox {
    const tilesPerLat = TileBoundingBoxUtils.tilesPerWGS84LatSide(zoom);
    const tilesPerLon = TileBoundingBoxUtils.tilesPerWGS84LonSide(zoom);

    const tileSizeLat = TileBoundingBoxUtils.tileSizeLatPerWGS84Side(tilesPerLat);
    const tileSizeLon = TileBoundingBoxUtils.tileSizeLonPerWGS84Side(tilesPerLon);

    const minLon = -1 * ProjectionConstants.WGS84_HALF_WORLD_LON_WIDTH + tileGrid.getMinX() * tileSizeLon;
    const maxLon = -1 * ProjectionConstants.WGS84_HALF_WORLD_LON_WIDTH + (tileGrid.getMaxX() + 1) * tileSizeLon;
    const minLat = ProjectionConstants.WGS84_HALF_WORLD_LAT_HEIGHT - (tileGrid.getMaxY() + 1) * tileSizeLat;
    const maxLat = ProjectionConstants.WGS84_HALF_WORLD_LAT_HEIGHT - tileGrid.getMinY() * tileSizeLat;

    return new BoundingBox(minLon, minLat, maxLon, maxLat);
  }

  /**
   * Get the tiles per latitude side at the zoom level
   *
   * @param zoom zoom level
   *
   * @return tiles per latitude side
   */
  public static tilesPerWGS84LatSide(zoom: number): number {
    return TileBoundingBoxUtils.tilesPerSide(zoom);
  }

  /**
   * Get the tiles per longitude side at the zoom level
   *
   * @param zoom zoom level
   *
   * @return tiles per longitude side
   */
  public static tilesPerWGS84LonSide(zoom: number): number {
    return 2 * TileBoundingBoxUtils.tilesPerSide(zoom);
  }

  /**
   * Get the tile height in degrees latitude
   * @param tilesPerLat tiles per latitude side
   * @return degrees
   */
  public static tileSizeLatPerWGS84Side(tilesPerLat: number): number {
    return (2 * ProjectionConstants.WGS84_HALF_WORLD_LAT_HEIGHT) / tilesPerLat;
  }

  /**
   * Get the tile height in degrees longitude
   * @param tilesPerLon tiles per longitude side
   * @return degrees
   */
  public static tileSizeLonPerWGS84Side(tilesPerLon: number): number {
    return (2 * ProjectionConstants.WGS84_HALF_WORLD_LON_WIDTH) / tilesPerLon;
  }

  /**
   * Get the tile grid starting from the tile grid and current zoom to the new
   * zoom level
   *
   * @param tileGrid current tile grid
   * @param fromZoom current zoom level
   * @param toZoom new zoom level
   * @return tile grid at new zoom level
   */
  public static tileGridZoom(tileGrid: TileGrid, fromZoom: number, toZoom: number): TileGrid {
    let newTileGrid;
    let zoomChange = toZoom - fromZoom;
    if (zoomChange > 0) {
      newTileGrid = TileBoundingBoxUtils.tileGridZoomIncrease(tileGrid, zoomChange);
    } else if (zoomChange < 0) {
      zoomChange = Math.abs(zoomChange);
      newTileGrid = TileBoundingBoxUtils.tileGridZoomDecrease(tileGrid, zoomChange);
    } else {
      newTileGrid = tileGrid;
    }

    return newTileGrid;
  }

  /**
   * Get the tile grid starting from the tile grid and zooming in / increasing
   * the number of levels
   *
   * @param tileGrid current tile grid
   * @param zoomLevels number of zoom levels to increase by
   * @return tile grid at new zoom level
   */
  public static tileGridZoomIncrease(tileGrid: TileGrid, zoomLevels: number): TileGrid {
    const minX = TileBoundingBoxUtils.tileGridMinZoomIncrease(tileGrid.getMinX(), zoomLevels);
    const maxX = TileBoundingBoxUtils.tileGridMaxZoomIncrease(tileGrid.getMaxX(), zoomLevels);
    const minY = TileBoundingBoxUtils.tileGridMinZoomIncrease(tileGrid.getMinY(), zoomLevels);
    const maxY = TileBoundingBoxUtils.tileGridMaxZoomIncrease(tileGrid.getMaxY(), zoomLevels);
    return new TileGrid(minX, minY, maxX, maxY);
  }

  /**
   * Get the tile grid starting from the tile grid and zooming out /
   * decreasing the number of levels
   *
   * @param tileGrid current tile grid
   * @param zoomLevels number of zoom levels to decrease by
   * @return tile grid at new zoom level
   */
  public static tileGridZoomDecrease(tileGrid: TileGrid, zoomLevels: number): TileGrid {
    const minX = TileBoundingBoxUtils.tileGridMinZoomDecrease(tileGrid.getMinX(), zoomLevels);
    const maxX = TileBoundingBoxUtils.tileGridMaxZoomDecrease(tileGrid.getMaxX(), zoomLevels);
    const minY = TileBoundingBoxUtils.tileGridMinZoomDecrease(tileGrid.getMinY(), zoomLevels);
    const maxY = TileBoundingBoxUtils.tileGridMaxZoomDecrease(tileGrid.getMaxY(), zoomLevels);
    return new TileGrid(minX, minY, maxX, maxY);
  }

  /**
   * Get the new tile grid min value starting from the tile grid min and
   * zooming in / increasing the number of levels
   *
   * @param min tile grid min value
   * @param zoomLevels number of zoom levels to increase by
   * @return tile grid min value at new zoom level
   */
  public static tileGridMinZoomIncrease(min: number, zoomLevels: number): number {
    return min * Math.pow(2, zoomLevels);
  }

  /**
   * Get the new tile grid max value starting from the tile grid max and
   * zooming in / increasing the number of levels
   *
   * @param max tile grid max value
   * @param zoomLevels number of zoom levels to increase by
   * @return tile grid max value at new zoom level
   */
  public static tileGridMaxZoomIncrease(max: number, zoomLevels: number): number {
    return (max + 1) * Math.pow(2, zoomLevels) - 1;
  }

  /**
   * Get the new tile grid min value starting from the tile grid min and
   * zooming out / decreasing the number of levels
   *
   * @param min tile grid min value
   * @param zoomLevels number of zoom levels to decrease by
   * @return tile grid min value at new zoom level
   */
  public static tileGridMinZoomDecrease(min: number, zoomLevels: number): number {
    return Math.floor(min / Math.pow(2, zoomLevels));
  }

  /**
   * Get the new tile grid max value starting from the tile grid max and
   * zooming out / decreasing the number of levels
   *
   * @param max tile grid max value
   * @param zoomLevels number of zoom levels to decrease by
   * @return tile grid max value at new zoom level
   */
  public static tileGridMaxZoomDecrease(max: number, zoomLevels: number): number {
    return Math.ceil((max + 1) / Math.pow(2, zoomLevels) - 1);
  }

  /**
   * Get a rectangle using the tile width, height, bounding box, and the
   * bounding box section within the outer box to build the rectangle from
   *
   * @param width width
   * @param height height
   * @param boundingBox full bounding box
   * @param boundingBoxSection rectangle bounding box section
   * @return rectangle
   */
  public static getRectangle(
    width: number,
    height: number,
    boundingBox: BoundingBox,
    boundingBoxSection: BoundingBox,
  ): ImageRectangle {
    return this.getFloatRectangle(width, height, boundingBox, boundingBoxSection).round();
  }

  /**
   * Get a rectangle with floating point boundaries using the tile width,
   * height, bounding box, and the bounding box section within the outer box
   * to build the rectangle from
   *
   * @param width width
   * @param height height
   * @param boundingBox full bounding box
   * @param boundingBoxSection rectangle bounding box section
   * @return floating point rectangle
   */
  public static getFloatRectangle(
    width: number,
    height: number,
    boundingBox: BoundingBox,
    boundingBoxSection: BoundingBox,
  ): ImageRectangle {
    const left = TileBoundingBoxUtils.getXPixel(width, boundingBox, boundingBoxSection.getMinLongitude());
    const right = TileBoundingBoxUtils.getXPixel(width, boundingBox, boundingBoxSection.getMaxLongitude());
    const top = TileBoundingBoxUtils.getYPixel(height, boundingBox, boundingBoxSection.getMaxLatitude());
    const bottom = TileBoundingBoxUtils.getYPixel(height, boundingBox, boundingBoxSection.getMinLatitude());
    return new ImageRectangle(left, top, right, bottom);
  }
}
