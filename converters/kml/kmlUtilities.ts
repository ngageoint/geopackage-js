import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { BoundingBox } from '@ngageoint/geopackage';
import { Image, createCanvas } from 'canvas';
import * as turf from '@turf/turf';
import * as KMLTAGS from './KMLTags.js';
export const TILE_SIZE_IN_PIXELS = 256;

export class KMLUtilities {
  // Taken from Map Cache Electron
  static tile2lon(x: number, z: number): number {
    return (x / Math.pow(2, z)) * 360 - 180;
  }
  // Taken from Map Cache Electron
  static tile2lat(y: number, z: number): number {
    const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  }
  // Taken from Map Cache Electron
  static long2tile(lon: number, zoom: number): number {
    return Math.min(Math.pow(2, zoom) - 1, Math.floor(((lon + 180) / 360) * Math.pow(2, zoom)));
  }
  // Taken from Map Cache Electron
  static lat2tile(lat: number, zoom: number): number {
    return Math.floor(
      ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
        Math.pow(2, zoom),
    );
  }
  // Taken from Map Cache Electron
  static calculateXTileRange(bbox: BoundingBox, z: any): { min: number; max: number } {
    const west = KMLUtilities.long2tile(bbox.maxLongitude, z);
    const east = KMLUtilities.long2tile(bbox.minLongitude, z);
    // console.log('east', east, typeof bbox.maxLongitude, z, west);
    return {
      min: Math.max(0, Math.min(west, east)),
      max: Math.max(0, Math.max(west, east)),
    };
  }
  // Taken from Map Cache Electron
  static calculateYTileRange(bbox: BoundingBox, z: any): { min: number; max: number; current: number } {
    const south = KMLUtilities.lat2tile(bbox.minLatitude, z);
    const north = KMLUtilities.lat2tile(bbox.maxLatitude, z);
    // console.log(south, north);
    return {
      min: Math.max(0, Math.min(south, north)),
      max: Math.max(0, Math.max(south, north)),
      current: Math.max(0, Math.min(south, north)),
    };
  }

  // Taken from Map Cache Electron
  /**
   * Calls function for each tile needed.
   * @param extent Bounding Box
   * @param zoomLevels Array of Zoom Levels
   * @param tileCallback Function that will be called for every tile
   */
  static async iterateAllTilesInExtentForZoomLevels(
    extent: BoundingBox,
    zoomLevels: number[],
    tileCallback: (arg0: { z: any; x: number; y: number }) => Promise<boolean>,
  ): Promise<void> {
    let stop = false;
    for (let i = 0; i < zoomLevels.length && !stop; i++) {
      const z = zoomLevels[i];
      const yRange = KMLUtilities.calculateYTileRange(extent, z);
      const xRange = KMLUtilities.calculateXTileRange(extent, z);
      for (let x = xRange.min; x <= xRange.max && !stop; x++) {
        for (let y = yRange.min; y <= yRange.max && !stop; y++) {
          stop = await tileCallback({ z, x, y });
        }
      }
    }
  }

  // Taken From Map Cache Electron
  static tileBboxCalculator(
    x: number,
    y: number,
    z: number,
  ): { north: number; east: number; south: number; west: number } {
    const tileBounds = {
      north: KMLUtilities.tile2lat(y, z),
      east: KMLUtilities.tile2lon(x + 1, z),
      south: KMLUtilities.tile2lat(y + 1, z),
      west: KMLUtilities.tile2lon(x, z),
    };

    return tileBounds;
  }

  /**
   * Uses turf to rotate a bounding box.
   * @param bbox GeoPackage Bounding Box
   * @param rotation Rotation in degrees North clockwise negative
   * @returns GeoPackage Bounding Box Rotated by given number of degrees
   */
  public static getKmlBBoxRotation(bbox: BoundingBox, rotation: number): BoundingBox {
    // Convert to geoJson polygon format which turf can read.
    // turf rotates and returns a geoJson polygon
    const rotatedPoly = turf.transformRotate(bbox.toGeoJSON().geometry, rotation);
    // Coverts the geoJson polygon to a geoJson bbox
    const rotatedBBox = turf.bbox(rotatedPoly);
    // Converts geoJson bbox into a Geopackage js bounding box.
    const rotMinLongitude = rotatedBBox[0];
    const rotMinLatitude = rotatedBBox[1];
    const rotMaxLongitude = rotatedBBox[2];
    const rotMaxLatitude = rotatedBBox[3];

    return new BoundingBox(rotMinLongitude, rotMaxLongitude, rotMinLatitude, rotMaxLatitude);
  }

