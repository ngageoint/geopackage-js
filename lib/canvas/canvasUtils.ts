/**
 * Canvas utility functions
 */
export class CanvasUtils {
  /**
   * Convert base64 to Uint8array
   * @param {string}data
   */
  static base64toUInt8Array(data): Uint8Array {
    const bytes = Buffer.from(data, 'base64').toString('binary');
    let length = bytes.length;
    const out = new Uint8Array(length);

    // Loop and convert.
    while (length--) {
      out[length] = bytes.charCodeAt(length);
    }

    return out;
  }

  /**
   * Convert base64 to Uint8Array
   * @param {string} data
   */
  static base64ToUInt8ArrayBrowser(data): Uint8Array {
    const binary = atob(data);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
