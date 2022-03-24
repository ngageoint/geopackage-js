import { GeoPackage, GeoPackageAPI, setCanvasKitWasmLocateFile } from '@ngageoint/geopackage';
import { GeoJSONToGeoPackage } from '@ngageoint/geojson-to-geopackage';
import fs from 'fs';
import path from 'path';
import PBF from 'pbf';
import clip from 'geojson-clip-polygon';
import GlobalMercator from 'global-mercator';
import { VectorTile } from '@mapbox/vector-tile';

if (typeof window === 'undefined') {
  setCanvasKitWasmLocateFile(file => {
    return path.join(__dirname, 'node_modules', '@ngageoint', 'geopackage', 'dist', 'canvaskit', file);
  });
}

export interface PBFConverterOptions {
  pbf?: string | Buffer;
  append?: boolean;
  geoPackage?: GeoPackage | string;
  srsNumber?: number;
  tableName?: string;
  tileCenter?: Array<number>,
  x?: number,
  y?: number,
  zoom?: number,
  correct?: boolean
}

function correctGeoJson(geoJson, x, y, z): { type: 'FeatureCollection', features: [] } {
  const tileBounds = GlobalMercator.googleToBBox([x, y, z]);

  const correctedGeoJson = {
    type: 'FeatureCollection',
    features: [],
  };
  return geoJson.features
    .reduce(function(sequence, feature) {
      return sequence.then(function() {
        const props = feature.properties;
        const ogfeature = feature;
        if (feature.geometry.type === 'Polygon') {
          feature = clip(
              {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Polygon',
                  coordinates: [
                    [
                      [tileBounds[0], tileBounds[1]],
                      [tileBounds[0], tileBounds[3]],
                      [tileBounds[2], tileBounds[3]],
                      [tileBounds[2], tileBounds[1]],
                      [tileBounds[0], tileBounds[1]],
                    ],
                  ],
                },
              },
              feature,
          );
        }
        if (feature && feature.geometry) {
          feature.properties = props;
          correctedGeoJson.features.push(feature);
        } else {
          correctedGeoJson.features.push(ogfeature);
        }
        return;
      });
    }, Promise.resolve())
    .then(function() {
      return correctedGeoJson;
    });
}

function convertGeoJSONToGeoPackage(geoJson: any, geoPackage: GeoPackage | string, tableName: string, progressCallback: Function, append): Promise<any> {
  return append ? new GeoJSONToGeoPackage().addLayer(
      {
        geoJson: geoJson,
        geoPackage: geoPackage,
        tableName: tableName,
        append: append
      },
      progressCallback,
  ) : new GeoJSONToGeoPackage().convert(
      {
        geoJson: geoJson,
        geoPackage: geoPackage,
        tableName: tableName,
        append: append
      },
      progressCallback,
  );
}

function createOrOpenGeoPackage(geoPackage, options, progressCallback): Promise<GeoPackage> {
  return Promise.resolve().then(function() {
    if (typeof geoPackage === 'object') {
      return progressCallback({ status: 'Opening GeoPackage' }).then(function() {
        return geoPackage;
      });
    } else {
      try {
        const stats = fs.statSync(geoPackage);
        if (!options.append) {
          throw new Error('GeoPackage file already exists, refusing to overwrite ' + geoPackage);
        } else {
          return GeoPackageAPI.open(geoPackage);
        }
      } catch (e) {}
      return progressCallback({ status: 'Creating GeoPackage' }).then(function() {
        return GeoPackageAPI.create(geoPackage);
      });
    }
  });
}

function readFileAsBuffer (file) {
  return new Promise(resolve => {
    fs.readFile(file, function(err, buffer) {
      resolve(buffer);
    });
  });
}

async function setupConversion(options, progressCallback: Function = (): Promise<void> => Promise.resolve()): Promise<any> {
  const geoPackage = options.geoPackage;
  const pbf = options.pbf;
  const append = true;
  const buffer = typeof pbf === 'string' ? await readFileAsBuffer(pbf) : pbf;
  const tile = new VectorTile(new PBF(buffer));

  return Object.keys(tile.layers).reduce(function(sequence, layerName) {
    return sequence
        .then(function() {
          const layer = tile.layers[layerName];
          const geojson = {
            type: 'FeatureCollection',
            features: [],
          };

          for (let i = 0; i < layer.length; i++) {
            const feature = layer.feature(i);
            const featureJson = feature.toGeoJSON(options.x, options.y, options.zoom);
            geojson.features.push(featureJson);
          }
          return options.correct ? correctGeoJson(geojson, options.x, options.y, options.zoom) : geojson;
        })
        .then(function(correctedGeoJson) {
          return convertGeoJSONToGeoPackage(correctedGeoJson, geoPackage, layerName, progressCallback, append);
        });
  }, Promise.resolve());
}

export class PBFToGeoPackage {
  constructor(private options?: PBFConverterOptions) {}

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  async addLayer(options, progressCallback?: Function): Promise<any> {
    const clonedOptions = { ...this.options, ...options };
    clonedOptions.append = true;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return setupConversion(options, progressCallback);
  };

  async convert(options: PBFConverterOptions, progressCallback = () => Promise.resolve()) {
    const clonedOptions = { ...this.options, ...options };
    clonedOptions.append = false;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return setupConversion(options, progressCallback);
  };

  async extract(geopackage, tableName) {
    const geoJson = {
      type: 'FeatureCollection',
      features: [],
    };
    const iterator = geopackage.iterateGeoJSONFeatures(tableName);
    for (const feature of iterator.results) {
      geoJson.features.push(feature);
    }
    return Promise.resolve(geoJson);
  };
}