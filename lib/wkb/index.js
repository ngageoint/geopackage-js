/**
 * WKB module.
 * @module wkb
 */

var wkx = require('wkx');

var wktToEnum = {};
wktToEnum[wkx.Types.wkt.Point] = wkx.Types.wkb.Point;
wktToEnum[wkx.Types.wkt.LineString] = wkx.Types.wkb.LineString;
wktToEnum[wkx.Types.wkt.Polygon] = wkx.Types.wkb.Polygon;
wktToEnum[wkx.Types.wkt.MultiPoint] = wkx.Types.wkb.MultiPoint;
wktToEnum[wkx.Types.wkt.MultiLineString] = wkx.Types.wkb.MultiLineString;
wktToEnum[wkx.Types.wkt.MultiPolygon] = wkx.Types.wkb.MultiPolygon;
wktToEnum[wkx.Types.wkt.GeometryCollection] = wkx.Types.wkb.GeometryCollection;

/**
 * number from name
 * @param  {string} name name
 * @return {Number}      number corresponding to the wkb name
 */
module.exports.fromName = function(name) {
  if (name === 'GEOMETRY') {
    return wkx.Types.wkt.GeometryCollection;
  }
  return wktToEnum[name];
}
