/**
 * Utility methods for GeoPackage library
 */
export class GeoPackageUtilities {
  /**
   * Format the bytes into readable text
   * @param bytes bytes
   * @return bytes text
   */
  public static formatBytes(bytes: number): string {
    let value = bytes;
    let unit = 'B';
    if (bytes >= 1024) {
      let exponent = Math.round(Math.log(bytes) / Math.log(1024));
      exponent = Math.min(exponent, 4);
      switch (exponent) {
        case 1:
          unit = 'KB';
          break;
        case 2:
          unit = 'MB';
          break;
        case 3:
          unit = 'GB';
          break;
        case 4:
          unit = 'TB';
          break;
      }
      value = bytes / Math.pow(1024, exponent);
    }
    return value.toFixed(2) + ' ' + unit;
  }
}
