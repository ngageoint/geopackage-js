import { Projection, ProjectionConstants, Projections, ProjectionTransform } from '@ngageoint/projections-js';
import { Geometry, GeometryEnvelope, GeometryUtils, Point } from '@ngageoint/simple-features-js';
import { GeometryTransform } from '@ngageoint/simple-features-proj-js';
import { TileBoundingBoxUtils } from './tiles/tileBoundingBoxUtils';

/**
 * Bounding Box with longitude and latitude ranges in degrees
 */
export class BoundingBox {
  /**
   * Min longitude in degrees
   */
  private minLongitude: number;

  /**
   * Max longitude in degrees
   */
  private maxLongitude: number;

  /**
   * Min latitude in degrees
   */
  private minLatitude: number;

  /**
   * Max latitude in degrees
   */
  private maxLatitude: number;

  /**
   * Create a new WGS84 bounding box with world bounds (degrees)
   *
   * @return new bounding box
   */
  public static worldWGS84(): BoundingBox {
    return new BoundingBox();
  }

  /**
   * Create a new Web Mercator bounding box with world bounds (meters)
   *
   * @return new bounding box
   */
  public static worldWebMercator(): BoundingBox {
    return new BoundingBox(
      -ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH,
      -ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH,
      ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH,
      ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH,
    );
  }

  public constructor();
  public constructor(boundingBox: BoundingBox);
  public constructor(envelope: GeometryEnvelope);
  public constructor(geometry: Geometry);
  public constructor(minLongitude: number, minLatitude: number, maxLongitude: number, maxLatitude: number);

  /**
   * Constructor
   * @param args
   */
  public constructor(...args) {
    if (args.length === 0) {
      this.minLongitude = -ProjectionConstants.WGS84_HALF_WORLD_LON_WIDTH;
      this.minLatitude = -ProjectionConstants.WGS84_HALF_WORLD_LAT_HEIGHT;
      this.maxLongitude = ProjectionConstants.WGS84_HALF_WORLD_LON_WIDTH;
      this.maxLatitude = ProjectionConstants.WGS84_HALF_WORLD_LAT_HEIGHT;
    } else if (args.length === 1) {
      if (args[0] instanceof BoundingBox) {
        this.minLongitude = args[0].minLongitude;
        this.minLatitude = args[0].minLatitude;
        this.maxLongitude = args[0].maxLongitude;
        this.maxLatitude = args[0].maxLatitude;
      } else if (args[0] instanceof GeometryEnvelope) {
        this.minLongitude = args[0].minX;
        this.minLatitude = args[0].minY;
        this.maxLongitude = args[0].maxX;
        this.maxLatitude = args[0].maxY;
      } else if (args[0] instanceof Geometry) {
        const envelope = args[0].getEnvelope();
        this.minLongitude = envelope.minX;
        this.minLatitude = envelope.minY;
        this.maxLongitude = envelope.maxX;
        this.maxLatitude = envelope.maxY;
      }
    } else if (args.length === 4) {
      this.minLongitude = args[0];
      this.minLatitude = args[1];
      this.maxLongitude = args[2];
      this.maxLatitude = args[3];
    }
  }

  /**
   * Get the min longitude
   *
   * @return min longitude
   */
  public getMinLongitude(): number {
    return this.minLongitude;
  }

  /**
   * Set the min longitude
   *
   * @param minLongitude
   *            min longitude
   */
  public setMinLongitude(minLongitude: number): void {
    this.minLongitude = minLongitude;
  }

  /**
   * Get the max longitude
   *
   * @return max longitude
   */
  public getMaxLongitude(): number {
    return this.maxLongitude;
  }

  /**
   * Set the max longitude
   *
   * @param maxLongitude
   *            max longitude
   */
  public setMaxLongitude(maxLongitude: number): void {
    this.maxLongitude = maxLongitude;
  }

  /**
   * Get the min latitude
   *
   * @return min latitude
   */
  public getMinLatitude(): number {
    return this.minLatitude;
  }

  /**
   * Set the min latitude
   *
   * @param minLatitude
   *            min latitude
   */
  public setMinLatitude(minLatitude: number): void {
    this.minLatitude = minLatitude;
  }

  /**
   * Get the max latitude
   *
   * @return max latitude
   */
  public getMaxLatitude(): number {
    return this.maxLatitude;
  }

