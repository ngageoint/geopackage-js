import { Projection, Projections } from '@ngageoint/projections-js';
import { BoundingBox } from '../boundingBox';
import { GeoPackage } from '../geoPackage';
import { TileFormatType } from '../io/tileFormatType';
import { TileGenerator } from './tileGenerator';
import { GeoPackageException } from '../geoPackageException';
import { TileBoundingBoxUtils } from './tileBoundingBoxUtils';

/**
 * Creates a set of tiles within a GeoPackage by downloading the tiles from a
 * URL
 */
export abstract class UrlTileGenerator extends TileGenerator {
  /**
   * URL Z Variable
   */
  private static readonly Z_VARIABLE = '\\{z\\}';

  /**
   * URL X Variable
   */
  private static readonly X_VARIABLE = '\\{x\\}';

  /**
   * URL Y Variable
   */
  private static readonly Y_VARIABLE = '\\{y\\}';

  /**
   * URL Min Lat Variable
   */
  private static readonly MIN_LAT_VARIABLE = '\\{minLat\\}';

  /**
   * URL Max Lat Variable
   */
  private static readonly MAX_LAT_VARIABLE = '\\{maxLat\\}';

  /**
   * URL Min Lon Variable
   */
  private static readonly MIN_LON_VARIABLE = '\\{minLon\\}';

  /**
   * URL Max Lon Variable
   */
  private static readonly MAX_LON_VARIABLE = '\\{maxLon\\}';

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
  private httpMethod: string;

  /**
   * HTTP Header fields and field values
   */
  private httpHeader: Map<string, string[]>;

  /**
   * Constructor
   * @param geoPackage GeoPackage
   * @param tableName table name
   * @param tileUrl tile URL
   * @param boundingBox tiles bounding box
   * @param projection tiles projection
   * @param zoomLevels zoom levels
   */
  public constructor(
    geoPackage: GeoPackage,
    tableName: string,
    tileUrl: string,
    boundingBox: BoundingBox,
    projection: Projection,
    zoomLevels: number[],
  ) {
    super(geoPackage, tableName, boundingBox, projection, zoomLevels);
    this.initialize(tileUrl);
  }

  /**
   * Initialize the tile URL
   * @param tileUrl
   *            tile URL
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
   * @param downloadAttempts
   *            download attempts per tile
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
   * @param httpMethod
   *            method ("GET", "POST")
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
   *
   * @param field field name
   *
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
   * Add a HTTP Header field value, appending to any existing values for the field
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
   * Add HTTP Header field values, appending to any existing values for the field
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
   * @param url
   * @return
   */
  private hasXYZ(url: string): boolean {
    const replacedUrl = this.replaceXYZ(url, 0, 0, 0);
    return replacedUrl !== url;
  }

  /**
   * Replace the bounding box coordinates in the url
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
   * @param url
   * @param boundingBox
   * @return
   */
  private replaceBoundingBox(url: string, boundingBox: BoundingBox): string {
    return url
      .replace(UrlTileGenerator.MIN_LAT_VARIABLE, boundingBox.getMinLatitude().toString())
      .replace(UrlTileGenerator.MAX_LAT_VARIABLE, boundingBox.getMaxLatitude().toString())
      .replace(UrlTileGenerator.MIN_LON_VARIABLE, boundingBox.getMinLongitude().toString())
      .replace(UrlTileGenerator.MAX_LON_VARIABLE, boundingBox.getMaxLongitude().toString());
  }

  /**
   * {@inheritDoc}
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected preTileGeneration(): void {}

  /**
   * {@inheritDoc}
   */
  protected createTile(z: number, x: number, y: number): Uint8Array {
    let buffer: Uint8Array = null;
    let zoomUrl = this.tileUrl;
    // Replace x, y, and z
    if (this.urlHasXYZ) {
      let yRequest = y;
      // If TMS, flip the y value
      if (this.tileFormat == TileFormatType.TMS) {
        yRequest = TileBoundingBoxUtils.getYAsOppositeTileFormat(z, Math.round(y));
      }
      zoomUrl = this.replaceXYZ(zoomUrl, z, x, yRequest);
    }

    // Replace bounding box
    if (this.urlHasBoundingBox) {
      zoomUrl = this.replaceBoundingBoxWithXYZ(zoomUrl, z, x, y);
    }

    let attempt = 1;
    while (true) {
      try {
        buffer = this.downloadTile(zoomUrl, z, x, y);
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

    return buffer;
  }

  /**
   * Download the tile from the URL
   * @param zoomUrl
   * @param url
   * @param z
   * @param x
   * @param y
   * @return tile bytes
   */
  private downloadTile(zoomUrl: string, z: number, x: number, y: number): Uint8Array {
    // let bytes = null;
    // let connection = null;
    // try {
    // 	connection = (HttpURLConnection) url.openConnection();
    // 	configureRequest(connection);
    // 	connection.connect();
    //
    // 	int responseCode = connection.getResponseCode();
    // 	if (responseCode == HttpURLConnection.HTTP_MOVED_PERM
    // 			|| responseCode == HttpURLConnection.HTTP_MOVED_TEMP
    // 			|| responseCode == HttpURLConnection.HTTP_SEE_OTHER) {
    // 		String redirect = connection.getHeaderField("Location");
    // 		connection.disconnect();
    // 		url = new URL(redirect);
    // 		connection = (HttpURLConnection) url.openConnection();
    // 		configureRequest(connection);
    // 		connection.connect();
    // 	}
    //
    // 	if (connection.getResponseCode() != HttpURLConnection.HTTP_OK) {
    // 		throw new GeoPackageException("Failed to download tile. URL: "
    // 				+ zoomUrl + ", z=" + z + ", x=" + x + ", y=" + y
    // 				+ ", Response Code: " + connection.getResponseCode()
    // 				+ ", Response Message: "
    // 				+ connection.getResponseMessage());
    // 	}
    //
    // 	InputStream geoPackageStream = connection.getInputStream();
    // 	bytes = GeoPackageIOUtils.streamBytes(geoPackageStream);
    //
    // } catch (e) {
    // 	throw new GeoPackageException("Failed to download tile. URL: " + zoomUrl + ", z=" + z + ", x=" + x + ", y=" + y);
    // } finally {
    // 	if (connection != null) {
    // 		connection.disconnect();
    // 	}
    // }
    //
    // return bytes;
    return null;
  }

  /**
   * Configure the connection HTTP method and header
   * @param connection
   *            HTTP URL connection
   * @throws ProtocolException
   *             upon configuration failure
   */
  private configureRequest(connection: any): void {
    // if (httpMethod != null) {
    // 	connection.setRequestMethod(httpMethod);
    // }
    //
    // if (httpHeader != null) {
    // 	for (Entry<String, List<String>> fieldEntry : httpHeader
    // 			.entrySet()) {
    // 		String field = fieldEntry.getKey();
    // 		List<String> values = fieldEntry.getValue();
    // 		if (values != null) {
    // 			for (String value : values) {
    // 				connection.addRequestProperty(field, value);
    // 			}
    // 		}
    // 	}
    // }
  }
}
