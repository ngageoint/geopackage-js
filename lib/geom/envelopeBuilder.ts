import turfBbox from '@turf/bbox';
import wkx from 'wkx';
import { Envelope } from './envelope';

export class EnvelopeBuilder {
  static buildEnvelopeWithGeometry(wkbGeometry: wkx.Geometry): Envelope {
    const geoJson = wkbGeometry.toGeoJSON();
    const bbox = turfBbox(geoJson);
    return {
      minX: bbox[0],
      minY: bbox[1],
      maxX: bbox[2],
      maxY: bbox[3],
    };
  }
}
