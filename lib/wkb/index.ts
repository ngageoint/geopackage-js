/**
 * WKB module.
 * @module wkb
 */

export class WKB {
  public static readonly typeMap = {
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

  public static readonly wktToEnum = {
    [WKB.typeMap.wkt.Point]: WKB.typeMap.wkb.Point,
    [WKB.typeMap.wkt.LineString]: WKB.typeMap.wkb.LineString,
    [WKB.typeMap.wkt.Polygon]: WKB.typeMap.wkb.Polygon,
    [WKB.typeMap.wkt.MultiPoint]: WKB.typeMap.wkb.MultiPoint,
    [WKB.typeMap.wkt.MultiLineString]: WKB.typeMap.wkb.MultiLineString,
    [WKB.typeMap.wkt.MultiPolygon]: WKB.typeMap.wkb.MultiPolygon,
    [WKB.typeMap.wkt.GeometryCollection]: WKB.typeMap.wkb.GeometryCollection,
  }

  /**
   * number from name
   * @param  {string} name name
   * @return {Number}      number corresponding to the wkb name
   */
  static fromName(name) {
    name = name.toUpperCase();
    if (name === 'GEOMETRY') {
      return WKB.typeMap.wkb.GeometryCollection;
    }
    return WKB.wktToEnum[name];
  }
}
