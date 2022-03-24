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
import bbox from '@turf/bbox';

if (typeof window === 'undefined') {
  setCanvasKitWasmLocateFile(file => {
    return path.join(__dirname, 'node_modules', '@ngageoint', 'geopackage', 'dist', 'canvaskit', file);
  });
}

export interface GeoJSONConverterOptions {
  append?: boolean;
  geoPackage?: GeoPackage | string;
  srsNumber?: number;
  tableName?: string;
  geoJson?: any;
}

export class GeoJSONToGeoPackage {
  constructor(private options?: GeoJSONConverterOptions) {}

  _calculateTrueExtentForFeatureTable(gp, tableName): Array<number> {
    let extent = undefined;
    const featureDao = gp.getFeatureDao(tableName);
    if (featureDao.isIndexed()) {
      if (featureDao.featureTableIndex.rtreeIndexDao != null) {
        const iterator = featureDao.featureTableIndex.rtreeIndexDao.queryForEach();
        let nextRow = iterator.next();
        while (!nextRow.done) {
          if (extent == null) {
            extent = [nextRow.value.minx, nextRow.value.miny, nextRow.value.maxx, nextRow.value.maxy];
          } else {
            extent[0] = Math.min(extent[0], nextRow.value.minx);
            extent[1] = Math.min(extent[1], nextRow.value.miny);
            extent[2] = Math.max(extent[2], nextRow.value.maxx);
            extent[3] = Math.max(extent[3], nextRow.value.maxy);
          }
          nextRow = iterator.next();
        }
      } else if (featureDao.featureTableIndex.geometryIndexDao != null) {
        const iterator = featureDao.featureTableIndex.geometryIndexDao.queryForEach();
        let nextRow = iterator.next();
        while (!nextRow.done) {
          if (extent == null) {
            extent = [nextRow.value.min_x, nextRow.value.min_y, nextRow.value.max_x, nextRow.value.max_y];
          } else {
            extent[0] = Math.min(extent[0], nextRow.value.min_x);
            extent[1] = Math.min(extent[1], nextRow.value.min_y);
            extent[2] = Math.max(extent[2], nextRow.value.max_x);
            extent[3] = Math.max(extent[3], nextRow.value.max_y);
          }
          nextRow = iterator.next();
        }
      }
    }

    if (extent == null) {
      const iterator = featureDao.queryForEach();
      let nextRow = iterator.next();
      while (!nextRow.done) {
        const featureRow = featureDao.getRow(nextRow.value);
        if (featureRow.geometry != null && featureRow.geometry.envelope != null) {
          if (extent == null) {
            extent = [
              featureRow.geometry.envelope.minX,
              featureRow.geometry.envelope.minY,
              featureRow.geometry.envelope.maxX,
              featureRow.geometry.envelope.maxY,
            ];
          } else {
            extent[0] = Math.min(extent[0], featureRow.geometry.envelope.minX);
            extent[1] = Math.min(extent[1], featureRow.geometry.envelope.minY);
            extent[2] = Math.max(extent[2], featureRow.geometry.envelope.maxX);
            extent[3] = Math.max(extent[3], featureRow.geometry.envelope.maxY);
          }
        }
        nextRow = iterator.next();
      }
    }
    return extent;
  }

  _updateBoundingBoxForFeatureTable(gp, tableName): void {
    const contentsDao = gp.contentsDao;
    const contents = contentsDao.queryForId(tableName);
    const extent = this._calculateTrueExtentForFeatureTable(gp, tableName);
    if (extent != null) {
      contents.min_x = extent[0];
      contents.min_y = extent[1];
      contents.max_x = extent[2];
      contents.max_y = extent[3];
    } else {
      contents.min_x = -180.0;
      contents.min_y = -90.0;
      contents.max_x = 180.0;
      contents.max_y = 90.0;
    }
    contentsDao.update(contents);
  }

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
    let geoPackage = options.geoPackage;
    const srsNumber = options.srsNumber || 4326;
    let geoJson: any = options.geoJson;
    let tableName = options.tableName;
    geoPackage = await this.createOrOpenGeoPackage(geoPackage, options, progressCallback);
    // figure out the table name to put the data into
    let name;
    if (typeof geoJson === 'string') {
      name = path.basename(geoJson, path.extname(geoJson));
    }
    name = tableName || name || 'features';
    let nameSuffix = '';
    const tables = geoPackage.getFeatureTables();
    let count = 1;
    while (tables.indexOf(name + nameSuffix) !== -1) {
      nameSuffix = '_' + count;
      count++;
    }
    tableName = name + nameSuffix;
    if (typeof geoJson === 'string') {
      if (progressCallback) await progressCallback({ status: 'Reading GeoJSON file' });
      geoJson = await new Promise(function(resolve, reject) {
        fs.readFile(geoJson, 'utf8', function(err, data) {
          resolve(JSON.parse(data));
        });
      });
    }

