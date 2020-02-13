/**
 * GeometryData module.
 * @module geom/geometryData
 */

import wkx from 'wkx';
import { GeoPackageConstants } from '../geoPackageConstants';
import { Envelope } from './envelope';
import { Feature } from 'geojson';

/**
 * GeoPackage Geometry Data
 */
export class GeometryData {
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
  constructor(buffer?: Buffer | Uint8Array) {
    this.empty = true;
    this.byteOrder = GeometryData.BIG_ENDIAN;
    if (buffer) {
      this.fromData(buffer);
    }
  }
  setSrsId(srsId: number): void {
    this.srsId = srsId;
  }
  setGeometry(wkbGeometry: wkx.Geometry): void {
    this.empty = false;
    this.geometry = wkbGeometry;
  }
  setEnvelope(envelope: Envelope): void {
    this.envelope = envelope;
  }
  toGeoJSON(): Feature {
    return this.geometry.toGeoJSON() as Feature;
  }
  fromData(bufferOrArray: Buffer | Uint8Array): void {
    if (bufferOrArray instanceof Uint8Array) {
      this.buffer = bufferOrArray = Buffer.from(bufferOrArray);
    } else {
      this.buffer = bufferOrArray;
    }
    const magicString = this.buffer.toString('ascii', 0, 2);
    if (magicString !== GeoPackageConstants.GEOPACKAGE_GEOMETRY_MAGIC_NUMBER) {
      throw new Error(
        'Unexpected GeoPackage Geometry magic number: ' +
          magicString +
          ', Expected: ' +
          GeoPackageConstants.GEOPACKAGE_GEOMETRY_MAGIC_NUMBER,
      );
    }
    const version = this.buffer.readUInt8(2);
    if (version !== GeoPackageConstants.GEOPACKAGE_GEOMETRY_VERSION_1) {
      throw new Error(
        'Unexpected GeoPackage Geometry version ' +
          version +
          ', Expected: ' +
          GeoPackageConstants.GEOPACKAGE_GEOMETRY_VERSION_1,
      );
    }
    const flags = this.buffer.readUInt8(3);
    const envelopeIndicator = this.readFlags(flags);
    this.srsId = this.buffer[this.byteOrder ? 'readUInt32LE' : 'readUInt32BE'](4);
    const envelopeAndOffset = this.readEnvelope(envelopeIndicator, this.buffer);
    this.envelope = envelopeAndOffset.envelope;
    const offset = envelopeAndOffset.offset;
    const wkbBuffer = this.buffer.slice(offset);
    try {
      this.geometry = wkx.Geometry.parse(wkbBuffer);
      this.geometryError = undefined;
    } catch (error) {
      this.geometryError = error.message;
      console.log('Error parsing geometry');
    }
  }
  toData(): Buffer {
    const header = Buffer.alloc(8);
    // Write GP as the 2 byte magic number
    header.write(GeoPackageConstants.GEOPACKAGE_GEOMETRY_MAGIC_NUMBER);
    // Write a byte as the version value of 0 = version 1
    header.writeUInt8(GeoPackageConstants.GEOPACKAGE_GEOMETRY_VERSION_1, 2);
    // Build and write a flags byte
    const flags = this.buildFlagsByte();
    header.writeUInt8(flags, 3);
    // write the 4 byte srs id
    header[this.byteOrder ? 'writeUInt32LE' : 'writeUInt32BE'](this.srsId, 4);
    const envelopeBuffer = this.writeEnvelope();
    const concatArray = [header, envelopeBuffer];
    try {
      concatArray.push(this.geometry.toWkb());
      this.geometryError = undefined;
    } catch (error) {
      this.geometryError = error.message;
    }
    this.buffer = Buffer.concat(concatArray);
    return this.buffer;
  }
  writeEnvelope(): Buffer {
    if (!this.envelope) return Buffer.alloc(0);
    const writeDoubleMethod = 'writeDouble' + (this.byteOrder ? 'LE' : 'BE');
    let length = 32;
    if (this.envelope.hasZ) {
      length += 16;
    }
    if (this.envelope.hasM) {
      length += 16;
    }
    const envelopeBuffer = Buffer.alloc(length);
    envelopeBuffer[writeDoubleMethod](this.envelope.minX, 0);
    envelopeBuffer[writeDoubleMethod](this.envelope.maxX, 8);
    envelopeBuffer[writeDoubleMethod](this.envelope.minY, 16);
    envelopeBuffer[writeDoubleMethod](this.envelope.maxY, 24);
    let position = 32;
    if (this.envelope.hasZ) {
      envelopeBuffer[writeDoubleMethod](this.envelope.minZ, position);
      envelopeBuffer[writeDoubleMethod](this.envelope.maxZ, position + 8);
      position = 48;
    }
    if (this.envelope.hasM) {
      envelopeBuffer[writeDoubleMethod](this.envelope.minM, position);
      envelopeBuffer[writeDoubleMethod](this.envelope.maxM, position + 8);
    }
    return envelopeBuffer;
  }
  buildFlagsByte(): number {
    let flag = 0;
    // Add the binary type to bit 5, 0 for standard and 1 for extended
    const binaryType = this.extended ? 1 : 0;
    flag += binaryType << 5;
    // Add the empty geometry flag to bit 4, 0 for non-empty and 1 for empty
    const emptyValue = this.empty ? 1 : 0;
    flag += emptyValue << 4;
    // Add the envelope contents indicator code (3-bit unsigned integer to bits 3, 2, and 1)
    const envelopeIndicator = !this.envelope ? 0 : this.getIndicatorWithEnvelope(this.envelope);
    flag += envelopeIndicator << 1;
    // Add the byte order to bit 0, 0 for Big Endian and 1 for Little Endian
    const byteOrderValue = this.byteOrder === GeometryData.BIG_ENDIAN ? 0 : 1;
    flag += byteOrderValue;
    return flag;
  }
  getIndicatorWithEnvelope(envelope: Envelope): number {
    let indicator = 1;
    if (envelope.hasZ) {
      indicator++;
    }
    if (envelope.hasM) {
      indicator += 2;
    }
    return indicator;
  }
  readFlags(flagsInt: number): number {
    // Verify the reserved bits at 7 and 6 are 0
    const reserved7 = (flagsInt >> 7) & 1;
    const reserved6 = (flagsInt >> 6) & 1;
    if (reserved7 !== 0 || reserved6 !== 0) {
      throw new Error(
        'Unexpected GeoPackage Geometry flags. Flag bit 7 and 6 should both be 0, 7=' + reserved7 + ', 6=' + reserved6,
      );
    }
    // Get the binary type from bit 5, 0 for standard and 1 for extended
    const binaryType = (flagsInt >> 5) & 1;
    this.extended = binaryType === 1;
    // Get the empty geometry flag from bit 4, 0 for non-empty and 1 for
    // empty
    const emptyValue = (flagsInt >> 4) & 1;
    this.empty = emptyValue === 1;
    // Get the envelope contents indicator code (3-bit unsigned integer from
    // bits 3, 2, and 1)
    const envelopeIndicator = (flagsInt >> 1) & 7;
    if (envelopeIndicator > 4) {
      throw new Error(
        'Unexpected GeoPackage Geometry flags. Envelope contents indicator must be between 0 and 4. Actual: ' +
          envelopeIndicator,
      );
    }
    // Get the byte order from bit 0, 0 for Big Endian and 1 for Little Endian
    const byteOrderValue = flagsInt & 1;
    this.byteOrder = byteOrderValue;
    return envelopeIndicator;
  }
  readEnvelope(envelopeIndicator: number, buffer: Buffer): { envelope: Envelope; offset: number } {
    const readDoubleMethod = 'readDouble' + (this.byteOrder ? 'LE' : 'BE');
    const envelopeByteOffset = 8;
    let reads = 0;
    const envelopeAndOffset = {
      envelope: undefined,
      offset: envelopeByteOffset,
    };
    if (envelopeIndicator <= 0) {
      return envelopeAndOffset;
    }
    const envelope = new Envelope();
    // Read x and y values and create envelope
    envelope.minX = buffer[readDoubleMethod](envelopeByteOffset + 8 * reads++);
    envelope.maxX = buffer[readDoubleMethod](envelopeByteOffset + 8 * reads++);
    envelope.minY = buffer[readDoubleMethod](envelopeByteOffset + 8 * reads++);
    envelope.maxY = buffer[readDoubleMethod](envelopeByteOffset + 8 * reads++);
    envelope.hasZ = false;
    envelope.hasM = false;
    // Read z values
    if (envelopeIndicator === 2 || envelopeIndicator === 4) {
      envelope.hasZ = true;
      envelope.minZ = buffer[readDoubleMethod](envelopeByteOffset + 8 * reads++);
      envelope.maxZ = buffer[readDoubleMethod](envelopeByteOffset + 8 * reads++);
    }
    // Read m values
    if (envelopeIndicator === 3 || envelopeIndicator === 4) {
      envelope.hasM = true;
      envelope.minM = buffer[readDoubleMethod](envelopeByteOffset + 8 * reads++);
      envelope.maxM = buffer[readDoubleMethod](envelopeByteOffset + 8 * reads++);
    }
    envelopeAndOffset.envelope = envelope;
    envelopeAndOffset.offset = envelopeByteOffset + 8 * reads;
    return envelopeAndOffset;
  }
}
