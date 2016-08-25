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
  if (buffer) {
    this.fromData(buffer);
  }
}

module.exports = GeometryData;

GeometryData.prototype.setSrsId = function(srsId) {
  this.srsId = srsId;
}

GeometryData.prototype.setGeometry = function(wkbGeometry) {
  this.geometry = wkbGeometry;
}

GeometryData.prototype.setEnvelope = function(envelope) {
  this.envelope = envelope;
}

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

GeometryData.prototype.toData = function() {
  var header = new Buffer(8);

  // Write GP as the 2 byte magic number
  header.write(GeoPackageConstants.GEOPACKAGE_GEOMETRY_MAGIC_NUMBER);

  // Write a byte as the version value of 0 = version 1
  header.writeUInt8(GeoPackageConstants.GEOPACKAGE_GEOMETRY_VERSION_1, 2);

  // Build and write a flags byte
  var flags = this.buildFlagsByte();
  header.writeUInt8(flags, 3);

  // write the 4 byte srs id
  header[this.byteOrder ? 'writeUInt32LE' : 'writeUInt32BE'](this.srsId, 4);

  var envelopeBuffer = this.writeEnvelope(this.envelope);

  this.buffer = Buffer.concat([header, envelopeBuffer, this.geometry.toWkb()]);
  return this.buffer;
};

GeometryData.prototype.writeEnvelope = function() {
  if (!this.envelope) return new Buffer(0);

  var writeDoubleMethod = 'writeDouble' + (this.byteOrder ? 'LE' : 'BE');

  var length = 32;
  if (this.envelope.hasZ) {
    length += 16;
  }
  if (this.envelope.hasM) {
    length += 16;
  }
  var envelopeBuffer = new Buffer(length);
  envelopeBuffer[writeDoubleMethod](this.envelope.minX, 0);
  envelopeBuffer[writeDoubleMethod](this.envelope.maxX, 8);
  envelopeBuffer[writeDoubleMethod](this.envelope.minY, 16);
  envelopeBuffer[writeDoubleMethod](this.envelope.maxY, 24);

  var position = 32;
  if (this.envelope.hasZ) {
    envelopeBuffer[writeDoubleMethod](this.envelope.minZ, position);
    envelopeBuffer[writeDoubleMethod](this.envelope.maxZ, position+8);
    position = 48;
  }
  if (this.envelope.hasM) {
    envelopeBuffer[writeDoubleMethod](this.envelope.minM, position);
    envelopeBuffer[writeDoubleMethod](this.envelope.maxM, position+8);
  }

  return envelopeBuffer;
};

GeometryData.prototype.buildFlagsByte = function() {
  var flag = 0;

  // Add the binary type to bit 5, 0 for standard and 1 for extended
  var binaryType = this.extended ? 1 : 0;
  flag += (binaryType << 5);

  // Add the empty geometry flag to bit 4, 0 for non-empty and 1 for empty
  var emptyValue = this.empty ? 1 : 0;
  flag += (emptyValue << 4);

  // Add the envelope contents indicator code (3-bit unsigned integer to bits 3, 2, and 1)
  var envelopeIndicator = !this.envelope ? 0 : this.getIndicatorWithEnvelope(this.envelope);
  flag += (envelopeIndicator << 1);

  // Add the byte order to bit 0, 0 for Big Endian and 1 for Little Endian
  var byteOrderValue = (this.byteOrder === BIG_ENDIAN) ? 0 : 1;
  flag += byteOrderValue;

  return flag;
};

GeometryData.prototype.getIndicatorWithEnvelope = function(envelope) {
  var indicator = 1;
  if (envelope.hasZ) {
    indicator++;
  }
  if (envelope.hasM) {
    indicator += 2;
  }
  return indicator;
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
