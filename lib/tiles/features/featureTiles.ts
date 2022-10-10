// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import simplify from 'simplify-js';
import { FeatureDao } from '../../features/user/featureDao';
import { TileBoundingBoxUtils } from '../tileBoundingBoxUtils';
import { BoundingBox } from '../../boundingBox';
import { IconCache } from '../../extension/nga/style/iconCache';
import { GeometryCache } from './geometryCache';
import { FeatureDrawType } from './featureDrawType';
import { FeaturePaintCache } from './featurePaintCache';
import { Paint } from './paint';
import { FeatureTableStyles } from '../../extension/nga/style/featureTableStyles';
import { FeatureRow } from '../../features/user/featureRow';
import { StyleRow } from '../../extension/nga/style/styleRow';
import { FeatureTilePointIcon } from './featureTilePointIcon';
import { CustomFeaturesTile } from './customFeaturesTile';
import { FeatureStyle } from '../../extension/nga/style/featureStyle';
import { Canvas } from '../../canvas/canvas';
import { Projection, ProjectionConstants, Projections } from '@ngageoint/projections-js';
import {
  CircularString,
  CompoundCurve,
  Geometry,
  GeometryCollection,
  GeometryType,
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
  PolyhedralSurface,
  TIN,
  Triangle
} from '@ngageoint/simple-features-js';
import { GeoPackageException } from '../../geoPackageException';
import { GeometryTransform } from '@ngageoint/simple-features-proj-js';
import { FeatureIndexManager } from '../../features/index/featureIndexManager';
import { TileUtils } from '../tileUtils';
import { FeatureResultSet } from '../../features/user/featureResultSet';
import { GeoPackageImage } from '../../image/geoPackageImage';
import { FeatureIndexResults } from '../../features/index/featureIndexResults';
import { FeatureTileCanvas } from './featureTileCanvas';
import { EmulatedCanvas2D } from '../../../@types/canvaskit';
import type { GeoPackage } from '../../geoPackage';

/**
 * FeatureTiles module.
 * @module tiles/features
 */

/**
 *  Tiles drawn from or linked to features. Used to query features and optionally draw tiles
 *  from those features.
 */
export class FeatureTiles {
  /**
   * WGS84 Projection
   */
  protected static readonly WGS_84_PROJECTION: Projection = Projections.getWGS84Projection();

  /**
   * Web Mercator Projection
   */
  protected static readonly WEB_MERCATOR_PROJECTION: Projection = Projections.getWebMercatorProjection();

  /**
   * Tile data access object
   */
  protected readonly featureDao: FeatureDao;

  /**
   * Feature DAO Projection
   */
  protected projection: Projection;

  /**
   * When not null, features are retrieved using a feature index
   */
  protected indexManager: FeatureIndexManager;

  /**
   * Feature Style extension
   */
  protected featureTableStyles: FeatureTableStyles;

  /**
   * Tile height
   */
  protected tileWidth: number;

  /**
   * Tile height
   */
  protected tileHeight: number;

  /**
   * Compress format
   */
  protected compressFormat: string;

  /**
   * Point radius
   */
  protected pointRadius: number;

  /**
   * Point paint
   */
  protected pointPaint: Paint = new Paint();

  /**
   * Optional point icon in place of a drawn circle
   */
  protected pointIcon: FeatureTilePointIcon;

  /**
   * Line paint
   */
  protected linePaint: Paint = new Paint();

  /**
   * Line stroke width
   */
  protected lineStrokeWidth: number;

  /**
   * Polygon paint
   */
  protected polygonPaint: Paint = new Paint();

  /**
   * Polygon stroke width
   */
  protected polygonStrokeWidth: number;

  /**
   * Fill polygon flag
   */
  protected fillPolygon: boolean;

  /**
   * Polygon fill paint
   */
  protected polygonFillPaint: Paint = new Paint();

  /**
   * Feature paint cache
   */
  private featurePaintCache: FeaturePaintCache = new FeaturePaintCache();

  /**
   * Icon Cache
   */
  private iconCache: IconCache = new IconCache();

  /**
   * Height overlapping pixels between tile images
   */
  protected heightOverlap: number;

  /**
   * Width overlapping pixels between tile images
   */
  protected widthOverlap: number;

  /**
   * Optional max features per tile. When more features than this value exist
   * for creating a single tile, the tile is not created
   */
  protected maxFeaturesPerTile: number;

  /**
   * When not null and the number of features is greater than the max features
   * per tile, used to draw tiles for those tiles with more features than the
   * max
   *
   * @see CustomFeaturesTile
   * @see mil.nga.geopackage.tiles.features.custom.NumberFeaturesTile custom
   *      features tile implementation
   */
  protected maxFeaturesTileDraw: CustomFeaturesTile;

  /**
   * When true, geometries are simplified before being drawn. Default is true
   */
  protected simplifyGeometries = true;

  /**
   * Scale factor
   */
  protected scale = 1.0;

  /**
   * When true, geometries are cached. Default is true
   */
  protected cacheGeometries = true;

  /**
   * Geometry Cache
   * @protected
   */
  protected geometryCache = new GeometryCache();

  /**
   * Constructor
   * @param geoPackage
   * @param featureDao
   * @param width
   * @param height
   * @param scale
   */
  constructor(
    geoPackage: GeoPackage,
    featureDao: FeatureDao,
    width: number = TileUtils.TILE_PIXELS_HIGH,
    height: number = TileUtils.TILE_PIXELS_HIGH,
    scale: number = TileUtils.tileScale(TileUtils.TILE_PIXELS_HIGH, TileUtils.TILE_PIXELS_HIGH),
  ) {
    this.featureDao = featureDao;
    if (featureDao != null) {
      this.projection = featureDao.getProjection();
    }

    this.scale = scale;

    this.tileWidth = width;
    this.tileHeight = height;

    this.compressFormat = 'image/png';

    this.pointRadius = 2.0;
    this.pointPaint.setColor('#000000FF');

    this.lineStrokeWidth = 2.0;
    this.linePaint.setColor('#000000FF');

    this.polygonStrokeWidth = 2.0;
    this.polygonPaint.setStrokeWidth(this.scale * this.polygonStrokeWidth);
    this.polygonPaint.setColor('#000000FF');

    this.fillPolygon = true;
    this.polygonFillPaint.setColor('#00000019');

    if (geoPackage != null) {
      this.indexManager = new FeatureIndexManager(geoPackage, featureDao);
      if (!this.indexManager.isIndexed()) {
        this.indexManager.close();
        this.indexManager = null;
      }

      this.featureTableStyles = new FeatureTableStyles(geoPackage, featureDao.getTable());
      if (!this.featureTableStyles.has()) {
        this.featureTableStyles = null;
      }
    }

    this.calculateDrawOverlap();
  }

  /**
   * Close the feature tiles connection
   */
  public close(): void {
    if (this.indexManager != null) {
      this.indexManager.close();
    }
    this.cleanup();
  }

  /**
   * Will handle disposing any saved icons
   */
  cleanup(): void {
    this.clearIconCache();
    if (this.pointIcon) {
      Canvas.disposeImage(this.pointIcon.getIcon());
      this.pointIcon = null;
    }
  }

