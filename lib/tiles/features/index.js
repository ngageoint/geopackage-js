var TileBoundingBoxUtils = require('../tileBoundingBoxUtils')
  , BoundingBox = require('../../boundingBox');

var d3geo = require('d3-geo')
  , PureImage = require('pureimage')
  , lwip = require('lwip')
  , fs = require('fs')
  , async = require('async')
  , concat = require('concat-stream')
  , reproject = require('reproject')
  , bbox = require('@turf/bbox');

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
  this.lineStrokeWidth = 2.0;
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
  var boundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, z);

  // Create an expanded bounding box to handle features outside the tile that overlap
  var minLongitude = TileBoundingBoxUtils.getLongitudeFromPixelWithWidth(this.tileWidth, boundingBox, 0-this.widthOverlap);
  var maxLongitude = TileBoundingBoxUtils.getLongitudeFromPixelWithWidth(this.tileWidth, boundingBox, this.tileWidth + this.widthOverlap);

  var minLatitude = TileBoundingBoxUtils.getLatitudeFromPixelWithHeight(this.tileHeight, boundingBox, 0-this.heightOverlap);
  var maxLatitude = TileBoundingBoxUtils.getLatitudeFromPixelWithHeight(this.tileHeight, boundingBox, this.tileHeight + this.heightOverlap);
  var expandedQueryBoundingBox = new BoundingBox(minLongitude, maxLongitude, minLatitude, maxLatitude);
  var width = 256;// + (this.widthOverlap*2);
  var height = 256;// + (this.heightOverlap*2);
  var image = PureImage.make(width, height);
  var context = image.getContext('2d');
  context.clearRect(0, 0, width, height);
  context.strokeStyle = 'blue';
  context.stokeWidth = 1;
  var count = 0;

  this.featureDao.queryIndexedFeaturesWithWebMercatorBoundingBox(boundingBox, function(err, featureRow, rowDone) {
    var gj = featureRow.getGeometry().geometry.toGeoJSON();
    gj = reproject.toWgs84(gj, 'EPSG:3857');
    this.addFeatureToBatch(gj, context, z);
    count++;
    rowDone();
  }.bind(this), function(err, results) {
    console.log('count', count);
    var writeStream = concat(function(buffer) {
      callback(null, buffer);
    });
    PureImage.encodePNG(image, writeStream, function(err) {
    });
  }.bind(this));
}

FeatureTiles.prototype.drawTileQueryAll = function(x, y, z, callback) {
  var boundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, z);
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
  var width = 256;// + (this.widthOverlap*2);
  var height = 256;// + (this.heightOverlap*2);
  var image = PureImage.make(width, height);
  var context = image.getContext('2d');
  context.clearRect(0, 0, width, height);
  context.strokeStyle = 'blue';
  context.stokeWidth = 1;
  var featureDao = this.featureDao;
  featureDao.queryForEach(function(err, row, rowDone){
    var fr = featureDao.getRow(row);
    var gj = fr.getGeometry().geometry.toGeoJSON();
    gj = reproject.toWgs84(gj, 'EPSG:3857');
    this.addFeatureToBatch(gj, context, zoom);
    rowDone();
  }.bind(this), function(err, results){
    var writeStream = concat(function(buffer) {
      callback(null, buffer);
    });
    PureImage.encodePNG(image, writeStream, function(err) {
    });
  });
}

FeatureTiles.prototype.addFeatureToBatch = function(geoJson, context, zoom) {
  console.time('Creating image');
  var width = 256;// + (this.widthOverlap*2);
  var height = 256;// + (this.heightOverlap*2);
  var pi = Math.PI,
    tau = 2 * pi;

  var drawProjection = d3geo.geoMercator()
    .scale((1 << zoom) * 256 / tau)
    .translate([0, height]);

  var path = new d3geo.geoPath()
    .context(context)
    .projection(drawProjection);
  context.beginPath();
  path(geoJson);
  context.stroke();
}

FeatureTiles.prototype.addFeatureToBatch2 = function(geoJson, batch, boundingBox, callback) {
  console.time('Creating image');
  console.time('Converting GeoJSON');
  var converter = geojson2svg({
    mapExtent: {
      left: boundingBox.minLongitude,
      right: boundingBox.maxLongitude,
      bottom: boundingBox.minLatitude,
      top: boundingBox.maxLatitude
    },
    viewportSize: {
      width: 256,
      height: 256
    },
    output: 'path',
    fitTo: 'width'
  });

  // console.log('boundingBox', boundingBox);
  var t = converter.convert(geoJson);
  console.timeEnd('Converting GeoJSON');
  for (var idx = 0; idx < t.length; idx++) {
    console.time('Parsing path');
    var commandsArray = svgPathParser(t[idx]);
    console.timeEnd('Parsing path');
    console.time('setting batch');
    for (var i = 0; i < commandsArray.length; i++) {
      var x = ~~commandsArray[i].x;
      var y = ~~commandsArray[i].y;
      if (x < 0 || y < 0 || x > 255 || y > 255) continue;
      // console.log('x: %d y: %d', x, y);
      batch.setPixel(x, y, 'blue');
    }
    console.timeEnd('setting batch');
  }

  console.timeEnd('Creating image');
  callback();
}

FeatureTiles.prototype.queryIndexedFeaturesWithWebMercatorBoundingBox = function(boundingBox, callback) {

}
