// @ts-ignore
import concat from 'concat-stream';
// @ts-ignore
import reproject from 'reproject';
import PolyToLine from '@turf/polygon-to-line';
import Simplify from '@turf/simplify';
import proj4 from 'proj4';
import { Geometry } from 'geojson';

import { FeatureDao } from '../../features/user/featureDao';
import { TileBoundingBoxUtils } from '../tileBoundingBoxUtils';
import { BoundingBox } from '../../boundingBox';
import { ImageUtils } from '../imageUtils';
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
  projection: proj4.Converter = null;
  public simplifyGeometries = true;
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
    this.projection = featureDao.projection;
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
    this.calculateDrawOverlap();
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
    if (this.featureTableStyles !== null && this.featureTableStyles.has()) {
      let styleRowIds: number[] = [];
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
      stylePaint.color = color;
      if (strokeWidth !== null) {
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

    let canvas: any;
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
          geojson = featureRow.geometry.geometry.toGeoJSON() as Geometry & CrsGeometry;
          this.geometryCache.setGeometry(featureRow.id, geojson);
        }
        const style = this.getFeatureStyle(featureRow);
        try {
          await this.drawGeometry(
            simplifyTolerance,
            geojson,
            context,
            this.webMercatorTransform.bind(this),
            boundingBox,
            style,
          );
        } catch (e) {
          console.log('Error drawing geometry', e);
        }
      }
      return new Promise(resolve => {
        if (FeatureTiles.useNodeCanvas) {
          const writeStream = concat(function(buffer: Uint8Array | Buffer) {
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
      return this.maxFeaturesTileDraw.drawTile(width, height, tileCount.toString(), canvas);
    }
  }
  async drawTileWithBoundingBox(boundingBox: BoundingBox, zoom: number, tileCanvas?: any): Promise<any> {
    const width = 256;
    const height = 256;
    const simplifyTolerance = TileBoundingBoxUtils.toleranceDistanceWidthAndHeight(zoom, width, height);

    let canvas: any;
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
      let gj: Geometry & CrsGeometry = null;
      if (this.cacheGeometries) {
        gj = this.geometryCache.getGeometryForFeatureRow(fr);
      }
      if (gj === undefined || gj === null) {
        gj = fr.geometry.geometry.toGeoJSON() as Geometry & CrsGeometry;
        this.geometryCache.setGeometry(fr.id, gj);
      }
      const style = this.getFeatureStyle(fr);
      try {
        await this.drawGeometry(
          simplifyTolerance,
          gj,
          context,
          this.webMercatorTransform.bind(this),
          boundingBox,
          style,
        );
      } catch (e) {
        console.log('Error drawing geometry', e);
      }
    }
    return new Promise(resolve => {
      if (FeatureTiles.useNodeCanvas) {
        const writeStream = concat(function(buffer: Uint8Array | Buffer) {
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
    let width: number;
    let height: number;
    let iconX: number;
    let iconY: number;
    const transformedGeoJson = transform(geoJson);
    const x = TileBoundingBoxUtils.getXPixel(this.tileWidth, boundingBox, transformedGeoJson.coordinates[0]);
    const y = TileBoundingBoxUtils.getYPixel(this.tileHeight, boundingBox, transformedGeoJson.coordinates[1]);
    if (featureStyle !== undefined && featureStyle !== null && featureStyle.hasIcon()) {
      const iconRow = featureStyle.icon;
      const image = await this.iconCache.createIcon(iconRow);
      width = Math.round(this.scale * iconRow.width);
      height = Math.round(this.scale * iconRow.height);
      if (x >= 0 - width && x <= this.tileWidth + width && y >= 0 - height && y <= this.tileHeight + height) {
        const anchorU = iconRow.anchorUOrDefault;
        const anchorV = iconRow.anchorVOrDefault;
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
        const styleRow = featureStyle.style;
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
        context.fillStyle = pointPaint.colorRGBA;
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
  simplifyPoints(simplifyTolerance: number, lineString: any): any | null {
    let simplifiedGeoJSON = null;
    const shouldProject = this.projection !== null && this.featureDao.srs.organization_coordsys_id !== 3857;
    if (this.simplifyGeometries) {
      try {
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
      } catch (e) {
        // This could happen if the linestring contains any empty points [NaN, NaN]
        console.log('Unable to simplify geometry', e);
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
    context.strokeStyle = paint.colorRGBA;
    context.lineWidth = paint.strokeWidth;
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
   * @param transform
   * @param boundingBox
   * @param featureStyle
   */
  async drawGeometry(
    simplifyTolerance: number,
    geoJson: Geometry,
    context: any,
    transform: Function,
    boundingBox: BoundingBox,
    featureStyle: FeatureStyle,
  ): Promise<void> {
    let i, lsGeom;
    if (geoJson.type === 'Point') {
      await this.drawPoint(geoJson, context, boundingBox, featureStyle, transform);
    } else if (geoJson.type === 'LineString') {
      this.drawLine(simplifyTolerance, geoJson, context, featureStyle, transform, boundingBox);
    } else if (geoJson.type === 'Polygon') {
      const converted = PolyToLine(geoJson);
      if (converted.type === 'Feature') {
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
      } else {
        converted.features.forEach(feature => {
          if (feature.geometry.type === 'LineString') {
            this.drawPolygon(simplifyTolerance, feature.geometry, context, featureStyle, transform, boundingBox);
          } else if (feature.geometry.type === 'MultiLineString') {
            for (i = 0; i < feature.geometry.coordinates.length; i++) {
              lsGeom = {
                type: 'LineString',
                coordinates: feature.geometry.coordinates[i],
              };
              this.drawPolygon(simplifyTolerance, lsGeom, context, featureStyle, transform, boundingBox);
            }
          }
        });
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