  /**
   * Call after making changes to the point icon, point radius, or paint
   *  stroke widths. Determines the pixel overlap between tiles
   */
  calculateDrawOverlap(): void {
    if (this.pointIcon != null) {
      this.heightOverlap = this.scale * this.pointIcon.getHeight();
      this.widthOverlap = this.scale * this.pointIcon.getWidth();
    } else {
      this.heightOverlap = this.scale * this.pointRadius;
      this.widthOverlap = this.scale * this.pointRadius;
    }

    const linePaintHalfStroke = (this.scale * this.lineStrokeWidth) / 2.0;
    this.heightOverlap = Math.max(this.heightOverlap, linePaintHalfStroke);
    this.widthOverlap = Math.max(this.widthOverlap, linePaintHalfStroke);

    const polygonPaintHalfStroke = (this.scale * this.polygonStrokeWidth) / 2.0;
    this.heightOverlap = Math.max(this.heightOverlap, polygonPaintHalfStroke);
    this.widthOverlap = Math.max(this.widthOverlap, polygonPaintHalfStroke);

    if (this.featureTableStyles != null && this.featureTableStyles.has()) {
      // Style Rows
      const styleRowIds: Set<number> = new Set<number>();
      const tableStyleIds = this.featureTableStyles.getAllTableStyleIds();
      if (tableStyleIds != null) {
        tableStyleIds.forEach(id => styleRowIds.add(id));
      }
      const styleIds = this.featureTableStyles.getAllStyleIds();
      if (styleIds != null) {
        styleIds.forEach(id => styleRowIds.add(id));
      }

      const styleDao = this.featureTableStyles.getStyleDao();
      for (const styleRowId of styleRowIds) {
        const styleRow = styleDao.getRow(styleDao.queryForIdRow(styleRowId));
        const styleHalfWidth = this.scale * (styleRow.getWidthOrDefault() / 2.0);
        this.widthOverlap = Math.max(this.widthOverlap, styleHalfWidth);
        this.heightOverlap = Math.max(this.heightOverlap, styleHalfWidth);
      }

      // Icon Rows
      const iconRowIds: Set<number> = new Set<number>();
      const tableIconIds = this.featureTableStyles.getAllTableIconIds();
      if (tableIconIds != null) {
        tableIconIds.forEach(id => iconRowIds.add(id));
      }
      const iconIds = this.featureTableStyles.getAllIconIds();
      if (iconIds != null) {
        iconIds.forEach(id => iconRowIds.add(id));
      }

      const iconDao = this.featureTableStyles.getIconDao();
      for (const iconRowId of iconRowIds) {
        const iconRow = iconDao.getRow(iconDao.queryForIdRow(iconRowId));
        const iconDimensions = iconRow.getDerivedDimensions();
        const iconWidth = this.scale * Math.ceil(iconDimensions[0]);
        const iconHeight = this.scale * Math.ceil(iconDimensions[1]);
        this.widthOverlap = Math.max(this.widthOverlap, iconWidth);
        this.heightOverlap = Math.max(this.heightOverlap, iconHeight);
      }
    }
  }

  /**
   * Set the scale
   *
   * @param {Number} scale scale factor
   */
  setScale(scale: number): void {
    this.scale = scale;
    this.linePaint.setStrokeWidth(scale * this.lineStrokeWidth);
    this.polygonPaint.setStrokeWidth(scale * this.polygonStrokeWidth);
    this.featurePaintCache.clear();
  }

  /**
   * Manually set the width and height draw overlap
   * @param {Number} pixels pixels
   */
  setDrawOverlap(pixels: number): void {
    this.widthOverlap = pixels;
    this.heightOverlap = pixels;
  }

  /**
   * Get the width draw overlap
   * @return {Number} width draw overlap
   */
  getWidthDrawOverlap(): number {
    return this.widthOverlap;
  }
  /**
   * Manually set the width draw overlap
   * @param {Number} pixels pixels
   */
  setWidthDrawOverlap(pixels: number): void {
    this.widthOverlap = pixels;
  }
  /**
   * Get the height draw overlap
   * @return {Number} height draw overlap
   */
  getHeightDrawOverlap(): number {
    return this.heightOverlap;
  }
  /**
   * Manually set the height draw overlap
   * @param {Number} pixels pixels
   */
  setHeightDrawOverlap(pixels: number): void {
    this.heightOverlap = pixels;
  }

  /**
   * Get the feature DAO
   *
   * @return feature dao
   */
  public getFeatureDao(): FeatureDao {
    return this.featureDao;
  }

  /**
   * Is index query
   *
   * @return true if an index query
   */
  public isIndexQuery(): boolean {
    return this.indexManager != null && this.indexManager.isIndexed();
  }

  /**
   * Get the index manager
   *
   * @return index manager or null
   */
  public getIndexManager(): FeatureIndexManager {
    return this.indexManager;
  }

  /**
   * Set the index
   * @param indexManager index manager
   */
  public setIndexManager(indexManager: FeatureIndexManager): void {
    this.indexManager = indexManager;
  }

  /**
   * Ignore the feature table styles within the GeoPackage
   */
  ignoreFeatureTableStyles(): void {
    this.featureTableStyles = null;
    this.calculateDrawOverlap();
  }
  /**
   * Clear all caches
   */
  clearCache(): void {
    this.clearStylePaintCache();
    this.clearIconCache();
  }
  /**
   * Clear the style paint cache
   */
  clearStylePaintCache(): void {
    this.featurePaintCache.clear();
  }

  /**
   * Set the style paint cache size
   * @param {Number} size
   */
  setStylePaintCacheSize(size: number): void {
    this.featurePaintCache.resize(size);
  }
  /**
   * Clear the icon cache
   */
  clearIconCache(): void {
    this.iconCache.clear();
  }
  /**
   * Set / resize the icon cache size
   * @param {Number} size new size
   */
  setIconCacheSize(size: number): void {
    this.iconCache.resize(size);
  }

  /**
   * Gets the scale
   */
  getScale(): number {
    return this.scale;
  }

  /**
   * Set geometry cache's max size
   * @param {Number} maxSize
   */
  setGeometryCacheMaxSize(maxSize: number): void {
    this.geometryCache.resize(maxSize);
  }

  /**
   * Set draw overlap with pixels
   * @param pixels
   */
  setDrawOverlapWithPixels(pixels: number): void {
    this.widthOverlap = pixels;
    this.heightOverlap = pixels;
  }

