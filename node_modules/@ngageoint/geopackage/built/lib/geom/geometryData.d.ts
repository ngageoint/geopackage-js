/**
 * GeometryData module.
 * @module geom/geometryData
 */
/// <reference types="node" />
import wkx from 'wkx';
import { Envelope } from './envelope';
import { Feature } from 'geojson';
/**
 * GeoPackage Geometry Data
 */
export declare class GeometryData {
    static readonly BIG_ENDIAN = 0;
    static readonly LITTLE_ENDIAN = 1;
    empty: boolean;
    byteOrder: number;
    srsId: number;
    geometry: wkx.Geometry;
    envelope: Envelope;
    buffer: Buffer;
    geometryError: string;
    extended: boolean;
    constructor(buffer?: Buffer | Uint8Array);
    setSrsId(srsId: number): void;
    setGeometry(wkbGeometry: wkx.Geometry): void;
    setEnvelope(envelope: Envelope): void;
    toGeoJSON(): Feature;
    fromData(bufferOrArray: Buffer | Uint8Array): void;
    toData(): Buffer;
    writeEnvelope(): Buffer;
    buildFlagsByte(): number;
    getIndicatorWithEnvelope(envelope: Envelope): number;
    readFlags(flagsInt: number): number;
    readEnvelope(envelopeIndicator: number, buffer: Buffer): {
        envelope: Envelope;
        offset: number;
    };
}
