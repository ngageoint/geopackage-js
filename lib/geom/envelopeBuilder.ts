import turfBbox from '@turf/bbox';
import wkx from 'wkx';

export class EnvelopeBuilder {
  static buildEnvelopeWithGeometry(wkbGeometry: wkx.Geometry) {
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
