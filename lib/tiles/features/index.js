/**
 * FeatureTiles module.
 * @module tiles/features
 */
var TileBoundingBoxUtils = require('../tileBoundingBoxUtils')
  , BoundingBox = require('../../boundingBox')
  , FeatureTableStyles = require('../../extension/style/featureTableStyles')
  , Paint = require('./paint')
  , FeaturePaintCache = require('./featurePaintCache')
  , FeatureDrawType = require('./featureDrawType')
  , IconCache = require('../../extension/style/iconCache')
  , ImageUtils = require('../imageUtils');

var d3geo = require('d3-geo')
  , concat = require('concat-stream')
  , reproject = require('reproject')
  , PolyToLine = require('@turf/polygon-to-line').default;

/**
 *  Tiles drawn from or linked to features. Used to query features and optionally draw tiles
 *  from those features.
 */
var FeatureTiles = function(featureDao, tileWidth = null, tileHeight = null) {
  var isElectron = !!(typeof navigator != 'undefined' && navigator.userAgent.toLowerCase().indexOf(' electron/') > -1);
  var isPhantom = !!(typeof window != 'undefined' && window.callPhantom && window._phantom);
  var isNode = typeof(process) !== 'undefined' && process.version;
  this.useNodeCanvas =  isNode && !isPhantom && !isElectron;
  this.featureDao = featureDao;
  this.tileWidth = tileWidth !== null ? tileWidth : 256;
  this.tileHeight = tileHeight !== null ? tileHeight : 256;
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
  if (paint === null) {
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
  if (paint === null && !hasStyleColor && this.fillPolygon) {
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
    if (style !== null && style.hasColor()) {
      paint = this.getStylePaint(style, drawType);
    }
  }
  return paint;
};

/**
 * Get the style paint from cache, or create and cache it
 * @param style style row
 * @param drawType draw type
 * @return {Paint} paint
 */
FeatureTiles.prototype.getStylePaint = function(style, drawType) {
  var paint = this.featurePaintCache.getPaintForStyleRow(style, drawType);
  if (paint === undefined || paint === null) {
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
 * @return {module:tiles/features.FeatureTilePointIcon} icon
 */
FeatureTiles.prototype.getPointIcon = function() {
  return this.pointIcon;
};

/**
 * Set the point icon
 * @param {module:tiles/features.FeatureTilePointIcon} pointIcon point icon
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

FeatureTiles.prototype.drawTile = function (x, y, z, canvas = null) {
  var indexed = this.featureDao.isIndexed();
  if (indexed) {
    return this.drawTileQueryIndex(x, y, z, canvas);
  } else {
    return this.drawTileQueryAll(x, y, z, canvas);
  }
};

FeatureTiles.prototype.drawTileQueryAll = function(x, y, zoom, canvas) {
  var boundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
  // expand bounding box

  var count = this.featureDao.getCount();
  if (this.maxFeaturesPerTile === null || count <= this.maxFeaturesPerTile) {
    return this.drawTileWithBoundingBox(boundingBox, zoom, canvas);
  } else if (this.maxFeaturesTileDraw !== null) {
    return this.maxFeaturesTileDraw.drawUnindexedTile(256, 256, canvas);
  }
};

FeatureTiles.prototype.drawTileQueryIndex = async function(x, y, z, tileCanvas) {
  var boundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, z);
  boundingBox = this.expandBoundingBox(boundingBox);

  var width = 256;
  var height = 256;

  var positionAndScale = TileBoundingBoxUtils.determinePositionAndScale(boundingBox, height, width, new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244), height * (1 << z), width * (1 << z));
  var xTranslate = -positionAndScale.xPositionInFinalTileStart;
  var yTranslate = -positionAndScale.yPositionInFinalTileStart;

  var pi = Math.PI,
    tau = 2 * pi;
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
    if (this.useNodeCanvas) {
      var Canvas = require('canvas');
      canvas = Canvas.createCanvas(width, height);
    } else {
      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
    }
  }
  context = canvas.getContext('2d');
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
      await this.addFeatureToBatch(gj, context, drawProjection, boundingBox, style);
    }
    console.timeEnd('Creating image');
    return new Promise(function(resolve, reject) {
      if (this.useNodeCanvas) {
        var writeStream = concat(function (buffer) {
          resolve(buffer);
        });
        var stream = null;
        if (this.compressFormat === 'png') {
          stream = canvas.createPNGStream();
        } else {
          stream = canvas.createJPEGStream();
        }
        stream.pipe(writeStream);
      } else {
        resolve(canvas.toDataURL('image/' + this.compressFormat));
      }
    }.bind(this));
  } else if (this.maxFeaturesTileDraw !== null) {
    // Draw the max features tile
    return this.maxFeaturesTileDraw.drawTile(width, height, tileCount, canvas);
  }
};

FeatureTiles.prototype.drawTileWithBoundingBox = async function(boundingBox, zoom, tileCanvas) {
  var width = 256;
  var height = 256;
  var positionAndScale = TileBoundingBoxUtils.determinePositionAndScale(boundingBox, height, width, new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244), height * (1 << zoom), width * (1 << zoom));
  var xTranslate = -positionAndScale.xPositionInFinalTileStart;
  var yTranslate = -positionAndScale.yPositionInFinalTileStart;

  var pi = Math.PI,
    tau = 2 * pi;
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
    if (this.useNodeCanvas) {
      var Canvas = require('canvas');
      canvas = Canvas.createCanvas(width, height);
    } else {
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
    var gj = fr.getGeometry().geometry.toGeoJSON();
    var style = this.getFeatureStyle(fr);
    if (srs.organization !== 'EPSG' || srs.organization_coordsys_id !== 4326) {
      gj = reproject.toWgs84(gj, featureDao.projection);
    }
    await this.addFeatureToBatch(gj, context, drawProjection, boundingBox, style);
  }
  return new Promise(function(resolve, reject) {
    if (this.useNodeCanvas) {
      var writeStream = concat(function (buffer) {
        resolve(buffer);
      });
      var stream = null;
      if (this.compressFormat === 'png') {
        stream = canvas.createPNGStream();
      } else {
        stream = canvas.createJPEGStream();
      }
      stream.pipe(writeStream);
    } else {
      resolve(canvas.toDataURL('image/' + this.compressFormat));
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
 * @param drawProjection
 */
FeatureTiles.prototype.drawPoint = async function(path, geoJson, context, boundingBox, featureStyle, drawProjection) {
  var width;
  var height;
  var iconX;
  var iconY;
  var transformedCoords = drawProjection([geoJson.coordinates[0], geoJson.coordinates[1]]);
  var x = transformedCoords[0];
  var y = transformedCoords[1];

  if (featureStyle !== undefined && featureStyle !== null && featureStyle.hasIcon()) {
    var iconRow = featureStyle.getIcon();
    var image = await iconRow.getDataImage(iconRow);
    width = Math.round(this.scale * iconRow.getWidth());
    height = Math.round(this.scale * iconRow.getHeight());
    if (x >= 0 - width && x <= this.tileWidth + width && y >= 0 - height && y <= this.tileHeight + height) {
      var anchorU = iconRow.getAnchorUOrDefault();
      var anchorV = iconRow.getAnchorVOrDefault();
      iconX = Math.round(x - (anchorU * width));
      iconY = Math.round(y - (anchorV * height));
      context.drawImage(image, iconX, iconY, width, height);
    }
  } else if (this.pointIcon !== undefined && this.pointIcon !== null) {
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
  } else {
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
      context.closePath()
      context.fillStyle = pointPaint.getColorRGBA();
      context.fill();
    }
    context.restore();
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
  context.save();
  context.beginPath();
  var paint = this.getLinePaint(featureStyle);
  context.strokeStyle = paint.getColorRGBA();
  context.lineWidth = paint.getStrokeWidth();
  path(geoJson);
  context.stroke();
  context.closePath();
  context.restore();
};

/**
 * Draw a polygon in the context
 * @param path
 * @param geoJson
 * @param context
 * @param featureStyle
 */
FeatureTiles.prototype.drawPolygon = function(path, geoJson, context, featureStyle) {
  context.save();
  context.beginPath();
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
};

/**
 * Add a feature to the batch
 * @param geoJson
 * @param context
 * @param drawProjection
 * @param boundingBox
 * @param featureStyle
 */
FeatureTiles.prototype.addFeatureToBatch = async function(geoJson, context, drawProjection, boundingBox, featureStyle) {
  var path = new d3geo.geoPath()
    .context(context)
    .projection(drawProjection);
  var i, c;
  if (geoJson.type === 'Point') {
    await this.drawPoint(path, geoJson, context, boundingBox, featureStyle, drawProjection);
  } else if (geoJson.type === 'LineString') {
    this.drawLine(path, geoJson, context, featureStyle);
  } else if (geoJson.type === 'Polygon') {
    this.drawPolygon(path, geoJson, context, featureStyle);
  } else if (geoJson.type === 'MultiPoint') {
    for (i = 0; i < geoJson.coordinates.length; i++) {
      c = geoJson.coordinates[i];
      var ptGeom = {
        type: 'Point',
        coordinates: c
      };
      await this.drawPoint(path, ptGeom, context, boundingBox, featureStyle, drawProjection);
    }
  } else if (geoJson.type === 'MultiLineString') {
    for (i = 0; i < geoJson.coordinates.length; i++) {
      c = geoJson.coordinates[i];
      var lsGeom = {
        type: 'LineString',
        coordinates: c
      };
      this.drawLine(path, lsGeom, context, featureStyle);
    }
  } else if (geoJson.type === 'MultiPolygon') {
    for (i = 0; i < geoJson.coordinates.length; i++) {
      c = geoJson.coordinates[i];
      var pGeom = {
        type: 'Polygon',
        coordinates: c
      };
      this.drawPolygon(path, pGeom, context, featureStyle);
    }
  }
};

/**
 * Create an expanded bounding box to handle features outside the tile that overlap
 * @param webMercatorBoundingBox  web mercator bounding box
 * @return {BoundingBox} bounding box
 */
FeatureTiles.prototype.expandBoundingBox = function(webMercatorBoundingBox) {
  return this.expandWebMercatorBoundingBox(webMercatorBoundingBox, webMercatorBoundingBox);
};

/**
 * Create an expanded bounding box to handle features outside the tile that overlap
 * @param webMercatorBoundingBox web mercator bounding box
 * @param tileWebMercatorBoundingBox  tile web mercator bounding box
 * @return {BoundingBox} bounding box
 */
FeatureTiles.prototype.expandWebMercatorBoundingBox = function(webMercatorBoundingBox, tileWebMercatorBoundingBox) {
  // Create an expanded bounding box to handle features outside the tile  that overlap
  var minLongitude = TileBoundingBoxUtils.getLongitudeFromPixel(this.tileWidth, webMercatorBoundingBox, tileWebMercatorBoundingBox, 0 - this.widthOverlap);
  var maxLongitude = TileBoundingBoxUtils.getLongitudeFromPixel(this.tileWidth, webMercatorBoundingBox, tileWebMercatorBoundingBox,  this.tileWidth + this.widthOverlap);
  var maxLatitude = TileBoundingBoxUtils.getLatitudeFromPixel(this.tileHeight, webMercatorBoundingBox, tileWebMercatorBoundingBox, 0 - this.heightOverlap);
  var minLatitude = TileBoundingBoxUtils.getLatitudeFromPixel(this.tileHeight, webMercatorBoundingBox, tileWebMercatorBoundingBox, this.tileHeight +this. heightOverlap);

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
};

module.exports = FeatureTiles;