  /**
   * Takes in an image and breaks it up into 256x256 tile with appropriate scaling based on the give zoomLevels.
   * @param image node-canvas image object
   * @param zoomLevels Array of zoom level that image tile will be created for
   * @param bbox Image Bounding Box with Lat-Lon
   * @returns Object of buffer Images, were the key is zoomLevelNumber,x,y
   */
  public static async getZoomImages(image: Image, zoomLevels: number[], imageBbox: BoundingBox): Promise<{}> {
    // Set up Canvas to handle the drawing of images.
    const canvas = createCanvas(TILE_SIZE_IN_PIXELS, TILE_SIZE_IN_PIXELS);
    const context = canvas.getContext('2d');

    // Calculate the resolution of the image compared to the Bounding Box
    const pixelsPerLat = (imageBbox.maxLatitude - imageBbox.minLatitude) / image.height;
    const pixelsPerLon = (imageBbox.maxLongitude - imageBbox.minLongitude) / image.width;

    // Create object where resultant image buffer will be stored
    const bufferedImages = {};

    // Handles getting the correct Map tiles
    await KMLUtilities.iterateAllTilesInExtentForZoomLevels(
      imageBbox,
      zoomLevels,
      async (zxy: { z: any; x: number; y: number }): Promise<boolean> => {
        // Clears Canvas
        context.clearRect(0, 0, TILE_SIZE_IN_PIXELS, TILE_SIZE_IN_PIXELS);

        // Gets the Lat - Lon Bounding box for the Map Tile
        const tileBox = this.tileBboxCalculator(zxy.x, zxy.y, zxy.z);

        /*
         * Code below Calculates the section of the image that corresponds to the current Map Tile
         */
        // Calculates distance between the topLeft corner of the image to the topLeft corner of the Map Tile
        const leftSideImageToLeftSideTile = imageBbox.minLongitude - tileBox.west;
        const topSideImageToTopSideTile = imageBbox.maxLatitude - tileBox.north;

        // Calculates where to start the selection (in the Top Left).
        const distanceLeftPixels = Math.max(0, -leftSideImageToLeftSideTile / pixelsPerLon);
        const distanceDownPixels = Math.max(0, topSideImageToTopSideTile / pixelsPerLat);

        // Calculates the intersection of the Image and the Map Tile
        const horizontalIntersect =
          Math.min(imageBbox.maxLongitude, tileBox.east) - Math.max(imageBbox.minLongitude, tileBox.west);
        const verticalIntersect =
          Math.min(imageBbox.maxLatitude, tileBox.north) - Math.max(imageBbox.minLatitude, tileBox.south);

        // Convert overlap in pixel values
        const horizontalImageIntersectPixels = horizontalIntersect / pixelsPerLon;
        const verticalImageIntersectPixels = verticalIntersect / pixelsPerLat;
        // console.log(distanceLeftPixels, distanceDownPixels, horizontalImageIntersectPixels, verticalImageIntersectPixels);

        /*
         * Code below Calculates the size of the section above is on the Canvas. Proportion on Canvas
         */

        // Calculate where the section of the image should start being drawn.
        const startLeftCanvasPos = Math.max(
          0,
          (TILE_SIZE_IN_PIXELS * (imageBbox.minLongitude - tileBox.west)) / (tileBox.east - tileBox.west),
        );
        const startTopCanvasPos = Math.max(
          0,
          (TILE_SIZE_IN_PIXELS * -(imageBbox.maxLatitude - tileBox.north)) / (tileBox.north - tileBox.south),
        );

        // Calculates the how big the image will be on the canvas
        const horizontalCanvasDistance = TILE_SIZE_IN_PIXELS * (horizontalIntersect / (tileBox.east - tileBox.west));
        const verticalCanvasDistance = TILE_SIZE_IN_PIXELS * (verticalIntersect / (tileBox.north - tileBox.south));
        // console.log('Project Pos', zxy.z, horizontalCanvasDistance, verticalCanvasDistance, startLeftCanvasPos, startTopCanvasPos);

        context.drawImage(
          image,
          // area of Image
          distanceLeftPixels,
          distanceDownPixels,
          horizontalImageIntersectPixels,
          verticalImageIntersectPixels,
          // area on Canvas
          startLeftCanvasPos,
          startTopCanvasPos,
          horizontalCanvasDistance,
          verticalCanvasDistance,
        );
        const bufferedImage = canvas.toBuffer('image/png');
        // const urlImage = canvas.toDataURL('image/png');
        // console.error(urlImage, '\n');
        const name = '' + zxy.z + ',' + zxy.x + ',' + zxy.y;
        bufferedImages[name] = bufferedImage;
        return false;
      },
    );
    return bufferedImages;
  }

