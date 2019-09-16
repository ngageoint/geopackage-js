var FeaturePaint = require('../../../../lib/tiles/features/featurePaint')
  , Paint = require('../../../../lib/tiles/features/paint')
  , FeatureDrawType = require('../../../../lib/tiles/features/featureDrawType')
  , should = require('chai').should();

describe('FeaturePaint Tests', function() {
  it('should test FeaturePaint', function() {
    var featurePaint = new FeaturePaint();
    should.not.exist(featurePaint.getPaint(FeatureDrawType.CIRCLE));;
    should.not.exist(featurePaint.getPaint(FeatureDrawType.STROKE));
    should.not.exist(featurePaint.getPaint(FeatureDrawType.FILL));
    var paint = new Paint();
    featurePaint.setPaint(FeatureDrawType.CIRCLE, paint);
    should.exist(featurePaint.getPaint(FeatureDrawType.CIRCLE));
    should.not.exist(featurePaint.getPaint(FeatureDrawType.STROKE));
    should.not.exist(featurePaint.getPaint(FeatureDrawType.FILL));
  });
});
