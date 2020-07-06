/**
 * featureDao module.
 * @module features/user/featureDao
 */
// @ts-ignore
import reproject from 'reproject';
import LineIntersect from '@turf/line-intersect';
import Intersect from '@turf/intersect';
// @ts-ignore
import BooleanWithin from '@turf/boolean-within';

import { FeatureTableIndex } from '../../extension/index/featureTableIndex';
import { UserDao } from '../../user/userDao';
import { DataColumnsDao } from '../../dataColumns/dataColumnsDao';
import { FeatureRow } from './featureRow';
import { DataTypes } from '../../db/dataTypes';
import { BoundingBox } from '../../boundingBox';
import { Feature, GeoJsonObject } from 'geojson';
import { GeometryColumns } from '../columns/geometryColumns';
import { MetadataDao } from '../../metadata/metadataDao';
import { GeoPackage } from '../../geoPackage';
import { FeatureTable } from './featureTable';
import { Contents } from '../../core/contents/contents';
import { SpatialReferenceSystem } from '../../core/srs/spatialReferenceSystem';
import { DBValue } from '../../db/dbAdapter';
import { DataColumns } from '../../dataColumns/dataColumns';

/**
 * Feature DAO for reading feature user data tables
 * @class FeatureDao
 * @extends UserDao
 * @param  {any} db              database connection
 * @param  {FeatureTable} table           feature table
 * @param  {GeometryColumns} geometryColumns geometry columns
 * @param  {MetadataDao} metadataDao      metadata dao
 */
export class FeatureDao<T extends FeatureRow> extends UserDao<FeatureRow> {
  dataColumnsDao: DataColumnsDao;
  featureTableIndex: FeatureTableIndex;
  projection: proj4.Converter;
  protected _table: FeatureTable;
  constructor(
    geoPackage: GeoPackage,
    table: FeatureTable,
    public geometryColumns: GeometryColumns,
    public metadataDao: MetadataDao,
  ) {
    super(geoPackage, table);
    this.dataColumnsDao = new DataColumnsDao(geoPackage);
    this.featureTableIndex = new FeatureTableIndex(geoPackage, this);
    const dao = geoPackage.geometryColumnsDao;
    if (!dao.getContents(geometryColumns)) {
      throw new Error('Geometry Columns ' + geometryColumns.id + ' has null Contents');
    }
    if (!dao.getSrs(geometryColumns)) {
      throw new Error('Geometry Columns ' + geometryColumns.id + ' has null Spatial Reference System');
    }
    this.projection = dao.getProjection(geometryColumns);
  }
  createObject(results: Record<string, DBValue>): FeatureRow {
    if (results) {
      return this.getRow(results) as FeatureRow;
    }
    return this.newRow();
  }
  getRow(results: Record<string, DBValue>): FeatureRow {
    return super.getRow(results) as FeatureRow;
  }
  getContents(): Contents {
    const dao = this.geoPackage.geometryColumnsDao;
    return dao.getContents(this.geometryColumns);
  }
  /**
   * Get the feature table
   * @return {FeatureTable} the feature table
   */
  getFeatureTable(): FeatureTable {
    return this.table;
  }
  get table(): FeatureTable {
    return this._table;
  }
  /**
   * Create a new feature row with the column types and values
   * @param  {Array} columnTypes column types
   * @param  {Array} values      values
   * @return {FeatureRow}             feature row
   */
  newRow(columnTypes?: { [key: string]: DataTypes }, values?: Record<string, DBValue>): FeatureRow {
    return new FeatureRow(this.getFeatureTable(), columnTypes, values);
  }
  /**
   * Get the geometry column name
   * @return {string} the geometry column name
   */
  getGeometryColumnName(): string {
    return this.geometryColumns.column_name;
  }
  /**
   * Get the geometry types
   * @return {Number} well known binary geometry type
   */
  //TODO is this a string?
  get geometryType(): string {
    return this.geometryColumns.geometryType;
  }
  get srs(): SpatialReferenceSystem {
    return this.geoPackage.geometryColumnsDao.getSrs(this.geometryColumns);
  }
  /**
   * Determine if the feature table is indexed
   * @returns {Boolean} indexed status of the table
   */
  isIndexed(): boolean {
    return this.featureTableIndex.isIndexed();
  }
  async index(progress?: Function): Promise<boolean> {
    return this.featureTableIndex.index(progress);
  }
  /**
   * Query for count in bounding box
   * @param boundingBox
   * @returns {Number}
   */
  countWebMercatorBoundingBox(boundingBox: BoundingBox): number {
    return this.featureTableIndex.countWithBoundingBox(boundingBox, 'EPSG:3857');
  }
  /**
   * Query for count in bounding box
   * @param boundingBox
   * @param projection
   * @returns {Number}}
   */
  countInBoundingBox(boundingBox: BoundingBox, projection?: string): number {
    return this.featureTableIndex.countWithBoundingBox(boundingBox, projection);
  }
  /**
   * Fast query web mercator bounding box
   * @param {BoundingBox} boundingBox bounding box to query for
   * @returns {any}
   */
  fastQueryWebMercatorBoundingBox(boundingBox: BoundingBox): IterableIterator<FeatureRow> {
    const iterator = this.featureTableIndex.queryWithBoundingBox(boundingBox, 'EPSG:3857');
    return {
      [Symbol.iterator](): IterableIterator<FeatureRow> {
        return this;
      },
      next: (): IteratorResult<FeatureRow, any> => {
        const nextRow = iterator.next();
        if (!nextRow.done) {
          const featureRow = this.getRow(nextRow.value) as FeatureRow;
          return {
            value: featureRow,
            done: false,
          };
        } else {
          return {
            value: undefined,
            done: true,
          };
        }
      },
    };
  }
  queryIndexedFeaturesWithWebMercatorBoundingBox(boundingBox: BoundingBox): IterableIterator<FeatureRow> {
    const srs = this.srs;
    const projection = this.projection;
    const iterator = this.featureTableIndex.queryWithBoundingBox(boundingBox, 'EPSG:3857');
    const thisGetRow = this.getRow.bind(this);
    const projectedBoundingBox = boundingBox.projectBoundingBox('EPSG:3857', 'EPSG:4326');
    return {
      [Symbol.iterator](): IterableIterator<FeatureRow> {
        return this;
      },
      next: (): IteratorResult<FeatureRow, any> => {
        let nextRow = iterator.next();
        if (!nextRow.done) {
          let featureRow: FeatureRow;
          let geometry;
          while (!nextRow.done && !geometry) {
            featureRow = thisGetRow(nextRow.value);
            try {
              const reporjectedGeometry = FeatureDao.reprojectFeature(featureRow, srs, projection);
              geometry = FeatureDao.verifyFeature(reporjectedGeometry, projectedBoundingBox);
            } catch (e) {
              console.log('Error parsing Geometry', e);
            }
            if (geometry) {
              geometry.properties = featureRow.values;
              return {
                value: featureRow,
                done: false,
              };
            } else {
              nextRow = iterator.next();
            }
          }
        }
        return {
          done: true,
          value: undefined,
        };
      },
    };
  }
  fastQueryBoundingBox(boundingBox: BoundingBox, projection?: string): IterableIterator<FeatureRow> {
    const iterator = this.featureTableIndex.queryWithBoundingBox(boundingBox, projection);
    const thisgetRow = this.getRow.bind(this);

    return {
      [Symbol.iterator](): IterableIterator<FeatureRow> {
        return this;
      },
      next: (): IteratorResult<FeatureRow> => {
        const nextRow = iterator.next();
        if (!nextRow.done) {
          const featureRow = thisgetRow(nextRow.value);

          return {
            value: featureRow,
            done: false,
          };
        } else {
          return {
            done: true,
            value: undefined,
          };
        }
      },
    };
  }

