// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import PolyToLine from '@turf/polygon-to-line';
import booleanClockwise from '@turf/boolean-clockwise';
import simplify from 'simplify-js';
import proj4 from 'proj4';
import { Geometry } from 'geojson';

import { FeatureDao } from '../../features/user/featureDao';
import { TileBoundingBoxUtils } from '../tileBoundingBoxUtils';
import { BoundingBox } from '../../boundingBox';
import { IconCache } from '../../extension/style/iconCache';
import { GeometryCache } from './geometryCache';
import { FeatureDrawType } from './featureDrawType';
import { FeaturePaintCache } from './featurePaintCache';
import { Paint } from './paint';
import { FeatureTableStyles } from '../../extension/style/featureTableStyles';
import { GeoPackage } from '../../geoPackage';
import { FeatureRow } from '../../features/user/featureRow';
import { StyleRow } from '../../extension/style/styleRow';
import { FeatureTilePointIcon } from './featureTilePointIcon';
import { CustomFeaturesTile } from './custom/customFeaturesTile';
import { FeatureStyle } from '../../extension/style/featureStyle';
import { IconRow } from '../../extension/style/iconRow';
import { CrsGeometry } from '../../types/CrsGeometry';
import { Canvas } from '../../canvas/canvas';
import { Projection } from '../../projection/projection';
import { ProjectionConstants } from '../../projection/projectionConstants';

/**
 * FeatureTiles module.
 * @module tiles/features
 */

/**
 *  Tiles drawn from or linked to features. Used to query features and optionally draw tiles
 *  from those features.
 */
