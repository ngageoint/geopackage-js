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

});
