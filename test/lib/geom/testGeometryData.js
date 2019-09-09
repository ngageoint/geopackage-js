var GeometryData = require('../../../lib/geom/geometryData.js');

var wkx = require('wkx')
  , should = require('chai').should();

describe('Geometry Data tests', function() {

  var magic = Buffer.alloc(2);
  magic.write('GP', 0, 2, 'ascii');
  var version = Buffer.alloc(1);
  version.writeUInt8(0);
  var flags = Buffer.alloc(1);
  flags.writeUInt8(0);
  var srs = Buffer.alloc(4);
  srs.writeUInt32BE(4326);

  var rawPoint = new wkx.Point(1, 2);
  var point = rawPoint.toWkb();

  it('should fail the magic number check', function() {
    var buffer = Buffer.from('HI');
    (function() {
      var geometryData = new GeometryData(buffer);
    }).should.throw('Unexpected GeoPackage Geometry magic number: HI, Expected: GP');
  });

  it('should fail the version check', function() {
    var version = Buffer.alloc(1);
    version.writeUInt8(1);
    var buffer = Buffer.concat([magic, version]);
    (function() {
      var geometryData = new GeometryData(buffer);
    }).should.throw('Unexpected GeoPackage Geometry version 1, Expected: 0');
  });

  it('should throw unexpected geometry flags where 7 is 1 and 6 is 1', function() {
    var flags = Buffer.alloc(1);
    flags.writeUInt8(255);
    var buffer = Buffer.concat([magic, version, flags]);
    (function() {
      var geometryData = new GeometryData(buffer);
    }).should.throw('Unexpected GeoPackage Geometry flags. Flag bit 7 and 6 should both be 0, 7=1, 6=1');
  });

  it('should throw unexpected geometry flags where 7 is 0 and 6 is 1', function() {
    var flags = Buffer.alloc(1);
    flags.writeUInt8(127);
    var buffer = Buffer.concat([magic, version, flags]);
    (function() {
      var geometryData = new GeometryData(buffer);
    }).should.throw('Unexpected GeoPackage Geometry flags. Flag bit 7 and 6 should both be 0, 7=0, 6=1');
  });

  it('should throw unexpected geometry flags where 7 is 1 and 6 is 0', function() {
    var flags = Buffer.alloc(1);
    flags.writeUInt8(128);
    var buffer = Buffer.concat([magic, version, flags]);
    (function() {
      var geometryData = new GeometryData(buffer);
    }).should.throw('Unexpected GeoPackage Geometry flags. Flag bit 7 and 6 should both be 0, 7=1, 6=0');
  });

  it('should set extended to true', function() {
    var flags = Buffer.alloc(1);
    flags.writeUInt8(32);

    var buffer = Buffer.concat([magic, version, flags, srs, point]);
    var geometryData = new GeometryData(buffer);
    geometryData.extended.should.be.equal(true);

    var buffer = geometryData.toData();
    var geometryData2 = new GeometryData(buffer);
    geometryData2.extended.should.be.equal(true);
  });

  it('should set empty to true', function() {
    var flags = Buffer.alloc(1);
    flags.writeUInt8(32);

    var buffer = Buffer.concat([magic, version, flags, srs]);
    var geometryData = new GeometryData(buffer);
    geometryData.extended.should.be.equal(true);
    geometryData.empty = true;

    var buffer = geometryData.toData();
    var geometryData2 = new GeometryData(buffer);
    geometryData2.empty.should.be.equal(true);
  });

  it('should fail to parse the geometry but not throw an error', function() {
    var flags = Buffer.alloc(1);
    flags.writeUInt8(32);

    var badGeom = Buffer.alloc(1);
    badGeom.writeUInt8(0);

    var buffer = Buffer.concat([magic, version, flags, srs, badGeom]);
    var geometryData = new GeometryData(buffer);
    should.exist(geometryData.geometryError);
  });

  it('should set byte order to little endian', function() {
    var flags = Buffer.alloc(1);
    flags.writeUInt8(1);
    var buffer = Buffer.concat([magic, version, flags, srs, point]);
    var geometryData = new GeometryData(buffer);
    geometryData.byteOrder.should.be.equal(1);
  });

  it('should export byte order as little endian', function() {
    var flags = Buffer.alloc(1);
    flags.writeUInt8(1);
    var buffer = Buffer.concat([magic, version, flags, srs, point]);
    var geometryData = new GeometryData(buffer);
    geometryData.byteOrder.should.be.equal(1);

    var buffer = geometryData.toData();
    var geometryData2 = new GeometryData(buffer);
    geometryData2.byteOrder.should.be.equal(1);
  });

  it('should set byte order to big endian', function() {
    var flags = Buffer.alloc(1);
    flags.writeUInt8(0);
    var buffer = Buffer.concat([magic, version, flags, srs, point]);
    var geometryData = new GeometryData(buffer);
    geometryData.byteOrder.should.be.equal(0);
  });

  it('should parse the big endian envelope', function() {
    var tflags = Buffer.alloc(1);
    tflags.writeUInt8(2);
    var envelope = Buffer.alloc(32);
    envelope.writeDoubleBE(Number(5.0), 0);
    envelope.writeDoubleBE(Number(78.0), 8);
    envelope.writeDoubleBE(Number(29.0), 16);
    envelope.writeDoubleBE(Number(12.0), 24);
    var buffer = Buffer.concat([magic, version, tflags, srs, envelope, point]);
    var geometryData = new GeometryData(buffer);
    geometryData.byteOrder.should.be.equal(0);
    geometryData.envelope.minX.should.be.equal(5.0);
    geometryData.envelope.maxX.should.be.equal(78.0);
    geometryData.envelope.minY.should.be.equal(29.0);
    geometryData.envelope.maxY.should.be.equal(12.0);
    geometryData.envelope.hasZ.should.be.equal(false);
    geometryData.envelope.hasM.should.be.equal(false);
    geometryData.geometry.x.should.be.equal(1);
    geometryData.geometry.y.should.be.equal(2);
  });

  it('should parse the big endian envelope with z', function() {
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
    var geometryData = new GeometryData(buffer);
    geometryData.byteOrder.should.be.equal(0);
    geometryData.envelope.minX.should.be.equal(5.0);
    geometryData.envelope.maxX.should.be.equal(78.0);
    geometryData.envelope.minY.should.be.equal(29.0);
    geometryData.envelope.maxY.should.be.equal(12.0);
    geometryData.envelope.hasZ.should.be.equal(true);
    geometryData.envelope.minZ.should.be.equal(87.0);
    geometryData.envelope.maxZ.should.be.equal(99.0);
    geometryData.envelope.hasM.should.be.equal(false);
    geometryData.geometry.x.should.be.equal(1);
    geometryData.geometry.y.should.be.equal(2);
  });

  it('should parse the big endian envelope with m', function() {
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
    var geometryData = new GeometryData(buffer);
    geometryData.byteOrder.should.be.equal(0);
    geometryData.envelope.minX.should.be.equal(5.0);
    geometryData.envelope.maxX.should.be.equal(78.0);
    geometryData.envelope.minY.should.be.equal(29.0);
    geometryData.envelope.maxY.should.be.equal(12.0);
    geometryData.envelope.hasZ.should.be.equal(false);
    geometryData.envelope.hasM.should.be.equal(true);
    geometryData.envelope.minM.should.be.equal(87.0);
    geometryData.envelope.maxM.should.be.equal(99.0);
    geometryData.geometry.x.should.be.equal(1);
    geometryData.geometry.y.should.be.equal(2);
  });

  it('should parse the big endian envelope with m and z', function() {
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
    var geometryData = new GeometryData(buffer);
    geometryData.byteOrder.should.be.equal(0);
    geometryData.envelope.minX.should.be.equal(5.0);
    geometryData.envelope.maxX.should.be.equal(78.0);
    geometryData.envelope.minY.should.be.equal(29.0);
    geometryData.envelope.maxY.should.be.equal(12.0);
    geometryData.envelope.hasZ.should.be.equal(true);
    geometryData.envelope.minZ.should.be.equal(87.0);
    geometryData.envelope.maxZ.should.be.equal(99.0);
    geometryData.envelope.hasM.should.be.equal(true);
    geometryData.envelope.minM.should.be.equal(45.0);
    geometryData.envelope.maxM.should.be.equal(55.0);
    geometryData.geometry.x.should.be.equal(1);
    geometryData.geometry.y.should.be.equal(2);
  });

  it('should parse the Uint8Array', function() {
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
    var geometryData = new GeometryData(array);
    geometryData.byteOrder.should.be.equal(0);
    geometryData.envelope.minX.should.be.equal(5.0);
    geometryData.envelope.maxX.should.be.equal(78.0);
    geometryData.envelope.minY.should.be.equal(29.0);
    geometryData.envelope.maxY.should.be.equal(12.0);
    geometryData.envelope.hasZ.should.be.equal(true);
    geometryData.envelope.minZ.should.be.equal(87.0);
    geometryData.envelope.maxZ.should.be.equal(99.0);
    geometryData.envelope.hasM.should.be.equal(true);
    geometryData.envelope.minM.should.be.equal(45.0);
    geometryData.envelope.maxM.should.be.equal(55.0);
    geometryData.geometry.x.should.be.equal(1);
    geometryData.geometry.y.should.be.equal(2);
  });

  it('should throw unexpected geometry flags error', function() {
    var tflags = Buffer.alloc(1);
    tflags.writeUInt8(12);
    var buffer = Buffer.concat([magic, version, tflags, srs]);
    (function() {
      var geometryData = new GeometryData(buffer);
    }).should.throw('Unexpected GeoPackage Geometry flags. Envelope contents indicator must be between 0 and 4. Actual: 6');
  });

  it('should get the point out', function() {
    var buffer = Buffer.concat([magic, version, flags, srs, point]);
    var geometryData = new GeometryData(buffer);
    geometryData.byteOrder.should.be.equal(0);
  });

  it('should create a point geometry data with an envelope', function() {
    var geometryData = new GeometryData();
    geometryData.empty.should.be.equal(true);
    geometryData.setSrsId(4326);
    geometryData.setGeometry(rawPoint);
    geometryData.empty.should.be.equal(false);
    geometryData.setEnvelope({
      minX: 5.0,
      maxX: 78.0,
      minY: 12.0,
      maxY: 29.0,
      hasZ: true,
      minZ: 87.0,
      maxZ: 99.0,
      hasM: true,
      minM: 45.0,
      maxM: 55.0
    });
    var buffer = geometryData.toData();
    var geometryData2 = new GeometryData(buffer);
    geometryData2.byteOrder.should.be.equal(0);
    geometryData2.envelope.minX.should.be.equal(5.0);
    geometryData2.envelope.maxX.should.be.equal(78.0);
    geometryData2.envelope.minY.should.be.equal(12.0);
    geometryData2.envelope.maxY.should.be.equal(29.0);
    geometryData2.envelope.hasZ.should.be.equal(true);
    geometryData2.envelope.minZ.should.be.equal(87.0);
    geometryData2.envelope.maxZ.should.be.equal(99.0);
    geometryData2.envelope.hasM.should.be.equal(true);
    geometryData2.envelope.minM.should.be.equal(45.0);
    geometryData2.envelope.maxM.should.be.equal(55.0);
    geometryData2.geometry.x.should.be.equal(1);
    geometryData2.geometry.y.should.be.equal(2);
  });

  it('should create a point geometry data without an envelope', function() {
    var geometryData = new GeometryData();
    geometryData.setSrsId(4326);
    geometryData.setGeometry(rawPoint);
    var buffer = geometryData.toData();
    var geometryData2 = new GeometryData(buffer);
    geometryData2.byteOrder.should.be.equal(0);
    geometryData2.geometry.x.should.be.equal(1);
    geometryData2.geometry.y.should.be.equal(2);
  });

});