export class FeatureTiles {
  projection: proj4.Converter = null;
  webMercatorProjection: proj4.Converter = null;
  public simplifyGeometries = true;
  public simplifyToleranceInPixels = 1;
  public compressFormat = 'png';
  public pointRadius = 4.0;
  pointPaint: Paint = new Paint();
  public pointIcon: FeatureTilePointIcon = null;
  linePaint: Paint = new Paint();
  private _lineStrokeWidth = 2.0;
  polygonPaint: Paint = new Paint();
  private _polygonStrokeWidth = 2.0;
  public fillPolygon = true;
  polygonFillPaint: Paint = new Paint();
  featurePaintCache: FeaturePaintCache = new FeaturePaintCache();
  geometryCache: GeometryCache = new GeometryCache();
  public cacheGeometries = true;
  iconCache: IconCache = new IconCache();
  private _scale = 1.0;
  geoPackage: GeoPackage;
  public featureTableStyles: FeatureTableStyles;
  public maxFeaturesPerTile: number = null;
  public maxFeaturesTileDraw: CustomFeaturesTile = null;
  widthOverlap: number;
  heightOverlap: number;
  constructor(
    public featureDao: FeatureDao<FeatureRow>,
    public tileWidth: number = 256,
    public tileHeight: number = 256,
  ) {
    this.projection = this.featureDao.projection;
    this.linePaint.strokeWidth = 2.0;
    this.polygonPaint.strokeWidth = 2.0;
    this.polygonFillPaint.color = '#00000011';
    this.geoPackage = this.featureDao.geoPackage;
    if (this.geoPackage != null) {
      this.featureTableStyles = new FeatureTableStyles(this.geoPackage, featureDao.table);
      if (!this.featureTableStyles.has()) {
        this.featureTableStyles = null;
      }
    }
    this.webMercatorProjection = Projection.getWebMercatorToWGS84Converter();
    this.calculateDrawOverlap();
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
   * Manually set the width and height draw overlap
   * @param {Number} pixels pixels
   */
  set drawOverlap(pixels: number) {
    this.widthDrawOverlap = pixels;
    this.heightDrawOverlap = pixels;
  }
  /**
   * Get the simplify tolerance in pixels
   * @return {Number} width draw overlap
   */
  get simplifyTolerance(): number {
    return this.simplifyToleranceInPixels;
  }
  /**
   * Set the tolerance in pixels used for simplifying rendered geometries
   * @param {Number} pixels pixels
   */
  set simplifyTolerance(pixels: number) {
    this.simplifyToleranceInPixels = pixels;
  }
  /**
   * Get the width draw overlap
   * @return {Number} width draw overlap
   */
  get widthDrawOverlap(): number {
    return this.widthOverlap;
  }
  /**
   * Manually set the width draw overlap
   * @param {Number} pixels pixels
   */
  set widthDrawOverlap(pixels: number) {
    this.widthOverlap = pixels;
  }
  /**
   * Get the height draw overlap
   * @return {Number} height draw overlap
   */
  get heightDrawOverlap(): number {
    return this.heightOverlap;
  }
  /**
   * Manually set the height draw overlap
   * @param {Number} pixels pixels
   */
  set heightDrawOverlap(pixels: number) {
    this.heightOverlap = pixels;
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
   * Set / resize the style paint cache size
   *
   * @param {Number} size
   * @since 3.3.0
   */
  set stylePaintCacheSize(size: number) {
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
  set iconCacheSize(size: number) {
    this.iconCache.resize(size);
  }
  /**
   * Set the scale
   *
   * @param {Number} scale scale factor
   */
  set scale(scale: number) {
    this._scale = scale;
    this.linePaint.strokeWidth = scale * this.lineStrokeWidth;
    this.polygonPaint.strokeWidth = scale * this.polygonStrokeWidth;
    this.featurePaintCache.clear();
  }
  get scale(): number {
    return this._scale;
  }

  /**
   * Set geometry cache's max size
   * @param {Number} maxSize
   */
  set geometryCacheMaxSize(maxSize: number) {
    this.geometryCache.resize(maxSize);
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
    if (this.featureTableStyles != null && this.featureTableStyles.has()) {
      let styleRowIds: number[] = [];
      const tableStyleIds = this.featureTableStyles.getAllTableStyleIds();
      if (tableStyleIds != null) {
        styleRowIds = styleRowIds.concat(tableStyleIds);
      }
      const styleIds = this.featureTableStyles.getAllStyleIds();
      if (styleIds != null) {
        styleRowIds = styleRowIds.concat(styleIds.filter(id => styleRowIds.indexOf(id) === -1));
      }
      const styleDao = this.featureTableStyles.getStyleDao();
      for (let i = 0; i < styleRowIds.length; i++) {
        const styleRowId = styleRowIds[i];
        const styleRow = styleDao.queryForId(styleRowId) as StyleRow;
        const styleHalfWidth = this.scale * (styleRow.getWidthOrDefault() / 2.0);
        this.widthOverlap = Math.max(this.widthOverlap, styleHalfWidth);
        this.heightOverlap = Math.max(this.heightOverlap, styleHalfWidth);
      }
      let iconRowIds: number[] = [];
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
        const iconRow = iconDao.queryForId(iconRowId) as IconRow;
        const iconDimensions = iconRow.derivedDimensions;
        const iconWidth = this.scale * Math.ceil(iconDimensions[0]);
        const iconHeight = this.scale * Math.ceil(iconDimensions[1]);
        this.widthOverlap = Math.max(this.widthOverlap, iconWidth);
        this.heightOverlap = Math.max(this.heightOverlap, iconHeight);
      }
    }
  }
  set drawOverlapsWithPixels(pixels: number) {
    this.widthOverlap = pixels;
    this.heightOverlap = pixels;
  }
  getFeatureStyle(featureRow: FeatureRow): FeatureStyle {
    let featureStyle = null;
    if (this.featureTableStyles != null) {
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
        throw new Error('Unsupported Draw Type: ' + drawType);
      }
      const stylePaint = new Paint();
      stylePaint.color = color;
      if (strokeWidth != null) {
        stylePaint.strokeWidth = strokeWidth;
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
  get pointColor(): string {
    return this.pointPaint.color;
  }
  /**
   * Set point color
   * @param {String} pointColor point color
   */
  set pointColor(pointColor: string) {
    this.pointPaint.color = pointColor;
  }
  /**
   * Get line stroke width
   * @return {Number} width
   */
  get lineStrokeWidth(): number {
    return this._lineStrokeWidth;
  }
  /**
   * Set line stroke width
   * @param {Number} lineStrokeWidth line stroke width
   */
  set lineStrokeWidth(lineStrokeWidth: number) {
    this._lineStrokeWidth = lineStrokeWidth;
    this.linePaint.strokeWidth = this.scale * this.lineStrokeWidth;
  }
  /**
   * Get line color
   * @return {String} color
   */
  get lineColor(): string {
    return this.linePaint.color;
  }
  /**
   * Set line color
   * @param {String} lineColor line color
   */
  set lineColor(lineColor: string) {
    this.linePaint.color = lineColor;
  }
  /**
   * Get polygon stroke width
   * @return {Number} width
   */
  get polygonStrokeWidth(): number {
    return this._polygonStrokeWidth;
  }
  /**
   * Set polygon stroke width
   * @param {Number} polygonStrokeWidth polygon stroke width
   */
  set polygonStrokeWidth(polygonStrokeWidth: number) {
    this._polygonStrokeWidth = polygonStrokeWidth;
    this.polygonPaint.strokeWidth = this.scale * polygonStrokeWidth;
  }
  /**
   * Get polygon color
   * @return {String} color
   */
  get polygonColor(): string {
    return this.polygonPaint.color;
  }
  /**
   * Set polygon color
   * @param {String} polygonColor polygon color
   */
  set polygonColor(polygonColor: string) {
    this.polygonPaint.color = polygonColor;
  }
  /**
   * Get polygon fill color
   * @return {String} color
   */
  get polygonFillColor(): string {
    return this.polygonFillPaint.color;
  }
  /**
   * Set polygon fill color
   * @param {String} polygonFillColor polygon fill color
   */
  set polygonFillColor(polygonFillColor: string) {
    this.polygonFillPaint.color = polygonFillColor;
  }

  getFeatureCountXYZ(x: number, y: number, z: number): number {
    let boundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, z);
    boundingBox = this.expandBoundingBox(boundingBox, ProjectionConstants.EPSG_3857);
    return this.featureDao.countWebMercatorBoundingBox(boundingBox);
  }

  /**
   * Renders the web mercator (EPSG:3857) xyz tile
   * @param x
   * @param y
   * @param z
   * @param canvas
   */
  async drawTile(x: number, y: number, z: number, canvas: any = null): Promise<any> {
    return this.draw3857Tile(x, y, z, canvas);
  }

  /**
   * Renders the web mercator (EPSG:3857) xyz tile
   * @param x
   * @param y
   * @param z
   * @param canvas
   */
  async draw3857Tile(x: number, y: number, z: number, canvas: any = null): Promise<any> {
    if (this.featureDao.isIndexed()) {
      return this.drawTileQueryIndex(x, y, z, ProjectionConstants.EPSG_3857, canvas);
    } else {
      return this.drawTileQueryAll(x, y, z, ProjectionConstants.EPSG_3857, canvas);
    }
  }

  /**
   * Renders the wgs84 (EPSG:4326) xyz tile
   * @param x
   * @param y
   * @param z
   * @param canvas
   */
  async draw4326Tile(x: number, y: number, z: number, canvas: any = null): Promise<any> {
    if (this.featureDao.isIndexed()) {
      return this.drawTileQueryIndex(x, y, z, ProjectionConstants.EPSG_4326, canvas);
    } else {
      return this.drawTileQueryAll(x, y, z, ProjectionConstants.EPSG_4326, canvas);
    }
  }

  async drawTileQueryAll(x: number, y: number, zoom: number, tileProjection: string, canvas?: any): Promise<any> {
    const boundingBox: BoundingBox =
      tileProjection === ProjectionConstants.EPSG_3857
        ? TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom)
        : TileBoundingBoxUtils.getWGS84BoundingBoxFromXYZ(x, y, zoom);
    const count = this.featureDao.getCount();
    if (this.maxFeaturesPerTile === null || count <= this.maxFeaturesPerTile) {
      return this.drawTileWithBoundingBox(boundingBox, zoom, tileProjection, canvas);
    } else if (this.maxFeaturesTileDraw != null) {
      return this.maxFeaturesTileDraw.drawUnindexedTile(this.tileWidth, this.tileHeight, canvas);
    }
  }

  /**
   * Handles the generation of a function for transforming coordinates from the source projection into the target tile's
   * projection. These coordinates are then converted into pixel coordinates.
   * @param targetProjection
   */
  getTransformFunction(targetProjection): Function {
    const projection = Projection.getConverter(targetProjection);
    if (Projection.convertersMatch(projection, this.projection)) {
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      return coordinate => coordinate;
    } else if (Projection.isWebMercator(projection) && Projection.isWGS84(this.projection)) {
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      return coordinate => {
        return Projection.getConverterFromConverters(this.projection, targetProjection).forward([
          Math.max(
            ProjectionConstants.WEB_MERCATOR_MIN_LON_RANGE,
            Math.min(ProjectionConstants.WEB_MERCATOR_MAX_LON_RANGE, coordinate[0]),
          ),
          Math.max(
            ProjectionConstants.WEB_MERCATOR_MIN_LAT_RANGE,
            Math.min(ProjectionConstants.WEB_MERCATOR_MAX_LAT_RANGE, coordinate[1]),
          ),
        ]);
      };
    } else {
      return Projection.getConverterFromConverters(this.projection, targetProjection).forward;
    }
  }

  async drawTileQueryIndex(x: number, y: number, z: number, tileProjection, tileCanvas?: any): Promise<any> {
    let canvas: any;
    let context: any;
    let dispose = false;
    let image;
    const boundingBox =
      tileProjection === ProjectionConstants.EPSG_3857
        ? TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, z)
        : TileBoundingBoxUtils.getWGS84BoundingBoxFromXYZ(x, y, z);
    const expandedBoundingBox = this.expandBoundingBox(boundingBox, tileProjection);

    const width = this.tileWidth;
    const height = this.tileHeight;
    await Canvas.initializeAdapter();
    // create Canvas if user does not provide canvas.
    if (tileCanvas != null) {
      canvas = tileCanvas;
      context = canvas.getContext('2d');
      context.clearRect(0, 0, width, height);
    } else {
      canvas = Canvas.create(width, height);
      context = canvas.getContext('2d');
      dispose = true;
    }

    // get number of features that could intercept this bounding box
    const featureCount = this.featureDao.countInBoundingBox(expandedBoundingBox, tileProjection);
    if (featureCount > 0) {
      if (this.maxFeaturesPerTile == null || featureCount <= this.maxFeaturesPerTile) {
        const transform = this.getTransformFunction(tileProjection);
        const iterator = this.featureDao.fastQueryBoundingBox(expandedBoundingBox, tileProjection);
        for (const featureRow of iterator) {
          if (featureRow.geometry != null) {
            let geojson = null;
            if (this.cacheGeometries) {
              geojson = this.geometryCache.getGeometry(featureRow.id);
            }
            if (geojson == null) {
              geojson = featureRow.geometry.geometry.toGeoJSON() as Geometry & CrsGeometry;
              this.geometryCache.setGeometry(featureRow.id, geojson);
            }
            const style = this.getFeatureStyle(featureRow);
            try {
              await this.drawGeometry(geojson, context, boundingBox, style, transform);
            } catch (e) {
              console.error(
                'Failed to draw feature in tile. Id: ' + featureRow.id + ', Table: ' + this.featureDao.table_name,
              );
            }
          }
        }
        image = await Canvas.toDataURL(canvas, 'image/' + this.compressFormat);
      } else if (this.maxFeaturesTileDraw != null) {
        // Draw the max features tile
        image = await this.maxFeaturesTileDraw.drawTile(width, height, featureCount.toString(), canvas);
      }
    } else {
      image = await Canvas.toDataURL(canvas, 'image/' + this.compressFormat);
    }
    if (dispose) {
      Canvas.disposeCanvas(canvas);
    }
    return image;
  }

  async drawTileWithBoundingBox(
    boundingBox: BoundingBox,
    zoom: number,
    tileProjection: string,
    tileCanvas?: any,
  ): Promise<any> {
    const width = this.tileWidth;
    const height = this.tileHeight;
    let canvas: any;
    let dispose = false;
    await Canvas.initializeAdapter();
    if (tileCanvas != null) {
      canvas = tileCanvas;
    } else {
      canvas = Canvas.create(width, height);
      dispose = true;
    }
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, width, height);
    const featureDao = this.featureDao;
    const each = featureDao.queryForEach(undefined, undefined, undefined, undefined, undefined, [
      featureDao.table.getIdColumn().getName(),
      featureDao.table.getGeometryColumn().getName(),
    ]);
    const transform = this.getTransformFunction(tileProjection);
    for (const row of each) {
      const fr = featureDao.getRow(row);
      if (fr.geometry != null) {
        let gj: Geometry & CrsGeometry = null;
        if (this.cacheGeometries) {
          gj = this.geometryCache.getGeometryForFeatureRow(fr);
        }
        if (gj == null) {
          gj = fr.geometry.geometry.toGeoJSON() as Geometry & CrsGeometry;
          this.geometryCache.setGeometry(fr.id, gj);
        }
        if (gj != null) {
          const style = this.getFeatureStyle(fr);
          try {
            await this.drawGeometry(gj, context, boundingBox, style, transform);
          } catch (e) {
            console.error('Failed to draw feature in tile. Id: ' + fr.id + ', Table: ' + this.featureDao.table_name);
          }
        }
      }
    }
    const image = await Canvas.toDataURL(canvas, 'image/' + this.compressFormat);
    if (dispose) {
      Canvas.disposeCanvas(canvas);
    }
    return image;
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
    let width: number;
    let height: number;
    let iconX: number;
    let iconY: number;
    const coordinate = transform(geoJson.coordinates);
    const x = TileBoundingBoxUtils.getXPixel(this.tileWidth, boundingBox, coordinate[0]);
    const y = TileBoundingBoxUtils.getYPixel(this.tileHeight, boundingBox, coordinate[1]);
    if (featureStyle != null && featureStyle.useIcon()) {
      const iconRow = featureStyle.icon;
      const image = await this.iconCache.createIcon(iconRow);
      width = Math.round(this.scale * image.width);
      height = Math.round(this.scale * image.height);
      if (x >= 0 - width && x <= this.tileWidth + width && y >= 0 - height && y <= this.tileHeight + height) {
        iconX = Math.round(x - iconRow.anchorUOrDefault * width);
        iconY = Math.round(y - iconRow.anchorVOrDefault * height);
        context.drawImage(image.image, iconX, iconY, width, height);
      }
    } else if (this.pointIcon != null) {
      width = Math.round(this.scale * this.pointIcon.getWidth());
      height = Math.round(this.scale * this.pointIcon.getHeight());
      if (x >= 0 - width && x <= this.tileWidth + width && y >= 0 - height && y <= this.tileHeight + height) {
        iconX = Math.round(x - this.scale * this.pointIcon.getXOffset());
        iconY = Math.round(y - this.scale * this.pointIcon.getYOffset());
        try {
          context.drawImage(this.pointIcon.getIcon().image, iconX, iconY, width, height);
        } catch (e) {
          // ignore error
        }
      }
    } else {
      context.save();
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
      const pointPaint = this.getPointPaint(featureStyle);
      if (x >= 0 - radius && x <= this.tileWidth + radius && y >= 0 - radius && y <= this.tileHeight + radius) {
        const circleX = Math.round(x);
        const circleY = Math.round(y);
        context.beginPath();
        context.arc(circleX, circleY, radius, 0, 2 * Math.PI, true);
        context.closePath();
        context.fillStyle = pointPaint.colorRGBA;
        context.fill();
      }
      context.restore();
    }
  }

