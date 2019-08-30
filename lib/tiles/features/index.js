/**
 * FeatureTiles module.
 * @module tiles/features
 */
var TileBoundingBoxUtils = require('../tileBoundingBoxUtils')
  , BoundingBox = require('../../boundingBox')
  , FeatureTableStyles = require('../../extension/style/featureTableStyles')
  , FeatureTableIndex = require('../../extension/index/featureTableIndex')
  , Paint = require('./paint')
  , FeaturePaintCache = require('./featurePaintCache')
  , FeatureDrawType = require('./featureDrawType')
  , IconCache = require('../../extension/style/iconCache');

var d3geo = require('d3-geo')
  , PureImage = require('pureimage')
  , fs = require('fs')
  , concat = require('concat-stream')
  , reproject = require('reproject')
  , bbox = require('@turf/bbox')
  , TurfCircle = require('@turf/circle').default
  , PolyToLine = require('@turf/polygon-to-line').default
  , tilebelt = require('@mapbox/tilebelt');

/**
 *  Tiles drawn from or linked to features. Used to query features and optionally draw tiles
 *  from those features.
 */
var FeatureTiles = function(featureDao, tileWidth, tileHeight) {
  this.featureDao = featureDao;
  this.tileWidth = tileWidth || 256;
  this.tileHeight = tileHeight || 256;
  this.compressFormat = 'png';
  this.pointRadius = 4.0;
  this.pointPaint = new Paint();
  this.pointIcon = null;
  this.linePaint = new Paint();
  this.linePaint.setStrokeWidth(2.0);
  this.lineStrokeWidth = 2.0;
  this.polygonPaint = new Paint();
  this.polygonPaint.setStrokeWidth(2.0);
  this.polygonStrokeWidth = 2.0;
  this.fillPolygon = true;
  this.polygonFillPaint = new Paint();
  this.featurePaintCache = new FeaturePaintCache();
  this.iconCache = new IconCache();
  this.scale = 1.0;
  this.geoPackage = this.featureDao.geoPackage;
  if (this.geoPackage != null) {
    this.featureTableStyles = new FeatureTableStyles(this.geoPackage, this.featureDao.getTable());
    if (!this.featureTableStyles.has()) {
      this.featureTableStyles = null;
    }
  }
  this.maxFeaturesPerTile = null;
  this.maxFeaturesTileDraw = null;
  this.calculateDrawOverlap();
};

/**
 * Set the scale
 * @param {Number} scale scale factor
 */
FeatureTiles.prototype.setScale = function (scale) {
  this.scale = scale;
  this.linePaint.setStrokeWidth(scale * this.lineStrokeWidth);
  this.polygonPaint.setStrokeWidth(scale * this.polygonStrokeWidth);
  this.featurePaintCache.clear();
};

/**
 * Get the scale
 * @return {Number} scale factor
 */
FeatureTiles.prototype.getScale = function () {
  return this.scale;
};

/**
 * Manually set the width and height draw overlap
 * @param {Number} pixels pixels
 */
FeatureTiles.prototype.setDrawOverlap = function (pixels) {
  this.setWidthDrawOverlap(pixels);
  this.setHeightDrawOverlap(pixels);
};

/**
 * Get the width draw overlap
 * @return {Number} width draw overlap
 */
FeatureTiles.prototype.getWidthDrawOverlap = function () {
  return this.widthOverlap;
};

/**
 * Manually set the width draw overlap
 * @param {Number} pixels pixels
 */
FeatureTiles.prototype.setWidthDrawOverlap = function (pixels) {
  this.widthOverlap = pixels;
};

/**
 * Get the height draw overlap
 * @return {Number} height draw overlap
 */
FeatureTiles.prototype.getHeightDrawOverlap = function () {
  return this.heightOverlap;
};

/**
 * Manually set the height draw overlap
 * @param {Number} pixels pixels
 */