  getFeatureStyle(featureRow: FeatureRow, geometryType: GeometryType): FeatureStyle {
    let featureStyle = null;
    if (this.featureTableStyles != null) {
      featureStyle = this.featureTableStyles.getFeatureStyle(featureRow.id, geometryType);
    }
    return featureStyle;
  }
  /**
   * Get the point paint for the feature style, or return the default paint
   * @param featureStyle feature style
   * @return paint
   */
  getPointPaint(featureStyle: FeatureStyle): Paint {
    let paint = this.getFeatureStylePaint(featureStyle, FeatureDrawType.CIRCLE);
    if (paint == null) {
      paint = this.pointPaint;
    }
    return paint;
  }
  /**
   * Get the line paint for the feature style, or return the default paint
   * @param featureStyle feature style
   * @return paint
   */
  getLinePaint(featureStyle: FeatureStyle): Paint {
    let paint = this.getFeatureStylePaint(featureStyle, FeatureDrawType.STROKE);
    if (paint == null) {
      paint = this.linePaint;
    }
    return paint;
  }
  /**
   * Get the polygon paint for the feature style, or return the default paint
   * @param featureStyle feature style
   * @return paint
   */
  getPolygonPaint(featureStyle: FeatureStyle): Paint {
    let paint = this.getFeatureStylePaint(featureStyle, FeatureDrawType.STROKE);
    if (paint == null) {
      paint = this.polygonPaint;
    }
    return paint;
  }
  /**
   * Get the polygon fill paint for the feature style, or return the default
   * paint
   * @param featureStyle feature style
   * @return paint
   */
  getPolygonFillPaint(featureStyle: FeatureStyle): Paint {
    let paint = null;
    let hasStyleColor = false;
    if (featureStyle != null) {
      const style = featureStyle.style;
      if (style != null) {
        if (style.hasFillColor()) {
          paint = this.getStylePaint(style, FeatureDrawType.FILL);
        } else {
          hasStyleColor = style.hasColor();
        }
      }
    }
    if (paint === null && !hasStyleColor && this.fillPolygon) {
      paint = this.polygonFillPaint;
    }
    return paint;
  }
  /**
   * Get the feature style paint from cache, or create and cache it
   * @param featureStyle feature style
   * @param drawType draw type
   * @return feature style paint
   */
  getFeatureStylePaint(featureStyle: FeatureStyle, drawType: FeatureDrawType): Paint {
    let paint = null;
    if (featureStyle != null) {
      const style = featureStyle.style;
      if (style != null && style.hasColor()) {
        paint = this.getStylePaint(style, drawType);
      }
    }
    return paint;
  }
  /**
   * Get the style paint from cache, or create and cache it
   * @param style style row
   * @param drawType draw type
   * @return {Paint} paint
   */
  getStylePaint(style: StyleRow, drawType: FeatureDrawType): Paint {
    let paint = this.featurePaintCache.getPaintForStyleRow(style, drawType);
    if (paint === undefined || paint === null) {
      let color = null;
      let strokeWidth = null;
      if (drawType === FeatureDrawType.CIRCLE) {
        color = style.getColor();
      } else if (drawType === FeatureDrawType.STROKE) {
        color = style.getColor();
        strokeWidth = this.scale * style.getWidthOrDefault();
      } else if (drawType === FeatureDrawType.FILL) {
        color = style.getFillColor();
        strokeWidth = this.scale * style.getWidthOrDefault();
      } else {
        throw new GeoPackageException('Unsupported Draw Type: ' + drawType);
      }
      const stylePaint = new Paint();
      stylePaint.setColor(color);
      if (strokeWidth != null) {
        stylePaint.setStrokeWidth(strokeWidth);
      }
      paint = this.featurePaintCache.getPaintForStyleRow(style, drawType);
      if (paint === undefined || paint === null) {
        this.featurePaintCache.setPaintForStyleRow(style, drawType, stylePaint);
        paint = stylePaint;
      }
    }
    return paint;
  }
  /**
   * Get point color
   * @return {String} color
   */
  getPointColor(): string {
    return this.pointPaint.getColor();
  }
  /**
   * Set point color
   * @param {String} pointColor point color
   */
  setPointColor(pointColor: string): void {
    this.pointPaint.setColor(pointColor);
  }
  /**
   * Get line stroke width
   * @return {Number} width
   */
  getLineStrokeWidth(): number {
    return this.lineStrokeWidth;
  }
  /**
   * Set line stroke width
   * @param {Number} lineStrokeWidth line stroke width
   */
  setLineStrokeWidth(lineStrokeWidth: number): void {
    this.lineStrokeWidth = lineStrokeWidth;
    this.linePaint.setStrokeWidth(this.scale * this.lineStrokeWidth);
  }
  /**
   * Get line color
   * @return {String} color
   */
  getLineColor(): string {
    return this.linePaint.getColor();
  }
  /**
   * Set line color
   * @param {String} lineColor line color
   */
  setLineColor(lineColor: string): void {
    this.linePaint.setColor(lineColor);
  }
  /**
   * Get polygon stroke width
   * @return {Number} width
   */
  getPolygonStrokeWidth(): number {
    return this.polygonStrokeWidth;
  }
  /**
   * Set polygon stroke width
   * @param {Number} polygonStrokeWidth polygon stroke width
   */
  setPolygonStrokeWidth(polygonStrokeWidth: number): void {
    this.polygonStrokeWidth = polygonStrokeWidth;
    this.polygonPaint.setStrokeWidth(this.scale * polygonStrokeWidth);
  }
  /**
   * Get polygon color
   * @return {String} color
   */
  getPolygonColor(): string {
    return this.polygonPaint.getColor();
  }
  /**
   * Set polygon color
   * @param {String} polygonColor polygon color
   */
  setPolygonColor(polygonColor: string): void {
    this.polygonPaint.setColor(polygonColor);
  }
  /**
   * Get polygon fill color
   * @return {String} color
   */
  getPolygonFillColor(): string {
    return this.polygonFillPaint.getColor();
  }
  /**
   * Set polygon fill color
   * @param {String} polygonFillColor polygon fill color
   */
  setPolygonFillColor(polygonFillColor: string): void {
    this.polygonFillPaint.setColor(polygonFillColor);
  }

  /**
   * Gets the count of features for the given xyz tile
   * @param x
   * @param y
   * @param z
   */
  getFeatureCount(x: number, y: number, z: number): number {
    let boundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBox(x, y, z);
    boundingBox = this.expandBoundingBox(boundingBox);
    return this.indexManager.countWithBoundingBoxAndProjection(
      false,
      undefined,
      boundingBox,
      FeatureTiles.WEB_MERCATOR_PROJECTION,
    );
  }

  /**
   * Gets the count of features for the given xyz tile
   * @param x
   * @param y
   * @param z
   */
  getFeatureCountWGS84(x: number, y: number, z: number): number {
    let boundingBox = TileBoundingBoxUtils.getWGS84BoundingBox(x, y, z);
    boundingBox = this.expandBoundingBoxWithProjection(boundingBox, FeatureTiles.WGS_84_PROJECTION);
    return this.indexManager.countWithBoundingBoxAndProjection(
      false,
      undefined,
      boundingBox,
      FeatureTiles.WGS_84_PROJECTION,
    );
  }

  /**
   * Renders the web mercator (EPSG:3857) xyz tile
   * @param x
   * @param y
   * @param z
   * @param canvas
   */
  async drawTile(
    x: number,
    y: number,
    z: number,
    canvas?: HTMLCanvasElement | OffscreenCanvas | EmulatedCanvas2D,
  ): Promise<Uint8Array> {
    if (this.isIndexQuery()) {
      return this.drawTileQueryIndex(x, y, z, canvas);
    } else {
      return this.drawTileQueryAll(x, y, z, canvas);
    }
  }

  /**
   * Renders the wgs84 (EPSG:4326) xyz tile
   * @param x
   * @param y
   * @param z
   * @param canvas
   */
  async drawTileWGS84(
    x: number,
    y: number,
    z: number,
    canvas?: HTMLCanvasElement | OffscreenCanvas | EmulatedCanvas2D,
  ): Promise<Uint8Array> {
    if (this.isIndexQuery()) {
      return this.drawTileQueryIndexWGS84(x, y, z, canvas);
    } else {
      return this.drawTileQueryAllWGS84(x, y, z, canvas);
    }
  }

