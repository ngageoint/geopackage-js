import { FeatureDrawType } from './featureDrawType';
import { Paint } from './paint';

/**
 * FeaturePaint module.
 * @module tiles/features
 */
export class FeaturePaint {
  featurePaints: { [key: string]: Paint } = {};
  /**
   * Get the feature paint for the featureDrawType
   * @param {module:tiles/features~FeatureDrawType} featureDrawType
   * @return {module:tiles/features~FeaturePaint} paint
   */
  getPaint(featureDrawType: FeatureDrawType): Paint {
    return this.featurePaints[featureDrawType];
  }
  /**
   * Set the feature paint for the featureDrawType
   * @param {module:tiles/features~FeatureDrawType} featureDrawType
   * @param {module:tiles/features~Paint} paint
   */
  setPaint(featureDrawType: FeatureDrawType, paint: Paint): void {
    this.featurePaints[featureDrawType] = paint;
  }
}
