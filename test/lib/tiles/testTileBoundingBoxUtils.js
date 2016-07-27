var TileBoundingBoxUtils = require('../../../lib/tiles/tileBoundingBoxUtils')
  , BoundingBox = require('../../../lib/boundingBox');

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


    var minRow = TileBoundingBoxUtils.getTileRowWithTotalBoundingBox(totalBox, tileMatrixHeight, latitude, true);
    minRow.should.be.equal(1);
    done();
  });

  it('should get the min tile row when the bounds are not exactly on a tile border', function(done) {
    var totalBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
    var tileMatrixHeight = 4;
    var latitude = 10018755.17139462;


    var minRow = TileBoundingBoxUtils.getTileRowWithTotalBoundingBox(totalBox, tileMatrixHeight, latitude, true);
    minRow.should.be.equal(0);
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
    p.xPositionInFinalTileEnd.should.be.equal(255);
    p.yPositionInFinalTileStart.should.be.equal(0);
    p.yPositionInFinalTileEnd.should.be.equal(255);
    p.tileCropXStart.should.be.equal(0);
    p.tileCropXEnd.should.be.equal(511);
    p.tileCropYStart.should.be.equal(0);
    p.tileCropYEnd.should.be.equal(511);

    p.yScale.should.be.equal(.5);
    p.xScale.should.be.equal(.5);
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
    p.xPositionInFinalTileEnd.should.be.equal(255);
    p.yPositionInFinalTileStart.should.be.equal(0);
    p.yPositionInFinalTileEnd.should.be.equal(255);
    p.tileCropXStart.should.be.equal(0);
    p.tileCropXEnd.should.be.equal(255);
    p.tileCropYStart.should.be.equal(0);
    p.tileCropYEnd.should.be.equal(255);

    p.yScale.should.be.equal(1);
    p.xScale.should.be.equal(1);
  });

  it('should determine the position and scale for same scale and left shift', function() {
    var geoPackageBoundingBox = new BoundingBox(-140.0, -95, 40.979, 66.513);
    var totalBoundingBox = new BoundingBox(-135.0, -90, 40.979, 66.513);
    var totalHeight = 256;
    var totalWidth = 256;
    var tileHeight = 256;
    var tileWidth = 256;

    var p = TileBoundingBoxUtils.determinePositionAndScale(geoPackageBoundingBox, tileHeight, tileWidth, totalBoundingBox, totalHeight, totalWidth);

    p.xPositionInFinalTileStart.should.be.equal(0);
    p.xPositionInFinalTileEnd.should.be.lessThan(255);
    p.yPositionInFinalTileStart.should.be.equal(0);
    p.yPositionInFinalTileEnd.should.be.equal(255);
    p.tileCropXStart.should.be.greaterThan(0);
    p.tileCropXEnd.should.be.equal(255);
    p.tileCropYStart.should.be.equal(0);
    p.tileCropYEnd.should.be.equal(255);

    p.yScale.should.be.equal(1);
    p.xScale.should.be.equal(1);
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
    p.xPositionInFinalTileEnd.should.be.equal(255);
    p.yPositionInFinalTileStart.should.be.equal(0);
    p.yPositionInFinalTileEnd.should.be.equal(255);
    p.tileCropXStart.should.be.equal(0);
    p.tileCropXEnd.should.be.lessThan(255);
    p.tileCropYStart.should.be.equal(0);
    p.tileCropYEnd.should.be.equal(255);

    p.yScale.should.be.equal(1);
    p.xScale.should.be.equal(1);
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
    p.xPositionInFinalTileEnd.should.be.equal(255);
    p.yPositionInFinalTileStart.should.be.equal(0);
    p.yPositionInFinalTileEnd.should.be.lessThan(255);
    p.tileCropXStart.should.be.equal(0);
    p.tileCropXEnd.should.be.equal(255);
    p.tileCropYStart.should.be.greaterThan(0);
    p.tileCropYEnd.should.be.equal(255);

    p.yScale.should.be.equal(1);
    p.xScale.should.be.equal(1);
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
    p.xPositionInFinalTileEnd.should.be.equal(255);
    p.yPositionInFinalTileStart.should.be.greaterThan(0);
    p.yPositionInFinalTileEnd.should.be.equal(255);
    p.tileCropXStart.should.be.equal(0);
    p.tileCropXEnd.should.be.equal(255);
    p.tileCropYStart.should.be.equal(0);
    p.tileCropYEnd.should.be.lessThan(255);

    p.yScale.should.be.equal(1);
    p.xScale.should.be.equal(1);
  });

  it('should determine the position and scale for same scale and bigger bounds', function() {
    var geoPackageBoundingBox = new BoundingBox(-140.0, -85, 35.979, 71.513);
    var totalBoundingBox = new BoundingBox(-135.0, -90, 40.979, 66.513);
    var totalHeight = 256;
    var totalWidth = 256;
    var tileHeight = 256;
    var tileWidth = 256;

    var p = TileBoundingBoxUtils.determinePositionAndScale(geoPackageBoundingBox, tileHeight, tileWidth, totalBoundingBox, totalHeight, totalWidth);

    p.xPositionInFinalTileStart.should.be.equal(0);
    p.xPositionInFinalTileEnd.should.be.equal(255);
    p.yPositionInFinalTileStart.should.be.equal(0);
    p.yPositionInFinalTileEnd.should.be.equal(255);
    p.tileCropXStart.should.be.greaterThan(0);
    p.tileCropXEnd.should.be.lessThan(255);
    p.tileCropYStart.should.be.greaterThan(0);
    p.tileCropYEnd.should.be.lessThan(255);

    p.yScale.should.be.greaterThan(1);
    p.xScale.should.be.greaterThan(1);
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
    p.xPositionInFinalTileEnd.should.be.lessThan(255);
    p.yPositionInFinalTileStart.should.be.greaterThan(0);
    p.yPositionInFinalTileEnd.should.be.lessThan(255);
    p.tileCropXStart.should.be.equal(0);
    p.tileCropXEnd.should.be.equal(255);
    p.tileCropYStart.should.be.equal(0);
    p.tileCropYEnd.should.be.equal(255);

    p.yScale.should.be.lessThan(1);
    p.xScale.should.be.lessThan(1);
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
    p.xPositionInFinalTileEnd.should.be.equal(255);
    p.yPositionInFinalTileStart.should.be.greaterThan(255);
    p.yPositionInFinalTileEnd.should.be.equal(255);
    p.tileCropXStart.should.be.equal(0);
    p.tileCropXEnd.should.be.lessThan(0);
    p.tileCropYStart.should.be.equal(0);
    p.tileCropYEnd.should.be.lessThan(0);

    p.yScale.should.be.equal(1);
    p.xScale.should.be.equal(1);
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


});