  /**
   * Set the max latitude
   *
   * @param maxLatitude
   *            max latitude
   */
  public setMaxLatitude(maxLatitude: number): void {
    this.maxLatitude = maxLatitude;
  }

  /**
   * Get the longitude range
   *
   * @return longitude range
   */
  public getLongitudeRange(): number {
    return this.getMaxLongitude() - this.getMinLongitude();
  }

  /**
   * Get the latitude range
   *
   * @return latitude range
   */
  public getLatitudeRange(): number {
    return this.getMaxLatitude() - this.getMinLatitude();
  }

  /**
   * Get the bounding box centroid point
   *
   * @return centroid point
   */
  public getCentroid(): Point {
    return BoundingBox.getCentroidForBoundingBox(this);
  }

  /**
   * Get the bounding box centroid point
   *
   * @param boundingBox
   *            bounding box
   *
   * @return centroid point
   */
  public static getCentroidForBoundingBox(boundingBox: BoundingBox): Point {
    const x = (boundingBox.getMinLongitude() + boundingBox.getMaxLongitude()) / 2.0;
    const y = (boundingBox.getMinLatitude() + boundingBox.getMaxLatitude()) / 2.0;
    return new Point(x, y);
  }

  /**
   * Get the centroid for the bounding box and projection
   *
   * @param projection
   *            projection of the bounding box
   * @return centroid point
   */
  public getCentroidInProjection(projection: Projection): Point {
    return BoundingBox.getCentroidForBoundingBoxInProjection(this, projection);
  }

  /**
   * Get the centroid for the bounding box and projection
   *
   * @param boundingBox
   *            bounding box
   * @param projection
   *            projection of the bounding box
   * @return centroid point
   */
  public static getCentroidForBoundingBoxInProjection(boundingBox: BoundingBox, projection: Projection): Point {
    let centroid;
    if (Projections.getUnits(projection.toString()) === 'degrees') {
      centroid = BoundingBox.getDegreesCentroidForBoundingBox(boundingBox);
    } else {
      centroid = BoundingBox.getCentroidForBoundingBox(boundingBox);
    }
    return centroid;
  }

  /**
   * Get the centroid for the bounding box in degrees
   *
   * @return centroid point
   */
  public getDegreesCentroid(): Point {
    return BoundingBox.getDegreesCentroidForBoundingBox(this);
  }

  /**
   * Get the centroid for a bounding box in degrees
   *
   * @param boundingBox
   *            bounding box in degrees
   * @return centroid point
   */
  public static getDegreesCentroidForBoundingBox(boundingBox: BoundingBox): Point {
    return GeometryUtils.getDegreesCentroid(BoundingBox.buildGeometryFromBoundingBox(boundingBox));
  }

  /**
   * Build a Geometry Envelope from the bounding box
   *
   * @return geometry envelope
   */
  public buildEnvelope(): GeometryEnvelope {
    return BoundingBox.buildEnvelopeFromBoundingBox(this);
  }

  /**
   * Build a Geometry Envelope from the bounding box
   *
   * @param boundingBox
   *            bounding box
   * @return geometry envelope
   */
  public static buildEnvelopeFromBoundingBox(boundingBox: BoundingBox): GeometryEnvelope {
    const envelope = new GeometryEnvelope();
    envelope.minX = boundingBox.minLongitude;
    envelope.maxX = boundingBox.maxLongitude;
    envelope.minY = boundingBox.minLatitude;
    envelope.maxY = boundingBox.maxLatitude;
    return envelope;
  }

  /**
   * Build a geometry representation of the bounding box
   *
   * @return geometry, polygon or point
   */
  public buildGeometry(): Geometry {
    return BoundingBox.buildGeometryFromBoundingBox(this);
  }

  /**
   * Build a geometry representation of the bounding box
   *
   * @param boundingBox
   *            bounding box
   *
   * @return geometry, polygon or point
   */
  public static buildGeometryFromBoundingBox(boundingBox: BoundingBox): Geometry {
    return BoundingBox.buildEnvelopeFromBoundingBox(boundingBox).buildGeometry();
  }

