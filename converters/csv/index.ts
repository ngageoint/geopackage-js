import {
  GeoPackage,
  GeoPackageAPI,
  FeatureColumn,
  GeometryColumns,
  GeoPackageDataType,
  BoundingBox,
  GeometryType,
  setCanvasKitWasmLocateFile,
} from '@ngageoint/geopackage';

import fs from 'fs';
import path from 'path';
import stream from 'stream';
import bbox from '@turf/bbox';
import wkx from 'wkx';
import CSVStream from 'csv-streamify';

if (typeof window === 'undefined') {
  setCanvasKitWasmLocateFile(file => {
    return path.join(__dirname, 'node_modules', '@ngageoint', 'geopackage', 'dist', 'canvaskit', file);
  });
}
export interface CSVConverterOptions {
  append?: boolean;
  geoPackage?: GeoPackage;
  srsNumber?: number;
  tableName?: string;
  csv?: string;
  delimiter?: string;
  newline?: string;
  csvData?: any;
}

export class CSVToGeoPackage {
  constructor(private options?: CSVConverterOptions) {}

  async addLayer(options?: CSVConverterOptions, progressCallback?: Function): Promise<any> {
    const clonedOptions = { ...this.options, ...options };
    clonedOptions.append = true;
    return this.setupConversion(clonedOptions, progressCallback);
  }

  async convert(options?: CSVConverterOptions, progressCallback?: Function): Promise<GeoPackage> {
    const clonedOptions = { ...this.options, ...options };
    clonedOptions.append = false;
    return this.setupConversion(clonedOptions, progressCallback);
  }

  async extract(geopackage: GeoPackage, tableName: string): Promise<any> {
    const geoJson = {
      type: 'FeatureCollection',
      features: [],
    };
    const properties = {};

    const iterator = geopackage.iterateGeoJSONFeatures(tableName);
    for (const feature of iterator) {
      for (const prop in feature.properties) {
        properties[prop] = true;
      }
      geoJson.features.push(feature);
    }

    let csvString = '';

    const fields = ['geometry'];
    for (const prop in properties) {
      fields.push(prop);
    }

    csvString += fields.join(',');
    csvString += '\n';

    for (let i = 0; i < geoJson.features.length; i++) {
      const feature = geoJson.features[i];
      const row = [];
      for (let f = 0; f < fields.length; f++) {
        const field = fields[f];
        if (field === 'geometry') {
          row.push('"' + wkx.Geometry.parseGeoJSON(feature.geometry).toWkt() + '"');
        }
        if (feature.properties[field]) {
          row.push(feature.properties[field]);
        } else {
          row.push(undefined);
        }
      }
      csvString += row.join(',');
      csvString += '\n';
    }
    return Promise.resolve(csvString);
  }

