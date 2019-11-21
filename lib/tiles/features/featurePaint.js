/**
 * FeaturePaint module.
 * @module tiles/features
 */
class FeaturePaint {
  constructor() {
    this.featurePaints = {};
  }
  /**
   * Get the feature paint for the featureDrawType
   * @param {module:tiles/features~FeatureDrawType} featureDrawType
   * @return {module:tiles/features~FeaturePaint} paint
   */
  getPaint(featureDrawType) {
    return this.featurePaints[featureDrawType];
  }
  /**
   * Set the feature paint for the featureDrawType
   * @param {module:tiles/features~FeatureDrawType} featureDrawType
   * @param {module:tiles/features~Paint} paint
   */
  setPaint(featureDrawType, paint) {
    this.featurePaints[featureDrawType] = paint;
  }
}

module.exports = FeaturePaint;
