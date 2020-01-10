import concat from 'concat-stream'
import * as d3geo  from 'd3-geo'
import reproject from 'reproject'
import PolyToLine from '@turf/polygon-to-line'

import {FeatureDao} from "../../features/user/featureDao"
import {TileBoundingBoxUtils} from '../tileBoundingBoxUtils'
import { BoundingBox } from '../../boundingBox'
import { ImageUtils } from '../imageUtils'
import IconCache from '../../extension/style/iconCache'
import { GeometryCache } from './geometryCache'
import { FeatureDrawType } from './featureDrawType'
import FeaturePaintCache from './featurePaintCache'
import { Paint } from './paint'
import { FeatureTableStyles } from '../../extension/style/featureTableStyles'
import GeoPackage from '../../geoPackage'
import FeatureTable from '../../features/user/featureTable'
import FeatureRow from '../../features/user/featureRow'
import StyleRow from '../../extension/style/styleRow'
import { FeatureTilePointIcon } from './featureTilePointIcon'
import { CustomFeaturesTile } from './custom/customFeaturesTile'
/**
 * FeatureTiles module.
 * @module tiles/features
 */

/**
 *  Tiles drawn from or linked to features. Used to query features and optionally draw tiles
 *  from those features.
 */
export class FeatureTiles {
  private static readonly isElectron: boolean = !!(typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf(' electron/') > -1);
  // @ts-ignore
  private static readonly isPhantom: boolean = !!(typeof window !== 'undefined' && window.callPhantom && window._phantom);
  private static readonly isNode: boolean = typeof (process) !== 'undefined' && !!process.version;
  private static readonly useNodeCanvas: boolean = FeatureTiles.isNode && !FeatureTiles.isPhantom && !FeatureTiles.isElectron;
  compressFormat: string = 'png';
  pointRadius: number = 4.0;
  pointPaint: Paint = new Paint();
  pointIcon: any = null;
  linePaint: Paint = new Paint();
  lineStrokeWidth: number = 2.0;
  polygonPaint: Paint = new Paint();
  polygonStrokeWidth: number = 2.0;
  fillPolygon: boolean = true;
  polygonFillPaint: Paint = new Paint();
  featurePaintCache: FeaturePaintCache = new FeaturePaintCache();
  geometryCache: GeometryCache = new GeometryCache();
  cacheGeometries: boolean = true;
  iconCache: IconCache = new IconCache();
  scale: number = 1.0;
  geoPackage: GeoPackage;
  featureTableStyles: any;
  maxFeaturesPerTile: number = null;
  maxFeaturesTileDraw: any = null;
  widthOverlap: number;
  heightOverlap: number;
  constructor(public featureDao: FeatureDao, public tileWidth: number = 256, public tileHeight: number = 256) {
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
  setDrawOverlap(pixels: number) {
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
  setWidthDrawOverlap(pixels: number) {
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
  setHeightDrawOverlap(pixels: number) {
    this.heightOverlap = pixels;
  }
  /**
   * Get the feature DAO
   * @return {module:features/user/featureDao} feature dao
   */
  getFeatureDao(): FeatureDao {
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
  setFeatureTableStyles(featureTableStyles: FeatureTableStyles) {
    this.featureTableStyles = featureTableStyles;
  }
  /**
   * Ignore the feature table styles within the GeoPackage
   */
  ignoreFeatureTableStyles() {
    this.setFeatureTableStyles(null);
    this.calculateDrawOverlap();
  }
  /**
   * Clear all caches
   */
  clearCache() {
    this.clearStylePaintCache();
    this.clearIconCache();
  }
  /**
   * Clear the style paint cache
   */
  clearStylePaintCache() {
    this.featurePaintCache.clear();
  }
  /**
   * Set / resize the style paint cache size
   *
   * @param {Number} size
   * @since 3.3.0
   */
  setStylePaintCacheSize(size: number) {
    this.featurePaintCache.resize(size);
  }
  /**
   * Clear the icon cache
   */
  clearIconCache() {
    this.iconCache.clear();
  }
  /**
   * Set / resize the icon cache size
   * @param {Number} size new size
   */
  setIconCacheSize(size: number) {
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
  setTileWidth(tileWidth:number) {
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
  setTileHeight(tileHeight: number) {
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
  setCompressFormat(compressFormat: string) {
    this.compressFormat = compressFormat;
  }
  /**
   * Set the scale
   *
   * @param {Number} scale scale factor
   */
  setScale(scale: number) {
    this.scale = scale;
    this.linePaint.setStrokeWidth(scale * this.lineStrokeWidth);
    this.polygonPaint.setStrokeWidth(scale * this.polygonStrokeWidth);
    this.featurePaintCache.clear();
  }

  /**
   * Set CacheGeometries flag. When set to true, geometries will be cached.
   * @param {Boolean} cacheGeometries
   */
  setCacheGeometries(cacheGeometries: boolean) {
    this.cacheGeometries = cacheGeometries;
  }

  /**
   * Set geometry cache's max size
   * @param {Number} maxSize
   */
  setGeometryCacheMaxSize(maxSize: number) {
    this.geometryCache.resize(maxSize)
  }
  /**
   * Get the scale
   * @return {Number} scale factor
   */
  getScale(): number {
    return this.scale;
  }
  calculateDrawOverlap() {
    if (this.pointIcon) {
      this.heightOverlap = this.scale * this.pointIcon.getHeight();
      this.widthOverlap = this.scale * this.pointIcon.getWidth();
    }
    else {
      this.heightOverlap = this.scale * this.pointRadius;
      this.widthOverlap = this.scale * this.pointRadius;
    }
    var lineHalfStroke = this.scale * this.lineStrokeWidth / 2.0;
    this.heightOverlap = Math.max(this.heightOverlap, lineHalfStroke);
    this.widthOverlap = Math.max(this.widthOverlap, lineHalfStroke);
    var polygonHalfStroke = this.scale * this.polygonStrokeWidth / 2.0;
    this.heightOverlap = Math.max(this.heightOverlap, polygonHalfStroke);
    this.widthOverlap = Math.max(this.widthOverlap, polygonHalfStroke);
    if (this.featureTableStyles !== null && this.featureTableStyles.has()) {
      var styleRowIds = [];
      var tableStyleIds = this.featureTableStyles.getAllTableStyleIds();
      if (tableStyleIds !== null) {
        styleRowIds = styleRowIds.concat(tableStyleIds);
      }
      var styleIds = this.featureTableStyles.getAllStyleIds();
      if (styleIds != null) {
        styleRowIds = styleRowIds.concat(styleIds.filter(id => styleRowIds.indexOf(id) === -1));
      }
      var styleDao = this.featureTableStyles.getStyleDao();
      for (var i = 0; i < styleRowIds.length; i++) {
        var styleRowId = styleRowIds[i];
        var styleRow = styleDao.queryForId(styleRowId);
        var styleHalfWidth = this.scale * (styleRow.getWidthOrDefault() / 2.0);
        this.widthOverlap = Math.max(this.widthOverlap, styleHalfWidth);
        this.heightOverlap = Math.max(this.heightOverlap, styleHalfWidth);
      }
      var iconRowIds = [];
      var tableIconIds = this.featureTableStyles.getAllTableIconIds();
      if (tableIconIds != null) {
        iconRowIds = iconRowIds.concat(tableIconIds);
      }
      var iconIds = this.featureTableStyles.getAllIconIds();
      if (iconIds != null) {
        iconRowIds = iconRowIds.concat(iconIds.filter(id => iconRowIds.indexOf(id) === -1));
      }
      var iconDao = this.featureTableStyles.getIconDao();
      for (i = 0; i < iconRowIds.length; i++) {
        var iconRowId = iconRowIds[i];
        var iconRow = iconDao.queryForId(iconRowId);
        var iconDimensions = iconRow.getDerivedDimensions();
        var iconWidth = this.scale * Math.ceil(iconDimensions[0]);
        var iconHeight = this.scale * Math.ceil(iconDimensions[1]);
        this.widthOverlap = Math.max(this.widthOverlap, iconWidth);
        this.heightOverlap = Math.max(this.heightOverlap, iconHeight);
      }
    }
  }
  setDrawOverlapsWithPixels(pixels: number) {
    this.widthOverlap = pixels;
    this.heightOverlap = pixels;
  }
  getFeatureStyle(featureRow: FeatureRow) {
    var featureStyle = null;
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
  getPointPaint(featureStyle: any) {
    var paint = this.getFeatureStylePaint(featureStyle, FeatureDrawType.CIRCLE);
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
  getLinePaint(featureStyle: any) {
    var paint = this.getFeatureStylePaint(featureStyle, FeatureDrawType.STROKE);
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
  getPolygonPaint(featureStyle: any) {
    var paint = this.getFeatureStylePaint(featureStyle, FeatureDrawType.STROKE);
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
  getPolygonFillPaint(featureStyle: any) {
    var paint = null;
    var hasStyleColor = false;
    if (featureStyle != null) {
      var style = featureStyle.getStyle();
      if (style != null) {
        if (style.hasFillColor()) {
          paint = this.getStylePaint(style, FeatureDrawType.FILL);
        }
        else {
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
  getFeatureStylePaint(featureStyle: any, drawType: any) {
    var paint = null;
    if (featureStyle != null) {
      var style = featureStyle.getStyle();
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
  getStylePaint(style: StyleRow, drawType: string) {
    var paint = this.featurePaintCache.getPaintForStyleRow(style, drawType);
    if (paint === undefined || paint === null) {
      var color = null;
      var strokeWidth = null;
      if (drawType === FeatureDrawType.CIRCLE) {
        color = style.getColor();
      }
      else if (drawType === FeatureDrawType.STROKE) {
        color = style.getColor();
        strokeWidth = this.scale * style.getWidthOrDefault();
      }
      else if (drawType === FeatureDrawType.FILL) {
        color = style.getFillColor();
        strokeWidth = this.scale * style.getWidthOrDefault();
      }
      else {
        throw new Error("Unsupported Draw Type: " + drawType);
      }
      var stylePaint = new Paint();
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
  setPointRadius(pointRadius: number) {
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
  setPointColor(pointColor: string) {
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
  setPointIcon(pointIcon: FeatureTilePointIcon) {
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
  setLineStrokeWidth(lineStrokeWidth: number) {
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
  setLineColor(lineColor: string) {
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
  setPolygonStrokeWidth(polygonStrokeWidth: number) {
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
  setPolygonColor(polygonColor: string) {
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
  setFillPolygon(fillPolygon: boolean) {
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
  setPolygonFillColor(polygonFillColor: string) {
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
  setMaxFeaturesPerTile(maxFeaturesPerTile: number) {
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
  setMaxFeaturesTileDraw(maxFeaturesTileDraw: CustomFeaturesTile) {
    this.maxFeaturesTileDraw = maxFeaturesTileDraw;
  }
  getFeatureCountXYZ(x: number, y: number, z: number): number {
    var boundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, z);
    boundingBox = this.expandBoundingBox(boundingBox);
    return this.featureDao.countWebMercatorBoundingBox(boundingBox);
  }
  async drawTile(x: number, y: number, z: number, canvas = null): Promise<any> {
    var indexed = this.featureDao.isIndexed();
    if (indexed) {
      return this.drawTileQueryIndex(x, y, z, canvas);
    }
    else {
      return this.drawTileQueryAll(x, y, z, canvas);
    }
  }
  async drawTileQueryAll(x: number, y: number, zoom: number, canvas?: any): Promise<any> {
    var boundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
    boundingBox = this.expandBoundingBox(boundingBox);
    var count = this.featureDao.getCount();
    if (this.maxFeaturesPerTile === null || count <= this.maxFeaturesPerTile) {
      return this.drawTileWithBoundingBox(boundingBox, zoom, canvas);
    }
    else if (this.maxFeaturesTileDraw !== null) {
      return this.maxFeaturesTileDraw.drawUnindexedTile(256, 256, canvas);
    }
  }
  async drawTileQueryIndex(x: number, y: number, z: number, tileCanvas?: any): Promise<any> {
    var boundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, z);
    var expandedBoundingBox = this.expandBoundingBox(boundingBox);
    var width = 256;
    var height = 256;
    var positionAndScale = TileBoundingBoxUtils.determinePositionAndScale(boundingBox, height, width, new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244), height * (1 << z), width * (1 << z));
    var xTranslate = -positionAndScale.xPositionInFinalTileStart;
    var yTranslate = -positionAndScale.yPositionInFinalTileStart;
    var pi = Math.PI, tau = 2 * pi;
    var drawProjection = d3geo.geoMercator()
      .scale((1 << z) * 256 / tau)
      .center([-180, 85.0511287798066])
      .translate([xTranslate, yTranslate]);
    var canvas;
    if (tileCanvas !== null) {
      canvas = tileCanvas;
    }
    var context;
    if (canvas === undefined || canvas === null) {
      if (FeatureTiles.useNodeCanvas) {
        var Canvas = require('canvas');
        canvas = Canvas.createCanvas(width, height);
      }
      else {
        canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
      }
    }
    context = canvas.getContext('2d');
    context.clearRect(0, 0, width, height);
    var srs = this.featureDao.getSrs();
    var tileCount = this.featureDao.countWebMercatorBoundingBox(expandedBoundingBox);
    if (this.maxFeaturesPerTile === null || tileCount <= this.maxFeaturesPerTile) {
      var iterator = this.featureDao.fastQueryWebMercatorBoundingBox(expandedBoundingBox);
      for (var featureRow of iterator) {
        var geojson = null;
        if (this.cacheGeometries) {
          geojson = this.geometryCache.getGeometryForFeatureRow(featureRow)
        }
        if (geojson === undefined || geojson === null) {
          geojson = featureRow.getGeometry().geometry.toGeoJSON();
          this.geometryCache.setGeometry(featureRow.getId(), geojson);
        }
        var style = this.getFeatureStyle(featureRow);
        if (srs.organization !== 'EPSG' || srs.organization_coordsys_id !== 4326) {
          geojson = reproject.toWgs84(geojson, this.featureDao.projection);
        }
        await this.addFeatureToBatch(geojson, context, drawProjection, boundingBox, style);
      }
      // @ts-ignore
      return new Promise(function (resolve, reject) {
        if (FeatureTiles.useNodeCanvas) {
          var writeStream = concat(function (buffer) {
            resolve(buffer);
          });
          var stream = null;
          if (this.compressFormat === 'png') {
            stream = canvas.createPNGStream();
          }
          else {
            stream = canvas.createJPEGStream();
          }
          stream.pipe(writeStream);
        }
        else {
          resolve(canvas.toDataURL('image/' + this.compressFormat));
        }
      }.bind(this));
    }
    else if (this.maxFeaturesTileDraw !== null) {
      // Draw the max features tile
      return this.maxFeaturesTileDraw.drawTile(width, height, tileCount, canvas);
    }
  }
  async drawTileWithBoundingBox(boundingBox: BoundingBox, zoom: number, tileCanvas?: any): Promise<any> {
    var width = 256;
    var height = 256;
    var positionAndScale = TileBoundingBoxUtils.determinePositionAndScale(boundingBox, height, width, new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244), height * (1 << zoom), width * (1 << zoom));
    var xTranslate = -positionAndScale.xPositionInFinalTileStart;
    var yTranslate = -positionAndScale.yPositionInFinalTileStart;
    var pi = Math.PI, tau = 2 * pi;
    var drawProjection = d3geo.geoMercator()
      .scale((1 << zoom) * 256 / tau)
      .center([-180, 85.0511287798066])
      .translate([xTranslate, yTranslate]);
    var canvas;
    if (tileCanvas !== null) {
      canvas = tileCanvas;
    }
    var context;
    if (canvas === undefined || canvas === null) {
      if (FeatureTiles.useNodeCanvas) {
        var Canvas = require('canvas');
        canvas = Canvas.createCanvas(width, height);
      }
      else {
        canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
      }
    }
    context = canvas.getContext('2d');
    context.clearRect(0, 0, width, height);
    var featureDao = this.featureDao;
    var srs = featureDao.getSrs();
    var each = featureDao.queryForEach();
    var featureRows = [];
    for (var row of each) {
      featureRows.push(featureDao.getRow(row));
    }
    for (var fr of featureRows) {
      var gj = null;
      if (this.cacheGeometries) {
        gj = this.geometryCache.getGeometryForFeatureRow(fr)
      }
      if (gj === undefined || gj === null) {
        gj = fr.getGeometry().geometry.toGeoJSON();
        this.geometryCache.setGeometry(fr.getId(), gj);
      }
      var style = this.getFeatureStyle(fr);
      if (srs.organization !== 'EPSG' || srs.organization_coordsys_id !== 4326) {
        gj = reproject.toWgs84(gj, featureDao.projection);
      }
      await this.addFeatureToBatch(gj, context, drawProjection, boundingBox, style);
    }
    // @ts-ignore
    return new Promise(function (resolve, reject) {
      if (FeatureTiles.useNodeCanvas) {
        var writeStream = concat(function (buffer) {
          resolve(buffer);
        });
        var stream = null;
        if (this.compressFormat === 'png') {
          stream = canvas.createPNGStream();
        }
        else {
          stream = canvas.createJPEGStream();
        }
        stream.pipe(writeStream);
      }
      else {
        resolve(canvas.toDataURL('image/' + this.compressFormat));
      }
    }.bind(this));
  }
  /**
   * Draw a point in the context
   * @param path
   * @param geoJson
   * @param context
   * @param boundingBox
   * @param featureStyle
   * @param drawProjection
   */
  // @ts-ignore
  async drawPoint(path: any, geoJson: any, context: any, boundingBox: BoundingBox, featureStyle: any, drawProjection: Function) {
    var width;
    var height;
    var iconX;
    var iconY;
    var transformedCoords = drawProjection([geoJson.coordinates[0], geoJson.coordinates[1]]);
    var x = transformedCoords[0];
    var y = transformedCoords[1];
    if (featureStyle !== undefined && featureStyle !== null && featureStyle.hasIcon()) {
      var iconRow = featureStyle.getIcon();
      var image = await this.iconCache.createIcon(iconRow);
      width = Math.round(this.scale * iconRow.getWidth());
      height = Math.round(this.scale * iconRow.getHeight());
      if (x >= 0 - width && x <= this.tileWidth + width && y >= 0 - height && y <= this.tileHeight + height) {
        var anchorU = iconRow.getAnchorUOrDefault();
        var anchorV = iconRow.getAnchorVOrDefault();
        iconX = Math.round(x - (anchorU * width));
        iconY = Math.round(y - (anchorV * height));
        context.drawImage(image, iconX, iconY, width, height);
      }
    }
    else if (this.pointIcon !== undefined && this.pointIcon !== null) {
      width = Math.round(this.scale * this.pointIcon.getWidth());
      height = Math.round(this.scale * this.pointIcon.getHeight());
      if (x >= 0 - width && x <= this.tileWidth + width && y >= 0 - height
        && y <= this.tileHeight + height) {
        iconX = Math.round(x - this.scale * this.pointIcon.getXOffset());
        iconY = Math.round(y - this.scale * this.pointIcon.getYOffset());
        ImageUtils.scaleBitmap(this.pointIcon.getIcon(), this.scale).then((image) => {
          context.drawImage(image, iconX, iconY, width, height);
        });
      }
    }
    else {
      context.save();
      var radius = null;
      if (featureStyle !== undefined && featureStyle !== null) {
        var styleRow = featureStyle.getStyle();
        if (styleRow !== undefined && styleRow !== null) {
          radius = this.scale * (styleRow.getWidthOrDefault() / 2.0);
        }
      }
      if (radius == null) {
        radius = this.scale * this.pointRadius;
      }
      var pointPaint = this.getPointPaint(featureStyle);
      if (x >= 0 - radius && x <= this.tileWidth + radius && y >= 0 - radius && y <= this.tileHeight + radius) {
        var circleX = Math.round(x);
        var circleY = Math.round(y);
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
   * Draw a line in the context
   * @param path
   * @param geoJson
   * @param context
   * @param featureStyle
   */
  drawLine(path, geoJson, context, featureStyle) {
    context.save();
    context.beginPath();
    var paint = this.getLinePaint(featureStyle);
    context.strokeStyle = paint.getColorRGBA();
    context.lineWidth = paint.getStrokeWidth();
    path(geoJson);
    context.stroke();
    context.closePath();
    context.restore();
  }
  /**
   * Draw a polygon in the context
   * @param path
   * @param geoJson
   * @param context
   * @param featureStyle
   */
  drawPolygon(path, geoJson, context, featureStyle) {
    context.save();
    context.beginPath();
    // @ts-ignore
    path(PolyToLine(geoJson).geometry);
    context.closePath();
    var fillPaint = this.getPolygonFillPaint(featureStyle);
    if (fillPaint !== undefined && fillPaint !== null) {
      context.fillStyle = fillPaint.getColorRGBA();
      context.fill();
    }
    var paint = this.getPolygonPaint(featureStyle);
    context.strokeStyle = paint.getColorRGBA();
    context.lineWidth = paint.getStrokeWidth();
    context.stroke();
    context.restore();
  }
  /**
   * Add a feature to the batch
   * @param geoJson
   * @param context
   * @param drawProjection
   * @param boundingBox
   * @param featureStyle
   */
  async addFeatureToBatch(geoJson, context, drawProjection, boundingBox, featureStyle) {
    var path = d3geo.geoPath()
      .context(context)
      .projection(drawProjection);
    var i, c;
    if (geoJson.type === 'Point') {
      await this.drawPoint(path, geoJson, context, boundingBox, featureStyle, drawProjection);
    }
    else if (geoJson.type === 'LineString') {
      this.drawLine(path, geoJson, context, featureStyle);
    }
    else if (geoJson.type === 'Polygon') {
      this.drawPolygon(path, geoJson, context, featureStyle);
    }
    else if (geoJson.type === 'MultiPoint') {
      for (i = 0; i < geoJson.coordinates.length; i++) {
        c = geoJson.coordinates[i];
        var ptGeom = {
          type: 'Point',
          coordinates: c
        };
        await this.drawPoint(path, ptGeom, context, boundingBox, featureStyle, drawProjection);
      }
    }
    else if (geoJson.type === 'MultiLineString') {
      for (i = 0; i < geoJson.coordinates.length; i++) {
        c = geoJson.coordinates[i];
        var lsGeom = {
          type: 'LineString',
          coordinates: c
        };
        this.drawLine(path, lsGeom, context, featureStyle);
      }
    }
    else if (geoJson.type === 'MultiPolygon') {
      for (i = 0; i < geoJson.coordinates.length; i++) {
        c = geoJson.coordinates[i];
        var pGeom = {
          type: 'Polygon',
          coordinates: c
        };
        this.drawPolygon(path, pGeom, context, featureStyle);
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
  expandWebMercatorBoundingBox(webMercatorBoundingBox: BoundingBox, tileWebMercatorBoundingBox: BoundingBox): BoundingBox {
    // Create an expanded bounding box to handle features outside the tile  that overlap
    var minLongitude = TileBoundingBoxUtils.getLongitudeFromPixel(this.tileWidth, webMercatorBoundingBox, tileWebMercatorBoundingBox, 0 - this.widthOverlap);
    var maxLongitude = TileBoundingBoxUtils.getLongitudeFromPixel(this.tileWidth, webMercatorBoundingBox, tileWebMercatorBoundingBox, this.tileWidth + this.widthOverlap);
    var maxLatitude = TileBoundingBoxUtils.getLatitudeFromPixel(this.tileHeight, webMercatorBoundingBox, tileWebMercatorBoundingBox, 0 - this.heightOverlap);
    var minLatitude = TileBoundingBoxUtils.getLatitudeFromPixel(this.tileHeight, webMercatorBoundingBox, tileWebMercatorBoundingBox, this.tileHeight + this.heightOverlap);
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