  queryIndexedFeaturesWithBoundingBox(boundingBox: BoundingBox): IterableIterator<FeatureRow> {
    const srs = this.srs;
    const projection = this.projection;

    const iterator = this.featureTableIndex.queryWithBoundingBox(boundingBox, projection);
    const thisgetRow = this.getRow.bind(this);
    const projectedBoundingBox = boundingBox.projectBoundingBox(projection, this.projection);
    return {
      [Symbol.iterator](): IterableIterator<FeatureRow> {
        return this;
      },
      next: (): IteratorResult<FeatureRow> => {
        let nextRow = iterator.next();
        if (!nextRow.done) {
          let featureRow;
          let geometry;

          while (!nextRow.done && !geometry) {
            featureRow = thisgetRow(nextRow.value);
            try {
              const reporjectedGeometry = FeatureDao.reprojectFeature(featureRow, srs, projection);
              geometry = FeatureDao.verifyFeature(reporjectedGeometry, projectedBoundingBox);
            } catch (e) {
              console.log('Error parsing Geometry', e);
            }
            if (geometry) {
              geometry.properties = featureRow.values;
              return {
                value: featureRow,
                done: false,
              };
            } else {
              nextRow = iterator.next();
            }
          }
        }
        return {
          done: true,
          value: undefined,
        };
      },
    };
  }

