import {
  GeoPackage,
  GeoPackageAPI,
  TileBoundingBoxUtils,
  BoundingBox,
  setCanvasKitWasmLocateFile,
} from '@ngageoint/geopackage';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

if (typeof window === 'undefined') {
  setCanvasKitWasmLocateFile(file => {
    return path.join(__dirname, 'node_modules', '@ngageoint', 'geopackage', 'dist', 'canvaskit', file);
  });
}

async function createOrOpenGeoPackage(
  geoPackage: GeoPackage | string,
  options: XYZConverterOptions,
  progressCallback?: Function,
): Promise<GeoPackage> {
  if (typeof geoPackage !== 'object') {
    let stats;
    try {
      stats = fs.statSync(geoPackage);
    } catch (e) {}
    if (stats && !options.append) {
      throw new Error('GeoPackage file already exists, refusing to overwrite ' + geoPackage);
    } else if (stats) {
      return GeoPackageAPI.open(geoPackage);
    }
    if (progressCallback) {
      progressCallback({ status: 'Creating GeoPackage' });
    }
    return GeoPackageAPI.create(geoPackage);
  } else {
    if (progressCallback) {
      progressCallback({ status: 'Opening GeoPackage' });
    }
    return geoPackage;
  }
}

function createXYZZip(geopackage: GeoPackage, tables): Promise<any> {
  const zip = new JSZip();
  tables.forEach(table => {
    const tileDao = geopackage.getTileDao(table);
    const boundingBox = tileDao.boundingBox.projectBoundingBox(tileDao.projection, 'EPSG:3857');
    for (let zoom = tileDao.minZoom; zoom <= tileDao.maxZoom; zoom++) {
      const tileBox = TileBoundingBoxUtils.webMercatorTileBox(boundingBox, zoom);
      for (let xTile = tileBox.minLongitude; xTile <= tileBox.maxLongitude; xTile++) {
        for (let yTile = tileBox.minLatitude; yTile <= tileBox.maxLatitude; yTile++) {
          const tile = tileDao.queryForTile(xTile, yTile, zoom);
          if (tile != null) {
            zip.file(zoom + '/' + xTile + '/' + yTile + '.png', tile.tileData);
          }
        }
      }
    }
  });
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

async function setupConversion(
  options: XYZConverterOptions,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type,@typescript-eslint/no-empty-function
  progressCallback: Function = () => {},
): Promise<GeoPackage> {
  const geoPackage: GeoPackage = await createOrOpenGeoPackage(options.geoPackage, options, progressCallback);
  let tableName = 'tiles';
  if (typeof options.xyzZip === 'string') {
    tableName = path.basename(options.xyzZip, path.extname(options.xyzZip));
  }
  const tileTables = geoPackage.getTileTables();
  let count = 1;
  while (tileTables.indexOf(tableName) !== -1) {
    tableName = tableName + '_' + count;
    count++;
  }

  // Determine min zoom and the bounding box of tiles from that
  const boundingBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
  const boundingBoxSrsId = 3857;
  const minZoom = 0;
  const maxZoom = 18;
  progressCallback({ status: 'Creating table "' + tableName + '"' });
  geoPackage.createStandardWebMercatorTileTable(
    tableName,
    boundingBox,
    boundingBoxSrsId,
    boundingBox,
    boundingBoxSrsId,
    minZoom,
    maxZoom,
  );
  const tileDao = geoPackage.getTileDao(tableName);
  const zip = new JSZip();
  if (options.xyzZipData) {
    await zip.loadAsync(options.xyzZipData);
  } else {
    const data = fs.readFileSync(options.xyzZip);
    await zip.loadAsync(data);
  }

  const tiles = zip.file(/png$/);
  for (let i = 0; i < tiles.length; i++) {
    const zipTile = tiles[i];
    const split = zipTile.name.split('/');
    const content = await zipTile.async('nodebuffer');
    const tile = tileDao.newRow();
    tile.zoomLevel = parseInt(split[0]);
    tile.tileColumn = parseInt(split[1]);
    tile.tileRow = parseInt(split[2].split('.')[0]);
    tile.tileData = content;
    tileDao.create(tile);
  }
  return geoPackage;
}

export interface XYZConverterOptions {
  append?: boolean;
  geoPackage?: GeoPackage | string;
  srsNumber?: number;
  tableName?: string;
  xyzZip?: string;
  xyzZipData?: Buffer;
}

export class XYZtoGeoPackage {
  constructor(private options?: XYZConverterOptions) {}

  async addLayer(options, progressCallback?): Promise<any> {
    const clonedOptions = { ...this.options, ...options };
    clonedOptions.append = true;
    return setupConversion(clonedOptions, progressCallback);
  }

  async convert(options, progressCallback?): Promise<any> {
    const clonedOptions = { ...this.options, ...options };
    clonedOptions.append = false;
    return setupConversion(clonedOptions, progressCallback);
  }

  async extract(geopackage: GeoPackage | string, tableName): Promise<any> {
    let geoPackage: GeoPackage;
    if (typeof geopackage !== 'object') {
      geoPackage = await GeoPackageAPI.open(geopackage);
    } else {
      geoPackage = geopackage;
    }
    const tileTables = tableName != null ? [tableName] : geoPackage.getTileTables();
    return createXYZZip(geoPackage, tileTables);
  }
}
