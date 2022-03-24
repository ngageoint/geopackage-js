import {
  GeoPackage,
  GeoPackageAPI,
  BoundingBox,
  DBAdapter,
  setCanvasKitWasmLocateFile,
} from '@ngageoint/geopackage';
import fs from 'fs';
import path from 'path';
// import pako from 'pako';
// import { PBFToGeoPackage } from '@ngageoint/pbf-to-geopackage';

const isNode = typeof window === 'undefined'
if (isNode) {
  setCanvasKitWasmLocateFile(file => {
    return path.join(__dirname, 'node_modules', '@ngageoint', 'geopackage', 'dist', 'canvaskit', file);
  });
}

export interface MBTilesConverterOptions {
  append?: boolean;
  geoPackage?: string;
  mbtiles?: string;
  mbtilesData?: Buffer;
  readonly?: boolean;
  keepOriginalTables?: boolean;
}

export class MBTilesToGeoPackage {
  constructor(private options?: MBTilesConverterOptions) {}

  async addLayer(options?: MBTilesConverterOptions, progressCallback?: Function): Promise<any> {
    const clonedOptions = { ...this.options, ...options };
    clonedOptions.append = true;
    return this.setupConversion(clonedOptions, progressCallback);
  }

  async convert(options?: MBTilesConverterOptions, progressCallback?: Function): Promise<GeoPackage> {
    const clonedOptions = { ...this.options, ...options };
    clonedOptions.append = false;
    return this.setupConversion(clonedOptions, progressCallback);
  }

  async extract(geopackage: GeoPackage, tableName: string): Promise<any> {
    const geoJson = {
      type: 'FeatureCollection',
      features: [],
    };
    const iterator = geopackage.iterateGeoJSONFeatures(tableName);
    for (const feature of iterator) {
      geoJson.features.push(feature);
    }
    return Promise.resolve(geoJson);
  }

  determineFormatFromTile(db): string {
    let format = null;
    const stmt = db.prepare('SELECT tile_data FROM tiles');
    const row = stmt.get();
    if (row && row.tile_data) {
      if (row.tile_data.length > 3) {
        format = row.tile_data[0] === 255 && row.tile_data[1] === 216 && row.tile_data[2] === 255 ? 'jpg' : 'png';
      }
    }
    return format;
  }

  getInfo(
    db: DBAdapter,
  ): { bounds: Array<number>; format: string; minzoom: number; maxzoom: number; center: Array<number> } {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const info: { bounds: Array<number>; format: string; minzoom: number; maxzoom: number; center: Array<number> } = {};
    try {
      db.all('SELECT name, value FROM metadata').forEach(function(row) {
        switch (row.name) {
          case 'json':
            try {
              const jsondata = JSON.parse(row.value);
              Object.keys(jsondata).reduce(function(memo, key) {
                memo[key] = memo[key] || jsondata[key];
                return memo;
              }, info);
              // eslint-disable-next-line no-empty
            } catch (err) {}
            break;
          case 'minzoom':
          case 'maxzoom':
            info[row.name] = parseInt(row.value, 10);
            break;
          case 'center':
          case 'bounds':
            info[row.name] = row.value.split(',').map(parseFloat);
            break;
          default:
            info[row.name] = row.value;
            break;
        }
      });
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to determine MBTiles metadata.');
    }
    if (info.bounds == null) {
      info.bounds = [-180, -90, 180, 90];
    }
    if (info.format == null) {
      try {
        info.format = this.determineFormatFromTile(db);
        // eslint-disable-next-line no-unused-vars
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to determine MBTiles format.');
      }
    }
    return info;
  }

  async setupConversion(options: MBTilesConverterOptions, progressCallback?: Function): Promise<GeoPackage> {
    const geoPackage = await this.openMBTilesAsGeoPackage(options.mbtiles || options.mbtilesData, options.geoPackage);

    const db: DBAdapter = geoPackage.connection.adapter;
    const info = this.getInfo(db);
    geoPackage.createRequiredTables();

    if (info.format === 'pbf') {
      return geoPackage;
      // const maxZoom = geoPackage.connection.get('select max(zoom_level) as max_zoom from tiles');
      // const iterator = geoPackage.connection.each('select * from tiles where zoom_level = ?', [maxZoom['max_zoom']]);
      // for (const row of iterator) {
      //   const y = (1 << row.zoom_level) - 1 - row.tile_row;
      //   const x = row.tile_column;
      //   const zoom = row.zoom_level;
      //   const unzipped = pako.ungzip(row.tile_data);
      //   await new PBFToGeoPackage().addLayer({
      //     pbf: unzipped,
      //     append: true,
      //     geoPackage: geoPackage,
      //     x: x,
      //     y: y,
      //     zoom: zoom,
      //     correct: false,
      //   });
      // }
    } else {
      const minZoom = info.minzoom || 0;
      const maxZoom = info.maxzoom || 20;
      const name = 'tiles_gpkg';
      const bb = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
      geoPackage.createStandardWebMercatorTileTable(name, bb, 3857, bb, 3857, minZoom, maxZoom, 256);
      const tileDao = geoPackage.getTileDao(name);
      const newRow = tileDao.newRow();
      const iterator = geoPackage.connection.each('select * from tiles');
      if (isNode) {
        geoPackage.connection.adapter.db.unsafeMode(true)
      }
      for (const row of iterator) {
        newRow.resetId();
        newRow.tileRow = (1 << row.zoom_level) - 1 - row.tile_row;
        newRow.tileColumn = row.tile_column;
        newRow.zoomLevel = row.zoom_level;
        newRow.tileData = row.tile_data;
        tileDao.create(newRow);
      }
      if (isNode) {
        geoPackage.connection.adapter.db.unsafeMode(false)
      }
    }

    return geoPackage;
  }

  async openMBTilesAsGeoPackage(mbtiles: string | Buffer, geoPackage: string): Promise<GeoPackage> {
    if (typeof window === 'undefined') {
      fs.copyFileSync(mbtiles, geoPackage);
      return GeoPackageAPI.open(geoPackage);
    } else {
      return GeoPackageAPI.open(mbtiles);
    }
  }

  async createOrOpenGeoPackage(
    geopackage: GeoPackage | string,
    options: MBTilesConverterOptions,
    progressCallback?: Function,
  ): Promise<GeoPackage> {
    if (typeof geopackage === 'object') {
      if (progressCallback) await progressCallback({ status: 'Opening GeoPackage' });
      return geopackage;
    } else {
      let stats;
      try {
        stats = fs.statSync(geopackage);
      } catch (e) {}
      if (stats && !options.append) {
        throw new Error('GeoPackage file already exists, refusing to overwrite ' + geopackage);
      } else if (stats) {
        return GeoPackageAPI.open(geopackage);
      }
      if (progressCallback) await progressCallback({ status: 'Creating GeoPackage' });
      return GeoPackageAPI.create(geopackage);
    }
  }
}