  /**
   * Draw a tile image from the x, y, and zoom level by querying all features.
   * This could be very slow if there are a lot of features
   *
   * @param x x coordinate
   * @param y y coordinate
   * @param zoom zoom level
   * @param canvas (draw directly into a canvas)
   * @return drawn image, or null
   */
  async drawTileQueryAll(
    x: number,
    y: number,
    zoom: number,
    canvas?: HTMLCanvasElement | OffscreenCanvas | EmulatedCanvas2D,
  ): Promise<Uint8Array> {
    const boundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBox(x, y, zoom);
    const resultSet: FeatureResultSet = this.featureDao.queryForAll();
    let image = null;
    try {
      const totalCount = resultSet.getCount();
      // Draw if at least one geometry exists
      if (totalCount > 0) {
        if (this.maxFeaturesPerTile == null || totalCount <= this.maxFeaturesPerTile) {
          // Draw the tile image
          image = this.drawTileWithFeatureResultSet(
            zoom,
            boundingBox,
            resultSet,
            FeatureTiles.WEB_MERCATOR_PROJECTION,
            canvas,
          );
        } else if (this.maxFeaturesTileDraw != null) {
          // Draw the unindexed max features tile
          image = this.maxFeaturesTileDraw.drawUnindexedTile(
            this.tileWidth,
            this.tileHeight,
            totalCount,
            resultSet,
            canvas,
          );
        }
      }
    } finally {
      resultSet.close();
    }
    return image;
  }

  /**
   * Draw a tile image from the x, y, and zoom level by querying all features.
   * This could be very slow if there are a lot of features
   *
   * @param x x coordinate
   * @param y y coordinate
   * @param zoom zoom level
   * @param canvas (draw directly into a canvas)
   * @return drawn image, or null
   */
  async drawTileQueryAllWGS84(
    x: number,
    y: number,
    zoom: number,
    canvas?: HTMLCanvasElement | OffscreenCanvas | EmulatedCanvas2D,
  ): Promise<Uint8Array> {
    const boundingBox = TileBoundingBoxUtils.getWGS84BoundingBox(x, y, zoom);
    const resultSet: FeatureResultSet = this.featureDao.queryForAll();
    let image = null;
    try {
      const totalCount = resultSet.getCount();
      // Draw if at least one geometry exists
      if (totalCount > 0) {
        if (this.maxFeaturesPerTile == null || totalCount <= this.maxFeaturesPerTile) {
          // Draw the tile image
          image = this.drawTileWithFeatureResultSet(zoom, boundingBox, resultSet, FeatureTiles.WGS_84_PROJECTION);
        } else if (this.maxFeaturesTileDraw != null) {
          // Draw the unindexed max features tile
          image = this.maxFeaturesTileDraw.drawUnindexedTile(
            this.tileWidth,
            this.tileHeight,
            totalCount,
            resultSet,
            canvas,
          );
        }
      }
    } finally {
      resultSet.close();
    }
    return image;
  }

  /**
   * Draw a web mercator xyz tile.
   * @param x
   * @param y
   * @param zoom
   * @param canvas
   */
  async drawTileQueryIndex(
    x: number,
    y: number,
    zoom: number,
    canvas?: HTMLCanvasElement | OffscreenCanvas | EmulatedCanvas2D,
  ): Promise<Uint8Array> {
    let image;
    const boundingBox = TileBoundingBoxUtils.getBoundingBox(x, y, zoom);

    // Query for the geometry count matching the bounds in the index
    const tileCount = this.queryIndexedFeaturesCountWithBoundingBox(boundingBox, FeatureTiles.WEB_MERCATOR_PROJECTION);

    // Draw if at least one geometry exists
    if (tileCount > 0) {
      // Query for geometries matching the bounds in the index
      const results = this.queryIndexedFeaturesWithBoundingBox(boundingBox, FeatureTiles.WEB_MERCATOR_PROJECTION);
      try {
        if (this.maxFeaturesPerTile == null || tileCount <= this.maxFeaturesPerTile) {
          // Draw the tile image
          image = this.drawTileWithFeatureIndexResults(
            zoom,
            boundingBox,
            results,
            FeatureTiles.WEB_MERCATOR_PROJECTION,
            canvas,
          );
        } else if (this.maxFeaturesTileDraw != null) {
          // Draw the max features tile
          image = this.maxFeaturesTileDraw.drawTile(this.tileWidth, this.tileHeight, tileCount, results, canvas);
        }
      } finally {
        results.close();
      }
    }
    return image;
  }

  async drawTileQueryIndexWGS84(
    x: number,
    y: number,
    zoom: number,
    canvas?: HTMLCanvasElement | OffscreenCanvas | EmulatedCanvas2D,
  ): Promise<Uint8Array> {
    let image;
    const boundingBox = TileBoundingBoxUtils.getWGS84BoundingBox(x, y, zoom);
    // Query for the geometry count matching the bounds in the index
    const tileCount = this.queryIndexedFeaturesCountWithBoundingBox(boundingBox, FeatureTiles.WGS_84_PROJECTION);
    // Draw if at least one geometry exists
    if (tileCount > 0) {
      // Query for geometries matching the bounds in the index
      const results = this.queryIndexedFeaturesWithBoundingBox(boundingBox, FeatureTiles.WGS_84_PROJECTION);
      try {
        if (this.maxFeaturesPerTile == null || tileCount <= this.maxFeaturesPerTile) {
          // Draw the tile image
          image = this.drawTileWithFeatureIndexResults(
            zoom,
            boundingBox,
            results,
            FeatureTiles.WGS_84_PROJECTION,
            canvas,
          );
        } else if (this.maxFeaturesTileDraw != null) {
          // Draw the max features tile
          image = this.maxFeaturesTileDraw.drawTile(this.tileWidth, this.tileHeight, tileCount, results, canvas);
        }
      } finally {
        results.close();
      }
    }
    return image;
  }

  /**
   * Query for feature result count in the WebMercator x, y, and zoom tile
   * @param x x coordinate
   * @param y y coordinate
   * @param zoom zoom level
   * @return feature count
   */
  public queryIndexedFeaturesCount(x: number, y: number, zoom: number): number {
    // Get the web mercator bounding box
    const boundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBox(x, y, zoom);
    // Query for the count of geometries matching the bounds in the index
    return this.queryIndexedFeaturesCountWithBoundingBox(boundingBox, FeatureTiles.WEB_MERCATOR_PROJECTION);
  }

  /**
   * Query for feature result count in the WGS84 x, y, and zoom tile
   * @param x x coordinate
   * @param y y coordinate
   * @param zoom zoom level
   * @return feature count
   */
  public queryIndexedFeaturesCountWGS84(x: number, y: number, zoom: number): number {
    // Get the web mercator bounding box
    const boundingBox = TileBoundingBoxUtils.getWGS84BoundingBox(x, y, zoom);
    // Query for the count of geometries matching the bounds in the index
    return this.queryIndexedFeaturesCountWithBoundingBox(boundingBox, FeatureTiles.WGS_84_PROJECTION);
  }