FeatureTiles.prototype.setHeightDrawOverlap = function (pixels) {
  this.heightOverlap = pixels;
};

/**
 * Get the feature DAO
 * @return {module:features/user/featureDao} feature dao
 */
FeatureTiles.prototype.getFeatureDao = function () {
  return this.featureDao;
};

/**
 * Get the feature table styles
 * @return {module:extension/style~FeatureTableStyles} feature table styles
 */
FeatureTiles.prototype.getFeatureTableStyles = function () {
  return this.featureTableStyles;
};

/**
 * Set the feature table styles
 * @param {module:extension/style~FeatureTableStyles} featureTableStyles feature table styles
 */
FeatureTiles.prototype.setFeatureTableStyles = function (featureTableStyles) {
  this.featureTableStyles = featureTableStyles;
};

/**
 * Ignore the feature table styles within the GeoPackage
 */
FeatureTiles.prototype.ignoreFeatureTableStyles = function () {
  this.setFeatureTableStyles(null);
  this.calculateDrawOverlap();
};

/**
 * Clear all caches
 */
FeatureTiles.prototype.clearCache = function () {
  this.clearStylePaintCache();
  this.clearIconCache();
};

/**
 * Clear the style paint cache
 */
FeatureTiles.prototype.clearStylePaintCache = function () {
  this.featurePaintCache.clear();
};

/**
 * Set / resize the style paint cache size
 *
 * @param {Number} size
 * @since 3.3.0
 */
FeatureTiles.prototype.setStylePaintCacheSize = function (size) {
  this.featurePaintCache.resize(size);
};

/**
 * Clear the icon cache
 */
FeatureTiles.prototype.clearIconCache = function () {
  this.iconCache.clear();
};

/**
 * Set / resize the icon cache size
 * @param {Number} size new size
 */
FeatureTiles.prototype.setIconCacheSize = function (size) {
  this.iconCache.resize(size);
};

/**
 * Get the tile width
 * @return {Number} tile width
 */
FeatureTiles.prototype.getTileWidth = function () {
  return this.tileWidth;
};

/**
 * Set the tile width
 * @param {Number} tileWidth tile width
 */
FeatureTiles.prototype.setTileWidth = function (tileWidth) {
  this.tileWidth = tileWidth;
};

/**
 * Get the tile height
 * @return {Number} tile height
 */
FeatureTiles.prototype.getTileHeight = function () {
  return this.tileHeight;
};

/**
 * Set the tile height
 * @param {Number} tileHeight tile height
 */
FeatureTiles.prototype.setTileHeight = function (tileHeight) {
  this.tileHeight = tileHeight;
};

/**
 * Get the compress format
 * @return {String} compress format
 */
FeatureTiles.prototype.getCompressFormat = function () {
  return this.compressFormat;
};

/**
 * Set the compress format
 * @param {String} compressFormat compress format
 */
FeatureTiles.prototype.setCompressFormat = function (compressFormat) {
  this.compressFormat = compressFormat;
};

/**
 * Set the scale
 *
 * @param {Number} scale scale factor
 */
FeatureTiles.prototype.setScale = function(scale) {
  this.scale = scale;
  this.linePaint.setStrokeWidth(scale * this.lineStrokeWidth);
  this.polygonPaint.setStrokeWidth(scale * this.polygonStrokeWidth);
  this.featurePaintCache.clear();
};

/**
 * Get the scale
 * @return {Number} scale factor
 */
FeatureTiles.prototype.getScale = function() {
  return this.scale;
};

