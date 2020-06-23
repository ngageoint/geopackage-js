import { BoundingBox, GeoPackage, proj4Defs } from '@ngageoint/geopackage';
import { Image, createCanvas, loadImage } from 'canvas';
import { GeoSpatialUtilities } from './geoSpatialUtilities';
import path from 'path';
import Jimp from 'jimp';
import proj4 from 'proj4';
export const TILE_SIZE_IN_PIXELS = 256;
export const WEB_MERCATOR_MIN_LAT_RANGE = -85.05112877980659;
export const WEB_MERCATOR_MAX_LAT_RANGE = 85.0511287798066;

export class ImageUtilities {
  /**
   * Takes in an image and breaks it up into 256x256 tile with appropriate scaling based on the give zoomLevels.
   * @param image node-canvas image object
   * @param zoomLevels Array of zoom level that image tile will be created for
   * @param bbox Image Bounding Box with Lat-Lon
   * @returns Object of buffer Images, were the key is zoomLevelNumber,x,y
   */
  public static async getZoomImages(
    image: Jimp,
    zoomLevels: number[],
    imageBBox: BoundingBox,
    geopackage: GeoPackage,
    imageName: string,
  ): Promise<void> {
    // // Set up Canvas to handle the drawing of images.
    // const canvas = createCanvas(TILE_SIZE_IN_PIXELS, TILE_SIZE_IN_PIXELS);
    // const context = canvas.getContext('2d');

    // Calculate the resolution of the image compared to the Bounding Box
    const imageHeight = image.getHeight();
    const imageWidth = image.getWidth();
    const pixelHeightInDegrees = (imageBBox.maxLatitude - imageBBox.minLatitude) / imageHeight;
    const pixelWidthInDegrees = (imageBBox.maxLongitude - imageBBox.minLongitude) / imageWidth;

    // const webMercatorBoundingBox = GeoSpatialUtilities.getWebMercatorBoundingBox('EPSG:4326', imageBBox);
    // const pixelHeightInMeters =
    //   (webMercatorBoundingBox.maxLatitude - webMercatorBoundingBox.minLatitude) / imageHeight;
    // const pixelWidthInMeters =
    //   (webMercatorBoundingBox.maxLongitude - webMercatorBoundingBox.minLongitude) / imageWidth;
    // const fullImage = await loadImage(await image.getBufferAsync(Jimp.MIME_PNG));
    proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs ');
    proj4.defs(
      'EPSG:3857',
      '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs',
    );
    const converter = proj4('EPSG:4326', 'EPSG:3857');
    // Handles getting the correct Map tiles
    // console.time('zoomlevels');
    await GeoSpatialUtilities.iterateAllTilesInExtentForZoomLevels(
      imageBBox,
      zoomLevels,
      async (zxy: { z: any; x: number; y: number }): Promise<boolean> => {
        const tileBox = GeoSpatialUtilities.tileBboxCalculator(zxy.x, zxy.y, zxy.z);
        const tileBBox = new BoundingBox(tileBox.west, tileBox.east, tileBox.south, tileBox.north);
        const tileWebMercatorBoundingBox = GeoSpatialUtilities.getWebMercatorBoundingBox('EPSG:4326', tileBBox);
        const tilePixelHeightInMeters =
          (tileWebMercatorBoundingBox.maxLatitude - tileWebMercatorBoundingBox.minLatitude) / TILE_SIZE_IN_PIXELS;
        const tilePixelWidthInMeters =
          (tileWebMercatorBoundingBox.maxLongitude - tileWebMercatorBoundingBox.minLongitude) / TILE_SIZE_IN_PIXELS;
        // console.log(tileWebMercatorBoundingBox);
        const transFormedImage = new Jimp(TILE_SIZE_IN_PIXELS, TILE_SIZE_IN_PIXELS, 0x0);
        for (let x = 0, width = TILE_SIZE_IN_PIXELS; x < width; x++) {
          for (let y = 0, height = TILE_SIZE_IN_PIXELS; y < height; y++) {
            const longLat = converter.inverse([
              tileWebMercatorBoundingBox.minLongitude + x * tilePixelWidthInMeters,
              tileWebMercatorBoundingBox.maxLatitude - y * tilePixelHeightInMeters,
            ]);
            // console.log(longLat, (longLat[0] - imageBBox.minLongitude))
            const xPixel = (longLat[0] - imageBBox.minLongitude) / pixelWidthInDegrees;
            const yPixel = imageHeight - (longLat[1] - imageBBox.minLatitude) / pixelHeightInDegrees;
            if (xPixel >= 0 && imageWidth >= xPixel && yPixel >= 0 && imageHeight >= yPixel) {
              const color = image.getPixelColor(xPixel, yPixel);
              transFormedImage.setPixelColor(color, x, y);
            }
          }
        }
        geopackage.addTile(await transFormedImage.getBufferAsync(Jimp.MIME_PNG), imageName, zxy.z, zxy.y, zxy.x);
        return false;
      },
    );
    // console.timeEnd('zoomlevels');
  }
  public static async truncateImage(kmlBBox: BoundingBox, img: Jimp): Promise<[BoundingBox, Jimp]> {
    if (kmlBBox.maxLatitude > WEB_MERCATOR_MAX_LAT_RANGE) {
      const latHeight = kmlBBox.maxLatitude - kmlBBox.minLatitude;
      const upperBoundHeight = WEB_MERCATOR_MAX_LAT_RANGE - kmlBBox.minLatitude;
      const ratio = upperBoundHeight / latHeight;
      const y = (1 - ratio) * img.getHeight();
      // console.log(img.getHeight() - y, y, ratio, upperBoundHeight, latHeight);
      img.crop(0, y, img.getWidth(), img.getHeight() - y);
      kmlBBox.maxLatitude = WEB_MERCATOR_MAX_LAT_RANGE;
    }
    if (kmlBBox.minLatitude < WEB_MERCATOR_MIN_LAT_RANGE) {
      const latHeight = kmlBBox.maxLatitude - kmlBBox.minLatitude;
      const lowerBoundHeight = WEB_MERCATOR_MIN_LAT_RANGE - kmlBBox.minLatitude;
      const ratio = lowerBoundHeight / latHeight;
      const y = (1 - ratio) * img.getHeight();
      // console.log(img.getHeight() - y, y, ratio, lowerBoundHeight, latHeight);
      img.crop(0, 0, img.getWidth(), y);
      kmlBBox.minLatitude = WEB_MERCATOR_MIN_LAT_RANGE;
    }
    return [kmlBBox, img];
  }
}