  /**
   * Returns floored scale.
   *  360 / 2^x = y°
   * @param bbox ç
   */
  public static getNaturalScale(bbox: BoundingBox, imageDim: Image): number {
    const widthHeight = this.getWidthAndHeightFromBBox(bbox);
    const tileWidthInDegrees = (256 * widthHeight.width) / imageDim.width;
    // console.log(widthHeight.width, tileWidthInDegrees);
    return Math.floor(Math.log2(360 / tileWidthInDegrees));
  }

  /**
   * Creates a list of zoom level where the number of filled tiles changes.
   * @param bbox Bounding box after rotation
   * @param naturalScale Zoom level closest to one to one in terms of pixels
   * @returns A list of zoom levels
   */
  public static getZoomLevels(bbox: BoundingBox, naturalScale: number): number[] {
    const levels = [];
    let z = naturalScale;
    let ySize: number;
    let xSize: number;
    do {
      const yRange = KMLUtilities.calculateYTileRange(bbox, z);
      const xRange = KMLUtilities.calculateXTileRange(bbox, z);
      ySize = yRange.max - yRange.min + 1;
      xSize = xRange.max - xRange.min + 1;
      levels.push(z);
      // console.log('getZoomLevels', yRange.max, yRange.min, xRange.max, xRange.min, xSize, ySize, z, levels);
      z -= 2;
    } while (xSize * ySize !== 1 && z >= 2);
    return levels;
  }

  /**
   * Get height and width of a bounding box
   * @param bbox geopackage bounding box.
   */
  public static getWidthAndHeightFromBBox(bbox: BoundingBox): { width: number; height: number } {
    return {
      height: Math.abs(bbox.maxLatitude - bbox.minLatitude),
      width: Math.abs(bbox.maxLongitude - bbox.minLongitude),
    };
  }