FeatureTiles.prototype.calculateDrawOverlap = function() {
  if (this.pointIcon) {
    this.heightOverlap = this.scale * this.pointIcon.getHeight();
    this.widthOverlap = this.scale * this.pointIcon.getWidth();
  } else {
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
      styleRowIds.concat(tableStyleIds);
    }
    var styleIds = this.featureTableStyles.getAllStyleIds();
    if (styleIds != null) {
      styleRowIds.concat(styleIds.filter(id => styleRowIds.indexOf(id) === -1));
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
      iconRowIds.concat(tableIconIds);
    }
    var iconIds = this.featureTableStyles.getAllIconIds();
    if (iconIds != null) {
      iconRowIds.concat(iconIds.filter(id => iconRowIds.indexOf(id) === -1));
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
};

FeatureTiles.prototype.setDrawOverlapsWithPixels = function(pixels) {
  this.widthOverlap = pixels;
  this.heightOverlap = pixels;
};

FeatureTiles.prototype.getFeatureStyle = function(featureRow) {
  var featureStyle = null;
  if (this.featureTableStyles !== null) {
    featureStyle = this.featureTableStyles.getFeatureStyleForFeatureRow(featureRow);
  }
  return featureStyle;
};

/**
 * Get the point paint for the feature style, or return the default paint
 * @param featureStyle feature style
 * @return paint
 */
FeatureTiles.prototype.getPointPaint = function(featureStyle) {
  var paint = this.getFeatureStylePaint(featureStyle, FeatureDrawType.CIRCLE);
  if (paint == null) {
    paint = this.pointPaint;
  }
  return paint;
};

/**
 * Get the line paint for the feature style, or return the default paint
 * @param featureStyle feature style
 * @return paint
 */
FeatureTiles.prototype.getLinePaint = function(featureStyle) {
  var paint = this.getFeatureStylePaint(featureStyle, FeatureDrawType.STROKE);
  if (paint == null) {
    paint = this.linePaint;
  }
  return paint;
};

/**
 * Get the polygon paint for the feature style, or return the default paint
 * @param featureStyle feature style
 * @return paint
 */
FeatureTiles.prototype.getPolygonPaint = function(featureStyle) {
  var paint = this.getFeatureStylePaint(featureStyle, FeatureDrawType.STROKE);
  if (paint == null) {
    paint = this.polygonPaint;
  }
  return paint;
};

/**
 * Get the polygon fill paint for the feature style, or return the default
 * paint
 * @param featureStyle feature style
 * @return paint
 */
FeatureTiles.prototype.getPolygonFillPaint = function(featureStyle) {
  var paint = null;
  var hasStyleColor = false;
  if (featureStyle != null) {
    var style = featureStyle.getStyle();
    if (style != null) {
      if (style.hasFillColor()) {
        paint = this.getStylePaint(style, FeatureDrawType.FILL);
      } else {
        hasStyleColor = style.hasColor();
      }
    }
  }
  if (paint == null && !hasStyleColor && this.fillPolygon) {
    paint = this.polygonFillPaint;
  }
  return paint;
};

/**
 * Get the feature style paint from cache, or create and cache it
 * @param featureStyle feature style
 * @param drawType draw type
 * @return feature style paint
 */
FeatureTiles.prototype.getFeatureStylePaint = function(featureStyle, drawType) {
  var paint = null;
  if (featureStyle != null) {
    var style = featureStyle.getStyle();
    if (style != null && style.hasColor()) {
      paint = this.getStylePaint(style, drawType);
    }
  }
  return paint;
};

/**
 * Get the style paint from cache, or create and cache it
 * @param style style row
 * @param drawType draw type
 * @return paint
 */
FeatureTiles.prototype.getStylePaint = function(style, drawType) {
  var paint = this.featurePaintCache.getPaint(style, drawType);
  if (paint == null) {
    var color = null;
    var strokeWidth = null;
    if (drawType === FeatureDrawType.CIRCLE) {
      color = style.getColor();
    } else if (drawType === FeatureDrawType.STROKE) {
      color = style.getColor();
      strokeWidth = this.scale * style.getWidthOrDefault();
    } else if (drawType === FeatureDrawType.FILL) {
      color = style.getFillColor();
      strokeWidth = this.scale * style.getWidthOrDefault();
    } else {
      throw new Error("Unsupported Draw Type: " + drawType);
    }
    var stylePaint = new Paint();
    stylePaint.setColor(color);
    if (strokeWidth != null) {
      stylePaint.setStrokeWidth(strokeWidth);
    }
    paint = this.featurePaintCache.getPaintForStyleRow(style, drawType);
    if (paint == null) {
      this.featurePaintCache.setPaint(style, drawType, stylePaint);
      paint = stylePaint;
    }
  }
  return paint;
};

/**
 * Get the point radius
 * @return {Number} radius
 */
FeatureTiles.prototype.getPointRadius = function() {
  return this.pointRadius;
};

/**
 * Set the point radius
 * @param {Number} pointRadius point radius
 */
FeatureTiles.prototype.setPointRadius = function(pointRadius) {
  this.pointRadius = pointRadius;
};

/**
 * Get point color
 * @return {String} color
 */
FeatureTiles.prototype.getPointColor = function() {
  return this.pointPaint.getColor();
};

/**
 * Set point color
 * @param {String} pointColor point color
 */
FeatureTiles.prototype.setPointColor = function(pointColor) {
  this.pointPaint.setColor(pointColor);
};

/**
 * Get the point icon
 * @return {Bitmap} icon
 */
FeatureTiles.prototype.getPointIcon = function() {
  return this.pointIcon;
};

/**
 * Set the point icon
 * @param {Bitmap} pointIcon point icon
 */
FeatureTiles.prototype.setPointIcon = function(pointIcon) {
  this.pointIcon = pointIcon;
};

/**
 * Get line stroke width
 * @return {Number} width
 */
FeatureTiles.prototype.getLineStrokeWidth = function() {
  return this.lineStrokeWidth;
};

/**
 * Set line stroke width
 * @param {Number} lineStrokeWidth line stroke width
 */
FeatureTiles.prototype.setLineStrokeWidth = function(lineStrokeWidth) {
  this.lineStrokeWidth = lineStrokeWidth;
  this.linePaint.setStrokeWidth(this.scale * this.lineStrokeWidth);
};

/**
 * Get line color
 * @return {String} color
 */
FeatureTiles.prototype.getLineColor = function() {
  return this.linePaint.getColor();
};

/**
 * Set line color
 * @param {String} lineColor line color
 */
FeatureTiles.prototype.setLineColor = function(lineColor) {
  this.linePaint.setColor(lineColor);
};

/**
 * Get polygon stroke width
 * @return {Number} width
 */
FeatureTiles.prototype.getPolygonStrokeWidth = function() {
  return this.polygonStrokeWidth;
};

/**
 * Set polygon stroke width
 * @param {Number} polygonStrokeWidth polygon stroke width
 */
FeatureTiles.prototype.setPolygonStrokeWidth = function(polygonStrokeWidth) {
  this.polygonStrokeWidth = polygonStrokeWidth;
  this.polygonPaint.setStrokeWidth(this.scale * this.polygonStrokeWidth);
};

/**
 * Get polygon color
 * @return {String} color
 */
FeatureTiles.prototype.getPolygonColor = function() {
  return this.polygonPaint.getColor();
};

/**
 * Set polygon color
 * @param {String} polygonColor polygon color
 */
FeatureTiles.prototype.setPolygonColor = function(polygonColor) {
  this.polygonPaint.setColor(polygonColor);
};

/**
 * Is fill polygon
 * @return {Boolean} true if fill polygon
 */
FeatureTiles.prototype.isFillPolygon = function() {
  return this.fillPolygon;
};

/**
 * Set the fill polygon
 * @param {Boolean} fillPolygon fill polygon
 */
FeatureTiles.prototype.setFillPolygon = function(fillPolygon) {
  this.fillPolygon = fillPolygon;
};

/**
 * Get polygon fill color
 * @return {String} color
 */
FeatureTiles.prototype.getPolygonFillColor = function() {
  return this.polygonFillPaint.getColor();
};

/**
 * Set polygon fill color
 * @param {String} polygonFillColor polygon fill color
 */
FeatureTiles.prototype.setPolygonFillColor = function(polygonFillColor) {
  this.polygonFillPaint.setColor(polygonFillColor);
};

/**
 * Get the max features per tile
 * @return {Number} max features per tile or null
 */
FeatureTiles.prototype.getMaxFeaturesPerTile = function() {
  return this.maxFeaturesPerTile;
};

/**
 * Set the max features per tile. When more features are returned in a query
 * to create a single tile, the tile is not created.
 * @param {Number} maxFeaturesPerTile  max features per tile
 */
FeatureTiles.prototype.setMaxFeaturesPerTile = function(maxFeaturesPerTile) {
  this.maxFeaturesPerTile = maxFeaturesPerTile;
};

/**
 * Get the max features tile draw, the custom tile drawing implementation
 * for tiles with more features than the max at #getMaxFeaturesPerTile
 * @return {module:tiles/features/custom~CustomFeatureTile} max features tile draw or null
 */
FeatureTiles.prototype.getMaxFeaturesTileDraw = function() {
  return this.maxFeaturesTileDraw;
};

/**
 * Set the max features tile draw, used to draw tiles when more features for
 * a single tile than the max at #getMaxFeaturesPerTile exist
 * @param {module:tiles/features/custom~CustomFeatureTile} maxFeaturesTileDraw max features tile draw
 */
FeatureTiles.prototype.setMaxFeaturesTileDraw = function(maxFeaturesTileDraw) {
  this.maxFeaturesTileDraw = maxFeaturesTileDraw;
};

FeatureTiles.prototype.drawTile = function (x, y, z) {
  var indexed = this.featureDao.isIndexed();
  if (indexed) {
    return this.drawTileQueryIndex(x, y, z);
  } else {
    return this.drawTileQueryAll(x, y, z);
  }
};

FeatureTiles.prototype.drawTileQueryAll = function(x, y, zoom) {
  var boundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
  var count = this.featureDao.getCount();
  if (this.maxFeaturesPerTile === null || count <= this.maxFeaturesPerTile) {
    return this.drawTileWithBoundingBox(boundingBox, zoom);
  } else if (this.maxFeaturesTileDraw !== null) {
    return this.maxFeaturesTileDraw.drawUnindexedTile(256, 256);
  }
};

FeatureTiles.prototype.drawTileQueryIndex = function(x, y, z) {
  var boundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, z);
  var width = 256;
  var height = 256;

  var positionAndScale = TileBoundingBoxUtils.determinePositionAndScale(boundingBox, height, width, new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244), height * (1 << z), width * (1 << z));
  var xTranslate = -positionAndScale.xPositionInFinalTileStart;
  var yTranslate = -positionAndScale.yPositionInFinalTileStart;

  var image = PureImage.make(width, height);
  var context = image.getContext('2d');
  context.imageSmoothingEnabled = true;
  context.clearRect(0, 0, width, height);
  console.time('Creating image');
  var srs = this.featureDao.getSrs();
  var tileCount = this.featureDao.countWebMercatorBoundingBox(boundingBox);
  if (this.maxFeaturesPerTile === null || tileCount <= this.maxFeaturesPerTile) {
    var iterator = this.featureDao.fastQueryWebMercatorBoundingBox(boundingBox);
    var geojsonFeatures = []
    for (var featureRow of iterator) {
      var gj = featureRow.getGeometry().geometry.toGeoJSON();
      geojsonFeatures.push(gj);
    }
    for (var gj of geojsonFeatures) {
      var style = this.getFeatureStyle(featureRow);
      if (srs.organization !== 'EPSG' || srs.organization_coordsys_id !== 4326) {
        gj = reproject.toWgs84(gj, this.featureDao.projection);
      }
      if (gj.type === 'Polygon') {
        gj = PolyToLine(gj);
      }
      this.addFeatureToBatch(gj, context, xTranslate, yTranslate, z, boundingBox, style, width, height);
    }
  } else if (this.maxFeaturesTileDraw !== null) {
    // Draw the max features tile
    image = this.maxFeaturesTileDraw.drawTile(width, height, tileCount);
  }

  console.timeEnd('Creating image');
  return new Promise(function(resolve, reject) {
    var writeStream = concat(function(buffer) {
      resolve(buffer);
    });
    if (this.compressFormat === 'png') {
      PureImage.encodePNGToStream(image, writeStream);
    } else {
      PureImage.encodeJPEGToStream(image, writeStream);
    }
  }.bind(this));
};

