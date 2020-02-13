export declare enum FeatureDrawType {
    /**
     * Circle for a point
     */
    CIRCLE = "CIRCLE",
    /**
     * Stroke for a line of polygon
     */
    STROKE = "STROKE",
    /**
     * Fill for a polygon
     */
    FILL = "FILL"
}
export declare namespace FeatureDrawType {
    function nameFromType(type: FeatureDrawType): string;
    function fromName(type: string): FeatureDrawType;
}