  /**
   * Query for feature result count in the bounding box
   * @param boundingBox bounding box
   * @param projection Projection
   * @return count
   */
  public queryIndexedFeaturesCountWithBoundingBox(boundingBox: BoundingBox, projection: Projection): number {
    // Create an expanded bounding box to handle features outside the tile
    // that overlap
    const expandedQueryBoundingBox = this.expandBoundingBoxWithProjection(boundingBox, projection);
    // Count for geometries matching the bounds in the index
    return this.indexManager.countWithBoundingBoxAndProjection(false, undefined, expandedQueryBoundingBox, projection);
  }

  /**
   * Query for feature results in the x, y, and zoom
   * @param x x coordinate
   * @param y y coordinate
   * @param zoom zoom level
   * @return feature count
   */
  public queryIndexedFeatures(x: number, y: number, zoom: number): FeatureIndexResults {
    // Get the web mercator bounding box
    const webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBox(x, y, zoom);
    // Query for the geometries matching the bounds in the index
    return this.queryIndexedFeaturesWithBoundingBox(webMercatorBoundingBox, FeatureTiles.WEB_MERCATOR_PROJECTION);
  }

  /**
   * Query for feature results in the x, y, and zoom
   * @param x x coordinate
   * @param y y coordinate
   * @param zoom zoom level
   * @return feature count
   */
  public queryIndexedFeaturesWGS84(x: number, y: number, zoom: number): FeatureIndexResults {
    // Get the wgs84 bounding box
    const webMercatorBoundingBox = TileBoundingBoxUtils.getWGS84BoundingBox(x, y, zoom);
    // Query for the geometries matching the bounds in the index
    return this.queryIndexedFeaturesWithBoundingBox(webMercatorBoundingBox, FeatureTiles.WGS_84_PROJECTION);
  }

  /**
   * Query for feature results in the bounding box
   * @param boundingBox bounding box
   * @param projection bounding box projection
   * @return geometry index results
   */
  public queryIndexedFeaturesWithBoundingBox(boundingBox: BoundingBox, projection: Projection): FeatureIndexResults {
    // Create an expanded bounding box to handle features outside the tile
    // that overlap
    const expandedQueryBoundingBox = this.expandBoundingBoxWithProjection(boundingBox, projection);
    // Query for geometries matching the bounds in the index
    return this.indexManager.queryWithBoundingBoxAndProjection(false, undefined, expandedQueryBoundingBox, projection);
  }

  /**
   * {@inheritDoc}
   */
  public async drawTileWithFeatureIndexResults(
    zoom: number,
    boundingBox: BoundingBox,
    results: FeatureIndexResults,
    projection: Projection,
    canvas?: HTMLCanvasElement | OffscreenCanvas | EmulatedCanvas2D,
  ): Promise<GeoPackageImage> {
    const featureTileCanvas = new FeatureTileCanvas(this.tileWidth, this.tileHeight, canvas);
    // Feature projection to tile projection transform
    const transform = GeometryTransform.create(this.projection, projection);
    const expandedBoundingBox = this.expandBoundingBoxWithProjection(boundingBox, projection);
    let drawn = false;
    for (const featureRow of results) {
      if (await this.drawFeature(zoom, boundingBox, expandedBoundingBox, transform, featureTileCanvas, featureRow)) {
        drawn = true;
      }
    }
    results.close();
    let image = null;
    if (drawn) {
      image = featureTileCanvas.createImage();
    }
    // only dispose of the canvas if it was created here
    if (canvas == null) {
      featureTileCanvas.dispose();
    }
    return image;
  }

  /**
   * {@inheritDoc}
   */
  public async drawTileWithFeatureResultSet(
    zoom: number,
    boundingBox: BoundingBox,
    resultSet: FeatureResultSet,
    projection: Projection,
    canvas?: HTMLCanvasElement | OffscreenCanvas | EmulatedCanvas2D,
  ): Promise<GeoPackageImage> {
    const featureTileCanvas = new FeatureTileCanvas(this.tileWidth, this.tileHeight, canvas);
    // Feature projection to tile projection transform
    const transform = GeometryTransform.create(this.projection, projection);
    const expandedBoundingBox = this.expandBoundingBoxWithProjection(boundingBox, projection);
    let drawn = false;
    while (resultSet.moveToNext()) {
      const row = resultSet.getRow();
      if (await this.drawFeature(zoom, boundingBox, expandedBoundingBox, transform, featureTileCanvas, row)) {
        drawn = true;
      }
    }
    resultSet.close();
    let image = null;
    if (drawn) {
      image = featureTileCanvas.createImage();
    }
    return image;
  }

  /**
   * {@inheritDoc}
   */
  public async drawTileWithFeatures(
    zoom: number,
    boundingBox: BoundingBox,
    featureRow: FeatureRow[],
    projection: Projection,
    canvas?: HTMLCanvasElement | OffscreenCanvas | EmulatedCanvas2D,
  ): Promise<GeoPackageImage> {
    const featureTileCanvas = new FeatureTileCanvas(this.tileWidth, this.tileHeight, canvas);
    // Feature projection to tile projection transform
    const transform = GeometryTransform.create(this.projection, projection);
    const expandedBoundingBox = this.expandBoundingBoxWithProjection(boundingBox, projection);
    let drawn = false;
    for (const row of featureRow) {
      if (await this.drawFeature(zoom, boundingBox, expandedBoundingBox, transform, featureTileCanvas, row)) {
        drawn = true;
      }
    }
    let image = null;
    if (drawn) {
      image = featureTileCanvas.createImage();
    }
    return image;
  }

  /**
   * Draw the feature
   *
   * @param zoom zoom level
   * @param boundingBox bounding box
   * @param expandedBoundingBox expanded bounding box
   * @param transform geometry transform
   * @param canvas canvas to draw on
   * @param row feature row
   * @return true if at least one feature was drawn
   */
  private async drawFeature(
    zoom: number,
    boundingBox: BoundingBox,
    expandedBoundingBox: BoundingBox,
    transform: GeometryTransform,
    canvas: FeatureTileCanvas,
    row: FeatureRow,
  ): Promise<boolean> {
    let drawn = false;
    try {
      let geomData = null;
      let transformedBoundingBox = null;
      let rowId = -1;
      // Check the cache for the geometry data
      if (this.cacheGeometries) {
        rowId = row.getId();
        geomData = this.geometryCache.getGeometryData(rowId);
        if (geomData != null) {
          transformedBoundingBox = geomData.getBoundingBox();
        }
      }
      if (geomData == null) {
        // Read the geometry
        geomData = row.getGeometry();
      }
      if (geomData != null) {
        const geometry = geomData.getGeometry();
        if (geometry != null) {
          if (transformedBoundingBox == null) {
            const geometryBoundingBox = geomData.getOrBuildBoundingBox();
            transformedBoundingBox = geometryBoundingBox.transform(transform);
            if (this.cacheGeometries) {
              // Set the geometry envelope to the transformed bounding box
              geomData.setEnvelope(transformedBoundingBox.buildEnvelope());
            }
          }
          if (this.cacheGeometries) {
            // Cache the geometry
            this.geometryCache.setGeometryData(rowId, geomData);
          }
          if (expandedBoundingBox.intersects(transformedBoundingBox, true)) {
            const simplifyTolerance = TileBoundingBoxUtils.toleranceDistance(zoom, this.tileWidth, this.tileHeight);
            drawn = await this.drawGeometry(simplifyTolerance, boundingBox, transform, canvas, row, geometry);
          }
        }
      }
    } catch (e) {
      console.error('Failed to draw feature in tile. Table: ' + this.featureDao.getTableName());
    }
    return drawn;
  }

