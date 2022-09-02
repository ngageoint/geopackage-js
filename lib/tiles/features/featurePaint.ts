import { FeatureDrawType } from './featureDrawType';
import { Paint } from './paint';

/**
 * FeaturePaint module.
 * @module tiles/features
 */
export class FeaturePaint {
  private featurePaints = {};
  /**
   * Get the feature paint for the featureDrawType
   * @param featureDrawType
   * @return paint
   */
  getPaint(featureDrawType: FeatureDrawType): Paint {
    return this.featurePaints[featureDrawType];
  }
  /**
   * Set the feature paint for the featureDrawType
   * @param featureDrawType
   * @param paint
   */
  setPaint(featureDrawType: FeatureDrawType, paint: Paint): void {
    this.featurePaints[featureDrawType] = paint;
  }
}
