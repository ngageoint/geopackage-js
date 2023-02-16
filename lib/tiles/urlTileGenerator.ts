import { TileGenerator } from './tileGenerator';
import { TileFormatType } from '../io/tileFormatType';
import { BoundingBox } from '../boundingBox';
import { Projection, Projections } from '@ngageoint/projections-js';
import { GeoPackage } from '../geoPackage';
import { GeoPackageException } from '../geoPackageException';
import { TileBoundingBoxUtils } from './tileBoundingBoxUtils';
import { GeoPackageTile } from './geoPackageTile';
import { ImageType } from '../image/imageType';
import { Canvas } from '../canvas/canvas';

/**
 * Creates a set of tiles within a GeoPackage by downloading the tiles from a
 * URL
 */
export class UrlTileGenerator extends TileGenerator {
  /**
   * URL Z Variable
   */
  private static readonly Z_VARIABLE = '{z}';

  /**
   * URL X Variable
   */
  private static readonly X_VARIABLE = '{x}';

  /**
   * URL Y Variable
   */
  private static readonly Y_VARIABLE = '{y}';

  /**
   * URL Min Lat Variable
   */
  private static readonly MIN_LAT_VARIABLE = '{minLat}';

  /**
   * URL Max Lat Variable
   */
  private static readonly MAX_LAT_VARIABLE = '{maxLat}';

  /**
   * URL Min Lon Variable
   */
  private static readonly MIN_LON_VARIABLE = '{minLon}';

  /**
   * URL Max Lon Variable
   */
  private static readonly MAX_LON_VARIABLE = '{maxLon}';

  /**
   * Tile URL
   */
  private tileUrl: string;

  /**
   * True if the URL has x, y, or z variables
   */
  private urlHasXYZ: boolean;

  /**
   * True if the URL has bounding box variables
   */
  private urlHasBoundingBox: boolean;

  /**
   * Tile Format when downloading tiles with x, y, and z values
   */
  private tileFormat: TileFormatType = TileFormatType.XYZ;

  /**
   * Download attempts per tile
   */
  private downloadAttempts = 3;

  /**
   * HTTP request method, when null default is "GET"
   */
  private httpMethod = 'GET';

  /**
   * HTTP Header fields and field values
   */
  private httpHeader: Map<string, string[]>;

  /**
   * Constructor
   *
   * @param geoPackage GeoPackage
   * @param tableName table name
   * @param tileUrl tile URL
   * @param zoomLevels zoom levels
   * @param boundingBox tiles bounding box
   * @param projection tiles projection
   */
  public constructor(
    geoPackage: GeoPackage,
    tableName: string,
    tileUrl: string,
    zoomLevels: number[],
    boundingBox: BoundingBox,
    projection: Projection,
  ) {
    super(geoPackage, tableName, boundingBox, projection, zoomLevels);
    this.initialize(tileUrl);
  }

  /**
   * Initialize the tile URL
   * @param tileUrl tile URL
   */
  private initialize(tileUrl: string): void {
    this.tileUrl = tileUrl;
    this.urlHasXYZ = this.hasXYZ(tileUrl);
    this.urlHasBoundingBox = this.hasBoundingBox(tileUrl);
    if (!this.urlHasXYZ && !this.urlHasBoundingBox) {
      throw new GeoPackageException('URL does not contain x,y,z or bounding box variables: ' + tileUrl);
    }
  }

  /**
   * Get the tile format
   *
   * @return tile format
   */
  public getTileFormat(): TileFormatType {
    return this.tileFormat;
  }

  /**
   * Set the tile format
   * @param tileFormat tile format
   */
  public setTileFormat(tileFormat: TileFormatType): void {
    if (tileFormat == null) {
      this.tileFormat = TileFormatType.XYZ;
    } else {
      switch (tileFormat) {
        case TileFormatType.XYZ:
        case TileFormatType.TMS:
          this.tileFormat = tileFormat;
          break;
        default:
          throw new GeoPackageException('Unsupported Tile Format Type for URL Tile Generation: ' + tileFormat);
      }
    }
  }

  /**
   * Get the number of download attempts per tile
   * @return download attempts
   */
  public getDownloadAttempts(): number {
    return this.downloadAttempts;
  }

  /**
   * Set the number of download attempts per tile
   * @param downloadAttempts download attempts per tile
   */
  public setDownloadAttempts(downloadAttempts: number): void {
    this.downloadAttempts = downloadAttempts;
  }

  /**
   * Get the HTTP request method, when null default is "GET"
   * @return method
   */
  public getHttpMethod(): string {
    return this.httpMethod;
  }

  /**
   * Set the HTTP request method
   * @param httpMethod method ("GET", "POST")
   */
  public setHttpMethod(httpMethod: string): void {
    this.httpMethod = httpMethod;
  }

  /**
   * Get the HTTP Header fields and field values
   * @return header map
   */
  public getHttpHeader(): Map<string, string[]> {
    return this.httpHeader;
  }

