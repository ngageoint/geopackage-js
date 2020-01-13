import proj4 from 'proj4';
import {TileDao} from '../user/tileDao';
import { TileMatrix } from '../matrix/tileMatrix';
import { TileBoundingBoxUtils }  from '../tileBoundingBoxUtils'
import { BoundingBox } from '../../boundingBox'
import { TileCreator } from '../creator/tileCreator';
import {TileRow} from '../user/tileRow';

export class GeoPackageTileRetriever {
  tileDao: TileDao;
  width: number;
  height: number;
  setWebMercatorBoundingBox: any;
  setProjectionBoundingBox: any;
  constructor(tileDao: TileDao, width: number, height: number) {
    this.tileDao = tileDao;
    this.tileDao.adjustTileMatrixLengths();
    this.width = width;
    this.height = height;
  }
  getWebMercatorBoundingBox(): BoundingBox {
    if (this.setWebMercatorBoundingBox) {
      return this.setWebMercatorBoundingBox;
    }
    else {
      var tileMatrixSetDao = this.tileDao.geoPackage.getTileMatrixSetDao();
      var tileMatrixSet = this.tileDao.tileMatrixSet;
      var srs = tileMatrixSetDao.getSrs(tileMatrixSet);
      this.setProjectionBoundingBox = tileMatrixSet.getBoundingBox();
      if (srs.organization_coordsys_id === 4326 && srs.organization === 'EPSG') {
        this.setProjectionBoundingBox.minLatitude = Math.max(this.setProjectionBoundingBox.minLatitude, -85.05);
        this.setProjectionBoundingBox.maxLatitude = Math.min(this.setProjectionBoundingBox.maxLatitude, 85.05);
      }
      this.setWebMercatorBoundingBox = this.setProjectionBoundingBox.projectBoundingBox(this.tileDao.projection, 'EPSG:3857');
      return this.setWebMercatorBoundingBox;
    }
  }
  hasTile(x: number, y: number, zoom: number): boolean {
    var webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
    var tileMatrix = this.tileDao.getTileMatrixWithZoomLevel(zoom);
    var tileGrid = TileBoundingBoxUtils.getTileGridWithTotalBoundingBox(this.tileDao.tileMatrixSet.getBoundingBox(), tileMatrix.matrix_width, tileMatrix.matrix_height, webMercatorBoundingBox);
    return !!this.tileDao.countByTileGrid(tileGrid, zoom);
  }
  async getTile(x: number, y: number, zoom: number): Promise<any> {
    var webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
    var gpZoom = this.determineGeoPackageZoomLevel(webMercatorBoundingBox);
    return this.getTileWithBounds(webMercatorBoundingBox, gpZoom, 'EPSG:3857');
  }
  async drawTileIn(x: number, y: number, zoom: number, canvas?: any): Promise<any> {
    var webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
    var gpZoom = this.determineGeoPackageZoomLevel(webMercatorBoundingBox);
    return this.getTileWithBounds(webMercatorBoundingBox, gpZoom, 'EPSG:3857', canvas);
  }
  async getTileWithWgs84Bounds(wgs84BoundingBox: BoundingBox, canvas?: any): Promise<any> {
    var webMercatorBoundingBox = wgs84BoundingBox.projectBoundingBox('EPSG:4326', 'EPSG:3857');
    var gpZoom = this.determineGeoPackageZoomLevel(webMercatorBoundingBox);
    return this.getTileWithBounds(webMercatorBoundingBox, gpZoom, 'EPSG:3857', canvas);
  }
  async getTileWithWgs84BoundsInProjection(wgs84BoundingBox: BoundingBox, zoom: number, targetProjection: string, canvas?: any): Promise<any> {
    var targetBoundingBox = wgs84BoundingBox.projectBoundingBox('EPSG:4326', targetProjection);
    return this.getTileWithBounds(targetBoundingBox, zoom, targetProjection, canvas);
  }
  async getWebMercatorTile(x: number, y: number, zoom: number): Promise<any> {
    // need to determine the geoPackage zoom level from the web mercator zoom level
    var webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
    var gpZoom = this.determineGeoPackageZoomLevel(webMercatorBoundingBox);
    return this.getTileWithBounds(webMercatorBoundingBox, gpZoom, 'EPSG:3857');
  }
  determineGeoPackageZoomLevel(webMercatorBoundingBox: BoundingBox): number {
    // find width and height of this tile in geopackage projection
    var proj4Projection = proj4(this.tileDao.projection, 'EPSG:3857');
    var ne = proj4Projection.inverse([webMercatorBoundingBox.maxLongitude, webMercatorBoundingBox.maxLatitude]);
    var sw = proj4Projection.inverse([webMercatorBoundingBox.minLongitude, webMercatorBoundingBox.minLatitude]);
    var width = (ne[0] - sw[0]);
    var gpZoom = undefined;
    // find the closest zoom for width
    for (var i = 0; i < this.tileDao.widths.length; i++) {
      var tileWidth = this.tileDao.widths[i];
      var difference = Math.abs(width - tileWidth);
      var tolerance = .001 * tileWidth;
      if (tileWidth <= width || difference <= tolerance) {
        gpZoom = this.tileDao.maxZoom - i;
      }
    }
    return gpZoom;
  }
  async getTileWithBounds(targetBoundingBox: BoundingBox, zoom: number, targetProjection: string, canvas?: any): Promise<any> {
    var tiles = [];
    var tileMatrix = this.tileDao.getTileMatrixWithZoomLevel(zoom);
    if (!tileMatrix)
      return;
    var tileWidth = tileMatrix.tile_width;
    var tileHeight = tileMatrix.tile_height;
    var creator = await TileCreator.create(this.width || tileWidth, this.height || tileHeight, tileMatrix, this.tileDao.tileMatrixSet, targetBoundingBox, this.tileDao.srs, targetProjection, canvas);
    console.time('Getting results')
    var iterator = this.retrieveTileResults(targetBoundingBox.projectBoundingBox(targetProjection, this.tileDao.projection), tileMatrix);
    for (var tile of iterator) {
      await creator.addTile(tile.getTileData(), tile.getTileColumn(), tile.getRow());
    }
    if (!canvas) {
      return creator.getCompleteTile('png');
    }
  }
  retrieveTileResults(tileMatrixProjectionBoundingBox: BoundingBox, tileMatrix?: TileMatrix): IterableIterator<TileRow> {
    if (tileMatrix) {
      var tileGrid = TileBoundingBoxUtils.getTileGridWithTotalBoundingBox(this.tileDao.tileMatrixSet.getBoundingBox(), tileMatrix.matrix_width, tileMatrix.matrix_height, tileMatrixProjectionBoundingBox);
      return this.tileDao.queryByTileGrid(tileGrid, tileMatrix.zoom_level);
    }
  }
}