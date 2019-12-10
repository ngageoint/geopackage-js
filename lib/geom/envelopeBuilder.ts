import turfBbox from '@turf/bbox';

export default class DataTypes {
  static buildEnvelopeWithGeometry(wkbGeometry) {
    var geoJson = wkbGeometry.toGeoJSON();
    var bbox = turfBbox(geoJson);
    return {
      minX: bbox[0],
      minY: bbox[1],
      maxX: bbox[2],
      maxY: bbox[3]
    };
  }
}
