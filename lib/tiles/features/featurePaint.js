/**
 * FeaturePaint module.
 * @module tiles/features
 */
var FeaturePaint = function () {
  this.featurePaints = {};
};

/**
 * Get the feature paint for the featureDrawType
 * @param {module:tiles/features~FeatureDrawType} featureDrawType
 * @return {module:tiles/features~FeaturePaint} paint
 */
FeaturePaint.prototype.getPaint = function(featureDrawType) {
  return this.featurePaints[featureDrawType];
};

/**
 * Set the feature paint for the featureDrawType
 * @param {module:tiles/features~FeatureDrawType} featureDrawType
 * @param {module:tiles/features~Paint} paint
 */
FeaturePaint.prototype.setPaint = function(featureDrawType, paint) {
  this.featurePaints[featureDrawType] = featurePaint;
};

module.exports = FeaturePaint;
