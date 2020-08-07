var WKB = require('../../../lib/wkb').WKB;
var wkx = require('wkx');
var should = require('chai').should();

describe('WKB tests', function() {

  it('should get a geometry collection from a GEOMETRY name', function() {
    var wkb = WKB.fromName('GEOMETRY');
    wkb.should.be.equal(WKB.typeMap.wkb.GeometryCollection);
  });

  it('should get a point from a wkx.Types.wkt.Point name', function() {
    var wkb = WKB.fromName(WKB.typeMap.wkt.Point);
    wkb.should.be.equal(WKB.typeMap.wkb.Point);
  });

  it('should get a LineString from a wkx.Types.wkt.LineString name', function() {
    var wkb = WKB.fromName(WKB.typeMap.wkt.LineString);
    wkb.should.be.equal(WKB.typeMap.wkb.LineString);
  });

  it('should get a Polygon from a wkx.Types.wkt.Polygon name', function() {
    var wkb = WKB.fromName(WKB.typeMap.wkt.Polygon);
    wkb.should.be.equal(WKB.typeMap.wkb.Polygon);
  });

  it('should get a MultiPoint from a wkx.Types.wkt.MultiPoint name', function() {
    var wkb = WKB.fromName(WKB.typeMap.wkt.MultiPoint);
    wkb.should.be.equal(WKB.typeMap.wkb.MultiPoint);
  });

  it('should get a MultiLineString from a wkx.Types.wkt.MultiLineString name', function() {
    var wkb = WKB.fromName(WKB.typeMap.wkt.MultiLineString);
    wkb.should.be.equal(WKB.typeMap.wkb.MultiLineString);
  });

  it('should get a MultiPolygon from a wkx.Types.wkt.MultiPolygon name', function() {
    var wkb = WKB.fromName(WKB.typeMap.wkt.MultiPolygon);
    wkb.should.be.equal(WKB.typeMap.wkb.MultiPolygon);
  });

  it('should get a GeometryCollection from a wkx.Types.wkt.GeometryCollection name', function() {
    var wkb = WKB.fromName(WKB.typeMap.wkt.GeometryCollection);
    wkb.should.be.equal(WKB.typeMap.wkb.GeometryCollection);
  });
});
