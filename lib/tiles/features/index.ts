import concat from 'concat-stream';
import reproject from 'reproject';
import PolyToLine from '@turf/polygon-to-line';
import Simplify from '@turf/simplify';
import proj4 from 'proj4';

import { FeatureDao } from '../../features/user/featureDao';
import { TileBoundingBoxUtils } from '../tileBoundingBoxUtils';
import { BoundingBox } from '../../boundingBox';
import { ImageUtils } from '../imageUtils';
import IconCache from '../../extension/style/iconCache';
import { GeometryCache } from './geometryCache';
import { FeatureDrawType } from './featureDrawType';
import FeaturePaintCache from './featurePaintCache';
import { Paint } from './paint';
import { FeatureTableStyles } from '../../extension/style/featureTableStyles';
import { GeoPackage } from '../../geoPackage';
import { FeatureRow } from '../../features/user/featureRow';
import { StyleRow } from '../../extension/style/styleRow';
import { FeatureTilePointIcon } from './featureTilePointIcon';
import { CustomFeaturesTile } from './custom/customFeaturesTile';
import FeatureStyle from '../../extension/style/featureStyle';
/**
 * FeatureTiles module.
 * @module tiles/features
 */

/**
 *  Tiles drawn from or linked to features. Used to query features and optionally draw tiles
 *  from those features.
 */