FeatureTiles.prototype.drawTileWithBoundingBox = function(boundingBox, zoom) {
  var width = 256;
  var height = 256;
  var positionAndScale = TileBoundingBoxUtils.determinePositionAndScale(boundingBox, height, width, new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244), height * (1 << zoom), width * (1 << zoom));
  var xTranslate = -positionAndScale.xPositionInFinalTileStart;
  var yTranslate = -positionAndScale.yPositionInFinalTileStart;

  var image = PureImage.make(width, height);
  var context = image.getContext('2d');
  context.clearRect(0, 0, width, height);
  var featureDao = this.featureDao;
  var srs = featureDao.getSrs();
  var each = featureDao.queryForEach();
  for (var row of each) {
    var fr = featureDao.getRow(row);
    var gj = fr.getGeometry().geometry.toGeoJSON();
    var style = this.getFeatureStyle(fr);
    if (srs.organization !== 'EPSG' || srs.organization_coordsys_id !== 4326) {
      gj = reproject.toWgs84(gj, featureDao.projection);
    }
    if (gj.type === 'Polygon') {
      gj = PolyToLine(gj);
    }
    this.addFeatureToBatch(gj, context, xTranslate, yTranslate, zoom, boundingBox, style, width, height);
  }
  return new Promise(function(resolve, reject) {
    var writeStream = concat(function(buffer) {
      resolve(buffer);
    });
    if (this.compressFormat === 'png') {
      PureImage.encodePNGToStream(image, writeStream);
    } else {
      PureImage.encodeJPEGToStream(image, writeStream);
    }
  }.bind(this));
};