  /**
   * If the bounding box spans the Anti-Meridian, attempt to get a
   * complementary bounding box using the max longitude of the unit projection
   *
   * @param maxProjectionLongitude
   *            max longitude of the world for the current bounding box units
   *
   * @return complementary bounding box or nil if none
   */
  public complementary(maxProjectionLongitude: number): BoundingBox {
    let complementary = null;

    let adjust = null;

    if (this.maxLongitude > maxProjectionLongitude) {
      if (this.minLongitude >= -maxProjectionLongitude) {
        adjust = -2 * maxProjectionLongitude;
      }
    } else if (this.minLongitude < -maxProjectionLongitude) {
      if (this.maxLongitude <= maxProjectionLongitude) {
        adjust = 2 * maxProjectionLongitude;
      }
    }

    if (adjust != null) {
      complementary = this.copy();
      complementary.setMinLongitude(complementary.getMinLongitude() + adjust);
      complementary.setMaxLongitude(complementary.getMaxLongitude() + adjust);
    }

    return complementary;
  }

  /**
   * If the bounding box spans the Anti-Meridian, attempt to get a
   * complementary WGS84 bounding box
   *
   * @return complementary bounding box or nil if none
   */
  public complementaryWgs84(): BoundingBox {
    return this.complementary(ProjectionConstants.WGS84_HALF_WORLD_LON_WIDTH);
  }

  /**
   * If the bounding box spans the Anti-Meridian, attempt to get a
   * complementary Web Mercator bounding box
   *
   * @return complementary bounding box or nil if none
   */
  public complementaryWebMercator(): BoundingBox {
    return this.complementary(ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH);
  }

  /**
   * Bound the bounding box longitudes within the min and max possible
   * projection values. This may result in a max longitude numerically lower
   * than the min longitude.
   *
   * @param maxProjectionLongitude
   *            max longitude of the world for the current bounding box units
   * @return bounded bounding box
   */
  public boundCoordinates(maxProjectionLongitude: number): BoundingBox {
    const bounded = this.copy();

    const minLongitude =
      ((this.getMinLongitude() + maxProjectionLongitude) % (2 * maxProjectionLongitude)) - maxProjectionLongitude;
    const maxLongitude =
      ((this.getMaxLongitude() + maxProjectionLongitude) % (2 * maxProjectionLongitude)) - maxProjectionLongitude;

    bounded.setMinLongitude(minLongitude);
    bounded.setMaxLongitude(maxLongitude);

    return bounded;
  }

  /**
   * Bound the bounding box coordinates within WGS84 range values
   *
   * @return bounded bounding box
   */
  public boundWgs84Coordinates(): BoundingBox {
    return this.boundCoordinates(ProjectionConstants.WGS84_HALF_WORLD_LON_WIDTH);
  }

  /**
   * Bound the bounding box coordinates within Web Mercator range values
   *
   * @return bounded bounding box
   */
  public boundWebMercatorCoordinates(): BoundingBox {
    return this.boundCoordinates(ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH);
  }

  /**
   * Expand the bounding box max longitude above the max possible projection
   * value if needed to create a bounding box where the max longitude is
   * numerically larger than the min longitude.
   *
   * @param maxProjectionLongitude
   *            max longitude of the world for the current bounding box units
   * @return expanded bounding box
   */
  public expandCoordinates(maxProjectionLongitude: number): BoundingBox {
    const expanded = this.copy();

    const minLongitude = this.getMinLongitude();
    let maxLongitude = this.getMaxLongitude();

    if (minLongitude > maxLongitude) {
      const worldWraps = 1 + Math.round((minLongitude - maxLongitude) / (2 * maxProjectionLongitude));
      maxLongitude += worldWraps * 2 * maxProjectionLongitude;
      expanded.setMaxLongitude(maxLongitude);
    }

    return expanded;
  }

  /**
   * Expand the bounding box max longitude above the max WGS84 projection
   * value if needed to create a bounding box where the max longitude is
   * numerically larger than the min longitude.
   *
   * @return expanded bounding box
   */
  public expandWgs84Coordinates(): BoundingBox {
    return this.expandCoordinates(ProjectionConstants.WGS84_HALF_WORLD_LON_WIDTH);
  }

