const
    TileBoundingBoxUtils = require('../../../lib/tiles/tileBoundingBoxUtils').TileBoundingBoxUtils
  , TileUtils = require('../../../lib/tiles/creator/tileUtilities')
  , BoundingBox = require('../../../lib/boundingBox').BoundingBox;

require('chai').should();

describe('TileBoundingBoxUtils tests', function() {

  it('should get the max tile column when the bounds are exactly on a tile border', function(done) {
    var totalBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
    var tileMatrixWidth = 4;
    var longitude = 10018754.17139462;


    var maxColumn = TileBoundingBoxUtils.getTileColumnWithTotalBoundingBox(totalBox, tileMatrixWidth, longitude, true);
    maxColumn.should.be.equal(2);
    done();
  });

  it('should get the max tile column when the bounds are not exactly on a tile border', function(done) {
    var totalBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
    var tileMatrixWidth = 4;
    var longitude = 10018755.17139462;


    var maxColumn = TileBoundingBoxUtils.getTileColumnWithTotalBoundingBox(totalBox, tileMatrixWidth, longitude, true);
    maxColumn.should.be.equal(3);
    done();
  });

  it('should get the min tile row when the bounds are exactly on a tile border', function(done) {
    var totalBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
    var tileMatrixHeight = 4;
    var latitude = 10018754.17139462;


    var minRow = TileBoundingBoxUtils.getRowWithTotalBoundingBox(totalBox, tileMatrixHeight, latitude, true);
    minRow.should.be.equal(1);
    done();
  });

  it('should get the min tile row when the bounds are not exactly on a tile border', function(done) {
    var totalBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
    var tileMatrixHeight = 4;
    var latitude = 10018755.17139462;


    var minRow = TileBoundingBoxUtils.getRowWithTotalBoundingBox(totalBox, tileMatrixHeight, latitude, true);
    minRow.should.be.equal(0);
    done();
  });

  it('should ensure that the projected bounding box does not wrap around the world', function(done) {
    var tileBoundingBox = {minLongitude: -20037508.342789244, maxLongitude: -15028131.257091932, minLatitude: -10018754.17139462, maxLatitude: -5009377.085697312};
    var tilePieceBoundingBox = {minLongitude: -20037508.342789244, maxLongitude: -15028131.257091932, minLatitude: -10018754.171394624, maxLatitude: -5009377.085697312};
    var height = 256;
    var width = 256;
    var projectionTo = 'EPSG:3857';
    var projectionFrom = 'EPSG:3395';
    var projectionFromDefinition = 'PROJCS["WGS 84 / World Mercator",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Mercator_1SP"],PARAMETER["central_meridian",0],PARAMETER["scale_factor",1],PARAMETER["false_easting",0],PARAMETER["false_northing",0],AUTHORITY["EPSG","3395"],AXIS["Easting",EAST],AXIS["Northing",NORTH]]';
    var tileHeightUnitsPerPixel = 19567.87924100511;
    var tileWidthUnitsPerPixel = 19567.879241005125;
    var pixelXSize = 19567.87924100512;
    var pixelYSize = 19567.87924100512;
    var piecePosition = TileUtils.getPiecePosition(tilePieceBoundingBox, tileBoundingBox, height, width, projectionTo, projectionFrom, projectionFromDefinition, tileHeightUnitsPerPixel, tileWidthUnitsPerPixel, pixelXSize, pixelYSize);
    var finalWidth = (piecePosition.endX - piecePosition.startX);
    finalWidth.should.be.gt(0);
    done();
  });

  it('should determine the position and scale for same bounds and 2x scale', function() {
    var geoPackageBoundingBox = new BoundingBox(-135.0, -90, 40.979, 66.513);
    var totalBoundingBox = new BoundingBox(-135.0, -90, 40.979, 66.513);
    var totalHeight = 256;
    var totalWidth = 256;
    var tileHeight = 512;
    var tileWidth = 512;

    var p = TileBoundingBoxUtils.determinePositionAndScale(geoPackageBoundingBox, tileHeight, tileWidth, totalBoundingBox, totalHeight, totalWidth);

    p.xPositionInFinalTileStart.should.be.equal(0);
    p.yPositionInFinalTileStart.should.be.equal(0);
    p.dx.should.be.equal(0);
    p.dy.should.be.equal(0);
    p.dWidth.should.be.equal(256);
    p.dHeight.should.be.equal(256);
    p.sWidth.should.be.equal(512);
    p.sHeight.should.be.equal(512);
  });

  it('should determine the position and scale for same scale and bounds', function() {
    var geoPackageBoundingBox = new BoundingBox(-135.0, -90, 40.979, 66.513);
    var totalBoundingBox = new BoundingBox(-135.0, -90, 40.979, 66.513);
    var totalHeight = 256;
    var totalWidth = 256;
    var tileHeight = 256;
    var tileWidth = 256;

    var p = TileBoundingBoxUtils.determinePositionAndScale(geoPackageBoundingBox, tileHeight, tileWidth, totalBoundingBox, totalHeight, totalWidth);

    p.xPositionInFinalTileStart.should.be.equal(0);
    p.yPositionInFinalTileStart.should.be.equal(0);
    p.dx.should.be.equal(0);
    p.dy.should.be.equal(0);
    p.dWidth.should.be.equal(256);
    p.dHeight.should.be.equal(256);
    p.sWidth.should.be.equal(256);
    p.sHeight.should.be.equal(256);
  });

  it('should determine the position and scale for same scale and left shift', function() {
    var geoPackageBoundingBox = new BoundingBox(-140.0, -95, 40.979, 66.513);
    var totalBoundingBox = new BoundingBox(-135.0, -90, 40.979, 66.513);
    var totalHeight = 256;
    var totalWidth = 256;
    var tileHeight = 256;
    var tileWidth = 256;

    var p = TileBoundingBoxUtils.determinePositionAndScale(geoPackageBoundingBox, tileHeight, tileWidth, totalBoundingBox, totalHeight, totalWidth);
    p.xPositionInFinalTileStart.should.be.lessThan(0);
    p.yPositionInFinalTileStart.should.be.equal(0);
    p.dx.should.be.lessThan(0);
    p.dy.should.be.equal(0);
    p.dWidth.should.be.equal(256);
    p.dHeight.should.be.equal(256);
    p.sWidth.should.be.equal(256);
    p.sHeight.should.be.equal(256);
  });

  it('should determine the position and scale for same scale and right shift', function() {
    var geoPackageBoundingBox = new BoundingBox(-130.0, -85, 40.979, 66.513);
    var totalBoundingBox = new BoundingBox(-135.0, -90, 40.979, 66.513);
    var totalHeight = 256;
    var totalWidth = 256;
    var tileHeight = 256;
    var tileWidth = 256;

    var p = TileBoundingBoxUtils.determinePositionAndScale(geoPackageBoundingBox, tileHeight, tileWidth, totalBoundingBox, totalHeight, totalWidth);

    p.xPositionInFinalTileStart.should.be.greaterThan(0);
    p.yPositionInFinalTileStart.should.be.equal(0);
    p.dx.should.be.greaterThan(0);
    p.dy.should.be.equal(0);
    p.dWidth.should.be.equal(256);
    p.dHeight.should.be.equal(256);
    p.sWidth.should.be.equal(256);
    p.sHeight.should.be.equal(256);
  });

  it('should determine the position and scale for same scale and shift up', function() {
    var geoPackageBoundingBox = new BoundingBox(-135.0, -90, 45.979, 71.513);
    var totalBoundingBox = new BoundingBox(-135.0, -90, 40.979, 66.513);
    var totalHeight = 256;
    var totalWidth = 256;
    var tileHeight = 256;
    var tileWidth = 256;

    var p = TileBoundingBoxUtils.determinePositionAndScale(geoPackageBoundingBox, tileHeight, tileWidth, totalBoundingBox, totalHeight, totalWidth);

    p.xPositionInFinalTileStart.should.be.equal(0);
    p.yPositionInFinalTileStart.should.be.lessThan(0);
    p.dx.should.be.equal(0);
    p.dy.should.be.lessThan(0);
    p.dWidth.should.be.equal(256);
    p.dHeight.should.be.equal(256);
    p.sWidth.should.be.equal(256);
    p.sHeight.should.be.equal(256);
  });

  it('should determine the position and scale for same scale and shift down', function() {
    var geoPackageBoundingBox = new BoundingBox(-135.0, -90, 35.979, 61.513);
    var totalBoundingBox = new BoundingBox(-135.0, -90, 40.979, 66.513);
    var totalHeight = 256;
    var totalWidth = 256;
    var tileHeight = 256;
    var tileWidth = 256;

    var p = TileBoundingBoxUtils.determinePositionAndScale(geoPackageBoundingBox, tileHeight, tileWidth, totalBoundingBox, totalHeight, totalWidth);

    p.xPositionInFinalTileStart.should.be.equal(0);
    p.yPositionInFinalTileStart.should.be.greaterThan(0);
    p.dx.should.be.equal(0);
    p.dy.should.be.greaterThan(0);
    p.dWidth.should.be.equal(256);
    p.dHeight.should.be.within(255, 256);
    p.sWidth.should.be.equal(256);
    p.sHeight.should.be.equal(256);
  });

  it('should determine the position and scale for same scale and bigger bounds', function() {
    var geoPackageBoundingBox = new BoundingBox(-140.0, -85, 35.979, 71.513);
    var totalBoundingBox = new BoundingBox(-135.0, -90, 40.979, 66.513);
    var totalHeight = 256;
    var totalWidth = 256;
    var tileHeight = 256;
    var tileWidth = 256;

    var p = TileBoundingBoxUtils.determinePositionAndScale(geoPackageBoundingBox, tileHeight, tileWidth, totalBoundingBox, totalHeight, totalWidth);

    p.xPositionInFinalTileStart.should.be.lessThan(0);
    p.yPositionInFinalTileStart.should.be.lessThan(0);
    p.dx.should.be.lessThan(0);
    p.dy.should.be.lessThan(0);
    p.dWidth.should.be.greaterThan(256);
    p.dHeight.should.be.greaterThan(256);
    p.sWidth.should.be.equal(256);
    p.sHeight.should.be.equal(256);
  });

  it('should determine the position and scale for same scale and smaller bounds', function() {
    var geoPackageBoundingBox = new BoundingBox(-130.0, -95, 45.979, 61.513);
    var totalBoundingBox = new BoundingBox(-135.0, -90, 40.979, 66.513);
    var totalHeight = 256;
    var totalWidth = 256;
    var tileHeight = 256;
    var tileWidth = 256;

    var p = TileBoundingBoxUtils.determinePositionAndScale(geoPackageBoundingBox, tileHeight, tileWidth, totalBoundingBox, totalHeight, totalWidth);

    p.xPositionInFinalTileStart.should.be.greaterThan(0);
    p.yPositionInFinalTileStart.should.be.greaterThan(0);
    p.dx.should.be.greaterThan(0);
    p.dy.should.be.greaterThan(0);
    p.dWidth.should.be.lessThan(256);
    p.dHeight.should.be.lessThan(256);
    p.sWidth.should.be.equal(256);
    p.sHeight.should.be.equal(256);
  });

  it('should determine the position and scale for same scale and not contained in the bounds', function() {
    var geoPackageBoundingBox = new BoundingBox(90, 135.0, -66.513, -40.979);
    var totalBoundingBox = new BoundingBox(-135.0, -90, 40.979, 66.513);
    var totalHeight = 256;
    var totalWidth = 256;
    var tileHeight = 256;
    var tileWidth = 256;

    var p = TileBoundingBoxUtils.determinePositionAndScale(geoPackageBoundingBox, tileHeight, tileWidth, totalBoundingBox, totalHeight, totalWidth);

    p.xPositionInFinalTileStart.should.be.greaterThan(255);
    p.yPositionInFinalTileStart.should.be.greaterThan(255);
    p.dx.should.be.greaterThan(0);
    p.dy.should.be.greaterThan(0);
    p.dWidth.should.be.equal(256);
    p.dHeight.should.be.equal(256);
    p.sWidth.should.be.equal(256);
    p.sHeight.should.be.equal(256);
  });

  it('should get the web mercator tile box for each zoom level', function() {
    var webMercatorBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);

    for (var i = 0; i <= 18; i++) {
      var box = TileBoundingBoxUtils.webMercatorTileBox(webMercatorBox, i);
      box.minX.should.be.equal(0);
      box.minY.should.be.equal(0);
      box.maxX.should.be.equal(Math.pow(2, i)-1);
      box.maxY.should.be.equal(Math.pow(2, i)-1);
    }
  });

  it('should get the web mercator tile box for each zoom level with smaller box', function() {
    var webMercatorBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.34278924, 20037508.342789244);

    for (var i = 0; i <= 18; i++) {
      var box = TileBoundingBoxUtils.webMercatorTileBox(webMercatorBox, i);
      box.minX.should.be.equal(0);
      box.minY.should.be.equal(0);
      box.maxX.should.be.equal(Math.pow(2, i)-1);
      box.maxY.should.be.equal(Math.pow(2, i)-1);
    }
  });

  it('should get the web mercator tile box for each zoom level for the eastern hemisphere', function() {
    var webMercatorBox = new BoundingBox(0, 20037508.342789244, -20037508.342789244, 20037508.342789244);

    for (var i = 0; i <= 18; i++) {
      var box = TileBoundingBoxUtils.webMercatorTileBox(webMercatorBox, i);
      box.minX.should.be.equal(Math.floor(Math.pow(2, i)/2));
      box.minY.should.be.equal(0);
      box.maxX.should.be.equal(Math.pow(2, i)-1);
      box.maxY.should.be.equal(Math.pow(2, i)-1);
    }
  });

  it('should get the web mercator tile box for each zoom level for the western hemisphere', function() {
    var webMercatorBox = new BoundingBox(-20037508.342789244, 0, -20037508.342789244, 20037508.342789244);

    for (var i = 0; i <= 18; i++) {
      var box = TileBoundingBoxUtils.webMercatorTileBox(webMercatorBox, i);
      box.minX.should.be.equal(0);
      box.minY.should.be.equal(0);
      box.maxX.should.be.equal(Math.floor((Math.pow(2, i)-1)/2));
      box.maxY.should.be.equal(Math.pow(2, i)-1);
    }
  });

  it('should get the web mercator tile box for each zoom level for the northern hemisphere', function() {
    var webMercatorBox = new BoundingBox(-20037508.342789244, 20037508.342789244, 0, 20037508.342789244);

    for (var i = 0; i <= 18; i++) {
      var box = TileBoundingBoxUtils.webMercatorTileBox(webMercatorBox, i);
      box.minX.should.be.equal(0);
      box.minY.should.be.equal(0);
      box.maxX.should.be.equal(Math.pow(2, i)-1);
      box.maxY.should.be.equal(Math.floor((Math.pow(2, i)-1)/2));
    }
  });

  it('should get the web mercator tile box for each zoom level for the southern hemisphere', function() {
    var webMercatorBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 0);

    for (var i = 0; i <= 18; i++) {
      var box = TileBoundingBoxUtils.webMercatorTileBox(webMercatorBox, i);
      box.minX.should.be.equal(0);
      box.minY.should.be.equal(Math.floor(Math.pow(2, i)/2));
      box.maxX.should.be.equal(Math.pow(2, i)-1);
      box.maxY.should.be.equal(Math.pow(2, i)-1);
    }
  });

  it('should produce the correct tile bounding box without high precision input bounds', function() {
    const webMercatorBox = new BoundingBox(-20037508.3, 20037508.3, -20037508.3, 20037508.3);
    const tileBox = TileBoundingBoxUtils.webMercatorTileBox(webMercatorBox, 12);

    tileBox.minX.should.equal(0);
    tileBox.maxX.should.equal(4095);
    tileBox.minY.should.equal(0);
    tileBox.maxY.should.equal(4095);
  });

  it('should clamp bounds outside 3857 bounds', function() {

    const webMercatorBox = new BoundingBox(-20037509, 20037509, -20037509, 20037509);
    const tileBox = TileBoundingBoxUtils.webMercatorTileBox(webMercatorBox, 12);

    tileBox.minX.should.equal(0);
    tileBox.maxX.should.equal(4095);
    tileBox.minY.should.equal(0);
    tileBox.maxY.should.equal(4095);
  });
});