export class FeatureTiles {
  private static readonly isElectron: boolean = !!(
    typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf(' electron/') > -1
  );
  private static readonly isNode: boolean = typeof process !== 'undefined' && !!process.version;
  private static readonly useNodeCanvas: boolean = FeatureTiles.isNode && !FeatureTiles.isElectron;
  projection: any = null;
  simplifyGeometries = true;
  compressFormat = 'png';
  pointRadius = 4.0;
  pointPaint: Paint = new Paint();
  pointIcon: FeatureTilePointIcon = null;
  linePaint: Paint = new Paint();
  lineStrokeWidth = 2.0;
  polygonPaint: Paint = new Paint();
  polygonStrokeWidth = 2.0;
  fillPolygon = true;
  polygonFillPaint: Paint = new Paint();
  featurePaintCache: FeaturePaintCache = new FeaturePaintCache();
  geometryCache: GeometryCache = new GeometryCache();
  cacheGeometries = true;
  iconCache: IconCache = new IconCache();
  scale = 1.0;
  geoPackage: GeoPackage;
  featureTableStyles: any;
  maxFeaturesPerTile: number = null;
  maxFeaturesTileDraw: any = null;
  widthOverlap: number;
  heightOverlap: number;
  constructor(
    public featureDao: FeatureDao<FeatureRow>,
    public tileWidth: number = 256,
    public tileHeight: number = 256,
  ) {
    this.projection = this.featureDao.projection;
    this.linePaint.setStrokeWidth(2.0);
    this.polygonPaint.setStrokeWidth(2.0);
    this.polygonFillPaint.setColor('#00000011');
    this.geoPackage = this.featureDao.geoPackage;
    if (this.geoPackage != null) {
      this.featureTableStyles = new FeatureTableStyles(this.geoPackage, this.featureDao.getTable());
      if (!this.featureTableStyles.has()) {
        this.featureTableStyles = null;
      }
    }
    this.calculateDrawOverlap();
  }
  /**
   * Manually set the width and height draw overlap
   * @param {Number} pixels pixels
   */
  setDrawOverlap(pixels: number): void {
    this.setWidthDrawOverlap(pixels);
    this.setHeightDrawOverlap(pixels);
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
   * @return {module:features/user/featureDao} feature dao
   */
  getFeatureDao(): FeatureDao<FeatureRow> {
    return this.featureDao;
  }
  /**
   * Get the feature table styles
   * @return {module:extension/style~FeatureTableStyles} feature table styles
   */
  getFeatureTableStyles(): FeatureTableStyles {
    return this.featureTableStyles;
  }
  /**
   * Set the feature table styles
   * @param {module:extension/style~FeatureTableStyles} featureTableStyles feature table styles
   */
  setFeatureTableStyles(featureTableStyles: FeatureTableStyles): void {
    this.featureTableStyles = featureTableStyles;
  }
  /**
   * Ignore the feature table styles within the GeoPackage
   */
  ignoreFeatureTableStyles(): void {
    this.setFeatureTableStyles(null);
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
   * Set / resize the style paint cache size
   *
   * @param {Number} size
   * @since 3.3.0
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
   * Get the tile width
   * @return {Number} tile width
   */
  getTileWidth(): number {
    return this.tileWidth;
  }
  /**
   * Set the tile width
   * @param {Number} tileWidth tile width
   */
  setTileWidth(tileWidth: number): void {
    this.tileWidth = tileWidth;
  }
  /**
   * Get the tile height
   * @return {Number} tile height
   */
  getTileHeight(): number {
    return this.tileHeight;
  }
  /**
   * Set the tile height
   * @param {Number} tileHeight tile height
   */
  setTileHeight(tileHeight: number): void {
    this.tileHeight = tileHeight;
  }
  /**
   * Get the compress format
   * @return {String} compress format
   */
  getCompressFormat(): string {
    return this.compressFormat;
  }
  /**
   * Set the compress format
   * @param {String} compressFormat compress format
   */
  setCompressFormat(compressFormat: string): void {
    this.compressFormat = compressFormat;
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
   * Set CacheGeometries flag. When set to true, geometries will be cached.
   * @param {Boolean} cacheGeometries
   */
  setCacheGeometries(cacheGeometries: boolean): void {
    this.cacheGeometries = cacheGeometries;
  }

  /**
   * Set geometry cache's max size
   * @param {Number} maxSize
   */
  setGeometryCacheMaxSize(maxSize: number): void {
    this.geometryCache.resize(maxSize);
  }
  /**
   * Set SimplifyGeometries flag. When set to true, geometries will be simplified when possible.
   * @param {Boolean} simplifyGeometries
   */
  setSimplifyGeometries(simplifyGeometries: boolean): void {
    this.simplifyGeometries = simplifyGeometries;
  }
  /**
   * Get the scale
   * @return {Number} scale factor
   */
  getScale(): number {
    return this.scale;
  }
  calculateDrawOverlap(): void {
    if (this.pointIcon) {
      this.heightOverlap = this.scale * this.pointIcon.getHeight();
      this.widthOverlap = this.scale * this.pointIcon.getWidth();
    } else {
      this.heightOverlap = this.scale * this.pointRadius;
      this.widthOverlap = this.scale * this.pointRadius;
    }
    const lineHalfStroke = (this.scale * this.lineStrokeWidth) / 2.0;
    this.heightOverlap = Math.max(this.heightOverlap, lineHalfStroke);
    this.widthOverlap = Math.max(this.widthOverlap, lineHalfStroke);
    const polygonHalfStroke = (this.scale * this.polygonStrokeWidth) / 2.0;
    this.heightOverlap = Math.max(this.heightOverlap, polygonHalfStroke);
    this.widthOverlap = Math.max(this.widthOverlap, polygonHalfStroke);
    if (this.featureTableStyles !== null && this.featureTableStyles.has()) {
      let styleRowIds = [];
      const tableStyleIds = this.featureTableStyles.getAllTableStyleIds();
      if (tableStyleIds !== null) {
        styleRowIds = styleRowIds.concat(tableStyleIds);
      }
      const styleIds = this.featureTableStyles.getAllStyleIds();
      if (styleIds != null) {
        styleRowIds = styleRowIds.concat(styleIds.filter(id => styleRowIds.indexOf(id) === -1));
      }
      const styleDao = this.featureTableStyles.getStyleDao();
      for (let i = 0; i < styleRowIds.length; i++) {
        const styleRowId = styleRowIds[i];
        const styleRow = styleDao.queryForId(styleRowId);
        const styleHalfWidth = this.scale * (styleRow.getWidthOrDefault() / 2.0);
        this.widthOverlap = Math.max(this.widthOverlap, styleHalfWidth);
        this.heightOverlap = Math.max(this.heightOverlap, styleHalfWidth);
      }
      let iconRowIds = [];
      const tableIconIds = this.featureTableStyles.getAllTableIconIds();
      if (tableIconIds != null) {
        iconRowIds = iconRowIds.concat(tableIconIds);
      }
      const iconIds = this.featureTableStyles.getAllIconIds();
      if (iconIds != null) {
        iconRowIds = iconRowIds.concat(iconIds.filter(id => iconRowIds.indexOf(id) === -1));
      }
      const iconDao = this.featureTableStyles.getIconDao();
      for (let i = 0; i < iconRowIds.length; i++) {
        const iconRowId = iconRowIds[i];
        const iconRow = iconDao.queryForId(iconRowId);
        const iconDimensions = iconRow.getDerivedDimensions();
        const iconWidth = this.scale * Math.ceil(iconDimensions[0]);
        const iconHeight = this.scale * Math.ceil(iconDimensions[1]);
        this.widthOverlap = Math.max(this.widthOverlap, iconWidth);
        this.heightOverlap = Math.max(this.heightOverlap, iconHeight);
      }
    }
  }
  setDrawOverlapsWithPixels(pixels: number): void {
    this.widthOverlap = pixels;
    this.heightOverlap = pixels;
  }
  getFeatureStyle(featureRow: FeatureRow): FeatureStyle {
    let featureStyle = null;
    if (this.featureTableStyles !== null) {
      featureStyle = this.featureTableStyles.getFeatureStyleForFeatureRow(featureRow);
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
    if (paint === null) {
      paint = this.linePaint;
    }
    return paint;
  }
  /**
   * Get the polygon paint for the feature style, or return the default paint
   * @param featureStyle feature style
   * @return paint
   */
  getPolygonPaint(featureStyle: any): Paint {
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
      const style = featureStyle.getStyle();
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
      const style = featureStyle.getStyle();
      if (style !== null && style.hasColor()) {
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
        throw new Error('Unsupported Draw Type: ' + drawType);
      }
      const stylePaint = new Paint();
      stylePaint.setColor(color);
      if (strokeWidth !== null) {
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
   * Get the point radius
   * @return {Number} radius
   */
  getPointRadius(): number {
    return this.pointRadius;
  }
  /**
   * Set the point radius
   * @param {Number} pointRadius point radius
   */
  setPointRadius(pointRadius: number): void {
    this.pointRadius = pointRadius;
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
   * Get the point icon
   * @return {module:tiles/features.FeatureTilePointIcon} icon
   */
  getPointIcon(): FeatureTilePointIcon {
    return this.pointIcon;
  }
  /**
   * Set the point icon
   * @param {module:tiles/features.FeatureTilePointIcon} pointIcon point icon
   */
  setPointIcon(pointIcon: FeatureTilePointIcon): void {
    this.pointIcon = pointIcon;
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
    this.polygonPaint.setStrokeWidth(this.scale * this.polygonStrokeWidth);
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
   * Is fill polygon
   * @return {Boolean} true if fill polygon
   */
  isFillPolygon(): boolean {
    return this.fillPolygon;
  }
  /**
   * Set the fill polygon
   * @param {Boolean} fillPolygon fill polygon
   */
  setFillPolygon(fillPolygon: boolean): void {
    this.fillPolygon = fillPolygon;
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
   * Get the max features per tile
   * @return {Number} max features per tile or null
   */
  getMaxFeaturesPerTile(): number {
    return this.maxFeaturesPerTile;
  }
  /**
   * Set the max features per tile. When more features are returned in a query
   * to create a single tile, the tile is not created.
   * @param {Number} maxFeaturesPerTile  max features per tile
   */
  setMaxFeaturesPerTile(maxFeaturesPerTile: number): void {
    this.maxFeaturesPerTile = maxFeaturesPerTile;
  }
  /**
   * Get the max features tile draw, the custom tile drawing implementation
   * for tiles with more features than the max at #getMaxFeaturesPerTile
   * @return {module:tiles/features/custom~CustomFeatureTile} max features tile draw or null
   */
  getMaxFeaturesTileDraw(): CustomFeaturesTile {
    return this.maxFeaturesTileDraw;
  }
  /**
   * Set the max features tile draw, used to draw tiles when more features for
   * a single tile than the max at #getMaxFeaturesPerTile exist
   * @param {module:tiles/features/custom~CustomFeatureTile} maxFeaturesTileDraw max features tile draw
   */
  setMaxFeaturesTileDraw(maxFeaturesTileDraw: CustomFeaturesTile): void {
    this.maxFeaturesTileDraw = maxFeaturesTileDraw;
  }
  getFeatureCountXYZ(x: number, y: number, z: number): number {
    let boundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, z);
    boundingBox = this.expandBoundingBox(boundingBox);
    return this.featureDao.countWebMercatorBoundingBox(boundingBox);
  }
  async drawTile(x: number, y: number, z: number, canvas = null): Promise<any> {
    const indexed = this.featureDao.isIndexed();
    if (indexed) {
      return this.drawTileQueryIndex(x, y, z, canvas);
    } else {
      return this.drawTileQueryAll(x, y, z, canvas);
    }
  }
  async drawTileQueryAll(x: number, y: number, zoom: number, canvas?: any): Promise<any> {
    let boundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
    boundingBox = this.expandBoundingBox(boundingBox);
    const count = this.featureDao.getCount();
    if (this.maxFeaturesPerTile === null || count <= this.maxFeaturesPerTile) {
      return this.drawTileWithBoundingBox(boundingBox, zoom, canvas);
    } else if (this.maxFeaturesTileDraw !== null) {
      return this.maxFeaturesTileDraw.drawUnindexedTile(256, 256, canvas);
    }
  }
  webMercatorTransform(geoJson: any): any {
    return reproject.reproject(geoJson, this.projection, proj4('EPSG:3857'));
  }

  async drawTileQueryIndex(x: number, y: number, z: number, tileCanvas?: any): Promise<any> {
    const boundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, z);
    const expandedBoundingBox = this.expandBoundingBox(boundingBox);
    const width = 256;
    const height = 256;
    const simplifyTolerance = TileBoundingBoxUtils.toleranceDistanceWidthAndHeight(z, width, height);

    let canvas;
    if (tileCanvas !== null) {
      canvas = tileCanvas;
    }
    if (canvas === undefined || canvas === null) {
      if (FeatureTiles.useNodeCanvas) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Canvas = require('canvas');
        canvas = Canvas.createCanvas(width, height);
      } else {
        canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
      }
    }
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, width, height);
    const tileCount = this.featureDao.countWebMercatorBoundingBox(expandedBoundingBox);
    if (this.maxFeaturesPerTile === null || tileCount <= this.maxFeaturesPerTile) {
      const iterator = this.featureDao.fastQueryWebMercatorBoundingBox(expandedBoundingBox);
      for (const featureRow of iterator) {
        let geojson = null;
        if (this.cacheGeometries) {
          geojson = this.geometryCache.getGeometryForFeatureRow(featureRow);
        }
        if (geojson === undefined || geojson === null) {
          geojson = featureRow.getGeometry().geometry.toGeoJSON();
          this.geometryCache.setGeometry(featureRow.getId(), geojson);
        }
        const style = this.getFeatureStyle(featureRow);
        await this.drawGeometry(
          simplifyTolerance,
          geojson,
          context,
          this.webMercatorTransform.bind(this),
          boundingBox,
          style,
        );
      }
      return new Promise(resolve => {
        if (FeatureTiles.useNodeCanvas) {
          const writeStream = concat(function(buffer) {
            resolve(buffer);
          });
          let stream = null;
          if (this.compressFormat === 'png') {
            stream = canvas.createPNGStream();
          } else {
            stream = canvas.createJPEGStream();
          }
          stream.pipe(writeStream);
        } else {
          resolve(canvas.toDataURL('image/' + this.compressFormat));
        }
      });
    } else if (this.maxFeaturesTileDraw !== null) {
      // Draw the max features tile
      return this.maxFeaturesTileDraw.drawTile(width, height, tileCount, canvas);
    }
  }
  async drawTileWithBoundingBox(boundingBox: BoundingBox, zoom: number, tileCanvas?: any): Promise<any> {
    const width = 256;
    const height = 256;
    const simplifyTolerance = TileBoundingBoxUtils.toleranceDistanceWidthAndHeight(zoom, width, height);

    let canvas;
    if (tileCanvas !== null) {
      canvas = tileCanvas;
    }
    if (canvas === undefined || canvas === null) {
      if (FeatureTiles.useNodeCanvas) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Canvas = require('canvas');
        canvas = Canvas.createCanvas(width, height);
      } else {
        canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
      }
    }
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, width, height);
    const featureDao = this.featureDao;
    const each = featureDao.queryForEach();
    const featureRows = [];
    for (const row of each) {
      featureRows.push(featureDao.getRow(row));
    }
    for (const fr of featureRows) {
      let gj = null;
      if (this.cacheGeometries) {
        gj = this.geometryCache.getGeometryForFeatureRow(fr);
      }
      if (gj === undefined || gj === null) {
        gj = fr.getGeometry().geometry.toGeoJSON();
        this.geometryCache.setGeometry(fr.getId(), gj);
      }
      const style = this.getFeatureStyle(fr);
      await this.drawGeometry(simplifyTolerance, gj, context, this.webMercatorTransform.bind(this), boundingBox, style);
    }
    return new Promise(resolve => {
      if (FeatureTiles.useNodeCanvas) {
        const writeStream = concat(function(buffer) {
          resolve(buffer);
        });
        let stream = null;
        if (this.compressFormat === 'png') {
          stream = canvas.createPNGStream();
        } else {
          stream = canvas.createJPEGStream();
        }
        stream.pipe(writeStream);
      } else {
        resolve(canvas.toDataURL('image/' + this.compressFormat));
      }
    });
  }
  /**
   * Draw a point in the context
   * @param geoJson
   * @param context
   * @param boundingBox
   * @param featureStyle
   * @param transform
   */
  async drawPoint(
    geoJson: any,
    context: any,
    boundingBox: BoundingBox,
    featureStyle: FeatureStyle,
    transform: Function,
  ): Promise<void> {
    let width;
    let height;
    let iconX;
    let iconY;
    const transformedGeoJson = transform(geoJson);
    const x = TileBoundingBoxUtils.getXPixel(this.tileWidth, boundingBox, transformedGeoJson.coordinates[0]);
    const y = TileBoundingBoxUtils.getYPixel(this.tileHeight, boundingBox, transformedGeoJson.coordinates[1]);
    if (featureStyle !== undefined && featureStyle !== null && featureStyle.hasIcon()) {
      const iconRow = featureStyle.getIcon();
      const image = await this.iconCache.createIcon(iconRow);
      width = Math.round(this.scale * iconRow.getWidth());
      height = Math.round(this.scale * iconRow.getHeight());
      if (x >= 0 - width && x <= this.tileWidth + width && y >= 0 - height && y <= this.tileHeight + height) {
        const anchorU = iconRow.getAnchorUOrDefault();
        const anchorV = iconRow.getAnchorVOrDefault();
        iconX = Math.round(x - anchorU * width);
        iconY = Math.round(y - anchorV * height);
        context.drawImage(image, iconX, iconY, width, height);
      }
    } else if (this.pointIcon !== undefined && this.pointIcon !== null) {
      width = Math.round(this.scale * this.pointIcon.getWidth());
      height = Math.round(this.scale * this.pointIcon.getHeight());
      if (x >= 0 - width && x <= this.tileWidth + width && y >= 0 - height && y <= this.tileHeight + height) {
        iconX = Math.round(x - this.scale * this.pointIcon.getXOffset());
        iconY = Math.round(y - this.scale * this.pointIcon.getYOffset());
        ImageUtils.scaleBitmap(this.pointIcon.getIcon(), this.scale).then(image => {
          context.drawImage(image, iconX, iconY, width, height);
        });
      }
    } else {
      context.save();
      let radius = null;
      if (featureStyle !== undefined && featureStyle !== null) {
        const styleRow = featureStyle.getStyle();
        if (styleRow !== undefined && styleRow !== null) {
          radius = this.scale * (styleRow.getWidthOrDefault() / 2.0);
        }
      }
      if (radius == null) {
        radius = this.scale * this.pointRadius;
      }
      const pointPaint = this.getPointPaint(featureStyle);
      if (x >= 0 - radius && x <= this.tileWidth + radius && y >= 0 - radius && y <= this.tileHeight + radius) {
        const circleX = Math.round(x);
        const circleY = Math.round(y);
        context.beginPath();
        context.arc(circleX, circleY, radius, 0, 2 * Math.PI, true);
        context.closePath();
        context.fillStyle = pointPaint.getColorRGBA();
        context.fill();
      }
      context.restore();
    }
  }

  /**
   * When the simplify tolerance is set, simplify the points to a similar
   * curve with fewer points.
   * @param simplifyTolerance simplify tolerance in meters
   * @param lineString GeoJSON
   * @return simplified GeoJSON
   * @since 2.0.0
   */
  simplifyPoints(simplifyTolerance: number, lineString: any): any {
    let simplifiedGeoJSON = null;
    const shouldProject = this.projection !== null && this.featureDao.getSrs().organization_coordsys_id !== 3857;
    if (this.simplifyGeometries) {
      // Reproject to web mercator if not in meters
      if (shouldProject) {
        lineString = reproject.reproject(lineString, this.projection, proj4('EPSG:3857'));
      }
      simplifiedGeoJSON = Simplify(lineString, {
        tolerance: simplifyTolerance,
        highQuality: false,
        mutate: false,
      });
      // Reproject back to the original projection
      if (shouldProject) {
        simplifiedGeoJSON = reproject.reproject(simplifiedGeoJSON, proj4('EPSG:3857'), this.projection);
      }
    } else {
      simplifiedGeoJSON = lineString;
    }
    return simplifiedGeoJSON;
  }

  /**
   * Get the path of the line string
   * @param simplifyTolerance simplify tolerance in meters
   * @param transform
   * @param lineString
   * @param context
   * @param boundingBox
   */
  getPath(
    simplifyTolerance: number,
    lineString: any,
    transform: Function,
    context: any,
    boundingBox: BoundingBox,
  ): void {
    const simplifiedLineString = transform(this.simplifyPoints(simplifyTolerance, lineString));
    if (simplifiedLineString.coordinates.length > 0) {
      let coordinate = simplifiedLineString.coordinates[0];
      let x = TileBoundingBoxUtils.getXPixel(this.tileWidth, boundingBox, coordinate[0]);
      let y = TileBoundingBoxUtils.getYPixel(this.tileHeight, boundingBox, coordinate[1]);
      context.moveTo(x, y);
      for (let i = 1; i < simplifiedLineString.coordinates.length; i++) {
        coordinate = simplifiedLineString.coordinates[i];
        x = TileBoundingBoxUtils.getXPixel(this.tileWidth, boundingBox, coordinate[0]);
        y = TileBoundingBoxUtils.getYPixel(this.tileHeight, boundingBox, coordinate[1]);
        context.lineTo(x, y);
      }
    }
  }
  /**
   * Draw a line in the context
   * @param simplifyTolerance
   * @param geoJson
   * @param context
   * @param featureStyle
   * @param transform
   * @param boundingBox
   */
  drawLine(
    simplifyTolerance: number,
    geoJson: any,
    context: any,
    featureStyle: FeatureStyle,
    transform: Function,
    boundingBox: BoundingBox,
  ): void {
    context.save();
    context.beginPath();
    const paint = this.getLinePaint(featureStyle);
    context.strokeStyle = paint.getColorRGBA();
    context.lineWidth = paint.getStrokeWidth();
    this.getPath(simplifyTolerance, geoJson, transform, context, boundingBox);
    context.stroke();
    context.closePath();
    context.restore();
  }
  /**
   * Draw a polygon in the context
   * @param simplifyTolerance
   * @param geoJson
   * @param context
   * @param featureStyle
   * @param transform
   * @param boundingBox
   */
  drawPolygon(
    simplifyTolerance: any,
    geoJson: any,
    context: any,
    featureStyle: FeatureStyle,
    transform: Function,
    boundingBox: BoundingBox,
  ): void {
    context.save();
    context.beginPath();
    this.getPath(simplifyTolerance, geoJson, transform, context, boundingBox);
    context.closePath();
    const fillPaint = this.getPolygonFillPaint(featureStyle);
    if (fillPaint !== undefined && fillPaint !== null) {
      context.fillStyle = fillPaint.getColorRGBA();
      context.fill();
    }
    const paint = this.getPolygonPaint(featureStyle);
    context.strokeStyle = paint.getColorRGBA();
    context.lineWidth = paint.getStrokeWidth();
    context.stroke();
    context.restore();
  }
  /**
   * Add a feature to the batch
   * @param simplifyTolerance
   * @param geoJson
   * @param context
   * @param transform
   * @param boundingBox
   * @param featureStyle
   */
  async drawGeometry(
    simplifyTolerance: number,
    geoJson: any,
    context: any,
    transform: Function,
    boundingBox: BoundingBox,
    featureStyle: FeatureStyle,
  ): Promise<void> {
    let i, lsGeom, converted;

    if (geoJson.type === 'Point') {
      await this.drawPoint(geoJson, context, boundingBox, featureStyle, transform);
    } else if (geoJson.type === 'LineString') {
      this.drawLine(simplifyTolerance, geoJson, context, featureStyle, transform, boundingBox);
    } else if (geoJson.type === 'Polygon') {
      converted = PolyToLine(geoJson);
      if (converted.geometry.type === 'LineString') {
        this.drawPolygon(simplifyTolerance, converted.geometry, context, featureStyle, transform, boundingBox);
      } else if (converted.geometry.type === 'MultiLineString') {
        for (i = 0; i < converted.geometry.coordinates.length; i++) {
          lsGeom = {
            type: 'LineString',
            coordinates: converted.geometry.coordinates[i],
          };
          this.drawPolygon(simplifyTolerance, lsGeom, context, featureStyle, transform, boundingBox);
        }
      }
    } else if (geoJson.type === 'MultiPoint') {
      for (i = 0; i < geoJson.coordinates.length; i++) {
        await this.drawGeometry(
          simplifyTolerance,
          {
            type: 'Point',
            coordinates: geoJson.coordinates[i],
          },
          context,
          transform,
          boundingBox,
          featureStyle,
        );
      }
    } else if (geoJson.type === 'MultiLineString') {
      for (i = 0; i < geoJson.coordinates.length; i++) {
        await this.drawGeometry(
          simplifyTolerance,
          {
            type: 'LineString',
            coordinates: geoJson.coordinates[i],
          },
          context,
          transform,
          boundingBox,
          featureStyle,
        );
      }
    } else if (geoJson.type === 'MultiPolygon') {
      for (i = 0; i < geoJson.coordinates.length; i++) {
        await this.drawGeometry(
          simplifyTolerance,
          {
            type: 'Polygon',
            coordinates: geoJson.coordinates[i],
          },
          context,
          transform,
          boundingBox,
          featureStyle,
        );
      }
    }
  }
  /**
   * Create an expanded bounding box to handle features outside the tile that overlap
   * @param webMercatorBoundingBox  web mercator bounding box
   * @return {BoundingBox} bounding box
   */
  expandBoundingBox(webMercatorBoundingBox: BoundingBox): BoundingBox {
    return this.expandWebMercatorBoundingBox(webMercatorBoundingBox, webMercatorBoundingBox);
  }
  /**
   * Create an expanded bounding box to handle features outside the tile that overlap
   * @param webMercatorBoundingBox web mercator bounding box
   * @param tileWebMercatorBoundingBox  tile web mercator bounding box
   * @return {BoundingBox} bounding box
   */
  expandWebMercatorBoundingBox(
    webMercatorBoundingBox: BoundingBox,
    tileWebMercatorBoundingBox: BoundingBox,
  ): BoundingBox {
    // Create an expanded bounding box to handle features outside the tile  that overlap
    let minLongitude = TileBoundingBoxUtils.getLongitudeFromPixel(
      this.tileWidth,
      webMercatorBoundingBox,
      tileWebMercatorBoundingBox,
      0 - this.widthOverlap,
    );
    let maxLongitude = TileBoundingBoxUtils.getLongitudeFromPixel(
      this.tileWidth,
      webMercatorBoundingBox,
      tileWebMercatorBoundingBox,
      this.tileWidth + this.widthOverlap,
    );
    let maxLatitude = TileBoundingBoxUtils.getLatitudeFromPixel(
      this.tileHeight,
      webMercatorBoundingBox,
      tileWebMercatorBoundingBox,
      0 - this.heightOverlap,
    );
    let minLatitude = TileBoundingBoxUtils.getLatitudeFromPixel(
      this.tileHeight,
      webMercatorBoundingBox,
      tileWebMercatorBoundingBox,
      this.tileHeight + this.heightOverlap,
    );
    // Choose the most expanded longitudes and latitudes
    minLongitude = Math.min(minLongitude, webMercatorBoundingBox.minLongitude);
    maxLongitude = Math.max(maxLongitude, webMercatorBoundingBox.maxLongitude);
    minLatitude = Math.min(minLatitude, webMercatorBoundingBox.minLatitude);
    maxLatitude = Math.max(maxLatitude, webMercatorBoundingBox.maxLatitude);
    // Bound with the web mercator limits
    minLongitude = Math.max(minLongitude, -1 * TileBoundingBoxUtils.WEB_MERCATOR_HALF_WORLD_WIDTH);
    maxLongitude = Math.min(maxLongitude, TileBoundingBoxUtils.WEB_MERCATOR_HALF_WORLD_WIDTH);
    minLatitude = Math.max(minLatitude, -1 * TileBoundingBoxUtils.WEB_MERCATOR_HALF_WORLD_WIDTH);
    maxLatitude = Math.min(maxLatitude, TileBoundingBoxUtils.WEB_MERCATOR_HALF_WORLD_WIDTH);
    return new BoundingBox(minLongitude, maxLongitude, minLatitude, maxLatitude);
  }
}
