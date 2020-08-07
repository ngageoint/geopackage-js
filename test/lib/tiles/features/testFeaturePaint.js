
var FeaturePaint = require('../../../../lib/tiles/features/featurePaint').FeaturePaint
, Paint = require('../../../../lib/tiles/features/paint').Paint
, FeatureDrawType = require('../../../../lib/tiles/features/featureDrawType').FeatureDrawType
, should = require('chai').should();

describe('FeaturePaint Tests', function() {
  it('should test FeaturePaint', function() {
    var featurePaint = new FeaturePaint();
    should.not.exist(featurePaint.getPaint(FeatureDrawType.CIRCLE), 'CIRCLE should not exist');
    should.not.exist(featurePaint.getPaint(FeatureDrawType.STROKE), 'STROKE should not exist');
    should.not.exist(featurePaint.getPaint(FeatureDrawType.FILL), 'FILL should not exist');
    var paint = new Paint();
    featurePaint.setPaint(FeatureDrawType.CIRCLE, paint);
    should.exist(featurePaint.getPaint(FeatureDrawType.CIRCLE), 'CIRCLE should exist');
    should.not.exist(featurePaint.getPaint(FeatureDrawType.STROKE), 'STROKE should not exist');
    should.not.exist(featurePaint.getPaint(FeatureDrawType.FILL), 'FILL should not exist');
  });
});
