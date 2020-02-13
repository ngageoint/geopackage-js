/**
 * WKB module.
 * @module wkb
 */
interface WKTMap {
    [key: string]: number;
}
export declare class WKB {
    static readonly typeMap: {
        wkt: {
            Point: string;
            LineString: string;
            Polygon: string;
            MultiPoint: string;
            MultiLineString: string;
            MultiPolygon: string;
            GeometryCollection: string;
        };
        wkb: {
            Point: number;
            LineString: number;
            Polygon: number;
            MultiPoint: number;
            MultiLineString: number;
            MultiPolygon: number;
            GeometryCollection: number;
        };
    };
    static readonly wktToEnum: WKTMap;
    /**
     * number from name
     * @param  {string} name name
     * @return {Number}      number corresponding to the wkb name
     */
    static fromName(name: string): number;
}
export {};