  async createOrOpenGeoPackage(
    geopackage: GeoPackage,
    options: CSVConverterOptions,
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
        console.log('GeoPackage file already exists, refusing to overwrite ' + geopackage);
        throw new Error('GeoPackage file already exists, refusing to overwrite ' + geopackage);
      } else if (stats) {
        console.log('open geopackage');
        return GeoPackageAPI.open(geopackage);
      }
      if (progressCallback) await progressCallback({ status: 'Creating GeoPackage' });
      console.log('Create new geopackage', geopackage);
      return GeoPackageAPI.create(geopackage);
    }
  }

  async setupConversion(options: CSVConverterOptions, progressCallback?: Function): Promise<GeoPackage> {
    let geopackage = options.geoPackage;
    const csv = options.csv;
    let tableName = options.tableName;

    geopackage = await this.createOrOpenGeoPackage(geopackage, options, progressCallback);
    // figure out the table name to put the data into
    let name;
    if (typeof csv === 'string') {
      name = path.basename(csv, path.extname(csv));
    }
    name = name || tableName || 'features';
    const tables = geopackage.getFeatureTables();
    let count = 1;
    while (tables.indexOf(name) !== -1) {
      name = name + '_' + count;
      count++;
    }
    tableName = name;

    if (progressCallback) await progressCallback({ status: 'Reading CSV file' });

    const parser = CSVStream({
      delimiter: options.delimiter || ',',
      newline: options.newline || '\r\n',
      objectMode: true,
      columns: true,
      empty: undefined,
    });

    const geoJson = {
      type: 'FeatureCollection',
      features: [],
    };

    parser.on('data', function(line) {
      const gj = {
        type: 'Feature',
        properties: line,
        geometry: undefined,
      };
      if (line.WKT || line.wkt) {
        const geom = wkx.Geometry.parse(line.WKT || line.wkt).toGeoJSON();
        gj.geometry = geom;
      } else if (line.latitude && line.longitude) {
        gj.geometry = {
          type: 'Point',
          coordinates: [line.longitude, line.latitude],
        };
      } else if (line.lat && line.lng) {
        gj.geometry = {
          type: 'Point',
          coordinates: [line.lng, line.lat],
        };
      } else if (line.lat && line.lon) {
        gj.geometry = {
          type: 'Point',
          coordinates: [line.lon, line.lat],
        };
      } else if (line.CoordY && line.CoordX) {
        gj.geometry = {
          type: 'Point',
          coordinates: [line.CoordX, line.CoordY],
        };
      } else if (line.y && line.x) {
        gj.geometry = {
          type: 'Point',
          coordinates: [line.x, line.y],
        };
      } else {
        // no geometry, bail
        return;
      }
      geoJson.features.push(gj);
    });

    await new Promise<void>(function(resolve) {
      if (options.csv && typeof options.csv === 'string') {
        fs.createReadStream(csv)
          .pipe(parser)
          .on('end', resolve);
      } else if (options.csvData) {
        const bufferStream = new stream.PassThrough();
        bufferStream.end(options.csvData);
        bufferStream.pipe(parser).on('end', resolve);
      } else {
        resolve();
      }
    });

    const correctedGeoJson = {
      type: 'FeatureCollection',
      features: [],
    };

    const properties = {};
    for (let i = 0; i < geoJson.features.length; i++) {
      const feature = geoJson.features[i];
      this.addFeatureProperties(feature, properties);
      let splitType = '';
      if (feature.geometry.type === 'MultiPolygon') {
        splitType = 'Polygon';
      } else if (feature.geometry.type === 'MultiLineString') {
        splitType = 'LineString';
      } else {
        correctedGeoJson.features.push(feature);
        continue;
      }
      // split if necessary
      for (let c = 0; c < feature.geometry.coordinates.length; c++) {
        const coords = feature.geometry.coordinates[c];
        correctedGeoJson.features.push({
          type: 'Feature',
          properties: feature.properties,
          geometry: {
            type: splitType,
            coordinates: coords,
          },
        });
      }
    }

    return this.convertGeoJSONToGeoPackage(correctedGeoJson, geopackage, tableName, properties, progressCallback);
  }

  addFeatureProperties(feature: any, currentProperties: Record<string, any>): void {
    if (feature.properties.geometry) {
      feature.properties.geometry_property = feature.properties.geometry;
      delete feature.properties.geometry;
    }

    for (const key in feature.properties) {
      if (
        !currentProperties[key] &&
        feature.properties[key] !== undefined &&
        feature.properties[key] !== null &&
        feature.properties[key] !== ''
      ) {
        let type = 'TEXT';
        if (!Number.isNaN(Number(feature.properties[key]))) {
          type = 'DOUBLE';
        }
        currentProperties[key] = {
          name: key,
          type: type,
        };
      }
    }
  }

  async convertGeoJSONToGeoPackage(
    geoJson: any,
    geopackage: GeoPackage,
    tableName: string,
    properties: Record<string, any>,
    progressCallback?: Function,
  ): Promise<GeoPackage> {
    return this.convertGeoJSONToGeoPackageWithSrs(geoJson, geopackage, tableName, properties, 4326, progressCallback);
  }

  async convertGeoJSONToGeoPackageWithSrs(
    geoJson: any,
    geopackage: GeoPackage,
    tableName: string,
    properties: Record<string, any>,
    srsNumber: number,
    progressCallback?: Function,
  ): Promise<GeoPackage> {
    const geometryColumns = new GeometryColumns();
    geometryColumns.table_name = tableName;
    geometryColumns.column_name = 'geometry';
    geometryColumns.geometry_type_name = 'GEOMETRY';
    geometryColumns.z = 2;
    geometryColumns.m = 2;

    const columns = [];
    columns.push(FeatureColumn.createPrimaryKeyColumn(0, 'id'));
    columns.push(FeatureColumn.createGeometryColumn(1, 'geometry', GeometryType.GEOMETRY, false, null));
    let index = 2;

    for (const key in properties) {
      const prop = properties[key];
      if (prop.name.toLowerCase() !== 'id') {
        columns.push(FeatureColumn.createColumn(index, prop.name, GeoPackageDataType.fromName(prop.type), false, null));
        index++;
      } else {
        columns.push(
          FeatureColumn.createColumn(
            index,
            '_properties_' + prop.name,
            GeoPackageDataType.fromName(prop.type),
            false,
            null,
          ),
        );
        index++;
      }
    }
    if (progressCallback) await progressCallback({ status: 'Creating table "' + tableName + '"' });
    const tmp = bbox(geoJson);
    const boundingBox: BoundingBox = new BoundingBox(
      Math.max(-180, tmp[0]),
      Math.min(180, tmp[2]),
      Math.max(-90, tmp[1]),
      Math.min(90, tmp[3]),
    );
    const featureDao = await geopackage.createFeatureTable(tableName, geometryColumns, columns, boundingBox, srsNumber);
    let count = 0;
    const featureCount = geoJson.features.length;
    const fivePercent = Math.floor(featureCount / 20);
    for (let i = 0; i < featureCount; i++) {
      const feature = geoJson.features[i];
      if (feature.properties.id) {
        feature.properties._properties_id = feature.properties.id;
        delete feature.properties.id;
      }
      if (feature.properties.ID) {
        feature.properties._properties_ID = feature.properties.ID;
        delete feature.properties.ID;
      }
      const featureId = geopackage.addGeoJSONFeatureToGeoPackage(feature, tableName);
      if (count++ % fivePercent === 0) {
        if (progressCallback)
          await progressCallback({
            status: 'Inserting features into table "' + tableName + '"',
            completed: count,
            total: featureCount,
          });
      }
    }
    if (progressCallback)
      await progressCallback({
        status: 'Done inserting features into table "' + tableName + '"',
      });
    return geopackage;
  }
}
