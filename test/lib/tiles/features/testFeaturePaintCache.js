import { StyleRow } from '../../../../lib/extension/style/styleRow';
import { StyleTable } from '../../../../lib/extension/style/styleTable';

var FeaturePaintCache = require('../../../../lib/tiles/features/featurePaintCache').FeaturePaintCache
  , Paint = require('../../../../lib/tiles/features/paint').Paint
  , FeatureDrawType = require('../../../../lib/tiles/features/featureDrawType').FeatureDrawType
  , should = require('chai').should();

describe('FeaturePaintCache Tests', function() {
  it('should create paint cache', function() {
    var featurePaintCache = new FeaturePaintCache();
    featurePaintCache.cacheSize.should.be.equal(FeaturePaintCache.DEFAULT_STYLE_PAINT_CACHE_SIZE);
    var cacheSize = 50;
    featurePaintCache = new FeaturePaintCache(cacheSize);
    featurePaintCache.cacheSize.should.be.equal(cacheSize);
  });

  it('should test paint cache should return paint for style row id', function() {
    var featurePaintCache = new FeaturePaintCache();
    var paint = new Paint();
    var styleRowId = 0;
    should.not.exist(featurePaintCache.getFeaturePaint(styleRowId));
    should.not.exist(featurePaintCache.setPaint(styleRowId, FeatureDrawType.STROKE, paint));
    should.exist(featurePaintCache.getFeaturePaint(styleRowId));
    should.exist(featurePaintCache.remove(styleRowId));
    should.not.exist(featurePaintCache.getFeaturePaint(styleRowId));
  });

  it('should test paint cache should return paint for style row id', function() {
    var featurePaintCache = new FeaturePaintCache();
    var paint = new Paint();
    
    class MockStyleRow extends StyleRow {
      getId() {
        return 0;
      }
    }
    var styleRow = new MockStyleRow(new StyleTable('test', []), null);
    should.not.exist(featurePaintCache.getFeaturePaintForStyleRow(styleRow));
    should.not.exist(featurePaintCache.setPaintForStyleRow(styleRow, FeatureDrawType.STROKE, paint));
    should.exist(featurePaintCache.getFeaturePaintForStyleRow(styleRow));
    should.exist(featurePaintCache.remove(styleRow.getId()));
    should.not.exist(featurePaintCache.getFeaturePaintForStyleRow(styleRow));
  });

  it('should test paint cache should only store up to the cache size', function() {
    var cacheSize = 3;
    var featurePaintCache = new FeaturePaintCache(cacheSize);
    var paint = new Paint();
    // test access history stuff
    for (var i = 0; i < cacheSize * 2; i++) {
      let testId = i + 1;
      featurePaintCache.setPaint(testId, FeatureDrawType.FILL, paint);
      Object.keys(featurePaintCache.paintCache).length.should.be.below(cacheSize + 1);
    }
    Object.keys(featurePaintCache.paintCache).length.should.be.equal(cacheSize);
  });

  it('should clear paint cache', function() {
    var cacheSize = 3;
    var featurePaintCache = new FeaturePaintCache(cacheSize);
    var testId = 0;
    featurePaintCache.setPaint(testId, FeatureDrawType.FILL, new Paint());
    Object.keys(featurePaintCache.paintCache).length.should.be.equal(1);
    featurePaintCache.clear();
    Object.keys(featurePaintCache.paintCache).length.should.be.equal(0);
  });

  it('should resize paint cache', function() {
    var cacheSize = 5;
    var featurePaintCache = new FeaturePaintCache(cacheSize);
    var paint = new Paint();
    // test access history stuff
    for (var i = 0; i < cacheSize; i++) {
      var testId = i + 1;
      featurePaintCache.setPaint(testId, FeatureDrawType.CIRCLE, paint);
      Object.keys(featurePaintCache.paintCache).length.should.be.below(cacheSize + 1);
    }
    var newCacheSize = 3;
    featurePaintCache.resize(newCacheSize);
    Object.keys(featurePaintCache.paintCache).length.should.be.equal(newCacheSize);

    // test resizing to larger number, shouldn't remove any paints from the cache
    featurePaintCache.resize(cacheSize);
    Object.keys(featurePaintCache.paintCache).length.should.be.equal(newCacheSize);
  });
});