    const featureCollection = {
      type: 'FeatureCollection',
      features: [],
    };

    const properties = {};
    for (let i = 0; i < geoJson.features.length; i++) {
      const feature = geoJson.features[i];
      this.addFeatureProperties(feature, properties);
      if (feature.geometry !== null) {
        featureCollection.features.push(feature);
      } else {
        featureCollection.features.push({
          type: 'Feature',
          properties: feature.properties,
          geometry: null,
        });
      }
    }

    return this.convertGeoJSONToGeoPackage(
      featureCollection,
      geoPackage,
      tableName,
      properties,
      srsNumber,
      progressCallback,
    );
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
          type: 'DOUBLE',
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
    geoPackage: GeoPackage,
    tableName: string,
    properties: Record<string, any>,
    srsNumber: number,
    progressCallback?: Function,
  ): Promise<GeoPackage> {
    return this.convertGeoJSONToGeoPackageWithSrs(
      geoJson,
      geoPackage,
      tableName,
      properties,
      srsNumber,
      progressCallback,
    );
  }

  async convertGeoJSONToGeoPackageWithSrs(
    geoJson: any,
    geoPackage: GeoPackage,
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

    const columns: FeatureColumn[] = [];
    columns.push(FeatureColumn.createPrimaryKeyColumn(0, 'id', true));
    columns.push(FeatureColumn.createGeometryColumn(1, 'geometry', GeometryType.GEOMETRY, false, null));
    let index = 2;

    for (const key in properties) {
      const prop = properties[key];
      if (prop.name.toLowerCase() !== 'id') {
        columns.push(FeatureColumn.createColumn(index, prop.name, GeoPackageDataType.fromName(prop.type)));
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
      }
      index++;
    }
    if (progressCallback) await progressCallback({ status: 'Creating table "' + tableName + '"' });
    const tmp = bbox(geoJson);
    const boundingBox: BoundingBox = new BoundingBox(
      Math.max(-180, tmp[0]),
      Math.min(180, tmp[2]),
      Math.max(-90, tmp[1]),
      Math.min(90, tmp[3]),
    );
    if (
      geoPackage
        .getFeatureTables()
        .map(table => table.toLowerCase())
        .indexOf(tableName.toLowerCase()) === -1
    ) {
      console.log('creating feature table: ' + tableName)
      geoPackage.createFeatureTable(tableName, geometryColumns, columns, boundingBox, srsNumber);
    }
    const featureDao = geoPackage.getFeatureDao(tableName);
    const srs = featureDao.srs;
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
      geoPackage.addGeoJSONFeatureToGeoPackageWithFeatureDaoAndSrs(feature, featureDao, srs, true);
      if (count++ % fivePercent === 0) {
        if (progressCallback)
          await progressCallback({
            status: 'Inserting features into table "' + tableName + '"',
            completed: count,
            total: featureCount,
          });
      }
    }
    if (progressCallback) {
      await progressCallback({
        status: 'Done inserting features into table "' + tableName + '"',
      });
    }

    this._updateBoundingBoxForFeatureTable(geoPackage, tableName);
    return geoPackage;
  }

  async createOrOpenGeoPackage(
    geoPackage: GeoPackage | string,
    options: GeoJSONConverterOptions,
    progressCallback?: Function,
  ): Promise<GeoPackage> {
    if (typeof geoPackage === 'object') {
      if (progressCallback) await progressCallback({ status: 'Opening GeoPackage' });
      return geoPackage;
    } else {
      let stats;
      try {
        stats = fs.statSync(geoPackage);
      } catch (e) {}
      if (stats && !options.append) {
        throw new Error('GeoPackage file already exists, refusing to overwrite ' + geoPackage);
      } else if (stats) {
        return GeoPackageAPI.open(geoPackage);
      }
      if (progressCallback) await progressCallback({ status: 'Creating GeoPackage' });
      return GeoPackageAPI.create(geoPackage);
    }
  }
}