  /**
   * Expand the bounding box max longitude above the max Web Mercator
   * projection value if needed to create a bounding box where the max
   * longitude is numerically larger than the min longitude.
   *
   * @return expanded bounding box
   */
  public expandWebMercatorCoordinates(): BoundingBox {
    return this.expandCoordinates(ProjectionConstants.WEB_MERCATOR_HALF_WORLD_WIDTH);
  }

  /**
   * Transform the bounding box using the provided projection transform
   *
   * @param transform
   *            geometry transform
   * @return transformed bounding box
   */
  public transform(transform: GeometryTransform | ProjectionTransform): BoundingBox {
    const geometryTransform = transform instanceof GeometryTransform ? transform : GeometryTransform.create(transform);
    let transformed = this.copy();
    if (!transform.getFromProjection().equalsProjection(transform.getToProjection())) {
      if (
        Projections.getUnits(geometryTransform.getFromProjection().toString()) === 'degrees' &&
        geometryTransform
          .getToProjection()
          .equals(ProjectionConstants.AUTHORITY_EPSG, ProjectionConstants.EPSG_WEB_MERCATOR.toString())
      ) {
        transformed = TileBoundingBoxUtils.boundDegreesBoundingBoxWithWebMercatorLimits(transformed);
      }
      const envelope = transformed.buildEnvelope();
      const bounds = geometryTransform.transformBounds(envelope.minX, envelope.minY, envelope.maxX, envelope.maxY);
      transformed = new BoundingBox(bounds[0], bounds[1], bounds[2], bounds[3]);
    }
    return transformed;
  }

  /**
   * Determine if intersects with the provided bounding box
   *
   * @param boundingBox
   *            bounding box
   * @param allowEmpty
   *            allow empty ranges when determining intersection
   *
   * @return true if intersects
   */
  public intersects(boundingBox: BoundingBox, allowEmpty = false): boolean {
    return this.overlap(boundingBox, allowEmpty) != null;
  }

  /**
   * Get the overlapping bounding box with the provided bounding box
   * @param boundingBox bounding box
   * @param allowEmpty allow empty ranges when determining overlap
   *
   * @return bounding box
   */
  public overlap(boundingBox: BoundingBox, allowEmpty = false): BoundingBox {
    const minLongitude = Math.max(this.getMinLongitude(), boundingBox.getMinLongitude());
    const maxLongitude = Math.min(this.getMaxLongitude(), boundingBox.getMaxLongitude());
    const minLatitude = Math.max(this.getMinLatitude(), boundingBox.getMinLatitude());
    const maxLatitude = Math.min(this.getMaxLatitude(), boundingBox.getMaxLatitude());

    let overlap = null;

    if (
      (minLongitude < maxLongitude && minLatitude < maxLatitude) ||
      (allowEmpty && minLongitude <= maxLongitude && minLatitude <= maxLatitude)
    ) {
      overlap = new BoundingBox(minLongitude, minLatitude, maxLongitude, maxLatitude);
    }

    return overlap;
  }

  /**
   * Get the union bounding box with the provided bounding box
   * @param boundingBox bounding box
   * @return bounding box
   */
  public union(boundingBox: BoundingBox): BoundingBox {
    const minLongitude = Math.min(this.getMinLongitude(), boundingBox.getMinLongitude());
    const maxLongitude = Math.max(this.getMaxLongitude(), boundingBox.getMaxLongitude());
    const minLatitude = Math.min(this.getMinLatitude(), boundingBox.getMinLatitude());
    const maxLatitude = Math.max(this.getMaxLatitude(), boundingBox.getMaxLatitude());

    let union = null;

    if (minLongitude < maxLongitude && minLatitude < maxLatitude) {
      union = new BoundingBox(minLongitude, minLatitude, maxLongitude, maxLatitude);
    }

    return union;
  }

  /**
   * Determine if inclusively contains the provided bounding box
   *
   * @param boundingBox
   *            bounding box
   * @return true if contains
   */
  public contains(boundingBox: BoundingBox): boolean {
    return (
      this.getMinLongitude() <= boundingBox.getMinLongitude() &&
      this.getMaxLongitude() >= boundingBox.getMaxLongitude() &&
      this.getMinLatitude() <= boundingBox.getMinLatitude() &&
      this.getMaxLatitude() >= boundingBox.getMaxLatitude()
    );
  }