/**
 * Draw a point in the context
 * @param path
 * @param geoJson
 * @param context
 * @param boundingBox
 * @param featureStyle
 * @param width
 * @param height
 */
FeatureTiles.prototype.drawPoint = function(path, geoJson, context, boundingBox, featureStyle, width, height) {
  var iconWidth;
  var iconHeight;
  var iconX;
  var iconY;
  if (featureStyle != null && featureStyle.hasIcon()) {
    var iconRow = featureStyle.getIcon();
    var icon = this.getIcon(iconRow);
    iconWidth = this.scale * icon.getWidth();
    iconHeight = this.scale * icon.getHeight();
    iconX = Math.round( -1 * this.scale * (iconRow.getAnchorUOrDefault() * iconWidth));
    iconY = Math.round(-1 * this.scale * (iconRow.getAnchorVOrDefault() * iconHeight));
    // TODO: verify this
    context.drawImage(this.getIcon(iconRow), iconX, iconY, iconWidth, iconHeight);
  } else if (this.pointIcon != null) {
    iconWidth = Math.round(this.scale * this.pointIcon.getWidth());
    iconHeight = Math.round(this.scale * this.pointIcon.getHeight());
    iconX = Math.round(-1 * this.scale * this.pointIcon.getXOffset());
    iconY = Math.round(-1 * this.scale * this.pointIcon.getYOffset());
    // TODO: verify this
    context.drawImage(this.pointIcon.getIcon(), iconX, iconY, iconWidth, iconHeight);
  } else {
    context.beginPath();
    var radius = null;
    if (featureStyle != null) {
      var styleRow = featureStyle.getStyle();
      if (styleRow != null) {
        radius = this.scale * (styleRow.getWidthOrDefault() / 2.0);
      }
    }
    if (radius == null) {
      radius = this.scale * this.pointRadius;
    }
    var pointPaint = this.getPointPaint(featureStyle);
    context.strokeStyle = pointPaint.getColor();
    context.fillStyle = pointPaint.getColor();
    context.lineWidth = pointPaint.getStrokeWidth();
    var pointKilometers = (((boundingBox.maxLatitude - boundingBox.minLatitude) / height) * radius) / 1000;
    if (pointKilometers > 1) {
      path(geoJson);
      context.stroke();
    } else {
      console.time('turf circle');
      var circle = TurfCircle(geoJson, pointKilometers, {units:'kilometers'});
      console.timeEnd('turf circle');
      path(circle);
      context.stroke();
      context.fill();
    }
    context.closePath();
  }
};