  /**
   * Calls geoJSONFeatureCallback with the geoJSON of each matched feature (always in 4326 projection)
   * @param  {BoundingBox} boundingBox        4326 bounding box to query
   * @param {Boolean} [skipVerification] do not verify if the feature actually exists in the box
   * @returns {any}
   */
  queryForGeoJSONIndexedFeaturesWithBoundingBox(
    boundingBox: BoundingBox,
    skipVerification = false,
  ): IterableIterator<Feature> & { srs: SpatialReferenceSystem; featureDao: FeatureDao<FeatureRow> } {
    const columns = [] as {
      index: number;
      name: string;
      max?: number;
      min?: number;
      notNull?: boolean;
      primaryKey?: boolean;
      dataType: string;
      displayName: string;
      dataColumn: DataColumns;
    }[];
    const columnMap: Record<
      string,
      {
        index: number;
        name: string;
        max?: number;
        min?: number;
        notNull?: boolean;
        primaryKey?: boolean;
        dataType: string;
        displayName: string;
        dataColumn: DataColumns;
      }
    > = {};
    const srs = this.srs;
    const projection = this.projection;
    this.table.columns.forEach(column => {
      const dataColumn = this.dataColumnsDao.getDataColumns(this.table.table_name, column.name);
      columns.push({
        index: column.index,
        name: column.name,
        max: column.max,
        min: column.min,
        notNull: column.notNull,
        primaryKey: column.primaryKey,
        dataType: column.dataType ? DataTypes.nameFromType(column.dataType) : '',
        displayName: dataColumn && dataColumn.name ? dataColumn.name : column.name,
        dataColumn: dataColumn,
      });
      columnMap[column.name] = columns[columns.length - 1];
    });
    let iterator: IterableIterator<any>;
    if (boundingBox) {
      iterator = this.featureTableIndex.queryWithBoundingBox(boundingBox, 'EPSG:4326')[Symbol.iterator]();
    } else {
      iterator = this.queryForEach();
    }
    return {
      srs: srs,
      featureDao: this,
      [Symbol.iterator](): IterableIterator<Feature> {
        return this;
      },
      // eslint-disable-next-line complexity
      next: (): IteratorResult<Feature> => {
        let nextRow = iterator.next();
        if (!nextRow.done) {
          let featureRow: FeatureRow;
          let geometry: GeoJsonObject;
          while (!nextRow.done && !geometry) {
            featureRow = this.getRow(nextRow.value) as FeatureRow;
            try {
              geometry = FeatureDao.reprojectFeature(featureRow, srs, projection);
              if (!skipVerification && boundingBox) {
                geometry = FeatureDao.verifyFeature(geometry, boundingBox);
              }
            } catch (e) {
              console.log('Error parsing Geometry', e);
            }
            if (geometry) {
              const geoJson = {
                id: undefined,
                properties: {},
                geometry: geometry,
              } as Feature;
              for (const key in featureRow.values) {
                if (
                  Object.prototype.hasOwnProperty.call(featureRow.values, key) &&
                  key !== featureRow.geometryColumn.name &&
                  key !== 'id'
                ) {
                  if (key.toLowerCase() === '_feature_id') {
                    geoJson.id = featureRow.values[key] as string | number;
                  } else if (key.toLowerCase() === '_properties_id') {
                    geoJson.properties[key.substring(12)] = featureRow.values[key];
                  } else {
                    geoJson.properties[columnMap[key].displayName] = featureRow.values[key];
                  }
                }
              }
              geoJson.id = geoJson.id || featureRow.id;
              return {
                value: geoJson,
                done: false,
              };
            } else {
              nextRow = iterator.next();
            }
          }
        }
        return {
          done: true,
          value: undefined,
        };
      },
    };
  }
  getBoundingBox(): BoundingBox {
    const contents = this.getContents();
    return new BoundingBox(contents.min_x, contents.max_x, contents.min_y, contents.max_y);
  }

  static reprojectFeature(
    featureRow: FeatureRow,
    srs: SpatialReferenceSystem,
    projection: proj4.Converter | string,
  ): GeoJsonObject {
    let geometry = featureRow.geometry.toGeoJSON();
    if (srs.organization + ':' + srs.organization_coordsys_id !== 'EPSG:4326') {
      geometry = reproject.reproject(geometry, projection, 'EPSG:4326');
    }
    return geometry;
  }

  static verifyFeature(geometry: any, boundingBox: BoundingBox): Feature {
    try {
      if (geometry.type === 'Point') {
        return geometry;
      } else if (geometry.type === 'LineString') {
        return FeatureDao.verifyLineString(geometry, boundingBox);
      } else if (geometry.type === 'Polygon') {
        return FeatureDao.verifyPolygon(geometry, boundingBox);
      } else if (geometry.type === 'MultiLineString') {
        return FeatureDao.verifyLineString(geometry, boundingBox);
      } else if (geometry.type === 'MultiPolygon') {
        return FeatureDao.verifyPolygon(geometry, boundingBox);
      }
    } catch (e) {
      return undefined;
    }
  }

  static verifyLineString(geometry: any, boundingBox: BoundingBox): Feature {
    const intersect = LineIntersect(geometry, boundingBox.toGeoJSON().geometry);
    if (intersect.features.length) {
      return geometry;
    } else if (BooleanWithin(geometry, boundingBox.toGeoJSON().geometry)) {
      return geometry;
    }
  }

  static verifyPolygon(geometry: any, boundingBox: BoundingBox): Feature {
    const polyIntersect = Intersect(geometry, boundingBox.toGeoJSON().geometry);
    if (polyIntersect) {
      return geometry;
    } else if (BooleanWithin(geometry, boundingBox.toGeoJSON().geometry)) {
      return geometry;
    }
  }
}
