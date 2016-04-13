var TileBoundingBoxUtils = require('../../../lib/tiles/tileBoundingBoxUtils')
  , BoundingBox = require('../../../lib/boundingBox');

describe('TileBoundingBoxUtils tests', function() {

  it('should get the bounds for tile 0 0 0', function(done) {
    var bounds = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(0, 0, 0);
    console.log('0 0 0 bounds', bounds);
    done();
  });

  it('should get the bounds for tile 1 1 1', function(done) {
    var bounds = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(1, 1, 1);
    console.log('1 1 1 bounds', bounds);
    done();
  });

  it('should get the bounds for tile 0 0 1', function(done) {
    var bounds = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(0, 0, 1);
    console.log('0 0 1 bounds', bounds);
    done();
  });

  it('should get the grid for tile 1 0 1', function(done) {
    var bounds = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(1, 0, 1);
    var totalBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(0, 0, 0);
  //   console.log('0 0 1 bounds', bounds);
  //   { '0':
  //  { minLongitude: -20037508.342789244,
  //    maxLongitude: 20037508.342789244,
  //    minLatitude: -20037508.342789255,
  //    maxLatitude: 20037508.342789244 },
  // '1': 2,
  // '2': 2,
  // '3':
  //  { minLongitude: -20037508.342789244,
  //    maxLongitude: 0,
  //    minLatitude: -7.081154551613622e-10,
  //    maxLatitude: 20037508.342789244 } }
    var grid = TileBoundingBoxUtils.getTileGridWithWebMercatorTotalBoundingBox(totalBox, 2, 2, bounds);
    console.log('grid', grid);
    done();
  });

});
