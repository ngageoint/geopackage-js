export class CanvasUtils {
  static base64toUInt8Array(data) {
    const bytes = Buffer.from(data, 'base64').toString('binary');
    let length = bytes.length;
    let out = new Uint8Array(length);

    // Loop and convert.
    while (length--) {
      out[length] = bytes.charCodeAt(length);
    }

    return out;
  };
}