  /**
   * Get the HTTP Header field values
   * @param field field name
   * @return field values
   */
  public getHttpHeaderValues(field: string): string[] {
    let fieldValues = null;
    if (this.httpHeader != null) {
      fieldValues = this.httpHeader.get(field);
    }
    return fieldValues;
  }

  /**
   * Add a HTTP Header field value, appending to any existing values for the
   * field
   * @param field field name
   * @param value field value
   */
  public addHTTPHeaderValue(field: string, value: string): void {
    if (this.httpHeader == null) {
      this.httpHeader = new Map();
    }
    let values = this.httpHeader.get(field);
    if (values == null) {
      values = [];
      this.httpHeader.set(field, values);
    }
    values.push(value);
  }

  /**
   * Add HTTP Header field values, appending to any existing values for the
   * field
   * @param field field name
   * @param values field values
   */
  public addHTTPHeaderValues(field: string, values: string[]): void {
    for (const value of values) {
      this.addHTTPHeaderValue(field, value);
    }
  }

  /**
   * Determine if the url has bounding box variables
   * @param url
   * @return
   */
  private hasBoundingBox(url: string): boolean {
    const replacedUrl = this.replaceBoundingBox(url, this.boundingBox);
    return replacedUrl !== url;
  }

  /**
   * Replace x, y, and z in the url
   * @param url
   * @param z
   * @param x
   * @param y
   * @return
   */
  private replaceXYZ(url: string, z: number, x: number, y: number): string {
    url = url.replace(UrlTileGenerator.Z_VARIABLE, z.toString());
    url = url.replace(UrlTileGenerator.X_VARIABLE, x.toString());
    url = url.replace(UrlTileGenerator.Y_VARIABLE, y.toString());
    return url;
  }

  /**
   * Determine if the url has x, y, or z variables
   *
   * @param url
   * @return
   */
  private hasXYZ(url: string): boolean {
    const replacedUrl = this.replaceXYZ(url, 0, 0, 0);
    return replacedUrl !== url;
  }

  /**
   * Replace the bounding box coordinates in the url
   *
   * @param url
   * @param z
   * @param x
   * @param y
   * @return
   */
  private replaceBoundingBoxWithXYZ(url: string, z: number, x: number, y: number): string {
    let boundingBox = null;

    if (Projections.getUnits(this.projection.toString()) === 'degrees') {
      boundingBox = TileBoundingBoxUtils.getProjectedBoundingBoxFromWGS84WithProjection(this.projection, x, y, z);
    } else {
      boundingBox = TileBoundingBoxUtils.getProjectedBoundingBoxWithProjection(this.projection, x, y, z);
    }

    url = this.replaceBoundingBox(url, boundingBox);

    return url;
  }

  /**
   * Replace the url parts with the bounding box
   *
   * @param url
   * @param boundingBox
   * @return
   */
  private replaceBoundingBox(url: string, boundingBox: BoundingBox): string {
    url = url.replace(UrlTileGenerator.MIN_LAT_VARIABLE, boundingBox.getMinLatitude().toString());
    url = url.replace(UrlTileGenerator.MAX_LAT_VARIABLE, boundingBox.getMaxLatitude().toString());
    url = url.replace(UrlTileGenerator.MIN_LON_VARIABLE, boundingBox.getMinLongitude().toString());
    url = url.replace(UrlTileGenerator.MAX_LON_VARIABLE, boundingBox.getMaxLongitude().toString());
    return url;
  }

  /**
   * {@inheritDoc}
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected preTileGeneration(): void {}

  /**
   * {@inheritDoc}
   */
  protected async createTile(z: number, x: number, y: number): Promise<GeoPackageTile> {
    let bytes = null;
    let contentType = null;
    let zoomUrl = this.tileUrl;

    // Replace x, y, and z
    if (this.urlHasXYZ) {
      let yRequest = y;

      // If TMS, flip the y value
      if (this.tileFormat === TileFormatType.TMS) {
        yRequest = TileBoundingBoxUtils.getYAsOppositeTileFormat(z, y);
      }

      zoomUrl = this.replaceXYZ(zoomUrl, z, x, yRequest);
    }

    // Replace bounding box
    if (this.urlHasBoundingBox) {
      zoomUrl = this.replaceBoundingBoxWithXYZ(zoomUrl, z, x, y);
    }

    let attempt = 1;
    while (attempt < this.downloadAttempts) {
      try {
        const result = await this.downloadTile(zoomUrl, z, x, y);
        contentType = result.contentType;
        bytes = result.data;
        attempt++;
        break;
      } catch (e) {
        if (attempt < this.downloadAttempts) {
          console.warn(
            'Failed to download tile after attempt ' +
              attempt +
              ' of ' +
              this.downloadAttempts +
              '. URL: ' +
              zoomUrl +
              ', z=' +
              z +
              ', x=' +
              x +
              ', y=' +
              y,
            e,
          );
          attempt++;
        } else {
          throw new GeoPackageException(
            'Failed to download tile after ' +
              this.downloadAttempts +
              ' attempts. URL: ' +
              zoomUrl +
              ', z=' +
              z +
              ', x=' +
              x +
              ', y=' +
              y,
          );
        }
      }
    }
    let tile;
    if (contentType != null && bytes != null) {
      try {
        let compressedBytes;
        const compressedFormat = this.getCompressFormat() || ImageType.PNG;
        const compressedQuality = this.getCompressQuality() || 0.92;
        // we need to now compress the image into the specified format/quality
        const image = await Canvas.createImage(bytes, contentType);
        if (ImageType.getTypeFromMimeType(contentType) === ImageType.PNG) {
          compressedBytes = bytes;
        } else {
          const image = await Canvas.createImage(bytes, contentType);
          compressedBytes = await Canvas.writeImageToBytes(image, compressedFormat, compressedQuality);
        }
        tile = new GeoPackageTile(image.getWidth(), image.getHeight(), compressedBytes, compressedFormat);
        Canvas.disposeImage(image);
      } catch (e) {
        throw e;
      }
    }

    return tile;
  }

