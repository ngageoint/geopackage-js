export var WebPExtension: typeof WebPExtension;
declare const WebPExtension_base: any;
declare class WebPExtension extends WebPExtension_base {
    [x: string]: any;
    constructor(geoPackage: any, tableName: any);
    tableName: any;
    getOrCreateExtension(): any;
}
declare namespace WebPExtension {
    export const EXTENSION_NAME: string;
    export const EXTENSION_WEBP_AUTHOR: string;
    export const EXTENSION_WEBP_NAME_NO_AUTHOR: string;
    export const EXTENSION_WEBP_DEFINITION: string;
}
export {};