  /**
   * Create an expanded bounding box to handle features outside the tile that overlap
   * @param boundingBox bounding box
   * @param projection bounding box projection
   * @return bounding box
   */
  public expandBoundingBoxWithProjection(boundingBox: BoundingBox, projection: Projection): BoundingBox {
    let expandedBoundingBox = boundingBox;
    const toWebMercator = GeometryTransform.create(projection, ProjectionConstants.EPSG_WEB_MERCATOR);
    if (!projection.equalsProjection(Projections.getWebMercatorProjection())) {
      expandedBoundingBox = expandedBoundingBox.transform(toWebMercator);
    }
    expandedBoundingBox = this.expandBoundingBox(expandedBoundingBox);
    if (!projection.equalsProjection(FeatureTiles.WEB_MERCATOR_PROJECTION)) {
      const fromWebMercator = toWebMercator.getInverseTransformation();
      expandedBoundingBox = expandedBoundingBox.transform(fromWebMercator);
    }

    return expandedBoundingBox;
  }

  /**
   * Create an expanded bounding box to handle features outside the tile that overlap
   * @param boundingBox web mercator bounding box
   * @return bounding box
   */
  public expandBoundingBox(boundingBox: BoundingBox): BoundingBox {
    return this.expandBoundingBoxWithinTileBoundingBox(boundingBox, boundingBox);
  }

  /**
   * Handles the generation of a function for transforming coordinates from the source projection into the target tile's
   * projection. These coordinates are then converted into pixel coordinates.
   * @param projection
   */
  getTransformFunction(projection: Projection): Function {
    if (this.projection.equalsProjection(projection)) {
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      return coordinate => coordinate;
    } else if (Projections.isWebMercator(projection) && Projections.isWGS84(this.projection)) {
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      return coordinate => {
        return GeometryTransform.create(this.projection, projection).transform(
          Math.max(
            -ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH,
            Math.min(ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH, coordinate[0]),
          ),
          Math.max(
            ProjectionConstants.WEB_MERCATOR_MIN_LAT_RANGE,
            Math.min(ProjectionConstants.WEB_MERCATOR_MAX_LAT_RANGE, coordinate[1]),
          ),
        );
      };
    } else {
      return GeometryTransform.create(this.projection, projection).transform;
    }
  }

  /**
   * Draw the point
   * @param boundingBox bounding box
   * @param transform function
   * @param canvas feature tile canvas
   * @param point point
   * @param featureStyle feature style
   * @return true if drawn
   */
  private async drawPoint(
    boundingBox: BoundingBox,
    transform: GeometryTransform,
    canvas: FeatureTileCanvas,
    point: Point,
    featureStyle: FeatureStyle,
  ): Promise<boolean> {
    let drawn = false;
    const projectedPoint = transform.transformPoint(point);
    const x = TileBoundingBoxUtils.getXPixel(this.tileWidth, boundingBox, projectedPoint[0]);
    const y = TileBoundingBoxUtils.getYPixel(this.tileHeight, boundingBox, projectedPoint[1]);

    if (featureStyle != null && featureStyle.useIcon()) {
      const iconRow = featureStyle.icon;
      const icon = await this.iconCache.createIcon(iconRow);

      const width = icon.getWidth();
      const height = icon.getHeight();

      if (x >= 0 - width && x <= this.tileWidth + width && y >= 0 - height && y <= this.tileHeight + height) {
        const anchorU = iconRow.getAnchorUOrDefault();
        const anchorV = iconRow.getAnchorVOrDefault();
        const iconX = Math.round(x - anchorU * width);
        const iconY = Math.round(y - anchorV * height);
        const iconCanvas = canvas.getIconCanvas();
        const iconCanvasContext = iconCanvas.getContext('2d');
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        iconCanvasContext.drawImage(icon.getImage(), iconX, iconY, width, height);
        drawn = true;
      }
    } else if (this.pointIcon != null) {
      const width = Math.round(this.scale * this.pointIcon.getWidth());
      const height = Math.round(this.scale * this.pointIcon.getHeight());
      if (x >= 0 - width && x <= this.tileWidth + width && y >= 0 - height && y <= this.tileHeight + height) {
        const iconX = Math.round(x - this.scale * this.pointIcon.getXOffset());
        const iconY = Math.round(y - this.scale * this.pointIcon.getYOffset());
        const iconCanvas = canvas.getIconCanvas();
        const iconCanvasContext = iconCanvas.getContext('2d');
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        iconCanvasContext.drawImage(this.pointIcon.getIcon().getImage(), iconX, iconY, width, height);
        drawn = true;
      }
    } else {
      let radius = null;
      if (featureStyle != null) {
        const styleRow = featureStyle.style;
        if (styleRow != null) {
          radius = this.scale * (styleRow.getWidthOrDefault() / 2.0);
        }
      }
      if (radius == null) {
        radius = this.scale * this.pointRadius;
      }
      if (x >= 0 - radius && x <= this.tileWidth + radius && y >= 0 - radius && y <= this.tileHeight + radius) {
        const pointCanvas = canvas.getPointCanvas();
        const pointCanvasContext = pointCanvas.getContext('2d');
        pointCanvasContext.save();
        const pointPaint = this.getPointPaint(featureStyle);
        const circleX = Math.round(x);
        const circleY = Math.round(y);
        pointCanvasContext.beginPath();
        pointCanvasContext.arc(circleX, circleY, radius, 0, 2 * Math.PI, true);
        pointCanvasContext.closePath();
        pointCanvasContext.fillStyle = pointPaint.getColorRGBA();
        pointCanvasContext.fill();
        pointCanvasContext.restore();
        drawn = true;
      }
    }

    return drawn;
  }

  /**
   * Simplify x,y tile coordinates by 1 pixel
   * @param simplifyTolerance simplify tolerance in meters
   * @param coordinates ordered points
   * @return simplified GeoJSON
   */
  simplifyPoints(simplifyTolerance: number, coordinates: any): any | null {
    if (this.simplifyGeometries) {
      coordinates = simplify(
        coordinates.map(coordinate => {
          return { x: coordinate[0], y: coordinate[1] };
        }),
        simplifyTolerance,
        false,
      ).map(point => [point.x, point.y]);
    }
    return coordinates;
  }

  getLength(pointA: Point, pointB: Point): number {
    return Math.sqrt(Math.pow(pointB.x - pointA.x, 2) - Math.pow(pointB.y - pointA.y, 2));
  }

  /**
   * Returns the radius of the 3 points of the arc
   * @param pointA
   * @param pointB
   * @param pointC
   */
  getRadius(pointA: Point, pointB: Point, pointC: Point): number {
    const yDeltaA = pointB.y - pointA.y;
    const xDeltaA = pointB.x - pointA.x;
    const yDeltaB = pointC.y - pointB.y;
    const xDeltaB = pointC.x - pointB.x;
    const center = new Point();
    let radius = -1;
    if (Math.abs(xDeltaA) <= 0.000000001 && Math.abs(yDeltaB) <= 0.000000001) {
      center.x = (pointB.x + pointC.x) / 2.0;
      center.y = (pointA.y + pointB.y) / 2.0;
      radius = this.getLength(center, pointA);
    } else {
      const aSlope = yDeltaA / xDeltaA;
      const bSlope = yDeltaB / xDeltaB;
      center.x =
        (aSlope * bSlope * (pointA.y - pointC.y) + bSlope * (pointA.x + pointB.x) - aSlope * (pointB.x + pointC.x)) /
        (2 * (bSlope - aSlope));
      center.y = (-1 * (center.x - (pointA.x + pointB.x) / 2)) / aSlope + (pointA.y + pointB.y) / 2;
      radius = this.getLength(center, pointA);
    }
    return radius;
  }

