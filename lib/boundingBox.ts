import proj4 from 'proj4'
import { Envelope } from './geom/envelope';

/**
 * Create a new bounding box
 * @class BoundingBox
 */
export class BoundingBox {
  minLongitude: any;
  maxLongitude: any;
  minLatitude: any;
  maxLatitude: any;
  /**
   * @param  {BoundingBox | Number} minLongitudeOrBoundingBox minimum longitude or bounding box to copy (west)
   * @param  {Number} [maxLongitude]              maximum longitude (east)
   * @param  {Number} [minLatitude]               Minimum latitude (south)
   * @param  {Number} [maxLatitude]               Maximum latitude (north)
   */
  constructor(minLongitudeOrBoundingBox: BoundingBox | number, maxLongitude?: number, minLatitude?: number, maxLatitude?: number) {
    // if there is a second argument the first argument is the minLongitude
    if (minLongitudeOrBoundingBox instanceof BoundingBox) {
      var boundingBox = minLongitudeOrBoundingBox;
      this.minLongitude = boundingBox.minLongitude;
      this.maxLongitude = boundingBox.maxLongitude;
      this.minLatitude = boundingBox.minLatitude;
      this.maxLatitude = boundingBox.maxLatitude;
    } else {
      this.minLongitude = minLongitudeOrBoundingBox;
      this.maxLongitude = maxLongitude;
      this.minLatitude = minLatitude;
      this.maxLatitude = maxLatitude;
    }
  }
  /**
   * Build a Geometry Envelope from the bounding box
   *
   * @return geometry envelope
   */
  buildEnvelope(): Envelope {
    return {
      minY: this.minLatitude,
      minX: this.minLongitude,
      maxY: this.maxLatitude,
      maxX: this.maxLongitude
    };
  }
  toGeoJSON(): any {
    return {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [this.minLongitude, this.minLatitude],
            [this.maxLongitude, this.minLatitude],
            [this.maxLongitude, this.maxLatitude],
            [this.minLongitude, this.maxLatitude],
            [this.minLongitude, this.minLatitude]
          ]
        ]
      }
    };
  }
  /**
   * Determine if equal to the provided bounding box
   * @param  {BoundingBox} boundingBox bounding boundingBox
   * @return {Boolean}             true if equal, false if not
   */
  equals(boundingBox: BoundingBox): boolean {
    if (!boundingBox) {
      return false;
    }
    if (this === boundingBox) {
      return true;
    }
    return this.maxLatitude === boundingBox.maxLatitude
      && this.minLatitude === boundingBox.minLatitude
      && this.maxLongitude === boundingBox.maxLongitude
      && this.maxLatitude === boundingBox.maxLatitude;
  }
  
  /**
   * Project the bounding box into a new projection
   * 
   * @param {string} from
   * @param {string} to
   * @return {BoundingBox}
   */
  projectBoundingBox(from?: string, to?: string): BoundingBox {
    if (from && from !== 'undefined' && to && to !== 'undefined') {
      if (to.toUpperCase && to.toUpperCase() === 'EPSG:3857' && from.toUpperCase && from.toUpperCase() === 'EPSG:4326') {
        this.maxLatitude = Math.min(this.maxLatitude, 85.0511);
        this.minLatitude = Math.max(this.minLatitude, -85.0511);
        this.minLongitude = Math.max(this.minLongitude, -180.0);
        this.maxLongitude = Math.min(this.maxLongitude, 180.0);
      }
      var min = proj4(from, to, [this.minLongitude, this.minLatitude]);
      var max = proj4(from, to, [this.maxLongitude, this.maxLatitude]);
      var projected = new BoundingBox(min[0], max[0], min[1], max[1]);
      return projected;
    }
    return this;
  }
}
