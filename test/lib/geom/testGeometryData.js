const { GeometryEnvelope } = require('@ngageoint/simple-features-js');
var GeoPackageGeometryData = require('../../../lib/geom/geoPackageGeometryData').GeoPackageGeometryData;

var GeometryWriter = require('@ngageoint/simple-features-wkb-js').GeometryWriter,
  Point = require('@ngageoint/simple-features-js').Point,
  ByteOrder = require('@ngageoint/simple-features-wkb-js').ByteOrder;

describe('Geometry Data tests', function () {
  var magic = Buffer.alloc(2);
  magic.write('GP', 0, 2, 'ascii');
  var version = Buffer.alloc(1);
  version.writeUInt8(0);
  var flags = Buffer.alloc(1);
  flags.writeUInt8(0);
  var srs = Buffer.alloc(4);
  srs.writeUInt32BE(4326);

  var rawPoint = new Point(1, 2);
  var point = GeometryWriter.writeGeometry(rawPoint);

  it('should fail the magic number check', function () {
    var buffer = Buffer.from('HI');
    (function () {
      new GeoPackageGeometryData(buffer);
    }).should.throw('Unexpected GeoPackage Geometry magic number: HI, Expected: GP');
  });

  it('should fail the version check', function () {
    var version = Buffer.alloc(1);
    version.writeUInt8(1);
    var buffer = Buffer.concat([magic, version]);
    (function () {
      new GeoPackageGeometryData(buffer);
    }).should.throw('Unexpected GeoPackage Geometry version: 1, Expected: 0');
  });

  it('should throw unexpected geometry flags where 7 is 1 and 6 is 1', function () {
    var flags = Buffer.alloc(1);
    flags.writeUInt8(255);
    var buffer = Buffer.concat([magic, version, flags]);
    (function () {
      new GeoPackageGeometryData(buffer);
    }).should.throw('Unexpected GeoPackage Geometry flags. Flag bit 7 and 6 should both be 0, 7=1, 6=1');
  });

  it('should throw unexpected geometry flags where 7 is 0 and 6 is 1', function () {
    var flags = Buffer.alloc(1);
    flags.writeUInt8(127);
    var buffer = Buffer.concat([magic, version, flags]);
    (function () {
      new GeoPackageGeometryData(buffer);
    }).should.throw('Unexpected GeoPackage Geometry flags. Flag bit 7 and 6 should both be 0, 7=0, 6=1');
  });

  it('should throw unexpected geometry flags where 7 is 1 and 6 is 0', function () {
    var flags = Buffer.alloc(1);
    flags.writeUInt8(128);
    var buffer = Buffer.concat([magic, version, flags]);
    (function () {
      new GeoPackageGeometryData(buffer);
    }).should.throw('Unexpected GeoPackage Geometry flags. Flag bit 7 and 6 should both be 0, 7=1, 6=0');
  });

  it('should set extended to true', function () {
    var flags = Buffer.alloc(1);
    flags.writeUInt8(32);

    var buffer = Buffer.concat([magic, version, flags, srs, point]);
    var geometryData = new GeoPackageGeometryData(buffer);
    geometryData.isExtended().should.be.equal(true);

    buffer = geometryData.toBuffer();
    var geometryData2 = new GeoPackageGeometryData(buffer);
    geometryData2.isExtended().should.be.equal(true);
  });

  it('should set empty to true', function () {
    var flags = Buffer.alloc(1);
    flags.writeUInt8(32);

    let buffer = Buffer.concat([magic, version, flags, srs, point]);
    var geometryData = new GeoPackageGeometryData(buffer);
    geometryData.isExtended().should.be.equal(true);
    geometryData.setEmpty(true);

    buffer = geometryData.toBuffer();
    var geometryData2 = new GeoPackageGeometryData(buffer);
    geometryData2.isEmpty().should.be.equal(true);
  });

  it('should set byte order to little endian', function () {
    var flags = Buffer.alloc(1);
    flags.writeUInt8(1);
    var buffer = Buffer.concat([magic, version, flags, srs, point]);
    var geometryData = new GeoPackageGeometryData(buffer);
    geometryData.getByteOrder().should.be.equal(ByteOrder.LITTLE_ENDIAN);
  });

  it('should export byte order as little endian', function () {
    var flags = Buffer.alloc(1);
    flags.writeUInt8(1);
    var buffer = Buffer.concat([magic, version, flags, srs, point]);
    var geometryData = new GeoPackageGeometryData(buffer);
    geometryData.byteOrder.should.be.equal(1);

    var buffer = geometryData.toBuffer();
    var geometryData2 = new GeoPackageGeometryData(buffer);
    geometryData2.byteOrder.should.be.equal(1);
  });

  it('should set byte order to big endian', function () {
    var flags = Buffer.alloc(1);
    flags.writeUInt8(0);
    var buffer = Buffer.concat([magic, version, flags, srs, point]);
    var geometryData = new GeoPackageGeometryData(buffer);
    geometryData.byteOrder.should.be.equal(0);
  });

  it('should parse the big endian envelope', function () {
    var tflags = Buffer.alloc(1);
    tflags.writeUInt8(2);
    var envelope = Buffer.alloc(32);
    envelope.writeDoubleBE(Number(5.0), 0);
    envelope.writeDoubleBE(Number(78.0), 8);
    envelope.writeDoubleBE(Number(29.0), 16);
    envelope.writeDoubleBE(Number(12.0), 24);
    var buffer = Buffer.concat([magic, version, tflags, srs, envelope, point]);
    var geometryData = new GeoPackageGeometryData(buffer);
    geometryData.byteOrder.should.be.equal(0);
    geometryData.getEnvelope().minX.should.be.equal(5.0);
    geometryData.getEnvelope().maxX.should.be.equal(78.0);
    geometryData.getEnvelope().minY.should.be.equal(29.0);
    geometryData.getEnvelope().maxY.should.be.equal(12.0);
    geometryData.getEnvelope().hasZ.should.be.equal(false);
    geometryData.getEnvelope().hasM.should.be.equal(false);
    geometryData.getGeometry().x.should.be.equal(1);
    geometryData.getGeometry().y.should.be.equal(2);
  });

  it('should parse the big endian envelope with z', function () {
    var tflags = Buffer.alloc(1);
    tflags.writeUInt8(4);
    var envelope = Buffer.alloc(48);
    envelope.writeDoubleBE(Number(5.0), 0);
    envelope.writeDoubleBE(Number(78.0), 8);
    envelope.writeDoubleBE(Number(29.0), 16);
    envelope.writeDoubleBE(Number(12.0), 24);
    envelope.writeDoubleBE(Number(87.0), 32);
    envelope.writeDoubleBE(Number(99.0), 40);
    var buffer = Buffer.concat([magic, version, tflags, srs, envelope, point]);
    var geometryData = new GeoPackageGeometryData(buffer);
    geometryData.byteOrder.should.be.equal(0);
    geometryData.getEnvelope().minX.should.be.equal(5.0);
    geometryData.getEnvelope().maxX.should.be.equal(78.0);
    geometryData.getEnvelope().minY.should.be.equal(29.0);
    geometryData.getEnvelope().maxY.should.be.equal(12.0);
    geometryData.getEnvelope().hasZ.should.be.equal(true);
    geometryData.getEnvelope().minZ.should.be.equal(87.0);
    geometryData.getEnvelope().maxZ.should.be.equal(99.0);
    geometryData.getEnvelope().hasM.should.be.equal(false);
    geometryData.getGeometry().x.should.be.equal(1);
    geometryData.getGeometry().y.should.be.equal(2);
  });

  it('should parse the big endian envelope with m', function () {
    var tflags = Buffer.alloc(1);
    tflags.writeUInt8(6);
    var envelope = Buffer.alloc(48);
    envelope.writeDoubleBE(Number(5.0), 0);
    envelope.writeDoubleBE(Number(78.0), 8);
    envelope.writeDoubleBE(Number(29.0), 16);
    envelope.writeDoubleBE(Number(12.0), 24);
    envelope.writeDoubleBE(Number(87.0), 32);
    envelope.writeDoubleBE(Number(99.0), 40);
    var buffer = Buffer.concat([magic, version, tflags, srs, envelope, point]);
    var geometryData = new GeoPackageGeometryData(buffer);
    geometryData.byteOrder.should.be.equal(0);
    geometryData.getEnvelope().minX.should.be.equal(5.0);
    geometryData.getEnvelope().maxX.should.be.equal(78.0);
    geometryData.getEnvelope().minY.should.be.equal(29.0);
    geometryData.getEnvelope().maxY.should.be.equal(12.0);
    geometryData.getEnvelope().hasZ.should.be.equal(false);
    geometryData.getEnvelope().hasM.should.be.equal(true);
    geometryData.getEnvelope().minM.should.be.equal(87.0);
    geometryData.getEnvelope().maxM.should.be.equal(99.0);
    geometryData.getGeometry().x.should.be.equal(1);
    geometryData.getGeometry().y.should.be.equal(2);
  });

  it('should parse the big endian envelope with m and z', function () {
    var tflags = Buffer.alloc(1);
    tflags.writeUInt8(8);
    var envelope = Buffer.alloc(64);
    envelope.writeDoubleBE(Number(5.0), 0);
    envelope.writeDoubleBE(Number(78.0), 8);
    envelope.writeDoubleBE(Number(29.0), 16);
    envelope.writeDoubleBE(Number(12.0), 24);
    envelope.writeDoubleBE(Number(87.0), 32);
    envelope.writeDoubleBE(Number(99.0), 40);
    envelope.writeDoubleBE(Number(45.0), 48);
    envelope.writeDoubleBE(Number(55.0), 56);
    var buffer = Buffer.concat([magic, version, tflags, srs, envelope, point]);
    var geometryData = new GeoPackageGeometryData(buffer);
    geometryData.byteOrder.should.be.equal(0);
    geometryData.getEnvelope().minX.should.be.equal(5.0);
    geometryData.getEnvelope().maxX.should.be.equal(78.0);
    geometryData.getEnvelope().minY.should.be.equal(29.0);
    geometryData.getEnvelope().maxY.should.be.equal(12.0);
    geometryData.getEnvelope().hasZ.should.be.equal(true);
    geometryData.getEnvelope().minZ.should.be.equal(87.0);
    geometryData.getEnvelope().maxZ.should.be.equal(99.0);
    geometryData.getEnvelope().hasM.should.be.equal(true);
    geometryData.getEnvelope().minM.should.be.equal(45.0);
    geometryData.getEnvelope().maxM.should.be.equal(55.0);
    geometryData.getGeometry().x.should.be.equal(1);
    geometryData.getGeometry().y.should.be.equal(2);
  });

  it('should parse the Uint8Array', function () {
    var tflags = Buffer.alloc(1);
    tflags.writeUInt8(8);
    var envelope = Buffer.alloc(64);
    envelope.writeDoubleBE(Number(5.0), 0);
    envelope.writeDoubleBE(Number(78.0), 8);
    envelope.writeDoubleBE(Number(29.0), 16);
    envelope.writeDoubleBE(Number(12.0), 24);
    envelope.writeDoubleBE(Number(87.0), 32);
    envelope.writeDoubleBE(Number(99.0), 40);
    envelope.writeDoubleBE(Number(45.0), 48);
    envelope.writeDoubleBE(Number(55.0), 56);
    var buffer = Buffer.concat([magic, version, tflags, srs, envelope, point]);
    var array = new Uint8Array(buffer);
    var geometryData = new GeoPackageGeometryData(array);
    geometryData.getByteOrder().should.be.equal(ByteOrder.BIG_ENDIAN);
    geometryData.getEnvelope().minX.should.be.equal(5.0);
    geometryData.getEnvelope().maxX.should.be.equal(78.0);
    geometryData.getEnvelope().minY.should.be.equal(29.0);
    geometryData.getEnvelope().maxY.should.be.equal(12.0);
    geometryData.getEnvelope().hasZ.should.be.equal(true);
    geometryData.getEnvelope().minZ.should.be.equal(87.0);
    geometryData.getEnvelope().maxZ.should.be.equal(99.0);
    geometryData.getEnvelope().hasM.should.be.equal(true);
    geometryData.getEnvelope().minM.should.be.equal(45.0);
    geometryData.getEnvelope().maxM.should.be.equal(55.0);
    geometryData.getGeometry().x.should.be.equal(1);
    geometryData.getGeometry().y.should.be.equal(2);
  });

  it('should throw unexpected geometry flags error', function () {
    var tflags = Buffer.alloc(1);
    tflags.writeUInt8(12);
    var buffer = Buffer.concat([magic, version, tflags, srs]);
    (function () {
      new GeoPackageGeometryData(buffer);
    }).should.throw(
      'Unexpected GeoPackage Geometry flags. Envelope contents indicator must be between 0 and 4. Actual: 6',
    );
  });

  it('should get the point out', function () {
    var buffer = Buffer.concat([magic, version, flags, srs, point]);
    var geometryData = new GeoPackageGeometryData(buffer);
    geometryData.getByteOrder().should.be.equal(0);
  });

  it('should create a point geometry data with an envelope', function () {
    var geometryData = new GeoPackageGeometryData();
    geometryData.isEmpty().should.be.equal(true);
    geometryData.setSrsId(4326);
    geometryData.setGeometry(rawPoint);
    geometryData.isEmpty().should.be.equal(false);
    const envelope = new GeometryEnvelope(5.0, 12.0, 87.0, 45.0, 78.0, 29.0, 99.0, 55.0);
    envelope.hasZ = true;
    envelope.hasM = true;
    geometryData.setEnvelope(envelope);
    var buffer = geometryData.toBuffer();
    var geometryData2 = new GeoPackageGeometryData(buffer);
    geometryData2.getByteOrder().should.be.equal(ByteOrder.BIG_ENDIAN);
    geometryData2.getEnvelope().minX.should.be.equal(5.0);
    geometryData2.getEnvelope().maxX.should.be.equal(78.0);
    geometryData2.getEnvelope().minY.should.be.equal(12.0);
    geometryData2.getEnvelope().maxY.should.be.equal(29.0);
    geometryData2.getEnvelope().hasZ.should.be.equal(true);
    geometryData2.getEnvelope().minZ.should.be.equal(87.0);
    geometryData2.getEnvelope().maxZ.should.be.equal(99.0);
    geometryData2.getEnvelope().hasM.should.be.equal(true);
    geometryData2.getEnvelope().minM.should.be.equal(45.0);
    geometryData2.getEnvelope().maxM.should.be.equal(55.0);
    geometryData2.getGeometry().x.should.be.equal(1);
    geometryData2.getGeometry().y.should.be.equal(2);
  });

  it('should create a point geometry data without an envelope', function () {
    var geometryData = new GeoPackageGeometryData();
    geometryData.setSrsId(4326);
    geometryData.setGeometry(rawPoint);
    var buffer = geometryData.toBuffer();
    var geometryData2 = new GeoPackageGeometryData(buffer);
    geometryData2.getByteOrder().should.be.equal(ByteOrder.BIG_ENDIAN);
    geometryData2.getGeometry().x.should.be.equal(1);
    geometryData2.getGeometry().y.should.be.equal(2);
  });
});
