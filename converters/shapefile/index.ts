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
import shp from 'shp-stream';
import shpwrite from 'shp-write';
import proj4 from 'proj4';
import reproject from 'reproject';
import jszip from 'jszip';

if (typeof window === 'undefined') {
  setCanvasKitWasmLocateFile(file => {
    return path.join(__dirname, 'node_modules', '@ngageoint', 'geopackage', 'dist', 'canvaskit', file);
  });
}

/**
 * Add a Shapefile to the GeoPackage
 * | option       | type    |  |
 * | ------------ | ------- | -------------- |
 * | `geopackage`     | varies  | This option can either be a string or a GeoPackage object.  If the option is a string it is interpreted as a path to a GeoPackage file.  If that file exists, it is opened.  If it does not exist, a new file is created and opened. |
 * | `shapezipData`   | Buffer  | Buffer with the data for a zip file containing a shapefile and it's associated files |
 * | `shapeData` | Buffer | Buffer with the data for a shapefile (.shp) |
 * | `shapefile` | String | Interpreted as a path to a .shp or .zip file |
 * | `dbfData` | String | Only used if the 'shapeData' parameter was provided.  Buffer with the data for a dbf file (.dbf) |
 * @param  {object} options          object describing the operation, see function description
 * @param  {Function} progressCallback called with an object describing the progress and a done function to be called when the handling of progress is completed
 */
export interface ShapefileConverterOptions {
  append?: boolean;
  geoPackage?: GeoPackage;
  shapezipData?: Buffer;
  shapeData?: Buffer;
  shapefile?: string;
  dbfData?: string;
}

export class ShapefileToGeoPackage {
  constructor(private options?: ShapefileConverterOptions) {}

  async addLayer(options?: ShapefileConverterOptions, progressCallback?: Function): Promise<any> {
    const clonedOptions = { ...this.options, ...options };
    clonedOptions.append = true;

    return this.setupConversion(clonedOptions, progressCallback);
  }

  async convert(options?: ShapefileConverterOptions, progressCallback?: Function): Promise<GeoPackage> {
    const clonedOptions = { ...this.options, ...options };
    clonedOptions.append = false;
    return this.setupConversion(clonedOptions, progressCallback);
  }

  async extract(geopackage, tableName): Promise<any> {
    if (!tableName) {
      const tables = geopackage.getFeatureTables();
      return this.createShapefile(geopackage, tables);
    } else {
      return this.createShapefile(geopackage, tableName);
    }
  }

  async createShapefile(geopackage: GeoPackage, tableName: string | Array<string>): Promise<any> {
    const geoJson = {
      type: 'FeatureCollection',
      features: [],
    };
    if (!(tableName instanceof Array)) {
      tableName = [tableName];
    }

    return tableName
      .reduce(function(sequence, name) {
        return sequence.then(function() {
          const iterator = geopackage.iterateGeoJSONFeatures(name);
          for (const feature of iterator) {
            geoJson.features.push(feature);
          }
        });
      }, Promise.resolve())
      .then(function() {
        return shpwrite.zip(geoJson);
      });
  }

