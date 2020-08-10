import { BoundingBox, GeoPackage } from '@ngageoint/geopackage';
import { GeoSpatialUtilities } from './geoSpatialUtilities';
import Jimp from 'jimp';
import proj4 from 'proj4';
import path from 'path';
import { isNode, isBrowser } from 'browser-or-node';
export const TILE_SIZE_IN_PIXELS = 256;
export const WEB_MERCATOR_MIN_LAT_RANGE = -85.05112877980659;
export const WEB_MERCATOR_MAX_LAT_RANGE = 85.0511287798066;

/**
 *
 *
 * @export
 * @class ImageUtilities
 */
export class ImageUtilities {
  /**
   * ## Creates Image Tiles for given zoomLevels
   *
   * Determines the size of pixels and create tiles set based off zoom levels.
   *
   * @static
   * @param {Jimp} image Jimp image Object
   * @param {number[]} zoomLevels Array of zoom level that image tile will be created for.
   * @param {BoundingBox} imageBBox Images Bounding Box (Geopackage) with Lat-Lon
   * @param {GeoPackage} geopackage GeoPackage where zoom images will be inserted into
   * @param {string} imageName
   * @param {Function} [progressCallback]
   * @returns {Promise<void>}
   * @memberof ImageUtilities
   */
  public static async insertZoomImages(
    image: Jimp,
    zoomLevels: number[],
    imageBBox: BoundingBox,
    geopackage: GeoPackage,
    imageName: string,
    progressCallback?: Function,
  ): Promise<void> {
    // Calculate the resolution of the image compared to the Bounding Box
    const imageHeight = image.getHeight();
    const imageWidth = image.getWidth();
    const pixelHeightInDegrees = (imageBBox.maxLatitude - imageBBox.minLatitude) / imageHeight;
    const pixelWidthInDegrees = (imageBBox.maxLongitude - imageBBox.minLongitude) / imageWidth;

    proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs ');
    proj4.defs(
      'EPSG:3857',
      '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs',
    );
    const converter = proj4('EPSG:4326', 'EPSG:3857');
    if (progressCallback)
      progressCallback({
        status: 'Handling zooms',
      });
    // Handles getting the correct Map tiles
    await GeoSpatialUtilities.iterateAllTilesInExtentForZoomLevels(
      imageBBox,
      zoomLevels,
      async (zxy: { z: number; x: number; y: number }): Promise<boolean> => {
        const tileBBox = GeoSpatialUtilities.tileBboxCalculator(zxy.x, zxy.y, zxy.z);
        const tileWebMercatorBoundingBox = GeoSpatialUtilities.getWebMercatorBoundingBox('EPSG:4326', tileBBox);
        const tilePixelHeightInMeters =
          (tileWebMercatorBoundingBox.maxLatitude - tileWebMercatorBoundingBox.minLatitude) / TILE_SIZE_IN_PIXELS;
        const tilePixelWidthInMeters =
          (tileWebMercatorBoundingBox.maxLongitude - tileWebMercatorBoundingBox.minLongitude) / TILE_SIZE_IN_PIXELS;

        // Create clear tile with transparent pixels
        const transformedImage = new Jimp(TILE_SIZE_IN_PIXELS, TILE_SIZE_IN_PIXELS, 0x0);
        for (let x = 0, width = TILE_SIZE_IN_PIXELS; x < width; x++) {
          for (let y = 0, height = TILE_SIZE_IN_PIXELS; y < height; y++) {
            const longLat = converter.inverse([
              tileWebMercatorBoundingBox.minLongitude + x * tilePixelWidthInMeters,
              tileWebMercatorBoundingBox.maxLatitude - y * tilePixelHeightInMeters,
            ]);
            const xPixel = (longLat[0] - imageBBox.minLongitude) / pixelWidthInDegrees;
            const yPixel = imageHeight - (longLat[1] - imageBBox.minLatitude) / pixelHeightInDegrees;
            if (xPixel >= 0 && imageWidth >= xPixel && yPixel >= 0 && imageHeight >= yPixel) {
              const color = image.getPixelColor(xPixel, yPixel);
              transformedImage.setPixelColor(color, x, y);
            }
          }
        }
        geopackage.addTile(await transformedImage.getBufferAsync(Jimp.MIME_PNG), imageName, zxy.z, zxy.y, zxy.x);
        return false;
      },
    );
  }
  /**
   *
   *
   * @static
   * @param {string} uri
   * @param {string} [dir]
   * @param {Map<string, any>} [zipMap]
   * @returns {Promise<Jimp>}
   * @memberof ImageUtilities
   */
  public static async getJimpImage(uri: string, dir?: string, zipMap?: Map<string, any>): Promise<Jimp> {
    let imageLocation;
    if (isNode) {
      imageLocation = uri.startsWith('http') ? uri : path.join(dir, uri);
    } else if (isBrowser) {
      imageLocation = uri.startsWith('http') ? uri : Buffer.from(zipMap.get(uri), 'base64');
    }
    // Reads in Image (stored as bitmap)
    const img = await Jimp.read(imageLocation).catch(err => {
      console.error('Image not founding', err);
      throw err;
    });
    return img;
  }

  /**
   * Crops image if the bounding is larger than Web Mercator bounds. 
   *
   * @static
   * @param {BoundingBox} kmlBBox Geopackage Bounding Box in EPSG:4326
   * @param {Jimp} img Jimp image.
   * @returns {Promise<[BoundingBox, Jimp]>}
   * @memberof ImageUtilities
   */
  public static async truncateImage(kmlBBox: BoundingBox, img: Jimp): Promise<[BoundingBox, Jimp]> {
    if (kmlBBox.maxLatitude > WEB_MERCATOR_MAX_LAT_RANGE) {
      const latHeight = kmlBBox.maxLatitude - kmlBBox.minLatitude;
      const upperBoundHeight = WEB_MERCATOR_MAX_LAT_RANGE - kmlBBox.minLatitude;
      const ratio = upperBoundHeight / latHeight;
      const y = (1 - ratio) * img.getHeight();
      img.crop(0, y, img.getWidth(), img.getHeight() - y);
      kmlBBox.maxLatitude = WEB_MERCATOR_MAX_LAT_RANGE;
    }
    if (kmlBBox.minLatitude < WEB_MERCATOR_MIN_LAT_RANGE) {
      const latHeight = kmlBBox.maxLatitude - kmlBBox.minLatitude;
      const lowerBoundHeight = WEB_MERCATOR_MIN_LAT_RANGE - kmlBBox.minLatitude;
      const ratio = lowerBoundHeight / latHeight;
      const y = (1 - ratio) * img.getHeight();
      img.crop(0, 0, img.getWidth(), y);
      kmlBBox.minLatitude = WEB_MERCATOR_MIN_LAT_RANGE;
    }
    return [kmlBBox, img];
  }
}
