// @ts-ignore
import reproject from 'reproject';
import PolyToLine from '@turf/polygon-to-line';
import booleanClockwise from '@turf/boolean-clockwise';
import simplify from 'simplify-js'
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
  public  simplifyToleranceInPixels = 1;
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
  cleanup () {
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
    boundingBox = this.expandBoundingBox(boundingBox);
    return this.featureDao.countWebMercatorBoundingBox(boundingBox);
  }
  async drawTile(x: number, y: number, z: number, canvas: any = null): Promise<any> {
    if (this.featureDao.isIndexed()) {
      return this.drawTileQueryIndex(x, y, z, canvas);
    } else {
      return this.drawTileQueryAll(x, y, z, canvas);
    }
  }
  async drawTileQueryAll(x: number, y: number, zoom: number, canvas?: any): Promise<any> {
    let boundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
    const count = this.featureDao.getCount();
    if (this.maxFeaturesPerTile === null || count <= this.maxFeaturesPerTile) {
      return this.drawTileWithBoundingBox(boundingBox, zoom, canvas);
    } else if (this.maxFeaturesTileDraw != null) {
      return this.maxFeaturesTileDraw.drawUnindexedTile(256, 256, canvas);
    }
  }

  /**
   * Transform geojson to web mercator if it is in another projection.
   * @param geoJson
   */
  webMercatorTransform(geoJson: any): any {
    if (this.projection !== this.webMercatorProjection) {
      return reproject.reproject(geoJson, this.projection, this.webMercatorProjection);
    } else {
      return geoJson;
    }
  }

  async drawTileQueryIndex(x: number, y: number, z: number, tileCanvas?: any): Promise<any> {
    let canvas: any;
    let context: any;
    let dispose = false;
    let image;
    const boundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, z);
    const expandedBoundingBox = this.expandBoundingBox(boundingBox);
    const width = 256;
    const height = 256;
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
    const featureCount = this.featureDao.countWebMercatorBoundingBox(expandedBoundingBox);
    if (featureCount > 0) {
      if (this.maxFeaturesPerTile == null || featureCount <= this.maxFeaturesPerTile) {
        const iterator = this.featureDao.fastQueryWebMercatorBoundingBox(expandedBoundingBox);
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
              await this.drawGeometry(
                this.webMercatorTransform(geojson),
                context,
                boundingBox,
                style,
              );
            } catch (e) {
              console.error('Failed to draw feature in tile. Id: ' + featureRow.id + ', Table: ' + this.featureDao.table_name)
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
  async drawTileWithBoundingBox(boundingBox: BoundingBox, zoom: number, tileCanvas?: any): Promise<any> {
    const width = 256;
    const height = 256;
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
    const each = featureDao.queryForEach(undefined, undefined, undefined, undefined, undefined, [featureDao.table.getIdColumn().getName(), featureDao.table.getGeometryColumn().getName()]);
    for (const row of each) {
      const fr = featureDao.getRow(row)
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
            await this.drawGeometry(
              this.webMercatorTransform(gj),
              context,
              boundingBox,
              style,
            );
          } catch (e) {
            console.error('Failed to draw feature in tile. Id: ' + fr.id + ', Table: ' + this.featureDao.table_name)
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
   */
  async drawPoint(
    geoJson: any,
    context: any,
    boundingBox: BoundingBox,
    featureStyle: FeatureStyle,
  ): Promise<void> {
    let width: number;
    let height: number;
    let iconX: number;
    let iconY: number;
    const x = TileBoundingBoxUtils.getXPixel(this.tileWidth, boundingBox, geoJson.coordinates[0]);
    const y = TileBoundingBoxUtils.getYPixel(this.tileHeight, boundingBox, geoJson.coordinates[1]);
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
  simplifyPoints(lineString: any, isPolygon: boolean = false): any | null {
    let coords = simplify(lineString.coordinates.map(coordinate => {
      return {x: coordinate[0], y: coordinate[1]};
    }), this.simplifyToleranceInPixels, false).map(point => [point.x, point.y]);
    if (isPolygon) {
      if (coords.length < 4) {
        return null;
      } else if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
        // if first and last point do not match, add first point to end
        coords.push(coords[0].slice());
      }
    } else if (coords.length < 2) {
      return null;
    }
    lineString.coordinates = coords;
    return lineString;
  }

  /**
   * Get the path of the line string
   * @param lineString
   * @param context
   * @param boundingBox
   * @param isPolygon if this was a polygon
   */
  getPath(
    lineString: any,
    context: any,
    boundingBox: BoundingBox,
    isPolygon: boolean = false
  ): void {
    lineString.coordinates = lineString.coordinates.map(coordinate => [TileBoundingBoxUtils.getXPixel(this.tileWidth, boundingBox, coordinate[0]), TileBoundingBoxUtils.getYPixel(this.tileHeight, boundingBox, coordinate[1])]);
    const simplifiedLineString = this.simplifyGeometries ? this.simplifyPoints(lineString, isPolygon) : lineString;
    if (simplifiedLineString != null && simplifiedLineString.coordinates.length > 0) {
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
   */
  drawLine(
    geoJson: any,
    context: any,
    featureStyle: FeatureStyle,
    boundingBox: BoundingBox,
  ): void {
    context.save();
    context.beginPath();
    const paint = this.getLinePaint(featureStyle);
    context.strokeStyle = paint.colorRGBA;
    context.lineWidth = paint.strokeWidth;
    this.getPath(geoJson, context, boundingBox);
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
   * @param fill
   */
  drawPolygon(
    externalRing: any,
    internalRings: any[],
    context: any,
    featureStyle: FeatureStyle,
    boundingBox: BoundingBox,
    fill: boolean = true
  ): void {
    // get paint
    context.save();
    context.beginPath();
    if (!booleanClockwise(externalRing.coordinates)) {
      externalRing.coordinates = externalRing.coordinates.reverse()
    }
    this.getPath(externalRing, context, boundingBox, true);
    context.closePath();
    for (let i = 0; i < internalRings.length; i++) {
      if (booleanClockwise(internalRings[i].coordinates)) {
        internalRings[i].coordinates = internalRings[i].coordinates.reverse()
      }
      this.getPath(internalRings[i], context, boundingBox, true);
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
   * @param simplifyTolerance
   * @param geoJson
   * @param context
   * @param boundingBox
   * @param featureStyle
   */
  async drawGeometry(
    geoJson: Geometry,
    context: any,
    boundingBox: BoundingBox,
    featureStyle: FeatureStyle,
  ): Promise<void> {
    let i;
    if (geoJson.type === 'Point') {
      await this.drawPoint(geoJson, context, boundingBox, featureStyle);
    } else if (geoJson.type === 'LineString') {
      this.drawLine(geoJson, context, featureStyle, boundingBox);
    } else if (geoJson.type === 'Polygon') {
      const converted = PolyToLine(geoJson);
      if (converted.type === 'Feature') {
        if (converted.geometry.type === 'LineString') {
          this.drawPolygon(converted.geometry, [], context, featureStyle, boundingBox);
        } else if (converted.geometry.type === 'MultiLineString') { // internal rings
          // draw internal rings without fill
          const externalRing = { type: 'LineString', coordinates: converted.geometry.coordinates[0]};
          const internalRings = converted.geometry.coordinates.slice(1).map(coords => {
            return {
              type: 'LineString',
              coordinates: coords
            }
          });
          this.drawPolygon(externalRing, internalRings, context, featureStyle, boundingBox);
        }
      } else {
        converted.features.forEach(feature => {
          if (feature.geometry.type === 'LineString') {
            this.drawPolygon(feature.geometry, [], context, featureStyle, boundingBox);
          } else if (feature.geometry.type === 'MultiLineString') {
            const externalRing = { type: 'LineString', coordinates: feature.geometry.coordinates[0]};
            const internalRings = feature.geometry.coordinates.slice(1).map(coords => {
              return {
                type: 'LineString',
                coordinates: coords
              }
            });
            this.drawPolygon(externalRing, internalRings, context, featureStyle, boundingBox);
          }
        });
      }
    } else if (geoJson.type === 'MultiPoint') {
      for (i = 0; i < geoJson.coordinates.length; i++) {
        await this.drawPoint({
          type: 'Point',
          coordinates: geoJson.coordinates[i],
        }, context, boundingBox, featureStyle);
      }
    } else if (geoJson.type === 'MultiLineString') {
      for (i = 0; i < geoJson.coordinates.length; i++) {
        this.drawLine({
          type: 'LineString',
          coordinates: geoJson.coordinates[i],
        }, context, featureStyle, boundingBox);
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
        );
      }
    } else if (geoJson.type === 'GeometryCollection') {
      for (i = 0; i < geoJson.geometries.length; i++) {
        await this.drawGeometry(
          geoJson.geometries[i],
          context,
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
    // Create an expanded bounding box to handle features outside the tile that overlap
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
    minLongitude = Math.max(minLongitude, -1 * ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH);
    maxLongitude = Math.min(maxLongitude, ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH);
    minLatitude = Math.max(minLatitude, -1 * ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH);
    maxLatitude = Math.min(maxLatitude, ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH);
    return new BoundingBox(minLongitude, maxLongitude, minLatitude, maxLatitude);
  }
}
