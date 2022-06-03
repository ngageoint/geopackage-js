import proj4 from 'proj4';
import { Envelope } from './geom/envelope';
import { Feature, Polygon } from 'geojson';
import { Projection } from './projection/projection';
import { ProjectionConstants } from './projection/projectionConstants';

/**
 * Create a new bounding box
 * @class BoundingBox
 */
export class BoundingBox {
  _minLongitude: number;
  _maxLongitude: number;
  _minLatitude: number;
  _maxLatitude: number;
  _width: number;
  _height: number;
  /**
   * @param  {BoundingBox | Number} minLongitudeOrBoundingBox minimum longitude or bounding box to copy (west)
   * @param  {Number} [maxLongitude]              maximum longitude (east)
   * @param  {Number} [minLatitude]               Minimum latitude (south)
   * @param  {Number} [maxLatitude]               Maximum latitude (north)
   */
  constructor(
    minLongitudeOrBoundingBox: BoundingBox | number,
    maxLongitude?: number,
    minLatitude?: number,
    maxLatitude?: number,
  ) {
    // if there is a second argument the first argument is the minLongitude
    if (minLongitudeOrBoundingBox instanceof BoundingBox) {
      this.minLongitude = minLongitudeOrBoundingBox.minLongitude;
      this.maxLongitude = minLongitudeOrBoundingBox.maxLongitude;
      this.minLatitude = minLongitudeOrBoundingBox.minLatitude;
      this.maxLatitude = minLongitudeOrBoundingBox.maxLatitude;
    } else {
      this.minLongitude = minLongitudeOrBoundingBox;
      this.maxLongitude = maxLongitude;
      this.minLatitude = minLatitude;
      this.maxLatitude = maxLatitude;
    }
  }

  get minLongitude (): number {
    return this._minLongitude
  }

  set minLongitude (longitude: number) {
    this._minLongitude = longitude;
    this.width = this.maxLongitude - this.minLongitude;
  }

  get maxLongitude (): number {
    return this._maxLongitude
  }

  set maxLongitude (longitude: number) {
    this._maxLongitude = longitude;
    this.width = this.maxLongitude - this.minLongitude;
  }

  get minLatitude (): number {
    return this._minLatitude
  }

  set minLatitude (latitude: number) {
    this._minLatitude = latitude;
    this.height = this.maxLatitude - this.minLatitude;
  }

  get maxLatitude (): number {
    return this._maxLatitude
  }

  set maxLatitude (latitude: number) {
    this._maxLatitude = latitude;
    this.height = this.maxLatitude - this.minLatitude;
  }

  get width (): number {
    return this._width
  }

  set width (width: number) {
    this._width = width;
  }

  get height (): number {
    return this._height
  }

  set height (height: number) {
    this._height = height;
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
      maxX: this.maxLongitude,
    };
  }
  toGeoJSON(): Feature<Polygon> {
    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [this.minLongitude, this.minLatitude],
            [this.maxLongitude, this.minLatitude],
            [this.maxLongitude, this.maxLatitude],
            [this.minLongitude, this.maxLatitude],
            [this.minLongitude, this.minLatitude],
          ],
        ],
      },
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
    return (
      this.maxLatitude === boundingBox.maxLatitude &&
      this.minLatitude === boundingBox.minLatitude &&
      this.maxLongitude === boundingBox.maxLongitude &&
      this.maxLatitude === boundingBox.maxLatitude
    );
  }

  /**
   * Project the bounding box into a new projection
   *
   * @param {string} from
   * @param {string} to
   * @return {BoundingBox}
   */
  projectBoundingBox(from?: string | proj4.Converter, to?: string | proj4.Converter): BoundingBox {
    let minLatitude = this.minLatitude;
    let maxLatitude = this.maxLatitude;
    let minLongitude = this.minLongitude;
    let maxLongitude = this.maxLongitude;

    if (from && from !== 'undefined' && to && to !== 'undefined') {
      // if we are going from 4326 to 3857, we first need to trim to the maximum for 3857
      if (Projection.isWebMercator(to) && Projection.isWGS84(from)) {
        maxLatitude = Math.min(maxLatitude, ProjectionConstants.WEB_MERCATOR_MAX_LAT_RANGE);
        minLatitude = Math.max(minLatitude, ProjectionConstants.WEB_MERCATOR_MIN_LAT_RANGE);
        maxLongitude = Math.min(maxLongitude, ProjectionConstants.WEB_MERCATOR_MAX_LON_RANGE);
        minLongitude = Math.max(minLongitude, ProjectionConstants.WEB_MERCATOR_MIN_LON_RANGE);
      }

      let toConverter: proj4.Converter;
      if (Projection.isConverter(to)) {
        toConverter = to;
      } else {
        toConverter = Projection.getConverter(to);
      }
      let fromConverter: proj4.Converter;
      if (Projection.isConverter(from)) {
        fromConverter = from;
      } else {
        fromConverter = Projection.getConverter(from);
      }

      // no need to convert if converters are the same
      if (Projection.convertersMatch(toConverter, fromConverter)) {
        return new BoundingBox(minLongitude, maxLongitude, minLatitude, maxLatitude);
      } else {
        const sw = toConverter.forward(fromConverter.inverse([minLongitude, minLatitude]));
        const ne = toConverter.forward(fromConverter.inverse([maxLongitude, maxLatitude]));
        const se = toConverter.forward(fromConverter.inverse([maxLongitude, minLatitude]));
        const nw = toConverter.forward(fromConverter.inverse([minLongitude, maxLatitude]));

        return new BoundingBox(
          Math.min(sw[0], nw[0]),
          Math.max(ne[0], se[0]),
          Math.min(sw[1], se[1]),
          Math.max(ne[1], se[1]),
        );
      }
    }
    return this;
  }
}