/**
 * Draw a line in the context
 * @param path
 * @param geoJson
 * @param context
 * @param featureStyle
 */
FeatureTiles.prototype.drawLine = function(path, geoJson, context, featureStyle) {
  context.beginPath();
  var paint = this.getLinePaint(featureStyle);
  context.strokeStyle = paint.getStrokeStyle();
  context.lineWidth = paint.getStrokeWidth();
  path(geoJson);
  context.stroke();
  context.closePath();
};

/**
 * Draw a polygon in the context
 * @param path
 * @param geoJson
 * @param context
 * @param featureStyle
 */
FeatureTiles.prototype.drawPolygon = function(path, geoJson, context, featureStyle) {
  context.beginPath();
  var paint = this.getPolygonPaint(featureStyle);
  context.strokeStyle = paint.getStrokeStyle();
  context.lineWidth = paint.getStrokeWidth();
  path(geoJson);
  context.stroke();
  var fillPaint = this.getPolygonFillPaint(featureStyle);
  if (fillPaint !== null) {
    context.fillStyle = fillPaint.getColor();
    context.fill();
  }
  context.closePath();
};

/**
 * Add a feature to the batch
 * @param geoJson
 * @param context
 * @param xTranslate
 * @param yTranslate
 * @param zoom
 * @param boundingBox
 * @param featureStyle
 * @param width
 * @param height
 */