  /**
   * Function taken from https://gist.github.com/Yaffle/4654250
   * @param x
   * @private
   */
  private static nextUp(x: number): number {
    const EPSILON = Math.pow(2, -52);
    const MIN_VALUE = Math.pow(2, -1022);
    if (x !== x) return x;
    if (x === -1 / 0) return -Number.MAX_VALUE;
    if (x === 1 / 0) return +1 / 0;
    if (x === Number.MAX_VALUE) return +1 / 0;
    let y = x * (x < 0 ? 1 - EPSILON / 2 : 1 + EPSILON);
    if (y === x) y = MIN_VALUE * EPSILON > 0 ? x + MIN_VALUE * EPSILON : x + MIN_VALUE;
    if (y === +1 / 0) y = +Number.MAX_VALUE;
    const b = x + (y - x) / 2;
    if (x < b && b < y) y = b;
    const c = (y + x) / 2;
    if (x < c && c < y) y = c;
    return y === 0 ? -0 : y;
  }

  /**
   * Function taken from https://gist.github.com/Yaffle/4654250
   * @param x
   * @private
   */
  private static ulp(x): number {
    return x < 0 ? BoundingBox.nextUp(x) - x : x - -BoundingBox.nextUp(-x);
  }

  /**
   * Expand the bounding box to an equally sized width and height bounding box
   * with optional empty edge buffer
   *
   * @param bufferPercentage
   *            bounding box edge buffer percentage. A value of 0.1 adds a 10%
   *            buffer on each side of the squared bounding box.
   * @return new square expanded bounding box
   */
  public squareExpand(bufferPercentage = 0.0): BoundingBox {
    const boundingBox: BoundingBox = this.copy();
    if (boundingBox.isPoint() && bufferPercentage > 0.0) {
      const longitudeExpand = BoundingBox.ulp(boundingBox.getMinLongitude());
      boundingBox.setMinLongitude(boundingBox.getMinLongitude() - longitudeExpand);
      boundingBox.setMaxLongitude(boundingBox.getMaxLongitude() + longitudeExpand);

      const latitudeExpand = BoundingBox.ulp(boundingBox.getMinLatitude());
      boundingBox.setMinLatitude(boundingBox.getMinLatitude() - latitudeExpand);
      boundingBox.setMaxLatitude(boundingBox.getMaxLatitude() + latitudeExpand);
    }

    const lonRange = boundingBox.getLongitudeRange();
    const latRange = boundingBox.getLatitudeRange();

    if (lonRange < latRange) {
      const halfDiff = (latRange - lonRange) / 2.0;
      boundingBox.setMinLongitude(boundingBox.getMinLongitude() - halfDiff);
      boundingBox.setMaxLongitude(boundingBox.getMaxLongitude() + halfDiff);
    } else if (latRange < lonRange) {
      const halfDiff = (lonRange - latRange) / 2.0;
      boundingBox.setMinLatitude(boundingBox.getMinLatitude() - halfDiff);
      boundingBox.setMaxLatitude(boundingBox.getMaxLatitude() + halfDiff);
    }

    const range = Math.max(Math.max(lonRange, latRange), Number.MIN_VALUE);
    const buffer = (range / (1.0 - 2.0 * bufferPercentage) - range) / 2.0;

    boundingBox.setMinLongitude(boundingBox.getMinLongitude() - buffer);
    boundingBox.setMinLatitude(boundingBox.getMinLatitude() - buffer);
    boundingBox.setMaxLongitude(boundingBox.getMaxLongitude() + buffer);
    boundingBox.setMaxLatitude(boundingBox.getMaxLatitude() + buffer);

    return boundingBox;
  }

  /**
   * Determine if the bounding box is of a single point
   *
   * @return true if a single point bounds
   */
  public isPoint(): boolean {
    return this.minLongitude === this.maxLongitude && this.minLatitude === this.maxLatitude;
  }

  /**
   * Copy the bounding box
   *
   * @return bounding box copy
   */
  public copy(): BoundingBox {
    return new BoundingBox(this);
  }

  /**
   * {@inheritDoc}
   */
  public equals(obj: BoundingBox): boolean {
    return (
      this.minLongitude === obj.minLongitude &&
      this.minLatitude === obj.minLatitude &&
      this.maxLongitude === obj.maxLongitude &&
      this.maxLatitude === obj.maxLatitude
    );
  }
}