  determineTableName(preferredTableName: string, geopackage: GeoPackage): string {
    let name = preferredTableName;
    const tables = geopackage.getFeatureTables();
    let count = 1;
    while (tables.indexOf(name) !== -1) {
      name = name + '_' + count;
      count++;
    }
    return name;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  readRecord(builder) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        builder.reader.readRecord((err, r) => {
          const feature = r;
          if (feature === shp.end) {
            return resolve(builder);
          }
          if (!feature) {
            return resolve(this.readRecord(builder));
          }
          builder.features.push(feature);
          for (const key in feature.properties) {
            if (!builder.properties[key]) {
              builder.properties[key] = builder.properties[key] || {
                name: key,
                type: 'TEXT',
              };

              let type: string = typeof feature.properties[key] || 'TEXT';
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
                builder.properties[key] = {
                  name: key,
                  type: type,
                };
              }
            }
          }
          return resolve(this.readRecord(builder));
        });
      });
    });
  }

  determineFeatureTableColumns(builder): any {
    const geometryColumns = new GeometryColumns();
    geometryColumns.table_name = builder.tableName;
    geometryColumns.column_name = 'geometry';
    geometryColumns.geometry_type_name = 'GEOMETRY';
    geometryColumns.z = 0;
    geometryColumns.m = 0;

    const columns = [];
    columns.push(FeatureColumn.createPrimaryKeyColumn(0, 'id'));
    columns.push(FeatureColumn.createGeometryColumn(1, 'geometry', GeometryType.GEOMETRY, false, null));
    let index = 2;
    for (const key in builder.properties) {
      const prop = builder.properties[key];
      if (prop.name.toLowerCase() !== 'id') {
        console.log(prop.type);
        columns.push(FeatureColumn.createColumn(index, prop.name, GeoPackageDataType.fromName(prop.type), false, null));
        index++;
      }
    }
    builder.columns = columns;
    builder.geometryColumns = geometryColumns;
    return builder;
  }

  async createFeatureTable(geopackage: GeoPackage, builder: any): Promise<any> {
    let boundingBox = new BoundingBox(-180, 180, -90, 90);
    if (builder.projection && builder.bbox) {
      // bbox is xmin, ymin, xmax, ymax
      const ll = proj4(builder.projection).inverse([builder.bbox[0], builder.bbox[1]]);
      const ur = proj4(builder.projection).inverse([builder.bbox[2], builder.bbox[3]]);
      boundingBox = new BoundingBox(ll[0], ur[0], ll[1], ur[1]);
    }
    await geopackage.createFeatureTable(builder.tableName, builder.geometryColumns, builder.columns, boundingBox, 4326);

    builder.featureDao = geopackage.getFeatureDao(builder.tableName);
    return builder;
  }

  async addFeaturesToTable(geopackage: GeoPackage, builder: any, progressCallback: Function): Promise<void> {
    let count = 0;
    const featureCount = builder.features.length;
    const fivePercent = Math.floor(featureCount / 20);

    for (let i = 0; i < featureCount; i++) {
      let feature = builder.features[i];
      if (builder.projection) {
        feature = reproject.reproject(feature, builder.projection, 'EPSG:4326');
      }
      geopackage.addGeoJSONFeatureToGeoPackage(feature, builder.tableName);
      if (count++ % fivePercent === 0) {
        if (progressCallback)
          await progressCallback({
            status: 'Inserting features into table "' + builder.tableName + '"',
            completed: count,
            total: featureCount,
          });
      }
    }
    if (progressCallback)
      await progressCallback({
        status: 'Done inserting features into table "' + builder.tableName + '"',
      });
  }

  async convertShapefileReaders(readers: any, geopackage: GeoPackage, progressCallback: Function): Promise<GeoPackage> {
    for (let r = 0; r < readers.length; r++) {
      const shapefile = readers[r];
      const builder = {
        tableName: shapefile.tableName,
        reader: shapefile.reader,
        projection: shapefile.projection,
        features: [],
        bbox: undefined,
        properties: {},
      };

      builder.tableName = this.determineTableName(builder.tableName, geopackage);
      await new Promise(function(resolve, reject) {
        shapefile.reader.readHeader(function(err, header) {
          builder.bbox = header ? header.bbox : undefined;
          resolve(builder);
        });
      });
      if (progressCallback) await progressCallback({ status: 'Reading Shapefile properties' });
      builder.properties = {};
      await this.readRecord(builder);
      this.determineFeatureTableColumns(builder);
      if (progressCallback) await progressCallback({ status: 'Creating table "' + builder.tableName + '"' });
      await this.createFeatureTable(geopackage, builder);
      await this.addFeaturesToTable(geopackage, builder, progressCallback);

      await new Promise<void>(function(resolve, reject) {
        if (shapefile.reader) {
          shapefile.reader.close(resolve);
        } else {
          resolve();
        }
      });
    }

    return geopackage;
  }

  async getReadersFromZip(zip: any): Promise<any[]> {
    const readers = [];
    const shpfileArray = zip.filter(function(relativePath, file) {
      return path.extname(relativePath) === '.shp' && relativePath.indexOf('__MACOSX') == -1;
    });
    const dbffileArray = zip.filter(function(relativePath, file) {
      return path.extname(relativePath) === '.dbf' && relativePath.indexOf('__MACOSX') == -1;
    });
    const prjfileArray = zip.filter(function(relativePath, file) {
      return path.extname(relativePath) === '.prj' && relativePath.indexOf('__MACOSX') == -1;
    });

    for (let i = 0; i < shpfileArray.length; i++) {
      const shapeZipObject = shpfileArray[i];

      const shpBuffer = await shapeZipObject.async('nodebuffer');
      const shpStream = new stream.PassThrough();
      shpStream.end(shpBuffer);

      const basename = path.basename(shapeZipObject.name, path.extname(shapeZipObject.name));

      let dbfStream;

      for (let d = 0; d < dbffileArray.length; d++) {
        const dbfZipObject = dbffileArray[d];
        if (dbfZipObject.name == basename + '.dbf') {
          const dbfBuffer = await dbfZipObject.async('nodebuffer');
          dbfStream = new stream.PassThrough();
          dbfStream.end(dbfBuffer);
          break;
        }
      }

      let projection;

      for (let p = 0; p < prjfileArray.length; p++) {
        const prjZipObject = prjfileArray[p];
        if (prjZipObject.name == basename + '.prj') {
          const prjBuffer = await prjZipObject.async('nodebuffer');
          projection = proj4.Proj(prjBuffer.toString());
          break;
        }
      }
      readers.push({
        tableName: basename,
        projection: projection,
        reader: shp.reader({
          shp: shpStream,
          dbf: dbfStream,
          'ignore-properties': !!dbfStream,
        }),
      });
    }
    return readers;
  }

  async setupConversion(options: ShapefileConverterOptions, progressCallback: Function): Promise<any> {
    let geopackage = options.geoPackage;
    let readers;
    let dbf;
    if (options.shapezipData) {
      const zip = new jszip();
      await zip.loadAsync(options.shapezipData);
      readers = await this.getReadersFromZip(zip);
    } else if (options.shapeData) {
      const shpStream = new stream.PassThrough();
      const shpBuffer = new Buffer(options.shapeData);
      shpStream.end(shpBuffer);

      let dbfStream;
      if (options.dbfData) {
        dbfStream = new stream.PassThrough();
        const dbfBuffer = new Buffer(options.dbfData);
        dbfStream.end(dbfBuffer);
      }

      readers = [
        {
          tableName: 'features',
          reader: shp.reader({
            dbf: dbfStream,
            'ignore-properties': !!options.dbfData,
            shp: shpStream,
          }),
        },
      ];
    } else {
      const extension = path.extname(options.shapefile);
      if (extension.toLowerCase() === '.zip') {
        readers = await new Promise((resolve, reject) => {
          fs.readFile(options.shapefile, async (err, data) => {
            const zip = new jszip();
            await zip.loadAsync(data);
            resolve(this.getReadersFromZip(zip));
          });
        });
      } else {
        dbf = path.basename(options.shapefile, path.extname(options.shapefile)) + '.dbf';
        try {
          const stats = fs.statSync(dbf);
          readers = [
            {
              tableName: path.basename(options.shapefile, path.extname(options.shapefile)),
              reader: shp.reader(options.shapefile),
            },
          ];
        } catch (e) {
          readers = [
            {
              tableName: path.basename(options.shapefile, path.extname(options.shapefile)),
              reader: shp.reader(options.shapefile, {
                'ignore-properties': true,
              }),
            },
          ];
        }
      }
    }
    geopackage = await this.createOrOpenGeoPackage(geopackage, options, progressCallback);
    return this.convertShapefileReaders(readers, geopackage, progressCallback);
  }

  async createOrOpenGeoPackage(
    geopackage: GeoPackage,
    options: ShapefileConverterOptions,
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
        return GeoPackageAPI.open(geopackage);
      }
      if (progressCallback) await progressCallback({ status: 'Creating GeoPackage' });
      console.log('Create new geopackage', geopackage);
      return GeoPackageAPI.create(geopackage);
    }
  }
}