FeatureTiles.prototype.addFeatureToBatch = function(geoJson, context, xTranslate, yTranslate, zoom, boundingBox, featureStyle, width, height) {
  var pi = Math.PI,
    tau = 2 * pi;
  var drawProjection = d3geo.geoMercator()
    .scale((1 << zoom) * 256 / tau)
    .center([-180, 85.0511287798066])
    .translate([xTranslate, yTranslate]);
  var path = new d3geo.geoPath()
    .context(context)
    .projection(drawProjection);
    if (geoJson.type === 'Point') {
      this.drawPoint(path, geoJson, context, boundingBox, featureStyle, width, height);
    } else if (geoJson.type === 'LineString') {
      this.drawLine(path, geoJson, context, featureStyle);
    } else if (geoJson.type === 'Polygon') {
      this.drawPolygon(path, geoJson, context, featureStyle);
    } else if (geoJson.type === 'MultiPoint') {
      geoJson.coordinates.forEach(c => {
        var ptGeom = {
          type: 'Point',
          coordinates: c
        };
        this.drawPoint(path, ptGeom, context, boundingBox, featureStyle, width, height);
      });
    } else if (geoJson.type === 'MultiLineString') {
      geoJson.coordinates.forEach(c => {
        var lsGeom = {
          type: 'LineString',
          coordinates: c
        };
        this.drawLine(path, lsGeom, context, featureStyle);
      });
    } else if (geoJson.type === 'MultiPolygon') {
      geoJson.coordinates.forEach(c => {
        var pGeom = {
          type: 'Polygon',
          coordinates: c
        };
        this.drawPolygon(path, pGeom, context, featureStyle);
      });
    }
};

module.exports = FeatureTiles;
