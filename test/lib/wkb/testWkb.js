var WKB = require('../../../lib/wkb');
var wkx = require('wkx');

describe('WKB tests', function() {

  it('should get a geometry collection from a GEOMETRY name', function() {
    var wkb = WKB.fromName('GEOMETRY');
    wkb.should.be.equal(wkx.Types.wkb.GeometryCollection);
  });

  it('should get a point from a wkx.Types.wkt.Point name', function() {
    var wkb = WKB.fromName(wkx.Types.wkt.Point);
    wkb.should.be.equal(wkx.Types.wkb.Point);
  });

  it('should get a LineString from a wkx.Types.wkt.LineString name', function() {
    var wkb = WKB.fromName(wkx.Types.wkt.LineString);
    wkb.should.be.equal(wkx.Types.wkb.LineString);
  });

  it('should get a Polygon from a wkx.Types.wkt.Polygon name', function() {
    var wkb = WKB.fromName(wkx.Types.wkt.Polygon);
    wkb.should.be.equal(wkx.Types.wkb.Polygon);
  });

  it('should get a MultiPoint from a wkx.Types.wkt.MultiPoint name', function() {
    var wkb = WKB.fromName(wkx.Types.wkt.MultiPoint);
    wkb.should.be.equal(wkx.Types.wkb.MultiPoint);
  });

  it('should get a MultiLineString from a wkx.Types.wkt.MultiLineString name', function() {
    var wkb = WKB.fromName(wkx.Types.wkt.MultiLineString);
    wkb.should.be.equal(wkx.Types.wkb.MultiLineString);
  });

  it('should get a MultiPolygon from a wkx.Types.wkt.MultiPolygon name', function() {
    var wkb = WKB.fromName(wkx.Types.wkt.MultiPolygon);
    wkb.should.be.equal(wkx.Types.wkb.MultiPolygon);
  });

  it('should get a GeometryCollection from a wkx.Types.wkt.GeometryCollection name', function() {
    var wkb = WKB.fromName(wkx.Types.wkt.GeometryCollection);
    wkb.should.be.equal(wkx.Types.wkb.GeometryCollection);
  });
});
