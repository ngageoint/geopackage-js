import { FeatureDrawType } from './featureDrawType';
import { Paint } from './paint';
/**
 * FeaturePaint module.
 * @module tiles/features
 */
export declare class FeaturePaint {
    featurePaints: {
        [key: string]: Paint;
    };
    /**
     * Get the feature paint for the featureDrawType
     * @param {module:tiles/features~FeatureDrawType} featureDrawType
     * @return {module:tiles/features~FeaturePaint} paint
     */
    getPaint(featureDrawType: FeatureDrawType): Paint;
    /**
     * Set the feature paint for the featureDrawType
     * @param {module:tiles/features~FeatureDrawType} featureDrawType
     * @param {module:tiles/features~Paint} paint
     */
    setPaint(featureDrawType: FeatureDrawType, paint: Paint): void;
}