  /**
   * Simplify x,y tile coordinates by 1 pixel
   * @param lineString GeoJSON with coordinates in pixels
   * @param isPolygon determines if the first and last point need to stay connected
   * @return simplified GeoJSON
   * @since 2.0.0
   */
  simplifyPoints(lineString: any, isPolygon = false): any | null {
    lineString.coordinates = simplify(
      lineString.coordinates.map(coordinate => {
        return { x: coordinate[0], y: coordinate[1] };
      }),
      this.simplifyToleranceInPixels,
      false,
    ).map(point => [point.x, point.y]);
    return lineString;
  }

  /**
   * Get the path of the line string
   * @param lineString
   * @param context
   * @param boundingBox
   * @param isPolygon if this was a polygon
   * @param transform
   */
  getPath(lineString: any, context: any, boundingBox: BoundingBox, isPolygon = false, transform: Function): void {
    lineString.coordinates = lineString.coordinates.map(coordinate => {
      const transformedCoordinate = transform(coordinate);
      return [
        TileBoundingBoxUtils.getXPixel(this.tileWidth, boundingBox, transformedCoordinate[0]),
        TileBoundingBoxUtils.getYPixel(this.tileHeight, boundingBox, transformedCoordinate[1]),
      ];
    });
    const simplifiedLineString = this.simplifyGeometries ? this.simplifyPoints(lineString, isPolygon) : lineString;
    if (simplifiedLineString.coordinates.length > 1) {
      context.moveTo(simplifiedLineString.coordinates[0][0], simplifiedLineString.coordinates[0][1]);
      for (let i = 1; i < simplifiedLineString.coordinates.length; i++) {
        context.lineTo(simplifiedLineString.coordinates[i][0], simplifiedLineString.coordinates[i][1]);
      }
    }
  }
  /**
   * Draw a line in the context
   * @param geoJson
   * @param context
   * @param featureStyle
   * @param boundingBox
   * @param transform
   */
  drawLine(
    geoJson: any,
    context: any,
    featureStyle: FeatureStyle,
    boundingBox: BoundingBox,
    transform: Function,
  ): void {
    context.save();
    context.beginPath();
    const paint = this.getLinePaint(featureStyle);
    context.strokeStyle = paint.colorRGBA;
    context.lineWidth = paint.strokeWidth;
    this.getPath(geoJson, context, boundingBox, false, transform);
    context.stroke();
    context.closePath();
    context.restore();
  }
  /**
   * Draw a polygon in the context
   * @param externalRing
   * @param internalRings
   * @param context
   * @param featureStyle
   * @param boundingBox
   * @param transform
   * @param fill
   */
  drawPolygon(
    externalRing: any,
    internalRings: any[],
    context: any,
    featureStyle: FeatureStyle,
    boundingBox: BoundingBox,
    transform: Function,
    fill = true,
  ): void {
    // get paint
    context.save();
    context.beginPath();
    if (!booleanClockwise(externalRing.coordinates)) {
      externalRing.coordinates = externalRing.coordinates.reverse();
    }
    this.getPath(externalRing, context, boundingBox, true, transform);
    context.closePath();
    for (let i = 0; i < internalRings.length; i++) {
      if (booleanClockwise(internalRings[i].coordinates)) {
        internalRings[i].coordinates = internalRings[i].coordinates.reverse();
      }
      this.getPath(internalRings[i], context, boundingBox, true, transform);
      context.closePath();
    }
    const fillPaint = this.getPolygonFillPaint(featureStyle);
    if (fill && fillPaint !== undefined && fillPaint != null) {
      context.fillStyle = fillPaint.colorRGBA;
      context.fill();
    }
    const paint = this.getPolygonPaint(featureStyle);
    context.strokeStyle = paint.colorRGBA;
    context.lineWidth = paint.strokeWidth;
    context.stroke();
    context.restore();
  }
  /**
   * Add a feature to the batch
   * @param geoJson
   * @param context
   * @param boundingBox
   * @param featureStyle
   * @param transform
   */
  async drawGeometry(
    geoJson: Geometry,
    context: any,
    boundingBox: BoundingBox,
    featureStyle: FeatureStyle,
    transform: Function,
  ): Promise<void> {
    let i;
    if (geoJson.type === 'Point') {
      await this.drawPoint(geoJson, context, boundingBox, featureStyle, transform);
    } else if (geoJson.type === 'LineString') {
      this.drawLine(geoJson, context, featureStyle, boundingBox, transform);
    } else if (geoJson.type === 'Polygon') {
      const converted = PolyToLine(geoJson);
      if (converted.type === 'Feature') {
        if (converted.geometry.type === 'LineString') {
          this.drawPolygon(converted.geometry, [], context, featureStyle, boundingBox, transform);
        } else if (converted.geometry.type === 'MultiLineString') {
          // internal rings
          // draw internal rings without fill
          const externalRing = { type: 'LineString', coordinates: converted.geometry.coordinates[0] };
          const internalRings = converted.geometry.coordinates.slice(1).map(coords => {
            return {
              type: 'LineString',
              coordinates: coords,
            };
          });
          this.drawPolygon(externalRing, internalRings, context, featureStyle, boundingBox, transform);
        }
      } else {
        converted.features.forEach(feature => {
          if (feature.geometry.type === 'LineString') {
            this.drawPolygon(feature.geometry, [], context, featureStyle, boundingBox, transform);
          } else if (feature.geometry.type === 'MultiLineString') {
            const externalRing = { type: 'LineString', coordinates: feature.geometry.coordinates[0] };
            const internalRings = feature.geometry.coordinates.slice(1).map(coords => {
              return {
                type: 'LineString',
                coordinates: coords,
              };
            });
            this.drawPolygon(externalRing, internalRings, context, featureStyle, boundingBox, transform);
          }
        });
      }
    } else if (geoJson.type === 'MultiPoint') {
      for (i = 0; i < geoJson.coordinates.length; i++) {
        await this.drawPoint(
          {
            type: 'Point',
            coordinates: geoJson.coordinates[i],
          },
          context,
          boundingBox,
          featureStyle,
          transform,
        );
      }
    } else if (geoJson.type === 'MultiLineString') {
      for (i = 0; i < geoJson.coordinates.length; i++) {
        this.drawLine(
          {
            type: 'LineString',
            coordinates: geoJson.coordinates[i],
          },
          context,
          featureStyle,
          boundingBox,
          transform,
        );
      }
    } else if (geoJson.type === 'MultiPolygon') {
      for (i = 0; i < geoJson.coordinates.length; i++) {
        await this.drawGeometry(
          {
            type: 'Polygon',
            coordinates: geoJson.coordinates[i],
          },
          context,
          boundingBox,
          featureStyle,
          transform,
        );
      }
    } else if (geoJson.type === 'GeometryCollection') {
      for (i = 0; i < geoJson.geometries.length; i++) {
        await this.drawGeometry(geoJson.geometries[i], context, boundingBox, featureStyle, transform);
      }
    }
  }