  /**
   * Get the slope of two Points
   * @param pointA
   * @param pointB
   */
  getSlope(pointA: Point, pointB: Point): number {
    return (pointB.y - pointA.y) / (pointB.x - pointA.x);
  }

  /**
   * Checks if a circular segment is collinear
   * @param pointA
   * @param pointB
   * @param pointC
   */
  isCollinear(pointA: Point, pointB: Point, pointC: Point): boolean {
    return (
      this.getSlope(pointA, pointB) === this.getSlope(pointB, pointC) &&
      this.getSlope(pointB, pointC) === this.getSlope(pointC, pointA)
    );
  }

  /**
   * Checks if a circular segment shall be treated as a line segment
   * @param pointA
   * @param pointB
   * @param pointC
   */
  isLineSegment(pointA: Point, pointB: Point, pointC: Point): boolean {
    return (
      (pointA.equals(pointB) && !pointB.equals(pointC)) ||
      (pointB.equals(pointC) && !pointB.equals(pointA)) ||
      this.isCollinear(pointA, pointB, pointC)
    );
  }

  /**
   * Get the path of the line string
   * @param simplifyTolerance
   * @param boundingBox
   * @param transform
   * @param context
   * @param circularString
   */
  getArcPath(
    simplifyTolerance: number,
    boundingBox: BoundingBox,
    transform: GeometryTransform,
    context: any,
    circularString: LineString,
  ): void {
    // ensure the circular string is valid
    if (circularString.points.length <= 1 || circularString.points.length % 2 === 0) {
      return;
    }
    const coordinates = circularString.points.map(point => {
      const transformedCoordinate = transform.transformPoint(point);
      return new Point(
        TileBoundingBoxUtils.getXPixel(this.tileWidth, boundingBox, transformedCoordinate[0]),
        TileBoundingBoxUtils.getYPixel(this.tileHeight, boundingBox, transformedCoordinate[1]),
      );
    });

    for (let i = 0; i < coordinates.length - 2; i += 2) {
      if (i === 0) {
        context.moveTo(coordinates[0][0], coordinates[0][1]);
      }
      if (this.isLineSegment(coordinates[i], coordinates[i + 1], coordinates[i + 2])) {
        context.lineTo(coordinates[i + 1][0], coordinates[i + 1][1]);
        context.lineTo(coordinates[i + 2][0], coordinates[i + 2][1]);
      } else {
        const radius = this.getRadius(coordinates[i], coordinates[i + 1], coordinates[i + 2]);
        context.arcTo(
          coordinates[i + 1][0],
          coordinates[i + 1][1],
          coordinates[i + 2][0],
          coordinates[i + 2][1],
          radius,
        );
      }
    }
  }

  /**
   * Get the path of the line string
   * @param simplifyTolerance
   * @param boundingBox
   * @param transform
   * @param context
   * @param lineString
   */
  getPath(
    simplifyTolerance: number,
    boundingBox: BoundingBox,
    transform: GeometryTransform,
    context: any,
    lineString: LineString,
  ): void {
    let coordinates = lineString.points.map(point => {
      const transformedCoordinate = transform.transformPoint(point);
      return [
        TileBoundingBoxUtils.getXPixel(this.tileWidth, boundingBox, transformedCoordinate[0]),
        TileBoundingBoxUtils.getYPixel(this.tileHeight, boundingBox, transformedCoordinate[1]),
      ];
    });
    coordinates = this.simplifyPoints(simplifyTolerance, coordinates);
    if (coordinates.length > 1) {
      context.moveTo(coordinates[0][0], coordinates[0][1]);
      for (let i = 1; i < coordinates.length; i++) {
        context.lineTo(coordinates[i][0], coordinates[i][1]);
      }
    }
  }

  /**
   * Draw a LineString
   *
   * @param simplifyTolerance simplify tolerance in meters
   * @param boundingBox bounding box
   * @param transform geometry transform
   * @param context context
   * @param lineString line string
   * @param featureStyle feature style
   * @return true if drawn
   */
  private drawLineString(
    simplifyTolerance: number,
    boundingBox: BoundingBox,
    transform,
    context: any,
    lineString: LineString,
    featureStyle,
  ): boolean {
    return this.drawLine(simplifyTolerance, boundingBox, transform, context, lineString, featureStyle);
  }

  /**
   * Draw a CircularString
   *
   * @param simplifyTolerance simplify tolerance in meters
   * @param boundingBox bounding box
   * @param transform geometry transform
   * @param context context
   * @param lineString line string
   * @param featureStyle feature style
   * @return true if drawn
   */
  private drawCircularString(
    simplifyTolerance: number,
    boundingBox: BoundingBox,
    transform,
    context: any,
    lineString: LineString,
    featureStyle,
  ): boolean {
    return this.drawArcs(simplifyTolerance, boundingBox, transform, context, lineString, featureStyle);
  }

  /**
   * Draw a line in the context
   * @param simplifyTolerance
   * @param boundingBox
   * @param transform
   * @param context
   * @param geometry
   * @param featureStyle
   */
  drawLine(
    simplifyTolerance: number,
    boundingBox: BoundingBox,
    transform: GeometryTransform,
    context: any,
    geometry: LineString,
    featureStyle: FeatureStyle,
  ): boolean {
    let drawn = true;
    try {
      context.save();
      context.beginPath();
      const paint = this.getLinePaint(featureStyle);
      context.strokeStyle = paint.getColorRGBA();
      context.lineWidth = paint.getStrokeWidth();
      this.getPath(simplifyTolerance, boundingBox, transform, context, geometry);
      context.stroke();
      context.closePath();
      context.restore();
    } catch (e) {
      drawn = false;
    }
    return drawn;
  }

  /**
   * Draw a line in the context
   * @param simplifyTolerance
   * @param boundingBox
   * @param transform
   * @param context
   * @param geometry
   * @param featureStyle
   */
  drawArcs(
    simplifyTolerance: number,
    boundingBox: BoundingBox,
    transform: GeometryTransform,
    context: any,
    geometry: LineString,
    featureStyle: FeatureStyle,
  ): boolean {
    let drawn = true;
    try {
      context.save();
      context.beginPath();
      const paint = this.getLinePaint(featureStyle);
      context.strokeStyle = paint.getColorRGBA();
      context.lineWidth = paint.getStrokeWidth();
      this.getArcPath(simplifyTolerance, boundingBox, transform, context, geometry);
      context.stroke();
      context.closePath();
      context.restore();
    } catch (e) {
      drawn = false;
    }
    return drawn;
  }

  /**
   * Adapted from turf's booleanClockwise function to support the LineString GeometryType
   * @param line
   */
  booleanClockwise(line: LineString): boolean {
    const ring = line.points;
    let sum = 0;
    let i = 1;
    let prev;
    let cur;

    while (i < ring.length) {
      prev = cur || ring[0];
      cur = ring[i];
      sum += (cur.x - prev.x) * (cur.y + prev.y);
      i++;
    }
    return sum > 0;
  }

