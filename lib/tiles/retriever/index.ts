import proj4 from 'proj4';
import { TileDao } from '../user/tileDao';
import { TileMatrix } from '../matrix/tileMatrix';
import { TileBoundingBoxUtils } from '../tileBoundingBoxUtils';
import { BoundingBox } from '../../boundingBox';
import { TileCreator } from '../creator/tileCreator';
import { TileRow } from '../user/tileRow';

export class GeoPackageTileRetriever {
  tileDao: TileDao;
  width: number;
  height: number;
  setWebMercatorBoundingBox: BoundingBox;
  setProjectionBoundingBox: BoundingBox;
  constructor(tileDao: TileDao, width: number, height: number) {
    this.tileDao = tileDao;
    this.tileDao.adjustTileMatrixLengths();
    this.width = width;
    this.height = height;
  }
  getWebMercatorBoundingBox(): BoundingBox {
    if (this.setWebMercatorBoundingBox) {
      return this.setWebMercatorBoundingBox;
    } else {
      const tileMatrixSetDao = this.tileDao.geoPackage.tileMatrixSetDao;
      const tileMatrixSet = this.tileDao.tileMatrixSet;
      const srs = tileMatrixSetDao.getSrs(tileMatrixSet);
      this.setProjectionBoundingBox = tileMatrixSet.boundingBox;
      if (srs.organization_coordsys_id === 4326 && srs.organization === 'EPSG') {
        this.setProjectionBoundingBox.minLatitude = Math.max(this.setProjectionBoundingBox.minLatitude, -85.05);
        this.setProjectionBoundingBox.maxLatitude = Math.min(this.setProjectionBoundingBox.maxLatitude, 85.05);
      }
      this.setWebMercatorBoundingBox = this.setProjectionBoundingBox.projectBoundingBox(
        this.tileDao.projection,
        'EPSG:3857',
      );
      return this.setWebMercatorBoundingBox;
    }
  }
  hasTile(x: number, y: number, zoom: number): boolean {
    const webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
    const tileMatrix = this.tileDao.getTileMatrixWithZoomLevel(zoom);
    const tileGrid = TileBoundingBoxUtils.getTileGridWithTotalBoundingBox(
      this.tileDao.tileMatrixSet.boundingBox,
      tileMatrix.matrix_width,
      tileMatrix.matrix_height,
      webMercatorBoundingBox,
    );
    return !!this.tileDao.countByTileGrid(tileGrid, zoom);
  }
  async getTile(x: number, y: number, zoom: number): Promise<any> {
    const webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
    const gpZoom = this.determineGeoPackageZoomLevel(webMercatorBoundingBox);
    return this.getTileWithBounds(webMercatorBoundingBox, gpZoom, 'EPSG:3857');
  }
  async drawTileIn(x: number, y: number, zoom: number, canvas?: any): Promise<any> {
    const webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
    const gpZoom = this.determineGeoPackageZoomLevel(webMercatorBoundingBox);
    return this.getTileWithBounds(webMercatorBoundingBox, gpZoom, 'EPSG:3857', canvas);
  }
  async getTileWithWgs84Bounds(wgs84BoundingBox: BoundingBox, canvas?: any): Promise<any> {
    const webMercatorBoundingBox = wgs84BoundingBox.projectBoundingBox('EPSG:4326', 'EPSG:3857');
    const gpZoom = this.determineGeoPackageZoomLevel(webMercatorBoundingBox);
    return this.getTileWithBounds(webMercatorBoundingBox, gpZoom, 'EPSG:3857', canvas);
  }
  async getTileWithWgs84BoundsInProjection(
    wgs84BoundingBox: BoundingBox,
    zoom: number,
    targetProjection: string,
    canvas?: any,
  ): Promise<any> {
    const targetBoundingBox = wgs84BoundingBox.projectBoundingBox('EPSG:4326', targetProjection);
    return this.getTileWithBounds(targetBoundingBox, zoom, targetProjection, canvas);
  }
  async getWebMercatorTile(x: number, y: number, zoom: number): Promise<any> {
    // need to determine the geoPackage zoom level from the web mercator zoom level
    const webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
    const gpZoom = this.determineGeoPackageZoomLevel(webMercatorBoundingBox);
    return this.getTileWithBounds(webMercatorBoundingBox, gpZoom, 'EPSG:3857');
  }
  determineGeoPackageZoomLevel(webMercatorBoundingBox: BoundingBox): number {
    // find width and height of this tile in geopackage projection
    const proj4Projection = proj4(this.tileDao.projection, 'EPSG:3857');
    const ne = proj4Projection.inverse([webMercatorBoundingBox.maxLongitude, webMercatorBoundingBox.maxLatitude]);
    const sw = proj4Projection.inverse([webMercatorBoundingBox.minLongitude, webMercatorBoundingBox.minLatitude]);
    const width = ne[0] - sw[0];
    let gpZoom = undefined;
    // find the closest zoom for width
    for (let i = 0; i < this.tileDao.widths.length; i++) {
      const tileWidth = this.tileDao.widths[i];
      const difference = Math.abs(width - tileWidth);
      const tolerance = 0.001 * tileWidth;
      if (tileWidth <= width || difference <= tolerance) {
        gpZoom = this.tileDao.maxZoom - i;
      }
    }
    return gpZoom;
  }
  async getTileWithBounds(
    targetBoundingBox: BoundingBox,
    zoom: number,
    targetProjection: string,
    canvas?: any,
  ): Promise<any> {
    const tiles = [];
    const tileMatrix = this.tileDao.getTileMatrixWithZoomLevel(zoom);
    if (!tileMatrix) return;
    const tileWidth = tileMatrix.tile_width;
    const tileHeight = tileMatrix.tile_height;
    const creator = await TileCreator.create(
      this.width || tileWidth,
      this.height || tileHeight,
      tileMatrix,
      this.tileDao.tileMatrixSet,
      targetBoundingBox,
      this.tileDao.srs,
      targetProjection,
      canvas,
    );
    const iterator = this.retrieveTileResults(
      targetBoundingBox.projectBoundingBox(targetProjection, this.tileDao.projection),
      tileMatrix,
    );
    for (const tile of iterator) {
      await creator.addTile(tile.tileData, tile.tileColumn, tile.row);
    }
    if (!canvas) {
      return creator.getCompleteTile('png');
    }
  }
  retrieveTileResults(
    tileMatrixProjectionBoundingBox: BoundingBox,
    tileMatrix?: TileMatrix,
  ): IterableIterator<TileRow> {
    if (tileMatrix) {
      const tileGrid = TileBoundingBoxUtils.getTileGridWithTotalBoundingBox(
        this.tileDao.tileMatrixSet.boundingBox,
        tileMatrix.matrix_width,
        tileMatrix.matrix_height,
        tileMatrixProjectionBoundingBox,
      );
      return this.tileDao.queryByTileGrid(tileGrid, tileMatrix.zoom_level);
    }
  }
}
