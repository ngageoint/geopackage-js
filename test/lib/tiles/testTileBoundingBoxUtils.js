const TileBoundingBoxUtils = require('../../../lib/tiles/tileBoundingBoxUtils').TileBoundingBoxUtils,
  BoundingBox = require('../../../lib/boundingBox').BoundingBox;

require('chai').should();

describe('TileBoundingBoxUtils tests', function () {
  it('should get the max tile column when the bounds are exactly on a tile border', function (done) {
    var totalBox = new BoundingBox(-20037508.342789244, -20037508.342789244, 20037508.342789244, 20037508.342789244);
    var tileMatrixWidth = 4;
    var longitude = 10018754.17139462;

    var maxColumn = TileBoundingBoxUtils.getTileColumn(totalBox, tileMatrixWidth, longitude);
    maxColumn.should.be.equal(3);
    done();
  });

  it('should get the max tile column when the bounds are not exactly on a tile border', function (done) {
    var totalBox = new BoundingBox(-20037508.342789244, -20037508.342789244, 20037508.342789244, 20037508.342789244);
    var tileMatrixWidth = 4;
    var longitude = 10018755.17139462;

    var maxColumn = TileBoundingBoxUtils.getTileColumn(totalBox, tileMatrixWidth, longitude);
    maxColumn.should.be.equal(3);
    done();
  });

  it('should get the min tile row when the bounds are exactly on a tile border', function (done) {
    var totalBox = new BoundingBox(-20037508.342789244, -20037508.342789244, 20037508.342789244, 20037508.342789244);
    var tileMatrixHeight = 4;
    var latitude = 10018754.17139462;

    var minRow = TileBoundingBoxUtils.getTileRow(totalBox, tileMatrixHeight, latitude);
    minRow.should.be.equal(1);
    done();
  });

  it('should get the min tile row when the bounds are not exactly on a tile border', function (done) {
    var totalBox = new BoundingBox(-20037508.342789244, -20037508.342789244, 20037508.342789244, 20037508.342789244);
    var tileMatrixHeight = 4;
    var latitude = 10018755.17139462;

    var minRow = TileBoundingBoxUtils.getTileRow(totalBox, tileMatrixHeight, latitude);
    minRow.should.be.equal(0);
    done();
  });

  it('should get the web mercator tile box for each zoom level', function () {
    var webMercatorBox = new BoundingBox(
      -20037508.342789244,
      -20037508.342789244,
      20037508.342789244,
      20037508.342789244,
    );

    for (var i = 0; i <= 18; i++) {
      var box = TileBoundingBoxUtils.getTileGridWithBoundingBoxAndZoom(webMercatorBox, i);
      box.getMinX().should.be.equal(0);
      box.getMinY().should.be.equal(0);
      box.getMaxX().should.be.equal(Math.pow(2, i) - 1);
      box.getMaxY().should.be.equal(Math.pow(2, i) - 1);
    }
  });

  it('should get the web mercator tile box for each zoom level with smaller box', function () {
    var webMercatorBox = new BoundingBox(
      -20037508.342789244,
      -20037508.34278924,
      20037508.342789244,
      20037508.342789244,
    );

    for (var i = 0; i <= 18; i++) {
      var box = TileBoundingBoxUtils.getTileGridWithBoundingBoxAndZoom(webMercatorBox, i);
      box.getMinX().should.be.equal(0);
      box.getMinY().should.be.equal(0);
      box.getMaxX().should.be.equal(Math.pow(2, i) - 1);
      box.getMaxY().should.be.equal(Math.pow(2, i) - 1);
    }
  });

  it('should get the web mercator tile box for each zoom level for the eastern hemisphere', function () {
    var webMercatorBox = new BoundingBox(0, -20037508.342789244, 20037508.342789244, 20037508.342789244);

    for (var i = 0; i <= 18; i++) {
      var box = TileBoundingBoxUtils.getTileGridWithBoundingBoxAndZoom(webMercatorBox, i);
      box.getMinX().should.be.equal(Math.floor(Math.pow(2, i) / 2));
      box.getMinY().should.be.equal(0);
      box.getMaxX().should.be.equal(Math.pow(2, i) - 1);
      box.getMaxY().should.be.equal(Math.pow(2, i) - 1);
    }
  });

  it('should get the web mercator tile box for each zoom level for the western hemisphere', function () {
    var webMercatorBox = new BoundingBox(-20037508.342789244, -20037508.342789244, 0, 20037508.342789244);

    for (var i = 0; i <= 18; i++) {
      var box = TileBoundingBoxUtils.getTileGridWithBoundingBoxAndZoom(webMercatorBox, i);
      box.getMinX().should.be.equal(0);
      box.getMinY().should.be.equal(0);
      box.getMaxX().should.be.equal(Math.floor((Math.pow(2, i) - 1) / 2));
      box.getMaxY().should.be.equal(Math.pow(2, i) - 1);
    }
  });

  it('should get the web mercator tile box for each zoom level for the northern hemisphere', function () {
    var webMercatorBox = new BoundingBox(-20037508.342789244, 0, 20037508.342789244, 20037508.342789244);

    for (var i = 0; i <= 18; i++) {
      var box = TileBoundingBoxUtils.getTileGridWithBoundingBoxAndZoom(webMercatorBox, i);
      box.getMinX().should.be.equal(0);
      box.getMinY().should.be.equal(0);
      box.getMaxX().should.be.equal(Math.pow(2, i) - 1);
      box.getMaxY().should.be.equal(Math.floor((Math.pow(2, i) - 1) / 2));
    }
  });

  it('should get the web mercator tile box for each zoom level for the southern hemisphere', function () {
    var webMercatorBox = new BoundingBox(-20037508.342789244, -20037508.342789244, 20037508.342789244, 0);

    for (var i = 0; i <= 18; i++) {
      var box = TileBoundingBoxUtils.getTileGridWithBoundingBoxAndZoom(webMercatorBox, i);
      box.getMinX().should.be.equal(0);
      box.getMinY().should.be.equal(Math.floor(Math.pow(2, i) / 2));
      box.getMaxX().should.be.equal(Math.pow(2, i) - 1);
      box.getMaxY().should.be.equal(Math.pow(2, i) - 1);
    }
  });

  it('should produce the correct tile bounding box without high precision input bounds', function () {
    const webMercatorBox = new BoundingBox(-20037508.3, -20037508.3, 20037508.3, 20037508.3);
    const tileBox = TileBoundingBoxUtils.getTileGridWithBoundingBoxAndZoom(webMercatorBox, 12);

    tileBox.getMinX().should.equal(0);
    tileBox.getMaxX().should.equal(4095);
    tileBox.getMinY().should.equal(0);
    tileBox.getMaxY().should.equal(4095);
  });
  it('should get the tile that contains a point, also on a tile edge', function () {
    const h = 20037508.342789244;
    const check = function (grid, x, y) {
      grid.getMinX().should.equal(x);
      grid.getMaxX().should.equal(x);
      grid.getMinY().should.equal(y);
      grid.getMaxY().should.equal(y);
    };
    // (0, 0) used to give [1,1 .. 0,0] at zoom 1
    check(TileBoundingBoxUtils.getTileGridFromWebMercator({ x: 0, y: 0 }, 1), 1, 1);
    check(TileBoundingBoxUtils.getTileGridWGS84(new BoundingBox(0, 0, 0, 0), 1), 2, 1);
    // east and south edges of the world are in the last tile
    check(TileBoundingBoxUtils.getTileGridFromWebMercator({ x: h, y: -h }, 3), 7, 7);
    for (let zoom = 0; zoom <= 20; zoom++) {
      const tiles = TileBoundingBoxUtils.tilesPerSide(zoom);
      const size = (2 * h) / tiles;
      for (let i = 0; i < tiles; i += Math.max(1, Math.floor(tiles / 7))) {
        for (const f of [0, 0.3, 0.7]) {
          // used to round to the nearest tile edge instead of flooring
          const x = -h + (i + f) * size;
          const y = h - (i + f) * size;
          check(TileBoundingBoxUtils.getTileGridFromWebMercator({ x: x, y: y }, zoom), i, i);
          check(TileBoundingBoxUtils.getTileGridWithBoundingBoxAndZoom(new BoundingBox(x, y, x, y), zoom), i, i);
        }
      }
      const lonTiles = TileBoundingBoxUtils.tilesPerWGS84LonSide(zoom);
      const latTiles = TileBoundingBoxUtils.tilesPerWGS84LatSide(zoom);
      for (let i = 0; i < latTiles; i += Math.max(1, Math.floor(latTiles / 7))) {
        const lon = -180 + (i * 360) / lonTiles;
        const lat = 90 - (i * 180) / latTiles;
        check(TileBoundingBoxUtils.getTileGridWGS84(new BoundingBox(lon, lat, lon, lat), zoom), i, i);
      }
    }
  });
});
