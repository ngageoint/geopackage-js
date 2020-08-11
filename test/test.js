var polyfill = require('babel-polyfill');

require('chai').should();

require('./lib/db/table/testConstraintParser');
require('./lib/core/contents/testContents');
require('./lib/core/srs/testSpatialReferenceSystem');
require('./lib/dataColumns/testDataColumns');
require('./lib/db/testGeoPackageDataType');
require('./lib/db/testTableCreator');
require('./lib/features/columns/testGeometryColumns');
require('./lib/features/user/testFeatureDao');
require('./lib/features/user/testFeatureTableReader');
require('./lib/geom/testGeometryData');
require('./lib/metadata/reference/testMetadataReference.js');
require('./lib/metadata/testMetadata');
require('./lib/tiles/testGeopackageTileRetriever');
require('./lib/tiles/testTileBoundingBoxUtils');
require('./lib/tiles/testTileDao');
require('./lib/tiles/testTileGrid');
require('./lib/tiles/testTileMatrix');
require('./lib/tiles/testTileMatrixSet');
require('./lib/user/testUserTableReader');
require('./lib/validate/testGeoPackageValidate');
require('./lib/wkb/testWkb');
require('./lib/testBoundingBox');
require('./lib/wkb/testWkb');
require('./lib/testFeatureCreate');
require('./lib/testGeoPackage');
require('./lib/testGeoPackageCreate');
require('./lib/testGeoPackageManagerCreate');
require('./lib/testTileCreate');
require('./lib/issues/issue68.js');
require('./lib/tiles/features/testFeaturePaintCache');
require('./lib/tiles/features/testFeatureTiles');
require('./lib/extension/index/testFeatureTableIndex');
require('./lib/extension/testExtensionDao');
require('./lib/extension/contents/testContentsIdDao');
require('./lib/extension/style/testIconCache');
require('./lib/extension/style/testStyleExtension');
require('./lib/extension/scale/testTileScalingExtension');

describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      [1,2,3].indexOf(5).should.be.equal(-1);
      [1,2,3].indexOf(0).should.be.equal(-1);
    });
  });
});