  /**
   * Create an expanded bounding box to handle features outside the tile that overlap
   * @param boundingBox bounding box
   * @param tileProjection projection - only EPSG:3857 and EPSG:4326 are supported
   * @return {BoundingBox} bounding box
   */
  expandBoundingBox(boundingBox: BoundingBox, tileProjection: string): BoundingBox {
    // Create an expanded bounding box to handle features outside the tile that overlap
    let minLongitude = TileBoundingBoxUtils.getLongitudeFromPixel(
      this.tileWidth,
      boundingBox,
      boundingBox,
      0 - this.widthOverlap,
    );
    let maxLongitude = TileBoundingBoxUtils.getLongitudeFromPixel(
      this.tileWidth,
      boundingBox,
      boundingBox,
      this.tileWidth + this.widthOverlap,
    );
    let maxLatitude = TileBoundingBoxUtils.getLatitudeFromPixel(
      this.tileHeight,
      boundingBox,
      boundingBox,
      0 - this.heightOverlap,
    );
    let minLatitude = TileBoundingBoxUtils.getLatitudeFromPixel(
      this.tileHeight,
      boundingBox,
      boundingBox,
      this.tileHeight + this.heightOverlap,
    );
    // Choose the most expanded longitudes and latitudes
    minLongitude = Math.min(minLongitude, boundingBox.minLongitude);
    maxLongitude = Math.max(maxLongitude, boundingBox.maxLongitude);
    minLatitude = Math.min(minLatitude, boundingBox.minLatitude);
    maxLatitude = Math.max(maxLatitude, boundingBox.maxLatitude);

    // Bound with limits
    if (tileProjection === ProjectionConstants.EPSG_3857) {
      minLongitude = Math.max(minLongitude, -1 * ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH);
      maxLongitude = Math.min(maxLongitude, ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH);
      minLatitude = Math.max(minLatitude, -1 * ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH);
      maxLatitude = Math.min(maxLatitude, ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH);
    } else {
      minLongitude = Math.max(minLongitude, -1 * ProjectionConstants.WGS84_HALF_WORLD_LON_WIDTH);
      maxLongitude = Math.min(maxLongitude, ProjectionConstants.WGS84_HALF_WORLD_LON_WIDTH);
      minLatitude = Math.max(minLatitude, -1 * ProjectionConstants.WGS84_HALF_WORLD_LAT_HEIGHT);
      maxLatitude = Math.min(maxLatitude, ProjectionConstants.WGS84_HALF_WORLD_LAT_HEIGHT);
    }
    return new BoundingBox(minLongitude, maxLongitude, minLatitude, maxLatitude);
  }
}
