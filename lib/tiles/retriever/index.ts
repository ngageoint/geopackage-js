import proj4 from 'proj4';
import { TileDao } from '../user/tileDao';
import { TileMatrix } from '../matrix/tileMatrix';
import { TileBoundingBoxUtils } from '../tileBoundingBoxUtils';
import { BoundingBox } from '../../boundingBox';
import { TileCreator } from '../creator/tileCreator';
import { TileRow } from '../user/tileRow';
import { TileScaling } from '../../extension/scale/tileScaling';
import { TileScalingType } from '../../extension/scale/tileScalingType';

export class GeoPackageTileRetriever {
  tileDao: TileDao;
  width: number;
  height: number;
  setWebMercatorBoundingBox: BoundingBox;
  setProjectionBoundingBox: BoundingBox;
  scaling: TileScaling;
  constructor(tileDao: TileDao, width: number, height: number) {
    this.tileDao = tileDao;
    this.tileDao.adjustTileMatrixLengths();
    this.width = width;
    this.height = height;
    this.scaling = null;
  }
  setScaling(scaling: TileScaling): void {
    this.scaling = scaling;
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
      this.setWebMercatorBoundingBox = this.setProjectionBoundingBox.projectBoundingBox(this.tileDao.projection, 'EPSG:3857');
      return this.setWebMercatorBoundingBox;
    }
  }

  /**
   * Determine the web mercator bounding box from xyz and see if there is a tile for the bounding box.
   * @param x
   * @param y
   * @param zoom
   */
  hasTile(x: number, y: number, zoom: number): boolean {
    let hasTile = false;
    if (x >= 0 && y >= 0 && zoom >= 0) {
      const tilesBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
      hasTile = this.hasTileForBoundingBox(tilesBoundingBox);
    }
    return hasTile;
  }

  hasTileForBoundingBox(tilesBoundingBox: BoundingBox): boolean {
    const tileMatrices = this.getTileMatrices(tilesBoundingBox);
    let hasTile = false;
    for (let i = 0; !hasTile && i < tileMatrices.length; i++) {
      const tileMatrix = tileMatrices[i];
      const tileGrid = TileBoundingBoxUtils.getTileGridWithTotalBoundingBox(
        this.tileDao.tileMatrixSet.boundingBox,
        tileMatrix.matrix_width,
        tileMatrix.matrix_height,
        tilesBoundingBox,
      );
      hasTile = !!this.tileDao.countByTileGrid(tileGrid, tileMatrix.zoom_level);
    }
    return hasTile;
  }

  async getTile(x: number, y: number, zoom: number): Promise<any> {
    const webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
    return this.getTileWithBounds(webMercatorBoundingBox, 'EPSG:3857');
  }

  async getWebMercatorTile(x: number, y: number, zoom: number): Promise<any> {
    // need to determine the geoPackage zoom level from the web mercator zoom level
    const webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
    return this.getTileWithBounds(webMercatorBoundingBox, 'EPSG:3857');
  }

  async drawTileIn(x: number, y: number, zoom: number, canvas?: any): Promise<any> {
    const webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxFromXYZ(x, y, zoom);
    return this.getTileWithBounds(webMercatorBoundingBox, 'EPSG:3857', canvas);
  }

  async getTileWithWgs84Bounds(wgs84BoundingBox: BoundingBox, canvas?: any): Promise<any> {
    const webMercatorBoundingBox = wgs84BoundingBox.projectBoundingBox('EPSG:4326', 'EPSG:3857');
    return this.getTileWithBounds(webMercatorBoundingBox, 'EPSG:3857', canvas);
  }

  async getTileWithWgs84BoundsInProjection(
    wgs84BoundingBox: BoundingBox,
    zoom: number,
    targetProjection: string,
    canvas?: any,
  ): Promise<any> {
    const targetBoundingBox = wgs84BoundingBox.projectBoundingBox('EPSG:4326', targetProjection);
    return this.getTileWithBounds(targetBoundingBox, targetProjection, canvas);
  }

  async getTileWithBounds(
    targetBoundingBox: BoundingBox,
    targetProjection: string,
    canvas?: any,
  ): Promise<any> {

    const projectedBoundingBox = targetBoundingBox.projectBoundingBox(targetProjection, this.tileDao.projection);

    const tileMatrices = this.getTileMatrices(projectedBoundingBox);
    let tile = null;
    for (let i = 0; !tile && i < tileMatrices.length; i++) {
      const tileMatrix = tileMatrices[i];
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
      const iterator = this.retrieveTileResults(targetBoundingBox.projectBoundingBox(targetProjection, this.tileDao.projection), tileMatrix);
      for (const tile of iterator) {
        await creator.addTile(tile.tileData, tile.tileColumn, tile.row);
      }
      if (!canvas) {
        tile = creator.getCompleteTile('png');
      }
    }
    return tile;
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

  /**
   * Get the tile matrices that may contain the tiles for the bounding box,
   * matches against the bounding box and zoom level options
   * @param projectedRequestBoundingBox bounding box projected to the tiles
   * @return tile matrices
   */
  getTileMatrices(projectedRequestBoundingBox: BoundingBox): TileMatrix[] {
    const tileMatrices = [];
    // Check if the request overlaps the tile matrix set
    if (this.tileDao.tileMatrices.length !== 0 && TileBoundingBoxUtils.intersects(projectedRequestBoundingBox, this.tileDao.tileMatrixSet.boundingBox)) {
      // Get the tile distance
      const distanceWidth = projectedRequestBoundingBox.maxLongitude - projectedRequestBoundingBox.minLongitude;
      const distanceHeight = projectedRequestBoundingBox.maxLatitude - projectedRequestBoundingBox.minLatitude;

      // Get the zoom level to request based upon the tile size
      let requestZoomLevel = null;
      if (this.scaling != null) {
        // When options are provided, get the approximate zoom level regardless of whether a tile level exists
        requestZoomLevel = this.tileDao.getApproximateZoomLevelForWidthAndHeight(distanceWidth, distanceHeight);
      } else {
        // Get the closest existing zoom level
        requestZoomLevel = this.tileDao.getZoomLevelForWidthAndHeight(distanceWidth, distanceHeight);
      }
      // If there is a matching zoom level
      if (requestZoomLevel != null) {
        let zoomLevels = [];
        // If options are configured, build the possible zoom levels in
        // order to request
        if (this.scaling != null && this.scaling.scaling_type != null) {
          // Find zoom in levels
          const zoomInLevels = [];
          if (this.scaling.isZoomIn()) {
            const zoomIn = this.scaling.zoom_in != null ? requestZoomLevel + this.scaling.zoom_in : this.tileDao.maxZoom;
            for (let zoomLevel = requestZoomLevel + 1; zoomLevel <= zoomIn; zoomLevel++) {
              zoomInLevels.push(zoomLevel);
            }
          }
          // Find zoom out levels
          const zoomOutLevels = [];
          if (this.scaling.isZoomOut()) {
            const zoomOut = this.scaling.zoom_out != null ? requestZoomLevel - this.scaling.zoom_out : this.tileDao.minZoom;
            for (let zoomLevel = requestZoomLevel - 1; zoomLevel >= zoomOut; zoomLevel--) {
              zoomOutLevels.push(zoomLevel);
            }
          }
          if (zoomInLevels.length == 0) {
            // Only zooming out
            zoomLevels = zoomOutLevels;
          } else if (zoomOutLevels.length == 0) {
            // Only zooming in
            zoomLevels = zoomInLevels;
          } else {
            // Determine how to order the zoom in and zoom out
            // levels
            const type = this.scaling.scaling_type;
            switch (type) {
              case TileScalingType.IN:
              case TileScalingType.IN_OUT:
                // Order zoom in levels before zoom out levels
                zoomLevels = zoomInLevels.concat(zoomOutLevels);
                break;
              case TileScalingType.OUT:
              case TileScalingType.OUT_IN:
                // Order zoom out levels before zoom in levels
                zoomLevels = zoomOutLevels.concat(zoomInLevels);
                break;
              case TileScalingType.CLOSEST_IN_OUT:
              case TileScalingType.CLOSEST_OUT_IN:
                // Alternate the zoom in and out levels
                let firstLevels;
                let secondLevels;
                if (type == TileScalingType.CLOSEST_IN_OUT) {
                  // Alternate starting with zoom in
                  firstLevels = zoomInLevels;
                  secondLevels = zoomOutLevels;
                } else {
                  // Alternate starting with zoom out
                  firstLevels = zoomOutLevels;
                  secondLevels = zoomInLevels;
                }

                zoomLevels = [];
                const maxLevels = Math.max(firstLevels.size(), secondLevels.size());
                for (let i = 0; i < maxLevels; i++) {
                  if (i < firstLevels.size()) {
                    zoomLevels.push(firstLevels[i]);
                  }
                  if (i < secondLevels.size()) {
                    zoomLevels.push(secondLevels[i]);
                  }
                }
                break;
              default:
                throw new Error("Unsupported TileScalingType: " + type);
            }
          }
        } else {
          zoomLevels = [];
        }

        // Always check the request zoom level first
        zoomLevels.unshift(requestZoomLevel);

        // Build a list of tile matrices that exist for the zoom levels
        zoomLevels.forEach(zoomLevel => {
          const tileMatrix = this.tileDao.getTileMatrixWithZoomLevel(zoomLevel);
          if (tileMatrix != null) {
            tileMatrices.push(tileMatrix);
          }
        });

      }
    }

    return tileMatrices;
  }
}
