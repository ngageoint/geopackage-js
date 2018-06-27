var TileBoundingBoxUtils = require('../tileBoundingBoxUtils')
  , BoundingBox = require('../../boundingBox');

var d3geo = require('d3-geo')
  , PureImage = require('pureimage')
  , fs = require('fs')
  , async = require('async')
  , concat = require('concat-stream')
  , reproject = require('reproject')
  , bbox = require('@turf/bbox')
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
  this.lineStrokeWidth = 2;
  this.polygonStrokeWidth = 2.0;
  this.fillPolygon = false;

  this.calculateDrawOverlap();
}

module.exports = FeatureTiles;

FeatureTiles.prototype.getFeatureDao = function () {
  return this.featureDao;
}

FeatureTiles.prototype.calculateDrawOverlap = function() {
  if (this.pointIcon) {
    this.heightOverlap = this.pointIcon.getHeight();
    this.widthOverlap = this.pointIcon.getWidth();
  } else {
    this.heightOverlap = this.pointRadius;
    this.widthOverlap = this.pointRadius;
  }

  var lineHalfStroke = this.lineStrokeWidth / 2.0;
  this.heightOverlap = Math.max(this.heightOverlap, lineHalfStroke);
  this.widthOverlap = Math.max(this.widthOverlap, lineHalfStroke);

  var polygonHalfStroke = this.polygonStrokeWidth / 2.0;
  this.heightOverlap = Math.max(this.heightOverlap, polygonHalfStroke);
  this.widthOverlap = Math.max(this.widthOverlap, polygonHalfStroke);
}

FeatureTiles.prototype.setDrawOverlapsWithPixels = function(pixels) {
  this.widthOverlap = pixels;
  this.heightOverlap = pixels;
}

FeatureTiles.prototype.drawTile = function (x, y, z, callback) {
  this.featureDao.isIndexed(function(err, indexed) {
    if (indexed) {
      this.drawTileQueryIndex(x, y, z, callback);
    } else {
      this.drawTileQueryAll(x, y, z, callback);
    }
  }.bind(this));
}

FeatureTiles.prototype.drawTileQueryIndex = function(x, y, z, callback) {
  console.log('Draw tile query index');
  var boundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, z);
  var width = 256;
  var height = 256;

  var positionAndScale = TileBoundingBoxUtils.determinePositionAndScale(boundingBox, height, width, new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244), height * (1 << z), width * (1 << z));
  var xTranslate = -positionAndScale.xPositionInFinalTileStart;
  var yTranslate = -positionAndScale.yPositionInFinalTileStart;

  var image = PureImage.make(width, height);
  var context = image.getContext('2d');
  context.clearRect(0, 0, width, height);
  context.strokeStyle = 'blue';
  context.fillStyle = 'rgba(0, 0, 255, .2)';
  context.lineWidth = this.lineStrokeWidth;
  var count = 0;
  console.time('Creating image');

  this.featureDao.getSrs(function(err, srs){
    this.featureDao.fastQueryWebMercatorBoundingBox(boundingBox, function(err, featureRow, rowDone) {
      var gj = featureRow.getGeometry().geometry.toGeoJSON();
      if (srs.organization !== 'EPSG' || srs.organization_coordsys_id !== 4326) {
        gj = reproject.toWgs84(gj, srs.organization + ':' + srs.organization_coordsys_id);
      }
      if (gj.type === 'Polygon') {
        gj = PolyToLine(gj);
      }
      this.addFeatureToBatch(gj, context, xTranslate, yTranslate, z);
      count++;
      rowDone();
    }.bind(this), function(err, results) {
      console.log('count', count);
      console.timeEnd('Creating image');

      var writeStream = concat(function(buffer) {
        callback(null, buffer);
      });
      PureImage.encodePNGToStream(image, writeStream);
    }.bind(this));
  }.bind(this));
}

FeatureTiles.prototype.drawTileQueryAll = function(x, y, zoom, callback) {
  var boundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);

  this.featureDao.getCount(function(err, count) {
    var totalCount;
    if (this.maxFeaturesPerTile) {
      totalCount = count;
    }
    if (!this.maxFeaturesPerTile || totalCount <= this.maxFeaturesPerTile) {
      this.drawTileWithBoundingBox(boundingBox, zoom, callback);
    } else {
      // draw the unindexed max features tile
      callback();
    }
  }.bind(this));
}

FeatureTiles.prototype.drawTileWithBoundingBox = function(boundingBox, zoom, callback) {
  var width = 256;
  var height = 256;
  var positionAndScale = TileBoundingBoxUtils.determinePositionAndScale(boundingBox, height, width, new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244), height * (1 << zoom), width * (1 << zoom));
  var xTranslate = -positionAndScale.xPositionInFinalTileStart;
  var yTranslate = -positionAndScale.yPositionInFinalTileStart;

  var image = PureImage.make(width, height);
  var context = image.getContext('2d');
  context.clearRect(0, 0, width, height);
  context.strokeStyle = 'blue';
  context.fillStyle = 'rgba(0, 0, 255, .2)';
  context.lineWidth = this.lineStrokeWidth;
  var featureDao = this.featureDao;
  featureDao.getSrs(function(err, srs){
    featureDao.queryForEach(function(err, row, rowDone){
      var fr = featureDao.getRow(row);
      var gj = fr.getGeometry().geometry.toGeoJSON();
      if (srs.organization !== 'EPSG' || srs.organization_coordsys_id !== 4326) {
        gj = reproject.toWgs84(gj, srs.organization + ':' + srs.organization_coordsys_id);
      }
      if (gj.type === 'Polygon') {
        gj = PolyToLine(gj);
      }
      this.addFeatureToBatch(gj, context, xTranslate, yTranslate, zoom);
      rowDone();
    }.bind(this), function(err, results){
      var writeStream = concat(function(buffer) {
        callback(null, buffer);
      });
      PureImage.encodePNGToStream(image, writeStream);
    });
  }.bind(this));
}

FeatureTiles.prototype.addFeatureToBatch = function(geoJson, context, xTranslate, yTranslate, zoom) {
  var width = 256;
  var height = 256;
  var pi = Math.PI,
    tau = 2 * pi;
  var drawProjection = d3geo.geoMercator()
    .scale((1 << zoom) * 256 / tau)
    .center([-180, 85.0511287798066])
    .translate([xTranslate, yTranslate]);
  var path = new d3geo.geoPath()
    .context(context)
    .projection(drawProjection);
  context.beginPath();
  path(geoJson);
  context.stroke();
  if (geoJson.type === 'Point') {
    context.fill();
  }
}
