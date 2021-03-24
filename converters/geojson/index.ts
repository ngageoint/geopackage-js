import {
  GeoPackage,
  GeoPackageAPI,
  FeatureColumn,
  GeometryColumns,
  GeoPackageDataType,
  BoundingBox,
} from '@ngageoint/geopackage';
import fs from 'fs';
import path from 'path';
import bbox from '@turf/bbox';

export interface GeoJSONConverterOptions {
  append?: boolean;
  geoPackage?: GeoPackage | string;
  srsNumber?: number;
  tableName?: string;
  geoJson?: any;
}

export class GeoJSONToGeoPackage {
  constructor(private options?: GeoJSONConverterOptions) {}

  async addLayer(options?: GeoJSONConverterOptions, progressCallback?: Function): Promise<any> {
    const clonedOptions = { ...this.options, ...options };
    clonedOptions.append = true;

    return this.setupConversion(clonedOptions, progressCallback);
  }

  async convert(options?: GeoJSONConverterOptions, progressCallback?: Function): Promise<GeoPackage> {
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

  async setupConversion(options: GeoJSONConverterOptions, progressCallback?: Function): Promise<GeoPackage> {
    let geopackage = options.geoPackage;
    const srsNumber = options.srsNumber || 4326;
    const append = options.append;
    let geoJson: any = options.geoJson;
    let tableName = options.tableName;

    geopackage = await this.createOrOpenGeoPackage(geopackage, options, progressCallback);
    // figure out the table name to put the data into
    let name;
    if (typeof geoJson === 'string') {
      name = path.basename(geoJson, path.extname(geoJson));
    }
    name = name || tableName || 'features';
    const tables = geopackage.getFeatureTables();
    let count = 1;
    while (tables.indexOf(name) !== -1) {
      name = name + '_' + count;
      count++;
    }
    tableName = name;
    if (typeof geoJson === 'string') {
      if (progressCallback) await progressCallback({ status: 'Reading GeoJSON file' });
      geoJson = await new Promise(function(resolve, reject) {
        fs.readFile(geoJson, 'utf8', function(err, data) {
          resolve(JSON.parse(data));
        });
      });
    }

    const correctedGeoJson = {
      type: 'FeatureCollection',
      features: [],
    };

    const properties = {};
    for (let i = 0; i < geoJson.features.length; i++) {
      const feature = geoJson.features[i];
      this.addFeatureProperties(feature, properties);
      let splitType = '';
      if (feature.geometry !== null) {
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
      } else {
        correctedGeoJson.features.push({
          type: 'Feature',
          properties: feature.properties,
          geometry: null,
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

    if (feature.id) {
      if (!currentProperties['_feature_id']) {
        currentProperties['_feature_id'] = currentProperties['_feature_id'] || {
          name: '_feature_id',
        };
      }
    }

    for (const key in feature.properties) {
      if (!currentProperties[key]) {
        let type: string = typeof feature.properties[key];
        if (feature.properties[key] !== undefined && feature.properties[key] !== null && type !== 'undefined') {
          if (type === 'object') {
            if (feature.properties[key] instanceof Date) {
              type = 'Date';
            } else {
              continue;
            }
          }
          switch (type) {
            case 'Date':
              type = 'DATETIME';
              break;
            case 'number':
              type = 'DOUBLE';
              break;
            case 'string':
              type = 'TEXT';
              break;
            case 'boolean':
              type = 'BOOLEAN';
              break;
          }
          currentProperties[key] = {
            name: key,
            type: type,
          };
        }
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
    columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
    columns.push(FeatureColumn.createGeometryColumn(1, 'geometry', 'GEOMETRY', false, null));
    let index = 2;

    for (const key in properties) {
      const prop = properties[key];
      if (prop.name.toLowerCase() !== 'id') {
        columns.push(FeatureColumn.createColumn(index, prop.name, GeoPackageDataType.fromName(prop.type), false, null));
        index++;
      } else {
        columns.push(
          FeatureColumn.createColumn(index, '_properties_' + prop.name, GeoPackageDataType.fromName(prop.type), false, null),
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
      if (feature.id) {
        feature.properties._feature_id = feature.id;
      }

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

  async createOrOpenGeoPackage(
    geopackage: GeoPackage | string,
    options: GeoJSONConverterOptions,
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
}
