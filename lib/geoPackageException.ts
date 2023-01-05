/**
 * GeoPackage exception
 */
export class GeoPackageException extends Error {
  constructor(message?: string) {
    super(message);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, GeoPackageException.prototype);
  }
}
