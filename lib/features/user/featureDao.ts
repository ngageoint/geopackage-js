/**
 * featureDao module.
 * @module features/user/featureDao
 */
import reproject from 'reproject';
import LineIntersect from '@turf/line-intersect';
import Intersect from '@turf/intersect';
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
import { ColumnValues } from '../../dao/columnValues';

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
  constructor(
    geoPackage: GeoPackage,
    public table: FeatureTable,
    public geometryColumns: GeometryColumns,
    public metadataDao: MetadataDao,
  ) {
    super(geoPackage, table);
    this.dataColumnsDao = new DataColumnsDao(geoPackage);
    this.featureTableIndex = new FeatureTableIndex(geoPackage, this);
    const dao = geoPackage.getGeometryColumnsDao();
    if (!dao.getContents(geometryColumns)) {
      throw new Error('Geometry Columns ' + geometryColumns.getId() + ' has null Contents');
    }
    if (!dao.getSrs(geometryColumns)) {
      throw new Error('Geometry Columns ' + geometryColumns.getId() + ' has null Spatial Reference System');
    }
    this.projection = dao.getProjection(geometryColumns);
  }
  createObject(results: any): FeatureRow {
    if (results) {
      return this.getRow(results) as FeatureRow;
    }
    return this.newRow();
  }
  getRow(results: any): FeatureRow {
    return super.getRow(results) as FeatureRow;
  }
  getContents(): Contents {
    const dao = this.geoPackage.getGeometryColumnsDao();
    return dao.getContents(this.geometryColumns);
  }
  /**
   * Get the feature table
   * @return {FeatureTable} the feature table
   */
  getFeatureTable(): FeatureTable {
    return this.table;
  }
  getTable(): FeatureTable {
    return this.table;
  }
  /**
   * Create a new feature row with the column types and values
   * @param  {Array} columnTypes column types
   * @param  {Array} values      values
   * @return {FeatureRow}             feature row
   */
  newRowWithColumnTypes(columnTypes: { [key: string]: DataTypes }, values: ColumnValues[]): FeatureRow {
    return new FeatureRow(this.getFeatureTable(), columnTypes, values);
  }
  /**
   * Create a new feature row
   * @return {FeatureRow} feature row
   */
  newRow(): FeatureRow {
    return new FeatureRow(this.getFeatureTable());
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
  getGeometryType(): string {
    return this.geometryColumns.getGeometryType();
  }
  getSrs(): SpatialReferenceSystem {
    return this.geoPackage.getGeometryColumnsDao().getSrs(this.geometryColumns);
  }
  /**
   * Determine if the feature table is indexed
   * @returns {Boolean} indexed status of the table
   */
  isIndexed(): boolean {
    return this.featureTableIndex.isIndexed();
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
    const srs = this.getSrs();
    const projection = this.projection;
    const iterator = this.featureTableIndex.queryWithBoundingBox(boundingBox, 'EPSG:3857');
    const thisgetRow = this.getRow.bind(this);
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
            featureRow = thisgetRow(nextRow.value);
            geometry = FeatureDao.reprojectFeature(featureRow, srs, projection);
            geometry = FeatureDao.verifyFeature(geometry, projectedBoundingBox);
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
    const srs = this.getSrs();
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
            geometry = FeatureDao.reprojectFeature(featureRow, srs, projection);
            geometry = FeatureDao.verifyFeature(geometry, projectedBoundingBox);
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
  ): IterableIterator<Feature> {
    const columns = [];
    const columnMap = {};
    const srs = this.getSrs();
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
    const iterator = this.featureTableIndex.queryWithBoundingBox(boundingBox, 'EPSG:4326')[Symbol.iterator]();
    return {
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
            geometry = FeatureDao.reprojectFeature(featureRow, srs, projection);
            if (!skipVerification) {
              geometry = FeatureDao.verifyFeature(geometry, boundingBox);
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
                  key !== featureRow.getGeometryColumn().name &&
                  key !== 'id'
                ) {
                  if (key.toLowerCase() === '_feature_id') {
                    geoJson.id = featureRow.values[key];
                  } else if (key.toLowerCase() === '_properties_id') {
                    geoJson.properties[key.substring(12)] = featureRow.values[key];
                  } else {
                    geoJson.properties[columnMap[key].displayName] = featureRow.values[key];
                  }
                }
              }
              geoJson.id = geoJson.id || featureRow.getId();
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
    let geometry = featureRow.getGeometry().toGeoJSON();
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