  /**
   * Queries for image or load it from disk
   * @param href KML href tag in an icon tag
   */
  public static getImageDataUrlFromKMLHref(href: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (href.startsWith('https')) {
        https.get(href, response => {
          if (response.statusCode === 200) {
            let imgBuf = Buffer.alloc(0);
            response.on('data', chunk => {
              imgBuf = Buffer.concat([imgBuf, chunk]);
            });
            response.on('end', () => {
              const data = imgBuf.toString('base64');
              const dataUrl = 'data:image/' + path.extname(href).substring(1) + ';base64,' + data;
              resolve(dataUrl);
            });
          } else {
            console.error('Status Code ', response);
            reject('Status Code ' + response.statusCode + ': ' + response.statusMessage);
          }
        });
      } else if (href.startsWith('http')) {
        http.get(href, response => {
          if (response.statusCode === 200) {
            let imgBuf = Buffer.alloc(0);
            response.on('data', chunk => {
              imgBuf = Buffer.concat([imgBuf, chunk]);
            });
            response.on('end', () => {
              const data = imgBuf.toString('base64');
              const dataUrl = 'data:image/' + path.extname(href).substring(1) + ';base64,' + data;
              resolve(dataUrl);
            });
          } else {
            console.error('Status Code ', response);
            reject('Status Code ' + response.statusCode + ': ' + response.statusMessage);
          }
        });
      } else {
        const fileName = __dirname + '/' + href;
        // console.log(fileName);
        const data = fs.readFileSync(fileName).toString('base64');
        const dataUrl = 'data:image/' + path.extname(href).substring(1) + ';base64,' + data;
        resolve(dataUrl);
      }
    });
  }
  /**
   * Converts the KML Color format into rgb 000000 - FFFFFF and opacity 0.0 - 1.0
   * @param abgr KML Color format AABBGGRR alpha (00-FF) blue (00-FF) green (00-FF) red (00-FF)
   */
  public static abgrStringToColorOpacity(abgr: string): { rgb: string; a: number } {
    const rgb = abgr.slice(6, 8) + abgr.slice(4, 6) + abgr.slice(2, 4);
    const a = parseInt('0x' + abgr.slice(0, 2)) / 255;
    return { rgb, a };
  }
  /**
   * Takes in a KML Point and returns a GeoJSON formatted object.
   * @param node The data from xmlStream with the selector of Placemark.
   */
  public static kmlPointToGeoJson(node: { Point }): { type: string; coordinates: number[] } {
    let geometryData;
    if (node[KMLTAGS.GEOMETRY_TAGS.POINT].length === 1) {
      geometryData = { type: 'Point', coordinates: [] };
    } else {
      geometryData = { type: 'MultiPoint', coordinates: [] };
    }
    node[KMLTAGS.GEOMETRY_TAGS.POINT].forEach(point => {
      const coordPoint = point.coordinates.split(',');
      const coord = [parseFloat(coordPoint[0]), parseFloat(coordPoint[1])];
      if (node.Point.length === 1) {
        geometryData['coordinates'] = [parseFloat(coordPoint[0]), parseFloat(coordPoint[1])];
      } else {
        geometryData['coordinates'].push(coord);
      }
    });
    return geometryData;
  }
  /**
   * Takes in a KML LineString and returns a GeoJSON formatted object.
   * @param node The data from xmlStream with the selector of Placemark.
   */
  public static kmlLineStringToGeoJson(node: { LineString }): { type: string; coordinates: number[] } {
    let geometryData;
    if (node[KMLTAGS.GEOMETRY_TAGS.LINESTRING].length === 1) {
      geometryData = { type: 'LineString', coordinates: [] };
    } else {
      geometryData = { type: 'MultiLineString', coordinates: [] };
    }
    node[KMLTAGS.GEOMETRY_TAGS.LINESTRING].forEach(element => {
      const coordPoints = element.coordinates.split(' ');
      const coordArray = [];
      coordPoints.forEach(element => {
        element = element.split(',');
        coordArray.push([Number(element[0]), Number(element[1])]);
      });
      if (node[KMLTAGS.GEOMETRY_TAGS.LINESTRING].length === 1) {
        geometryData['coordinates'] = coordArray;
      } else {
        geometryData['coordinates'].push(coordArray);
      }
    });
    return geometryData;
  }
  /**
   * Takes in a KML Polygon and returns a GeoJSON formatted object.
   * @param node The data from xmlStream with the selector of Placemark.
   */
  public static kmlPolygonToGeoJson(node: { Polygon }): { type: string; coordinates: number[] } {
    let geometryData;
    if ([KMLTAGS.GEOMETRY_TAGS.POLYGON].length === 1) {
      geometryData = { type: 'Polygon', coordinates: [] };
    } else {
      geometryData = { type: 'MultiPolygon', coordinates: [] };
    }
    node[KMLTAGS.GEOMETRY_TAGS.POLYGON].forEach(element => {
      const coordText = element.outerBoundaryIs.LinearRing[0].coordinates;
      const coordRing = coordText.split(' ');
      const coordArray = [];
      coordRing.forEach(element => {
        element = element.split(',');
        coordArray.push([parseFloat(element[0]), parseFloat(element[1])]);
      });

      const temp = [coordArray];
      if (node[KMLTAGS.GEOMETRY_TAGS.POLYGON].hasOwnProperty('innerBoundaryIs')) {
        const coordText = element.innerBoundaryIs.LinearRing[0].coordinates;
        const coordRing = coordText.split(' ');
        const coordArray = [];
        coordRing.forEach(elementRing => {
          elementRing = elementRing.split(',');
          coordArray.push([parseFloat(elementRing[0]), parseFloat(elementRing[1])]);
        });
        temp.push(coordArray);
      }

      if (node[KMLTAGS.GEOMETRY_TAGS.POLYGON].length === 1) {
        geometryData['coordinates'] = temp;
      } else {
        geometryData['coordinates'].push(temp);
      }
    });
    return geometryData;
  }
}
