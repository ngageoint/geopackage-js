/**
 * GeometryData module.
 * @module geom/geometryData
 */

var GeoPackageConstants = require('../geoPackageConstants');

var wkx = require('wkx');

var BIG_ENDIAN = 0;
var LITTLE_ENDIAN = 1;

/**
 * GeoPackage Geometry Data
 */
var GeometryData = function(buffer) {
  this.empty = true;
  this.byteOrder = BIG_ENDIAN;
  this.fromData(buffer);
}

module.exports = GeometryData;

GeometryData.prototype.fromData = function (buffer) {
  this.buffer = buffer;
  if (buffer instanceof Uint8Array) {
    this.buffer = buffer = new Buffer(buffer);
  }

  var magicString = buffer.toString('ascii', 0, 2);
  if (magicString !== GeoPackageConstants.GEOPACKAGE_GEOMETRY_MAGIC_NUMBER) {
    throw new Error('Unexpected GeoPackage Geometry magic number: ' + magicString + ', Expected: ' + GeoPackageConstants.GEOPACKAGE_GEOMETRY_MAGIC_NUMBER);
  }

  var version = buffer.readUInt8(2);
  if (version !== GeoPackageConstants.GEOPACKAGE_GEOMETRY_VERSION_1) {
    throw new Error('Unexpected GeoPackage Geometry version ' + version + ', Expected: ' + GeoPackageConstants.GEOPACKAGE_GEOMETRY_VERSION_1);
  }

  var flags = buffer.readUInt8(3);
  var envelopeIndicator = this.readFlags(flags);

  this.srsId = buffer[this.byteOrder ? 'readUInt32LE' : 'readUInt32BE'](4);
  this.envelope = this.readEnvelope(envelopeIndicator, buffer);

  var offset = this.envelope.offset;

  var wkbBuffer = buffer.slice(offset);
  this.geometry = wkx.Geometry.parse(wkbBuffer);
};

GeometryData.prototype.readFlags = function (flagsInt) {
  // Verify the reserved bits at 7 and 6 are 0
  var reserved7 = (flagsInt >> 7) & 1;
  var reserved6 = (flagsInt >> 6) & 1;
  if (reserved7 !== 0 || reserved6 !== 0) {
      throw new Error('Unexpected GeoPackage Geometry flags. Flag bit 7 and 6 should both be 0, 7='+reserved7+', 6='+ reserved6);
  }

  // Get the binary type from bit 5, 0 for standard and 1 for extended
  var binaryType = (flagsInt >> 5) & 1;
  this.extended = binaryType == 1;

  // Get the empty geometry flag from bit 4, 0 for non-empty and 1 for
  // empty
  var emptyValue = (flagsInt >> 4) & 1;
  this.empty = emptyValue == 1;

  // Get the envelope contents indicator code (3-bit unsigned integer from
  // bits 3, 2, and 1)
  var envelopeIndicator = (flagsInt >> 1) & 7;
  if (envelopeIndicator > 4) {
      throw new Error('Unexpected GeoPackage Geometry flags. Envelope contents indicator must be between 0 and 4. Actual: ' + envelopeIndicator);
  }

  // Get the byte order from bit 0, 0 for Big Endian and 1 for Little Endian
  var byteOrderValue = flagsInt & 1;
  this.byteOrder = byteOrderValue;
  return envelopeIndicator;
};

GeometryData.prototype.readEnvelope = function (envelopeIndicator, buffer) {
  var readDoubleMethod = 'readDouble' + (this.byteOrder ? 'LE' : 'BE');

  var envelopeByteOffset = 8;
  reads = 0;
  var envelope = {};

  if (envelopeIndicator <= 0) {
    envelope.offset = envelopeByteOffset;
    return envelope;
  }
  // Read x and y values and create envelope
  envelope.minX = buffer[readDoubleMethod](envelopeByteOffset + (8 * reads++));
  envelope.maxX = buffer[readDoubleMethod](envelopeByteOffset + (8 * reads++));
  envelope.minY = buffer[readDoubleMethod](envelopeByteOffset + (8 * reads++));
  envelope.maxY = buffer[readDoubleMethod](envelopeByteOffset + (8 * reads++));

  envelope.hasZ = false;
  var minZ = undefined;
  var maxZ = undefined;

  envelope.hasM = false;
  var minM = undefined;
  var maxM = undefined;

  // Read z values
  if (envelopeIndicator === 2 || envelopeIndicator === 4) {
    envelope.hasZ = true;
    envelope.minZ = buffer[readDoubleMethod](envelopeByteOffset + (8 * reads++));
    envelope.maxZ = buffer[readDoubleMethod](envelopeByteOffset + (8 * reads++));
  }

  // Read m values
  if (envelopeIndicator === 3 || envelopeIndicator === 4) {
    envelope.hasM = true;
    envelope.minM = buffer[readDoubleMethod](envelopeByteOffset + (8 * reads++));
    envelope.maxM = buffer[readDoubleMethod](envelopeByteOffset + (8 * reads++));
  }

  envelope.offset = envelopeByteOffset + (8 * reads);
  return envelope;
};
