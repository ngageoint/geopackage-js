import { GeoPackageGeometryData } from '../../geom/geoPackageGeometryData';

/**
 * Geometry Function for reading Geometry Data from a geometry column blob
 */
export class GeometryFunction {
  /**
   * Function name
   */
  private readonly name: string;

  /**
   * execute function
   */
  private readonly execute: Function;

  /**
   * Constructor
   * @param name function name
   * @param execute execute function
   */
  public constructor(name: string, execute: Function) {
    this.name = name;
    this.execute = execute;
  }

  /**
   * Get the function name
   * @return name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * {@inheritDoc}
   */
  public getFunction(): Function {
    return (buffer: Buffer | Uint8Array): any => {
      const geom = new GeoPackageGeometryData(buffer);
      return this.execute(geom);
    };
  }
}