  /**
   * Draw a polygon in the context
   * @param simplifyTolerance
   * @param boundingBox
   * @param transform
   * @param context
   * @param featureStyle
   * @param polygon
   */
  drawPolygon(
    simplifyTolerance: number,
    boundingBox: BoundingBox,
    transform: GeometryTransform,
    context: any,
    polygon: Polygon,
    featureStyle: FeatureStyle,
  ): boolean {
    // get paint
    context.save();
    context.beginPath();
    let exteriorRing = polygon.getExteriorRing();
    if (!this.booleanClockwise(exteriorRing)) {
      exteriorRing = new LineString(exteriorRing.points.reverse());
    }
    this.getPath(simplifyTolerance, boundingBox, transform, context, exteriorRing);
    context.closePath();
    for (let i = 0; i < polygon.numInteriorRings(); i++) {
      let interiorRing = polygon.getInteriorRing(i);
      if (this.booleanClockwise(interiorRing)) {
        interiorRing = new LineString(interiorRing.points.reverse());
      }
      this.getPath(simplifyTolerance, boundingBox, transform, context, interiorRing);
      context.closePath();
    }
    const fillPaint = this.getPolygonFillPaint(featureStyle);
    if (fillPaint !== undefined && fillPaint != null) {
      context.fillStyle = fillPaint.getColorRGBA();
      context.fill();
    }
    const paint = this.getPolygonPaint(featureStyle);
    context.strokeStyle = paint.getColorRGBA();
    context.lineWidth = paint.getStrokeWidth();
    context.stroke();
    context.restore();
    return true;
  }

  /**
   * Add a feature to the batch
   * @param simplifyTolerance
   * @param boundingBox
   * @param transform
   * @param context
   * @param geometry
   * @param featureRow
   */
  async drawGeometry(
    simplifyTolerance: number,
    boundingBox: BoundingBox,
    transform: GeometryTransform,
    context: any,
    featureRow: FeatureRow,
    geometry: Geometry,
  ): Promise<boolean> {
    let drawn = false;
    const geometryType = geometry.geometryType;
    const featureStyle = this.getFeatureStyle(featureRow, geometry.geometryType);
    switch (geometryType) {
      case GeometryType.POINT:
        drawn = await this.drawPoint(boundingBox, transform, context, geometry as Point, featureStyle);
        break;
      case GeometryType.LINESTRING:
        drawn = this.drawLineString(
          simplifyTolerance,
          boundingBox,
          transform,
          context,
          geometry as LineString,
          featureStyle,
        );
        break;
      case GeometryType.POLYGON:
        drawn = this.drawPolygon(simplifyTolerance, boundingBox, transform, context, geometry as Polygon, featureStyle);
        break;
      case GeometryType.MULTIPOINT:
        for (const p of (geometry as MultiPoint).points) {
          drawn = (await this.drawPoint(boundingBox, transform, context, p, featureStyle)) || drawn;
        }
        break;
      case GeometryType.MULTILINESTRING:
        const multiLineString = geometry as MultiLineString;
        for (const ls of multiLineString.lineStrings) {
          drawn = this.drawLineString(simplifyTolerance, boundingBox, transform, context, ls, featureStyle) || drawn;
        }
        break;
      case GeometryType.MULTIPOLYGON:
        const multiPolygon = geometry as MultiPolygon;
        for (const p of multiPolygon.polygons) {
          drawn = this.drawPolygon(simplifyTolerance, boundingBox, transform, context, p, featureStyle) || drawn;
        }
        break;
      case GeometryType.CIRCULARSTRING:
        const circularString = geometry as CircularString;
        drawn = this.drawCircularString(
          simplifyTolerance,
          boundingBox,
          transform,
          context,
          circularString,
          featureStyle,
        );
        break;
      case GeometryType.COMPOUNDCURVE:
        const compoundCurve = geometry as CompoundCurve;
        for (const ls of compoundCurve.lineStrings) {
          drawn = this.drawLineString(simplifyTolerance, boundingBox, transform, context, ls, featureStyle) || drawn;
        }
        break;
      case GeometryType.POLYHEDRALSURFACE:
        const polyhedralSurface = geometry as PolyhedralSurface;
        for (const p of polyhedralSurface.polygons) {
          drawn = this.drawPolygon(simplifyTolerance, boundingBox, transform, context, p, featureStyle) || drawn;
        }
        break;
      case GeometryType.TIN:
        const tin = geometry as TIN;
        for (const p of tin.polygons) {
          drawn = this.drawPolygon(simplifyTolerance, boundingBox, transform, context, p, featureStyle) || drawn;
        }
        break;
      case GeometryType.TRIANGLE:
        const triangle = geometry as Triangle;
        drawn = this.drawPolygon(simplifyTolerance, boundingBox, transform, context, triangle, featureStyle);
        break;
      case GeometryType.GEOMETRYCOLLECTION:
        const geometryCollection = geometry as GeometryCollection<Geometry>;
        for (const g of geometryCollection.geometries) {
          drawn = (await this.drawGeometry(simplifyTolerance, boundingBox, transform, context, featureRow, g)) || drawn;
        }
        break;
      default:
        throw new GeoPackageException('Unsupported Geometry Type: ' + GeometryType.nameFromType(geometry.geometryType));
    }

    return drawn;
  }

  /**
   * Create an expanded web mercator bounding box to handle features outside the tile that overlap
   * @param boundingBox bounding box
   * @param tileBoundingBox bounding box
   * @return {BoundingBox} bounding box
   */
  expandBoundingBoxWithinTileBoundingBox(boundingBox: BoundingBox, tileBoundingBox: BoundingBox): BoundingBox {
    // Create an expanded bounding box to handle features outside the tile that overlap
    let minLongitude = TileBoundingBoxUtils.getLongitudeFromPixelWithTileBoundingBox(
      this.tileWidth,
      boundingBox,
      tileBoundingBox,
      0 - this.widthOverlap,
    );
    let maxLongitude = TileBoundingBoxUtils.getLongitudeFromPixelWithTileBoundingBox(
      this.tileWidth,
      boundingBox,
      tileBoundingBox,
      this.tileWidth + this.widthOverlap,
    );
    let maxLatitude = TileBoundingBoxUtils.getLatitudeFromPixelWithTileBoundingBox(
      this.tileHeight,
      boundingBox,
      tileBoundingBox,
      0 - this.heightOverlap,
    );
    let minLatitude = TileBoundingBoxUtils.getLatitudeFromPixelWithTileBoundingBox(
      this.tileHeight,
      boundingBox,
      tileBoundingBox,
      this.tileHeight + this.heightOverlap,
    );

    // Choose the most expanded longitudes and latitudes
    minLongitude = Math.min(minLongitude, boundingBox.getMinLongitude());
    maxLongitude = Math.max(maxLongitude, boundingBox.getMaxLongitude());
    minLatitude = Math.min(minLatitude, boundingBox.getMinLatitude());
    maxLatitude = Math.max(maxLatitude, boundingBox.getMaxLatitude());

    // Bound with the web mercator limits
    return TileBoundingBoxUtils.boundWebMercatorBoundingBox(
      new BoundingBox(minLongitude, minLatitude, maxLongitude, maxLatitude),
    );
  }
}
