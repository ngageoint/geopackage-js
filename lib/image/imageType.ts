import { GeoPackageException } from '../geoPackageException';

/**
 * Supported Image Types for GeoPackage
 */
export enum ImageType {
  PNG = 'png',
  JPEG = 'jpeg',
  JPG = 'jpg',
  TIFF = 'tiff',
  WEBP = 'webp',
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ImageType {
  /**
   * Gets the associated mime type for the ImageType provided
   * @param type
   */
  export function getMimeType(type: ImageType): string {
    let mimeType = null;
    switch (type) {
      case ImageType.PNG:
        mimeType = 'image/png';
        break;
      case ImageType.JPEG:
        mimeType = 'image/jpeg';
        break;
      case ImageType.JPG:
        mimeType = 'image/jpg';
        break;
      case ImageType.TIFF:
        mimeType = 'image/tiff';
        break;
      case ImageType.WEBP:
        mimeType = 'image/webp';
        break;
      default:
        throw new GeoPackageException('Unsupported Image Type: ' + type);
    }
    return mimeType;
  }
}
