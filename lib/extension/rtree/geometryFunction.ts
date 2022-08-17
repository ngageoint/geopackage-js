import { GeoPackageGeometryData } from '../../geom/geoPackageGeometryData';

/**
 * Geometry Function for reading Geometry Data from a geometry column blob
 */
export abstract class GeometryFunction {
  /**
   * Function name
   */
  private readonly name: string;

  /**
   * Constructor
   * @param name function name
   */
  public constructor(name: string) {
    this.name = name;
  }

  /**
   * Get the function name
   * @return name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Execute the function
   * @param geometryData geometry data
   * @return function result
   */
  public abstract execute(geometryData: GeoPackageGeometryData): any;

  /**
   * {@inheritDoc}
   */
  protected xFunc(buffer: Buffer | Uint8Array): void {
    const geom = new GeoPackageGeometryData(buffer);
    return this.execute(geom);
  }
}
