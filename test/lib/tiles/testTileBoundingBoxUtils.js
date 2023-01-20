const TileBoundingBoxUtils = require('../../../lib/tiles/tileBoundingBoxUtils').TileBoundingBoxUtils
  , BoundingBox = require('../../../lib/boundingBox').BoundingBox
  , { Projections, Projection } = require('@ngageoint/projections-js');

require('chai').should();

describe('TileBoundingBoxUtils tests', function() {

  it('should get the max tile column when the bounds are exactly on a tile border', function(done) {
    var totalBox = new BoundingBox(-20037508.342789244, -20037508.342789244, 20037508.342789244, 20037508.342789244);
    var tileMatrixWidth = 4;
    var longitude = 10018754.17139462;


    var maxColumn = TileBoundingBoxUtils.getTileColumn(totalBox, tileMatrixWidth, longitude);
    maxColumn.should.be.equal(3);
    done();
  });

  it('should get the max tile column when the bounds are not exactly on a tile border', function(done) {
    var totalBox = new BoundingBox(-20037508.342789244, -20037508.342789244, 20037508.342789244, 20037508.342789244);
    var tileMatrixWidth = 4;
    var longitude = 10018755.17139462;


    var maxColumn = TileBoundingBoxUtils.getTileColumn(totalBox, tileMatrixWidth, longitude);
    maxColumn.should.be.equal(3);
    done();
  });

  it('should get the min tile row when the bounds are exactly on a tile border', function(done) {
    var totalBox = new BoundingBox(-20037508.342789244, -20037508.342789244, 20037508.342789244, 20037508.342789244);
    var tileMatrixHeight = 4;
    var latitude = 10018754.17139462;


    var minRow = TileBoundingBoxUtils.getTileRow(totalBox, tileMatrixHeight, latitude);
    minRow.should.be.equal(1);
    done();
  });

  it('should get the min tile row when the bounds are not exactly on a tile border', function(done) {
    var totalBox = new BoundingBox(-20037508.342789244, -20037508.342789244, 20037508.342789244, 20037508.342789244);
    var tileMatrixHeight = 4;
    var latitude = 10018755.17139462;

    var minRow = TileBoundingBoxUtils.getTileRow(totalBox, tileMatrixHeight, latitude);
    minRow.should.be.equal(0);
    done();
  });

  it('should get the web mercator tile box for each zoom level', function() {
    var webMercatorBox = new BoundingBox(-20037508.342789244, -20037508.342789244, 20037508.342789244, 20037508.342789244);

    for (var i = 0; i <= 18; i++) {
      var box = TileBoundingBoxUtils.getTileGridWithBoundingBoxAndZoom(webMercatorBox, i);
      box.getMinX().should.be.equal(0);
      box.getMinY().should.be.equal(0);
      box.getMaxX().should.be.equal(Math.pow(2, i)-1);
      box.getMaxY().should.be.equal(Math.pow(2, i)-1);
    }
  });

  it('should get the web mercator tile box for each zoom level with smaller box', function() {
    var webMercatorBox = new BoundingBox(-20037508.342789244, -20037508.34278924, 20037508.342789244, 20037508.342789244);

    for (var i = 0; i <= 18; i++) {
      var box = TileBoundingBoxUtils.getTileGridWithBoundingBoxAndZoom(webMercatorBox, i);
      box.getMinX().should.be.equal(0);
      box.getMinY().should.be.equal(0);
      box.getMaxX().should.be.equal(Math.pow(2, i)-1);
      box.getMaxY().should.be.equal(Math.pow(2, i)-1);
    }
  });

  it('should get the web mercator tile box for each zoom level for the eastern hemisphere', function() {
    var webMercatorBox = new BoundingBox(0, -20037508.342789244, 20037508.342789244, 20037508.342789244);

    for (var i = 0; i <= 18; i++) {
      var box = TileBoundingBoxUtils.getTileGridWithBoundingBoxAndZoom(webMercatorBox, i);
      box.getMinX().should.be.equal(Math.floor(Math.pow(2, i)/2));
      box.getMinY().should.be.equal(0);
      box.getMaxX().should.be.equal(Math.pow(2, i)-1);
      box.getMaxY().should.be.equal(Math.pow(2, i)-1);
    }
  });

  it('should get the web mercator tile box for each zoom level for the western hemisphere', function() {
    var webMercatorBox = new BoundingBox(-20037508.342789244, -20037508.342789244, 0, 20037508.342789244);

    for (var i = 0; i <= 18; i++) {
      var box = TileBoundingBoxUtils.getTileGridWithBoundingBoxAndZoom(webMercatorBox, i);
      box.getMinX().should.be.equal(0);
      box.getMinY().should.be.equal(0);
      box.getMaxX().should.be.equal(Math.floor((Math.pow(2, i)-1)/2));
      box.getMaxY().should.be.equal(Math.pow(2, i)-1);
    }
  });

  it('should get the web mercator tile box for each zoom level for the northern hemisphere', function() {
    var webMercatorBox = new BoundingBox(-20037508.342789244, 0, 20037508.342789244, 20037508.342789244);

    for (var i = 0; i <= 18; i++) {
      var box = TileBoundingBoxUtils.getTileGridWithBoundingBoxAndZoom(webMercatorBox, i);
      box.getMinX().should.be.equal(0);
      box.getMinY().should.be.equal(0);
      box.getMaxX().should.be.equal(Math.pow(2, i)-1);
      box.getMaxY().should.be.equal(Math.floor((Math.pow(2, i)-1)/2));
    }
  });

  it('should get the web mercator tile box for each zoom level for the southern hemisphere', function() {
    var webMercatorBox = new BoundingBox(-20037508.342789244, -20037508.342789244, 20037508.342789244, 0);

    for (var i = 0; i <= 18; i++) {
      var box = TileBoundingBoxUtils.getTileGridWithBoundingBoxAndZoom(webMercatorBox, i);
      box.getMinX().should.be.equal(0);
      box.getMinY().should.be.equal(Math.floor(Math.pow(2, i)/2));
      box.getMaxX().should.be.equal(Math.pow(2, i)-1);
      box.getMaxY().should.be.equal(Math.pow(2, i)-1);
    }
  });

  it('should produce the correct tile bounding box without high precision input bounds', function() {
    const webMercatorBox = new BoundingBox(-20037508.3, -20037508.3, 20037508.3, 20037508.3);
    const tileBox = TileBoundingBoxUtils.getTileGridWithBoundingBoxAndZoom(webMercatorBox, 12);

    tileBox.getMinX().should.equal(0);
    tileBox.getMaxX().should.equal(4095);
    tileBox.getMinY().should.equal(0);
    tileBox.getMaxY().should.equal(4095);
  });
});
