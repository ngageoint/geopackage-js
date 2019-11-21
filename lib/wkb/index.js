/**
 * WKB module.
 * @module wkb
 */

var typeMap = {
  wkt: {
    Point: 'POINT',
    LineString: 'LINESTRING',
    Polygon: 'POLYGON',
    MultiPoint: 'MULTIPOINT',
    MultiLineString: 'MULTILINESTRING',
    MultiPolygon: 'MULTIPOLYGON',
    GeometryCollection: 'GEOMETRYCOLLECTION'
  },
  wkb: {
    Point: 1,
    LineString: 2,
    Polygon: 3,
    MultiPoint: 4,
    MultiLineString: 5,
    MultiPolygon: 6,
    GeometryCollection: 7
  }
};

var wktToEnum = {};
wktToEnum[typeMap.wkt.Point] = typeMap.wkb.Point;
wktToEnum[typeMap.wkt.LineString] = typeMap.wkb.LineString;
wktToEnum[typeMap.wkt.Polygon] = typeMap.wkb.Polygon;
wktToEnum[typeMap.wkt.MultiPoint] = typeMap.wkb.MultiPoint;
wktToEnum[typeMap.wkt.MultiLineString] = typeMap.wkb.MultiLineString;
wktToEnum[typeMap.wkt.MultiPolygon] = typeMap.wkb.MultiPolygon;
wktToEnum[typeMap.wkt.GeometryCollection] = typeMap.wkb.GeometryCollection;

/**
 * number from name
 * @param  {string} name name
 * @return {Number}      number corresponding to the wkb name
 */
module.exports.fromName = function(name) {
  name = name.toUpperCase();
  if (name === 'GEOMETRY') {
    return typeMap.wkb.GeometryCollection;
  }
  return wktToEnum[name];
};