  /**
   * Download the tile from the URL
   * @param url
   * @param z
   * @param x
   * @param y
   * @return tile bytes
   */
  private async downloadTile(
    url: string,
    z: number,
    x: number,
    y: number,
  ): Promise<{ contentType: string; data: Buffer | Uint8Array }> {
    return new Promise((resolve, reject) => {
      const isNode = typeof process !== 'undefined' && process.version;
      if (isNode) {
        if (url.startsWith('http://')) {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const http = require('http');
          const request = http.request(this.getRequestOptions(url), (response) => {
            this.processResponse(response, url, z, x, y).then(resolve).catch(reject);
          });
          request.on('error', (err) => {
            reject(
              'Failed to download tile. URL: ' +
                url +
                ', z=' +
                z +
                ', x=' +
                x +
                ', y=' +
                y +
                ', Error Message: ' +
                err.message,
            );
          });
          request.end();
        } else {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const https = require('https');
          const request = https.request(this.getRequestOptions(url), (response) => {
            this.processResponse(response, url, z, x, y).then(resolve).catch(reject);
          });
          request.setTimeout(5000);
          request.on('error', (err) => {
            reject(
              'Failed to download tile. URL: ' +
                url +
                ', z=' +
                z +
                ', x=' +
                x +
                ', y=' +
                y +
                ', Error Message: ' +
                err.message,
            );
          });
          request.end();
        }
      } else {
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'arraybuffer';

        if (this.httpHeader != null) {
          Object.keys(this.httpHeader).forEach((key) => {
            xhr.setRequestHeader(key, this.httpHeader[key]);
          });
        }
        xhr.open(this.httpMethod ? this.httpMethod : 'GET', url);

        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        xhr.onreadystatechange = () => {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
              const contentType = xhr.getResponseHeader('content-type') || xhr.getResponseHeader('Content-Type');
              // If successful, resolve the promise by passing back the request response
              resolve({ contentType: contentType, data: new Uint8Array(xhr.response) });
            } else {
              // If it fails, reject the promise with a error message
              reject(new Error("Image didn't load successfully; error code:" + xhr.statusText));
            }
          }
        };

        xhr.onerror = (): void => {
          // Also deal with the case when the entire request fails to begin with
          // This is probably a network error, so reject the promise with an appropriate message
          reject(new Error('There was a network error.'));
        };

        // Send the request
        xhr.send();
      }
    });
  }

  /**
   * Processes a response for node.js
   * @param response
   * @param url
   * @param z
   * @param x
   * @param y
   */
  private async processResponse(response, url, z, x, y): Promise<{ contentType: string; data: Buffer | Uint8Array }> {
    return new Promise((resolve, reject) => {
      if (response.statusCode !== 200) {
        reject(
          'Failed to download tile. URL: ' +
            url +
            ', z=' +
            z +
            ', x=' +
            x +
            ', y=' +
            y +
            ', Response Code: ' +
            response.statusCode +
            ', Response Message: ' +
            response.statusMessage,
        );
      }
      const data = [];
      response.on('data', (chunk) => {
        data.push(chunk);
      });
      response.on('end', () => {
        resolve({
          contentType: response.headers['content-type'] || response.headers['Content-Type'],
          data: Buffer.concat(data),
        });
      });
    });
  }

  /**
   * Get the HTTP request options
   */
  private getRequestOptions(url: string): any {
    const reqUrl = new URL(url);
    const options = {
      hostname: reqUrl.hostname,
      protocol: reqUrl.protocol,
      port: reqUrl.port || (reqUrl.protocol === 'https:' ? 443 : 80),
      path: reqUrl.pathname,
      method: this.httpMethod || 'GET',
      headers: {},
    };
    if (this.httpHeader != null) {
      Object.keys(this.httpHeader).forEach((key) => {
        options.headers[key] = this.httpHeader[key];
      });
    }
    return options;
  }
}
